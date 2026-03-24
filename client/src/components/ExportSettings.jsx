export default function ExportSettings({
  settings,
  onChange,
  onExport,
  isExporting,
  selectedCount,
}) {
  const set = (key, value) => onChange((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="panel export-panel">
      <div className="panel-header">
        <h2 className="panel-title">Export Settings</h2>
      </div>

      <div className="settings-grid">
        <label className="setting-row">
          <span className="setting-label">Logos per row</span>
          <select
            className="setting-select"
            value={settings.logosPerRow}
            onChange={(e) => set("logosPerRow", Number(e.target.value))}
          >
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
            <option value={6}>6</option>
          </select>
        </label>

        <label className="setting-row">
          <span className="setting-label">Logo size</span>
          <select
            className="setting-select"
            value={settings.logoSize}
            onChange={(e) => set("logoSize", e.target.value)}
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </label>

        <label className="setting-row">
          <span className="setting-label">Show company names</span>
          <input
            type="checkbox"
            className="setting-checkbox"
            checked={settings.showNames}
            onChange={(e) => set("showNames", e.target.checked)}
          />
        </label>

        <label className="setting-row">
          <span className="setting-label">Slide title</span>
          <input
            type="text"
            className="setting-input"
            placeholder="e.g. Healthcare Cyber Landscape"
            value={settings.slideTitle}
            onChange={(e) => set("slideTitle", e.target.value)}
          />
        </label>

        <label className="setting-row">
          <span className="setting-label">Background color</span>
          <div className="color-row">
            <input
              type="color"
              className="setting-color"
              value={settings.backgroundColor}
              onChange={(e) => set("backgroundColor", e.target.value)}
            />
            <input
              type="text"
              className="setting-input setting-input--hex"
              value={settings.backgroundColor}
              onChange={(e) => {
                const val = e.target.value;
                if (/^#[0-9a-fA-F]{0,6}$/.test(val)) set("backgroundColor", val);
              }}
              maxLength={7}
            />
          </div>
        </label>
      </div>

      <button
        className="btn-primary btn-export"
        onClick={onExport}
        disabled={isExporting || selectedCount === 0}
      >
        {isExporting
          ? "Generating..."
          : `Export PPTX (${selectedCount} logo${selectedCount !== 1 ? "s" : ""})`}
      </button>
    </div>
  );
}
