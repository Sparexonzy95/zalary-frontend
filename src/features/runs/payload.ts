import type { AllocationInputRow, UploadAllocationsPayload } from "./types";
import { isValidAddress, parseToAtomic } from "./amounts";

export function buildUploadAllocationsPayload(
  rows: AllocationInputRow[],
  decimals: number
): UploadAllocationsPayload {
  if (!rows.length) throw new Error("allocations required");

  const seen = new Set<string>();
  const allocations = rows.map((r) => {
    const addr = (r.walletAddress || "").trim();
    if (!isValidAddress(addr)) throw new Error(`Invalid wallet address: ${addr || "(empty)"}`);

    const key = addr.toLowerCase();
    if (seen.has(key)) throw new Error(`Duplicate wallet detected: ${addr}`);
    seen.add(key);

    const amount_atomic = parseToAtomic(r.amount, decimals);

    return {
      employee_address: addr,
      amount_atomic,
      amount_ciphertext_hex: "0x01", // required by backend for Phase 2
    };
  });

  return { allocations };
}