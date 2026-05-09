import { getAddress } from "viem";
import { env } from "./env";

export type ZamaEncryptedInput = {
  handle: `0x${string}`;
  inputProof: `0x${string}`;
  ctHash: bigint;
  securityZone: number;
  utype: number;
  signature: `0x${string}`;
};

export type ZamaEncryptedInputForApi = {
  handle: string;
  inputProof: string;
  ctHash: string;
  securityZone: number;
  utype: number;
  signature: string;
};

export type ZamaDecryptForTxResult = {
  decryptedValue: string | number | boolean | bigint;
  signature: `0x${string}`;
  proof: `0x${string}`;
};

type ZamaWorkerEnvelope<T> = {
  ok?: boolean;
  result?: T;
  error?: unknown;
  detail?: unknown;
};

const WORKER_URL =
  import.meta.env.VITE_ZAMA_WORKER_URL ||
  import.meta.env.VITE_VIEM_WORKER_URL ||
  "http://127.0.0.1:8787";

const RPC_URL =
  import.meta.env.VITE_RPC_URL ||
  import.meta.env.VITE_CHAIN_RPC_URL ||
  "https://ethereum-sepolia-rpc.publicnode.com";

const ZERO_BYTES32 =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

function isHex(value: unknown): value is `0x${string}` {
  return typeof value === "string" && value.startsWith("0x");
}

function normalizeAddress(value: unknown, label: string): `0x${string}` {
  const raw = String(value ?? "").trim();

  if (!/^0x[a-fA-F0-9]{40}$/.test(raw)) {
    throw new Error(
      `${label} must be a valid 20-byte EVM address. Got: ${raw || "empty"}`,
    );
  }

  try {
    return getAddress(raw) as `0x${string}`;
  } catch {
    throw new Error(
      `${label} must be a valid checksummable EVM address. Got: ${raw}`,
    );
  }
}

function normalizeHex(value: unknown, label: string): `0x${string}` {
  const fromBytes = byteLikeToHex(value, label);

  if (fromBytes) return fromBytes;

  const raw = String(value ?? "").trim();

  if (!raw.startsWith("0x")) {
    throw new Error(`${label} must be 0x-prefixed. Got: ${raw || "empty"}`);
  }

  if (raw.length <= 2) {
    throw new Error(`${label} cannot be empty.`);
  }

  return raw as `0x${string}`;
}

function normalizeBytes32Hex(value: unknown, label: string): `0x${string}` {
  const hex = normalizeHex(value, label);
  const body = hex.slice(2);

  if (!/^[a-fA-F0-9]+$/.test(body)) {
    throw new Error(`${label} must contain only hex characters.`);
  }

  if (body.length > 64) {
    throw new Error(`${label} must be 32 bytes. Got ${body.length / 2} bytes.`);
  }

  const normalized = `0x${body.padStart(64, "0")}` as `0x${string}`;

  if (normalized.toLowerCase() === ZERO_BYTES32) {
    throw new Error(`${label} cannot be zero bytes32.`);
  }

  return normalized;
}

function byteLikeToHex(value: unknown, label: string): `0x${string}` | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const maybeHandle = (value as { handle?: unknown }).handle;

    if (maybeHandle !== undefined) {
      return normalizeHex(maybeHandle, `${label}.handle`);
    }

    const numericKeys = Object.keys(value)
      .filter((key) => !Number.isNaN(Number(key)))
      .sort((a, b) => Number(a) - Number(b));

    if (numericKeys.length > 0) {
      return bytesToHex(
        numericKeys.map((key) =>
          Number((value as Record<string, unknown>)[key]),
        ),
        label,
      );
    }
  }

  if (Array.isArray(value)) {
    return bytesToHex(value.map((item) => Number(item)), label);
  }

  return null;
}

function bytesToHex(bytes: number[], label: string): `0x${string}` {
  if (!bytes.length) {
    throw new Error(`${label} is empty.`);
  }

  const body = bytes
    .map((byte) => {
      if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
        throw new Error(`${label} contains an invalid byte.`);
      }

      return byte.toString(16).padStart(2, "0");
    })
    .join("");

  return `0x${body}` as `0x${string}`;
}

