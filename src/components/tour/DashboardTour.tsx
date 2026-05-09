import React from "react";
import { TourProvider, useTour, type ProviderProps, type StepType } from "@reactour/tour";
import { useLocation } from "react-router-dom";
import { useOnboarding, type OnboardingRole } from "../../lib/onboarding";
import { useWallet } from "../../lib/wallet";

type DashboardTourRole = Extract<OnboardingRole, "employer" | "employee">;

const TOUR_VERSION = "v1";

function TourContent({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-tour-content">
      <div className="dashboard-tour-eyebrow">{eyebrow}</div>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 768px)").matches;
}

function stepsFor(role: DashboardTourRole): StepType[] {
  const includeSidebar = !isMobileViewport();

  if (role === "employer") {
    return [
      ...(includeSidebar
        ? [
            {
              selector: '[data-tour="nav-employer"]',
              position: "right" as const,
              content: (
                <TourContent eyebrow="Navigation" title="Employer workspace">
                  This tab holds payroll, funding status, and the actions needed to move a run on-chain.
                </TourContent>
              ),
            },
          ]
        : []),
      {
        selector: '[data-tour="employer-hero"]',
        position: "bottom" as const,
        content: (
          <TourContent eyebrow="Overview" title="Payroll command center">
            Start here for the connected employer wallet, current payroll health, and high-level funding context.
          </TourContent>
        ),
      },
      {
        selector: '[data-tour="employer-new-template"]',
        position: "left" as const,
        content: (
          <TourContent eyebrow="Setup" title="Create payroll">
            Payroll defines who gets paid, how much they receive, and when payroll runs should be created.
          </TourContent>
        ),
      },
      {
        selector: '[data-tour="employer-stats"]',
        position: "bottom" as const,
        content: (
          <TourContent eyebrow="Signals" title="Track what needs attention">
            Use these numbers to spot funding needs, pending actions, and how many active payroll entries are live.
          </TourContent>
        ),
      },
      {
        selector: '[data-tour="employer-templates"]',
        position: "top" as const,
        content: (
          <TourContent eyebrow="Operations" title="Manage payroll">
            Search, filter, open, and review payroll before running or funding confidential payroll.
          </TourContent>
        ),
      },
    ];
  }

  return [
    ...(includeSidebar
      ? [
          {
            selector: '[data-tour="nav-employee"]',
            position: "right" as const,
            content: (
              <TourContent eyebrow="Navigation" title="Employee claims">
                This tab is where an employee tracks private salary claims linked to their wallet.
              </TourContent>
            ),
          },
        ]
      : []),
    {
      selector: '[data-tour="employee-header"]',
      position: "bottom" as const,
      content: (
        <TourContent eyebrow="Overview" title="Your claim workspace">
          This page shows payroll runs that include your connected employee wallet.
        </TourContent>
      ),
    },
    {
      selector: '[data-tour="employee-claims-card"]',
      position: "top" as const,
      content: (
        <TourContent eyebrow="Claims" title="Review available salary">
          Claimable runs appear here once an employer activates payroll for your address.
        </TourContent>
      ),
    },
    {
      selector: '[data-tour="employee-refresh"]',
      position: "left" as const,
      content: (
        <TourContent eyebrow="Sync" title="Refresh claimables">
          Use refresh after an employer activates a run or when you have just connected a wallet.
        </TourContent>
      ),
    },
  ];
}

function tourRoleForPath(pathname: string): DashboardTourRole | null {
  if (pathname === "/employer") return "employer";
  if (pathname === "/employee/claims") return "employee";
  return null;
}

function completionKey(role: DashboardTourRole, wallet: string) {
  return `zalary-tour:${role}:${wallet.toLowerCase()}:${TOUR_VERSION}`;
}

function isCompleted(role: DashboardTourRole, wallet: string) {
  return localStorage.getItem(completionKey(role, wallet)) === "done";
}

function markCompleted(role: DashboardTourRole, wallet: string) {
  localStorage.setItem(completionKey(role, wallet), "done");
}

