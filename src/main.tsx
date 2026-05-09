import "@fontsource-variable/mona-sans";
import "@fontsource/fira-mono/400.css";
import "@fontsource/fira-mono/700.css";
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { router } from "./app/router";
import { queryClient } from "./app/queryClient";
import { WalletProvider } from "./lib/wallet";
import { OnboardingProvider } from "./lib/onboarding";
import { ToastProvider } from "./components/Toast";
import { DecryptHoverText } from "./components/DecryptHoverText";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <WalletProvider>
          <OnboardingProvider>
            <DecryptHoverText />
            <RouterProvider router={router} />
          </OnboardingProvider>
        </WalletProvider>
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);


