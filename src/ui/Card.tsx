type Accent = "blue" | "green" | "yellow" | "red";

type Props = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Optional coloured top-border accent */
  accent?: Accent;
};

const ACCENT_STYLE: Record<Accent, string> = {
  blue:   "2px solid #2F6BFF",
  green:  "2px solid #22c55e",
  yellow: "2px solid #f59e0b",
  red:    "2px solid #ef4444",
};

export default function Card({ title, subtitle, children, footer, accent }: Props) {
  return (
    <div
      className="card"
      style={accent ? { borderTop: ACCENT_STYLE[accent] } : undefined}
    >
      {title ? (
        <div className="card-head">
          <div className="card-title">{title}</div>
          {subtitle ? <div className="card-subtitle">{subtitle}</div> : null}
        </div>
      ) : null}

      <div className="card-body">{children}</div>

      {footer ? <div className="card-footer">{footer}</div> : null}
    </div>
  );
}