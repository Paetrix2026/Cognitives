import React from "react";
import { Link, useLocation } from "wouter";
import { formatWalletAddress, useAuth } from "@/lib/auth";
import { LogOut, Shield } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { href: "/citizen", label: "Ledger", show: true },
    { href: "/official", label: "Official", show: user?.role === "GOVT_OFFICIAL" || user?.role === "ADMIN" },
    { href: "/contractor", label: "Contractor", show: user?.role === "CONTRACTOR" || user?.role === "ADMIN" },
    { href: "/auditor", label: "Auditor", show: user?.role === "AUDITOR" || user?.role === "ADMIN" },
    { href: "/inspector", label: "Inspector", show: user?.role === "INSPECTOR" || user?.role === "ADMIN" },
    { href: "/admin", label: "Admin", show: user?.role === "ADMIN" },
  ].filter(i => i.show);

  const roleLabel = user?.role.replace(/_/g, " ").toLowerCase();
  const displayName = user?.profile?.name || (user ? "Verified wallet" : "");
  const displayEmail = user?.profile?.email;

  return (
    <div className="min-h-screen bg-white text-neutral-900" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      `}</style>

      <header className="border-b border-neutral-200">
        <div className="mx-auto max-w-5xl px-6 md:px-10 h-16 flex items-center justify-between gap-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <svg viewBox="0 0 34 34" width="22" height="22" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <path d="M17 2 L31 9.5 L31 25.5 L17 33 L3 25.5 L3 9.5 Z" fill="#1649FF" />
              <path d="M17 8 L25.5 12.8 L25.5 22.2 L17 27 L8.5 22.2 L8.5 12.8 Z" fill="white" fillOpacity="0.25" />
              <circle cx="17" cy="17.5" r="3.5" fill="white" fillOpacity="0.95" />
            </svg>
            <span className="text-[15px] font-bold tracking-[-0.01em] text-neutral-900">DecentraliTrack</span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-7 flex-1 justify-center">
            {navItems.map(item => {
              const active = location.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-[13px] tracking-tight transition-colors ${
                    active ? "text-neutral-900 font-medium" : "text-neutral-500 hover:text-neutral-900"
                  }`}
                >
                  {item.label === "Admin" ? (
                    <span className="inline-flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Admin
                    </span>
                  ) : item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          {user ? (
            <div className="flex items-center gap-3 shrink-0">
              <div className="hidden sm:flex flex-col items-end leading-tight">
                <span className="text-[11px] text-neutral-500 capitalize">{displayEmail || roleLabel}</span>
                <span className="text-[11px] font-medium text-neutral-900">
                  {displayName}
                  <span className="font-mono text-neutral-500 ml-1">{formatWalletAddress(user.walletAddress)}</span>
                </span>
              </div>
              <button
                onClick={logout}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:border-neutral-400 transition"
                aria-label="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="h-8 px-4 inline-flex items-center justify-center rounded-full bg-neutral-900 text-white text-[12.5px] font-medium hover:bg-neutral-700 transition shrink-0"
            >
              Connect wallet
            </Link>
          )}
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-neutral-200 px-6 h-12 flex items-center gap-5 overflow-x-auto">
          {navItems.map(item => {
            const active = location.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`text-[13px] whitespace-nowrap ${
                  active ? "text-neutral-900 font-medium" : "text-neutral-500"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {!user && (
            <Link href="/login" className="text-[13px] whitespace-nowrap text-[#1649FF] font-medium">
              Connect wallet
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 md:px-10 py-12 md:py-16">
        {children}
      </main>
    </div>
  );
}
