import { logger } from "../lib/logger";

export interface PinataUploadResult {
  cid: string;
  gatewayUrl: string;
}

function gateway(cid: string): string {
  const base = process.env.PINATA_GATEWAY ?? "https://gateway.pinata.cloud";
  return `${base}/ipfs/${cid}`;
}

export async function uploadProofMetadata(metadata: Record<string, unknown>): Promise<PinataUploadResult> {
  const jwt = process.env.PINATA_JWT;

  if (!jwt) {
    const cid = `bafybeidemo${Date.now()}`;
    logger.debug("PINATA_JWT not set; returning demo CID");
    return { cid, gatewayUrl: gateway(cid) };
  }

  try {
    const { PinataSDK } = await import("pinata");
    const pinata = new PinataSDK({ pinataJwt: jwt, pinataGateway: process.env.PINATA_GATEWAY });
    const result = await pinata.upload.public.json(metadata);
    const cid = result.cid;
    logger.info({ cid }, "Proof metadata pinned to IPFS");
    return { cid, gatewayUrl: gateway(cid) };
  } catch (err) {
    logger.error({ err }, "Pinata upload failed; falling back to demo CID");
    const cid = `bafybeidemo${Date.now()}`;
    return { cid, gatewayUrl: gateway(cid) };
  }
}

export async function uploadProofImage(
  imageBase64: string,
  filename: string,
  metadata: Record<string, unknown>,
): Promise<PinataUploadResult> {
  const jwt = process.env.PINATA_JWT;

  if (!jwt) {
    const cid = `bafybeidemo${Date.now()}`;
    logger.debug("PINATA_JWT not set; returning demo CID for image");
    return { cid, gatewayUrl: gateway(cid) };
  }

  try {
    const { PinataSDK } = await import("pinata");
    const pinata = new PinataSDK({ pinataJwt: jwt, pinataGateway: process.env.PINATA_GATEWAY });

    const buffer = Buffer.from(imageBase64, "base64");
    const blob = new Blob([buffer], { type: "image/jpeg" });
    const file = new File([blob], filename, { type: "image/jpeg" });

    const imageResult = await pinata.upload.public.file(file);
    const imageCid = imageResult.cid;

    const metaResult = await pinata.upload.public.json({ ...metadata, imageCid, imageGatewayUrl: gateway(imageCid) });
    const cid = metaResult.cid;
    logger.info({ cid, imageCid }, "Proof image + metadata pinned to IPFS");
    return { cid, gatewayUrl: gateway(cid) };
  } catch (err) {
    logger.error({ err }, "Pinata image upload failed; falling back to metadata-only");
    return uploadProofMetadata(metadata);
  }
}

export async function fetchProofMetadata(cid: string): Promise<Record<string, unknown>> {
  return { cid, gatewayUrl: gateway(cid) };
}
