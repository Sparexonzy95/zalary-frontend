import React from "react";
import { Outlet, NavLink, useLocation, Link } from "react-router-dom";
import "./styles/app.css"

/* ── Mobile hamburger icon ───────────────────────────────── */
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      {open ? (
        <>
          <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </>
      ) : (
        <>
          <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
        </>
      )}
    </svg>
  );
}

/* ── Sidebar nav content (shared desktop + mobile) ───────── */
function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const location = useLocation();
  const isEmployer = location.pathname.startsWith("/employer");
  const isEmployee = location.pathname.startsWith("/employee");

  return (
    <>
      {/* Brand */}
      <Link to="/" className="brand" onClick={onLinkClick}>
        <div className="brand-lockup">
          <div className="brand-mark-box">
            <div className="brand-core" />
          </div>
          <div>
            <div className="brand-name">IncoPayroll</div>
            <div className="brand-network">Base Sepolia</div>
          </div>
        </div>
      </Link>

      {/* Employer section */}
      <div className="nav-section">
        <div className={`nav-section-label${isEmployer ? " active" : ""}`}>
          Employer
        </div>
        <nav className="nav">
          <NavLink
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            to="/employer"
            end
            onClick={onLinkClick}
          >
            <svg className="nav-icon" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="3" width="16" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 16h8M10 14v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Payroll Templates
          </NavLink>
        </nav>
      </div>

      {/* Employee section */}
      <div className="nav-section">
        <div className={`nav-section-label${isEmployee ? " active" : ""}`}>
          Employee
        </div>
        <nav className="nav">
          <NavLink
            className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
            to="/employee/claims"
            onClick={onLinkClick}
          >
            <svg className="nav-icon" viewBox="0 0 20 20" fill="none">
              <path d="M10 2l2 4.2 4.6.7-3.3 3.2.8 4.5L10 12.3l-4.1 2.3.8-4.5L3.4 6.9l4.6-.7L10 2z"
                stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
            My Claims
          </NavLink>
        </nav>
      </div>

      <div className="sidebar-spacer" />

      {/* Footer */}
      <div className="sidebar-footer">
        <Link to="/" className="sidebar-back" onClick={onLinkClick}>
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
            <path d="M12 16l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Home
        </Link>
        <div className="sidebar-version">Inco Lightning · Beta</div>
      </div>
    </>
  );
}

/* ── App shell ───────────────────────────────────────────── */
export default function App() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
          <div className="app-shell">

        {/* Desktop sidebar */}
        <aside className="sidebar">
          <SidebarContent />
        </aside>

        {/* Mobile top bar */}
        <div className="mobile-topbar">
          <Link to="/" className="mobile-brand">
            <div className="brand-mark-box" style={{ width: 22, height: 22 }}>
              <div className="brand-core" />
            </div>
            IncoPayroll
          </Link>
          <button
            className="mobile-hamburger"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle navigation"
          >
            <HamburgerIcon open={mobileOpen} />
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <>
            {/* Overlay */}
            <div className="mobile-overlay" onClick={closeMobile} />
            {/* Drawer */}
            <div className="mobile-drawer">
              <SidebarContent onLinkClick={closeMobile} />
            </div>
          </>
        )}

        {/* Main content */}
        <main className="main">
          <Outlet />
        </main>

      </div>  );
}

