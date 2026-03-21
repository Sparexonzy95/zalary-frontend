import axios from "axios";
import { env, assertEnv } from "./env";

assertEnv();

export const api = axios.create({
  baseURL: env.API_BASE_URL,
  headers: {
    "x-api-key": env.API_KEY,
    "content-type": "application/json",
  },
});

export type ApiErrorShape = {
  status: number;
  message: string;
  detail?: string;
  fieldErrors?: Record<string, unknown>;
};

function extractFirstFieldError(fieldErrors?: Record<string, unknown>): string | undefined {
  if (!fieldErrors) return undefined;

  // Prefer chain error when present (your case)
  const chain = fieldErrors["chain"];
  if (Array.isArray(chain) && chain.length > 0 && typeof chain[0] === "string") return chain[0];

  // Otherwise return first string error found
  for (const v of Object.values(fieldErrors)) {
    if (Array.isArray(v) && v.length > 0 && typeof v[0] === "string") return v[0];
    if (typeof v === "string") return v;
  }
  return undefined;
}

export function toApiError(err: unknown): ApiErrorShape {
  if (!axios.isAxiosError(err)) {
    return { status: 0, message: "Something went wrong. Please try again." };
  }

  const status = err.response?.status ?? 0;
  const data = err.response?.data as any;

  const detail = typeof data?.detail === "string" ? data.detail : undefined;

  // DRF-style field errors: { field: ["msg"] }
  const fieldErrors: Record<string, unknown> | undefined =
    data && typeof data === "object" && !Array.isArray(data) ? data : undefined;

  const fieldMsg = extractFirstFieldError(fieldErrors);

  return {
    status,
    detail,
    fieldErrors,
    message:
      detail ??
      fieldMsg ??
      (status === 401
        ? "Unauthorized. Please check your API key."
        : `Request failed (${status}). Please try again.`),
  };
}