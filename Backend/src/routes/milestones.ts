import { Router, type IRouter, type Response } from "express";
import {
  activities,
  deleteMilestone,
  makeId,
  makeTxHash,
  milestones,
  persistActivity,
  persistMilestone,
  persistProject,
  projects,
  serializeMilestone,
  updateProjectDerivedFields,
} from "../data";
import { publishLedgerEvent } from "../socket/server";
import { uploadProofImage, uploadProofMetadata } from "../services/ipfsService";

const router: IRouter = Router();

async function handleUploadProof(milestoneId: string, body: Record<string, unknown>, res: Response) {
  const milestone = milestones.find((item) => item.id === milestoneId);
  if (!milestone) {
    res.status(404).json({ message: "Milestone not found" });
    return;
  }
  const { ipfsCID, latitude, longitude, submittedBy, imageBase64, proofDescription } = body ?? {};
  if (latitude === undefined || longitude === undefined || !submittedBy) {
    res.status(400).json({ message: "latitude, longitude, and submittedBy are required" });
    return;
  }

  let resolvedCID = String(ipfsCID ?? "");
  if (!resolvedCID) {
    const meta = {
      milestoneId,
      milestoneTitle: milestone.title,
      projectId: milestone.projectId,
      submittedBy: String(submittedBy),
      latitude: Number(latitude),
      longitude: Number(longitude),
      description: proofDescription ? String(proofDescription) : undefined,
      timestamp: new Date().toISOString(),
    };
    const result = typeof imageBase64 === "string" && imageBase64.length > 0
      ? await uploadProofImage(imageBase64, `proof-${milestoneId}.jpg`, meta)
      : await uploadProofMetadata(meta);
    resolvedCID = result.cid;
  }

  milestone.ipfsProofCID = resolvedCID;
  milestone.proofLatitude = Number(latitude);
  milestone.proofLongitude = Number(longitude);
  milestone.submittedBy = String(submittedBy);
  milestone.submittedAt = new Date().toISOString();
  milestone.status = "PROOF_SUBMITTED";
  milestone.txHash = makeTxHash();
  milestone.rejectionReason = undefined;
  milestone.officialAcknowledgedAt = undefined;
  milestone.officialAcknowledgedBy = undefined;
  if (typeof imageBase64 === "string" && imageBase64.length > 0) {
    milestone.proofImageBase64 = imageBase64;
  }
  const activity = { id: makeId("a"), type: "ProofSubmitted", title: `${milestone.title} proof pinned to IPFS`, projectId: milestone.projectId, txHash: milestone.txHash, timestamp: milestone.submittedAt };
  activities.unshift(activity);
  await persistMilestone(milestone);
  await persistActivity(activity);
  publishLedgerEvent({ type: "milestone.updated", projectId: milestone.projectId, milestoneId: milestone.id });
  publishLedgerEvent({ type: "activity.created", projectId: milestone.projectId, activityId: activity.id });
  res.json(serializeMilestone(milestone));
}

router.get("/milestones/pending", (_req, res) => {
  const pending = milestones
    .filter((m) => m.status === "PROOF_SUBMITTED")
    .map((m) => {
      const project = projects.find((p) => p.id === m.projectId);
      return {
        id: m.id,
        projectId: m.projectId,
        projectTitle: project?.title ?? "Unknown project",
        title: m.title,
        description: m.description,
        paymentAmount: m.paymentAmount,
        ipfsProofCID: m.ipfsProofCID,
        proofLatitude: m.proofLatitude,
        proofLongitude: m.proofLongitude,
        submittedAt: m.submittedAt,
        submittedBy: m.submittedBy,
        status: m.status,
        approvalCount: m.approvalCount,
      };
    });
  res.json(pending);
});

router.get("/milestones/:projectId", (req, res) => {
  res.json(milestones.filter((item) => item.projectId === req.params.projectId).map(serializeMilestone));
});

router.post("/milestones", async (req, res) => {
  const { projectId, title, description, paymentAmount } = req.body ?? {};
  const project = projects.find((item) => item.id === String(projectId));
  if (!project || !title || !description || !paymentAmount) {
    res.status(400).json({ message: "Valid projectId, title, description, and paymentAmount are required" });
    return;
  }

  const milestone = { id: makeId(), projectId: project.id, title: String(title), description: String(description), paymentAmount: Number(paymentAmount), status: "PENDING" as const, approvalCount: 0, txHash: makeTxHash(), approvers: [], createdAt: new Date().toISOString() };
  milestones.push(milestone);
  updateProjectDerivedFields(project.id);
  const activity = { id: makeId("a"), type: "MilestoneCreated", title: `${milestone.title} added to ${project.title}`, projectId: project.id, txHash: milestone.txHash, timestamp: new Date().toISOString() };
  activities.unshift(activity);
  await persistMilestone(milestone);
  await persistProject(project);
  await persistActivity(activity);
  publishLedgerEvent({ type: "milestone.updated", projectId: project.id, milestoneId: milestone.id });
  publishLedgerEvent({ type: "activity.created", projectId: project.id, activityId: activity.id });
  res.status(201).json(serializeMilestone(milestone));
});

