import React from "react";
import { schedulePreview } from "./schedulePreview";
import { WEEKDAYS, type ScheduleFormState } from "./scheduleMapping";

/* ── CSS ── */
const SCHED_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Mono:wght@400;700&display=swap');

/* ── frequency grid — 3 cards ── */
.freq-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  align-items: stretch;
}

.freq-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  padding: 22px 20px 20px;
  background: rgb(3, 5, 9);
  border: 1px solid rgba(47, 107, 255, 0.12);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.22s;
  text-align: left;
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
}
.freq-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(47,107,255,0.3), transparent);
  opacity: 0;
  transition: opacity 0.22s;
}
.freq-card:hover {
  border-color: rgba(47, 107, 255, 0.32);
  background: rgba(47, 107, 255, 0.04);
}
.freq-card:hover::before { opacity: 1; }

.freq-card.selected {
  border-color: rgba(47, 107, 255, 0.6);
  background: rgba(47, 107, 255, 0.07);
  box-shadow: 0 0 20px rgba(47, 107, 255, 0.08);
}
.freq-card.selected::before {
  opacity: 1;
  background: linear-gradient(90deg, transparent, rgba(47,107,255,0.65), transparent);
}

/* icon box */
.freq-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(47, 107, 255, 0.1);
  border: 1px solid rgba(47, 107, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(47, 107, 255, 0.8);
  flex-shrink: 0;
  transition: all 0.22s;
}
.freq-card.selected .freq-icon {
  background: rgba(47, 107, 255, 0.18);
  border-color: rgba(47, 107, 255, 0.45);
  color: rgba(47, 107, 255, 1);
  box-shadow: 0 0 12px rgba(47, 107, 255, 0.2);
}
.freq-label {
  font-family: 'Syne', sans-serif;
  font-weight: 700;
  font-size: 14px;
  color: rgba(210, 222, 255, 0.75);
  letter-spacing: -0.01em;
  transition: color 0.22s;
  text-transform: none;
}
.freq-card.selected .freq-label {
  color: rgba(210, 222, 255, 0.97);
}
.freq-sub {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: rgba(210, 222, 255, 0.28);
  letter-spacing: 0.06em;
  transition: color 0.22s;
}
.freq-card.selected .freq-sub {
  color: rgba(47, 107, 255, 0.7);
}

/* ── stop mode grid — 3 cards ── */
.stop-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  align-items: stretch;
}
.stop-card {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 14px 16px;
  background: rgb(3, 5, 9);
  border: 1px solid rgba(47, 107, 255, 0.1);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
  height: 100%;
}
.stop-card:hover {
  border-color: rgba(47, 107, 255, 0.3);
  background: rgba(47, 107, 255, 0.03);
}
.stop-card.selected {
  border-color: rgba(47, 107, 255, 0.5);
  background: rgba(47, 107, 255, 0.06);
}
.stop-card-label {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  font-size: 11px;
  color: rgba(210, 222, 255, 0.75);
  letter-spacing: 0.02em;
  transition: color 0.2s;
}
.stop-card.selected .stop-card-label {
  color: rgba(47, 107, 255, 0.95);
}
.stop-card-sub {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: rgba(210, 222, 255, 0.25);
  letter-spacing: 0.04em;
  line-height: 1.45;
}

/* ── schedule preview ── */
.sched-preview {
  padding: 16px 18px;
  background: rgba(47, 107, 255, 0.04);
  border: 1px solid rgba(47, 107, 255, 0.14);
  border-radius: 8px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
}
.sched-preview::before {
  content: '';
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(47, 107, 255, 0.7);
  box-shadow: 0 0 6px rgba(47, 107, 255, 0.5);
  flex-shrink: 0;
  margin-top: 5px;
}
.sched-preview-label {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.16em;
  color: rgba(47, 107, 255, 0.55);
  text-transform: uppercase;
  margin-bottom: 5px;
}
.sched-preview-text {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: rgba(210, 222, 255, 0.72);
  letter-spacing: 0.03em;
  line-height: 1.6;
}

/* ── spin animation for submit spinner ── */
@keyframes rd-spin {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}

/* Bottom-align inputs in side-by-side rows so Start Date and Day of Week line up */
.form-row .field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  justify-content: flex-end;
}
.form-row .field .field-label,
.form-row .field .field-hint,
.form-row .field .field-error {
  flex-shrink: 0;
}

