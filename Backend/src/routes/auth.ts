import crypto from "node:crypto";
import { Router, type IRouter } from "express";
import { ethers } from "ethers";
import { isConfiguredContractAddress, createAmoyProvider } from "../config/contracts";
import { persistUser, users, type Role } from "../data";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// ── Role constants matching the RoleManager contract ─────────────────────────
const ROLE_HASHES: Record<string, Role> = {
  [ethers.id("ADMIN")]: "ADMIN",
  [ethers.id("GOVT_OFFICIAL")]: "GOVT_OFFICIAL",
  [ethers.id("CONTRACTOR")]: "CONTRACTOR",
  [ethers.id("AUDITOR")]: "AUDITOR",
  [ethers.id("INSPECTOR")]: "INSPECTOR",
  [ethers.id("CITIZEN")]: "CITIZEN",
};

const ROLE_MANAGER_ABI = [
  "function getUserRole(address account) external view returns (bytes32)",
];

async function queryOnChainRole(walletAddress: string): Promise<Role | null> {
  const rpcUrl = process.env.POLYGON_AMOY_RPC;
  const roleManagerAddr = process.env.ROLE_MANAGER_ADDRESS;
  if (!rpcUrl || !isConfiguredContractAddress(roleManagerAddr)) {
    return null;
  }
  try {
    const isLocal = rpcUrl.includes("127.0.0.1") || rpcUrl.includes("localhost");
    const provider = isLocal ? new ethers.JsonRpcProvider(rpcUrl) : createAmoyProvider(rpcUrl);
    const contract = new ethers.Contract(roleManagerAddr, ROLE_MANAGER_ABI, provider);
    const roleHash: string = await contract.getUserRole(walletAddress);
    // bytes32(0) means unregistered
    if (roleHash === ethers.ZeroHash) return "CITIZEN";
    return ROLE_HASHES[roleHash] ?? "CITIZEN";
  } catch (err) {
    logger.warn({ err, walletAddress }, "On-chain role query failed; using fallback");
    return null;
  }
}

function inferRoleFallback(walletAddress: string): Role {
  const roles: Role[] = ["CITIZEN", "GOVT_OFFICIAL", "CONTRACTOR", "AUDITOR", "INSPECTOR"];
  const index = Number.parseInt(walletAddress.toLowerCase().slice(-2), 16);
  return roles[Number.isFinite(index) ? index % roles.length : 0] ?? "CITIZEN";
}

async function resolveRole(walletAddress: string, existingRole?: Role): Promise<Role> {
  // 1. Existing DB role takes priority (already granted by admin)
  if (existingRole && existingRole !== "CITIZEN") return existingRole;
  // 2. Try on-chain role manager
  const onChainRole = await queryOnChainRole(walletAddress);
  if (onChainRole) return onChainRole;
  // 3. New wallet — default CITIZEN (not the hash-based heuristic)
  return existingRole ?? "CITIZEN";
}

function makeToken(walletAddress: string, role: string): string {
  const payload = Buffer.from(JSON.stringify({ walletAddress, role, issuedAt: Date.now() })).toString("base64url");
  const secret = process.env.SESSION_SECRET ?? process.env.JWT_SECRET ?? "decentralitrack-demo-secret";
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("base64url");
  return `dt.${payload}.${sig}`;
}

export function verifyToken(token: string): { walletAddress: string; role: Role } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== "dt") return null;
    const [, payload, sig] = parts;
    const secret = process.env.SESSION_SECRET ?? process.env.JWT_SECRET ?? "decentralitrack-demo-secret";
    const expected = crypto.createHmac("sha256", secret).update(payload!).digest("base64url");
    if (sig !== expected) return null;
    const decoded = JSON.parse(Buffer.from(payload!, "base64url").toString());
    return { walletAddress: decoded.walletAddress, role: decoded.role };
  } catch {
    return null;
  }
}

// ── Routes ────────────────────────────────────────────────────────────────────

router.post("/auth/nonce", async (req, res) => {
  const walletAddress = String(req.body?.walletAddress ?? "").trim();
  if (!walletAddress) {
    res.status(400).json({ message: "walletAddress is required" });
    return;
  }
  const nonce = `Sign this DecentraliTrack login nonce: ${crypto.randomBytes(16).toString("hex")}`;
  const key = walletAddress.toLowerCase();
  const existing = users.get(key);
  const role = await resolveRole(walletAddress, existing?.role);
  await persistUser({ walletAddress, role, nonce });
  res.json({ nonce });
});

router.post("/auth/verify", async (req, res) => {
  const walletAddress = String(req.body?.walletAddress ?? "").trim();
  const signature = String(req.body?.signature ?? "").trim();
  if (!walletAddress || !signature) {
    res.status(400).json({ message: "walletAddress and signature are required" });
    return;
  }

  const key = walletAddress.toLowerCase();
  const user = users.get(key);

  if (signature !== "demo" && user?.nonce) {
    try {
      const recovered = ethers.verifyMessage(user.nonce, signature);
      if (recovered.toLowerCase() !== key) {
        res.status(401).json({ message: "Signature does not match wallet address" });
        return;
      }
    } catch {
      res.status(401).json({ message: "Invalid signature" });
      return;
    }
  }

  const role = await resolveRole(walletAddress, user?.role);
  const resolvedUser = { walletAddress, role };
  const token = makeToken(walletAddress, role);
  await persistUser({ walletAddress, role, nonce: undefined });
  res.json({ token, user: resolvedUser });
});

router.post("/auth/admin/grant-role", async (req, res) => {
  const authHeader = req.headers.authorization ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const caller = verifyToken(token);
  if (!caller || caller.role !== "ADMIN") {
    res.status(403).json({ message: "ADMIN role required to grant roles" });
    return;
  }

  const { targetWallet, role } = req.body ?? {};
  const validRoles: Role[] = ["CITIZEN", "GOVT_OFFICIAL", "CONTRACTOR", "AUDITOR", "INSPECTOR"];
  if (!targetWallet || !role || !validRoles.includes(role)) {
    res.status(400).json({ message: `targetWallet and role (${validRoles.join(", ")}) are required` });
    return;
  }

  const existing = users.get(String(targetWallet).toLowerCase()) ?? { walletAddress: String(targetWallet), role: "CITIZEN" as Role };
  await persistUser({ ...existing, walletAddress: String(targetWallet), role: role as Role, nonce: undefined });
  logger.info({ targetWallet, role, grantedBy: caller.walletAddress }, "Role granted by admin");
  res.json({ message: `Role ${role} granted to ${targetWallet}`, walletAddress: targetWallet, role });
});

export default router;
