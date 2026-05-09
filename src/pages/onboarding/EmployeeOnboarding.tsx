import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Card, Field, useToast } from "../../components/ui";
import { useOnboarding } from "../../lib/onboarding";
import { formatAddress } from "../../lib/utils";

type EmployeeOnboardingStep = 0 | 1 | 2 | 3;

const EMPLOYEE_ONBOARDING_STEPS: {
  number: string;
  title: string;
  caption: string;
  step: EmployeeOnboardingStep;
}[] = [
  { number: "01", title: "Wallet", caption: "Verified", step: 0 },
  { number: "02", title: "Profile", caption: "Employee details", step: 1 },
  { number: "03", title: "Email", caption: "Confirm access", step: 2 },
  { number: "04", title: "Private", caption: "Claim access", step: 3 },
];

const EMPLOYEE_ONBOARDING_COPY: Record<
  EmployeeOnboardingStep,
  { label: string; title: string }
> = {
  0: { label: "Step 01", title: "Wallet verified" },
  1: { label: "Step 02", title: "Employee profile" },
  2: { label: "Step 03", title: "Email verification" },
  3: { label: "Step 04", title: "Private payroll access" },
};

function getEmployee(profile: any) {
  return profile?.employee ?? profile?.employee_profile ?? null;
}

function getWallet(profile: any) {
  return profile?.wallet_address ?? "";
}

function employeeHasNotificationEmail(profile: any) {
  const employee = getEmployee(profile);
  return Boolean(String(employee?.notification_email ?? "").trim());
}

function employeeIsComplete(profile: any) {
  const employee = getEmployee(profile);

  return Boolean(
    profile?.email_verified &&
      employee &&
      employee.onboarding_completed &&
      String(employee.notification_email ?? "").trim() &&
      employee.private_access_enabled,
  );
}

function employeeMissingReason(profile: any) {
  const employee = getEmployee(profile);

  if (!employee) return "Employee profile is missing.";
  if (!String(employee.notification_email ?? "").trim()) {
    return "Add and save your notification email first.";
  }
  if (!profile?.email_verified) return "Verify your notification email first.";
  if (!employee.private_access_enabled) return "Enable private access first.";
  if (!employee.onboarding_completed) {
    return "Local demo state has not marked employee onboarding as complete yet.";
  }

  return "Employee onboarding is incomplete.";
}

