import React from "react";

/* ── CSS injected once ── */
const BADGE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');

.rd-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 11px;
  border-radius: 20px;
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  white-space: nowrap;
  border: 1px solid transparent;
  line-height: 1;
}

/* dot inside badge */
.rd-badge::before {
  content: '';
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* ── tones ── */
.rd-badge-gray {
  background: rgba(210, 222, 255, 0.05);
  border-color: rgba(210, 222, 255, 0.13);
  color: rgba(210, 222, 255, 0.45);
}
.rd-badge-gray::before {
  background: rgba(210, 222, 255, 0.3);
}

.rd-badge-green {
  background: rgba(26, 255, 140, 0.08);
  border-color: rgba(26, 255, 140, 0.28);
  color: rgba(26, 255, 140, 0.9);
}
.rd-badge-green::before {
  background: rgba(26, 255, 140, 0.9);
  box-shadow: 0 0 6px rgba(26, 255, 140, 0.6);
}

.rd-badge-blue {
  background: rgba(47, 107, 255, 0.08);
  border-color: rgba(47, 107, 255, 0.28);
  color: rgba(47, 107, 255, 0.9);
}
.rd-badge-blue::before {
  background: rgba(47, 107, 255, 0.9);
  box-shadow: 0 0 6px rgba(47, 107, 255, 0.6);
}

.rd-badge-yellow {
  background: rgba(255, 180, 50, 0.08);
  border-color: rgba(255, 180, 50, 0.28);
  color: rgba(255, 180, 50, 0.9);
}
.rd-badge-yellow::before {
  background: rgba(255, 180, 50, 0.9);
  box-shadow: 0 0 6px rgba(255, 180, 50, 0.5);
}

.rd-badge-red {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.28);
  color: rgba(252, 165, 165, 0.9);
}
.rd-badge-red::before {
  background: rgba(239, 68, 68, 0.85);
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
}
`;

function useBadgeStyles() {
  React.useEffect(() => {
    const id = "rd-badge-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = BADGE_CSS;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

/* ── types — unchanged ── */
type Tone = "gray" | "yellow" | "blue" | "green" | "red";

type Props = {
  children?: React.ReactNode;
  tone?: Tone;
  status?: string;
};

/* ── tone mapping — unchanged ── */
function statusToTone(status: string): Tone {
  const s = status.toLowerCase();
  if (["funded", "finalized_success"].includes(s)) return "green";
  if (["active"].includes(s)) return "blue";
  if (["completed"].includes(s)) return "green";
  if ([
    "alloc_uploading", "alloc_uploaded", "alloc_finalizing", "alloc_finalized",
    "funding", "create_broadcasted", "created",
    "request_broadcasted", "pending_ready", "finalize_broadcasted",
  ].includes(s)) return "blue";
  if (["draft", "not_started", "scheduled"].includes(s)) return "yellow";
  if (["failed", "finalized_revert", "error"].includes(s)) return "red";
  return "gray";
}

/* ── label mapping — unchanged ── */
function statusToLabel(status: string): string {
  const s = status.toLowerCase();
  const map: Record<string, string> = {
    scheduled:            "Scheduled",
    create_broadcasted:   "Creating",
    created:              "Created",
    alloc_uploading:      "Uploading",
    alloc_uploaded:       "Uploaded",
    alloc_finalizing:     "Finalizing",
    alloc_finalized:      "Finalized",
    funding:              "Funding",
    funded:               "Funded",
    active:               "Active",
    draft:                "Draft",
    not_started:          "Pending",
    failed:               "Failed",
    error:                "Error",
    request_broadcasted:  "Requesting",
    pending_ready:        "Ready",
    finalize_broadcasted: "Finalizing",
    finalized_success:    "Complete",
    completed:            "Completed ✓",
    finalized_revert:     "Reverted",
  };
  return map[s] ?? status;
}

/* ── tone → class map — updated to rd- prefix ── */
const TONE_CLASS: Record<Tone, string> = {
  gray:   "rd-badge rd-badge-gray",
  green:  "rd-badge rd-badge-green",
  blue:   "rd-badge rd-badge-blue",
  yellow: "rd-badge rd-badge-yellow",
  red:    "rd-badge rd-badge-red",
};

export default function StatusBadge({ children, tone, status }: Props) {
  useBadgeStyles();

  const resolvedTone: Tone  = tone ?? (status ? statusToTone(status) : "gray");
  const resolvedLabel        = children ?? (status ? statusToLabel(status) : "Unknown");

  return (
    <span className={TONE_CLASS[resolvedTone]}>
      {resolvedLabel}
    </span>
  );
}