import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import { isConfiguredContractAddress } from "../config/contracts";
import { logger } from "../lib/logger";

function findArtifactsBase(): string {
  const candidates = [
    path.resolve(process.cwd(), "..", "contracts", "artifacts", "contracts"),
    path.resolve(process.cwd(), "contracts", "artifacts", "contracts"),
    path.resolve(process.cwd(), "..", "..", "decentralitrack", "contracts", "artifacts", "contracts"),
    path.resolve(process.cwd(), "decentralitrack", "contracts", "artifacts", "contracts"),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) ?? candidates[0];
}

function loadContractAbi(contractName: string): ethers.InterfaceAbi {
  const artifactFile = path.join(
    findArtifactsBase(),
    `${contractName}.sol`,
    `${contractName}.json`,
  );
  try {
    const raw = fs.readFileSync(artifactFile, "utf-8");
    return (JSON.parse(raw) as { abi: ethers.InterfaceAbi }).abi;
  } catch {
    logger.warn({ contractName, artifactFile }, "blockchainConfig: ABI file not found");
    return [];
  }
}

// ── Provider & Signer ─────────────────────────────────────────────────────────

const rpcUrl =
  process.env.HARDHAT_RPC_URL ??
  process.env.POLYGON_AMOY_RPC ??
  "http://127.0.0.1:8545";

const deployerKey =
  process.env.DEPLOYER_PRIVATE_KEY ??
  process.env.PRIVKEY_GOVT_OFFICIAL;

export const provider = new ethers.JsonRpcProvider(rpcUrl);

export const signer: ethers.Wallet | null = deployerKey
  ? new ethers.Wallet(deployerKey, provider)
  : null;

// ── Contract instances (null when addresses not configured) ───────────────────

const registryAddr = process.env.PROJECT_REGISTRY_ADDRESS;
const escrowAddr = process.env.MILESTONE_ESCROW_ADDRESS;
const roleManagerAddr = process.env.ROLE_MANAGER_ADDRESS;

export const projectRegistry: ethers.Contract | null =
  isConfiguredContractAddress(registryAddr) && signer
    ? new ethers.Contract(registryAddr, loadContractAbi("ProjectRegistry"), signer)
    : null;

export const milestoneEscrow: ethers.Contract | null =
  isConfiguredContractAddress(escrowAddr) && signer
    ? new ethers.Contract(escrowAddr, loadContractAbi("MilestoneEscrow"), signer)
    : null;

export const roleManager: ethers.Contract | null =
  isConfiguredContractAddress(roleManagerAddr)
    ? new ethers.Contract(roleManagerAddr, loadContractAbi("RoleManager"), provider)
    : null;

logger.info(
  {
    rpc: rpcUrl,
    hasSigner: !!signer,
    signerAddress: signer?.address ?? "none",
    projectRegistry: registryAddr ?? "not configured",
    milestoneEscrow: escrowAddr ?? "not configured",
    roleManager: roleManagerAddr ?? "not configured",
  },
  "blockchainConfig: initialized",
);
