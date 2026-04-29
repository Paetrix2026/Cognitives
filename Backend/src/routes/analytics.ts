import { Router, type IRouter, type Request } from "express";
import { activities, getProjectAnomalies, projects, updateProjectDerivedFields } from "../data";
import { verifyToken } from "./auth";

const router: IRouter = Router();

function canReadPrivateProjects(req: Request) {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const caller = token ? verifyToken(token) : null;
  return Boolean(caller && caller.role !== "CITIZEN");
}

function visibleProjects(req: Request) {
  return canReadPrivateProjects(req) ? projects : projects.filter((project) => !project.isPrivate);
}

router.get("/analytics/anomalies", (req, res) => {
  const readableProjectIds = new Set(visibleProjects(req).map((project) => project.id));
  res.json(getProjectAnomalies().filter((item) => readableProjectIds.has(item.projectId)));
});

router.get("/analytics/overview", (req, res) => {
  for (const project of projects) updateProjectDerivedFields(project.id);
  const readableProjects = visibleProjects(req);
  const readableProjectIds = new Set(readableProjects.map((project) => project.id));
  const anomalies = getProjectAnomalies().filter((item) => readableProjectIds.has(item.projectId));
  const stats = {
    totalProjects: readableProjects.length,
    activeProjects: readableProjects.filter((project) => project.status === "ACTIVE").length,
    completedProjects: readableProjects.filter((project) => project.status === "COMPLETED").length,
    totalBudget: readableProjects.reduce((sum, project) => sum + project.totalBudget, 0),
    totalSpent: readableProjects.reduce((sum, project) => sum + project.spentAmount, 0),
    flaggedProjects: new Set(anomalies.map((item) => item.projectId)).size,
  };
  const budgetByStatus = Object.entries(readableProjects.reduce<Record<string, number>>((acc, project) => {
    acc[project.status] = (acc[project.status] ?? 0) + project.totalBudget;
    return acc;
  }, {})).map(([status, budget]) => ({ status, budget }));
  const recentActivity = activities.filter((activity) => readableProjectIds.has(activity.projectId)).slice(0, 8);
  res.json({ stats, recentActivity, budgetByStatus });
});

export default router;
