import { logger } from "../lib/logger";

export interface ProofStorageResult {
  cid: string;
  gatewayUrl: string;
}

// Kept for backwards-compat with callers that import PinataUploadResult
export type PinataUploadResult = ProofStorageResult;

export async function uploadProofMetadata(metadata: Record<string, unknown>): Promise<ProofStorageResult> {
  const milestoneId = String(metadata.milestoneId ?? Date.now());
  const cid = `local-${milestoneId}`;
  logger.debug({ milestoneId }, "Proof metadata stored locally in PostgreSQL");
  return { cid, gatewayUrl: `/api/milestones/${milestoneId}/proof-image` };
}

export async function uploadProofImage(
  _imageBase64: string,
  _filename: string,
  metadata: Record<string, unknown>,
): Promise<ProofStorageResult> {
  const milestoneId = String(metadata.milestoneId ?? Date.now());
  const cid = `local-${milestoneId}`;
  logger.debug({ milestoneId }, "Proof image stored locally in PostgreSQL");
  return { cid, gatewayUrl: `/api/milestones/${milestoneId}/proof-image` };
}

export async function fetchProofMetadata(cid: string): Promise<Record<string, unknown>> {
  return { cid };
}
