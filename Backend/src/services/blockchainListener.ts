import { ethers } from "ethers";
import { createConfiguredProvider, getBlockchainRpcUrl, isConfiguredContractAddress } from "../config/contracts";
import { logger } from "../lib/logger";
import {
  activities,
  makeId,
  makeTxHash,
  milestones,
  persistActivity,
  persistMilestone,
  persistProject,
  projects,
  updateProjectDerivedFields,
} from "../data";
import { publishLedgerEvent } from "../socket/server";

const MILESTONE_ESCROW_ABI = [
  "event MilestoneCreated(uint256 indexed milestoneId, uint256 indexed projectId)",
  "event ProofSubmitted(uint256 indexed milestoneId, string ipfsCID, int256 latitude, int256 longitude, address indexed submittedBy)",
  "event MilestoneApproved(uint256 indexed milestoneId, address indexed approvedBy, uint256 approvalCount)",
  "event FundsReleased(uint256 indexed milestoneId, uint256 amount, address indexed contractorAddress)",
  "event MilestoneRejected(uint256 indexed milestoneId, string reason)",
];

const PROJECT_REGISTRY_ABI = [
  "event ProjectCreated(uint256 indexed projectId, string title, address indexed officialAddress, address indexed contractorAddress, uint256 totalBudget)",
  "event ProjectApproved(uint256 indexed projectId, address indexed auditor)",
  "event ProjectRejected(uint256 indexed projectId, address indexed auditor, string reason)",
  "event ProjectStatusUpdated(uint256 indexed projectId, uint8 status)",
  "event ProjectPaused(uint256 indexed projectId, address indexed auditor)",
  "event ProjectResumed(uint256 indexed projectId, address indexed auditor)",
  "event ProjectClosed(uint256 indexed projectId, address indexed official)",
  "event ContractorAssigned(uint256 indexed projectId, address indexed contractor)",
  "event ProjectSpentUpdated(uint256 indexed projectId, uint256 spentAmount)",
];

type ChainEventHandler = (...args: unknown[]) => Promise<void> | void;

interface ChainListener {
  contract: ethers.Contract;
  eventName: string;
  handler: ChainEventHandler;
}

const POLL_INTERVAL_MS = Number(process.env.BLOCKCHAIN_EVENT_POLL_MS ?? "12000");

function listen(contract: ethers.Contract, eventName: string, handler: ChainEventHandler, listeners: ChainListener[]) {
  listeners.push({ contract, eventName, handler });
}

function startEventPolling(provider: ethers.JsonRpcProvider, listeners: ChainListener[]) {
  let nextBlock: number | null = null;
  let polling = false;

  const poll = async () => {
    if (polling) return;
    polling = true;
    try {
      const latestBlock = await provider.getBlockNumber();
      if (nextBlock === null) {
        nextBlock = latestBlock + 1;
        return;
      }
      if (latestBlock < nextBlock) return;

      for (const listener of listeners) {
        const filters = listener.contract.filters as unknown as Record<string, (() => ethers.DeferredTopicFilter) | undefined>;
        const filter = filters[listener.eventName]?.();
        if (!filter) continue;

        const logs = await listener.contract.queryFilter(filter, nextBlock, latestBlock);
        for (const log of logs) {
          if (!("args" in log)) continue;
          await listener.handler(...Array.from(log.args));
        }
      }

      nextBlock = latestBlock + 1;
    } catch (err) {
      logger.warn({ err }, "Blockchain event polling failed; will retry");
    } finally {
      polling = false;
    }
  };

  void poll();
  const timer = setInterval(() => void poll(), Math.max(POLL_INTERVAL_MS, 1000));
  timer.unref?.();
}

