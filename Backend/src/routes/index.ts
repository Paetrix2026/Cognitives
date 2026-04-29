import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import projectsRouter from "./projects";
import milestonesRouter from "./milestones";
import analyticsRouter from "./analytics";
import tendersRouter from "./tenders";
import blockchainRouter from "./blockchain";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(projectsRouter);
router.use(milestonesRouter);
router.use(analyticsRouter);
router.use(tendersRouter);
router.use(blockchainRouter);

export default router;
