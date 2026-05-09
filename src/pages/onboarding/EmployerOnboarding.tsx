import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Card, Field, useToast } from "../../components/ui";
import { useOnboarding } from "../../lib/onboarding";
import { formatAddress } from "../../lib/utils";

type EmployerOnboardingStep = 0 | 1 | 2;

const EMPLOYER_ONBOARDING_STEPS: {
  number: string;
  title: string;
  caption: string;
  step: EmployerOnboardingStep;
}[] = [
  { number: "01", title: "Wallet", caption: "Verified", step: 0 },
  { number: "02", title: "Profile", caption: "Company details", step: 1 },
  { number: "03", title: "Email", caption: "Confirm access", step: 2 },
];

const EMPLOYER_ONBOARDING_COPY: Record<
  EmployerOnboardingStep,
  { label: string; title: string }
> = {
  0: { label: "Step 01", title: "Wallet verified" },
  1: { label: "Step 02", title: "Company profile" },
  2: { label: "Step 03", title: "Email verification" },
};

function getEmployer(profile: any) {
  return profile?.employer ?? profile?.employer_profile ?? null;
}

function getWallet(profile: any) {
  return profile?.wallet_address ?? "";
}

function employerIsComplete(profile: any) {
  const employer = getEmployer(profile);

  return Boolean(
    profile?.email_verified &&
      employer &&
      employer.onboarding_completed &&
      String(employer.company_name ?? "").trim() &&
      String(employer.work_email ?? "").trim()
  );
}

