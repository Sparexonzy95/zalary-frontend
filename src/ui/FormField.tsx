type Props = {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
};

export default function FormField({ label, hint, error, children }: Props) {
  return (
    <div className="field">
      <div className="field-label">{label}</div>
      {hint ? <div className="field-hint">{hint}</div> : null}
      <div className="field-control">{children}</div>
      {error ? <div className="field-error">{error}</div> : null}
    </div>
  );
}