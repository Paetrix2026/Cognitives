require("@nomicfoundation/hardhat-toolbox");
const fs = require("node:fs");
const path = require("node:path");
const dotenv = require("dotenv");

const shellEnvKeys = new Set(Object.keys(process.env));

function loadEnvFile(envPath, { overrideFileValues = false } = {}) {
  if (!fs.existsSync(envPath)) return;
  const parsed = dotenv.parse(fs.readFileSync(envPath));
  for (const [key, value] of Object.entries(parsed)) {
    if (shellEnvKeys.has(key)) continue;
    if (overrideFileValues || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(path.resolve(__dirname, ".env"));
loadEnvFile(path.resolve(__dirname, "..", ".env"));
loadEnvFile(path.resolve(__dirname, "..", ".env.localchain"), { overrideFileValues: true });

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  networks: {
    localhost: {
      url: process.env.HARDHAT_RPC_URL || "http://127.0.0.1:8545",
      chainId: 31337,
    },
    amoy: {
      url: process.env.POLYGON_AMOY_RPC || "https://rpc-amoy.polygon.technology",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 80002,
    },
  },
};
