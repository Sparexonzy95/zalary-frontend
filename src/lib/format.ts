export function parseDisplayToAtomic(
  value: string | number | bigint | null | undefined,
  decimals = 6,
): bigint {
  if (typeof value === "bigint") {
    return value < 0n ? 0n : value;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) return 0n;
    value = String(value);
  }

  const raw = String(value ?? "").trim();
  if (!raw) return 0n;

  let cleaned = raw
    .replace(/[₦$£€]/g, "")
    .replace(/,/g, "")
    .replace(/\s+/g, "")
    .trim();

  const maybeZeroTypo = cleaned.replace(/[oO]/g, "0");

  if (/^\d+(\.\d+)?$/.test(maybeZeroTypo)) {
    cleaned = maybeZeroTypo;
  }

  if (!/^\d+(\.\d+)?$/.test(cleaned)) {
    return 0n;
  }

  const [wholeRaw, fractionRaw = ""] = cleaned.split(".");
  const whole = wholeRaw.replace(/^0+(?=\d)/, "") || "0";
  const fraction = fractionRaw.slice(0, decimals).padEnd(decimals, "0");

  try {
    return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction || "0");
  } catch {
    return 0n;
  }
}

export function formatAtomicToDisplay(
  value: string | number | bigint | null | undefined,
  decimals = 6,
): string {
  if (value === null || value === undefined || value === "") return "0";

  let atomic: bigint;

  try {
    atomic = typeof value === "bigint" ? value : BigInt(String(value));
  } catch {
    return "0";
  }

  const negative = atomic < 0n;
  const absolute = negative ? -atomic : atomic;

  const base = 10n ** BigInt(decimals);
  const whole = absolute / base;
  const fraction = absolute % base;

  if (decimals <= 0) {
    return `${negative ? "-" : ""}${whole.toString()}`;
  }

  const fractionText = fraction
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");

  return `${negative ? "-" : ""}${whole.toString()}${
    fractionText ? `.${fractionText}` : ""
  }`;
}

export function formatAtomicToCurrency(
  value: string | number | bigint | null | undefined,
  decimals = 6,
  symbol = "USDC",
): string {
  return `${formatAtomicToDisplay(value, decimals)} ${symbol}`;
}

export function formatAtomic(
  value: string | number | bigint | null | undefined,
  decimals = 6,
): string {
  return formatAtomicToDisplay(value, decimals);
}

export function isPositiveAtomic(
  value: string | number | bigint | null | undefined,
) {
  try {
    return BigInt(String(value ?? "0")) > 0n;
  } catch {
    return false;
  }
}

export function shortAddress(value?: string | null) {
  const address = String(value ?? "").trim();

  if (!address) return "Not connected";
  if (!address.startsWith("0x") || address.length < 10) return address;

  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function shortHash(value?: string | null) {
  const hash = String(value ?? "").trim();

  if (!hash) return "Pending";
  if (!hash.startsWith("0x") || hash.length < 18) return hash;

  return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}

export function dateTimeLabel(value?: string | null) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function dateLabel(value?: string | null) {
  if (!value) return "Not set";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not set";

  return date.toLocaleDateString(undefined, {
    dateStyle: "medium",
  });
}

export function statusClass(value?: string | null) {
  const normalized = String(value ?? "unknown")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized ? `status-${normalized}` : "status-unknown";
}