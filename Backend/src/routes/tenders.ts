import { Router, type IRouter } from "express";
import {
  activities,
  bids,
  makeId,
  makeTxHash,
  persistActivity,
  persistBid,
  persistProject,
  persistTender,
  projects,
  tenders,
  updateProjectDerivedFields,
} from "../data";
import { publishLedgerEvent } from "../socket/server";

const router: IRouter = Router();

// ── Publish a tender for a project ────────────────────────────────────────────
router.post("/projects/:id/tender", async (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }
  if (tenders.find((t) => t.projectId === project.id && t.status === "OPEN")) {
    res.status(409).json({ message: "An open tender already exists for this project" });
    return;
  }
  const { description, minimumBid, deadline, publishedBy } = req.body ?? {};
  if (!description || !minimumBid || !deadline || !publishedBy) {
    res.status(400).json({ message: "description, minimumBid, deadline, and publishedBy are required" });
    return;
  }

  const tender = {
    id: makeId("t"),
    projectId: project.id,
    description: String(description).slice(0, 800),
    minimumBid: Number(minimumBid),
    deadline: String(deadline),
    status: "OPEN" as const,
    publishedBy: String(publishedBy),
    createdAt: new Date().toISOString(),
  };
  tenders.unshift(tender);

  const activity = { id: makeId("a"), type: "TenderPublished", title: `Tender published for ${project.title}`, projectId: project.id, txHash: makeTxHash(), timestamp: tender.createdAt };
  activities.unshift(activity);
  await persistTender(tender);
  await persistActivity(activity);
  publishLedgerEvent({ type: "project.updated", projectId: project.id });
  publishLedgerEvent({ type: "activity.created", projectId: project.id, activityId: activity.id });
  res.status(201).json(tender);
});

// ── Get current tender for a project ─────────────────────────────────────────
router.get("/projects/:id/tender", (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }
  const tender = tenders.find((t) => t.projectId === project.id && t.status === "OPEN")
    ?? tenders.find((t) => t.projectId === project.id);
  if (!tender) {
    res.json(null);
    return;
  }
  res.json(tender);
});

// ── List all open tenders (for contractor browsing) ───────────────────────────
router.get("/tenders", (_req, res) => {
  const open = tenders
    .filter((t) => t.status === "OPEN" && new Date(t.deadline) > new Date())
    .map((t) => {
      const project = projects.find((p) => p.id === t.projectId);
      return { ...t, projectTitle: project?.title ?? "", projectLocation: project?.location ?? "", projectCategory: project?.category ?? "OTHER" };
    });
  res.json(open);
});

// ── Submit a bid ──────────────────────────────────────────────────────────────
router.post("/tenders/:id/bids", async (req, res) => {
  const tender = tenders.find((t) => t.id === req.params.id);
  if (!tender) {
    res.status(404).json({ message: "Tender not found" });
    return;
  }
  if (tender.status !== "OPEN") {
    res.status(409).json({ message: "Tender is no longer open" });
    return;
  }
  if (new Date(tender.deadline) < new Date()) {
    res.status(409).json({ message: "Tender deadline has passed" });
    return;
  }
  const { bidderAddress, proposedAmount, notes } = req.body ?? {};
  if (!bidderAddress || !proposedAmount) {
    res.status(400).json({ message: "bidderAddress and proposedAmount are required" });
    return;
  }
  if (Number(proposedAmount) < tender.minimumBid) {
    res.status(400).json({ message: `Bid must be at least ₹${tender.minimumBid.toLocaleString()}` });
    return;
  }

  // One bid per bidder per tender
  const existing = bids.find((b) => b.tenderId === tender.id && b.bidderAddress.toLowerCase() === String(bidderAddress).toLowerCase() && b.status === "PENDING");
  if (existing) {
    res.status(409).json({ message: "You already have a pending bid on this tender" });
    return;
  }

  const bid = {
    id: makeId("b"),
    tenderId: tender.id,
    projectId: tender.projectId,
    bidderAddress: String(bidderAddress),
    proposedAmount: Number(proposedAmount),
    notes: String(notes ?? "").slice(0, 600),
    status: "AWARDED" as const,
    createdAt: new Date().toISOString(),
  };
  const project = projects.find((p) => p.id === tender.projectId);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  tender.status = "AWARDED";
  project.contractorAddress = bid.bidderAddress;
  if (project.status === "CREATED" || project.status === "ACTIVE") {
    project.status = "ACTIVE";
  }
  bids.unshift(bid);
  updateProjectDerivedFields(project.id);

  const txHash = makeTxHash();
  const activity = {
    id: makeId("a"),
    type: "ContractorAwarded",
    title: `${bid.bidderAddress.slice(0, 10)}... agreed to ${project.title}`,
    projectId: project.id,
    txHash,
    timestamp: new Date().toISOString(),
  };
  activities.unshift(activity);

  await persistBid(bid);
  await persistTender(tender);
  await persistProject(project);
  await persistActivity(activity);
  publishLedgerEvent({ type: "project.updated", projectId: project.id });
  publishLedgerEvent({ type: "activity.created", projectId: project.id, activityId: activity.id });

  res.status(201).json(bid);
});

// ── List bids for a tender ────────────────────────────────────────────────────
router.get("/tenders/:id/bids", (req, res) => {
  const tender = tenders.find((t) => t.id === req.params.id);
  if (!tender) {
    res.status(404).json({ message: "Tender not found" });
    return;
  }
  res.json(bids.filter((b) => b.tenderId === tender.id));
});

// ── Award a bid (official selects contractor) ─────────────────────────────────
router.post("/tenders/:id/bids/:bidId/award", async (req, res) => {
  const tender = tenders.find((t) => t.id === req.params.id);
  if (!tender) {
    res.status(404).json({ message: "Tender not found" });
    return;
  }
  if (tender.status !== "OPEN") {
    res.status(409).json({ message: "Tender already awarded or cancelled" });
    return;
  }
  const bid = bids.find((b) => b.id === req.params.bidId && b.tenderId === tender.id);
  if (!bid) {
    res.status(404).json({ message: "Bid not found" });
    return;
  }

  const project = projects.find((p) => p.id === tender.projectId);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }

  // Award: update bid + tender status, assign contractor on project
  bid.status = "AWARDED";
  tender.status = "AWARDED";
  project.contractorAddress = bid.bidderAddress;
  if (project.status === "CREATED") project.status = "ACTIVE";

  // Reject all other pending bids
  for (const other of bids.filter((b) => b.tenderId === tender.id && b.id !== bid.id && b.status === "PENDING")) {
    other.status = "REJECTED";
    await persistBid(other);
  }

  const txHash = makeTxHash();
  const activity = { id: makeId("a"), type: "ContractorAwarded", title: `${bid.bidderAddress.slice(0, 10)}… awarded contract for ${project.title}`, projectId: project.id, txHash, timestamp: new Date().toISOString() };
  activities.unshift(activity);
  updateProjectDerivedFields(project.id);

  await persistBid(bid);
  await persistTender(tender);
  await persistProject(project);
  await persistActivity(activity);
  publishLedgerEvent({ type: "project.updated", projectId: project.id });
  publishLedgerEvent({ type: "activity.created", projectId: project.id, activityId: activity.id });

  res.json({ tender, bid, project });
});

export default router;
