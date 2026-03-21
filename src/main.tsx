import React from "react";
import "./index.css";
import "./styles/app.css";
import "./styles/dashboard.css";
import "./styles/app.css";
import "./styles/dashboard.css";
import "./index.css";
import "./styles/pages.css";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { router } from "./app/routes";
import { queryClient } from "./app/queryClient";
import { ToastProvider } from "./ui/Toast";
import { Buffer } from "buffer"
import process from "process"

window.Buffer = Buffer
window.process = process


ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  </React.StrictMode>
);




