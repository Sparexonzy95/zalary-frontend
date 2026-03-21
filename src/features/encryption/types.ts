export type EncryptionStep =
  | "idle"
  | "creating_onchain"
  | "created_onchain"
  | "encrypting"
  | "ciphertexts_saved"
  | "uploading_chunks"
  | "uploaded_chunks"
  | "finalizing"
  | "finalized"
  | "failed";

export type EncryptedAllocation = {
  employee_address: string;
  amount_atomic: string;
  amount_ciphertext_hex: string;
};

export type SaveEncryptedAllocationsPayload = {
  allocations: EncryptedAllocation[];
};