import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { BriefcaseBusiness, CircleUserRound, LogOut, ShieldCheck, UserRoundCog } from "lucide-react";
import { WalletConnectButton } from "./WalletConnectButton";
import { useOnboarding } from "../lib/onboarding";
import { env } from "../lib/env";

const LOGO = "https://res.cloudinary.com/dxmdwvmxl/image/upload/v1776941645/logo_zalary2_mm8mlp.png";

export function AppShell() {
  const { logout } = useOnboarding();
  const navigate = useNavigate();
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <Link to="/app" className="brand-block"><img src={LOGO} alt="Zalary" /><span>Zama Payroll</span></Link>
        <div className="side-card"><ShieldCheck size={18} /><div><b>{env.chainName}</b><small>Confidential payroll model</small></div></div>
        <nav className="side-nav">
          <NavLink to="/employer"><BriefcaseBusiness size={18}/> Employer</NavLink>
          <NavLink to="/employee/claims"><CircleUserRound size={18}/> Employee</NavLink>
          <NavLink to="/account"><UserRoundCog size={18}/> Account</NavLink>
        </nav>
        <button className="logout" onClick={() => { logout(); navigate("/"); }}><LogOut size={16}/> Log out</button>
      </aside>
      <main className="main-panel">
        <header className="topbar"><Link to="/app" className="mobile-brand"><img src={LOGO} alt="Zalary"/></Link><div className="network-pill">{env.chainName}</div><WalletConnectButton /></header>
        <div className="route-shell"><Outlet /></div>
      </main>
    </div>
  );
}


