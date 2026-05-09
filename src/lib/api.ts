import axios from "axios";
import { env } from "./env";

export const api = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("zalary:onboarding_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (env.apiKey) config.headers["X-API-Key"] = env.apiKey;
  return config;
});

export function apiError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as any;
    return data?.detail || data?.error || error.message;
  }
  return error instanceof Error ? error.message : "Unknown error";
}


