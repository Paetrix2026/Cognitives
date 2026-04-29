import { ethers } from "ethers";
import { createConfiguredProvider, getBlockchainRpcUrl, isConfiguredContractAddress } from "../config/contracts";
import { logger } from "../lib/logger";
import type { ProjectCategory } from "../data";

// ── ABIs ─────────────────────────────────────────────────────────────────────

const REGISTRY_ABI = [
  "function createProject(string,string,string,int256,int256,uint256,uint256,address,uint8) returns (uint256)",
  "function approveProject(uint256)",
  "function rejectProject(uint256,string)",
  "function pauseProject(uint256)",
  "function resumeProject(uint256)",
  "function closeProject(uint256)",
  "function assignContractor(uint256,address)",
  "event ProjectCreated(uint256 indexed,string,address indexed,address indexed,uint256)",
  "event ProjectApproved(uint256 indexed,address indexed)",
  "event ProjectRejected(uint256 indexed,address indexed,string)",
  "event ProjectStatusUpdated(uint256 indexed,uint8)",
  "event ProjectPaused(uint256 indexed,address indexed)",
  "event ProjectResumed(uint256 indexed,address indexed)",
  "event ProjectClosed(uint256 indexed,address indexed)",
  "event ContractorAssigned(uint256 indexed,address indexed)",
  "event ProjectSpentUpdated(uint256 indexed,uint256)",
];

const ESCROW_ABI = [
  "function fundProject(uint256) payable",
  "function createMilestone(uint256,string,string,uint256) returns (uint256)",
  "function submitProof(uint256,string,int256,int256)",
  "function approveMilestone(uint256)",
  "function rejectMilestone(uint256,string)",
  "function releaseFunds(uint256)",
  "event MilestoneCreated(uint256 indexed,uint256 indexed)",
  "event ProofSubmitted(uint256 indexed,string,int256,int256,address indexed)",
  "event MilestoneApproved(uint256 indexed,address indexed,uint256)",
  "event FundsReleased(uint256 indexed,uint256,address indexed)",
  "event MilestoneRejected(uint256 indexed,string)",
];

// ── Category mapping (matches ProjectRegistry.sol enum order) ────────────────

const CATEGORY_INDEX: Record<ProjectCategory, number> = {
  ROAD: 0, DRAINAGE: 1, WATER_SUPPLY: 2, STREET_LIGHTING: 3,
  PARK: 4, BUILDING: 5, OTHER: 6,
};

// ── State ─────────────────────────────────────────────────────────────────────

let provider: ethers.JsonRpcProvider | null = null;
const signers = new Map<string, ethers.Wallet>(); // lowercase address → wallet

// ── Init ──────────────────────────────────────────────────────────────────────

export function initContractService() {
  const rpcUrl = getBlockchainRpcUrl();
  const registryAddr = process.env.PROJECT_REGISTRY_ADDRESS;
  const escrowAddr = process.env.MILESTONE_ESCROW_ADDRESS;

  if (!rpcUrl || !isConfiguredContractAddress(registryAddr) || !isConfiguredContractAddress(escrowAddr)) {
    logger.info("contractService: blockchain writes disabled (demo mode)");
    return;
  }

  provider = createConfiguredProvider(rpcUrl);

  const rawKeys = [
    process.env.PRIVKEY_GOVT_OFFICIAL,
    process.env.PRIVKEY_AUDITOR,
    process.env.PRIVKEY_CONTRACTOR_1,
    process.env.PRIVKEY_CONTRACTOR_2,
    process.env.PRIVKEY_INSPECTOR,
  ].filter(Boolean) as string[];

  for (const key of rawKeys) {
    try {
      const wallet = new ethers.Wallet(key, provider);
      signers.set(wallet.address.toLowerCase(), wallet);
      logger.info({ address: wallet.address }, "contractService: signer loaded");
    } catch {
      logger.warn("contractService: invalid private key, skipping");
    }
  }

  logger.info(
    { signers: signers.size, registry: registryAddr, escrow: escrowAddr },
    "contractService: ready",
  );
}

