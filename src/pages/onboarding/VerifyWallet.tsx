import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { Button, Card, useToast } from "../../components/ui";
import { WalletConnectButton } from "../../components/WalletConnectButton";
import {
  useOnboarding,
  type OnboardingProfile,
  type OnboardingRole,
} from "../../lib/onboarding";
import { formatAddress } from "../../lib/utils";
import { useWallet } from "../../lib/wallet";

function dashboardFor(role: OnboardingRole) {
  return role === "employer" ? "/employer" : "/employee/claims";
}

function onboardingFor(role: OnboardingRole) {
  return role === "employer" ? "/onboarding/employer" : "/onboarding/employee";
}

function roleTitle(role: OnboardingRole) {
  return role === "employer" ? "Employer" : "Employee";
}

function verifyTitle(role: OnboardingRole) {
  return role === "employer"
    ? "Verify your employer wallet"
    : "Verify your claim wallet";
}

function verifySubtitle(role: OnboardingRole) {
  return role === "employer"
    ? "Connect and sign with your wallet to confirm your employer identity before entering Zalary."
    : "Connect and sign with your wallet to confirm your claim identity before viewing salary claims.";
}

function signButtonText(role: OnboardingRole, hasWallet: boolean) {
  if (!hasWallet) {
    return role === "employer"
      ? "Connect & Verify Employer Identity"
      : "Connect & Verify Claim Identity";
  }

  return role === "employer"
    ? "Sign to Verify Employer Identity"
    : "Sign to Verify Claim Identity";
}

function verifyKicker(role: OnboardingRole) {
  return role === "employer" ? "Employer verification" : "Claim verification";
}

function flowTitle(wallet: string | null) {
  return wallet ? "Sign wallet message" : "Connect wallet";
}

function profileIsCompleted(profile: OnboardingProfile, role: OnboardingRole) {
  if (!profile.email_verified) return false;

  if (role === "employer") {
    return Boolean(
      profile.employer?.onboarding_completed &&
        profile.employer?.company_name &&
        profile.employer?.work_email,
    );
  }

  return Boolean(
    profile.employee?.onboarding_completed &&
      profile.employee?.notification_email &&
      profile.employee?.private_access_enabled,
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error !== null) {
    const possible = error as {
      message?: unknown;
      detail?: unknown;
      shortMessage?: unknown;
      response?: {
        data?: {
          detail?: unknown;
          error?: unknown;
          message?: unknown;
        };
      };
    };

    return String(
      possible.response?.data?.detail ??
        possible.response?.data?.error ??
        possible.response?.data?.message ??
        possible.shortMessage ??
        possible.detail ??
        possible.message ??
        "Please try again.",
    );
  }

  if (typeof error === "string") return error;

  return "Please try again.";
}

