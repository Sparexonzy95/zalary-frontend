import React from "react";

/* ─────────────────────────────────────────────────────────────
   BUTTON
───────────────────────────────────────────────────────────── */
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
};

export function Button({
  variant = "primary",
  size,
  className = "",
  ...props
}: ButtonProps) {
  const sizeClass = size === "sm" ? "btn-small" : size === "lg" ? "btn-large" : "";
  return (
    <button
      {...props}
      className={`btn btn-${variant} ${sizeClass} ${className}`.trim()}
    />
  );
}

/* ─────────────────────────────────────────────────────────────
   CARD
───────────────────────────────────────────────────────────── */
export function Card({
  title,
  subtitle,
  children,
  glass,
  actions,
  className = "",
}: {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  glass?: boolean;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`${glass ? "glass-card" : "card"} ${className}`.trim()}>
      {(title || subtitle || actions) && (
        <div className="card-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p className="muted">{subtitle}</p>}
          </div>
          {actions && <div>{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/* ─────────────────────────────────────────────────────────────
   GLASS CARD
───────────────────────────────────────────────────────────── */
export function GlassCard({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={`glass-card ${className}`.trim()} style={style}>
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────────────────────── */
export function StatusBadge({ value }: { value?: string | null }) {
  const normalized = String(value ?? "unknown")
    .toLowerCase()
    .replace(/\s+/g, "_");
  const display = normalized.replace(/_/g, " ");
  return <span className={`status status-${normalized}`}>{display}</span>;
}

/* ─────────────────────────────────────────────────────────────
   FIELD
───────────────────────────────────────────────────────────── */
export function Field({
  label,
  help,
  error,
  children,
}: {
  label: React.ReactNode;
  help?: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {help && (
        <span className="muted" style={{ fontSize: "0.78rem" }}>
          {help}
        </span>
      )}
      {error && <span className="text-danger">{error}</span>}
    </label>
  );
}

/* ─────────────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────────────── */
export function StatCard({
  value,
  label,
  accent,
}: {
  value: React.ReactNode;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className={`stat-card${accent ? " accent-card" : ""}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ADDRESS / TX PILL
───────────────────────────────────────────────────────────── */
export function AddressPill({
  value,
  full,
  href,
}: {
  value: string;
  full?: boolean;
  href?: string;
}) {
  const display = full
    ? value
    : value
      ? `${value.slice(0, 6)}…${value.slice(-4)}`
      : "—";

  if (href) {
    return (
      <a
        className="address-pill"
        href={href}
        target="_blank"
        rel="noreferrer"
        title={value}
      >
        {display}
      </a>
    );
  }

  return (
    <span className="address-pill" title={value}>
      {display}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────────────────────────── */
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <path d="M9 9h6M9 13h4" />
        </svg>
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LOADING STATE
───────────────────────────────────────────────────────────── */
export function LoadingState({ message = "Loading…" }: { message?: string }) {
  return (
    <div
      style={{
        padding: "2.5rem",
        textAlign: "center",
        fontFamily: "var(--z-mono)",
        fontSize: "0.72rem",
        letterSpacing: "0.08em",
        color: "var(--z-dim)",
        textTransform: "uppercase",
      }}
    >
      {message}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ERROR STATE
───────────────────────────────────────────────────────────── */
export function ErrorState({ message }: { message?: string }) {
  return (
    <div
      style={{
        padding: "2rem",
        border: "1px solid rgba(255,95,87,0.2)",
        borderRadius: "var(--z-radius)",
        textAlign: "center",
        fontFamily: "var(--z-mono)",
        fontSize: "0.72rem",
        color: "var(--z-danger)",
        letterSpacing: "0.06em",
      }}
    >
      {message || "Something went wrong."}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   PAGE HEADER
───────────────────────────────────────────────────────────── */
export function PageHeader({
  eyebrow,
  title,
  accentTitle,
  description,
  meta,
  actions,
}: {
  eyebrow?: string;
  title: string;
  accentTitle?: string;
  description?: string;
  meta?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        {eyebrow && <div className="page-header-eyebrow">{eyebrow}</div>}
        <h1>
          {title}
          {accentTitle && (
            <>
              <br />
              <span className="accent">{accentTitle}</span>
            </>
          )}
        </h1>
        {description && <p className="desc">{description}</p>}
        {meta && <div className="page-header-meta">{meta}</div>}
      </div>
      {actions && (
        <div className="row" style={{ flexShrink: 0, alignItems: "flex-start" }}>
          {actions}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   SECTION HEADER
───────────────────────────────────────────────────────────── */
export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="section-header">
      <div className="section-title">{title}</div>
      {action}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────────────── */
type Toast = {
  id: number;
  title: string;
  message?: string;
  kind?: "success" | "error" | "info";
};

type ToastCtx = {
  push: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = React.createContext<ToastCtx>({
  push: () => undefined,
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const push = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((cur) => [...cur, { id, ...toast }]);
    setTimeout(() => {
      setToasts((cur) => cur.filter((t) => t.id !== id));
    }, 4500);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="toast-stack">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.kind ?? "info"}`}>
            <strong>{toast.title}</strong>
            {toast.message && <div>{toast.message}</div>}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}