export function EmployerOnboardingPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const {
    profile,
    token,
    loading,
    refresh,
    saveEmployerProfile,
    verifyEmail,
    isOnboarded,
  } = useOnboarding();

  const didInitialRefreshRef = React.useRef(false);
  const didHydrateFieldsRef = React.useRef(false);

  const [companyName, setCompanyName] = React.useState("");
  const [companySize, setCompanySize] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [profileSubmitted, setProfileSubmitted] = React.useState(false);
  const [dashboardUnlocked, setDashboardUnlocked] = React.useState(false);
  const [onboardingStep, setOnboardingStep] =
    React.useState<EmployerOnboardingStep>(1);

  React.useEffect(() => {
    if (didInitialRefreshRef.current) return;

    didInitialRefreshRef.current = true;
    setChecking(true);

    Promise.resolve(refresh())
      .catch(() => {
        // Never trap the onboarding page because profile refresh failed.
      })
      .finally(() => {
        setChecking(false);
      });
  }, [refresh]);

  React.useEffect(() => {
    if (!profile || didHydrateFieldsRef.current) return;

    const employer = getEmployer(profile);

    setCompanyName(String(employer?.company_name ?? ""));
    setCompanySize(String(employer?.company_size ?? ""));
    setEmail(String(employer?.work_email || profile.email || ""));

    if (profile.email_verified) {
      setOnboardingStep(2);
    } else if (employer?.company_name || employer?.work_email || profile.email) {
      setOnboardingStep(1);
    }

    didHydrateFieldsRef.current = true;
  }, [profile]);

  React.useEffect(() => {
    if (profile && employerIsComplete(profile)) {
      setDashboardUnlocked(true);
    }
  }, [profile]);

  React.useEffect(() => {
    if (loading || checking) return;

    if (!token || !profile) {
      navigate("/verify/employer", { replace: true });
    }
  }, [loading, checking, token, profile, navigate]);

  const emailVerified = Boolean(profile?.email_verified);

  const employerReady = Boolean(
    dashboardUnlocked ||
      (token && profile && (isOnboarded("employer") || employerIsComplete(profile)))
  );

  const profileSaved = Boolean(
    profileSubmitted || (companyName.trim() && email.trim())
  );

  const activeStepCopy = EMPLOYER_ONBOARDING_COPY[onboardingStep];

  function canOpenStep(step: EmployerOnboardingStep) {
    if (step === 0) return true;
    if (step === 1) return true;
    if (step === 2) return profileSaved || emailVerified;
    return true;
  }

  function goToStep(step: EmployerOnboardingStep) {
    if (!canOpenStep(step)) return;
    setOnboardingStep(step);
  }

  async function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!companyName.trim()) {
      toast.push({
        kind: "error",
        title: "Company name required",
        message: "Enter your company name before continuing.",
      });
      return;
    }

    if (!email.trim()) {
      toast.push({
        kind: "error",
        title: "Work email required",
        message: "Enter your work email before continuing.",
      });
      return;
    }

    setBusy(true);

    try {
      const result = await saveEmployerProfile({
        company_name: companyName.trim(),
        company_size: companySize.trim(),
        email: email.trim().toLowerCase(),
      });

      if (result.dev_email_code) {
        console.debug(
          "[EmployerOnboarding] Dev email code:",
          result.dev_email_code
        );
      }

      setProfileSubmitted(true);
      setOnboardingStep(2);

      toast.push({
        kind: "success",
        title: "Company profile saved",
        message: "We sent a verification code to your work email.",
      });

      const latestProfile = await refresh();

      if (employerIsComplete(latestProfile)) {
        setDashboardUnlocked(true);
      }
    } catch (error) {
      toast.push({
        kind: "error",
        title: "Could not save profile",
        message: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyEmail(event: React.FormEvent) {
    event.preventDefault();

    if (!code.trim()) {
      toast.push({
        kind: "error",
        title: "Verification code required",
        message: "Enter the verification code sent to your work email.",
      });
      return;
    }

    setBusy(true);

    try {
      const updatedProfile = await verifyEmail({
        code: code.trim(),
        email: email.trim().toLowerCase(),
      });

      const latestProfile = await refresh();

      const complete =
        employerIsComplete(updatedProfile) ||
        employerIsComplete(latestProfile) ||
        isOnboarded("employer");

      if (complete) {
        setDashboardUnlocked(true);
      }

      toast.push({
        kind: "success",
        title: complete ? "Employer onboarding complete" : "Email verified",
        message: complete
          ? "Your employer dashboard is now unlocked."
          : "Email verified. Use Open Dashboard after profile confirmation.",
      });
    } catch (error) {
      toast.push({
        kind: "error",
        title: "Verification failed",
        message: error instanceof Error ? error.message : "Invalid code.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenDashboard() {
    setBusy(true);

    try {
      const latestProfile = await refresh();

      const complete =
        employerIsComplete(latestProfile) || isOnboarded("employer");

      if (!complete) {
        toast.push({
          kind: "error",
          title: "Onboarding not complete",
          message: "Save your company profile and verify your work email first.",
        });
        return;
      }

      setDashboardUnlocked(true);
      navigate("/employer", { replace: true });
    } finally {
      setBusy(false);
    }
  }

  if (!token || !profile) {
    return (
      <div className="onboarding-page employer-onboarding-page dashboard-shell">
        <div className="employer-onboarding-head">
          <div>
            <div className="employer-kicker">Employer onboarding</div>
            <h1>Wallet verification required</h1>
            <p>
              Connect and sign with your employer wallet before opening your
              company payroll workspace.
            </p>
          </div>
        </div>

        <div className="onboarding-grid employer-onboarding-grid">
          <Card
            className="employer-onboarding-card"
            title="Employer access"
            subtitle="Your Zama FHE employer profile is not loaded yet."
          >
            <div className="success-box employer-onboarding-note">
              Continue to wallet verification to restore your employer session.
            </div>

            <div className="employer-onboarding-slide-actions">
              <button
                type="button"
                className="btn decrypt-hover-btn"
                onClick={() => navigate("/verify/employer", { replace: true })}
              >
                Verify Employer Wallet
                <ArrowRight size={15} strokeWidth={1.8} />
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page employer-onboarding-page dashboard-shell">
      <div className="employer-onboarding-head">
        <div>
          <div className="employer-kicker">Employer onboarding</div>
          <h1>Company setup</h1>
          <p>Add the company identity connected to your verified payroll wallet.</p>
        </div>

        <div className="employer-onboarding-side">
          <div className="employer-onboarding-wallet">
            <span>Verified wallet</span>
            <strong>{formatAddress(getWallet(profile))}</strong>
          </div>
        </div>
      </div>

      <div className="employer-onboarding-carousel">
        <div className="employer-onboarding-flow-top">
          <div className="employer-onboarding-flow-copy">
            <span>{activeStepCopy.label}</span>
            <h2>{activeStepCopy.title}</h2>
          </div>

          <div className="employer-onboarding-flow-count">
            Step {onboardingStep + 1} of {EMPLOYER_ONBOARDING_STEPS.length}
          </div>
        </div>

        <div
          className="employer-onboarding-status"
          aria-label="Employer onboarding progress"
        >
          {EMPLOYER_ONBOARDING_STEPS.map((step) => {
            const active = step.step === onboardingStep;
            const complete =
              step.step === 0 ||
              (step.step === 1 && profileSaved) ||
              (step.step === 2 && emailVerified);
            const disabled = !canOpenStep(step.step);

            return (
              <button
                key={step.number}
                type="button"
                className={`employer-onboarding-status-item${
                  active ? " active" : ""
                }${complete ? " complete" : ""}`}
                onClick={() => goToStep(step.step)}
                disabled={disabled}
                aria-current={active ? "step" : undefined}
              >
                <span>
                  {complete ? (
                    <Check size={13} strokeWidth={2} />
                  ) : (
                    step.number
                  )}
                </span>

                <strong>{step.title}</strong>

                <small>
                  {step.step === 2 && emailVerified
                    ? "Verified"
                    : step.caption}
                </small>
              </button>
            );
          })}
        </div>

        <div className="employer-onboarding-carousel-viewport">
          {onboardingStep === 0 && (
            <div className="employer-onboarding-slide employer-onboarding-slide-active">
              <Card
                className="employer-onboarding-card"
                title="Wallet verified"
                subtitle="This wallet is attached to your employer workspace."
              >
                <div className="employer-onboarding-wallet-card">
                  <span>Verified wallet</span>
                  <strong>{formatAddress(getWallet(profile))}</strong>
                </div>

                <div className="employer-onboarding-slide-actions">
                  <button
                    type="button"
                    className="btn decrypt-hover-btn"
                    onClick={() => goToStep(1)}
                  >
                    Continue to Profile
                    <ArrowRight size={15} strokeWidth={1.8} />
                  </button>
                </div>
              </Card>
            </div>
          )}

          {onboardingStep === 1 && (
            <div className="employer-onboarding-slide employer-onboarding-slide-active">
              <Card
                className="employer-onboarding-card"
                title="Company profile"
                subtitle="Workspace details for payroll operations."
              >
                <form className="form-stack" onSubmit={handleProfileSubmit}>
                  <Field label="Company name">
                    <input
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      placeholder="Zalary Labs"
                      required
                    />
                  </Field>

                  <Field label="Work email">
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="payroll@company.com"
                      required
                    />
                  </Field>

                  <Field label="Company size optional">
                    <input
                      value={companySize}
                      onChange={(event) => setCompanySize(event.target.value)}
                      placeholder="11-50 employees"
                    />
                  </Field>

                  <div className="employer-onboarding-slide-actions">
                    <button
                      type="button"
                      className="btn secondary decrypt-hover-btn"
                      onClick={() => goToStep(0)}
                    >
                      <ArrowLeft size={15} strokeWidth={1.8} />
                      Back
                    </button>

                    <button
                      type="submit"
                      className="btn decrypt-hover-btn"
                      disabled={busy}
                    >
                      {busy ? "Saving..." : "Save Company Profile"}
                      <ArrowRight size={15} strokeWidth={1.8} />
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          )}

          {onboardingStep === 2 && (
            <div className="employer-onboarding-slide employer-onboarding-slide-active">
              <Card
                className="employer-onboarding-card"
                title="Verify email"
                subtitle="Confirm alerts and payroll communication."
              >
                {emailVerified ? (
                  <div className="form-stack">
                    <div className="success-box employer-onboarding-note">
                      Email verified:{" "}
                      <strong>
                        {getEmployer(profile)?.work_email || profile.email}
                      </strong>
                    </div>

                    <div className="employer-onboarding-slide-actions">
                      <button
                        type="button"
                        className="btn secondary decrypt-hover-btn"
                        onClick={() => goToStep(1)}
                      >
                        <ArrowLeft size={15} strokeWidth={1.8} />
                        Back
                      </button>

                      <button
                        type="button"
                        className="btn decrypt-hover-btn"
                        disabled={busy || !employerReady}
                        onClick={handleOpenDashboard}
                      >
                        {busy
                          ? "Checking..."
                          : employerReady
                            ? "Open Dashboard"
                            : "Complete Profile First"}
                        <ArrowRight size={15} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <form className="form-stack" onSubmit={handleVerifyEmail}>
                    <p className="muted">
                      We sent a verification code to your work email. Enter the
                      code below to complete employer onboarding.
                    </p>

                    <Field label="Verification code">
                      <input
                        value={code}
                        onChange={(event) => setCode(event.target.value)}
                        placeholder="6-digit code"
                        required
                      />
                    </Field>

                    <div className="employer-onboarding-slide-actions">
                      <button
                        type="button"
                        className="btn secondary decrypt-hover-btn"
                        onClick={() => goToStep(1)}
                      >
                        <ArrowLeft size={15} strokeWidth={1.8} />
                        Back
                      </button>

                      <button
                        type="submit"
                        className="btn decrypt-hover-btn"
                        disabled={busy}
                      >
                        {busy ? "Verifying..." : "Verify Email"}
                        <ArrowRight size={15} strokeWidth={1.8} />
                      </button>
                    </div>
                  </form>
                )}
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}