export function VerifyWalletPage({ role }: { role: OnboardingRole }) {
  const navigate = useNavigate();
  const toast = useToast();

  const { wallet, connecting, connect } = useWallet();

  const { loading, token, profile, refresh, loginWithWallet, isOnboarded } =
    useOnboarding();

  const [busy, setBusy] = React.useState(false);
  const [checking, setChecking] = React.useState(true);

  const flowStep = wallet ? 1 : 0;

  React.useEffect(() => {
    let alive = true;

    async function check() {
      try {
        await refresh();
      } catch {
        // Keep user on verification page if refresh fails.
      } finally {
        if (alive) setChecking(false);
      }
    }

    void check();

    return () => {
      alive = false;
    };
  }, [refresh]);

  React.useEffect(() => {
    if (loading || checking) return;

    if (token && profile && isOnboarded(role)) {
      navigate(dashboardFor(role), { replace: true });
      return;
    }

    if (token && profile && !isOnboarded(role)) {
      navigate(onboardingFor(role), { replace: true });
    }
  }, [loading, checking, token, profile, role, isOnboarded, navigate]);

  async function handleVerifyWallet() {
    if (busy || connecting) return;

    setBusy(true);

    try {
      /**
       * Make the verify button open the wallet popup if no wallet is active.
       * This avoids relying on stale wallet state.
       */
      if (!wallet) {
        await connect();
      }

      /**
       * loginWithWallet should:
       * 1. request nonce
       * 2. sign wallet message
       * 3. verify signature
       * 4. save onboarding token
       * 5. return profile
       */
      const verifiedProfile = await loginWithWallet(role);

      toast.push({
        kind: "success",
        title: "Wallet verified",
        message:
          role === "employer"
            ? "Your employer identity has been verified."
            : "Your claim identity has been verified.",
      });

      if (profileIsCompleted(verifiedProfile, role)) {
        navigate(dashboardFor(role), { replace: true });
      } else {
        navigate(onboardingFor(role), { replace: true });
      }
    } catch (error) {
      console.error("[VERIFY WALLET] failed", error);

      toast.push({
        kind: "error",
        title: "Wallet verification failed",
        message: getErrorMessage(error),
      });
    } finally {
      setBusy(false);
    }
  }

  if (loading || checking) {
    return (
      <div className="onboarding-page employer-onboarding-page verify-wallet-page dashboard-shell">
        <div className="employer-onboarding-head">
          <div>
            <div className="employer-kicker">{verifyKicker(role)}</div>
            <h1>Checking access</h1>
            <p>Confirming this wallet before opening your workspace.</p>
          </div>
        </div>

        <div className="onboarding-grid employer-onboarding-grid verify-wallet-grid">
          <Card
            className="employer-onboarding-card"
            title="Wallet status"
            subtitle="Please wait."
          >
            <div className="success-box employer-onboarding-note">
              Checking verification status...
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page employer-onboarding-page verify-wallet-page dashboard-shell">
      <div className="employer-onboarding-head">
        <div>
          <div className="employer-kicker">{verifyKicker(role)}</div>
          <h1>{verifyTitle(role)}</h1>
          <p>{verifySubtitle(role)}</p>
        </div>

        <div className="employer-onboarding-side">
          <div className="employer-onboarding-wallet">
            <span>{wallet ? "Connected wallet" : "Wallet status"}</span>
            <strong>{wallet ? formatAddress(wallet) : "Not connected"}</strong>
          </div>
        </div>
      </div>

      <div className="employer-onboarding-carousel verify-wallet-shell">
        <div className="employer-onboarding-flow-top">
          <div className="employer-onboarding-flow-copy">
            <span>Step 0{flowStep + 1}</span>
            <h2>{flowTitle(wallet)}</h2>
          </div>

          <div className="employer-onboarding-flow-count">
            {roleTitle(role)} access
          </div>
        </div>

        <div className="employer-onboarding-status verify-wallet-status">
          <button
            type="button"
            className={`employer-onboarding-status-item${
              !wallet ? " active" : " complete"
            }`}
            disabled
          >
            <span>{wallet ? <Check size={13} strokeWidth={2} /> : "01"}</span>
            <strong>Connect</strong>
            <small>{wallet ? "Connected" : "Wallet first"}</small>
          </button>

          <button
            type="button"
            className={`employer-onboarding-status-item${
              wallet ? " active" : ""
            }`}
            disabled
          >
            <span>02</span>
            <strong>Sign</strong>
            <small>Gasless proof</small>
          </button>
        </div>

        <Card
          className="employer-onboarding-card verify-wallet-card"
          title="Verify wallet ownership"
          subtitle="A gasless signature confirms that you control the connected wallet."
        >
          <div className="form-stack verify-wallet-stack">
            {wallet ? (
              <div className="employer-onboarding-wallet-card">
                <span>Connected wallet</span>
                <strong>{formatAddress(wallet)}</strong>
              </div>
            ) : (
              <div className="verify-wallet-connect">
                <p className="muted">
                  You can connect and sign in one step using the verification
                  button below, or connect first with this wallet button.
                </p>

                <WalletConnectButton />
              </div>
            )}

            <div className="employer-onboarding-slide-actions">
              <Button
                type="button"
                disabled={busy || connecting}
                onClick={() => void handleVerifyWallet()}
              >
                {busy || connecting
                  ? "Opening wallet..."
                  : signButtonText(role, Boolean(wallet))}
                <ArrowRight size={15} strokeWidth={1.8} />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}