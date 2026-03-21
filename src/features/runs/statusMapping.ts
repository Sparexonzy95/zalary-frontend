export function runStatusLabel(
  status?: string,
  employeeCount?: number,
  totalAtomic?: number,
  onchainPayrollId?: number | null
): string {
  const s = (status || "").toLowerCase();
  const hasDbAllocations = Number(employeeCount ?? 0) > 0 || Number(totalAtomic ?? 0) > 0;

  if (s === "scheduled" && hasDbAllocations) return "Allocations Uploaded";
  if (s === "scheduled") return "Pending Allocations";

  if (s === "create_broadcasted") return "Creating On-Chain Payroll";
  if ((s === "created" || s === "created_confirmed") && onchainPayrollId != null) return "On-Chain Payroll Created";

  if (s === "alloc_uploading") return "Securing Payroll Data";
  if (s === "alloc_uploaded") return "Payroll Data Secured";
  if (s === "alloc_finalizing") return "Finalizing Payroll";
  if (s === "alloc_finalized") return "Finalized";

  if (s === "funding") return "Funding";
  if (s === "funded") return "Funded";
  if (s === "active") return "Active";
  if (s === "failed") return "Failed";

  return status || "Unknown";
}

export function runStatusTone(
  status?: string,
  employeeCount?: number,
  totalAtomic?: number,
  onchainPayrollId?: number | null
): "yellow" | "blue" | "green" | "red" | "gray" {
  const s = (status || "").toLowerCase();
  const hasDbAllocations = Number(employeeCount ?? 0) > 0 || Number(totalAtomic ?? 0) > 0;

  if (s === "scheduled" && hasDbAllocations) return "yellow";
  if (s === "scheduled") return "yellow";

  if (s === "create_broadcasted") return "blue";
  if ((s === "created" || s === "created_confirmed") && onchainPayrollId != null) return "green";

  if (s === "alloc_uploading" || s === "alloc_uploaded" || s === "alloc_finalizing" || s === "alloc_finalized") {
    return "green";
  }

  if (s === "failed") return "red";

  return "gray";
}