router.post("/milestones/:id/upload-proof", async (req, res) => {
  await handleUploadProof(req.params.id, req.body ?? {}, res);
});

router.post("/milestones/:id/approve", async (req, res) => {
  const milestone = milestones.find((item) => item.id === req.params.id);
  if (!milestone) {
    res.status(404).json({ message: "Milestone not found" });
    return;
  }
  const project = projects.find((p) => p.id === milestone.projectId);
  if (project?.status === "PAUSED") {
    res.status(409).json({ message: "Project is paused pending citizen concern review. Resolve concerns before approving." });
    return;
  }
  const auditorAddress = String(req.body?.auditorAddress ?? `0xAuditor${makeId()}`);
  if (!milestone.approvers.includes(auditorAddress)) {
    milestone.approvers.push(auditorAddress);
  }
  milestone.approvalCount = milestone.approvers.length;
  milestone.txHash = makeTxHash();
  milestone.status = "APPROVED";
  milestone.approvedAt = new Date().toISOString();
  const thresholdMet = milestone.approvalCount >= 1;
  const activity = {
    id: makeId("a"),
    type: thresholdMet ? "ThresholdMet" : "MilestoneApproved",
    title: thresholdMet
      ? `${milestone.title} — auditor approved, awaiting official payment release`
      : `${milestone.title} received auditor approval (${milestone.approvalCount}/1)`,
    projectId: milestone.projectId,
    txHash: milestone.txHash,
    timestamp: milestone.approvedAt,
  };
  activities.unshift(activity);
  updateProjectDerivedFields(milestone.projectId);
  if (project) {
    await persistProject(project);
  }
  await persistMilestone(milestone);
  await persistActivity(activity);
  publishLedgerEvent({ type: "milestone.updated", projectId: milestone.projectId, milestoneId: milestone.id });
  publishLedgerEvent({ type: "project.updated", projectId: milestone.projectId });
  publishLedgerEvent({ type: "activity.created", projectId: milestone.projectId, activityId: activity.id });
  res.json(serializeMilestone(milestone));
});

router.post("/milestones/:id/reject", async (req, res) => {
  const milestone = milestones.find((item) => item.id === req.params.id);
  if (!milestone) {
    res.status(404).json({ message: "Milestone not found" });
    return;
  }
  const { auditorAddress, reason } = req.body ?? {};
  if (!auditorAddress || !reason) {
    res.status(400).json({ message: "auditorAddress and reason are required" });
    return;
  }
  milestone.status = "REJECTED";
  milestone.rejectionReason = String(reason).slice(0, 400);
  milestone.txHash = makeTxHash();
  // Clear prior approvals so a resubmission requires fresh sign-offs
  milestone.approvers = [];
  milestone.approvalCount = 0;
  milestone.approvedAt = undefined;
  const activity = {
    id: makeId("a"),
    type: "MilestoneRejected",
    title: `${milestone.title} rejected by auditor`,
    projectId: milestone.projectId,
    txHash: milestone.txHash,
    timestamp: new Date().toISOString(),
  };
  activities.unshift(activity);
  updateProjectDerivedFields(milestone.projectId);
  const project = projects.find((item) => item.id === milestone.projectId);
  if (project) {
    await persistProject(project);
  }
  await persistMilestone(milestone);
  await persistActivity(activity);
  publishLedgerEvent({ type: "milestone.updated", projectId: milestone.projectId, milestoneId: milestone.id });
  publishLedgerEvent({ type: "project.updated", projectId: milestone.projectId });
  publishLedgerEvent({ type: "activity.created", projectId: milestone.projectId, activityId: activity.id });
  res.json(serializeMilestone(milestone));
});

router.post("/milestones/:id/proof", async (req, res) => {
  await handleUploadProof(req.params.id, req.body ?? {}, res);
});