export function startBlockchainListener() {
  const rpcUrl = getBlockchainRpcUrl();
  const registryAddr = process.env.PROJECT_REGISTRY_ADDRESS;
  const escrowAddr = process.env.MILESTONE_ESCROW_ADDRESS;

  if (!rpcUrl || !isConfiguredContractAddress(registryAddr) || !isConfiguredContractAddress(escrowAddr)) {
    logger.info(
      {
        hasRpcUrl: Boolean(rpcUrl),
        hasProjectRegistryAddress: isConfiguredContractAddress(registryAddr),
        hasMilestoneEscrowAddress: isConfiguredContractAddress(escrowAddr),
      },
      "Blockchain listener running in demo sync mode (set real contract addresses to enable live sync)",
    );
    return;
  }

  const provider = createConfiguredProvider(rpcUrl);

  const registry = new ethers.Contract(registryAddr, PROJECT_REGISTRY_ABI, provider);
  const escrow = new ethers.Contract(escrowAddr, MILESTONE_ESCROW_ABI, provider);
  const listeners: ChainListener[] = [];

  // ── ProjectRegistry events ─────────────────────────────────────────────────

  listen(registry, "ProjectCreated", async (projectId: bigint, title: string, officialAddress: string, contractorAddress: string, totalBudget: bigint) => {
    const idStr = projectId.toString();
    if (projects.find((p) => p.id === idStr)) return; // API route already added it
    const project = {
      id: idStr, title, description: "", location: "",
      latitude: 0, longitude: 0,
      totalBudget: Number(totalBudget), spentAmount: 0,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      officialAddress, contractorAddress,
      status: "PENDING_APPROVAL" as const,
      milestoneCount: 0, txHash: makeTxHash(),
      riskLevel: "LOW" as const, category: "OTHER" as const, reportCount: 0,
      isPrivate: false,
    };
    projects.unshift(project);
    const activity = { id: makeId("a"), type: "ProjectCreated", title: `${title} registered on-chain`, projectId: idStr, txHash: project.txHash, timestamp: new Date().toISOString() };
    activities.unshift(activity);
    await persistProject(project);
    await persistActivity(activity);
    publishLedgerEvent({ type: "project.updated", projectId: idStr });
    publishLedgerEvent({ type: "activity.created", projectId: idStr, activityId: activity.id });
    logger.info({ projectId: idStr }, "Chain: project created");
  }, listeners);

  listen(registry, "ProjectApproved", async (projectId: bigint) => {
    const idStr = projectId.toString();
    const project = projects.find((p) => p.id === idStr);
    if (!project) return;
    if (project.status === "ACTIVE") return; // API route already updated it
    project.status = "ACTIVE";
    await persistProject(project);
    publishLedgerEvent({ type: "project.updated", projectId: idStr });
    logger.info({ projectId: idStr }, "Chain: project approved");
  }, listeners);

  listen(registry, "ProjectRejected", async (projectId: bigint) => {
    const idStr = projectId.toString();
    const project = projects.find((p) => p.id === idStr);
    if (!project) return;
    if (project.status === "CANCELLED") return;
    project.status = "CANCELLED";
    await persistProject(project);
    publishLedgerEvent({ type: "project.updated", projectId: idStr });
    logger.info({ projectId: idStr }, "Chain: project rejected");
  }, listeners);

  listen(registry, "ProjectPaused", async (projectId: bigint) => {
    const idStr = projectId.toString();
    const project = projects.find((p) => p.id === idStr);
    if (!project) return;
    if (project.status === "PAUSED") return;
    project.status = "PAUSED";
    await persistProject(project);
    publishLedgerEvent({ type: "project.updated", projectId: idStr });
    logger.info({ projectId: idStr }, "Chain: project paused");
  }, listeners);

  listen(registry, "ProjectResumed", async (projectId: bigint) => {
    const idStr = projectId.toString();
    const project = projects.find((p) => p.id === idStr);
    if (!project) return;
    if (project.status === "ACTIVE") return;
    project.status = "ACTIVE";
    await persistProject(project);
    publishLedgerEvent({ type: "project.updated", projectId: idStr });
    logger.info({ projectId: idStr }, "Chain: project resumed");
  }, listeners);

  listen(registry, "ProjectClosed", async (projectId: bigint) => {
    const idStr = projectId.toString();
    const project = projects.find((p) => p.id === idStr);
    if (!project) return;
    if (project.status === "COMPLETED") return;
    project.status = "COMPLETED";
    await persistProject(project);
    publishLedgerEvent({ type: "project.updated", projectId: idStr });
    logger.info({ projectId: idStr }, "Chain: project closed");
  }, listeners);

  listen(registry, "ContractorAssigned", async (projectId: bigint, contractor: string) => {
    const idStr = projectId.toString();
    const project = projects.find((p) => p.id === idStr);
    if (!project) return;
    if (project.contractorAddress === contractor) return;
    project.contractorAddress = contractor;
    await persistProject(project);
    publishLedgerEvent({ type: "project.updated", projectId: idStr });
    logger.info({ projectId: idStr, contractor }, "Chain: contractor assigned");
  }, listeners);

  listen(registry, "ProjectSpentUpdated", async (projectId: bigint, spentAmount: bigint) => {
    const idStr = projectId.toString();
    const project = projects.find((p) => p.id === idStr);
    if (!project) return;
    project.spentAmount = Number(spentAmount);
    await persistProject(project);
    publishLedgerEvent({ type: "project.updated", projectId: idStr });
  }, listeners);

  // ── MilestoneEscrow events ─────────────────────────────────────────────────

  listen(escrow, "MilestoneCreated", async (milestoneId: bigint, projectId: bigint) => {
    const idStr = milestoneId.toString();
    const projIdStr = projectId.toString();
    if (milestones.find((m) => m.id === idStr)) return; // API route already added it
    const project = projects.find((p) => p.id === projIdStr);
    const milestone = {
      id: idStr, projectId: projIdStr,
      title: "Milestone", description: "",
      paymentAmount: 0, status: "PENDING" as const,
      approvalCount: 0, txHash: makeTxHash(),
      approvers: [], createdAt: new Date().toISOString(),
    };
    milestones.push(milestone);
    if (project) { updateProjectDerivedFields(projIdStr); await persistProject(project); }
    await persistMilestone(milestone);
    publishLedgerEvent({ type: "milestone.updated", projectId: projIdStr, milestoneId: idStr });
    logger.info({ milestoneId: idStr, projectId: projIdStr }, "Chain: milestone created");
  }, listeners);

  listen(escrow, "ProofSubmitted", async (milestoneId: bigint, ipfsCID: string, latitude: bigint, longitude: bigint, submittedBy: string) => {
    const idStr = milestoneId.toString();
    const milestone = milestones.find((m) => m.id === idStr);
    if (!milestone) return;
    if (milestone.status === "PROOF_SUBMITTED") return; // API route already updated it
    milestone.ipfsProofCID = ipfsCID;
    milestone.proofLatitude = Number(latitude) / 1e6;
    milestone.proofLongitude = Number(longitude) / 1e6;
    milestone.submittedBy = submittedBy;
    milestone.submittedAt = new Date().toISOString();
    milestone.status = "PROOF_SUBMITTED";
    const activity = { id: makeId("a"), type: "ProofSubmitted", title: `${milestone.title} proof pinned on-chain`, projectId: milestone.projectId, txHash: milestone.txHash, timestamp: milestone.submittedAt };
    activities.unshift(activity);
    await persistMilestone(milestone);
    await persistActivity(activity);
    publishLedgerEvent({ type: "milestone.updated", projectId: milestone.projectId, milestoneId: idStr });
    publishLedgerEvent({ type: "activity.created", projectId: milestone.projectId, activityId: activity.id });
    logger.info({ milestoneId: idStr, cid: ipfsCID }, "Chain: proof submitted");
  }, listeners);

  listen(escrow, "MilestoneApproved", async (milestoneId: bigint, _approvedBy: string, approvalCount: bigint) => {
    const idStr = milestoneId.toString();
    const milestone = milestones.find((m) => m.id === idStr);
    if (!milestone) return;
    if (milestone.status === "APPROVED") return; // API route already updated it
    milestone.approvalCount = Number(approvalCount);
    milestone.status = "APPROVED";
    milestone.approvedAt = new Date().toISOString();
    updateProjectDerivedFields(milestone.projectId);
    const project = projects.find((p) => p.id === milestone.projectId);
    if (project) await persistProject(project);
    await persistMilestone(milestone);
    publishLedgerEvent({ type: "milestone.updated", projectId: milestone.projectId, milestoneId: idStr });
    publishLedgerEvent({ type: "project.updated", projectId: milestone.projectId });
    logger.info({ milestoneId: idStr, approvalCount: Number(approvalCount) }, "Chain: milestone approved");
  }, listeners);

  listen(escrow, "FundsReleased", async (milestoneId: bigint, amount: bigint, contractorAddress: string) => {
    const idStr = milestoneId.toString();
    const milestone = milestones.find((m) => m.id === idStr);
    if (!milestone) return;
    if (milestone.status === "PAID") return; // API route already updated it
    milestone.status = "PAID";
    updateProjectDerivedFields(milestone.projectId);
    const project = projects.find((p) => p.id === milestone.projectId);
    if (project) await persistProject(project);
    await persistMilestone(milestone);
    const activity = { id: makeId("a"), type: "FundsReleased", title: `₹${Number(amount).toLocaleString()} released to ${contractorAddress.slice(0, 8)}…`, projectId: milestone.projectId, txHash: milestone.txHash, timestamp: new Date().toISOString() };
    activities.unshift(activity);
    await persistActivity(activity);
    publishLedgerEvent({ type: "milestone.updated", projectId: milestone.projectId, milestoneId: idStr });
    publishLedgerEvent({ type: "project.updated", projectId: milestone.projectId });
    publishLedgerEvent({ type: "activity.created", projectId: milestone.projectId, activityId: activity.id });
    logger.info({ milestoneId: idStr, amount: amount.toString() }, "Chain: funds released");
  }, listeners);

  listen(escrow, "MilestoneRejected", async (milestoneId: bigint, reason: string) => {
    const idStr = milestoneId.toString();
    const milestone = milestones.find((m) => m.id === idStr);
    if (!milestone) return;
    if (milestone.status === "REJECTED") return; // API route already updated it
    milestone.status = "REJECTED";
    milestone.rejectionReason = reason;
    milestone.approvers = [];
    milestone.approvalCount = 0;
    await persistMilestone(milestone);
    publishLedgerEvent({ type: "milestone.updated", projectId: milestone.projectId, milestoneId: idStr });
    logger.info({ milestoneId: idStr }, "Chain: milestone rejected");
  }, listeners);

  startEventPolling(provider, listeners);
  logger.info({ registry: registryAddr, escrow: escrowAddr }, "Blockchain listener active");
}
