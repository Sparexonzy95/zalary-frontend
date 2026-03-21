import React from "react";
import ScheduleBuilder from "./ScheduleBuilder";
import {
  buildSchedulePayload,
  validateTemplateForm,
  type TemplateFormState,
} from "./scheduleMapping";
import { env } from "../../lib/env";

/* ── CSS ── */
const FORM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Mono:wght@400;700&display=swap');

/* ── form shell ── */
.pg-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: relative;
  z-index: 1;
}

/* ── form row — 2-col grid ── */
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}

/* ── field ── */
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
/* When fields sit side-by-side in a form-row, inputs must bottom-align
   so they line up regardless of whether a hint text is present */
.form-row .field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  justify-content: flex-end;
}
/* The label and hint always stay at the top, only input anchors to bottom */
.form-row .field .field-label,
.form-row .field .field-hint,
.form-row .field .field-error {
  flex-shrink: 0;
}
.field-label {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: rgba(210, 222, 255, 0.45);
  text-transform: uppercase;
}
.field-hint {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: rgba(210, 222, 255, 0.25);
  letter-spacing: 0.04em;
  line-height: 1.55;
  margin-bottom: 2px;
}
.field-error {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: rgba(252, 165, 165, 0.85);
  letter-spacing: 0.04em;
  margin-top: 2px;
}

/* ── input / select ── */
.pg-input {
  width: 100%;
  background: rgba(47, 107, 255, 0.05);
  border: 1px solid rgba(47, 107, 255, 0.18);
  border-radius: 7px;
  padding: 10px 14px;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: rgba(210, 222, 255, 0.88);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  appearance: none;
  -webkit-appearance: none;
}
.pg-input::placeholder { color: rgba(210, 222, 255, 0.2); }
.pg-input:focus {
  border-color: rgba(47, 107, 255, 0.55);
  box-shadow: 0 0 0 3px rgba(47, 107, 255, 0.08);
}
.pg-input.error {
  border-color: rgba(239, 68, 68, 0.5);
  background: rgba(239, 68, 68, 0.04);
}
.pg-input.error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08);
}
/* date/select carets */
input[type="date"].pg-input::-webkit-calendar-picker-indicator {
  filter: invert(0.4) sepia(1) saturate(2) hue-rotate(200deg);
  opacity: 0.5;
  cursor: pointer;
}
select.pg-input {
  background-image: url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='rgba(47,107,255,0.5)' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 32px;
  cursor: pointer;
}
select.pg-input option {
  background: rgb(8, 11, 20);
  color: rgba(210, 222, 255, 0.88);
}

/* ── network / token read-only display ── */
.pg-input-readonly {
  width: 100%;
  background: rgba(210, 222, 255, 0.03);
  border: 1px solid rgba(210, 222, 255, 0.08);
  border-radius: 7px;
  padding: 10px 14px;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: rgba(210, 222, 255, 0.4);
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: default;
  min-height: 42px;
}
.pg-input-readonly-net-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(26, 255, 140, 0.9);
  box-shadow: 0 0 6px rgba(26, 255, 140, 0.6);
  flex-shrink: 0;
}

/* ── submit row ── */
.pg-form-submit {
  display: flex;
  justify-content: flex-end;
  padding-top: .5rem;
  gap: 10px;
}
`;

function useFormStyles() {
  React.useEffect(() => {
    const id = "rd-form-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id; el.textContent = FORM_CSS;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

/* ── types ── */
type Props = {
  chainId: number;
  onSubmit: (payload: {
    chain: number; token_address: string; title: string;
    schedule: any; employees: any[];
  }) => Promise<void>;
  submitting?: boolean;
};

function defaultStartDatePlus(days: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().split("T")[0];
}

export default function TemplateForm({ chainId, onSubmit, submitting }: Props) {
  useFormStyles();

  const [state, setState] = React.useState<TemplateFormState>({
    title: "",
    networkLabel: "Base Sepolia",
    schedule: {
      frequency: "monthly",
      startDate: defaultStartDatePlus(1),
      monthlyDay: 10,
      stopMode: "indefinite",
    },
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  function clearError(key: string) {
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateTemplateForm(state);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    await onSubmit({
      chain: chainId,
      token_address: env.CUSDC_ADDRESS,
      title: state.title.trim(),
      schedule: buildSchedulePayload(state.schedule),
      employees: [],
    });
  }

  return (
    <form onSubmit={handleSubmit} className="pg-form">

      {/* ── Settings panel ── */}
      <div className="panel">
        <div className="panel-scan" />
        <div className="panel-head">
          <div>
            <div className="panel-title">Template Settings</div>
            <div className="panel-sub">
              Basic configuration — employees and allocations are added later.
            </div>
          </div>
        </div>
        <div className="panel-body">
          <div className="form-row">

            {/* Name */}
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label className="field-label">Template name</label>
              <input
                className={`pg-input${errors.title ? " error" : ""}`}
                value={state.title}
                placeholder="e.g. Monthly Engineering Salaries"
                onChange={e => {
                  setState(s => ({ ...s, title: e.target.value }));
                  clearError("title");
                }}
              />
              {errors.title && (
                <div className="field-error">{errors.title}</div>
              )}
            </div>

            {/* Network — read only */}
            <div className="field">
              <label className="field-label">Network</label>
              <div className="field-hint" style={{ visibility: "hidden", userSelect: "none", pointerEvents: "none" }}>
                &nbsp;
              </div>
              <div className="pg-input-readonly">
                <span className="pg-input-readonly-net-dot" />
                Base Sepolia
              </div>
            </div>

            {/* Token — read only */}
            <div className="field">
              <label className="field-label">Settlement token</label>
              <div className="field-hint">
                Payroll settled in Confidential USDC (cUSDC) — encrypted on-chain via Inco Lightning.
              </div>
              <div className="pg-input-readonly" style={{ fontFamily: "'Space Mono', monospace", fontSize: ".78rem" }}>
                cUSDC · Confidential USDC
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Schedule panel ── */}
      <ScheduleBuilder
        value={state.schedule}
        errors={errors}
        onChange={next => {
          setState(s => ({ ...s, schedule: next }));
          ["startDate","weeklyDay","monthlyDay","stopMode","cycles","endDate"].forEach(clearError);
        }}
      />

      {/* ── Submit ── */}
      <div className="pg-form-submit">
        <button className="pg-btn" type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                style={{ animation: "rd-spin 1s linear infinite" }}>
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
              </svg>
              Creating…
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M10 4v12M4 10h12"/>
              </svg>
              Create Template
            </>
          )}
        </button>
      </div>

    </form>
  );
}