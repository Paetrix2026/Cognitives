import app from "./app";
import { initializeDataStore } from "./data";
import { logger } from "./lib/logger";
import { startAnomalyEngine } from "./services/anomalyEngine";
import { startBlockchainListener } from "./services/blockchainListener";
import { initContractService } from "./services/contractService";
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

// ── Startup Banner ────────────────────────────────────────────────────────────
console.log("");
console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║         DecentraliTrack — API Server Starting Up             ║");
console.log("║   Transparent Public Project Tracking on Polygon Amoy        ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
console.log("");
console.log(`🕐 [${new Date().toISOString()}] Server initialization started`);
console.log(`🌍 Environment : ${process.env.NODE_ENV ?? "development"}`);
console.log(`🔌 Port        : ${port}`);
console.log(`🔗 Blockchain  : ${process.env.HARDHAT_RPC_URL ? "Local Hardhat" : process.env.POLYGON_AMOY_RPC ? "Polygon Amoy (live)" : "Demo sync mode (no RPC configured)"}`);
console.log(`🗄️  Database    : ${process.env.DATABASE_URL ? "PostgreSQL (configured)" : "In-memory demo store"}`);
console.log(`📦 IPFS        : ${process.env.PINATA_JWT ? "Pinata (configured)" : "Demo CIDs (no Pinata JWT)"}`);
console.log("");

console.log("[INIT] ⏳ Initializing data store...");
await initializeDataStore();
console.log("[INIT] ✅ Data store ready");

const server = app.listen(port, "0.0.0.0", () => {
  console.log("[INIT] 🚀 HTTP server bound — attaching services...");

  attachRealtimeServer(server);
  console.log("[INIT] ✅ WebSocket realtime server attached");

  initContractService();
  console.log("[INIT] ✅ Smart contract service initialized");

  startBlockchainListener();
  console.log("[INIT] ✅ Blockchain event listener started");

  startAnomalyEngine();
  console.log("[INIT] ✅ Anomaly detection engine started (scans every 10 min)");

  logger.info({ port, host: "0.0.0.0" }, "Server listening on all interfaces");
  console.log("");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log(`║  ✅ DecentraliTrack API ready on http://0.0.0.0:${port}       ║`);
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("");
});
