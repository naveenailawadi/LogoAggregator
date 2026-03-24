const PptxGenJS = require("pptxgenjs");

/**
 * Build and return a PPTX buffer from the provided logos and settings.
 *
 * @param {Array} logos - Array of logo objects with { displayName, base64, domain, status }
 * @param {Object} settings - Export settings from the client
 * @returns {Buffer} - PPTX file as a Buffer
 */
async function buildPptx(logos, settings) {
  const {
    logosPerRow = 4,
    showNames = true,
    logoSize = "medium",
    slideTitle = "",
    backgroundColor = "#ffffff",
  } = settings;

  const pptx = new PptxGenJS();

  // Slide dimensions (widescreen 16:9)
  pptx.defineLayout({ name: "WIDESCREEN", width: 13.33, height: 7.5 });
  pptx.layout = "WIDESCREEN";

  // Layout constants (all in inches)
  const SLIDE_W = 13.33;
  const SLIDE_H = 7.5;
  const MARGIN = 0.5;
  const TITLE_H = slideTitle ? 0.6 : 0;
  const NAME_H = showNames ? 0.35 : 0;
  const FOOTER_H = 0.1;

  // Logo size presets (width of each logo bounding box)
  const logoSizeMap = {
    small: 0.9,
    medium: 1.2,
    large: 1.6,
  };
  const logoBoxW = logoSizeMap[logoSize] || 1.2;
  const logoBoxH = logoBoxW * 0.6; // maintain reasonable aspect ratio

  // Cell dimensions
  const cellW = (SLIDE_W - MARGIN * 2) / logosPerRow;
  const cellH = logoBoxH + NAME_H + 0.3; // padding above/below logo

  // Available height for logo rows
  const availableH = SLIDE_H - MARGIN * 2 - TITLE_H - FOOTER_H;
  const logosPerPage = Math.floor(availableH / cellH) * logosPerRow;

  // Split logos into pages
  const pages = [];
  for (let i = 0; i < logos.length; i += logosPerPage) {
    pages.push(logos.slice(i, i + logosPerPage));
  }

  if (pages.length === 0) pages.push([]);

  for (const pageLogos of pages) {
    const slide = pptx.addSlide();

    // Background
    slide.background = { color: backgroundColor.replace("#", "") };

    // Slide title
    if (slideTitle) {
      slide.addText(slideTitle, {
        x: MARGIN,
        y: MARGIN,
        w: SLIDE_W - MARGIN * 2,
        h: TITLE_H,
        fontSize: 18,
        bold: true,
        fontFace: "Arial",
        color: "222222",
        valign: "middle",
      });
    }

    const gridStartY = MARGIN + TITLE_H;

    for (let idx = 0; idx < pageLogos.length; idx++) {
      const logo = pageLogos[idx];
      const col = idx % logosPerRow;
      const row = Math.floor(idx / logosPerRow);

      const cellX = MARGIN + col * cellW;
      const cellY = gridStartY + row * cellH;

      // Center logo within cell horizontally
      const logoX = cellX + (cellW - logoBoxW) / 2;
      const logoY = cellY + 0.15; // padding from top of cell

      if (logo.base64 && logo.status !== "failed") {
        try {
          // Extract mime type from base64 data URL
          const mimeMatch = logo.base64.match(/^data:([^;]+);base64,(.+)$/);
          if (mimeMatch) {
            const mimeType = mimeMatch[1];
            const imageData = mimeMatch[2];

            // Map mime type to pptxgenjs extension
            const extMap = {
              "image/png": "png",
              "image/jpeg": "jpg",
              "image/jpg": "jpg",
              "image/svg+xml": "svg",
              "image/webp": "png", // pptxgenjs doesn't support webp natively, use png label (often works)
              "image/gif": "gif",
              "image/x-icon": "png",
              "image/vnd.microsoft.icon": "png",
            };
            const ext = extMap[mimeType] || "png";

            slide.addImage({
              data: `${mimeType};base64,${imageData}`,
              x: logoX,
              y: logoY,
              w: logoBoxW,
              h: logoBoxH,
              sizing: { type: "contain", w: logoBoxW, h: logoBoxH },
            });
          }
        } catch (err) {
          // If image insertion fails, show placeholder text
          slide.addText("?", {
            x: logoX,
            y: logoY,
            w: logoBoxW,
            h: logoBoxH,
            fontSize: 24,
            color: "cccccc",
            align: "center",
            valign: "middle",
          });
        }
      } else {
        // Failed logo placeholder
        slide.addShape(pptx.ShapeType.rect, {
          x: logoX,
          y: logoY,
          w: logoBoxW,
          h: logoBoxH,
          fill: { color: "f5f5f5" },
          line: { color: "dddddd", width: 1 },
        });
        slide.addText("No Logo", {
          x: logoX,
          y: logoY,
          w: logoBoxW,
          h: logoBoxH,
          fontSize: 8,
          color: "aaaaaa",
          align: "center",
          valign: "middle",
          fontFace: "Arial",
        });
      }

      // Company name label
      if (showNames) {
        const displayName = logo.displayName || logo.domain || "";
        slide.addText(displayName, {
          x: cellX,
          y: logoY + logoBoxH + 0.04,
          w: cellW,
          h: NAME_H,
          fontSize: 9,
          fontFace: "Arial",
          color: "444444",
          align: "center",
          valign: "top",
          wrap: true,
        });
      }
    }
  }

  // Generate as buffer
  const buffer = await pptx.write({ outputType: "nodebuffer" });
  return buffer;
}

module.exports = { buildPptx };
