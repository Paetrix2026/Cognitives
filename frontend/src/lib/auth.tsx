import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserProvider } from "ethers";
import { createAuthNonce, verifyWalletSignature } from "@workspace/api-client-react";
import type { User, UserRole } from "@workspace/api-zod";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (role?: UserRole, forceDemo?: boolean, demoWallet?: string) => Promise<User>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function loginWithMetaMask(): Promise<{ token: string; user: User }> {
  const ethereum = (window as Window & { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
  if (!ethereum) throw new Error("MetaMask not installed");

  const provider = new BrowserProvider(ethereum);
  await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  const walletAddress = await signer.getAddress();

  const { nonce } = await createAuthNonce({ walletAddress });
  const signature = await signer.signMessage(nonce);
  return verifyWalletSignature({ walletAddress, signature });
}

async function loginDemo(role: UserRole, walletAddress: string): Promise<{ token: string; user: User }> {
  await createAuthNonce({ walletAddress });
  const result = await verifyWalletSignature({ walletAddress, signature: "demo" });
  return { ...result, user: { walletAddress, role } };
}

export function hasMetaMask(): boolean {
  return Boolean((window as Window & { ethereum?: unknown }).ethereum);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
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

  const login = async (role: UserRole = "CITIZEN", forceDemo = false, demoWallet?: string): Promise<User> => {
    const useDemo = forceDemo || !hasMetaMask();
    const { token: newToken, user: newUser } = useDemo
      ? await loginDemo(role, demoWallet ?? "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65")
      : await loginWithMetaMask();

    // MetaMask: role comes from server (on-chain or DB); demo: use selected role
    const finalUser: User = useDemo ? { ...newUser, role } : newUser;

    setUser(finalUser);
    setToken(newToken);
    localStorage.setItem("dt_token", newToken);
    localStorage.setItem("dt_user", JSON.stringify(finalUser));
    return finalUser;
  };

  const logout = () => {
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
