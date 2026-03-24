const express = require("express");
const { buildPptx } = require("../services/pptxBuilder");

const router = express.Router();

/**
 * POST /api/export/pptx
 * Body: { logos: Array, settings: Object }
 * Returns: PPTX file as binary download
 */
router.post("/pptx", async (req, res) => {
  const { logos, settings } = req.body;

  if (!logos || !Array.isArray(logos)) {
    return res.status(400).json({ error: "logos array is required" });
  }

  try {
    const buffer = await buildPptx(logos, settings || {});

    const filename = `logo-overview-${Date.now()}.pptx`;
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.presentationml.presentation");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", buffer.length);
    res.send(buffer);
  } catch (err) {
    console.error("PPTX generation error:", err);
    res.status(500).json({ error: "Failed to generate PPTX: " + err.message });
  }
});

module.exports = router;
