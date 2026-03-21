import React from "react";
import type { AllocationInputRow } from "./types";
import { isValidAddress } from "./amounts";

/* ── CSS injected once ── */
const TABLE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Mono:wght@400;700&display=swap');

/* ── section label ── */
.rd-tbl-section {
  margin-bottom: 20px;
}
.rd-tbl-section-tag {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: rgba(47, 107, 255, 0.6);
  text-transform: uppercase;
  margin-bottom: 6px;
}
.rd-tbl-section-title {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 16px;
  color: rgba(210, 222, 255, 0.92);
  letter-spacing: -0.02em;
  margin-bottom: 4px;
}
.rd-tbl-section-sub {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  color: rgba(210, 222, 255, 0.32);
  letter-spacing: 0.03em;
  line-height: 1.55;
}

/* ── table wrap ── */
.rd-table-wrap {
  width: 100%;
  overflow-x: auto;
  border: 1px solid rgba(47, 107, 255, 0.13);
  border-radius: 10px;
  margin-bottom: 14px;
}

/* ── table ── */
.rd-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
}

.rd-table thead tr {
  border-bottom: 1px solid rgba(47, 107, 255, 0.13);
  background: rgba(47, 107, 255, 0.04);
}

.rd-table th {
  padding: 11px 14px;
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: rgba(210, 222, 255, 0.3);
  text-transform: uppercase;
  text-align: left;
  white-space: nowrap;
}

.rd-table tbody tr {
  border-bottom: 1px solid rgba(47, 107, 255, 0.07);
  transition: background 0.15s;
}
.rd-table tbody tr:last-child { border-bottom: none; }
.rd-table tbody tr:hover { background: rgba(47, 107, 255, 0.03); }

.rd-table td {
  padding: 10px 14px;
  vertical-align: middle;
}
.rd-table td.rd-td-right { text-align: right; }

/* empty state */
.rd-table-empty {
  padding: 28px 16px;
  text-align: center;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: rgba(210, 222, 255, 0.22);
  letter-spacing: 0.05em;
}

/* ── inputs inside table ── */
.rd-tbl-input {
  width: 100%;
  background: rgba(47, 107, 255, 0.05);
  border: 1px solid rgba(47, 107, 255, 0.15);
  border-radius: 6px;
  padding: 7px 10px;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: rgba(210, 222, 255, 0.88);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  min-width: 0;
}
.rd-tbl-input::placeholder { color: rgba(210, 222, 255, 0.2); }
.rd-tbl-input:focus {
  border-color: rgba(47, 107, 255, 0.5);
  box-shadow: 0 0 0 3px rgba(47, 107, 255, 0.08);
}
.rd-tbl-input:disabled {
  background: rgba(210, 222, 255, 0.03);
  border-color: rgba(210, 222, 255, 0.07);
  color: rgba(210, 222, 255, 0.28);
  cursor: not-allowed;
}
.rd-tbl-input.error {
  border-color: rgba(239, 68, 68, 0.45);
  background: rgba(239, 68, 68, 0.04);
}
.rd-tbl-input.error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
}

/* ── field error message ── */
.rd-field-err {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: rgba(252, 165, 165, 0.85);
  letter-spacing: 0.04em;
  margin-top: 4px;
  line-height: 1.4;
}

/* ── remove row button ── */
.rd-btn-remove {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  background: transparent;
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 5px;
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(252, 165, 165, 0.55);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.rd-btn-remove:hover {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.4);
  color: rgba(252, 165, 165, 0.85);
}

/* ── add row button ── */
.rd-btn-add-row {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  background: rgba(47, 107, 255, 0.85);
  border: 1px solid rgba(47, 107, 255, 1);
  border-radius: 7px;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(210, 222, 255, 0.97);
  cursor: pointer;
  transition: all 0.2s;
}
.rd-btn-add-row:hover {
  background: rgba(47, 107, 255, 1);
  box-shadow: 0 0 20px rgba(47, 107, 255, 0.28);
}

