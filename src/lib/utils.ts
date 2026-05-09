import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(value?: string | null) {
  if (!value) return "—";
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}

export function formatAtomicToDisplay(value: string | number | bigint, decimals = 6) {
  const big = BigInt(value);
  const div = BigInt(10) ** BigInt(decimals);
  const whole = big / div;
  const frac = big % div;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  return fracStr ? `${whole}.${fracStr}` : whole.toString();
}

export function parseDisplayToAtomic(value: string, decimals = 6) {
  const cleaned = value.trim();
  if (!cleaned) throw new Error("Amount is required");
  const [whole, frac = ""] = cleaned.split(".");
  if (!/^\d+$/.test(whole || "0") || !/^\d*$/.test(frac)) {
    throw new Error("Invalid amount");
  }
  const padded = (frac + "0".repeat(decimals)).slice(0, decimals);
  return (BigInt(whole || "0") * (BigInt(10) ** BigInt(decimals)) + BigInt(padded)).toString();
}

export function asBool(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "bigint") return value !== 0n;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const v = value.toLowerCase();
    return v === "true" || v === "1";
  }
  return false;
}


