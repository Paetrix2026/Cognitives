import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserProvider } from "ethers";
import { Web3Auth } from "@web3auth/modal";
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK, type IProvider, type UserInfo } from "@web3auth/base";
import { createAuthNonce, setAuthTokenGetter, verifyWalletSignature } from "@workspace/api-client-react";
import type { User, UserRole } from "@workspace/api-zod";

setAuthTokenGetter(() => (typeof localStorage === "undefined" ? null : localStorage.getItem("dt_token")));

export interface Web3AuthProfile {
  name?: string;
  email?: string;
  profileImage?: string;
  walletAddress: string;
  loginProvider?: string;
}

export type AuthUser = User & {
  profile?: Web3AuthProfile;
};

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  login: (role?: UserRole, forceDemo?: boolean, demoWallet?: string) => Promise<AuthUser>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const WEB3AUTH_CLIENT_ID = import.meta.env.VITE_WEB3AUTH_CLIENT_ID ?? "";
const WEB3AUTH_CONFIGURED = WEB3AUTH_CLIENT_ID.length > 0 && WEB3AUTH_CLIENT_ID !== "YOUR_WEB3AUTH_CLIENT_ID";

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: import.meta.env.VITE_WEB3AUTH_CHAIN_ID || "0x1",
  rpcTarget: import.meta.env.VITE_WEB3AUTH_RPC_TARGET || "https://rpc.ankr.com/eth",
  displayName: import.meta.env.VITE_WEB3AUTH_CHAIN_NAME || "Ethereum Mainnet",
  blockExplorerUrl: import.meta.env.VITE_WEB3AUTH_BLOCK_EXPLORER || "https://etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://web3auth.io/images/web3authlog.png",
};

let web3authInstance: Web3Auth | null = null;
let web3authInitPromise: Promise<Web3Auth> | null = null;

async function getWeb3Auth(): Promise<Web3Auth> {
  if (!WEB3AUTH_CONFIGURED) throw new Error("Web3Auth is not configured. Set VITE_WEB3AUTH_CLIENT_ID to enable social login.");
  if (web3authInstance) return web3authInstance;
  if (!web3authInitPromise) {
    const web3auth = new Web3Auth({
      clientId: WEB3AUTH_CLIENT_ID,
      web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
      chains: [chainConfig],
      uiConfig: {
        appName: "DecentraliTrack",
        loginMethodsOrder: ["google", "metamask"],
      },
    });

    web3authInitPromise = web3auth.init().then(() => {
      web3authInstance = web3auth;
      return web3auth;
    }).catch((err) => {
      web3authInitPromise = null; // allow retry after failure
      throw err;
    });
  }

  return web3authInitPromise;
}

function profileFromWeb3Auth(userInfo: Partial<UserInfo> | null, walletAddress: string): Web3AuthProfile {
  return {
    name: userInfo?.name || undefined,
    email: userInfo?.email || undefined,
    profileImage: userInfo?.profileImage || undefined,
    walletAddress,
    loginProvider: userInfo?.typeOfLogin || userInfo?.aggregateVerifier || undefined,
  };
}

async function loginWithWeb3Auth(): Promise<{ token: string; user: AuthUser }> {
  const web3auth = await getWeb3Auth();
  const web3authProvider = await web3auth.connect();
  if (!web3authProvider) throw new Error("Web3Auth did not return a wallet provider");

  const provider = new BrowserProvider(web3authProvider as IProvider);
  const signer = await provider.getSigner();
  const walletAddress = await signer.getAddress();
  const userInfo = await web3auth.getUserInfo();

  const { nonce } = await createAuthNonce({ walletAddress });
  const signature = await signer.signMessage(nonce);
  const result = await verifyWalletSignature({ walletAddress, signature });

  return {
    ...result,
    user: {
      ...result.user,
      profile: profileFromWeb3Auth(userInfo, walletAddress),
    },
  };
}

const DEMO_PROFILES: Record<string, Omit<Web3AuthProfile, "walletAddress">> = {
  "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc": {
    name: "Contractor 1",
    email: "contractor.one@demo.local",
    loginProvider: "demo",
  },
  "0x90f79bf6eb2c4f870365e785982e1f101e93b906": {
    name: "Contractor 2",
    email: "contractor.two@demo.local",
    loginProvider: "demo",
  },
};

async function loginDemo(role: UserRole, walletAddress: string): Promise<{ token: string; user: AuthUser }> {
  await createAuthNonce({ walletAddress });
  const result = await verifyWalletSignature({ walletAddress, signature: "demo" });
  const demoProfile = DEMO_PROFILES[walletAddress.toLowerCase()];
  return {
    ...result,
    user: {
      walletAddress,
      role,
      profile: {
        ...demoProfile,
        walletAddress,
      },
    },
  };
}

export function formatWalletAddress(walletAddress: string): string {
  return `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("dt_token");
    const storedUser = localStorage.getItem("dt_user");
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("dt_token");
        localStorage.removeItem("dt_user");
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!WEB3AUTH_CONFIGURED) return;
    void getWeb3Auth().catch((err) => {
      console.error("Web3Auth initialization failed", err);
    });
  }, []);

  const login = async (role: UserRole = "CITIZEN", forceDemo = false, demoWallet?: string): Promise<AuthUser> => {
    const useDemo = forceDemo;
    const { token: newToken, user: newUser } = useDemo
      ? await loginDemo(role, demoWallet ?? "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65")
      : await loginWithWeb3Auth();

    // Web3Auth: role comes from server (on-chain or DB); demo: use selected role.
    const finalUser: AuthUser = useDemo ? { ...newUser, role } : newUser;

    setUser(finalUser);
    setToken(newToken);
    localStorage.setItem("dt_token", newToken);
    localStorage.setItem("dt_user", JSON.stringify(finalUser));
    return finalUser;
  };

  const logout = () => {
    if (WEB3AUTH_CONFIGURED) {
      void getWeb3Auth().then((web3auth) => web3auth.logout({ cleanup: true })).catch(() => undefined);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("dt_token");
    localStorage.removeItem("dt_user");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
