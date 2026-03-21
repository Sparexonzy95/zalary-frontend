export default function FundPayrollButton({
  disabled,
  loading,
  onClick,
}: {
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button className="btn btn-primary" disabled={disabled || loading} onClick={onClick}>
      {loading ? "Funding payroll..." : "Fund Payroll"}
    </button>
  );
}