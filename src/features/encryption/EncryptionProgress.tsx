import Card from "../../ui/Card";

export default function EncryptionProgress({
  current,
  total,
}: {
  current: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Card title="Securing Payroll Data" subtitle="Encrypting employee payroll amounts.">
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${percent}%` }} />
      </div>
      <div className="muted" style={{ marginTop: 8 }}>
        {current} of {total} completed
      </div>
    </Card>
  );
}