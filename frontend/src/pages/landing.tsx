import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import {
  Users,
  HardHat,
  FileCheck,
  LayoutDashboard,
  CheckCircle2,
  ShieldCheck,
  Layers,
  GitMerge,
  Globe,
  BadgeCheck,
  Zap,
  Lock, 
  ArrowUpRight,
  Twitter,
  Github,
  Linkedin,
  Mail,
  Building2,
  HelpCircle,
  Search,
} from "lucide-react";
import { CyberButton } from "@/components/ui/cyber-button";

export default function Landing() {
  const { isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isLoading) return null;

  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400&family=Outfit:wght@300;400;500;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .cl {
      /* Clean, Apple-style Light Theme Palette */
      --blue: #0077b6;
      --blue-bg: #F0F7FF;
      --teal: #00A896;
      --gold: #F59E0B;
      --green: #10B981;
      --ink: #1D1D1F; /* Apple dark gray */
      --ink-2: #86868B;
      --ink-3: #A1A1A6;
      --bg: #F5F5F7; /* Apple classic background */
      --surface: #FFFFFF;
      --glass: rgba(255, 255, 255, 0.75);
      --glass-border: rgba(255, 255, 255, 0.5);
      --border: rgba(0, 0, 0, 0.08);
      --border-2: rgba(0, 0, 0, 0.04);
      
      /* Generous modern radii */
      --r-sm: 8px;
      --r-md: 12px;
      --r-lg: 20px;
      --r-xl: 28px;
      --r-2xl: 36px;
      --r-full: 9999px;
      
      font-family: 'Outfit', system-ui, sans-serif;
      background: var(--bg);
      color: var(--ink);
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    /* ── NAV (Glassmorphism) ─────────────────────────────── */
    .cl-nav {
      position: fixed; top: 0; left: 0; right: 0;
      z-index: 100; padding: 20px 24px 0;
      transition: padding 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .cl-nav-inner {
      max-width: 1200px; margin: 0 auto;
      height: 64px; display: flex;
      align-items: center; justify-content: space-between;
      padding: 0 24px; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      border-radius: var(--r-full);
      background: transparent;
    }
    .cl-nav--scrolled { padding-top: 12px; }
    .cl-nav--scrolled .cl-nav-inner {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid var(--glass-border);
      box-shadow: 0 8px 32px rgba(0,0,0,0.04);
    }
    .cl-logo {
      display: flex; align-items: center;
      gap: 12px; text-decoration: none; color: var(--ink);
    }
    .cl-logo-hex { width: 30px; height: 30px; }
    .cl-logo-name { font-size: 17px; font-weight: 600; letter-spacing: -0.4px; }
    
    .cl-nav-mid { display: flex; align-items: center; gap: 36px; }
    .cl-nav-link {
      font-size: 14px; font-weight: 500;
      color: var(--ink-2); text-decoration: none;
      transition: color 0.2s;
    }
    .cl-nav-link:hover { color: var(--ink); }
    
    .cl-nav-right { display: flex; align-items: center; gap: 16px; }
    .cl-nav-ghost {
      font-family: 'Outfit', sans-serif; font-size: 14px;
      font-weight: 500; color: var(--ink-2);
      background: none; border: none; cursor: pointer;
      transition: color 0.2s;
    }
    .cl-nav-ghost:hover { color: var(--ink); }
    
    .cl-btn-nav {
      font-family: 'Outfit', sans-serif; font-size: 14px;
      font-weight: 500; background: var(--ink); color: #fff;
      border: none; border-radius: var(--r-full);
      padding: 10px 20px; cursor: pointer;
      display: flex; align-items: center; gap: 6px;
      transition: all 0.3s ease;
    }
    .cl-btn-nav:hover {
      background: var(--blue);
      transform: scale(1.02);
      box-shadow: 0 8px 20px rgba(0, 102, 204, 0.25);
    }

    /* ── HERO ────────────────────────────── */
    .cl-hero {
      min-height: 100vh; display: flex;
      flex-direction: column; align-items: center;
      justify-content: center; padding: 140px 24px 80px;
      position: relative; overflow: hidden;
    }
    .cl-hero-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
    
    /* Soft ambient gradients instead of harsh orbs */
    .cl-hero-orb-a {
      position: absolute; width: 800px; height: 800px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0, 102, 204, 0.08) 0%, transparent 70%);
      top: -200px; right: -100px;
      filter: blur(60px);
    }
    .cl-hero-orb-b {
      position: absolute; width: 600px; height: 600px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0, 168, 150, 0.08) 0%, transparent 70%);
      bottom: 100px; left: -200px;
      filter: blur(60px);
    }

    .cl-hero-content { position: relative; z-index: 1; text-align: center; max-width: 860px; }
    
    .cl-hero-badge {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 6px 18px 6px 8px;
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.8);
      border-radius: var(--r-full);
      font-size: 13px; font-weight: 500; color: var(--ink);
      margin-bottom: 32px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.03);
    }
    .cl-badge-dot-wrap {
      background: var(--surface); border-radius: var(--r-full);
      padding: 4px 10px; display: flex; align-items: center; gap: 6px;
      box-shadow: 0 2px 6px rgba(0,0,0,0.04);
    }
    .cl-badge-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--blue);
      animation: dot-pulse 2s ease-in-out infinite;
    }

    .cl-hero-h1 {
      font-size: clamp(48px, 8vw, 88px);
      line-height: 1.05; letter-spacing: -0.03em;
      color: var(--ink); margin-bottom: 24px;
    }
    .cl-h1-serif {
      font-family: 'Fraunces', serif; font-style: italic;
      font-weight: 300; display: block; color: var(--ink-2);
    }
    .cl-h1-sans { font-family: 'Outfit', sans-serif; font-weight: 700; display: block; }

    .cl-hero-sub {
      font-size: 20px; font-weight: 400;
      color: var(--ink-2); line-height: 1.5;
      max-width: 600px; margin: 0 auto 48px;
    }
    
    .cl-hero-actions {
      display: flex; align-items: center; justify-content: center;
      gap: 16px; flex-wrap: wrap; margin-bottom: 64px;
    }
    .cl-btn-prim {
      font-family: 'Outfit', sans-serif; font-size: 15px;
      font-weight: 500; background: var(--blue); color: #fff;
      border: none; border-radius: var(--r-full);
      padding: 16px 32px; cursor: pointer;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 8px 24px rgba(0, 102, 204, 0.25);
    }
    .cl-btn-prim:hover { transform: scale(1.02); box-shadow: 0 12px 32px rgba(0, 102, 204, 0.35); }
    
    .cl-btn-sec {
      font-family: 'Outfit', sans-serif; font-size: 15px;
      font-weight: 500; background: rgba(255,255,255,0.5);
      backdrop-filter: blur(10px); color: var(--ink); 
      border: 1px solid var(--border);
      border-radius: var(--r-full); padding: 16px 32px;
      cursor: pointer; transition: all 0.3s ease;
    }
    .cl-btn-sec:hover { background: var(--surface); border-color: var(--border-2); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }

    /* ── GLASS MOCKUP ──────────────────────────── */
    .cl-mockup-wrap { position: relative; z-index: 1; width: 100%; max-width: 1060px; margin: 0 auto; perspective: 1000px; }
    .cl-mockup {
      background: rgba(255, 255, 255, 0.6);
      backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);
      border-radius: 24px;
      border: 1px solid rgba(255, 255, 255, 0.8);
      box-shadow: 0 30px 60px rgba(0,0,0,0.06), inset 0 0 0 1px rgba(255,255,255,0.5);
      overflow: hidden;
      transform: rotateX(2deg) translateY(0);
      transition: transform 0.5s ease;
    }
    .cl-mockup:hover { transform: rotateX(0deg) translateY(-10px); }
    
    .cl-mockup-chrome {
      height: 52px; border-bottom: 1px solid var(--border-2);
      display: flex; align-items: center; padding: 0 20px; gap: 8px;
    }
    .cl-chrome-btn { width: 12px; height: 12px; border-radius: 50%; }
    .cl-chrome-url {
      flex: 1; max-width: 340px; margin: 0 auto;
      background: rgba(0,0,0,0.04); border-radius: 8px;
      height: 28px; display: flex; align-items: center;
      padding: 0 12px; gap: 6px;
    }
    .cl-chrome-url span { font-size: 12px; color: var(--ink-3); }
    
    .cl-mockup-body { display: flex; height: 440px; }
    .cl-mock-sidebar {
      width: 220px; border-right: 1px solid var(--border-2);
      padding: 24px 12px; flex-shrink: 0;
    }
    .cl-mock-sb-item {
      display: flex; align-items: center; gap: 10px;
      padding: 10px 12px; font-size: 13px; font-weight: 500; color: var(--ink-2);
      border-radius: 10px; margin-bottom: 4px;
    }
    .cl-mock-sb-item.on { background: var(--surface); color: var(--ink); box-shadow: 0 2px 8px rgba(0,0,0,0.02); }
    
    .cl-mock-main { flex: 1; padding: 32px; overflow: hidden; }
    .cl-mock-stats-row { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 24px; }
    .cl-mock-stat {
      background: var(--surface); border: 1px solid var(--glass-border);
      border-radius: 16px; padding: 20px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.02);
    }
    .cl-mock-stat-l { font-size: 11px; color: var(--ink-2); font-weight: 500; margin-bottom: 8px; }
    .cl-mock-stat-v { font-size: 24px; font-weight: 700; color: var(--ink); letter-spacing: -0.5px; }
    
    .cl-mock-2col { display: grid; grid-template-columns: 1.5fr 1fr; gap: 16px; }
    .cl-mock-card {
      background: var(--surface); border: 1px solid var(--glass-border);
      border-radius: 16px; padding: 24px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.02);
    }
    .cl-mock-card-ttl { font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 16px; }
    .cl-mock-proj-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid var(--border-2); }
    .cl-mock-proj-row:last-child { border-bottom: none; }
    .cl-mock-proj-l { display: flex; align-items: center; gap: 12px; }
    .cl-mock-proj-ico { width: 36px; height: 36px; background: var(--bg); border-radius: 10px; display: flex; align-items: center; justify-content: center; }

    /* ── BENTO GRID FEATURES ────────────────────────── */
    .cl-feats { padding: 140px 24px; }
    .cl-feats-inner { max-width: 1200px; margin: 0 auto; }
    .cl-section-h2 {
      font-size: clamp(36px, 4vw, 48px);
      font-weight: 700; line-height: 1.1;
      letter-spacing: -0.03em; color: var(--ink);
    }
    .cl-feats-hdr { text-align: center; margin-bottom: 64px; }
    .cl-feats-hdr p { font-size: 18px; color: var(--ink-2); max-width: 600px; margin: 16px auto 0; }
    
    .cl-feats-grid {
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 24px;
    }
    .cl-feat {
      background: var(--surface);
      border: 1px solid var(--glass-border);
      border-radius: var(--r-2xl);
      padding: 40px;
      display: flex; flex-direction: column;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: 0 4px 24px rgba(0,0,0,0.02);
      position: relative; overflow: hidden;
    }
    .cl-feat:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 40px rgba(0,0,0,0.06);
    }
    .cl-feat-ico {
      width: 48px; height: 48px;
      background: var(--bg);
      border-radius: 16px;
      display: flex; align-items: center; justify-content: center;
      color: var(--ink); margin-bottom: 24px;
      transition: all 0.3s ease;
    }
    .cl-feat:hover .cl-feat-ico { background: var(--blue); color: white; }
    
    .cl-feat-title { font-size: 20px; font-weight: 600; color: var(--ink); margin-bottom: 12px; }
    .cl-feat-desc { font-size: 15px; color: var(--ink-2); line-height: 1.5; }

    /* ── ROLES (BENTO) ───────────────────────────── */
    .cl-roles { padding: 80px 24px 140px; }
    .cl-roles-inner { max-width: 1200px; margin: 0 auto; }
    .cl-roles-hdr { margin-bottom: 64px; text-align: center; }
    
    .cl-roles-grid { 
      display: grid; 
      grid-template-columns: repeat(2, 1fr); 
      gap: 24px;
    }
    
    .cl-role-card {
      background: rgba(255, 255, 255, 0.5);
      backdrop-filter: blur(20px);
      border: 1px solid var(--glass-border);
      border-radius: var(--r-2xl);
      padding: 48px;
      display: flex; align-items: flex-start; gap: 24px;
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      cursor: pointer;
    }
    .cl-role-card:hover {
      background: var(--surface);
      transform: scale(1.01);
      box-shadow: 0 24px 48px rgba(0,0,0,0.04);
    }
    .cl-role-ico {
      width: 64px; height: 64px;
      background: var(--bg); border-radius: 20px;
      display: flex; align-items: center; justify-content: center;
      color: var(--ink); flex-shrink: 0;
    }
    .cl-role-card:hover .cl-role-ico { background: var(--blue-bg); color: var(--blue); }
    .cl-role-name { font-size: 24px; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
    .cl-role-desc { font-size: 16px; color: var(--ink-2); line-height: 1.5; }

    /* ── MINIMAL FOOTER ──────────────────────────── */
    .cl-footer {
      background: var(--surface);
      border-top: 1px solid var(--border-2);
      padding: 80px 24px 40px;
    }
    .cl-footer-inner { max-width: 1200px; margin: 0 auto; display: grid; grid-template-columns: 1fr 2fr; gap: 64px; }
    .cl-footer-brand-h { display: flex; align-items: center; gap: 12px; text-decoration: none; color: var(--ink); font-weight: 600; font-size: 20px; margin-bottom: 20px; }
    .cl-footer-mission { font-size: 15px; color: var(--ink-2); line-height: 1.6; max-width: 300px; }
    
    .cl-footer-grid-links { display: grid; grid-template-columns: repeat(3, 1fr); gap: 40px; }
    .cl-footer-col-title { font-size: 14px; font-weight: 600; color: var(--ink); margin-bottom: 24px; }
    .cl-footer-links { list-style: none; display: flex; flex-direction: column; gap: 16px; }
    .cl-footer-links li a { font-size: 14px; color: var(--ink-2); text-decoration: none; transition: color 0.2s; }
    .cl-footer-links li a:hover { color: var(--ink); }

    .cl-footer-bot {
      max-width: 1200px; margin: 64px auto 0; padding-top: 32px;
      border-top: 1px solid var(--border-2);
      display: flex; justify-content: space-between; align-items: center;
      font-size: 13px; color: var(--ink-3);
    }

    /* ── RESPONSIVE ──────────────────────── */
    @media (max-width: 1024px) {
      .cl-feats-grid { grid-template-columns: repeat(2, 1fr); }
      .cl-footer-inner { grid-template-columns: 1fr; }
    }
    @media (max-width: 768px) {
      .cl-hero-h1 { font-size: 40px; }
      .cl-mockup-body { height: 360px; }
      .cl-mock-sidebar { display: none; }
      .cl-roles-grid { grid-template-columns: 1fr; }
      .cl-role-card { flex-direction: column; align-items: center; text-align: center; padding: 32px; }
      .cl-footer-grid-links { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 560px) {
      .cl-feats-grid { grid-template-columns: 1fr; }
      .cl-footer-grid-links { grid-template-columns: 1fr; }
      .cl-footer-bot { flex-direction: column; gap: 16px; text-align: center; }
      .cl-nav-mid, .cl-nav-ghost { display: none; }
    }
  `;

  const HexLogo = () => (
    <svg viewBox="0 0 34 34" className="cl-logo-hex" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 2 L31 9.5 L31 25.5 L17 33 L3 25.5 L3 9.5 Z" fill="#0066CC"/>
      <path d="M17 8 L25.5 12.8 L25.5 22.2 L17 27 L8.5 22.2 L8.5 12.8 Z" fill="white" fillOpacity="0.3"/>
      <circle cx="17" cy="17.5" r="3.5" fill="white" fillOpacity="0.9"/>
    </svg>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="cl">
        
        {/* NAV */}
        <header className={`cl-nav${navScrolled ? " cl-nav--scrolled" : ""}`}>
          <div className="cl-nav-inner">
            <a href="#" className="cl-logo">
              <HexLogo />
              <span className="cl-logo-name">DecentraliTrack</span>
            </a>
            <nav className="cl-nav-mid">
              <a href="#features" className="cl-nav-link">Features</a>
              <a href="#roles" className="cl-nav-link">Roles</a>
            </nav>
            <div className="cl-nav-right">
              <button className="cl-nav-ghost" onClick={() => setLocation("/citizen")}>Public ledger</button>
              <button className="cl-btn-nav" onClick={() => setLocation("/login")}>
                Connect Wallet
              </button>
            </div>
          </div>
        </header>

        {/* HERO */}
        <section className="cl-hero">
          <div className="cl-hero-bg">
            <div className="cl-hero-orb-a" />
            <div className="cl-hero-orb-b" />
          </div>

          <div className="cl-hero-content">
            <div className="cl-hero-badge">
              <span className="cl-badge-dot-wrap">
                <span className="cl-badge-dot" />
              </span>
              Live on Mainnet
            </div>

            <h1 className="cl-hero-h1">
              <span className="cl-h1-serif">Public funds.</span>
              <span className="cl-h1-sans">Cryptographic proof.</span>
            </h1>

            <p className="cl-hero-sub">
              A precision cockpit for infrastructure spending. Track every escrow,
              verify every milestone, and ensure accountability with immutable on-chain evidence.
            </p>

            <div className="cl-hero-actions">
              <button className="cl-btn-prim" onClick={() => setLocation("/login")}>Connect Wallet</button>
              <button className="cl-btn-sec" onClick={() => setLocation("/citizen")}>Explore Projects</button>
            </div>
          </div>

          {/* MOCKUP */}
          <div className="cl-mockup-wrap">
            <div className="cl-mockup">
              <div className="cl-mockup-chrome">
                <div className="cl-chrome-btn" style={{ background: "#FC5F57" }} />
                <div className="cl-chrome-btn" style={{ background: "#FEBC2E" }} />
                <div className="cl-chrome-btn" style={{ background: "#28C840" }} />
                <div className="cl-chrome-url">
                  <Lock size={10} />
                  <span>app.decentralitrack.in</span>
                </div>
              </div>
              <div className="cl-mockup-body">
                <div className="cl-mock-sidebar">
                  {["Overview", "Projects", "Milestones", "Audit Trail"].map((item, i) => (
                    <div key={item} className={`cl-mock-sb-item${i === 0 ? " on" : ""}`}>
                      {item}
                    </div>
                  ))}
                </div>
                <div className="cl-mock-main">
                  <div className="cl-mock-stats-row">
                    {[
                      { l: "Total Managed", v: "₹45.2M" },
                      { l: "Funds Released", v: "₹12.8M" },
                      { l: "Active Projects", v: "24" },
                      { l: "Pending", v: "7" },
                    ].map((s) => (
                      <div key={s.l} className="cl-mock-stat">
                        <div className="cl-mock-stat-l">{s.l}</div>
                        <div className="cl-mock-stat-v">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="cl-mock-2col">
                    <div className="cl-mock-card">
                      <div className="cl-mock-card-ttl">Active Projects</div>
                      {["Highway Extension", "Metro Bridge", "Water Plant"].map((p, i) => (
                        <div key={p} className="cl-mock-proj-row">
                          <div className="cl-mock-proj-l">
                            <div className="cl-mock-proj-ico"><HardHat size={16} /></div>
                            <div>
                              <div style={{fontSize: '13px', fontWeight: 600}}>{p}</div>
                              <div style={{fontSize: '11px', color: 'var(--ink-3)'}}>Mumbai, IN</div>
                            </div>
                          </div>
                          <div style={{fontWeight: 600, fontSize: '13px'}}>₹{(i + 1) * 2.5}M</div>
                        </div>
                      ))}
                    </div>
                    <div className="cl-mock-card">
                      <div className="cl-mock-card-ttl">System Status</div>
                      <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                         <div style={{fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}><div style={{width: 8, height: 8, borderRadius: '50%', background: 'var(--green)'}}/> Escrow Contracts</div>
                         <div style={{fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}><div style={{width: 8, height: 8, borderRadius: '50%', background: 'var(--green)'}}/> IPFS Pinning</div>
                         <div style={{fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px'}}><div style={{width: 8, height: 8, borderRadius: '50%', background: 'var(--green)'}}/> AI Engine</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES (BENTO GRID) */}
        <section id="features" className="cl-feats">
          <div className="cl-feats-inner">
            <div className="cl-feats-hdr">
              <h2 className="cl-section-h2">Engineered for transparency.</h2>
              <p>Every feature is designed to make corruption mathematically impossible and accountability automatic.</p>
            </div>
            <div className="cl-feats-grid">
              {[
                {
                  icon: <ShieldCheck size={22} />,
                  title: "Smart Contracts",
                  desc: "Funds locked in audited Solidity contracts. Code is law, eliminating discretionary releases.",
                },
                {
                  icon: <Layers size={22} />,
                  title: "IPFS Pinning",
                  desc: "All milestone proofs and invoices are content-addressed and permanently stored.",
                },
                {
                  icon: <GitMerge size={22} />,
                  title: "Multi-Sig Auth",
                  desc: "Fund release requires signatures from multiple keys, removing single points of failure.",
                },
                {
                  icon: <Globe size={22} />,
                  title: "Public Explorer",
                  desc: "Citizens verify any transaction, milestone, or fund movement directly without login.",
                },
                {
                  icon: <Zap size={22} />,
                  title: "AI Detection",
                  desc: "Machine learning flags suspicious billing patterns and duplicate claims in real-time.",
                },
                {
                  icon: <BadgeCheck size={22} />,
                  title: "Access Control",
                  desc: "Wallet-authenticated roles ensure actors only perform actions their mandate allows.",
                },
              ].map((f) => (
                <div key={f.title} className="cl-feat">
                  <div className="cl-feat-ico">{f.icon}</div>
                  <div className="cl-feat-title">{f.title}</div>
                  <div className="cl-feat-desc">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ROLES (BENTO GRID) */}
        <section id="roles" className="cl-roles">
          <div className="cl-roles-inner">
            <div className="cl-roles-hdr">
              <h2 className="cl-section-h2">Role-Based Access</h2>
            </div>
            <div className="cl-roles-grid">
              {[
                {
                  name: "Citizen",
                  icon: <Users size={28} />,
                  desc: "Monitor spending and track infrastructure progress in real-time on the public ledger.",
                },
                {
                  name: "Government Official",
                  icon: <LayoutDashboard size={28} />,
                  desc: "Create projects, define exact budgets, and oversee all contractor activity.",
                },
                {
                  name: "Contractor",
                  icon: <HardHat size={28} />,
                  desc: "Submit unalterable photo proofs and claim milestone payments upon completion.",
                },
                {
                  name: "Auditor",
                  icon: <FileCheck size={28} />,
                  desc: "Verify cryptographic proofs and authorize automatic fund releases via multi-sig.",
                },
              ].map((r) => (
                <div key={r.name} className="cl-role-card" onClick={() => setLocation("/login")}>
                  <div className="cl-role-ico">{r.icon}</div>
                  <div>
                    <div className="cl-role-name">{r.name}</div>
                    <div className="cl-role-desc">{r.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* MINIMAL FOOTER */}
        <footer className="cl-footer">
          <div className="cl-footer-inner">
            <div>
              <a href="#" className="cl-footer-brand-h">
                <HexLogo />
                <span>DecentraliTrack</span>
              </a>
              <p className="cl-footer-mission">
                Empowering citizens with blockchain-verified infrastructure tracking.
              </p>
            </div>
            
            <div className="cl-footer-grid-links">
              <div>
                <div className="cl-footer-col-title">Governance</div>
                <ul className="cl-footer-links">
                  <li><a href="#">Smart Contracts</a></li>
                  <li><a href="#">Multi-sig Policy</a></li>
                  <li><a href="#">Auditors</a></li>
                </ul>
              </div>
              <div>
                <div className="cl-footer-col-title">Transparency</div>
                <ul className="cl-footer-links">
                  <li><a href="#">Public Ledger</a></li>
                  <li><a href="#">Fund Flow</a></li>
                  <li><a href="#">Audit Trail</a></li>
                </ul>
              </div>
              <div>
                <div className="cl-footer-col-title">Connect</div>
                <ul className="cl-footer-links">
                  <li><a href="#">Twitter</a></li>
                  <li><a href="#">GitHub</a></li>
                  <li><a href="#">Support</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="cl-footer-bot">
            <div>© {new Date().getFullYear()} DecentraliTrack</div>
            <div style={{display: 'flex', gap: '24px'}}>
              <a href="#" style={{color: 'inherit', textDecoration: 'none'}}>Privacy</a>
              <a href="#" style={{color: 'inherit', textDecoration: 'none'}}>Terms</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}