export function EmployeeOnboardingPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const {
    profile,
    token,
    loading,
    refresh,
    saveEmployeeProfile,
    verifyEmail,
    markEmployeePrivateAccess,
    isOnboarded,
  } = useOnboarding();

  const didInitialRefreshRef = React.useRef(false);
  const didHydrateFieldsRef = React.useRef(false);

  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [checking, setChecking] = React.useState(false);
  const [profileSubmitted, setProfileSubmitted] = React.useState(false);
  const [privateAccessUnlocked, setPrivateAccessUnlocked] =
    React.useState(false);
  const [onboardingStep, setOnboardingStep] =
    React.useState<EmployeeOnboardingStep>(1);

  React.useEffect(() => {
    if (didInitialRefreshRef.current) return;

    didInitialRefreshRef.current = true;
    setChecking(true);

    Promise.resolve(refresh())
      .catch(() => {
        // Never trap onboarding because profile refresh failed.
      })
      .finally(() => {
        setChecking(false);
      });
  }, [refresh]);

  React.useEffect(() => {
    if (!profile || didHydrateFieldsRef.current) return;

    const employee = getEmployee(profile);
    const savedNotificationEmail = String(employee?.notification_email ?? "");

    setDisplayName(String(employee?.display_name ?? ""));

    /**
     * Prefill the field with profile.email only for convenience,
     * but do NOT treat it as saved until demo state returns employee.notification_email.
     */
    setEmail(savedNotificationEmail || String(profile.email ?? ""));

    if (employeeIsComplete(profile)) {
      setPrivateAccessUnlocked(true);
      setOnboardingStep(3);
    } else if (employee?.private_access_enabled && !savedNotificationEmail) {
      /**
       * Root fix:
       * Private access can be enabled while profile email is still missing.
       * In that case, force the user back to Profile step.
       */
      setOnboardingStep(1);
    } else if (profile.email_verified && savedNotificationEmail) {
      setOnboardingStep(3);
    } else if (savedNotificationEmail || profile.email) {
      setOnboardingStep(1);
    }

    didHydrateFieldsRef.current = true;
  }, [profile]);

  React.useEffect(() => {
    if (profile && employeeIsComplete(profile)) {
      setPrivateAccessUnlocked(true);
    }
  }, [profile]);

  React.useEffect(() => {
    if (loading || checking) return;

    if (!token || !profile) {
      navigate("/verify/employee", { replace: true });
    }
  }, [loading, checking, token, profile, navigate]);

  const employee = getEmployee(profile);
  const emailVerified = Boolean(profile?.email_verified);
  const hasNotificationEmail = employeeHasNotificationEmail(profile);

  const privateAccessEnabled = Boolean(employee?.private_access_enabled);

  /**
   * Root fix:
   * Employee is ready ONLY when demo state says the employee record is complete.
   * Private access alone is not enough.
   */
  const employeeReady = Boolean(
    token &&
      profile &&
      (employeeIsComplete(profile) || isOnboarded("employee")),
  );

  /**
   * Root fix:
   * Do not use email input/profile.email as “saved profile”.
   * Only demo state employee.notification_email means the profile was saved.
   */
  const profileSaved = Boolean(profileSubmitted || hasNotificationEmail);

  const activeStepCopy = EMPLOYEE_ONBOARDING_COPY[onboardingStep];

  function canOpenStep(step: EmployeeOnboardingStep) {
    if (step === 0) return true;
    if (step === 1) return true;
    if (step === 2) return profileSaved || Boolean(email.trim());
    if (step === 3) return hasNotificationEmail && emailVerified;
    return true;
  }

  function goToStep(step: EmployeeOnboardingStep) {
    if (!canOpenStep(step)) {
      if (step === 3 && !hasNotificationEmail) {
        toast.push({
          kind: "error",
          title: "Employee profile incomplete",
          message: "Save your notification email before enabling private access.",
        });
      }
      return;
    }

    setOnboardingStep(step);
  }

  async function handleProfileSubmit(event: React.FormEvent) {
    event.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      toast.push({
        kind: "error",
        title: "Notification email required",
        message: "Enter your email before continuing.",
      });
      return;
    }

    setBusy(true);

    try {
      const result = await saveEmployeeProfile({
        display_name: displayName.trim(),
        email: cleanEmail,
      });

      if (result.dev_email_code) {
        console.debug(
          "[EmployeeOnboarding] Dev email code:",
          result.dev_email_code,
        );
      }

      setProfileSubmitted(true);

      const latestProfile = await refresh();
      const latestEmployee = getEmployee(latestProfile);

      if (!String(latestEmployee?.notification_email ?? "").trim()) {
        toast.push({
          kind: "error",
          title: "Profile did not save correctly",
          message:
            "Local demo state still has no notification email. Please try saving again.",
        });
        setOnboardingStep(1);
        return;
      }

      setOnboardingStep(2);

      toast.push({
        kind: "success",
        title: "Employee profile saved",
        message: "We sent a verification code to your email.",
      });

      if (employeeIsComplete(latestProfile)) {
        setPrivateAccessUnlocked(true);
      }
    } catch (error) {
      toast.push({
        kind: "error",
        title: "Could not save employee profile",
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
        message: "Enter the verification code sent to your email.",
      });
      return;
    }

    if (!hasNotificationEmail) {
      toast.push({
        kind: "error",
        title: "Employee profile incomplete",
        message: "Save your notification email before verifying email.",
      });
      setOnboardingStep(1);
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
        employeeIsComplete(updatedProfile) ||
        employeeIsComplete(latestProfile) ||
        isOnboarded("employee");

      if (complete) {
        setPrivateAccessUnlocked(true);
      }

      setOnboardingStep(3);

      toast.push({
        kind: "success",
        title: complete ? "Employee onboarding complete" : "Email verified",
        message: complete
          ? "Your employee claims workspace is now unlocked."
          : "Email verified. Enable private access to finish onboarding.",
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

  async function handleEnablePrivateAccess() {
    if (!hasNotificationEmail) {
      toast.push({
        kind: "error",
        title: "Employee profile incomplete",
        message: "Save your notification email before enabling private access.",
      });
      setOnboardingStep(1);
      return;
    }

    if (!emailVerified) {
      toast.push({
        kind: "error",
        title: "Email not verified",
        message: "Verify your notification email before enabling private access.",
      });
      setOnboardingStep(2);
      return;
    }

    setBusy(true);

    try {
      const latestProfile = await markEmployeePrivateAccess();

      const complete =
        employeeIsComplete(latestProfile) || isOnboarded("employee");

      if (complete) {
        setPrivateAccessUnlocked(true);
      }

      toast.push({
        kind: complete ? "success" : "error",
        title: complete ? "Employee onboarding complete" : "Still incomplete",
        message: complete
          ? "Your employee claims workspace is now unlocked."
          : employeeMissingReason(latestProfile),
      });
    } catch (error) {
      toast.push({
        kind: "error",
        title: "Could not enable private access",
        message: error instanceof Error ? error.message : "Try again.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleOpenClaims() {
    setBusy(true);

    try {
      const latestProfile = await refresh();

      const complete =
        employeeIsComplete(latestProfile) || isOnboarded("employee");

      if (!complete) {
        toast.push({
          kind: "error",
          title: "Employee onboarding is not complete",
          message: employeeMissingReason(latestProfile),
        });

        const latestEmployee = getEmployee(latestProfile);

        if (!String(latestEmployee?.notification_email ?? "").trim()) {
          setOnboardingStep(1);
        } else if (!latestProfile?.email_verified) {
          setOnboardingStep(2);
        } else {
          setOnboardingStep(3);
        }

        return;
      }

      setPrivateAccessUnlocked(true);
      navigate("/employee/claims", { replace: true });
    } finally {
      setBusy(false);
    }
  }

  if (!token || !profile) {
    return (
      <div className="onboarding-page employer-onboarding-page dashboard-shell">
        <div className="employer-onboarding-head">
          <div>
            <div className="employer-kicker">Employee onboarding</div>
            <h1>Wallet verification required</h1>
            <p>
              Connect and sign with your employee wallet before opening your
              private claims workspace.
            </p>
          </div>
        </div>

        <div className="onboarding-grid employer-onboarding-grid">
          <Card
            className="employer-onboarding-card"
            title="Employee access"
            subtitle="Your Zama FHE employee profile is not loaded yet."
          >
            <div className="success-box employer-onboarding-note">
              Continue to wallet verification to restore your employee session.
            </div>

            <div className="employer-onboarding-slide-actions">
              <button
                type="button"
                className="btn decrypt-hover-btn"
                onClick={() => navigate("/verify/employee", { replace: true })}
              >
                Verify Employee Wallet
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
          <div className="employer-kicker">Employee onboarding</div>
          <h1>Private access setup</h1>
          <p>Add the employee identity connected to your verified payroll wallet.</p>
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
            Step {onboardingStep + 1} of {EMPLOYEE_ONBOARDING_STEPS.length}
          </div>
        </div>

        <div
          className="employer-onboarding-status"
          aria-label="Employee onboarding progress"
        >
          {EMPLOYEE_ONBOARDING_STEPS.map((step) => {
            const active = step.step === onboardingStep;
            const complete =
              step.step === 0 ||
              (step.step === 1 && hasNotificationEmail) ||
              (step.step === 2 && emailVerified) ||
              (step.step === 3 && employeeReady);
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
                  {step.step === 1 && hasNotificationEmail
                    ? "Saved"
                    : step.step === 2 && emailVerified
                      ? "Verified"
                      : step.step === 3 && employeeReady
                        ? "Ready"
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
                subtitle="This wallet is attached to your employee workspace."
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
                title="Employee profile"
                subtitle="Workspace details for private payroll claims."
              >
                <form className="form-stack" onSubmit={handleProfileSubmit}>
                  <Field label="Display name optional">
                    <input
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="Tolu"
                    />
                  </Field>

                  <Field label="Notification email">
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="employee@company.com"
                      required
                    />
                  </Field>

                  {employee?.private_access_enabled && !hasNotificationEmail && (
                    <div className="error-box">
                      Private access is enabled, but local demo state still has no
                      notification email. Save this profile to complete onboarding.
                    </div>
                  )}

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
                      {busy ? "Saving..." : "Save Employee Profile"}
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
                subtitle="Confirm alerts and claim communication."
              >
                {emailVerified ? (
                  <div className="form-stack">
                    <div className="success-box employer-onboarding-note">
                      Email verified:{" "}
                      <strong>
                        {getEmployee(profile)?.notification_email ||
                          profile.email}
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
                        disabled={!hasNotificationEmail}
                        onClick={() => goToStep(3)}
                      >
                        Continue to Private Access
                        <ArrowRight size={15} strokeWidth={1.8} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <form className="form-stack" onSubmit={handleVerifyEmail}>
                    <p className="muted">
                      We sent a verification code to your email. Enter the code
                      below to continue.
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

          {onboardingStep === 3 && (
            <div className="employer-onboarding-slide employer-onboarding-slide-active">
              <Card
                className="employer-onboarding-card"
                title="Private access"
                subtitle="Enable private payroll claim access for this wallet."
              >
                <div className="form-stack">
                  <div
                    className={
                      employeeReady
                        ? "success-box employer-onboarding-note"
                        : "error-box"
                    }
                  >
                    {employeeReady
                      ? "Employee onboarding is complete. Claims access is ready."
                      : employee?.private_access_enabled
                        ? `Private access is enabled, but onboarding is not complete. ${employeeMissingReason(
                            profile,
                          )}`
                        : "Enable private access after saving and verifying your notification email."}
                  </div>

                  <div className="employer-onboarding-slide-actions">
                    <button
                      type="button"
                      className="btn secondary decrypt-hover-btn"
                      onClick={() => goToStep(2)}
                    >
                      <ArrowLeft size={15} strokeWidth={1.8} />
                      Back
                    </button>

                    {!privateAccessEnabled && (
                      <button
                        type="button"
                        className="btn decrypt-hover-btn"
                        disabled={busy || !emailVerified || !hasNotificationEmail}
                        onClick={handleEnablePrivateAccess}
                      >
                        {busy ? "Enabling..." : "Enable Private Access"}
                        <ArrowRight size={15} strokeWidth={1.8} />
                      </button>
                    )}

                    {privateAccessEnabled && (
                      <button
                        type="button"
                        className="btn decrypt-hover-btn"
                        disabled={busy || !employeeReady}
                        onClick={handleOpenClaims}
                      >
                        {busy
                          ? "Checking..."
                          : employeeReady
                            ? "Open Claims"
                            : "Complete Profile First"}
                        <ArrowRight size={15} strokeWidth={1.8} />
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
