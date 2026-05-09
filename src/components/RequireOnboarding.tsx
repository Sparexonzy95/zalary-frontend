import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useOnboarding } from "../lib/onboarding";
import type { Role } from "../lib/types";

function verifyPath(role: Role) {
  return role === "employer" ? "/verify/employer" : "/verify/employee";
}

function onboardingPath(role: Role) {
  return role === "employer" ? "/onboarding/employer" : "/onboarding/employee";
}

function normalizeWallet(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

export function RequireOnboarding({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const location = useLocation();
  const { loading, token, profile, activeWallet, isOnboarded } = useOnboarding();

  const profileWallet = normalizeWallet(profile?.wallet_address);
  const connectedWallet = normalizeWallet(activeWallet);

  const walletMatches =
    !profileWallet || !connectedWallet || profileWallet === connectedWallet;

  if (loading) {
    return (
      <div className="card page-card">
        <h2>Checking payroll identity...</h2>
        <p className="muted">Confirming your Zama onboarding status.</p>
      </div>
    );
  }

  if (!token || !profile || !walletMatches) {
    return (
      <Navigate
        to={verifyPath(role)}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (!isOnboarded(role, profile)) {
    return (
      <Navigate
        to={onboardingPath(role)}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return <>{children}</>;
}