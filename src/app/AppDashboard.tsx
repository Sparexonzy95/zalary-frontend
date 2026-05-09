import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  BriefcaseBusiness,
  CircleUserRound,
  LogOut,
  Menu,
  Settings,
  WalletCards,
  X,
} from "lucide-react";
import React from "react";
import { DashboardTourProvider } from "../components/tour/DashboardTour";
import { useOnboarding } from "../lib/onboarding";
import { useWallet } from "../lib/wallet";

const LOGO =
  "https://res.cloudinary.com/dxmdwvmxl/image/upload/v1776941645/logo_zalary2_mm8mlp.png";
const DASHBOARD_DECRYPT_CHARS = "01ZALARYZAMAFHE#$%";
const DASHBOARD_DECRYPT_DURATION_MS = 520;

function dashboardTabFor(pathname: string) {
  if (
    pathname === "/app" ||
    pathname.startsWith("/employer") ||
    pathname === "/verify/employer" ||
    pathname === "/onboarding/employer"
  ) {
    return "employer";
  }

  if (
    pathname.startsWith("/employee") ||
    pathname === "/verify/employee" ||
    pathname === "/onboarding/employee"
  ) {
    return "employee";
  }

  if (pathname.startsWith("/account")) {
    return "account";
  }

  return "dashboard";
}

function decryptLabel(value: string, progress: number, salt: number) {
  const revealCount = Math.floor(value.length * progress);
  const noiseFrame = Math.floor(progress * DASHBOARD_DECRYPT_CHARS.length * 2);

  return Array.from(value)
    .map((char, index) => {
      if (!/[a-z0-9]/i.test(char) || index < revealCount) return char;
      return DASHBOARD_DECRYPT_CHARS[
        (index + salt * 3 + noiseFrame) % DASHBOARD_DECRYPT_CHARS.length
      ];
    })
    .join("");
}

function useDecryptLabel(label: string, active: boolean) {
  const [displayLabel, setDisplayLabel] = React.useState(label);

  React.useEffect(() => {
    if (!active) {
      setDisplayLabel(label);
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplayLabel(label);
      return;
    }

    let animationFrame = 0;
    const start = performance.now();
    const salt = label.length;

    const renderFrame = (now: number) => {
      const elapsed = now - start;
      const linearProgress = Math.min(
        elapsed / DASHBOARD_DECRYPT_DURATION_MS,
        1
      );
      const easedProgress = 1 - Math.pow(1 - linearProgress, 3);

      setDisplayLabel(decryptLabel(label, easedProgress, salt));

      if (linearProgress < 1) {
        animationFrame = requestAnimationFrame(renderFrame);
      }
    };

    setDisplayLabel(decryptLabel(label, 0, salt));
    animationFrame = requestAnimationFrame(renderFrame);

    return () => cancelAnimationFrame(animationFrame);
  }, [active, label]);

  return displayLabel;
}

function DecryptNavLabel({
  label,
  active,
}: {
  label: string;
  active: boolean;
}) {
  const displayLabel = useDecryptLabel(label, active);
  return (
    <span className="sidebar-decrypt-label" aria-label={label}>
      {displayLabel}
    </span>
  );
}

function IconX() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2H21.5l-7.6 8.66L22 22h-6.5l-5.1-6.7L4.5 22H1.25l8.1-9.2L2 2h6.7l4.6 6.1L18.244 2Zm-1.13 18h1.8L6.3 3.9H4.4L17.114 20Z" />
    </svg>
  );
}

