import { ethers } from "ethers";

export const polygonAmoy = {
  chainId: 80002,
  name: "Polygon Amoy",
  rpcUrl: process.env.POLYGON_AMOY_RPC ?? "https://rpc-amoy.polygon.technology",
  explorerUrl: "https://amoy.polygonscan.com",
};

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function sanitizeConfiguredAddress(value: string | undefined): string {
  if (!value) return ZERO_ADDRESS;
  const trimmed = value.trim();
  if (!ethers.isAddress(trimmed) || trimmed === ZERO_ADDRESS) {
    return ZERO_ADDRESS;
  }
  return trimmed;
}

export const contractAddresses = {
  roleManager: sanitizeConfiguredAddress(process.env.ROLE_MANAGER_ADDRESS),
  projectRegistry: sanitizeConfiguredAddress(process.env.PROJECT_REGISTRY_ADDRESS),
  milestoneEscrow: sanitizeConfiguredAddress(process.env.MILESTONE_ESCROW_ADDRESS),
};

export function isConfiguredContractAddress(value: string | undefined): value is string {
  return sanitizeConfiguredAddress(value) !== ZERO_ADDRESS;
}

// Polygon Amoy has no ENS — staticNetwork prevents ethers from attempting ENS lookups
export function createAmoyProvider(rpcUrl: string) {
  const network = ethers.Network.from({ chainId: 80002, name: "matic-amoy" });
  return new ethers.JsonRpcProvider(rpcUrl, network, { staticNetwork: true });
}
