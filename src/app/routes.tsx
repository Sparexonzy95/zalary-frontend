import { createBrowserRouter } from "react-router-dom";

import AppShell        from "./App";
import LandingPage     from "../pages/LandingPage";
import RoleSelect      from "../pages/RoleSelect";

import EmployerDashboard from "../pages/employer/EmployerDashboard";
import CreateTemplate    from "../pages/employer/CreateTemplate";
import TemplateDetail    from "../pages/employer/TemplateDetail";
import RunDetail         from "../pages/employer/RunDetail";

import ClaimsDashboard from "../pages/employee/ClaimsDashboard";
import ClaimDetail     from "../pages/employee/ClaimDetail";

function NotFound() {
  return (
    <div style={{ padding: 24, fontFamily: "system-ui", color: "#dde5ff", background: "#030509", minHeight: "100vh" }}>
      <h1>404 — Page not found</h1>
    </div>
  );
}

export const router = createBrowserRouter([
  // ── Landing — full screen, no sidebar ──────────────────────
  { path: "/",    element: <LandingPage /> },

  // ── Role select — full screen, no sidebar ──────────────────
  { path: "/app", element: <RoleSelect /> },

  // ── App shell — sidebar wraps all dashboard routes ─────────
  {
    element: <AppShell />,
    children: [
      { path: "/employer",                  element: <EmployerDashboard /> },
      { path: "/employer/templates/new",    element: <CreateTemplate /> },
      { path: "/employer/templates/:id",    element: <TemplateDetail /> },
      { path: "/employer/runs/:runId",      element: <RunDetail /> },

      { path: "/employee/claims",           element: <ClaimsDashboard /> },
      { path: "/employee/claims/:claimId",  element: <ClaimDetail /> },
    ],
  },

  { path: "*", element: <NotFound /> },
]);