import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CircleUserRound,
  Copy,
  LogOut,
  Mail,
  RefreshCw,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { AddressPill, Button, Card } from "../components/ui";
import { useToast } from "../components/Toast";
import { shortAddress } from "../lib/format";
import { useOnboarding } from "../lib/onboarding";
import { useWallet } from "../lib/wallet";

type PillKind = "success" | "warning" | "muted";

function textOrUnset(value?: string | null) {
  const text = String(value || "").trim();
  return text || "Not set";
}

function StatusPill({ kind, children }: { kind: PillKind; children: ReactNode }) {
  return (
    <span className={`account-status-pill account-status-pill-${kind}`}>
      {children}
    </span>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  children,
}: {
  icon: LucideIcon;
  label: string;
  value?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="account-detail-row-simple">
      <span className="account-detail-row-label">
        <Icon size={15} strokeWidth={1.7} />
        {label}
      </span>
      <strong>{children ?? value}</strong>
    </div>
  );
}

function WorkspaceRow({
  title,
  detail,
  ready,
  to,
  icon,
}: {
  title: string;
  detail: string;
  ready: boolean;
  to: string;
  icon: ReactNode;
}) {
  return (
    <div className="account-workspace-row">
      <span className="account-workspace-icon" aria-hidden="true">
        {icon}
      </span>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
      <StatusPill kind={ready ? "success" : "warning"}>
        {ready ? "Ready" : "Setup"}
      </StatusPill>
      <Link className="account-workspace-open" to={to}>
        Open
        <ArrowRight size={13} strokeWidth={1.8} />
      </Link>
    </div>
  );
}

export function AccountPage() {
  const { loading, token, profile, refresh, logout, isOnboarded } =
    useOnboarding();
  const { wallet } = useWallet();
  const toast = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const employer = profile?.employer;
  const employee = profile?.employee;
  const employerReady = isOnboarded("employer", profile);
  const employeeReady = isOnboarded("employee", profile);
  const sessionActive = Boolean(token && profile);

  const connectedWallet = wallet || "";
  const verifiedWallet = profile?.wallet_address || "";
  const primaryWallet = connectedWallet || verifiedWallet;
  const walletMatches =
    !connectedWallet ||
    !verifiedWallet ||
    connectedWallet.toLowerCase() === verifiedWallet.toLowerCase();
  const email =
    profile?.email || employer?.work_email || employee?.notification_email || "";

  async function handleRefresh() {
    setRefreshing(true);
    const nextProfile = await refresh();
    setRefreshing(false);

    toast.push({
      kind: nextProfile ? "success" : "info",
      title: nextProfile ? "Account refreshed" : "No active profile",
    });
  }

  async function handleCopyWallet() {
    if (!primaryWallet) return;

    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }

      await navigator.clipboard.writeText(primaryWallet);
      toast.push({ kind: "success", title: "Wallet copied" });
    } catch {
      toast.push({ kind: "error", title: "Could not copy wallet" });
    }
  }

  function handleLogout() {
    logout();
    toast.push({ kind: "info", title: "Logged out" });
  }

  return (
    <div className="stack dashboard-shell account-page account-page-pro account-page-simple">
      <Link className="employee-claim-history-link template-detail-back-link account-back-link" to="/app">
        <ArrowLeft size={14} strokeWidth={1.8} />
        Back to dashboard
      </Link>

      <div className="page-header employee-claims-header-card account-page-head">
        <div className="account-head-copy">
          <div className="page-header-eyebrow">Account</div>
          <h1>Profile</h1>
        </div>

        <StatusPill kind={sessionActive ? "success" : "warning"}>
          {sessionActive ? "Active" : "Signed out"}
        </StatusPill>
      </div>

      <Card className="account-panel account-simple-card">
        <section className="account-simple-top">
          <div className="account-wallet-panel">
            <div className="account-wallet-panel-head">
              <div className="account-avatar" aria-hidden="true">
                <WalletCards size={22} strokeWidth={1.6} />
              </div>

              <div className="account-identity-copy">
                <span>Wallet</span>
                <h2>{shortAddress(primaryWallet)}</h2>
              </div>

              <button
                type="button"
                className="account-icon-btn"
                onClick={handleCopyWallet}
                disabled={!primaryWallet}
                aria-label="Copy wallet address"
              >
                <Copy size={15} strokeWidth={1.8} />
              </button>
            </div>

            <div className="account-wallet-line">
              {primaryWallet ? (
                <AddressPill value={primaryWallet} full />
              ) : (
                <span className="account-empty-value">No wallet connected</span>
              )}
            </div>
          </div>

          <div className="account-info-panel">
            <DetailRow icon={Mail} label="Email" value={textOrUnset(email)} />
            <DetailRow icon={Mail} label="Email status">
              <StatusPill kind={profile?.email_verified ? "success" : "warning"}>
                {profile?.email_verified ? "Verified" : "Pending"}
              </StatusPill>
            </DetailRow>
            <DetailRow icon={WalletCards} label="Wallet match">
              <StatusPill kind={walletMatches ? "success" : "warning"}>
                {walletMatches ? "Matched" : "Review"}
              </StatusPill>
            </DetailRow>
          </div>
        </section>

        <section className="account-simple-section account-workspace-section">
          <div className="account-simple-section-title">
            <BriefcaseBusiness size={16} strokeWidth={1.7} />
            <span>Workspace access</span>
          </div>

          <div className="account-workspace-list-simple">
            <WorkspaceRow
              title="Employer"
              detail={textOrUnset(employer?.company_name)}
              ready={employerReady}
              to={
                employerReady
                  ? "/employer"
                  : sessionActive
                    ? "/onboarding/employer"
                    : "/verify/employer"
              }
              icon={<BriefcaseBusiness size={17} strokeWidth={1.7} />}
            />
            <WorkspaceRow
              title="Employee"
              detail={textOrUnset(employee?.display_name)}
              ready={employeeReady}
              to={
                employeeReady
                  ? "/employee/claims"
                  : sessionActive
                    ? "/onboarding/employee"
                    : "/verify/employee"
              }
              icon={<CircleUserRound size={17} strokeWidth={1.7} />}
            />
          </div>
        </section>

        <section className="account-actions-simple">
          <Button
            type="button"
            variant="secondary"
            onClick={() => void handleRefresh()}
            disabled={refreshing || loading}
          >
            <RefreshCw
              size={15}
              strokeWidth={1.8}
              className={refreshing ? "account-spin" : undefined}
            />
            {refreshing ? "Refreshing" : "Refresh"}
          </Button>
          <Button type="button" variant="danger" onClick={handleLogout}>
            <LogOut size={15} strokeWidth={1.8} />
            Log out
          </Button>
        </section>
      </Card>
    </div>
  );
}
