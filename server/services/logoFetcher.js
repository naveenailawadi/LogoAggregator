const axios = require("axios");

const BRANDFETCH_API_KEY = process.env.BRANDFETCH_API_KEY || "";
const TIMEOUT_MS = 8000;

/**
 * Attempt to fetch logo URL via Brandfetch CDN (no auth required for basic use).
 * Returns the URL if the request returns a valid image, otherwise null.
 */
async function tryBrandfetchCDN(domain) {
  const url = `https://cdn.brandfetch.io/${domain}`;
  try {
    const res = await axios.get(url, {
      timeout: TIMEOUT_MS,
      responseType: "arraybuffer",
      maxRedirects: 5,
      validateStatus: (s) => s < 400,
    });
    const contentType = res.headers["content-type"] || "";
    if (
      contentType.startsWith("image/") ||
      contentType.startsWith("application/svg")
    ) {
      const base64 = Buffer.from(res.data).toString("base64");
      const mimeType = contentType.split(";")[0].trim();
      return { url, base64: `data:${mimeType};base64,${base64}`, source: "brandfetch-cdn" };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Attempt to fetch logo via Brandfetch REST API (requires API key).
 * Prefers SVG > PNG, and "logo" type over "icon".
 */
async function tryBrandfetchAPI(domain) {
  if (!BRANDFETCH_API_KEY) return null;
  const url = `https://api.brandfetch.io/v2/brands/${domain}`;
  try {
    const res = await axios.get(url, {
      timeout: TIMEOUT_MS,
      headers: { Authorization: `Bearer ${BRANDFETCH_API_KEY}` },
      validateStatus: (s) => s < 400,
    });
    const data = res.data;
    if (!data || !data.logos || !data.logos.length) return null;

    // Prefer type "logo" over "icon", prefer SVG > PNG > other
    const formatPriority = ["svg", "png", "jpeg", "jpg", "webp"];
    const typePriority = ["logo", "symbol", "icon"];

    let best = null;
    let bestScore = -1;

    for (const logoEntry of data.logos) {
      const typeScore = typePriority.indexOf(logoEntry.type);
      if (typeScore === -1) continue;
      for (const format of logoEntry.formats || []) {
        const fmtScore = formatPriority.indexOf(
          (format.format || "").toLowerCase()
        );
        if (fmtScore === -1) continue;
        const score =
          (typePriority.length - typeScore) * 100 +
          (formatPriority.length - fmtScore);
        if (score > bestScore && format.src) {
          bestScore = score;
          best = format.src;
        }
      }
    }

    if (!best) return null;

    // Download the image
    const imgRes = await axios.get(best, {
      timeout: TIMEOUT_MS,
      responseType: "arraybuffer",
      validateStatus: (s) => s < 400,
    });
    const contentType = imgRes.headers["content-type"] || "image/png";
    const mimeType = contentType.split(";")[0].trim();
    const base64 = Buffer.from(imgRes.data).toString("base64");
    return {
      url: best,
      base64: `data:${mimeType};base64,${base64}`,
      source: "brandfetch-api",
    };
  } catch {
    return null;
  }
}

/**
 * Clearbit Logo API
 */
async function tryClearbit(domain) {
  const url = `https://logo.clearbit.com/${domain}`;
  try {
    const res = await axios.get(url, {
      timeout: TIMEOUT_MS,
      responseType: "arraybuffer",
      validateStatus: (s) => s < 400,
    });
    const contentType = res.headers["content-type"] || "";
    if (!contentType.startsWith("image/")) return null;
    const mimeType = contentType.split(";")[0].trim();
    const base64 = Buffer.from(res.data).toString("base64");
    return {
      url,
      base64: `data:${mimeType};base64,${base64}`,
      source: "clearbit",
    };
  } catch {
    return null;
  }
}

/**
 * Google Favicon (last resort — low quality but always works)
 */
async function tryGoogleFavicon(domain) {
  const url = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  try {
    const res = await axios.get(url, {
      timeout: TIMEOUT_MS,
      responseType: "arraybuffer",
      validateStatus: (s) => s < 400,
    });
    const contentType = res.headers["content-type"] || "image/png";
    const mimeType = contentType.split(";")[0].trim();
    const base64 = Buffer.from(res.data).toString("base64");
    return {
      url,
      base64: `data:${mimeType};base64,${base64}`,
      source: "google-favicon",
    };
  } catch {
    return null;
  }
}

/**
 * Fetch logo for a single domain using the fallback chain.
 * Returns a result object.
 */
async function fetchLogo(domain) {
  const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

  if (!cleanDomain) {
    return { domain, displayName: domain, logoUrl: null, base64: null, source: null, status: "failed" };
  }

  const strategies = [
    () => tryBrandfetchCDN(cleanDomain),
    () => tryBrandfetchAPI(cleanDomain),
    () => tryClearbit(cleanDomain),
    () => tryGoogleFavicon(cleanDomain),
  ];

  for (let i = 0; i < strategies.length; i++) {
    const result = await strategies[i]();
    if (result) {
      return {
        domain: cleanDomain,
        displayName: formatDisplayName(cleanDomain),
        logoUrl: result.url,
        base64: result.base64,
        source: result.source,
        status: i === 0 ? "success" : "fallback",
      };
    }
  }

  return {
    domain: cleanDomain,
    displayName: formatDisplayName(cleanDomain),
    logoUrl: null,
    base64: null,
    source: null,
    status: "failed",
  };
}

/**
 * Convert domain to a human-readable display name.
 * e.g., "fortifiedhealthsecurity.com" -> "Fortified Health Security"
 */
function formatDisplayName(domain) {
  const withoutTLD = domain.replace(/\.[^.]+$/, "");
  // Split on hyphens or camelCase boundaries
  return withoutTLD
    .replace(/-/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Fetch logos for a batch of domains concurrently (up to concurrency limit).
 * Calls onProgress(completed, total) after each item finishes.
 */
async function fetchLogos(domains, onProgress, concurrency = 8) {
  const results = [];
  let completed = 0;
  const total = domains.length;

  // Process in chunks
  for (let i = 0; i < domains.length; i += concurrency) {
    const chunk = domains.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(async (domain) => {
        const result = await fetchLogo(domain);
        completed++;
        if (onProgress) onProgress(completed, total);
        return result;
      })
    );
    results.push(...chunkResults);
  }

  return results;
}

module.exports = { fetchLogos, fetchLogo };