export function isBlockchainEnabled(): boolean {
  return provider !== null && signers.size > 0;
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function registry(signerAddress?: string): ethers.Contract {
  const addr = process.env.PROJECT_REGISTRY_ADDRESS!;
  const runner = signerAddress
    ? (signers.get(signerAddress.toLowerCase()) ?? provider!)
    : provider!;
  return new ethers.Contract(addr, REGISTRY_ABI, runner);
}

function escrow(signerAddress?: string): ethers.Contract {
  const addr = process.env.MILESTONE_ESCROW_ADDRESS!;
  const runner = signerAddress
    ? (signers.get(signerAddress.toLowerCase()) ?? provider!)
    : provider!;
  return new ethers.Contract(addr, ESCROW_ABI, runner);
}

function firstEventArg(receipt: ethers.TransactionReceipt, contract: ethers.Contract, eventName: string): bigint | null {
  for (const log of receipt.logs) {
    try {
      const parsed = contract.interface.parseLog(log);
      if (parsed?.name === eventName) return parsed.args[0] as bigint;
    } catch { /* skip */ }
  }
  return null;
}

// ── Project calls ─────────────────────────────────────────────────────────────

export async function txCreateProject(params: {
  officialAddress: string;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  totalBudget: number;
  endDate: string;
  contractorAddress: string;
  category: ProjectCategory;
}): Promise<{ txHash: string; projectId: string; blockNumber: number; gasUsed: string } | null> {
  if (!isBlockchainEnabled()) return null;
  try {
    const reg = registry(params.officialAddress);
    const endTs = Math.floor(new Date(params.endDate).getTime() / 1000);
    const latInt = BigInt(Math.round(params.latitude * 1e6));
    const lngInt = BigInt(Math.round(params.longitude * 1e6));
    const categoryIndex = CATEGORY_INDEX[params.category] ?? 6;
    const contractor = params.contractorAddress === "0x0000000000000000000000000000000000000000"
      ? ethers.ZeroAddress : params.contractorAddress;

    const tx = await reg.createProject(
      params.title, params.description, params.location,
      latInt, lngInt, BigInt(params.totalBudget), BigInt(endTs),
      contractor, categoryIndex,
    );
    const receipt: ethers.TransactionReceipt = await tx.wait();
    const projectId = firstEventArg(receipt, reg, "ProjectCreated");
    return {
      txHash: receipt.hash,
      projectId: projectId?.toString() ?? "",
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (err) {
    logger.error({ err }, "txCreateProject failed");
    return null;
  }
}

export async function txApproveProject(projectId: string, auditorAddress: string): Promise<string | null> {
  if (!isBlockchainEnabled()) return null;
  try {
    const tx = await registry(auditorAddress).approveProject(BigInt(projectId));
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (err) {
    logger.error({ err }, "txApproveProject failed");
    return null;
  }
}

export async function txRejectProject(projectId: string, auditorAddress: string, reason: string): Promise<string | null> {
  if (!isBlockchainEnabled()) return null;
  try {
    const tx = await registry(auditorAddress).rejectProject(BigInt(projectId), reason);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (err) {
    logger.error({ err }, "txRejectProject failed");
    return null;
  }
}

export async function txPauseProject(projectId: string, auditorAddress: string): Promise<string | null> {
  if (!isBlockchainEnabled()) return null;
  try {
    const tx = await registry(auditorAddress).pauseProject(BigInt(projectId));
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (err) {
    logger.error({ err }, "txPauseProject failed");
    return null;
  }
}

export async function txResumeProject(projectId: string, auditorAddress: string): Promise<string | null> {
  if (!isBlockchainEnabled()) return null;
  try {
    const tx = await registry(auditorAddress).resumeProject(BigInt(projectId));
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (err) {
    logger.error({ err }, "txResumeProject failed");
    return null;
  }
}

export async function txCloseProject(projectId: string, officialAddress: string): Promise<string | null> {
  if (!isBlockchainEnabled()) return null;
  try {
    const tx = await registry(officialAddress).closeProject(BigInt(projectId));
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (err) {
    logger.error({ err }, "txCloseProject failed");
    return null;
  }
}

export async function txAssignContractor(projectId: string, officialAddress: string, contractorAddress: string): Promise<string | null> {
  if (!isBlockchainEnabled()) return null;
  try {
    const tx = await registry(officialAddress).assignContractor(BigInt(projectId), contractorAddress);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (err) {
    logger.error({ err }, "txAssignContractor failed");
    return null;
  }
}

// ── Milestone calls ───────────────────────────────────────────────────────────

export async function txCreateMilestone(params: {
  officialAddress: string;
  projectId: string;
  title: string;
  description: string;
  paymentAmount: number;
}): Promise<{ txHash: string; milestoneId: string } | null> {
  if (!isBlockchainEnabled()) return null;
  try {
    const esc = escrow(params.officialAddress);
    const amount = BigInt(params.paymentAmount);

    // Fund escrow before creating milestone
    const fundTx = await esc.fundProject(BigInt(params.projectId), { value: amount });
    await fundTx.wait();

    const tx = await esc.createMilestone(
      BigInt(params.projectId), params.title, params.description, amount,
    );
    const receipt: ethers.TransactionReceipt = await tx.wait();
    const milestoneId = firstEventArg(receipt, esc, "MilestoneCreated");
    return { txHash: receipt.hash, milestoneId: milestoneId?.toString() ?? "" };
  } catch (err) {
    logger.error({ err }, "txCreateMilestone failed");
    return null;
  }
}

export async function txSubmitProof(params: {
  submitterAddress: string;
  milestoneId: string;
  ipfsCID: string;
  latitude: number;
  longitude: number;
}): Promise<string | null> {
  if (!isBlockchainEnabled()) return null;
  try {
    const latInt = BigInt(Math.round(params.latitude * 1e6));
    const lngInt = BigInt(Math.round(params.longitude * 1e6));
    const tx = await escrow(params.submitterAddress).submitProof(
      BigInt(params.milestoneId), params.ipfsCID, latInt, lngInt,
    );
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (err) {
    logger.error({ err }, "txSubmitProof failed");
    return null;
  }
}

export async function txApproveMilestone(milestoneId: string, auditorAddress: string): Promise<{ txHash: string; blockNumber: number; gasUsed: string } | null> {
  if (!isBlockchainEnabled()) return null;
  try {
    const tx = await escrow(auditorAddress).approveMilestone(BigInt(milestoneId));
    const receipt = await tx.wait();
    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
    };
  } catch (err) {
    logger.error({ err }, "txApproveMilestone failed");
    return null;
  }
}

export async function txRejectMilestone(milestoneId: string, auditorAddress: string, reason: string): Promise<string | null> {
  if (!isBlockchainEnabled()) return null;
  try {
    const tx = await escrow(auditorAddress).rejectMilestone(BigInt(milestoneId), reason);
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (err) {
    logger.error({ err }, "txRejectMilestone failed");
    return null;
  }
}

export async function txReleaseFunds(milestoneId: string, officialAddress: string): Promise<string | null> {
  if (!isBlockchainEnabled()) return null;
  try {
    const tx = await escrow(officialAddress).releaseFunds(BigInt(milestoneId));
    const receipt = await tx.wait();
    return receipt.hash;
  } catch (err) {
    logger.error({ err }, "txReleaseFunds failed");
    return null;
  }
}
