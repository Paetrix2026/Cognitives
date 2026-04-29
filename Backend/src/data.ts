import crypto from "node:crypto";
import { logger } from "./lib/logger";

export type Role = "ADMIN" | "GOVT_OFFICIAL" | "CONTRACTOR" | "AUDITOR" | "INSPECTOR" | "CITIZEN";
export type ProjectStatus = "PENDING_APPROVAL" | "CREATED" | "ACTIVE" | "COMPLETED" | "PAUSED" | "CANCELLED";
export type MilestoneStatus = "PENDING" | "PROOF_SUBMITTED" | "APPROVED" | "REJECTED" | "PAID";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ProjectCategory = "ROAD" | "DRAINAGE" | "WATER_SUPPLY" | "STREET_LIGHTING" | "PARK" | "BUILDING" | "OTHER";
export type ReportCategory = "QUALITY" | "MISSING_WORK" | "SAFETY" | "BUDGET" | "OTHER";
export type ReportStatus = "PENDING_REVIEW" | "ACKNOWLEDGED" | "DISMISSED";
export type TenderStatus = "OPEN" | "AWARDED" | "CANCELLED";
export type BidStatus = "PENDING" | "AWARDED" | "REJECTED";

export interface UserRecord {
  walletAddress: string;
  role: Role;
  nonce?: string;
}

export interface ProjectRecord {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  totalBudget: number;
  spentAmount: number;
  startDate: string;
  endDate: string;
  officialAddress: string;
  contractorAddress: string;
  status: ProjectStatus;
  milestoneCount: number;
  txHash: string;
  riskLevel: RiskLevel;
  category: ProjectCategory;
  reportCount: number;
}

export interface MilestoneRecord {
  id: string;
  projectId: string;
  title: string;
  description: string;
  paymentAmount: number;
  ipfsProofCID?: string;
  proofLatitude?: number;
  proofLongitude?: number;
  submittedAt?: string;
  approvedAt?: string;
  submittedBy?: string;
  status: MilestoneStatus;
  approvalCount: number;
  txHash: string;
  approvers: string[];
  rejectionReason?: string;
  createdAt?: string;
  officialAcknowledgedAt?: string;
  officialAcknowledgedBy?: string;
  proofImageBase64?: string;
}

export interface AnomalyFlagRecord {
  id: string;
  projectId: string;
  projectTitle: string;
  severity: "WARNING" | "CRITICAL";
  reason: string;
  createdAt: string;
}

export interface ActivityEventRecord {
  id: string;
  type: string;
  title: string;
  projectId: string;
  txHash: string;
  timestamp: string;
}

export interface ProjectReportRecord {
  id: string;
  projectId: string;
  reporterAddress: string;
  reason: string;
  category: ReportCategory;
  status: ReportStatus;
  createdAt: string;
}

export interface TenderRecord {
  id: string;
  projectId: string;
  description: string;
  minimumBid: number;
  deadline: string;
  status: TenderStatus;
  publishedBy: string;
  createdAt: string;
}

export interface BidRecord {
  id: string;
  tenderId: string;
  projectId: string;
  bidderAddress: string;
  proposedAmount: number;
  notes: string;
  status: BidStatus;
  createdAt: string;
}