/* ── currency badge ── */
.rd-currency-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  background: rgba(47, 107, 255, 0.08);
  border: 1px solid rgba(47, 107, 255, 0.2);
  border-radius: 5px;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  color: rgba(47, 107, 255, 0.75);
  letter-spacing: 0.06em;
  white-space: nowrap;
}

/* row count badge */
.rd-row-count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: rgba(210, 222, 255, 0.28);
  letter-spacing: 0.1em;
  padding: 9px 0;
}
.rd-row-count-num {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 14px;
  color: rgba(47, 107, 255, 0.8);
}
`;

function useTableStyles() {
  React.useEffect(() => {
    const id = "rd-table-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = TABLE_CSS;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

export default function AllocationTable({
  rows,
  onChange,
  tokenLabel = "USDC",
}: {
  rows: AllocationInputRow[];
  onChange: (rows: AllocationInputRow[]) => void;
  tokenLabel?: string;
}) {
  useTableStyles();

  function updateRow(i: number, patch: Partial<AllocationInputRow>) {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange(next);
  }

  function addRow() {
    onChange([...rows, { walletAddress: "", name: "", amount: "" }]);
  }

  function removeRow(i: number) {
    onChange(rows.filter((_, idx) => idx !== i));
  }

  return (
    <div>
      {/* section header */}
      <div className="rd-tbl-section">
        <div className="rd-tbl-section-tag">Manual Entry</div>
        <div className="rd-tbl-section-title">Employee Allocations</div>
        <div className="rd-tbl-section-sub">
          Add employee wallet addresses and amounts for this payroll run.
        </div>
      </div>

      {/* table */}
      <div className="rd-table-wrap">
        <table className="rd-table">
          <thead>
            <tr>
              <th style={{ width: "36%" }}>Wallet Address</th>
              <th style={{ width: "22%" }}>Employee Name</th>
              <th style={{ width: "20%" }}>Amount</th>
              <th style={{ width: "10%" }}>Currency</th>
              <th style={{ width: "12%" }} />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <div className="rd-table-empty">
                    No employees added yet — click "Add Row" or upload a CSV below
                  </div>
                </td>
              </tr>
            ) : (
              rows.map((r, i) => {
                const addr = (r.walletAddress || "").trim();
                const addrOk = !addr || isValidAddress(addr);
                return (
                  <tr key={i}>
                    {/* wallet address */}
                    <td>
                      <input
                        className={`rd-tbl-input${!addrOk ? " error" : ""}`}
                        value={r.walletAddress}
                        placeholder="0x..."
                        onChange={(e) => updateRow(i, { walletAddress: e.target.value })}
                        spellCheck={false}
                      />
                      {!addrOk && (
                        <div className="rd-field-err">
                          Must start with 0x and be 42 characters
                        </div>
                      )}
                    </td>

                    {/* name */}
                    <td>
                      <input
                        className="rd-tbl-input"
                        value={r.name || ""}
                        placeholder="Optional"
                        onChange={(e) => updateRow(i, { name: e.target.value })}
                      />
                    </td>

                    {/* amount */}
                    <td>
                      <input
                        className="rd-tbl-input"
                        value={r.amount}
                        placeholder="e.g. 1500"
                        onChange={(e) => updateRow(i, { amount: e.target.value })}
                      />
                    </td>

                    {/* currency */}
                    <td>
                      <span className="rd-currency-badge">{tokenLabel}</span>
                    </td>

                    {/* remove */}
                    <td className="rd-td-right">
                      <button
                        type="button"
                        className="rd-btn-remove"
                        onClick={() => removeRow(i)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* footer: row count + add row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        {rows.length > 0 && (
          <div className="rd-row-count">
            <span className="rd-row-count-num">{rows.length}</span>
            {rows.length === 1 ? "employee added" : "employees added"}
          </div>
        )}
        <button type="button" className="rd-btn-add-row" onClick={addRow}>
          + Add Row
        </button>
      </div>
    </div>
  );
}