import { Lightning } from "@inco/js/lite"
import { handleTypes } from "@inco/js"

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function encryptAmount(
  amountAtomic: string,
  accountAddress: string,
  dappAddress: string
) {
  const lightning = await Lightning.baseSepoliaTestnet();

  const result = await lightning.encrypt(BigInt(amountAtomic), {
    accountAddress,
    dappAddress,
    handleType: handleTypes.euint256,
  });

  if (typeof result === "string") {
    return result.startsWith("0x") ? result : `0x${result}`;
  }

  return `0x${bytesToHex(result as Uint8Array)}`;
}