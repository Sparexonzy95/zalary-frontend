import React from "react";
import { Outlet, NavLink, Link, useLocation } from "react-router-dom";
import "../styles/shell.css";
import { ToastProvider } from "../ui/Toast";
import { WalletProvider, useWallet } from "../lib/WalletContext";

/* ── wallet pill — reads from context ───────────────────── */
function WalletPill() {
  const { wallet, connect } = useWallet();

  if (wallet) {
    return (
      <div className="nav-wallet">
        <span className="nav-wallet-dot" />
        {wallet.slice(0, 6)}…{wallet.slice(-4)}
      </div>
    );
  }

  return (
    <button
      className="nav-wallet nav-wallet--btn"
      onClick={async () => {
        try { await connect(); }
        catch { /* user rejected — silent */ }
      }}
    >
      <span className="nav-wallet-dot" style={{ background: "rgba(47,107,255,.5)" }} />
      Connect
    </button>
  );
}

/* ── breadcrumb ──────────────────────────────────────────── */
function Breadcrumb() {
  const loc = useLocation();
  const parts = loc.pathname.split("/").filter(Boolean);
  if (parts.length <= 1) return null;

  const crumbs: { label: string; to: string }[] = [];
  let path = "";
  for (const p of parts) {
    path += "/" + p;
    const label =
      p === "employer"  ? "Employer" :
      p === "employee"  ? "Employee" :
      p === "templates" ? "Templates" :
      p === "new"       ? "New Template" :
      p === "runs"      ? "Run" :
      p === "claims"    ? "Claims" :
      `#${p}`;
    crumbs.push({ label, to: path });
  }

  return (
    <div className="nav-breadcrumb">
      {crumbs.map((c, i) => (
        <React.Fragment key={c.to}>
          {i > 0 && <span className="nav-bc-sep">/</span>}
          {i === crumbs.length - 1
            ? <span className="nav-bc-cur">{c.label}</span>
            : <Link to={c.to} className="nav-bc-link">{c.label}</Link>}
        </React.Fragment>
      ))}
    </div>
  );
}

/* ── shell ───────────────────────────────────────────────── */
function Shell() {
  const loc = useLocation();
  const isEmployer = loc.pathname.startsWith("/employer");
  const isEmployee = loc.pathname.startsWith("/employee");

  return (
    <div className="sh-root">

      <header className="sh-nav">
        <div className="sh-nav-inner">

          <Link to="/app" className="sh-brand">
            <div className="sh-brand-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="24" height="24" rx="6" fill="rgba(47,107,255,0.15)"/>
                <path d="M7 7.5h10L7 16.5h10" stroke="#2F6BFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="sh-brand-name">Zalary</span>
          </Link>

          <nav className="sh-nav-pills">
            <div className={`sh-pill-group${isEmployer ? " sh-pill-group--on" : ""}`}>
              <span className="sh-pill-role">Employer</span>
              <NavLink to="/employer" end
                className={({ isActive }) => `sh-pill${isActive ? " sh-pill--active" : ""}`}>
                Templates
              </NavLink>
            </div>

            <div className="sh-pill-divider" />

            <div className={`sh-pill-group${isEmployee ? " sh-pill-group--on" : ""}`}>
              <span className="sh-pill-role">Employee</span>
              <NavLink to="/employee/claims"
                className={({ isActive }) => `sh-pill${isActive ? " sh-pill--active" : ""}`}>
                My Claims
              </NavLink>
            </div>
          </nav>

          <div className="sh-nav-right">
            <div className="sh-net-badge">
              <span className="sh-net-dot" />
              Base Sepolia
            </div>
            <WalletPill />
            <Link to="/" className="sh-home-icon" title="Home">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12L12 3l9 9"/>
                <path d="M9 21V12h6v9"/>
              </svg>
            </Link>
          </div>

        </div>

        <div className="sh-subbar">
          <div className="sh-nav-inner">
            <Breadcrumb />
          </div>
        </div>
      </header>

      <main className="sh-main">
        <Outlet />
      </main>

    </div>
  );
}

/* ── root export — WalletProvider wraps everything ─────── */
export default function AppShell() {
  return (
    <WalletProvider>
      <ToastProvider>
        <Shell />
      </ToastProvider>
    </WalletProvider>
  );
}