import { createBrowserRouter } from "react-router-dom";
import { AppDashboard } from "./AppDashboard";
import { LandingPage } from "../pages/LandingPage";
import { WelcomePage } from "../pages/WelcomePage";
import { VerifyWalletPage } from "../pages/onboarding/VerifyWallet";
import { EmployerOnboardingPage } from "../pages/onboarding/EmployerOnboarding";
import { EmployeeOnboardingPage } from "../pages/onboarding/EmployeeOnboarding";
import { AccountPage } from "../pages/AccountPage";
import { EmployerDashboardPage } from "../pages/employer/EmployerDashboardPage";
import { CreateTemplatePage } from "../pages/employer/CreateTemplatePage";
import { TemplateDetailPage } from "../pages/employer/TemplateDetailPage";
import { RunDetailPage } from "../pages/employer/RunDetailPage";
import { ClaimsDashboardPage } from "../pages/employee/ClaimsDashboardPage";
import { ClaimDetailPage } from "../pages/employee/ClaimDetailPage";
import { RequireOnboarding } from "../components/RequireOnboarding";

function NotFound() {
  return (
    <div className="card" style={{ margin: "2rem auto", maxWidth: 400, textAlign: "center" }}>
      <h2>Page not found</h2>
    </div>
  );
}

function WelcomeOverlayPage() {
  return (
    <div className="welcome-modal-route">
      <div className="welcome-modal-background" aria-hidden="true">
        <EmployerDashboardPage />
      </div>
      <WelcomePage />
    </div>
  );
}

export const router = createBrowserRouter([
  { path: "/", element: <LandingPage /> },

  {
    element: <AppDashboard />,
    children: [
      { path: "/app", element: <WelcomeOverlayPage /> },

      { path: "/verify/employer", element: <VerifyWalletPage role="employer" /> },
      { path: "/verify/employee", element: <VerifyWalletPage role="employee" /> },

      { path: "/onboarding/employer", element: <EmployerOnboardingPage /> },
      { path: "/onboarding/employee", element: <EmployeeOnboardingPage /> },

      { path: "/account", element: <AccountPage /> },

      {
        path: "/employer",
        element: (
          <RequireOnboarding role="employer">
            <EmployerDashboardPage />
          </RequireOnboarding>
        ),
      },
      {
        path: "/employer/templates/new",
        element: (
          <RequireOnboarding role="employer">
            <CreateTemplatePage />
          </RequireOnboarding>
        ),
      },
      {
        path: "/employer/templates/:id",
        element: (
          <RequireOnboarding role="employer">
            <TemplateDetailPage />
          </RequireOnboarding>
        ),
      },
      {
        path: "/employer/runs/:runId",
        element: (
          <RequireOnboarding role="employer">
            <RunDetailPage />
          </RequireOnboarding>
        ),
      },
      {
        path: "/employee/claims",
        element: (
          <RequireOnboarding role="employee">
            <ClaimsDashboardPage />
          </RequireOnboarding>
        ),
      },
      {
        path: "/employee/claims/:claimId",
        element: (
          <RequireOnboarding role="employee">
            <ClaimDetailPage />
          </RequireOnboarding>
        ),
      },
    ],
  },

  { path: "*", element: <NotFound /> },
]);
