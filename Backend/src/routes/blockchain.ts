import { Router, type IRouter } from "express";
import { blockchainLogs } from "../services/blockchainLogger";
import { provider } from "../services/blockchainConfig";

const router: IRouter = Router();

router.get("/blockchain/logs", (_req, res) => {
  res.json(blockchainLogs);
});

router.get("/blockchain/status", async (_req, res) => {
  const contracts = {
    ProjectRegistry: process.env.PROJECT_REGISTRY_ADDRESS ?? "",
    MilestoneEscrow: process.env.MILESTONE_ESCROW_ADDRESS ?? "",
    RoleManager: process.env.ROLE_MANAGER_ADDRESS ?? "",
  };

  try {
    const [network, blockNumber] = await Promise.all([
      provider.getNetwork(),
      provider.getBlockNumber(),
    ]);

    res.json({
      connected: true,
      chainId: Number(network.chainId),
      blockNumber,
      network: "hardhat",
      contracts,
    });
  } catch {
    res.json({
      connected: false,
      chainId: 31337,
      blockNumber: 0,
      network: "hardhat",
      contracts,
    });
  }
});

export default router;
