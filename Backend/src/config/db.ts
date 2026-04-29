import { logger } from "../lib/logger";

export async function connectDatabase() {
  const configured = Boolean(process.env.MONGODB_URI);
  logger.info({ configured }, configured ? "MongoDB configured" : "MongoDB not configured; using demo memory store");
  return { configured };
}
