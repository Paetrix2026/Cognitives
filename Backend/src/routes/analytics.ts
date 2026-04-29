import { Router, type IRouter } from "express";
import { activities, getProjectAnomalies, projects, updateProjectDerivedFields } from "../data";

const router: IRouter = Router();

router.get("/analytics/anomalies", (_req, res) => {
  res.json(getProjectAnomalies());
});

router.get("/analytics/overview", (_req, res) => {
  for (const project of projects) updateProjectDerivedFields(project.id);
  const anomalies = getProjectAnomalies();
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter((project) => project.status === "ACTIVE").length,
    completedProjects: projects.filter((project) => project.status === "COMPLETED").length,
    totalBudget: projects.reduce((sum, project) => sum + project.totalBudget, 0),
    totalSpent: projects.reduce((sum, project) => sum + project.spentAmount, 0),
    flaggedProjects: new Set(anomalies.map((item) => item.projectId)).size,
  };
  const budgetByStatus = Object.entries(projects.reduce<Record<string, number>>((acc, project) => {
    acc[project.status] = (acc[project.status] ?? 0) + project.totalBudget;
    return acc;
  }, {})).map(([status, budget]) => ({ status, budget }));
  res.json({ stats, recentActivity: activities.slice(0, 8), budgetByStatus });
});

export default router;
