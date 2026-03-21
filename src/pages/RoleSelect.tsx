import { useNavigate } from "react-router-dom";
import "./roleselect.css";

export default function RoleSelect() {
  const nav = useNavigate();

  return (
    <div className="rs-wrap">

      {/* background grid */}
      <div className="rs-grid" />
      <div className="rs-bloom" />

      {/* back to landing */}
      <a href="/" className="rs-back">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 16l-6-6 6-6"/>
        </svg>
        Back to Home
      </a>

      <div className="rs-inner">

        {/* header */}
        <div className="rs-head">
          <div className="rs-logo">
            <div className="rs-logo-box"><div className="rs-logo-core" /></div>
            Zalary
          </div>
          <h1 className="rs-title">How are you<br /><span className="rs-blue">using Zalary?</span></h1>
          <p className="rs-sub">Choose your role to continue. You can switch between views at any time from the sidebar.</p>
        </div>

        {/* role cards */}
        <div className="rs-cards">

          {/* EMPLOYER */}
          <button className="rs-card rs-card-employer" onClick={() => nav("/employer")}>
            <div className="rs-card-scan" />
            <div className="rs-card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2"/>
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
                <path d="M12 12v4M10 14h4"/>
              </svg>
            </div>
            <div className="rs-card-body">
              <div className="rs-card-role">Employer</div>
              <div className="rs-card-title">Run Payroll</div>
              <p className="rs-card-desc">Create payroll templates, manage employee rosters, encrypt and fund salary allocations, and activate payroll runs.</p>
            </div>
            <div className="rs-card-actions">
              <div className="rs-card-features">
                <span>Payroll Templates</span>
                <span>Encrypted Allocations</span>
                <span>Funding &amp; Activation</span>
              </div>
              <div className="rs-card-cta">
                Enter as Employer
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 10h10M11 6l4 4-4 4"/>
                </svg>
              </div>
            </div>
          </button>

          {/* EMPLOYEE */}
          <button className="rs-card rs-card-employee" onClick={() => nav("/employee/claims")}>
            <div className="rs-card-scan" />
            <div className="rs-card-icon rs-card-icon-emp">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                <path d="M16 11l2 2 3-3"/>
              </svg>
            </div>
            <div className="rs-card-body">
              <div className="rs-card-role rs-card-role-emp">Employee</div>
              <div className="rs-card-title">Claim Salary</div>
              <p className="rs-card-desc">View your payroll claims, request and finalize salary withdrawals using your wallet and Inco's TEE attestation.</p>
            </div>
            <div className="rs-card-actions">
              <div className="rs-card-features">
                <span>View Claimables</span>
                <span>Request Claim</span>
                <span>Attested Decrypt</span>
              </div>
              <div className="rs-card-cta rs-card-cta-emp">
                Enter as Employee
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none"
                  stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 10h10M11 6l4 4-4 4"/>
                </svg>
              </div>
            </div>
          </button>

        </div>

        {/* footer note */}
        <div className="rs-note">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" transform="scale(0.8) translate(2,2)"/>
          </svg>
          All payroll data is encrypted by Inco Lightning TEE — no salary is ever readable on-chain.
        </div>

      </div>
    </div>
  );
}