router.post("/milestones/:id/acknowledge-proof", async (req, res) => {
  const milestone = milestones.find((item) => item.id === req.params.id);
  if (!milestone) {
    res.status(404).json({ message: "Milestone not found" });
    return;
  }
  if (!milestone.ipfsProofCID || !milestone.submittedAt || !milestone.submittedBy) {
    res.status(409).json({ message: "No submitted proof is available to acknowledge" });
    return;
  }

  milestone.officialAcknowledgedAt = new Date().toISOString();
  milestone.officialAcknowledgedBy = String(req.body?.officialAddress ?? "0xDemoOfficial000000000000000000000000000000001");
  milestone.txHash = makeTxHash();

  const activity = {
    id: makeId("a"),
    type: "ProofAcknowledged",
    title: `${milestone.title} proof acknowledged by official`,
    projectId: milestone.projectId,
    txHash: milestone.txHash,
    timestamp: milestone.officialAcknowledgedAt,
  };
  activities.unshift(activity);
  await persistMilestone(milestone);
  await persistActivity(activity);
  publishLedgerEvent({ type: "milestone.updated", projectId: milestone.projectId, milestoneId: milestone.id });
  publishLedgerEvent({ type: "activity.created", projectId: milestone.projectId, activityId: activity.id });
  res.json(serializeMilestone(milestone));
});

// ── Official releases payment after 2-of-2 auditor approvals ─────────────────
router.post("/milestones/:id/release", async (req, res) => {
  const milestone = milestones.find((item) => item.id === req.params.id);
  if (!milestone) { res.status(404).json({ message: "Milestone not found" }); return; }
  if (milestone.status !== "APPROVED" || milestone.approvalCount < 1) {
    res.status(409).json({ message: "Milestone requires auditor approval before payment can be released" });
    return;
  }
  const project = projects.find((p) => p.id === milestone.projectId);
  if (project?.status === "PAUSED") {
    res.status(409).json({ message: "Project is paused — resolve citizen concerns first" });
    return;
  }

  milestone.status = "PAID";
  milestone.txHash = makeTxHash();
  updateProjectDerivedFields(milestone.projectId);

  const activity = { id: makeId("a"), type: "FundsReleased", title: `₹${milestone.paymentAmount.toLocaleString()} released for ${milestone.title}`, projectId: milestone.projectId, txHash: milestone.txHash, timestamp: new Date().toISOString() };
  activities.unshift(activity);
  if (project) await persistProject(project);
  await persistMilestone(milestone);
  await persistActivity(activity);
  publishLedgerEvent({ type: "milestone.updated", projectId: milestone.projectId, milestoneId: milestone.id });
  publishLedgerEvent({ type: "project.updated", projectId: milestone.projectId });
  publishLedgerEvent({ type: "activity.created", projectId: milestone.projectId, activityId: activity.id });
  res.json(serializeMilestone(milestone));
});

router.get("/milestones/:id/proof-image", (req, res) => {
  const milestone = milestones.find((item) => item.id === req.params.id);
  if (!milestone) { res.status(404).json({ message: "Milestone not found" }); return; }
  if (milestone.proofImageBase64) {
    const buffer = Buffer.from(milestone.proofImageBase64, "base64");
    res.set("Content-Type", "image/jpeg");
    res.send(buffer);
    return;
  }
  if (milestone.ipfsProofCID && !milestone.ipfsProofCID.startsWith("bafybeidemo")) {
    res.redirect(302, `https://gateway.pinata.cloud/ipfs/${milestone.ipfsProofCID}`);
    return;
  }
  res.status(404).json({ message: "No proof image available" });
});

router.delete("/milestones/:id", async (req, res) => {
  const milestone = milestones.find((item) => item.id === req.params.id);
  if (!milestone) { res.status(404).json({ message: "Milestone not found" }); return; }
  if (milestone.status !== "PENDING") {
    res.status(409).json({ message: "Only PENDING milestones can be deleted" });
    return;
  }
  const projectId = milestone.projectId;
  milestones.splice(milestones.indexOf(milestone), 1);
  updateProjectDerivedFields(projectId);
  const project = projects.find((p) => p.id === projectId);
  await deleteMilestone(milestone.id);
  if (project) await persistProject(project);
  publishLedgerEvent({ type: "milestone.updated", projectId, milestoneId: milestone.id });
  publishLedgerEvent({ type: "project.updated", projectId });
  res.status(204).end();
});

router.get("/milestones/:id/proof", (req, res) => {
  const milestone = milestones.find((item) => item.id === req.params.id);
  if (
    !milestone ||
    !milestone.ipfsProofCID ||
    milestone.proofLatitude === undefined ||
    milestone.proofLongitude === undefined ||
    !milestone.submittedAt ||
    !milestone.submittedBy
  ) {
    res.status(404).json({ message: "Proof not found" });
    return;
  }
  res.json({ milestoneId: milestone.id, ipfsProofCID: milestone.ipfsProofCID, gatewayUrl: `https://gateway.pinata.cloud/ipfs/${milestone.ipfsProofCID}`, latitude: milestone.proofLatitude, longitude: milestone.proofLongitude, submittedAt: milestone.submittedAt, submittedBy: milestone.submittedBy });
});

export default router;
