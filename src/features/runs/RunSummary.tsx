import Card from "../../ui/Card";
import { formatAtomicToDisplay } from "./amounts";

export default function RunSummary({
  employeeCount,
  totalAtomic,
  decimals,
  tokenLabel = "USDC",
}: {
  employeeCount: number;
  totalAtomic: number;
  decimals: number;
  tokenLabel?: string;
}) {
  const display = formatAtomicToDisplay(totalAtomic ?? 0, decimals);

  return (
    <Card title="Run Summary" subtitle="Review totals before moving to encryption and onchain actions.">
      <div className="kv">
        <div className="kv-row">
          <div className="kv-k">Employees</div>
          <div className="kv-v">{employeeCount}</div>
        </div>
        <div className="kv-row">
          <div className="kv-k">Total Payroll</div>
          <div className="kv-v">
            {Number(display).toLocaleString()} {tokenLabel}
          </div>
        </div>
      </div>
    </Card>
  );
}