function bigintToHex(value: bigint) {
  return `0x${value.toString(16)}`;
}

function toBigIntHandle(value: unknown) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    throw new Error("Encrypted handle is missing.");
  }

  return raw.startsWith("0x") ? BigInt(raw) : BigInt(raw);
}

function normalizeUintValue(value: string | number | bigint, label: string) {
  if (typeof value === "bigint") {
    if (value < 0n) throw new Error(`${label} cannot be negative.`);
    return value.toString();
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`${label} must be finite.`);
    if (!Number.isInteger(value)) throw new Error(`${label} must be an integer.`);
    if (value < 0) throw new Error(`${label} cannot be negative.`);
    return String(value);
  }

  const raw = String(value ?? "").trim();

  if (!raw) {
    throw new Error(`${label} is required.`);
  }

  if (!/^\d+$/.test(raw)) {
    throw new Error(`${label} must be a positive integer string. Got: ${raw}`);
  }

  return raw;
}

function normalizeWorkerResult<T>(payload: unknown): T {
  const body = payload as ZamaWorkerEnvelope<T>;

  if (body?.ok === false) {
    throw new Error(String(body.error || body.detail || "Zama worker failed."));
  }

  return (body?.result ?? body) as T;
}

function stringifyWorkerError(value: unknown) {
  if (!value) return "";

  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function safePayloadForLog(payload: Record<string, unknown>) {
  return {
    ...payload,
    inputProof: payload.inputProof ? "[inputProof omitted]" : payload.inputProof,
    proof: payload.proof ? "[proof omitted]" : payload.proof,
    signature: payload.signature ? "[signature omitted]" : payload.signature,
  };
}

async function callZamaWorker<T>(payload: Record<string, unknown>): Promise<T> {
  const workerUrl = String(WORKER_URL || "").replace(/\/$/, "");

  if (!workerUrl) {
    throw new Error(
      "Zama worker URL is missing. Set VITE_VIEM_WORKER_URL=http://127.0.0.1:8787",
    );
  }

  let response: Response;

  try {
    response = await fetch(`${workerUrl}/rpc`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("[ZAMA WORKER FETCH FAILED]", safePayloadForLog(payload), error);

    throw new Error(
      `Could not reach Zama worker at ${workerUrl}/rpc. Make sure workers/viem is running on port 8787.`,
    );
  }

  const text = await response.text();

  let parsed: unknown = null;

  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!response.ok) {
    const body = parsed as { error?: unknown; detail?: unknown };

    const message =
      stringifyWorkerError(body?.error) ||
      stringifyWorkerError(body?.detail) ||
      stringifyWorkerError(parsed) ||
      `Zama worker failed (${response.status}).`;

    console.error("[ZAMA WORKER ERROR]", {
      status: response.status,
      payload: safePayloadForLog(payload),
      response: parsed,
    });

    throw new Error(message);
  }

  return normalizeWorkerResult<T>(parsed);
}

export function encryptedInputForApi(
  input: ZamaEncryptedInput,
): ZamaEncryptedInputForApi {
  return {
    handle: input.handle,
    inputProof: input.inputProof,
    ctHash: bigintToHex(input.ctHash),
    securityZone: input.securityZone,
    utype: input.utype,
    signature: input.signature,
  };
}

export function encryptedInputForContract(input: ZamaEncryptedInput) {
  return input.handle;
}

export async function encryptUint64ListForContract(
  values: Array<string | number | bigint>,
  userAddress: `0x${string}`,
  contractAddress: string,
): Promise<ZamaEncryptedInput[]> {
  if (!values.length) {
    throw new Error("No values supplied for encryption.");
  }

  const normalizedUserAddress = normalizeAddress(
    userAddress,
    "Zama encryption userAddress",
  );

  const normalizedContractAddress = normalizeAddress(
    contractAddress,
    "Zama encryption contractAddress",
  );

  const normalizedValues = values.map((value, index) =>
    normalizeUintValue(value, `Zama encryption value[${index}]`),
  );

  const payload = {
    op: "zama.encryptInput",
    chainId: Number(env.chainId),
    rpcUrl: RPC_URL,
    contractAddress: normalizedContractAddress,
    userAddress: normalizedUserAddress,
    values: normalizedValues,
    types: normalizedValues.map(() => "u64"),
  };

  console.log("[ZAMA ENCRYPT PAYLOAD]", safePayloadForLog(payload));

  const result = await callZamaWorker<{
    handle?: string;
    handles?: string[];
    inputProof?: string;
  }>(payload);

  const handles = Array.isArray(result.handles)
    ? result.handles
    : result.handle
      ? [result.handle]
      : [];

  if (handles.length !== values.length) {
    throw new Error(
      `Zama encryption returned ${handles.length} handle(s), expected ${values.length}.`,
    );
  }

  const inputProof = normalizeHex(result.inputProof, "Zama inputProof");

  return handles.map((handle) => {
    const normalizedHandle = normalizeBytes32Hex(handle, "Zama encrypted handle");

    return {
      handle: normalizedHandle,
      inputProof,
      ctHash: toBigIntHandle(normalizedHandle),
      securityZone: 0,
      utype: 0,
      signature: inputProof,
    };
  });
}

export async function encryptUint64ForContract(
  value: string | number | bigint,
  userAddress: `0x${string}`,
  contractAddress: string,
): Promise<ZamaEncryptedInput> {
  const [encrypted] = await encryptUint64ListForContract(
    [value],
    userAddress,
    contractAddress,
  );

  return encrypted;
}

export async function encryptUint64ListForPayroll(
  values: Array<string | number | bigint>,
  userAddress: `0x${string}`,
): Promise<ZamaEncryptedInput[]> {
  return encryptUint64ListForContract(values, userAddress, env.payrollVaultAddress);
}

export async function encryptUint64ForPayroll(
  value: string | number | bigint,
  userAddress: `0x${string}`,
): Promise<ZamaEncryptedInput> {
  return encryptUint64ForContract(value, userAddress, env.payrollVaultAddress);
}

export async function encryptUint64ForSwapRouter(
  value: string | number | bigint,
  userAddress: `0x${string}`,
): Promise<ZamaEncryptedInput> {
  return encryptUint64ForContract(value, userAddress, env.swapRouterAddress);
}

export async function publicDecryptManyForTx(
  handles: string[],
  contractAddress = env.payrollVaultAddress,
): Promise<{
  values: Record<string, string | number | boolean | bigint>;
  proof: `0x${string}`;
  signature: `0x${string}`;
}> {
  const normalizedContractAddress = normalizeAddress(
    contractAddress,
    "Zama public decrypt contractAddress",
  );

  const normalizedHandles = handles.map((handle) =>
    normalizeBytes32Hex(handle, "Zama public decrypt handle"),
  );

  const result = await callZamaWorker<Record<string, unknown>>({
    op: "zama.publicDecrypt",
    chainId: Number(env.chainId),
    rpcUrl: RPC_URL,
    contractAddress: normalizedContractAddress,
    handles: normalizedHandles,
  });

  const clearValues =
    (result.clearValues as Record<string, unknown> | undefined) ||
    (result.values as Record<string, unknown> | undefined) ||
    result;

  const proof =
    result.decryptionProof ||
    result.proof ||
    result.signature ||
    result.publicDecryptProof;

  if (!isHex(proof)) {
    throw new Error(
      "Zama public decrypt did not return a valid decryption proof. Check the worker publicDecrypt response.",
    );
  }

  const values: Record<string, string | number | boolean | bigint> = {};

  normalizedHandles.forEach((handle, index) => {
    values[handle] = (
      clearValues[handle] ??
      clearValues[handle.toLowerCase()] ??
      Object.values(clearValues)[index]
    ) as string | number | boolean | bigint;
  });

  return {
    values,
    proof,
    signature: proof,
  };
}

export async function publicDecryptForTx(
  handle: string,
  contractAddress = env.payrollVaultAddress,
): Promise<ZamaDecryptForTxResult> {
  const normalizedHandle = normalizeBytes32Hex(
    handle,
    "Zama public decrypt handle",
  );

  const result = await publicDecryptManyForTx([normalizedHandle], contractAddress);

  return {
    decryptedValue: result.values[normalizedHandle],
    signature: result.signature,
    proof: result.proof,
  };
}