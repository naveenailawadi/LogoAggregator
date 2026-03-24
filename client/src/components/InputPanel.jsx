import { useState, useRef } from "react";

export default function InputPanel({ onFetch, isFetching }) {
  const [text, setText] = useState("");
  const fileRef = useRef(null);

  const parseDomains = (raw) =>
    raw
      .split(/[\n,;]+/)
      .map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, ""))
      .filter(Boolean);

  const handleFetch = () => {
    const domains = parseDomains(text);
    if (domains.length > 0) onFetch(domains);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleFetch();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/logos/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (data.domains) {
        setText(data.domains.join("\n"));
      }
    } catch {
      // fallback: read file client-side
      const reader = new FileReader();
      reader.onload = (ev) => {
        const content = ev.target.result;
        const domains = parseDomains(content);
        setText(domains.join("\n"));
      };
      reader.readAsText(file);
    }

    // Reset file input so same file can be re-uploaded
    e.target.value = "";
  };

  const domainCount = parseDomains(text).length;

  return (
    <div className="panel input-panel">
      <div className="panel-header">
        <h2 className="panel-title">Domains</h2>
        <button
          className="btn-secondary btn-sm"
          onClick={() => fileRef.current?.click()}
          disabled={isFetching}
          title="Upload CSV or TXT file"
        >
          Upload file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt"
          style={{ display: "none" }}
          onChange={handleFileUpload}
        />
      </div>

      <textarea
        className="domain-input"
        placeholder={"fortifiedhealthsecurity.com\nclearwatercompliance.com\nimprivata.com\n..."}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={isFetching}
        rows={12}
        spellCheck={false}
      />

      <div className="input-footer">
        <span className="domain-count">
          {domainCount > 0 ? `${domainCount} domain${domainCount !== 1 ? "s" : ""}` : ""}
        </span>
        <button
          className="btn-primary"
          onClick={handleFetch}
          disabled={isFetching || domainCount === 0}
        >
          {isFetching ? "Fetching..." : "Fetch Logos"}
        </button>
      </div>

      <p className="hint">Tip: Ctrl+Enter to fetch · One domain per line or comma-separated</p>
    </div>
  );
}