function allTargetsExist(steps: StepType[]) {
  return steps.every((step) => {
    if (typeof step.selector !== "string") return true;
    return Boolean(document.querySelector(step.selector));
  });
}

function DashboardTourController() {
  const location = useLocation();
  const { wallet } = useWallet();
  const { loading, isOnboarded } = useOnboarding();
  const { isOpen, setCurrentStep, setIsOpen, setSteps } = useTour();
  const openSessionRef = React.useRef<{
    role: DashboardTourRole;
    wallet: string;
  } | null>(null);
  const wasOpenRef = React.useRef(false);

  React.useEffect(() => {
    if (isOpen) {
      wasOpenRef.current = true;
      return;
    }

    if (wasOpenRef.current && openSessionRef.current) {
      markCompleted(openSessionRef.current.role, openSessionRef.current.wallet);
      openSessionRef.current = null;
      wasOpenRef.current = false;
    }
  }, [isOpen]);

  React.useEffect(() => {
    const role = tourRoleForPath(location.pathname);
    if (!role || !wallet || loading || isOpen || !setSteps) return;
    if (!isOnboarded(role) || isCompleted(role, wallet)) return;

    const steps = stepsFor(role);
    let cancelled = false;
    let attempts = 0;
    let retryId: number | undefined;

    const startWhenReady = () => {
      if (cancelled) return;

      if (allTargetsExist(steps)) {
        setSteps(steps);
        setCurrentStep(0);
        openSessionRef.current = { role, wallet };
        setIsOpen(true);
        return;
      }

      attempts += 1;
      if (attempts < 24) {
        retryId = window.setTimeout(startWhenReady, 125);
      }
    };

    retryId = window.setTimeout(startWhenReady, 350);

    return () => {
      cancelled = true;
      if (retryId) window.clearTimeout(retryId);
    };
  }, [
    location.pathname,
    wallet,
    loading,
    isOpen,
    isOnboarded,
    setCurrentStep,
    setIsOpen,
    setSteps,
  ]);

  return null;
}

const tourStyles: ProviderProps["styles"] = {
  popover: (base) => ({
    ...base,
    "--reactour-accent": "var(--z-accent)",
    background: "#15191a",
    border: "1px solid rgba(255,255,255,0.12)",
    borderRadius: "8px",
    color: "var(--z-text)",
    padding: "1rem",
    boxShadow: "0 20px 70px rgba(0,0,0,0.55)",
    maxWidth: "340px",
  }),
  maskWrapper: (base) => ({
    ...base,
    color: "rgba(0,0,0,0.72)",
  }),
  maskArea: (base) => ({
    ...base,
    rx: 8,
  }),
  badge: (base) => ({
    ...base,
    background: "var(--z-accent)",
    color: "#050505",
    fontFamily: "var(--z-mono)",
    fontSize: "0.62rem",
  }),
  controls: (base) => ({
    ...base,
    marginTop: "0.9rem",
  }),
  button: (base, state) => ({
    ...base,
    background: state?.kind === "next" ? "var(--z-accent)" : "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "6px",
    color: state?.kind === "next" ? "#050505" : "rgba(255,255,255,0.82)",
    fontFamily: "var(--z-mono)",
    fontSize: "0.62rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  }),
  dot: (base, state) => ({
    ...base,
    background: state?.current ? "var(--z-accent)" : "rgba(255,255,255,0.22)",
  }),
  close: (base) => ({
    ...base,
    color: "rgba(255,255,255,0.52)",
  }),
};

export function DashboardTourProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <TourProvider
      steps={[]}
      styles={tourStyles}
      padding={{ mask: 12, wrapper: 8 }}
      scrollSmooth
      showBadge
      showCloseButton
      showDots
      showNavigation
      showPrevNextButtons
      disableInteraction={false}
      disableDotsNavigation={false}
      accessibilityOptions={{
        closeButtonAriaLabel: "Close dashboard tour",
        showNavigationScreenReaders: true,
      }}
    >
      {children}
      <DashboardTourController />
    </TourProvider>
  );
}



