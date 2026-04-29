import React, { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import type { UserRole } from "@workspace/api-zod";
import { ShieldCheck, ChevronDown, ArrowRight, AlertTriangle } from "lucide-react";

type LoginState = "idle" | "connecting" | "signing" | "done" | "error";

const ROLE_REDIRECT: Record<string, string> = {
  GOVT_OFFICIAL: "/official",
  CONTRACTOR: "/contractor",
  AUDITOR: "/auditor",
  INSPECTOR: "/inspector",
  ADMIN: "/official",
  CITIZEN: "/citizen",
};

const DEMO_ACCOUNTS: { role: UserRole; wallet: string; label: string; desc: string }[] = [
  { role: "GOVT_OFFICIAL", wallet: "0x437a62ee161a037cc7DEc3D70785C01f7Dc0758b", label: "Government Official", desc: "Create projects, assign contractors and manage escrow" },
  { role: "AUDITOR",       wallet: "0xF32a19dBDc4B0378F2dc1265133f60419546CfB5", label: "Auditor",             desc: "Review milestone proofs and authorize fund release" },
  { role: "CONTRACTOR",    wallet: "0xAe8511b9733D783CD623a792dc4867053EE60A6a", label: "Contractor",          desc: "Claim broadcasts and submit milestone proofs" },
];

const MetaMaskLogo = () => (
  <svg width="40" height="40" viewBox="0 0 35 33" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32.958 1L19.4 10.688l2.466-5.832L32.958 1z" fill="#E17726" stroke="#E17726" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M2.042 1l13.447 9.779-2.347-5.923L2.042 1z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28.23 23.533l-3.61 5.53 7.733 2.13 2.22-7.55-6.343-.11zM.453 23.643l2.21 7.55 7.722-2.13-3.6-5.53-6.332.11z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.013 14.465l-2.16 3.267 7.693.341-.254-8.274-5.279 4.666zM24.987 14.465l-5.357-4.756-.165 8.364 7.682-.341-2.16-3.267zM10.385 29.063l4.627-2.22-3.99-3.11-.637 5.33zM19.988 26.843l4.617 2.22-.627-5.33-3.99 3.11z" fill="#E27625" stroke="#E27625" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M24.605 29.063l-4.617-2.22.374 2.99-.04 1.265 4.283-2.035zM10.385 29.063l4.293 2.035-.03-1.264.363-2.991-4.626 2.22z" fill="#D5BFB2" stroke="#D5BFB2" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.743 21.578l-3.85-1.132 2.716-1.244 1.134 2.376zM20.257 21.578l1.133-2.376 2.727 1.244-3.86 1.132z" fill="#233447" stroke="#233447" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10.385 29.063l.657-5.53-4.257.12 3.6 5.41zM23.958 23.533l.647 5.53 3.61-5.41-4.257-.12zM27.147 17.732l-7.682.341.714 3.505 1.133-2.376 2.727 1.244 3.108-2.714zM10.893 20.446l2.727-1.244 1.123 2.376.724-3.505-7.693-.341 3.119 2.714z" fill="#CC6228" stroke="#CC6228" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7.853 17.732l3.228 6.301-.11-3.587-3.118-2.714zM23.04 20.446l-.12 3.587 3.228-6.301-3.108 2.714zM15.467 18.073l-.724 3.505.91 4.686.208-6.17-.394-2.021zM19.533 18.073l-.384 2.011.188 6.18.91-4.686-.714-3.505z" fill="#E27525" stroke="#E27525" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.257 21.578l-.91 4.686.657.461 3.99-3.11.12-3.587-3.857 1.55zM10.893 20.446l.11 3.587 3.99 3.11.657-.461-.91-4.686-3.847-1.55z" fill="#F5841F" stroke="#F5841F" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.337 31.098l.04-1.265-.344-.297h-5.066l-.323.297.03 1.265-4.293-2.035 1.5 1.234 3.04 2.106h5.19l3.05-2.106 1.49-1.234-4.314 2.035z" fill="#C0AC9D" stroke="#C0AC9D" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.004 26.725l-.657-.461h-3.694l-.657.461-.363 2.991.323-.297h5.066l.344.297-.362-2.991z" fill="#161616" stroke="#161616" strokeWidth=".25" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const STATE_MESSAGES: Record<LoginState, string> = {
  idle: "Continue with Web3Auth",
  connecting: "Connecting to wallet…",
  signing: "Sign the verification message…",
  done: "Authenticated!",
  error: "Connection failed",
};

const WEB3AUTH_CONFIGURED =
  !!import.meta.env.VITE_WEB3AUTH_CLIENT_ID &&
  import.meta.env.VITE_WEB3AUTH_CLIENT_ID !== "YOUR_WEB3AUTH_CLIENT_ID";

export default function Login() {
  const { login, user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [state, setState] = useState<LoginState>("idle");
  const [error, setError] = useState("");
  const [devOpen, setDevOpen] = useState(false);

  // Already logged in — redirect
  useEffect(() => {
    if (!isLoading && user) {
      setLocation(ROLE_REDIRECT[user.role] ?? "/citizen");
    }
  }, [user, isLoading, setLocation]);

  const handleWeb3AuthLogin = async () => {
    setError("");
    setState("connecting");
    try {
      setState("signing");
      const resolvedUser = await login();
      setState("done");
      setTimeout(() => {
        setLocation(ROLE_REDIRECT[resolvedUser.role] ?? "/citizen");
      }, 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg.includes("rejected") || msg.includes("denied") ? "You rejected the signature request." : msg);
      setState("error");
    }
  };

  const handleDemoLogin = async (role: UserRole, wallet: string) => {
    setError("");
    setState("connecting");
    try {
      const resolvedUser = await login(role, true, wallet);
      setState("done");
      setTimeout(() => {
        setLocation(ROLE_REDIRECT[resolvedUser.role] ?? "/citizen");
      }, 600);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setState("error");
    }
  };

  if (isLoading) return null;

  const busy = state === "connecting" || state === "signing";

  return (
    <div style={{ minHeight: "100vh", background: "#F5F4F1", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Logo */}
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", marginBottom: "40px" }}>
        <svg viewBox="0 0 34 34" width="28" height="28" fill="none">
          <path d="M17 2 L31 9.5 L31 25.5 L17 33 L3 25.5 L3 9.5 Z" fill="#1649FF" />
          <path d="M17 8 L25.5 12.8 L25.5 22.2 L17 27 L8.5 22.2 L8.5 12.8 Z" fill="white" fillOpacity="0.25" />
          <circle cx="17" cy="17.5" r="3.5" fill="white" fillOpacity="0.95" />
        </svg>
        <span style={{ fontSize: "17px", fontWeight: 700, color: "#0C0F1D", letterSpacing: "-0.01em" }}>DecentraliTrack</span>
      </Link>

      {/* Main card */}
      <div style={{ background: "#fff", borderRadius: "20px", border: "1px solid rgba(12,15,29,0.08)", padding: "40px", width: "100%", maxWidth: "420px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#EEF2FF", borderRadius: "999px", padding: "5px 12px", fontSize: "11.5px", color: "#1649FF", fontWeight: 600, marginBottom: "16px" }}>
            <ShieldCheck size={13} /> Wallet-verified access
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: 700, color: "#0C0F1D", letterSpacing: "-0.02em", marginBottom: "8px" }}>
            Sign in to your workspace
          </h1>
          <p style={{ fontSize: "13px", color: "#6b7280", lineHeight: 1.6 }}>
            Continue with Google or MetaMask. Your verified profile and wallet are read automatically.
          </p>
        </div>

        {/* Web3Auth button */}
        {WEB3AUTH_CONFIGURED ? (
          <button
            onClick={handleWeb3AuthLogin}
            disabled={busy || state === "done"}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              padding: "14px 20px",
              background: state === "done" ? "#12A368" : state === "error" ? "#fff" : "#0C0F1D",
              color: state === "done" ? "#fff" : state === "error" ? "#0C0F1D" : "#fff",
              border: state === "error" ? "1.5px solid #e5e7eb" : "none",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: busy || state === "done" ? "default" : "pointer",
              opacity: busy ? 0.75 : 1,
              transition: "all 0.2s",
            }}
          >
            {state === "done" ? (
              <>✓ {STATE_MESSAGES.done}</>
            ) : busy ? (
              <><Spinner /> {STATE_MESSAGES[state]}</>
            ) : (
              <><ShieldCheck size={18} /> {state === "error" ? "Try again" : STATE_MESSAGES.idle}</>
            )}
          </button>
        ) : (
          <div style={{ width: "100%", padding: "14px 20px", background: "#f3f4f6", borderRadius: "12px", fontSize: "13px", color: "#6b7280", textAlign: "center", border: "1.5px dashed #d1d5db" }}>
            <ShieldCheck size={16} style={{ display: "inline", marginRight: "8px", verticalAlign: "middle" }} />
            Social login unavailable — <code style={{ fontSize: "11px", background: "#e5e7eb", padding: "1px 5px", borderRadius: "4px" }}>VITE_WEB3AUTH_CLIENT_ID</code> not set
          </div>
        )}

        {/* Error */}
        {state === "error" && error && (
          <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", marginTop: "12px", padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px" }}>
            <AlertTriangle size={14} color="#dc2626" style={{ marginTop: "1px", flexShrink: 0 }} />
            <span style={{ fontSize: "12.5px", color: "#dc2626", lineHeight: 1.5 }}>{error}</span>
          </div>
        )}

        {/* Signing hint */}
        {state === "signing" && (
          <p style={{ marginTop: "12px", fontSize: "12px", color: "#6b7280", textAlign: "center" }}>
            Approve the wallet signature request to complete verification.
          </p>
        )}

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "24px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
          <span style={{ fontSize: "11.5px", color: "#9ca3af", fontWeight: 500 }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "#e5e7eb" }} />
        </div>

        {/* Citizen shortcut */}
        <Link
          href="/citizen"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", width: "100%", padding: "11px", background: "#f3f4f6", borderRadius: "10px", fontSize: "13px", fontWeight: 500, color: "#374151", textDecoration: "none", transition: "background 0.15s" }}
        >
          Browse as public citizen (no login) <ArrowRight size={13} />
        </Link>
      </div>

      {/* Dev Mode accordion */}
      <div style={{ width: "100%", maxWidth: "420px", marginTop: "16px" }}>
        <button
          onClick={() => setDevOpen(v => !v)}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "transparent", border: "1px solid rgba(12,15,29,0.1)", borderRadius: "12px", fontSize: "12.5px", color: "#6b7280", fontWeight: 500, cursor: "pointer" }}
        >
          <span>🛠 Developer / Demo Mode</span>
          <ChevronDown size={14} style={{ transform: devOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>

        {devOpen && (
          <div style={{ background: "#fff", border: "1px solid rgba(12,15,29,0.08)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <p style={{ fontSize: "11.5px", color: "#9ca3af", marginBottom: "4px", lineHeight: 1.5 }}>
              Simulates login without a real wallet. Role is set client-side — for demonstration only.
            </p>
            {DEMO_ACCOUNTS.map(a => (
              <button
                key={a.wallet}
                onClick={() => handleDemoLogin(a.role, a.wallet)}
                disabled={busy || state === "done"}
                style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px 12px", border: "1.5px solid #e5e7eb", borderRadius: "10px", background: "#fff", cursor: "pointer", textAlign: "left", transition: "border-color 0.15s", width: "100%" }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#0C0F1D" }}>{a.label}</div>
                  <div style={{ fontSize: "11.5px", color: "#6b7280", marginTop: "2px" }}>{a.desc}</div>
                  <div style={{ fontSize: "10px", color: "#9ca3af", marginTop: "3px", fontFamily: "monospace" }}>{a.wallet.slice(0, 10)}…{a.wallet.slice(-6)}</div>
                </div>
                <ArrowRight size={13} color="#9ca3af" style={{ marginTop: "3px" }} />
              </button>
            ))}
          </div>
        )}
      </div>

      <p style={{ marginTop: "24px", fontSize: "11.5px", color: "#9ca3af", textAlign: "center" }}>
        New wallet or social login? You'll be registered as <strong style={{ color: "#6b7280" }}>Citizen</strong> by default.
        <br />Role upgrades are granted by an administrator.
      </p>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 0.8s linear infinite" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
