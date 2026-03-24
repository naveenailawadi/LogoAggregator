import { useState, useCallback } from "react";
import InputPanel from "./components/InputPanel.jsx";
import LogoGrid from "./components/LogoGrid.jsx";
import ExportSettings from "./components/ExportSettings.jsx";
import ProgressBar from "./components/ProgressBar.jsx";

export default function App() {
  const [logos, setLogos] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [exportSettings, setExportSettings] = useState({
    logosPerRow: 4,
    showNames: true,
    logoSize: "medium",
    slideTitle: "",
    backgroundColor: "#ffffff",
  });
  const [isExporting, setIsExporting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFetch = useCallback(async (domains) => {
    setIsFetching(true);
    setLogos([]);
    setErrorMsg("");
    setProgress({ completed: 0, total: domains.length });

    try {
      const response = await fetch("/api/logos/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domains }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Fetch failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
          if (line.startsWith("event: ")) {
            // skip event type line, handled with data
          } else if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.completed !== undefined) {
                setProgress({ completed: data.completed, total: data.total });
              }
              if (data.results) {
                // Add selected:true to each logo
                const logoItems = data.results.map((r, i) => ({
                  ...r,
                  id: `${r.domain}-${i}`,
                  selected: r.status !== "failed",
                }));
                setLogos(logoItems);
              }
            } catch {
              // ignore parse errors in SSE stream
            }
          }
        }
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsFetching(false);
    }
  }, []);

  const handleExport = useCallback(async () => {
    const selectedLogos = logos.filter((l) => l.selected);
    if (selectedLogos.length === 0) {
      setErrorMsg("No logos selected for export.");
      return;
    }

    setIsExporting(true);
    setErrorMsg("");

    try {
      const response = await fetch("/api/export/pptx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logos: selectedLogos, settings: exportSettings }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logo-overview-${Date.now()}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setIsExporting(false);
    }
  }, [logos, exportSettings]);

  const selectedCount = logos.filter((l) => l.selected).length;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <h1 className="app-title">Logo Aggregator</h1>
          <p className="app-subtitle">Fetch logos · Review · Export PPTX</p>
        </div>
      </header>

      <main className="app-main">
        <div className="left-panel">
          <InputPanel onFetch={handleFetch} isFetching={isFetching} />

          {logos.length > 0 && (
            <ExportSettings
              settings={exportSettings}
              onChange={setExportSettings}
              onExport={handleExport}
              isExporting={isExporting}
              selectedCount={selectedCount}
            />
          )}
        </div>

        <div className="right-panel">
          {isFetching && progress.total > 0 && (
            <ProgressBar completed={progress.completed} total={progress.total} />
          )}

          {errorMsg && (
            <div className="error-banner">
              <span>⚠ {errorMsg}</span>
              <button onClick={() => setErrorMsg("")} className="error-close">×</button>
            </div>
          )}

          {logos.length > 0 && (
            <LogoGrid logos={logos} setLogos={setLogos} />
          )}

          {!isFetching && logos.length === 0 && !errorMsg && (
            <div className="empty-state">
              <div className="empty-icon">⬡</div>
              <p>Paste domains on the left and click <strong>Fetch Logos</strong></p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
