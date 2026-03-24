const express = require("express");
const multer = require("multer");
const { fetchLogos } = require("../services/logoFetcher");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

/**
 * POST /api/logos/fetch
 * Body: { domains: string[] }
 * Returns: Server-Sent Events stream of progress + results
 */
router.post("/fetch", async (req, res) => {
  const { domains } = req.body;

  if (!domains || !Array.isArray(domains) || domains.length === 0) {
    return res.status(400).json({ error: "domains array is required" });
  }

  // Filter empty strings and deduplicate
  const cleanDomains = [...new Set(domains.map((d) => d.trim()).filter(Boolean))];

  if (cleanDomains.length === 0) {
    return res.status(400).json({ error: "No valid domains provided" });
  }

  // Use SSE for streaming progress
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (type, data) => {
    res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  sendEvent("start", { total: cleanDomains.length });

  const results = await fetchLogos(
    cleanDomains,
    (completed, total) => {
      sendEvent("progress", { completed, total });
    },
    8
  );

  sendEvent("complete", { results });
  res.end();
});

/**
 * POST /api/logos/upload
 * Accepts a CSV or TXT file, extracts domains, and returns them.
 */
router.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const content = req.file.buffer.toString("utf8");
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  // If first line looks like a header with "domain" column, try to parse as CSV
  const domains = [];
  let domainColIdx = -1;

  // Check if it's a CSV with headers
  const firstLine = lines[0].toLowerCase();
  if (firstLine.includes(",")) {
    const headers = firstLine.split(",").map((h) => h.replace(/"/g, "").trim());
    domainColIdx = headers.findIndex((h) => h.includes("domain") || h.includes("url") || h.includes("website"));

    const startIdx = domainColIdx >= 0 ? 1 : 0;
    for (let i = startIdx; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.replace(/"/g, "").trim());
      const val = domainColIdx >= 0 ? cols[domainColIdx] : cols[0];
      if (val) domains.push(val);
    }
  } else {
    // Plain text, one domain per line
    domains.push(...lines);
  }

  // Clean up domains
  const cleanDomains = [...new Set(
    domains
      .map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
      .filter(Boolean)
  )];

  res.json({ domains: cleanDomains });
});

module.exports = router;
