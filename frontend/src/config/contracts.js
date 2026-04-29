export const POLYGON_AMOY = {
  chainId: 80002,
  chainIdHex: "0x13882",
  name: "Polygon Amoy",
  rpcUrl: "https://rpc-amoy.polygon.technology",
  explorerUrl: "https://amoy.polygonscan.com",
};

export const CONTRACT_ADDRESSES = {
  roleManager: import.meta.env.VITE_ROLE_MANAGER_ADDRESS ?? "0x0000000000000000000000000000000000000000",
  projectRegistry: import.meta.env.VITE_PROJECT_REGISTRY_ADDRESS ?? "0x0000000000000000000000000000000000000000",
  milestoneEscrow: import.meta.env.VITE_MILESTONE_ESCROW_ADDRESS ?? "0x0000000000000000000000000000000000000000",
};
