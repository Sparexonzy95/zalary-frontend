import React from "react";
import type { AllocationInputRow } from "./types";

/* ── CSS injected once ── */
const CSV_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Mono:wght@400;700&display=swap');

/* ── csv uploader section ── */
.rd-csv-section-tag {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: rgba(47, 107, 255, 0.6);
  text-transform: uppercase;
  margin-bottom: 6px;
}
.rd-csv-section-title {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 16px;
  color: rgba(210, 222, 255, 0.92);
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}
.rd-csv-section-sub {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  color: rgba(210, 222, 255, 0.32);
  letter-spacing: 0.03em;
  line-height: 1.55;
  margin-bottom: 16px;
}

/* ── drop zone ── */
.rd-csv-drop {
  position: relative;
  border: 1px dashed rgba(47, 107, 255, 0.28);
  border-radius: 10px;
  background: rgba(47, 107, 255, 0.03);
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
  overflow: hidden;
}
.rd-csv-drop:hover,
.rd-csv-drop.drag-over {
  border-color: rgba(47, 107, 255, 0.55);
  background: rgba(47, 107, 255, 0.07);
}
.rd-csv-drop.has-file {
  border-color: rgba(26, 255, 140, 0.35);
  background: rgba(26, 255, 140, 0.04);
}

/* hidden file input covers entire drop zone */
.rd-csv-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  width: 100%;
  height: 100%;
}

/* upload icon */
.rd-csv-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(47, 107, 255, 0.1);
  border: 1px solid rgba(47, 107, 255, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.rd-csv-drop.has-file .rd-csv-icon {
  background: rgba(26, 255, 140, 0.09);
  border-color: rgba(26, 255, 140, 0.28);
}

.rd-csv-prompt {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 13px;
  color: rgba(210, 222, 255, 0.75);
  letter-spacing: -0.01em;
}
.rd-csv-prompt span {
  color: rgba(47, 107, 255, 0.9);
}
.rd-csv-hint {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: rgba(210, 222, 255, 0.25);
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

/* ── file selected state ── */
.rd-csv-file-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
  padding: 12px 16px;
  background: rgba(26, 255, 140, 0.05);
  border: 1px solid rgba(26, 255, 140, 0.2);
  border-radius: 8px;
}
.rd-csv-file-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(26, 255, 140, 0.9);
  box-shadow: 0 0 7px rgba(26, 255, 140, 0.6);
  flex-shrink: 0;
}
.rd-csv-file-name {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: rgba(26, 255, 140, 0.82);
  letter-spacing: 0.02em;
  word-break: break-all;
}

/* ── format hint card ── */
.rd-csv-format {
  margin-top: 14px;
  padding: 14px 16px;
  background: rgba(47, 107, 255, 0.04);
  border: 1px solid rgba(47, 107, 255, 0.12);
  border-radius: 8px;
}
.rd-csv-format-label {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.16em;
  color: rgba(47, 107, 255, 0.55);
  text-transform: uppercase;
  margin-bottom: 8px;
}
.rd-csv-format-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.rd-csv-col-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  background: rgba(47, 107, 255, 0.08);
  border: 1px solid rgba(47, 107, 255, 0.18);
  border-radius: 4px;
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: rgba(47, 107, 255, 0.75);
  letter-spacing: 0.08em;
}
.rd-csv-sep {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: rgba(210, 222, 255, 0.2);
  align-self: center;
}
`;

function useCsvStyles() {
  React.useEffect(() => {
    const id = "rd-csv-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = CSV_CSS;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

/* ── parse logic — identical to original ── */
function parseCsv(text: string): AllocationInputRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const header = lines[0].toLowerCase();
  const hasHeader = header.includes("wallet") && header.includes("amount");
  const start = hasHeader ? 1 : 0;
  const out: AllocationInputRow[] = [];

  for (let i = start; i < lines.length; i++) {
    const parts = lines[i].split(",").map((p) => p.trim());
    const walletAddress = parts[0] || "";
    const name = parts[1] || "";
    const amount = parts[2] || "";
    out.push({ walletAddress, name, amount });
  }

  return out;
}

type Props = { onParsed: (rows: AllocationInputRow[]) => void };

export default function CSVUploader({ onParsed }: Props) {
  useCsvStyles();

  const [fileName, setFileName] = React.useState("");
  const [dragOver, setDragOver] = React.useState(false);

  async function handleFile(file: File) {
    setFileName(file.name);
    const text = await file.text();
    onParsed(parseCsv(text));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      {/* section header */}
      <div className="rd-csv-section-tag">CSV Upload</div>
      <div className="rd-csv-section-title">Bulk Import</div>
      <div className="rd-csv-section-sub">
        Upload a CSV file to import multiple employees at once.
      </div>

      {/* drop zone */}
      <div
        className={`rd-csv-drop${fileName ? " has-file" : ""}${dragOver ? " drag-over" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        {/* hidden file input */}
        <input
          className="rd-csv-input"
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />

        {/* icon */}
        <div className="rd-csv-icon">
          {fileName ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="rgba(26,255,140,0.85)" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="rgba(47,107,255,0.75)" strokeWidth="1.8"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          )}
        </div>

        {/* prompt text */}
        <div className="rd-csv-prompt">
          {fileName
            ? <span style={{ color: "rgba(26,255,140,0.85)" }}>File loaded successfully</span>
            : <><span>Click to upload</span> or drag and drop</>
          }
        </div>
        <div className="rd-csv-hint">.csv files only</div>
      </div>

      {/* selected file info */}
      {fileName && (
        <div className="rd-csv-file-info">
          <span className="rd-csv-file-dot" />
          <span className="rd-csv-file-name">{fileName}</span>
        </div>
      )}

      {/* format reference */}
      <div className="rd-csv-format">
        <div className="rd-csv-format-label">Expected column order</div>
        <div className="rd-csv-format-row">
          <span className="rd-csv-col-badge">wallet_address</span>
          <span className="rd-csv-sep">,</span>
          <span className="rd-csv-col-badge">name</span>
          <span className="rd-csv-sep">,</span>
          <span className="rd-csv-col-badge">amount</span>
        </div>
      </div>
    </div>
  );
}