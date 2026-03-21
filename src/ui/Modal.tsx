import React from "react";

/* ── CSS injected once ── */
const MODAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Mono:wght@400;700&display=swap');

.rd-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(3, 5, 9, 0.88);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.rd-modal {
  background: rgb(8, 11, 20);
  border: 1px solid rgba(47, 107, 255, 0.22);
  border-radius: 14px;
  width: 100%;
  max-width: 780px;
  max-height: 88vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 0 80px rgba(47, 107, 255, 0.08);
}

/* scan line on top edge */
.rd-modal::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(47,107,255,0.55), transparent);
  border-radius: 14px 14px 0 0;
}

.rd-modal-hdr {
  padding: 28px 32px 20px;
  border-bottom: 1px solid rgba(47, 107, 255, 0.1);
}

.rd-modal-tag {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.2em;
  color: rgba(47, 107, 255, 0.6);
  text-transform: uppercase;
  margin-bottom: 8px;
}

.rd-modal-title {
  font-family: 'Syne', sans-serif;
  font-weight: 800;
  font-size: 22px;
  color: rgba(210, 222, 255, 0.97);
  letter-spacing: -0.025em;
  line-height: 1.1;
  margin-bottom: 6px;
}

.rd-modal-desc {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: rgba(210, 222, 255, 0.36);
  letter-spacing: 0.03em;
  line-height: 1.6;
}

.rd-modal-body {
  padding: 24px 32px;
}

.rd-modal-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 18px 32px 24px;
  border-top: 1px solid rgba(47, 107, 255, 0.09);
  background: rgba(47, 107, 255, 0.02);
}

.rd-modal-btn-cancel {
  display: inline-flex;
  align-items: center;
  padding: 9px 20px;
  background: transparent;
  border: 1px solid rgba(210, 222, 255, 0.14);
  border-radius: 7px;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(210, 222, 255, 0.45);
  cursor: pointer;
  transition: all 0.2s;
}
.rd-modal-btn-cancel:hover {
  border-color: rgba(210, 222, 255, 0.28);
  color: rgba(210, 222, 255, 0.75);
}

.rd-modal-btn-confirm {
  display: inline-flex;
  align-items: center;
  padding: 9px 22px;
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
.rd-modal-btn-confirm:hover {
  background: rgba(47, 107, 255, 1);
  box-shadow: 0 0 22px rgba(47, 107, 255, 0.3);
}
.rd-modal-btn-confirm:disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.rd-modal-btn-danger {
  display: inline-flex;
  align-items: center;
  padding: 9px 22px;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.45);
  border-radius: 7px;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(252, 165, 165, 0.95);
  cursor: pointer;
  transition: all 0.2s;
}
.rd-modal-btn-danger:hover {
  background: rgba(239, 68, 68, 0.25);
  box-shadow: 0 0 18px rgba(239, 68, 68, 0.18);
}
`;

function useModalStyles() {
  React.useEffect(() => {
    const id = "rd-modal-css";
    if (document.getElementById(id)) return;
    const el = document.createElement("style");
    el.id = id;
    el.textContent = MODAL_CSS;
    document.head.appendChild(el);
    return () => { document.getElementById(id)?.remove(); };
  }, []);
}

/* ── types ── */
type Props = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  children?: React.ReactNode;
  onConfirm: () => void;
  onClose: () => void;
};

export default function Modal({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  danger,
  children,
  onConfirm,
  onClose,
}: Props) {
  useModalStyles();

  if (!open) return null;

  return (
    <div
      className="rd-modal-overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={onClose}
    >
      <div className="rd-modal" onMouseDown={(e) => e.stopPropagation()}>

        {/* header */}
        <div className="rd-modal-hdr">
          <div className="rd-modal-tag">Payroll Setup</div>
          <div className="rd-modal-title">{title}</div>
          {description && (
            <div className="rd-modal-desc">{description}</div>
          )}
        </div>

        {/* body */}
        {children && (
          <div className="rd-modal-body">{children}</div>
        )}

        {/* actions */}
        <div className="rd-modal-actions">
          <button className="rd-modal-btn-cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button
            className={danger ? "rd-modal-btn-danger" : "rd-modal-btn-confirm"}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}