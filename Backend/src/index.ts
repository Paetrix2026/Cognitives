import app from "./app";
import { initializeDataStore } from "./data";
import { logger } from "./lib/logger";
import { startAnomalyEngine } from "./services/anomalyEngine";
import { startBlockchainListener } from "./services/blockchainListener";
import { attachRealtimeServer } from "./socket/server";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

await initializeDataStore();

const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  attachRealtimeServer(server);
  startBlockchainListener();
  startAnomalyEngine();
  logger.info({ port }, "Server listening");
});
