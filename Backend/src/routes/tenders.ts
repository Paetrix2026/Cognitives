import { Router, type IRouter } from "express";
import {
  activities,
  makeId,
  makeTxHash,
  persistActivity,
  persistProject,
  persistTender,
  projects,
  tenders,
  updateProjectDerivedFields,
  users,
} from "../data";
import { publishLedgerEvent } from "../socket/server";
import { txAssignContractor } from "../services/contractService";

const router: IRouter = Router();
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function isUnassigned(contractorAddress: string) {
  return !contractorAddress || contractorAddress.toLowerCase() === ZERO_ADDRESS;
}

function isAssignableProjectStatus(status: string) {
  return !["COMPLETED", "CANCELLED"].includes(status);
}

function activeAssignmentCount(walletAddress: string) {
  const wallet = walletAddress.toLowerCase();
  return projects.filter((project) =>
    project.contractorAddress.toLowerCase() === wallet &&
    ["ACTIVE", "PAUSED", "PENDING_APPROVAL", "CREATED"].includes(project.status),
  ).length;
}

async function assignContractorToProject(params: {
  projectId: string;
  contractorAddress: string;
  officialAddress: string;
  activityType: string;
  title: string;
}) {
  const project = projects.find((p) => p.id === params.projectId);
  if (!project) return { status: 404 as const, body: { message: "Project not found" } };
  if (!isAssignableProjectStatus(project.status)) {
    return { status: 409 as const, body: { message: `Project is ${project.status} and cannot be assigned` } };
  }
  if (!params.contractorAddress || !params.contractorAddress.startsWith("0x") || params.contractorAddress.length !== 42) {
    return { status: 400 as const, body: { message: "A valid contractorAddress is required" } };
  }
  const contractor = users.get(params.contractorAddress.toLowerCase());
  if (!contractor || contractor.role !== "CONTRACTOR") {
    return { status: 400 as const, body: { message: "Selected wallet is not a registered contractor" } };
  }
  if (activeAssignmentCount(params.contractorAddress) > 0) {
    return { status: 409 as const, body: { message: "Selected contractor is not currently available" } };
  }

  const txHash = await txAssignContractor(project.id, params.officialAddress, params.contractorAddress) ?? makeTxHash();
  project.contractorAddress = params.contractorAddress;
  if (project.status === "CREATED" || project.status === "PENDING_APPROVAL") {
    project.status = "ACTIVE";
  }
  updateProjectDerivedFields(project.id);

  const activity = {
    id: makeId("a"),
    type: params.activityType,
    title: params.title,
    projectId: project.id,
    txHash,
    timestamp: new Date().toISOString(),
  };
  activities.unshift(activity);
  await persistProject(project);
  await persistActivity(activity);
  publishLedgerEvent({ type: "project.updated", projectId: project.id });
  publishLedgerEvent({ type: "activity.created", projectId: project.id, activityId: activity.id });
  return { status: 200 as const, body: { project, activity } };
}

router.get("/contractors", (_req, res) => {
  const contractors = [...users.values()]
    .filter((user) => user.role === "CONTRACTOR")
    .map((user) => ({
      walletAddress: user.walletAddress,
      name: user.googleName ?? null,
      activeAssignments: activeAssignmentCount(user.walletAddress),
      available: activeAssignmentCount(user.walletAddress) === 0,
    }))
    .sort((a, b) => Number(a.available) === Number(b.available)
      ? a.walletAddress.localeCompare(b.walletAddress)
      : Number(b.available) - Number(a.available));
  res.json(contractors);
});

