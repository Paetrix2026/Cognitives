import { getProjectAnomalies } from "../data";
import { logger } from "../lib/logger";

export function runAnomalyScan() {
  const flags = getProjectAnomalies();
  logger.info({ flags: flags.length }, "Anomaly scan completed");
  return flags;
}

export function startAnomalyEngine() {
  runAnomalyScan();
  return setInterval(runAnomalyScan, 10 * 60 * 1000);
}
