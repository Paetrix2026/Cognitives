import { Router, type IRouter } from "express";
import {
  activities,
  getProjectAnomalies,
  makeId,
  makeTxHash,
  milestones,
  persistActivity,
  persistProject,
  persistReport,
  projects,
  reports,
  updateProjectDerivedFields,
  type ProjectCategory,
  type ReportCategory,
} from "../data";

import { publishLedgerEvent } from "../socket/server";

const router: IRouter = Router();

const VALID_CATEGORIES: ProjectCategory[] = ["ROAD", "DRAINAGE", "WATER_SUPPLY", "STREET_LIGHTING", "PARK", "BUILDING", "OTHER"];
const VALID_REPORT_CATEGORIES: ReportCategory[] = ["QUALITY", "MISSING_WORK", "SAFETY", "BUDGET", "OTHER"];

router.get("/projects", (_req, res) => {
  for (const project of projects) updateProjectDerivedFields(project.id);
  res.json(projects);
});

router.post("/projects", async (req, res) => {
  const { title, description, location, latitude, longitude, totalBudget, endDate, contractorAddress, category } = req.body ?? {};
  if (!title || !description || !location || latitude === undefined || longitude === undefined || !totalBudget || !endDate || !contractorAddress || !category) {
    res.status(400).json({ message: "title, description, location, latitude, longitude, totalBudget, endDate, contractorAddress, and category are required" });
    return;
  }
  if (!VALID_CATEGORIES.includes(category)) {
    res.status(400).json({ message: `category must be one of ${VALID_CATEGORIES.join(", ")}` });
    return;
  }

  const project = {
    id: makeId(),
    title: String(title),
    description: String(description),
    location: String(location),
    latitude: Number(latitude),
    longitude: Number(longitude),
    totalBudget: Number(totalBudget),
    spentAmount: 0,
    startDate: new Date().toISOString(),
    endDate: String(endDate),
    officialAddress: String(req.body?.officialAddress ?? "0xDemoOfficial000000000000000000000000000000001"),
    contractorAddress: String(contractorAddress),
    status: "PENDING_APPROVAL" as const,
    milestoneCount: 0,
    txHash: makeTxHash(),
    riskLevel: "LOW" as const,
    category: category as ProjectCategory,
    reportCount: 0,
  };
  projects.unshift(project);
  const activity = { id: makeId("a"), type: "ProjectCreated", title: `${project.title} created with escrow budget`, projectId: project.id, txHash: project.txHash, timestamp: new Date().toISOString() };
  activities.unshift(activity);
  await persistProject(project);
  await persistActivity(activity);
  publishLedgerEvent({ type: "project.updated", projectId: project.id });
  publishLedgerEvent({ type: "activity.created", projectId: project.id, activityId: activity.id });
  res.status(201).json(project);
});

router.get("/projects/stats", (_req, res) => {
  for (const project of projects) updateProjectDerivedFields(project.id);
  const anomalies = getProjectAnomalies();
  res.json({
    totalProjects: projects.length,
    activeProjects: projects.filter((project) => project.status === "ACTIVE").length,
    completedProjects: projects.filter((project) => project.status === "COMPLETED").length,
    totalBudget: projects.reduce((sum, project) => sum + project.totalBudget, 0),
    totalSpent: projects.reduce((sum, project) => sum + project.spentAmount, 0),
    flaggedProjects: new Set(anomalies.map((item) => item.projectId)).size,
  });
});

router.post("/projects/sync", async (_req, res) => {
  for (const project of projects) updateProjectDerivedFields(project.id);
  const activity = { id: makeId("a"), type: "BlockchainSync", title: "Polygon Amoy event mirror synced", projectId: projects[0]?.id ?? "0", txHash: makeTxHash(), timestamp: new Date().toISOString() };
  activities.unshift(activity);
  await persistActivity(activity);
  publishLedgerEvent({ type: "sync.completed", projectId: activity.projectId, activityId: activity.id });
  res.json({ synced: true, lastProcessedBlock: 12844372, message: "Demo event cache synced. Configure POLYGON_AMOY_RPC and contract addresses for live chain reads." });
});

router.get("/projects/:id", (req, res) => {
  const project = projects.find((item) => item.id === req.params.id);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }
  updateProjectDerivedFields(project.id);
  res.json({
    project,
    milestones: milestones.filter((item) => item.projectId === project.id).map(({ approvers, ...milestone }) => milestone),
    anomalies: getProjectAnomalies().filter((item) => item.projectId === project.id),
  });
});

router.post("/projects/:id/report", async (req, res) => {
  const project = projects.find((item) => item.id === req.params.id);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }
  const { reporterAddress, reason, category } = req.body ?? {};
  if (!reporterAddress || !reason || !category) {
    res.status(400).json({ message: "reporterAddress, reason, and category are required" });
    return;
  }
  if (!VALID_REPORT_CATEGORIES.includes(category)) {
    res.status(400).json({ message: `category must be one of ${VALID_REPORT_CATEGORIES.join(", ")}` });
    return;
  }

  const report = {
    id: makeId("r"),
    projectId: project.id,
    reporterAddress: String(reporterAddress),
    reason: String(reason).slice(0, 600),
    category: category as ReportCategory,
    status: "PENDING_REVIEW" as const,
    createdAt: new Date().toISOString(),
  };
  reports.unshift(report);

  // Pause project pending audit (per PPT promise)
  if (project.status === "ACTIVE" || project.status === "CREATED") {
    project.status = "PAUSED";
  }
  updateProjectDerivedFields(project.id);

  const txHash = makeTxHash();
  const activity = {
    id: makeId("a"),
    type: "ConcernReported",
    title: `Citizen concern filed against ${project.title} — payments paused`,
    projectId: project.id,
    txHash,
    timestamp: report.createdAt,
  };
  activities.unshift(activity);

  await persistReport(report);
  await persistProject(project);
  await persistActivity(activity);
  publishLedgerEvent({ type: "report.created", projectId: project.id, activityId: activity.id });
  publishLedgerEvent({ type: "project.updated", projectId: project.id });

  res.json(report);
});