type DbPool = {
  query: (text: string, values?: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
};


const seedProjects: ProjectRecord[] = [];
const seedMilestones: MilestoneRecord[] = [];
const seedActivities: ActivityEventRecord[] = [];
const seedReports: ProjectReportRecord[] = [];

// Predefined demo accounts — keyed to standard Hardhat test wallets
const seedUsers: UserRecord[] = [
  { walletAddress: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", role: "GOVT_OFFICIAL" },
  { walletAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", role: "AUDITOR" },
  { walletAddress: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", role: "CONTRACTOR" },
  { walletAddress: "0x90F79bf6EB2c4f870365E785982E1f101E93b906", role: "CONTRACTOR" },
  { walletAddress: "0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C1199", role: "INSPECTOR" },
  { walletAddress: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65", role: "CITIZEN" },
  { walletAddress: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc", role: "CITIZEN" },
];

export const users = new Map<string, UserRecord>(
  seedUsers.map((u) => [u.walletAddress.toLowerCase(), u]),
);
export const projects: ProjectRecord[] = [...seedProjects];
export const milestones: MilestoneRecord[] = [...seedMilestones];
export const activities: ActivityEventRecord[] = [...seedActivities];
export const reports: ProjectReportRecord[] = [...seedReports];
export const tenders: TenderRecord[] = [];
export const bids: BidRecord[] = [];

let pool: DbPool | null = null;

async function query(text: string, values: unknown[] = []) {
  if (!pool) {
    return { rows: [] as Array<Record<string, unknown>> };
  }
  return pool.query(text, values);
}

function replaceContents<T>(target: T[], source: T[]) {
  target.splice(0, target.length, ...source);
}

function normalizeProjectRow(row: Record<string, unknown>): ProjectRecord {
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description),
    location: String(row.location),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    totalBudget: Number(row.total_budget),
    spentAmount: Number(row.spent_amount),
    startDate: String(row.start_date),
    endDate: String(row.end_date),
    officialAddress: String(row.official_address),
    contractorAddress: String(row.contractor_address),
    status: String(row.status) as ProjectStatus,
    milestoneCount: Number(row.milestone_count),
    txHash: String(row.tx_hash),
    riskLevel: String(row.risk_level) as RiskLevel,
    category: String(row.category) as ProjectCategory,
    reportCount: Number(row.report_count),
  };
}

function normalizeMilestoneRow(row: Record<string, unknown>): MilestoneRecord {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    title: String(row.title),
    description: String(row.description),
    paymentAmount: Number(row.payment_amount),
    ipfsProofCID: row.ipfs_proof_cid ? String(row.ipfs_proof_cid) : undefined,
    proofLatitude: row.proof_latitude === null || row.proof_latitude === undefined ? undefined : Number(row.proof_latitude),
    proofLongitude: row.proof_longitude === null || row.proof_longitude === undefined ? undefined : Number(row.proof_longitude),
    submittedAt: row.submitted_at ? String(row.submitted_at) : undefined,
    approvedAt: row.approved_at ? String(row.approved_at) : undefined,
    submittedBy: row.submitted_by ? String(row.submitted_by) : undefined,
    officialAcknowledgedAt: row.official_acknowledged_at ? String(row.official_acknowledged_at) : undefined,
    officialAcknowledgedBy: row.official_acknowledged_by ? String(row.official_acknowledged_by) : undefined,
    status: String(row.status) as MilestoneStatus,
    approvalCount: Number(row.approval_count),
    txHash: String(row.tx_hash),
    approvers: Array.isArray(row.approvers) ? row.approvers.map((value) => String(value)) : [],
    rejectionReason: row.rejection_reason ? String(row.rejection_reason) : undefined,
    createdAt: row.created_at ? String(row.created_at) : undefined,
  };
}

function normalizeActivityRow(row: Record<string, unknown>): ActivityEventRecord {
  return {
    id: String(row.id),
    type: String(row.type),
    title: String(row.title),
    projectId: String(row.project_id),
    txHash: String(row.tx_hash),
    timestamp: String(row.timestamp),
  };
}

function normalizeReportRow(row: Record<string, unknown>): ProjectReportRecord {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    reporterAddress: String(row.reporter_address),
    reason: String(row.reason),
    category: String(row.category) as ReportCategory,
    status: String(row.status) as ReportStatus,
    createdAt: String(row.created_at),
  };
}

function normalizeTenderRow(row: Record<string, unknown>): TenderRecord {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    description: String(row.description),
    minimumBid: Number(row.minimum_bid),
    deadline: String(row.deadline),
    status: String(row.status) as TenderStatus,
    publishedBy: String(row.published_by),
    createdAt: String(row.created_at),
  };
}

function normalizeBidRow(row: Record<string, unknown>): BidRecord {
  return {
    id: String(row.id),
    tenderId: String(row.tender_id),
    projectId: String(row.project_id),
    bidderAddress: String(row.bidder_address),
    proposedAmount: Number(row.proposed_amount),
    notes: String(row.notes),
    status: String(row.status) as BidStatus,
    createdAt: String(row.created_at),
  };
}

async function bootstrapTables() {
  await query(`
    CREATE TABLE IF NOT EXISTS dt_users (
      wallet_address TEXT PRIMARY KEY,
      role TEXT NOT NULL,
      nonce TEXT
    );
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS dt_projects (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      total_budget INTEGER NOT NULL,
      spent_amount INTEGER NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      official_address TEXT NOT NULL,
      contractor_address TEXT NOT NULL,
      status TEXT NOT NULL,
      milestone_count INTEGER NOT NULL,
      tx_hash TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      category TEXT NOT NULL,
      report_count INTEGER NOT NULL
    );
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS dt_milestones (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES dt_projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      payment_amount INTEGER NOT NULL,
      ipfs_proof_cid TEXT,
      proof_latitude DOUBLE PRECISION,
      proof_longitude DOUBLE PRECISION,
      submitted_at TEXT,
      approved_at TEXT,
      submitted_by TEXT,
      official_acknowledged_at TEXT,
      official_acknowledged_by TEXT,
      status TEXT NOT NULL,
      approval_count INTEGER NOT NULL,
      tx_hash TEXT NOT NULL,
      approvers JSONB NOT NULL DEFAULT '[]'::jsonb,
      rejection_reason TEXT,
      created_at TEXT NOT NULL
    );
  `);
  await query(`ALTER TABLE dt_milestones ADD COLUMN IF NOT EXISTS official_acknowledged_at TEXT`);
  await query(`ALTER TABLE dt_milestones ADD COLUMN IF NOT EXISTS official_acknowledged_by TEXT`);
  await query(`
    CREATE TABLE IF NOT EXISTS dt_activities (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      project_id TEXT NOT NULL,
      tx_hash TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS dt_reports (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES dt_projects(id) ON DELETE CASCADE,
      reporter_address TEXT NOT NULL,
      reason TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS dt_tenders (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES dt_projects(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      minimum_bid INTEGER NOT NULL,
      deadline TEXT NOT NULL,
      status TEXT NOT NULL,
      published_by TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS dt_bids (
      id TEXT PRIMARY KEY,
      tender_id TEXT NOT NULL REFERENCES dt_tenders(id) ON DELETE CASCADE,
      project_id TEXT NOT NULL,
      bidder_address TEXT NOT NULL,
      proposed_amount INTEGER NOT NULL,
      notes TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

async function seedIfEmpty() {
  const countResult = await query("SELECT COUNT(*)::int AS count FROM dt_projects");
  const count = Number(countResult.rows[0]?.count ?? 0);

  if (count > 0) {
    return;
  }

  for (const project of seedProjects) {
    await persistProject(project);
  }
  for (const milestone of seedMilestones) {
    await persistMilestone(milestone);
  }
  for (const activity of seedActivities) {
    await persistActivity(activity);
  }
  for (const report of seedReports) {
    await persistReport(report);
  }
}

async function loadFromDatabase() {
  const [projectRows, milestoneRows, activityRows, reportRows, userRows, tenderRows, bidRows] = await Promise.all([
    query("SELECT * FROM dt_projects ORDER BY start_date DESC, id DESC"),
    query("SELECT * FROM dt_milestones ORDER BY created_at ASC, id ASC"),
    query("SELECT * FROM dt_activities ORDER BY timestamp DESC, id DESC"),
    query("SELECT * FROM dt_reports ORDER BY created_at DESC, id DESC"),
    query("SELECT * FROM dt_users"),
    query("SELECT * FROM dt_tenders ORDER BY created_at DESC"),
    query("SELECT * FROM dt_bids ORDER BY created_at DESC"),
  ]);

  replaceContents(projects, projectRows.rows.map(normalizeProjectRow));
  replaceContents(milestones, milestoneRows.rows.map(normalizeMilestoneRow));
  replaceContents(activities, activityRows.rows.map(normalizeActivityRow));
  replaceContents(reports, reportRows.rows.map(normalizeReportRow));
  replaceContents(tenders, tenderRows.rows.map(normalizeTenderRow));
  replaceContents(bids, bidRows.rows.map(normalizeBidRow));

  users.clear();
  for (const row of userRows.rows) {
    const walletAddress = String(row.wallet_address);
    users.set(walletAddress.toLowerCase(), {
      walletAddress,
      role: String(row.role) as Role,
      nonce: row.nonce ? String(row.nonce) : undefined,
    });
  }
}

export async function initializeDataStore() {
  if (!process.env.DATABASE_URL) {
    logger.info("DATABASE_URL not configured; using in-memory demo data");
    return;
  }

  try {
    const dbModule = await import("@workspace/db");
    pool = dbModule.pool as DbPool;
    await bootstrapTables();
    await seedIfEmpty();
    await loadFromDatabase();
    logger.info({ projects: projects.length, milestones: milestones.length }, "PostgreSQL store ready");
  } catch (error) {
    pool = null;
    logger.error({ err: error }, "Failed to initialize PostgreSQL store; falling back to in-memory data");
  }
}

export async function persistUser(user: UserRecord) {
  users.set(user.walletAddress.toLowerCase(), user);
  if (!pool) return;

  await query(
    `
      INSERT INTO dt_users (wallet_address, role, nonce)
      VALUES ($1, $2, $3)
      ON CONFLICT (wallet_address)
      DO UPDATE SET role = EXCLUDED.role, nonce = EXCLUDED.nonce
    `,
    [user.walletAddress, user.role, user.nonce ?? null],
  );
}

export async function persistProject(project: ProjectRecord) {
  if (!pool) return;

  await query(
    `
      INSERT INTO dt_projects (
        id, title, description, location, latitude, longitude, total_budget, spent_amount,
        start_date, end_date, official_address, contractor_address, status, milestone_count,
        tx_hash, risk_level, category, report_count
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18
      )
      ON CONFLICT (id)
      DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        location = EXCLUDED.location,
        latitude = EXCLUDED.latitude,
        longitude = EXCLUDED.longitude,
        total_budget = EXCLUDED.total_budget,
        spent_amount = EXCLUDED.spent_amount,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        official_address = EXCLUDED.official_address,
        contractor_address = EXCLUDED.contractor_address,
        status = EXCLUDED.status,
        milestone_count = EXCLUDED.milestone_count,
        tx_hash = EXCLUDED.tx_hash,
        risk_level = EXCLUDED.risk_level,
        category = EXCLUDED.category,
        report_count = EXCLUDED.report_count
    `,
    [
      project.id,
      project.title,
      project.description,
      project.location,
      project.latitude,
      project.longitude,
      project.totalBudget,
      project.spentAmount,
      project.startDate,
      project.endDate,
      project.officialAddress,
      project.contractorAddress,
      project.status,
      project.milestoneCount,
      project.txHash,
      project.riskLevel,
      project.category,
      project.reportCount,
    ],
  );
}

export async function persistMilestone(milestone: MilestoneRecord) {
  if (!pool) return;

  await query(
    `
      INSERT INTO dt_milestones (
        id, project_id, title, description, payment_amount, ipfs_proof_cid, proof_latitude,
        proof_longitude, submitted_at, approved_at, submitted_by, official_acknowledged_at,
        official_acknowledged_by, status, approval_count, tx_hash, approvers, rejection_reason, created_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13, $14, $15, $16::jsonb, $17, $18
      )
      ON CONFLICT (id)
      DO UPDATE SET
        project_id = EXCLUDED.project_id,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        payment_amount = EXCLUDED.payment_amount,
        ipfs_proof_cid = EXCLUDED.ipfs_proof_cid,
        proof_latitude = EXCLUDED.proof_latitude,
        proof_longitude = EXCLUDED.proof_longitude,
        submitted_at = EXCLUDED.submitted_at,
        approved_at = EXCLUDED.approved_at,
        submitted_by = EXCLUDED.submitted_by,
        official_acknowledged_at = EXCLUDED.official_acknowledged_at,
        official_acknowledged_by = EXCLUDED.official_acknowledged_by,
        status = EXCLUDED.status,
        approval_count = EXCLUDED.approval_count,
        tx_hash = EXCLUDED.tx_hash,
        approvers = EXCLUDED.approvers,
        rejection_reason = EXCLUDED.rejection_reason,
        created_at = EXCLUDED.created_at
    `,
    [
      milestone.id,
      milestone.projectId,
      milestone.title,
      milestone.description,
      milestone.paymentAmount,
      milestone.ipfsProofCID ?? null,
      milestone.proofLatitude ?? null,
      milestone.proofLongitude ?? null,
      milestone.submittedAt ?? null,
      milestone.approvedAt ?? null,
      milestone.submittedBy ?? null,
      milestone.officialAcknowledgedAt ?? null,
      milestone.officialAcknowledgedBy ?? null,
      milestone.status,
      milestone.approvalCount,
      milestone.txHash,
      JSON.stringify(milestone.approvers),
      milestone.rejectionReason ?? null,
      milestone.createdAt ?? new Date().toISOString(),
    ],
  );
}

export async function persistActivity(activity: ActivityEventRecord) {
  if (!pool) return;

  await query(
    `
      INSERT INTO dt_activities (id, type, title, project_id, tx_hash, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id)
      DO UPDATE SET
        type = EXCLUDED.type,
        title = EXCLUDED.title,
        project_id = EXCLUDED.project_id,
        tx_hash = EXCLUDED.tx_hash,
        timestamp = EXCLUDED.timestamp
    `,
    [activity.id, activity.type, activity.title, activity.projectId, activity.txHash, activity.timestamp],
  );
}

export async function persistReport(report: ProjectReportRecord) {
  if (!pool) return;

  await query(
    `
      INSERT INTO dt_reports (id, project_id, reporter_address, reason, category, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id)
      DO UPDATE SET
        project_id = EXCLUDED.project_id,
        reporter_address = EXCLUDED.reporter_address,
        reason = EXCLUDED.reason,
        category = EXCLUDED.category,
        status = EXCLUDED.status,
        created_at = EXCLUDED.created_at
    `,
    [report.id, report.projectId, report.reporterAddress, report.reason, report.category, report.status, report.createdAt],
  );
}

export async function persistTender(tender: TenderRecord) {
  if (!pool) return;
  await query(
    `INSERT INTO dt_tenders (id, project_id, description, minimum_bid, deadline, status, published_by, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (id) DO UPDATE SET
       description=EXCLUDED.description, minimum_bid=EXCLUDED.minimum_bid,
       deadline=EXCLUDED.deadline, status=EXCLUDED.status`,
    [tender.id, tender.projectId, tender.description, tender.minimumBid, tender.deadline, tender.status, tender.publishedBy, tender.createdAt],
  );
}

export async function persistBid(bid: BidRecord) {
  if (!pool) return;
  await query(
    `INSERT INTO dt_bids (id, tender_id, project_id, bidder_address, proposed_amount, notes, status, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (id) DO UPDATE SET
       proposed_amount=EXCLUDED.proposed_amount, notes=EXCLUDED.notes, status=EXCLUDED.status`,
    [bid.id, bid.tenderId, bid.projectId, bid.bidderAddress, bid.proposedAmount, bid.notes, bid.status, bid.createdAt],
  );
}

export function makeId(prefix = ""): string {
  return `${prefix}${crypto.randomInt(100000, 999999).toString()}`;
}

export function makeTxHash(): string {
  return `0x${crypto.randomBytes(32).toString("hex")}`;
}

export function getProjectAnomalies(): AnomalyFlagRecord[] {
  const result: AnomalyFlagRecord[] = [];
  const timestamp = new Date().toISOString();

  for (const project of projects) {
    if (project.spentAmount > project.totalBudget) {
      result.push({ id: `critical-${project.id}`, projectId: project.id, projectTitle: project.title, severity: "CRITICAL", reason: "CRITICAL: Over Budget", createdAt: timestamp });
    } else if (project.spentAmount > project.totalBudget * 0.8) {
      result.push({ id: `budget-${project.id}`, projectId: project.id, projectTitle: project.title, severity: "WARNING", reason: "Budget Warning: 80% spent", createdAt: timestamp });
    }

    if (new Date() > new Date(project.endDate) && project.status !== "COMPLETED") {
      result.push({ id: `deadline-${project.id}`, projectId: project.id, projectTitle: project.title, severity: "CRITICAL", reason: "Deadline Breach", createdAt: timestamp });
    }

    const lastUpdate = milestones.filter((milestone) => milestone.projectId === project.id).map((milestone) => milestone.submittedAt ?? project.startDate).sort().at(-1);
    if (lastUpdate && Date.now() - new Date(lastUpdate).getTime() > 30 * 24 * 60 * 60 * 1000 && project.status !== "COMPLETED") {
      result.push({ id: `stalled-${project.id}`, projectId: project.id, projectTitle: project.title, severity: "WARNING", reason: "Stalled Project", createdAt: timestamp });
    }

    const projectReports = reports.filter((report) => report.projectId === project.id && report.status === "PENDING_REVIEW");
    if (projectReports.length > 0) {
      result.push({
        id: `report-${project.id}`,
        projectId: project.id,
        projectTitle: project.title,
        severity: projectReports.length >= 3 ? "CRITICAL" : "WARNING",
        reason: `${projectReports.length} citizen concern${projectReports.length > 1 ? "s" : ""} pending review`,
        createdAt: timestamp,
      });
    }
  }

  return result;
}

export function serializeMilestone(milestone: MilestoneRecord) {
  const { approvers, createdAt, ...safeMilestone } = milestone;
  return safeMilestone;
}

export function updateProjectDerivedFields(projectId: string) {
  const project = projects.find((item) => item.id === projectId);
  if (!project) return;

  const projectMilestones = milestones.filter((item) => item.projectId === projectId);
  project.milestoneCount = projectMilestones.length;
  project.spentAmount = projectMilestones.filter((item) => item.status === "PAID").reduce((sum, item) => sum + item.paymentAmount, 0);
  project.reportCount = reports.filter((report) => report.projectId === projectId && report.status !== "DISMISSED").length;

  const ratio = project.totalBudget === 0 ? 0 : project.spentAmount / project.totalBudget;
  project.riskLevel = ratio > 1 ? "CRITICAL" : ratio > 0.8 ? "HIGH" : ratio > 0.6 ? "MEDIUM" : "LOW";
}