export function AppDashboard() {
  const { wallet, disconnect } = useWallet();
  const { logout } = useOnboarding();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = dashboardTabFor(location.pathname);
  const isWelcomeRoute = location.pathname === "/app";
  const employerActive = activeTab === "employer";
  const employeeActive = activeTab === "employee";
  const accountActive = activeTab === "account";

  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const shortWallet = wallet
    ? `${wallet.slice(0, 6)}…${wallet.slice(-4)}`
    : null;

  function handleRoleNav(e: React.MouseEvent, to: string) {
    if (!wallet) {
      e.preventDefault();
      navigate(to.startsWith("/employee") ? "/verify/employee" : "/verify/employer");
    }
  }

  function handleLogout() {
    logout();
    disconnect();
  }

  return (
    <DashboardTourProvider>
    <div className="app-dashboard">
      {/* Sidebar overlay (mobile) */}
      <div
        className={`sidebar-overlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`app-sidebar${sidebarOpen ? " open" : ""}`}>

        {/* Brand */}
        <div className="sidebar-brand">
          <Link to="/app" className="sidebar-logo">
            <img src={LOGO} alt="Zalary" />
          </Link>
        </div>

        <div className="sidebar-divider-h" />

        {/* Wallet / profile */}
        <div className="sidebar-profile">
          <div className="sidebar-profile-avatar">
            <WalletCards size={17} strokeWidth={1.5} />
          </div>
          <div className="sidebar-profile-info">
            <div className="sidebar-profile-name">
              {shortWallet ?? "Not Connected"}
            </div>
            <div className="sidebar-profile-subtitle">My Wallet</div>
          </div>
          <div className={`sidebar-wallet-dot${wallet ? "" : " disconnected"}`} />
        </div>

        <div className="sidebar-divider-h" />

        {/* Navigation */}
        <nav className="sidebar-nav">
          <div className="sidebar-menu-label">Menu</div>

          <div className="sidebar-menu-group">
            <NavLink
              data-tour="nav-employer"
              to="/employer"
              end={false}
              className={`sidebar-nav-item${employerActive ? " active" : ""}`}
              onClick={(e) => handleRoleNav(e, "/employer")}
            >
              <BriefcaseBusiness size={18} strokeWidth={1.6} />
              <DecryptNavLabel label="Employer" active={employerActive} />
            </NavLink>

            <div className="sidebar-item-divider" />

            <NavLink
              data-tour="nav-employee"
              to="/employee/claims"
              end={false}
              className={`sidebar-nav-item${employeeActive ? " active" : ""}`}
              onClick={(e) => handleRoleNav(e, "/employee/claims")}
            >
              <CircleUserRound size={18} strokeWidth={1.6} />
              <DecryptNavLabel label="Employee" active={employeeActive} />
            </NavLink>

            <div className="sidebar-item-divider" />

            <button
              type="button"
              className="sidebar-nav-item sidebar-nav-item-soon"
              disabled
              aria-disabled="true"
              title="Withdrawal coming soon"
            >
              <ArrowUpFromLine size={18} strokeWidth={1.6} />
              <span className="sidebar-coming-soon-copy">
                <span className="sidebar-coming-soon-label">Withdrawal</span>
                <span className="sidebar-coming-soon-badge">Coming soon</span>
              </span>
            </button>

            <div className="sidebar-item-divider" />

            <button
              type="button"
              className="sidebar-nav-item sidebar-nav-item-soon"
              disabled
              aria-disabled="true"
              title="Deposit coming soon"
            >
              <ArrowDownToLine size={18} strokeWidth={1.6} />
              <span className="sidebar-coming-soon-copy">
                <span className="sidebar-coming-soon-label">Deposit</span>
                <span className="sidebar-coming-soon-badge">Coming soon</span>
              </span>
            </button>

            <div className="sidebar-item-divider" />

            <NavLink
              to="/account"
              end={false}
              className={`sidebar-nav-item${accountActive ? " active" : ""}`}
            >
              <Settings size={18} strokeWidth={1.6} />
              <DecryptNavLabel label="Account" active={accountActive} />
            </NavLink>
          </div>
        </nav>

        {/* Footer actions */}
        <div className="sidebar-footer">
          <div className="sidebar-item-divider" />

          <a
            href="https://x.com"
            target="_blank"
            rel="noopener noreferrer"
            className="sidebar-nav-item sidebar-footer-action"
          >
            <IconX />
            <span>Follow on X</span>
          </a>

          {wallet && (
            <>
              <div className="sidebar-item-divider" />
              <button
                type="button"
                className="sidebar-nav-item sidebar-footer-action sidebar-disconnect-btn"
                onClick={handleLogout}
              >
                <LogOut size={18} strokeWidth={1.6} />
                <span>Log Out</span>
              </button>
            </>
          )}
        </div>
      </aside>

      {/* Content area */}
      <div className="app-content">
        {/* Mobile topbar */}
        <div className="app-mobile-topbar">
          <Link to="/app">
            <img src={LOGO} alt="Zalary" />
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center" }}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? <X size={18} strokeWidth={1.8} /> : <Menu size={18} strokeWidth={1.8} />}
          </button>
        </div>

        {isWelcomeRoute ? (
          <Outlet />
        ) : (
          <div key={activeTab} className="app-route-decrypt">
            <Outlet />
          </div>
        )}
      </div>
    </div>
    </DashboardTourProvider>
  );
}


