import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Role = "CITIZEN" | "GOVT_OFFICIAL" | "CONTRACTOR" | "AUDITOR" | "INSPECTOR";

const ROLES: { value: Role; label: string; color: string }[] = [
  { value: "CITIZEN", label: "Citizen", color: "#6b7280" },
  { value: "GOVT_OFFICIAL", label: "Government Official", color: "#1649FF" },
  { value: "CONTRACTOR", label: "Contractor", color: "#cf9207" },
  { value: "INSPECTOR", label: "Field Inspector", color: "#7c3aed" },
  { value: "AUDITOR", label: "Auditor", color: "#12A368" },
];

interface GrantResult {
  walletAddress: string;
  role: Role;
  ok: boolean;
  message: string;
}

export default function Admin() {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [wallet, setWallet] = useState("");
  const [role, setRole] = useState<Role>("CITIZEN");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<GrantResult[]>([]);

  if (!user || (user.role !== "ADMIN" && user.role !== "GOVT_OFFICIAL")) {
    return (
      <div className="py-20 text-center">
        <Shield className="h-10 w-10 text-neutral-300 mx-auto mb-4" />
        <div className="text-[15px] font-medium text-neutral-900 mb-2">Admin access required</div>
        <div className="text-[13px] text-neutral-500">This page is only accessible to ADMIN role wallets.</div>
      </div>
    );
  }

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet.startsWith("0x") || wallet.length !== 42) {
      toast({ title: "Invalid wallet", description: "Must be a 42-character hex address (0x…)", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/admin/grant-role", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetWallet: wallet, role }),
      });
      const data = await res.json() as { message?: string };
      if (!res.ok) throw new Error(data.message ?? "Failed");
      setHistory(prev => [{ walletAddress: wallet, role, ok: true, message: data.message ?? "Role granted" }, ...prev]);
      toast({ title: "Role granted", description: `${wallet.slice(0, 10)}… is now ${role.replace("_", " ")}` });
      setWallet("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setHistory(prev => [{ walletAddress: wallet, role, ok: false, message: msg }, ...prev]);
      toast({ title: "Grant failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "h-10 text-[13px] bg-transparent border-0 border-b border-neutral-200 focus-visible:border-neutral-900 focus-visible:ring-0 rounded-none px-0 font-mono";

  return (
    <div className="max-w-xl mx-auto space-y-12">
      <header>
        <div className="text-[11px] uppercase tracking-[0.12em] text-neutral-500 mb-3">Admin</div>
        <h1 className="text-[34px] font-semibold tracking-tight leading-tight text-neutral-900">
          Role management
        </h1>
        <p className="mt-3 text-[14px] text-neutral-600 leading-relaxed">
          Grant on-chain roles to wallet addresses. New wallets default to Citizen until upgraded here.
        </p>
      </header>

      <form onSubmit={handleGrant} className="space-y-7">
        <div className="space-y-2">
          <Label className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 font-medium">Wallet address</Label>
          <Input
            className={inputCls}
            value={wallet}
            onChange={e => setWallet(e.target.value.trim())}
            placeholder="0x…"
            required
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 font-medium">Grant role</Label>
          <Select value={role} onValueChange={v => setRole(v as Role)}>
            <SelectTrigger className="h-10 text-[13px] bg-transparent border-0 border-b border-neutral-200 rounded-none px-0 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map(r => (
                <SelectItem key={r.value} value={r.value} className="text-[13px]">
                  <span style={{ color: r.color, fontWeight: 600 }}>{r.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={loading} className="h-10 px-6 text-[13px] font-medium">
            {loading ? "Granting…" : "Grant role"}
          </Button>
        </div>
      </form>

      {history.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 mb-4">Recent grants</div>
          <div className="space-y-1">
            {history.map((h, i) => (
              <div key={i} className="py-3 border-t border-neutral-100 flex items-center gap-3">
                {h.ok
                  ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                  : <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-mono text-neutral-600 truncate">{h.walletAddress}</div>
                  <div className="text-[11.5px] text-neutral-500">
                    {h.ok ? `→ ${h.role.replace("_", " ")}` : h.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4 border-t border-neutral-100">
        <div className="text-[11px] uppercase tracking-[0.1em] text-neutral-500 mb-3">How roles work</div>
        <div className="space-y-2">
          {ROLES.map(r => (
            <div key={r.value} className="flex items-center gap-3 text-[12.5px]">
              <span className="h-2 w-2 rounded-full shrink-0" style={{ background: r.color }} />
              <span className="font-medium text-neutral-700" style={{ minWidth: "130px" }}>{r.label}</span>
              <span className="text-neutral-500">
                {r.value === "CITIZEN" && "Default for all new wallets — public read access"}
                {r.value === "GOVT_OFFICIAL" && "Creates projects, assigns contractors, manages escrow"}
                {r.value === "CONTRACTOR" && "Claims broadcasts, submits proofs, receives payments"}
                {r.value === "INSPECTOR" && "Reads project data and reports field observations to officials and auditors"}
                {r.value === "AUDITOR" && "Reviews proofs, approves milestone releases (2-of-3 multi-sig)"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