router.post("/projects/:id/tender", async (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }
  if (!isAssignableProjectStatus(project.status)) {
    res.status(409).json({ message: `Project is ${project.status} and cannot be broadcast` });
    return;
  }
  if (!isUnassigned(project.contractorAddress)) {
    res.status(409).json({ message: "Project already has an assigned contractor" });
    return;
  }
  if (tenders.find((t) => t.projectId === project.id && t.status === "OPEN")) {
    res.status(409).json({ message: "An open broadcast already exists for this project" });
    return;
  }

  const { description, deadline, publishedBy } = req.body ?? {};
  if (!description || !deadline || !publishedBy) {
    res.status(400).json({ message: "description, deadline, and publishedBy are required" });
    return;
  }

  const tender = {
    id: makeId("t"),
    projectId: project.id,
    description: String(description).slice(0, 800),
    minimumBid: project.totalBudget,
    deadline: String(deadline),
    status: "OPEN" as const,
    publishedBy: String(publishedBy),
    createdAt: new Date().toISOString(),
  };
  tenders.unshift(tender);

  const activity = {
    id: makeId("a"),
    type: "ProjectBroadcast",
    title: `${project.title} broadcast for first-come contractor assignment`,
    projectId: project.id,
    txHash: makeTxHash(),
    timestamp: tender.createdAt,
  };
  activities.unshift(activity);
  await persistTender(tender);
  await persistActivity(activity);
  publishLedgerEvent({ type: "project.updated", projectId: project.id });
  publishLedgerEvent({ type: "activity.created", projectId: project.id, activityId: activity.id });
  res.status(201).json(tender);
});

router.get("/projects/:id/tender", (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }
  const tender = tenders.find((t) => t.projectId === project.id && t.status === "OPEN")
    ?? tenders.find((t) => t.projectId === project.id);
  if (!tender) {
    res.status(404).json({ message: "No broadcast found for this project" });
    return;
  }
  res.json(tender);
});

router.get("/tenders", (_req, res) => {
  const open = tenders
    .filter((t) => t.status === "OPEN" && new Date(t.deadline) > new Date())
    .map((t) => {
      const project = projects.find((p) => p.id === t.projectId);
      return {
        ...t,
        projectTitle: project?.title ?? "",
        projectLocation: project?.location ?? "",
        projectCategory: project?.category ?? "OTHER",
      };
    });
  res.json(open);
});

router.post("/tenders/:id/claim", async (req, res) => {
  const tender = tenders.find((t) => t.id === req.params.id);
  if (!tender) {
    res.status(404).json({ message: "Broadcast not found" });
    return;
  }
  if (tender.status !== "OPEN") {
    res.status(409).json({ message: "Broadcast has already been claimed or cancelled" });
    return;
  }
  if (new Date(tender.deadline) < new Date()) {
    res.status(409).json({ message: "Broadcast deadline has passed" });
    return;
  }

  const project = projects.find((p) => p.id === tender.projectId);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }
  if (!isUnassigned(project.contractorAddress)) {
    tender.status = "AWARDED";
    await persistTender(tender);
    res.status(409).json({ message: "Project was already assigned to another contractor" });
    return;
  }

  const contractorAddress = String(req.body?.contractorAddress ?? "");
  const result = await assignContractorToProject({
    projectId: project.id,
    contractorAddress,
    officialAddress: project.officialAddress,
    activityType: "BroadcastClaimed",
    title: `${contractorAddress.slice(0, 10)}... claimed ${project.title} from broadcast`,
  });
  if (result.status !== 200) {
    res.status(result.status).json(result.body);
    return;
  }

  tender.status = "AWARDED";
  await persistTender(tender);
  res.json({ tender, ...result.body });
});

router.post("/projects/:id/assign-contractor", async (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  const contractorAddress = String(req.body?.contractorAddress ?? "");
  const officialAddress = String(req.body?.officialAddress ?? project?.officialAddress ?? "");
  const result = await assignContractorToProject({
    projectId: req.params.id,
    contractorAddress,
    officialAddress,
    activityType: "DirectContractorAssigned",
    title: `${contractorAddress.slice(0, 10)}... directly assigned to ${project?.title ?? "project"} by official order`,
  });
  res.status(result.status).json(result.body);
});

export default router;