/* ── responsive ── */
@media (max-width: 640px) {
  .freq-grid { grid-template-columns: 1fr; }
  .stop-grid { grid-template-columns: 1fr; }
}
`;

function useSchedStyles() {
  React.useEffect(() => {
    const id = "rd-sched-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = SCHED_CSS;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

/* ── frequency SVG icons — replaces emojis ── */
function FreqIcon({ type }: { type: string }) {
  if (type === "one_time") return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="8"/>
      <path d="M10 6v4l2.5 2.5"/>
    </svg>
  );
  if (type === "weekly") return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="16" height="14" rx="2"/>
      <path d="M6 1v4M14 1v4M2 9h16"/>
    </svg>
  );
  return (
    <svg width="15" height="15" viewBox="0 0 20 20" fill="none"
      stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="16" height="14" rx="2"/>
      <path d="M2 9h16M6 1v4M14 1v4M6 13h2M10 13h2"/>
    </svg>
  );
}

/* ── data ── */
const FREQ_OPTIONS = [
  { value: "one_time", label: "One-time", sub: "Single payroll run" },
  { value: "weekly",   label: "Weekly",   sub: "Every week" },
  { value: "monthly",  label: "Monthly",  sub: "Every month" },
];

const STOP_OPTIONS = [
  { value: "indefinite",   label: "Indefinitely",  sub: "Run until manually stopped" },
  { value: "after_cycles", label: "After N Runs",  sub: "Stop after a set number of cycles" },
  { value: "end_date",     label: "End Date",       sub: "Stop on a specific date" },
];

/* ── component ── */
type Props = {
  value: ScheduleFormState;
  errors: Record<string, string>;
  onChange: (next: ScheduleFormState) => void;
};

export default function ScheduleBuilder({ value, errors, onChange }: Props) {
  useSchedStyles();

  const set = (patch: Partial<ScheduleFormState>) => onChange({ ...value, ...patch });

  return (
    <div className="panel">
      <div className="panel-scan" />
      <div className="panel-head">
        <div>
          <div className="panel-title">Payroll Schedule</div>
          <div className="panel-sub">Define how often payroll runs and when it starts.</div>
        </div>
      </div>
      <div className="panel-body">
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

          {/* ── Frequency cards ── */}
          <div>
            <div className="field-label" style={{ marginBottom: ".75rem" }}>
              How often?
            </div>
            <div className="freq-grid">
              {FREQ_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`freq-card${value.frequency === opt.value ? " selected" : ""}`}
                  onClick={() => set({ frequency: opt.value as ScheduleFormState["frequency"] })}
                >
                  <div className="freq-icon">
                    <FreqIcon type={opt.value} />
                  </div>
                  <div className="freq-label">{opt.label}</div>
                  <div className="freq-sub">{opt.sub}</div>
                </button>
              ))}
            </div>
            {errors.frequency && (
              <div className="field-error" style={{ marginTop: ".5rem" }}>
                {errors.frequency}
              </div>
            )}
          </div>

          {/* ── Start date + weekly/monthly day ── */}
          <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr", alignItems: "start" }}>
            <div className="field">
              <label className="field-label">Start date</label>
              <div className="field-hint">Payroll will run at 09:00 on this date.</div>
              <input
                type="date"
                className={`pg-input${errors.startDate ? " error" : ""}`}
                value={value.startDate}
                onChange={e => set({ startDate: e.target.value })}
              />
              {errors.startDate && (
                <div className="field-error">{errors.startDate}</div>
              )}
            </div>

            {/* Weekly day */}
            {value.frequency === "weekly" && (
              <div className="field">
                <label className="field-label">Day of the week</label>
                <div className="field-hint" style={{ visibility: "hidden", userSelect: "none", pointerEvents: "none" }}>&nbsp;</div>
                <select
                  className={`pg-input${errors.weeklyDay ? " error" : ""}`}
                  value={typeof value.weeklyDay === "number" ? String(value.weeklyDay) : ""}
                  onChange={e => set({ weeklyDay: Number(e.target.value) })}
                >
                  <option value="" disabled>Select a weekday</option>
                  {WEEKDAYS.map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
                {errors.weeklyDay && (
                  <div className="field-error">{errors.weeklyDay}</div>
                )}
              </div>
            )}

            {/* Monthly day */}
            {value.frequency === "monthly" && (
              <div className="field">
                <label className="field-label">Day of the month</label>
                <div className="field-hint">1–28 recommended to avoid month-end issues.</div>
                <select
                  className={`pg-input${errors.monthlyDay ? " error" : ""}`}
                  value={value.monthlyDay ? String(value.monthlyDay) : ""}
                  onChange={e => set({ monthlyDay: Number(e.target.value) })}
                >
                  <option value="" disabled>Select a day</option>
                  {Array.from({ length: 28 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                {errors.monthlyDay && (
                  <div className="field-error">{errors.monthlyDay}</div>
                )}
              </div>
            )}
          </div>

          {/* ── Stop mode ── */}
          {value.frequency !== "one_time" && (
            <div>
              <div className="field-label" style={{ marginBottom: ".75rem" }}>
                When should payroll stop?
              </div>
              <div className="stop-grid">
                {STOP_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`stop-card${value.stopMode === opt.value ? " selected" : ""}`}
                    onClick={() => set({ stopMode: opt.value as ScheduleFormState["stopMode"] })}
                  >
                    <div className="stop-card-label">{opt.label}</div>
                    <div className="stop-card-sub">{opt.sub}</div>
                  </button>
                ))}
              </div>
              {errors.stopMode && (
                <div className="field-error" style={{ marginTop: ".5rem" }}>
                  {errors.stopMode}
                </div>
              )}

              {value.stopMode === "after_cycles" && (
                <div className="field" style={{ marginTop: "1rem", maxWidth: "200px" }}>
                  <label className="field-label">Number of runs</label>
                  <input
                    type="number" min={1}
                    className={`pg-input${errors.cycles ? " error" : ""}`}
                    value={value.cycles ?? ""}
                    onChange={e => set({ cycles: Number(e.target.value) })}
                  />
                  {errors.cycles && (
                    <div className="field-error">{errors.cycles}</div>
                  )}
                </div>
              )}

              {value.stopMode === "end_date" && (
                <div className="field" style={{ marginTop: "1rem", maxWidth: "240px" }}>
                  <label className="field-label">End date</label>
                  <input
                    type="date"
                    className={`pg-input${errors.endDate ? " error" : ""}`}
                    value={value.endDate ?? ""}
                    onChange={e => set({ endDate: e.target.value })}
                  />
                  {errors.endDate && (
                    <div className="field-error">{errors.endDate}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Schedule preview ── */}
          <div className="sched-preview">
            <div style={{ flex: 1 }}>
              <div className="sched-preview-label">Schedule Preview</div>
              <div className="sched-preview-text">{schedulePreview(value)}</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}