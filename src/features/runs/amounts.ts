export function isValidAddress(addr: string): boolean {
  return typeof addr === "string" && addr.startsWith("0x") && addr.length === 42;
}

export function parseToAtomic(amount: string, decimals: number): string {
  const raw = (amount || "").trim();
  if (!raw) throw new Error("Amount is required.");
  if (!/^\d+(\.\d+)?$/.test(raw)) throw new Error("Amount must be a valid number.");

  const [whole, frac = ""] = raw.split(".");
  const fracPadded = (frac + "0".repeat(decimals)).slice(0, decimals);

  const atomicStr = `${whole}${fracPadded}`.replace(/^0+/, "") || "0";
  if (atomicStr === "0") throw new Error("Amount must be greater than zero.");
  return atomicStr;
}

export function formatAtomicToDisplay(atomic: number | string, decimals: number): string {
  const s = String(atomic ?? "0");
  if (!/^\d+$/.test(s)) return "0";

  const padded = s.padStart(decimals + 1, "0");
  const whole = padded.slice(0, -decimals);
  const frac = padded.slice(-decimals).replace(/0+$/, "");
  return frac ? `${Number(whole)}.${frac}` : `${Number(whole)}`;
}