router.get("/projects/:id/reports", (req, res) => {
  const project = projects.find((item) => item.id === req.params.id);
  if (!project) {
    res.status(404).json({ message: "Project not found" });
    return;
  }
  res.json(reports.filter(r => r.projectId === project.id));
});

// ── Auditor approves a project (PENDING_APPROVAL → ACTIVE) ───────────────────
router.post("/projects/:id/approve", async (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }
  if (project.status !== "PENDING_APPROVAL") {
    res.status(409).json({ message: `Project is ${project.status}, not pending approval` });
    return;
  }
  const { auditorAddress } = req.body ?? {};
  if (!auditorAddress) { res.status(400).json({ message: "auditorAddress is required" }); return; }

  project.status = "ACTIVE";
  const activity = { id: makeId("a"), type: "ProjectApproved", title: `${project.title} approved by auditor`, projectId: project.id, txHash: makeTxHash(), timestamp: new Date().toISOString() };
  activities.unshift(activity);
  await persistProject(project);
  await persistActivity(activity);
  publishLedgerEvent({ type: "project.updated", projectId: project.id });
  publishLedgerEvent({ type: "activity.created", projectId: project.id, activityId: activity.id });
  res.json(project);
});

// ── Auditor rejects a project (PENDING_APPROVAL → CANCELLED) ─────────────────
router.post("/projects/:id/reject", async (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }
  if (project.status !== "PENDING_APPROVAL") {
    res.status(409).json({ message: `Project is ${project.status}, not pending approval` });
    return;
  }
  const { auditorAddress, reason } = req.body ?? {};
  if (!auditorAddress || !reason) { res.status(400).json({ message: "auditorAddress and reason are required" }); return; }

  project.status = "CANCELLED";
  const activity = { id: makeId("a"), type: "ProjectRejected", title: `${project.title} rejected — ${String(reason).slice(0, 80)}`, projectId: project.id, txHash: makeTxHash(), timestamp: new Date().toISOString() };
  activities.unshift(activity);
  await persistProject(project);
  await persistActivity(activity);
  publishLedgerEvent({ type: "project.updated", projectId: project.id });
  publishLedgerEvent({ type: "activity.created", projectId: project.id, activityId: activity.id });
  res.json(project);
});

// ── Auditor resolves a citizen report ─────────────────────────────────────────
router.post("/projects/:id/reports/:reportId/resolve", async (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }
  const report = reports.find((r) => r.id === req.params.reportId && r.projectId === project.id);
  if (!report) { res.status(404).json({ message: "Report not found" }); return; }

  const { action, auditorAddress } = req.body ?? {};
  if (!action || !["DISMISS", "ACKNOWLEDGE"].includes(action)) {
    res.status(400).json({ message: "action must be DISMISS or ACKNOWLEDGE" });
    return;
  }
  if (!auditorAddress) { res.status(400).json({ message: "auditorAddress is required" }); return; }

  report.status = action === "DISMISS" ? "DISMISSED" : "ACKNOWLEDGED";

  // If dismissing: check if any other pending reports remain; if none, resume project
  if (action === "DISMISS" && project.status === "PAUSED") {
    const remaining = reports.filter(r => r.projectId === project.id && r.status === "PENDING_REVIEW");
    if (remaining.length === 0) {
      project.status = "ACTIVE";
      const resumeActivity = { id: makeId("a"), type: "ProjectResumed", title: `${project.title} resumed — citizen concern dismissed`, projectId: project.id, txHash: makeTxHash(), timestamp: new Date().toISOString() };
      activities.unshift(resumeActivity);
      await persistActivity(resumeActivity);
    }
  }

  updateProjectDerivedFields(project.id);
  await persistReport(report);
  await persistProject(project);
  publishLedgerEvent({ type: "project.updated", projectId: project.id });
  res.json({ report, project });
});

// ── Official closes a completed project ───────────────────────────────────────
router.post("/projects/:id/close", async (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) { res.status(404).json({ message: "Project not found" }); return; }

  const projectMilestones = milestones.filter((m) => m.projectId === project.id);
  const unpaid = projectMilestones.filter((m) => m.status !== "PAID" && m.status !== "REJECTED");
  if (unpaid.length > 0) {
    res.status(409).json({ message: `${unpaid.length} milestone(s) still pending payment — release all payments before closing` });
    return;
  }

  project.status = "COMPLETED";
  const activity = { id: makeId("a"), type: "ProjectClosed", title: `${project.title} officially closed`, projectId: project.id, txHash: makeTxHash(), timestamp: new Date().toISOString() };
  activities.unshift(activity);
  await persistProject(project);
  await persistActivity(activity);
  publishLedgerEvent({ type: "project.updated", projectId: project.id });
  publishLedgerEvent({ type: "activity.created", projectId: project.id, activityId: activity.id });
  res.json(project);
});

// ── List all reports (auditor view, across projects) ──────────────────────────
router.get("/reports", (req, res) => {
  const { status } = req.query;
  const filtered = status ? reports.filter(r => r.status === status) : reports;
  const enriched = filtered.map(r => {
    const project = projects.find(p => p.id === r.projectId);
    return { ...r, projectTitle: project?.title ?? "Unknown project" };
  });
  res.json(enriched);
});

export default router;
