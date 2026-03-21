import StatusBadge from "../../ui/StatusBadge";

export default function FundingStatus({ status }: { status?: string }) {
  const s = (status || "").toLowerCase();

  if (s === "funded") {
    return <StatusBadge tone="green">Funded</StatusBadge>;
  }

  if (s === "funding") {
    return <StatusBadge tone="blue">Funding In Progress</StatusBadge>;
  }

  return <StatusBadge tone="yellow">Awaiting Funding</StatusBadge>;
}