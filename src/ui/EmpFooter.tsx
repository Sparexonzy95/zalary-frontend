import React from "react";
import { Link } from "react-router-dom";

const VAULT = "0x6ACbEE7Dd0817e286eF858EB8f4bDAc0C0A242dD";

export default function EmpFooter() {
  return (
    <footer className="emp-footer">
      <div className="emp-footer-left">
        <Link to="/" className="emp-footer-logo">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <rect width="24" height="24" rx="5" fill="rgba(47,107,255,0.15)"/>
            <path d="M7 7.5h10L7 16.5h10" stroke="#2F6BFF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Zalary
        </Link>
        <div className="emp-footer-divider" />
        <Link to="/" className="emp-footer-link">Home</Link>
        <Link to="/employer" className="emp-footer-link">Dashboard</Link>
      </div>
      <div className="emp-footer-right">
        <span className="emp-footer-chain">Base Sepolia · 84532</span>
        <span className="emp-footer-contract">
          PayrollVault ·{" "}
          <a
            href={`https://sepolia.basescan.org/address/${VAULT}`}
            target="_blank"
            rel="noreferrer"
          >
            0x6ACb…42dD ↗
          </a>
        </span>
      </div>
    </footer>
  );
}