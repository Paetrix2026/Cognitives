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
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,800;1,9..144,200;1,9..144,400;1,9..144,700;1,9..144,800&family=Outfit:wght@300;400;500;600;700;800&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    .cl {
      --blue: #1649FF;
      --blue-bg: #EEF2FF;
      --blue-mid: rgba(22,73,255,0.1);
      --teal: #00A896;
      --teal-bg: #E2F5F2;
      --gold: #CF9207;
      --gold-bg: #FEF3D7;
      --green: #12A368;
      --green-bg: #E2F5EC;
      --ink: #0C0F1D;
      --ink-2: #474C6B;
      --ink-3: #8C93B3;
      --bg: #F5F4F1;
      --surface: #FFFFFF;
      --border: rgba(12,15,29,0.07);
      --border-2: rgba(12,15,29,0.12);
      --r-sm: 8px;
      --r-md: 12px;
      --r-lg: 18px;
      --r-xl: 24px;
      --r-2xl: 32px;
      --r-full: 9999px;
      font-family: 'Outfit', system-ui, sans-serif;
      background: var(--bg);
      color: var(--ink);
      min-height: 100vh;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }

    /* ── NAV ─────────────────────────────── */
    .cl-nav {
      position: fixed; top: 0; left: 0; right: 0;
      z-index: 100; padding: 0 24px;
      transition: padding 0.35s ease;
    }
    .cl-nav-inner {
      max-width: 1200px; margin: 0 auto;
      height: 68px; display: flex;
      align-items: center; justify-content: space-between;
      padding: 0 0; transition: all 0.35s ease;
    }
    .cl-nav--scrolled .cl-nav-inner {
      background: rgba(245,244,241,0.88);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: var(--r-2xl);
      border: 1px solid var(--border-2);
      box-shadow: 0 4px 24px rgba(0,0,0,0.07);
      margin: 10px auto; height: 58px;
      padding: 0 20px; max-width: 1160px;
    }
    .cl-logo {
      display: flex; align-items: center;
      gap: 10px; text-decoration: none; color: var(--ink);
    }
    .cl-logo-hex { width: 32px; height: 32px; }
    .cl-logo-name {
      font-size: 16px; font-weight: 700;
      letter-spacing: -0.4px;
    }
    .cl-nav-mid {
      display: flex; align-items: center; gap: 32px;
    }
    .cl-nav-link {
      font-size: 14px; font-weight: 500;
      color: var(--ink-2); text-decoration: none;
      transition: color 0.2s;
    }
    .cl-nav-link:hover { color: var(--ink); }
    .cl-nav-right { display: flex; align-items: center; gap: 10px; }
    .cl-nav-ghost {
      font-family: 'Outfit', sans-serif; font-size: 14px;
      font-weight: 500; color: var(--ink-2);
      background: none; border: none; cursor: pointer;
      transition: color 0.2s;
    }
    .cl-nav-ghost:hover { color: var(--ink); }
    .cl-btn-nav {
      font-family: 'Outfit', sans-serif; font-size: 13px;
      font-weight: 600; background: var(--ink); color: #fff;
      border: none; border-radius: var(--r-full);
      padding: 9px 20px; cursor: pointer;
      display: flex; align-items: center; gap: 6px;
      transition: all 0.25s;
    }
    .cl-btn-nav:hover {
      background: var(--blue);
      box-shadow: 0 4px 16px rgba(22,73,255,0.3);
      transform: translateY(-1px);
    }

    /* ── HERO ────────────────────────────── */
    .cl-hero {
      min-height: 100vh; display: flex;
      flex-direction: column; align-items: center;
      justify-content: center; padding: 120px 24px 0;
      position: relative; overflow: hidden;
    }
    .cl-hero-bg { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
    .cl-hero-hex {
      position: absolute; inset: 0;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='72' height='63'%3E%3Cpath d='M36 1 L71 19 L71 55 L36 73 L1 55 L1 19 Z' fill='none' stroke='%230C0F1D' stroke-width='0.5' stroke-opacity='0.045'/%3E%3C/svg%3E");
      background-size: 72px 63px;
    }
    .cl-hero-orb-a {
      position: absolute; width: 900px; height: 900px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(22,73,255,0.055) 0%, rgba(0,168,150,0.03) 45%, transparent 68%);
      top: -340px; right: -220px;
      animation: orb-drift 14s ease-in-out infinite;
    }
    .cl-hero-orb-b {
      position: absolute; width: 560px; height: 560px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(0,168,150,0.05) 0%, transparent 68%);
      bottom: -80px; left: -140px;
      animation: orb-drift 10s ease-in-out infinite reverse;
    }
    @keyframes orb-drift {
      0%, 100% { transform: translateY(0px) scale(1); }
      50% { transform: translateY(-50px) scale(1.04); }
    }

    .cl-hero-content {
      position: relative; z-index: 1;
      text-align: center; max-width: 840px;
    }
    .cl-hero-badge {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 6px 16px 6px 8px;
      background: var(--surface);
      border: 1px solid var(--border-2);
      border-radius: var(--r-full);
      font-size: 12px; font-weight: 600; color: var(--blue);
      margin-bottom: 36px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
    }
    .cl-badge-dot-wrap {
      background: var(--blue-bg); border-radius: var(--r-full);
      padding: 4px 8px; display: flex; align-items: center; gap: 5px;
    }
    .cl-badge-dot {
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--teal);
      animation: dot-pulse 2.4s ease-in-out infinite;
    }
    @keyframes dot-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.45; transform: scale(0.75); }
    }

    .cl-hero-h1 {
      font-size: clamp(54px, 9vw, 96px);
      line-height: 0.96; letter-spacing: -0.045em;
      color: var(--ink); margin-bottom: 26px;
    }
    .cl-h1-serif {
      font-family: 'Fraunces', serif; font-style: italic;
      font-weight: 200; font-variation-settings: 'opsz' 144;
      display: block; color: var(--ink);
    }
    .cl-h1-sans {
      font-family: 'Outfit', sans-serif;
      font-weight: 800; display: block;
    }
    .cl-h1-grad {
      background: linear-gradient(125deg, var(--blue) 10%, var(--teal) 90%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .cl-hero-sub {
      font-size: 18px; font-weight: 400;
      color: var(--ink-2); line-height: 1.68;
      max-width: 520px; margin: 0 auto 44px;
    }
    .cl-hero-actions {
      display: flex; align-items: center;
      justify-content: center; gap: 12px;
      flex-wrap: wrap; margin-bottom: 44px;
    }
    .cl-btn-prim {
      font-family: 'Outfit', sans-serif; font-size: 15px;
      font-weight: 600; background: var(--blue); color: #fff;
      border: none; border-radius: var(--r-full);
      padding: 14px 28px; cursor: pointer;
      display: flex; align-items: center; gap: 8px;
      transition: all 0.25s;
      box-shadow: 0 6px 24px rgba(22,73,255,0.28);
    }
    .cl-btn-prim:hover {
      background: #0C35E5;
      box-shadow: 0 8px 32px rgba(22,73,255,0.38);
      transform: translateY(-2px);
    }
    .cl-btn-sec {
      font-family: 'Outfit', sans-serif; font-size: 15px;
      font-weight: 600; background: var(--surface);
      color: var(--ink); border: 1px solid var(--border-2);
      border-radius: var(--r-full); padding: 14px 28px;
      cursor: pointer; display: flex; align-items: center; gap: 8px;
      transition: all 0.25s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }
    .cl-btn-sec:hover {
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      transform: translateY(-1px);
      border-color: rgba(22,73,255,0.3);
      color: var(--blue);
    }

    .cl-hero-trust {
      display: flex; align-items: center;
      justify-content: center; gap: 8px;
      flex-wrap: wrap; margin-bottom: 80px;
    }
    .cl-trust-pill {
      display: flex; align-items: center; gap: 6px;
      padding: 5px 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--r-full);
      font-size: 12px; font-weight: 500; color: var(--ink-2);
    }
    .cl-trust-icon { color: var(--teal); }

    /* ── MOCKUP ──────────────────────────── */
    .cl-mockup-wrap {
      position: relative; z-index: 1;
      width: 100%; max-width: 1020px;
    }
    .cl-mockup {
      background: var(--surface);
      border-radius: 20px 20px 0 0;
      border: 1px solid var(--border-2); border-bottom: none;
      box-shadow: 0 -6px 80px rgba(12,15,29,0.12), inset 0 0 0 1px rgba(255,255,255,0.5);
      overflow: hidden;
    }
    .cl-mockup-chrome {
      height: 44px; background: #F0EFEC;
      border-bottom: 1px solid var(--border);
      display: flex; align-items: center; padding: 0 16px; gap: 8px;
    }
    .cl-chrome-btn { width: 12px; height: 12px; border-radius: 50%; }
    .cl-chrome-url {
      flex: 1; max-width: 300px; margin: 0 auto;
      background: #E4E3E0; border-radius: 7px;
      height: 26px; display: flex; align-items: center;
      padding: 0 10px; gap: 5px;
    }
    .cl-chrome-url span {
      font-family: 'Outfit', monospace;
      font-size: 11px; color: #6B7280;
    }
    .cl-mockup-body { display: flex; height: 400px; }
    .cl-mock-sidebar {
      width: 200px; background: #FAFAF8;
      border-right: 1px solid var(--border);
      padding: 16px 0; flex-shrink: 0;
    }
    .cl-mock-sb-logo {
      padding: 0 16px 14px; font-size: 13px;
      font-weight: 700; display: flex; align-items: center;
      gap: 7px; border-bottom: 1px solid var(--border); margin-bottom: 10px;
    }
    .cl-mock-sb-hex {
      width: 22px; height: 22px;
      background: var(--blue); border-radius: 6px;
      display: flex; align-items: center; justify-content: center;
    }
    .cl-mock-sb-item {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px; font-size: 12px; color: var(--ink-2);
    }
    .cl-mock-sb-item.on {
      color: var(--blue); background: var(--blue-bg);
      font-weight: 600; border-right: 2px solid var(--blue);
    }
    .cl-mock-sb-dot {
      width: 14px; height: 14px; background: currentColor;
      border-radius: 3px; opacity: 0.4; flex-shrink: 0;
    }
    .cl-mock-main { flex: 1; padding: 20px; overflow: hidden; }
    .cl-mock-hdr {
      display: flex; align-items: center;
      justify-content: space-between; margin-bottom: 16px;
    }
    .cl-mock-ttl { font-size: 13px; font-weight: 700; }
    .cl-mock-sub { font-size: 11px; color: var(--ink-3); }
    .cl-mock-stats-row {
      display: grid; grid-template-columns: repeat(4,1fr);
      gap: 10px; margin-bottom: 14px;
    }
    .cl-mock-stat {
      background: var(--bg); border: 1px solid var(--border);
      border-radius: 10px; padding: 12px;
    }
    .cl-mock-stat-l { font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--ink-3); font-weight: 600; margin-bottom: 4px; }
    .cl-mock-stat-v { font-size: 18px; font-weight: 800; color: var(--ink); letter-spacing: -0.5px; }
    .cl-mock-stat-c { font-size: 9px; font-weight: 600; color: #12A368; margin-top: 2px; }
    .cl-mock-2col { display: grid; grid-template-columns: 1.3fr 0.7fr; gap: 10px; }
    .cl-mock-card {
      background: var(--bg); border: 1px solid var(--border);
      border-radius: 10px; padding: 14px;
    }
    .cl-mock-card-ttl { font-size: 11px; font-weight: 700; color: var(--ink); margin-bottom: 10px; }
    .cl-mock-proj-row {
      display: flex; align-items: center; justify-content: space-between;
      padding: 6px 0; border-bottom: 1px solid #F1F0ED;
    }
    .cl-mock-proj-row:last-child { border-bottom: none; }
    .cl-mock-proj-l { display: flex; align-items: center; gap: 7px; }
    .cl-mock-proj-ico {
      width: 24px; height: 24px; background: var(--blue-bg);
      border-radius: 6px; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0;
    }
    .cl-mock-proj-n { font-size: 10px; font-weight: 600; color: var(--ink); }
    .cl-mock-proj-s { font-size: 9px; color: var(--ink-3); }
    .cl-mock-proj-v { font-size: 10px; font-weight: 700; color: var(--ink); text-align: right; }
    .cl-mock-badge-pill {
      font-size: 8px; font-weight: 700; color: var(--blue);
      background: var(--blue-bg); padding: 2px 6px; border-radius: 4px;
      display: inline-block; margin-top: 1px;
    }
    .cl-mock-status-row { display: flex; align-items: center; gap: 6px; padding: 5px 0; font-size: 10px; color: var(--ink-2); }
    .cl-mock-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .cl-mock-bar-wrap { margin-top: 14px; }
    .cl-mock-bar-lbl { display: flex; justify-content: space-between; font-size: 9px; color: var(--ink-3); margin-bottom: 5px; }
    .cl-mock-bar-track { height: 5px; background: #ECEAE6; border-radius: 99px; overflow: hidden; }
    .cl-mock-bar-fill { height: 100%; background: linear-gradient(90deg, var(--blue), var(--teal)); border-radius: 99px; }

    /* ── TICKER ──────────────────────────── */
    .cl-ticker {
      background: var(--ink); overflow: hidden; padding: 15px 0;
      position: relative;
    }
    .cl-ticker::before, .cl-ticker::after {
      content: ''; position: absolute; top: 0; bottom: 0;
      width: 100px; z-index: 2;
    }
    .cl-ticker::before { left: 0; background: linear-gradient(90deg, var(--ink), transparent); }
    .cl-ticker::after { right: 0; background: linear-gradient(-90deg, var(--ink), transparent); }
    .cl-ticker-track {
      display: flex; animation: ticker-scroll 28s linear infinite;
      width: max-content;
    }
    @keyframes ticker-scroll {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }
    .cl-ticker-item { display: flex; align-items: center; gap: 12px; padding: 0 28px; white-space: nowrap; }
    .cl-ticker-num {
      font-family: 'Fraunces', serif; font-style: italic;
      font-size: 17px; font-weight: 700; color: #FFFFFF;
    }
    .cl-ticker-lbl { font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.45); }
    .cl-ticker-sep { width: 4px; height: 4px; border-radius: 50%; background: rgba(255,255,255,0.18); flex-shrink: 0; }

    /* ── SECTION UTILITIES ───────────────── */
    .cl-eyebrow {
      display: inline-flex; align-items: center; gap: 10px;
      font-size: 11px; font-weight: 700;
      letter-spacing: 0.1em; text-transform: uppercase;
      color: var(--blue); margin-bottom: 20px;
    }
    .cl-eyebrow::before {
      content: ''; display: block; width: 22px; height: 2px;
      background: var(--blue); border-radius: 1px;
    }
    .cl-section-h2 {
      font-family: 'Fraunces', serif;
      font-size: clamp(32px, 4.2vw, 54px);
      font-weight: 700; line-height: 1.12;
      letter-spacing: -0.03em; color: var(--ink);
    }

    /* ── PITCH ───────────────────────────── */
    .cl-pitch { padding: 100px 24px; }
    .cl-pitch-inner { max-width: 1120px; margin: 0 auto; }
    .cl-pitch-grid {
      display: grid; grid-template-columns: 1.1fr 1fr;
      gap: 80px; align-items: start;
    }
    .cl-pitch-left h2 { margin-bottom: 20px; }
    .cl-pitch-left p {
      font-size: 16px; color: var(--ink-2);
      line-height: 1.72; margin-bottom: 36px;
    }
    .cl-pitch-kpi-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 1px; background: var(--border);
      border: 1px solid var(--border); border-radius: var(--r-xl);
      overflow: hidden;
    }
    .cl-pitch-kpi { background: var(--surface); padding: 26px; }
    .cl-pitch-kpi-num {
      font-family: 'Outfit', sans-serif;
      font-size: 38px; font-weight: 800;
      color: var(--ink); letter-spacing: -2px; margin-bottom: 5px;
    }
    .cl-pitch-kpi-num em { color: var(--blue); font-style: normal; }
    .cl-pitch-kpi-lbl { font-size: 13px; color: var(--ink-2); font-weight: 500; }

    .cl-pitch-right { display: flex; flex-direction: column; gap: 28px; }
    .cl-pitch-point { display: flex; gap: 18px; align-items: flex-start; }
    .cl-pitch-ico {
      width: 44px; height: 44px; border-radius: var(--r-md);
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    .cl-pitch-pt-title { font-size: 15px; font-weight: 700; color: var(--ink); margin-bottom: 6px; }
    .cl-pitch-pt-desc { font-size: 14px; color: var(--ink-2); line-height: 1.62; }

    /* ── HOW IT WORKS ────────────────────── */
    .cl-hiw {
      padding: 100px 24px;
      background: var(--surface);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
    }
    .cl-hiw-inner { max-width: 1120px; margin: 0 auto; }
    .cl-hiw-hdr { text-align: center; margin-bottom: 72px; }
    .cl-hiw-hdr h2 { margin-bottom: 16px; }
    .cl-hiw-hdr p {
      font-size: 17px; color: var(--ink-2);
      max-width: 520px; margin: 0 auto; line-height: 1.68;
    }
    .cl-hiw-steps {
      display: grid; grid-template-columns: repeat(3,1fr);
      gap: 20px; position: relative;
    }
    .cl-hiw-steps::after {
      content: ''; position: absolute;
      top: 52px;
      left: calc(16.66% + 26px); right: calc(16.66% + 26px);
      height: 1px;
      background: linear-gradient(90deg, transparent, var(--blue), var(--teal), var(--blue), transparent);
      opacity: 0.25;
    }
    .cl-step {
      background: var(--bg); border: 1px solid var(--border);
      border-radius: var(--r-2xl); padding: 32px;
      transition: all 0.28s;
    }
    .cl-step:hover {
      background: var(--surface);
      box-shadow: 0 14px 48px rgba(12,15,29,0.08);
      transform: translateY(-5px);
      border-color: rgba(22,73,255,0.18);
    }
    .cl-step-num {
      width: 56px; height: 56px;
      background: var(--ink); color: #fff;
      border-radius: var(--r-lg);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Fraunces', serif; font-style: italic;
      font-size: 26px; font-weight: 700;
      margin-bottom: 26px; position: relative; z-index: 1;
      box-shadow: 0 8px 24px rgba(12,15,29,0.28);
    }
    .cl-step-title { font-size: 17px; font-weight: 700; color: var(--ink); margin-bottom: 10px; line-height: 1.35; }
    .cl-step-desc { font-size: 14px; color: var(--ink-2); line-height: 1.65; }

    /* ── FEATURES ────────────────────────── */
    .cl-feats { padding: 100px 24px; }
    .cl-feats-inner { max-width: 1120px; margin: 0 auto; }
    .cl-feats-hdr {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 48px; align-items: end; margin-bottom: 52px;
    }
    .cl-feats-hdr p {
      font-size: 16px; color: var(--ink-2);
      line-height: 1.68; padding-bottom: 4px;
    }
    .cl-feats-grid {
      display: grid; 
      grid-template-columns: repeat(3, 1fr); 
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: 20px;
      overflow: hidden;
    }
    .cl-feat {
      background: #fff; 
      padding: 48px 32px;
      display: flex; 
      flex-direction: column;
      transition: all 0.3s ease;
      position: relative;
    }
    .cl-feat:hover {
      background: #fafafa;
    }
    .cl-feat-ico {
      color: var(--ink);
      margin-bottom: 40px;
      transition: all 0.3s ease;
    }
    .cl-feat:hover .cl-feat-ico {
      transform: translateY(-4px);
      color: var(--blue);
    }
    .cl-feat-title { 
      font-size: 15px; 
      font-weight: 700; 
      color: var(--ink); 
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .cl-feat-desc { font-size: 14px; color: var(--ink-2); line-height: 1.6; margin-bottom: 0; }

    .cl-feat::after {
      content: '→';
      position: absolute;
      bottom: 32px;
      right: 32px;
      font-size: 18px;
      color: var(--ink-3);
      opacity: 0;
      transition: all 0.2s ease;
      transform: translateX(-10px);
    }
    
    .cl-feat:hover::after {
      opacity: 1;
      transform: translateX(0);
      color: var(--blue);
    }

    /* ── ROLES ───────────────────────────── */
    .cl-roles {
      padding: 120px 24px 60px;
      background: #fff;
      border-top: 1px solid var(--border);
    }
    .cl-roles-inner { max-width: 1120px; margin: 0 auto; }
    .cl-roles-hdr { margin-bottom: 64px; }
    .cl-roles-hdr h2 { 
      font-family: 'Outfit', sans-serif;
      font-size: 38px;
      font-weight: 700;
      letter-spacing: -0.03em;
      margin-bottom: 12px; 
    }
    .cl-roles-hdr p { font-size: 16px; color: var(--ink-2); max-width: 480px; line-height: 1.5; }
    
    .cl-roles-grid { 
      display: grid; 
      grid-template-columns: repeat(4, 1fr); 
      gap: 1px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: 20px;
      overflow: hidden;
    }
    
    .cl-role-card {
      background: #fff; 
      padding: 48px 32px;
      display: flex; 
      flex-direction: column;
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
    }
    
    .cl-role-card:hover {
      background: #fafafa;
    }

    .cl-role-ico {
      color: var(--ink);
      margin-bottom: 40px;
      transition: transform 0.3s ease;
    }
    
    .cl-role-card:hover .cl-role-ico {
      transform: translateY(-4px);
      color: var(--blue);
    }

    .cl-role-name { 
      font-size: 15px; 
      font-weight: 700; 
      color: var(--ink); 
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .cl-role-desc { 
      font-size: 14px; 
      color: var(--ink-2); 
      line-height: 1.6; 
      margin-bottom: 0;
    }

    .cl-role-btn { display: none; } /* Removed for minimalism */

    .cl-role-card::after {
      content: '→';
      position: absolute;
      bottom: 32px;
      right: 32px;
      font-size: 18px;
      color: var(--ink-3);
      opacity: 0;
      transition: all 0.2s ease;
      transform: translateX(-10px);
    }
    
    .cl-role-card:hover::after {
      opacity: 1;
      transform: translateX(0);
      color: var(--blue);
    }

    /* ── REDESIGNED FOOTER: CIVIC MODERNISM ──────────────────────────── */
    .cl-footer {
      background: #F8F9FC;
      border-top: 1px solid var(--border);
      padding: 0;
      font-family: 'Outfit', sans-serif;
    }
    .cl-footer-top {
      background: var(--ink);
      color: white;
      padding: 24px 24px;
    }
    .cl-footer-top-inner {
      max-width: 1200px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 20px;
    }
    .cl-status-pill {
      display: flex; align-items: center; gap: 10px;
      background: rgba(255,255,255,0.06);
      padding: 8px 16px; border-radius: 99px;
      font-size: 13px; font-weight: 500; border: 1px solid rgba(255,255,255,0.1);
    }
    .cl-status-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #10B981;
      box-shadow: 0 0 10px #10B981;
    }
    .cl-footer-main {
      padding: 80px 24px 60px;
    }
    .cl-footer-inner { max-width: 1200px; margin: 0 auto; }
    .cl-footer-grid {
      display: grid; grid-template-columns: 1.2fr 0.8fr 0.8fr 1fr;
      gap: 60px;
    }
    .cl-footer-brand-h {
      display: flex; align-items: center; gap: 12px; margin-bottom: 24px;
      text-decoration: none; color: var(--ink); font-weight: 700; font-size: 20px;
    }
    .cl-footer-mission {
      font-size: 15px; color: var(--ink-2); line-height: 1.7;
      margin-bottom: 32px; max-width: 320px;
    }
    .cl-footer-socials { display: flex; gap: 10px; }
    .cl-footer-social-link {
      width: 40px; height: 40px; border-radius: 50%;
      background: white; border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      color: var(--ink-2); transition: all 0.25s;
    }
    .cl-footer-social-link:hover {
      background: var(--blue); color: white; border-color: var(--blue);
      transform: translateY(-2px);
    }
    .cl-footer-col-title {
      font-size: 13px; font-weight: 700; color: var(--ink);
      text-transform: uppercase; letter-spacing: 0.1em;
      margin-bottom: 28px; display: flex; align-items: center; gap: 8px;
    }
    .cl-footer-links { list-style: none; display: flex; flex-direction: column; gap: 14px; }
    .cl-footer-links li a {
      font-size: 14px; color: var(--ink-2);
      text-decoration: none; transition: all 0.2s;
      display: flex; align-items: center; gap: 4px;
    }
    .cl-footer-links li a:hover { color: var(--blue); padding-left: 2px; }
    
    .cl-support-card {
      background: white; border: 1px solid var(--border);
      padding: 24px; border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
    .cl-support-title { font-size: 15px; font-weight: 600; color: var(--ink); margin-bottom: 6px; }
    .cl-support-desc { font-size: 13px; color: var(--ink-3); margin-bottom: 18px; }
    .cl-support-btn {
      width: 100%; padding: 10px; border-radius: 8px;
      background: var(--blue-bg); color: var(--blue);
      border: 1px solid rgba(22,73,255,0.1); font-weight: 600; font-size: 13px;
      cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; gap: 8px;
    }
    .cl-support-btn:hover { background: var(--blue); color: white; }

    .cl-footer-bot {
      border-top: 1px solid var(--border); padding: 32px 24px;
      max-width: 1200px; margin: 0 auto;
      display: flex; align-items: center; justify-content: space-between;
      flex-wrap: wrap; gap: 24px;
    }
    .cl-footer-copy { font-size: 13px; color: var(--ink-3); display: flex; align-items: center; gap: 8px; }
    .cl-footer-legal { display: flex; gap: 32px; }
    .cl-footer-legal a { font-size: 13px; color: var(--ink-3); text-decoration: none; transition: color 0.2s; }
    .cl-footer-legal a:hover { color: var(--ink); }

    /* ── RESPONSIVE ──────────────────────── */
    @media (max-width: 1024px) {
      .cl-pitch-grid { grid-template-columns: 1fr; gap: 52px; }
      .cl-feats-hdr { grid-template-columns: 1fr; gap: 20px; }
      .cl-feats-grid { grid-template-columns: repeat(2,1fr); }
      .cl-roles-grid { grid-template-columns: repeat(2,1fr); }
      .cl-footer-grid { grid-template-columns: 1fr 1fr; gap: 48px; }
    }
    @media (max-width: 768px) {
      .cl-roles { padding: 80px 20px; }
      .cl-roles-inner { max-width: 100%; }
      .cl-roles-hdr { margin-bottom: 48px; }
      .cl-roles-hdr h2 { font-size: 32px; }
      .cl-role-card { padding: 40px 24px; }
      .cl-nav {
        padding: 12px 16px 0;
      }
      .cl-nav-inner {
        height: auto;
        min-height: 64px;
        padding: 14px 16px;
        background: rgba(245,244,241,0.88);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        border: 1px solid var(--border);
        border-radius: 24px;
        box-shadow: 0 10px 34px rgba(12,15,29,0.08);
      }
      .cl-nav--scrolled .cl-nav-inner {
        margin: 0 auto;
        height: auto;
        min-height: 64px;
        max-width: 1200px;
        padding: 14px 16px;
      }
      .cl-logo {
        gap: 8px;
        min-width: 0;
      }
      .cl-logo-hex {
        width: 28px;
        height: 28px;
        flex-shrink: 0;
      }
      .cl-logo-name {
        font-size: 15px;
        line-height: 1;
      }
      .cl-nav-right {
        gap: 0;
      }
      .cl-nav-ghost {
        display: none;
      }
      .cl-btn-nav {
        padding: 11px 16px;
        font-size: 14px;
        gap: 8px;
        flex-shrink: 0;
      }
      .cl-hero {
        min-height: auto;
        padding: 124px 20px 0;
      }
      .cl-hero-content {
        max-width: 100%;
      }
      .cl-hero-badge {
        margin-bottom: 22px;
        padding: 8px 10px;
        gap: 10px;
        justify-content: center;
        flex-wrap: nowrap;
        border-radius: 9999px;
        max-width: fit-content;
        text-align: center;
        margin-left: auto;
        margin-right: auto;
      }
      .cl-hero-h1 {
        font-size: clamp(40px, 13vw, 58px);
        line-height: 0.98;
        margin-bottom: 16px;
      }
      .cl-hero-sub {
        font-size: 15px;
        line-height: 1.55;
        max-width: 31rem;
        margin-bottom: 24px;
      }
      .cl-hero-actions {
        width: 100%;
        gap: 10px;
        margin-bottom: 24px;
      }
      .cl-btn-prim,
      .cl-btn-sec {
        min-width: min(240px, 100%);
        justify-content: center;
      }
      .cl-hero-trust {
        gap: 10px;
        margin-bottom: 32px;
        width: 100%;
        max-width: 420px;
        justify-content: center;
      }
      .cl-trust-pill {
        padding: 8px 14px;
        background: rgba(255,255,255,0.84);
        box-shadow: 0 6px 18px rgba(12,15,29,0.04);
      }
      .cl-hero-orb-a {
        width: 520px;
        height: 520px;
        top: -200px;
        right: -220px;
      }
      .cl-hero-orb-b {
        width: 280px;
        height: 280px;
        left: -120px;
        bottom: 120px;
      }
      .cl-mockup-wrap {
        max-width: 100%;
      }
      .cl-mockup-body {
        height: 340px;
      }
      .cl-hiw-steps { grid-template-columns: 1fr; }
      .cl-hiw-steps::after { display: none; }
      .cl-nav-mid { display: none; }
      .cl-mock-sidebar { display: none; }
      .cl-mock-stats-row { grid-template-columns: repeat(2,1fr); }
    }
    @media (max-width: 560px) {
      .cl-nav {
        padding: 10px 12px 0;
      }
      .cl-nav-inner {
        padding: 12px 14px;
        border-radius: 22px;
      }
      .cl-logo-name {
        font-size: 14px;
      }
      .cl-btn-nav {
        padding: 10px 14px;
        font-size: 13px;
      }
      .cl-hero {
        padding: 116px 16px 0;
      }
      .cl-hero-badge {
        font-size: 11px;
        margin-bottom: 18px;
        padding: 8px 10px;
        gap: 8px;
        max-width: calc(100vw - 32px);
      }
      .cl-badge-dot-wrap {
        width: auto;
        justify-content: center;
        padding: 6px 10px;
        flex-shrink: 0;
      }
      .cl-hero-badge > span:last-child {
        min-width: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .cl-hero-h1 {
        font-size: clamp(34px, 12vw, 46px);
        letter-spacing: -0.04em;
      }
      .cl-hero-sub {
        font-size: 14px;
        line-height: 1.58;
        margin-bottom: 22px;
      }
      .cl-hero-actions {
        flex-direction: column;
        align-items: stretch;
      }
      .cl-btn-prim,
      .cl-btn-sec {
        width: 100%;
        padding: 14px 18px;
      }
      .cl-hero-trust {
        gap: 8px;
        margin-bottom: 28px;
        align-items: flex-start;
        justify-content: center;
      }
      .cl-trust-pill {
        width: auto;
        max-width: 100%;
        justify-content: center;
        font-size: 11px;
        padding: 8px 12px;
        border-radius: 9999px;
        box-shadow: none;
        white-space: nowrap;
      }
      .cl-mockup {
        border-radius: 18px 18px 0 0;
      }
      .cl-mockup-chrome {
        padding: 0 12px;
      }
      .cl-chrome-url {
        max-width: 188px;
      }
      .cl-chrome-url span {
        font-size: 10px;
      }
      .cl-mockup-body {
        height: 300px;
      }
      .cl-mock-main {
        padding: 14px;
      }
      .cl-mock-stats-row {
        gap: 8px;
      }
      .cl-mock-stat {
        padding: 10px;
      }
      .cl-mock-stat-v {
        font-size: 16px;
      }
      .cl-mock-card {
        padding: 12px;
      }
      .cl-feats-grid { grid-template-columns: repeat(2, 1fr); }
      .cl-roles-grid { grid-template-columns: repeat(2, 1fr); }
      .cl-role-card::after { display: none; }
      .cl-feat::after { display: none; }
      .cl-footer-top-inner { flex-direction: column; align-items: flex-start; }
      .cl-footer { padding: 0; }
      .cl-footer-main { padding: 64px 20px 48px; }
      .cl-footer-grid { grid-template-columns: 1fr; gap: 48px; }
      .cl-footer-bot { flex-direction: column; align-items: center; text-align: center; gap: 20px; padding: 40px 20px; }
      .cl-footer-legal { gap: 16px; justify-content: center; flex-wrap: wrap; }
      .cl-mock-2col { grid-template-columns: 1fr; }
      .cl-pitch-kpi-grid { grid-template-columns: 1fr 1fr; }
    }
    @media (max-width: 480px) {
      .cl-roles { padding: 64px 20px; }
      .cl-roles-hdr h2 { font-size: 28px; }
      .cl-roles-grid { grid-template-columns: 1fr; }
      .cl-feats-grid { grid-template-columns: 1fr; }
    }
  `;

  const HexLogo = () => (
    <svg viewBox="0 0 34 34" className="cl-logo-hex" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 2 L31 9.5 L31 25.5 L17 33 L3 25.5 L3 9.5 Z" fill="#1649FF"/>
      <path d="M17 8 L25.5 12.8 L25.5 22.2 L17 27 L8.5 22.2 L8.5 12.8 Z" fill="white" fillOpacity="0.25"/>
      <circle cx="17" cy="17.5" r="3.5" fill="white" fillOpacity="0.9"/>
    </svg>
  );

  const TICKER_ITEMS = [
    { num: "₹2.4B+", lbl: "Infrastructure tracked" },
    { num: "340+", lbl: "Active projects on-chain" },
    { num: "99.9%", lbl: "Network uptime" },
    { num: "12s", lbl: "Avg. verification time" },
    { num: "0", lbl: "Manual fund transfers" },
    { num: "IPFS", lbl: "Decentralized storage" },
    { num: "Multi-sig", lbl: "Escrow releases" },
    { num: "4 Roles", lbl: "Role-based access control" },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="cl">

        {/* ── NAV ── */}
        <header className={`cl-nav${navScrolled ? " cl-nav--scrolled" : ""}`}>
          <div className="cl-nav-inner">
            <a href="#" className="cl-logo">
              <HexLogo />
              <span className="cl-logo-name">DecentraliTrack</span>
            </a>
            <nav className="cl-nav-mid">
              <a href="#how-it-works" className="cl-nav-link">How it works</a>
              <a href="#features" className="cl-nav-link">Features</a>
              <a href="#roles" className="cl-nav-link">Roles</a>
            </nav>
            <div className="cl-nav-right">
              <button className="cl-nav-ghost" onClick={() => setLocation("/citizen")}>Public ledger</button>
              <button className="cl-btn-nav" onClick={() => setLocation("/login")}>
                Connect Wallet <ArrowUpRight size={14} />
              </button>
            </div>
          </div>
        </header>

        {/* ── HERO ── */}
        <section className="cl-hero">
          <div className="cl-hero-bg">
            <div className="cl-hero-hex" />
            <div className="cl-hero-orb-a" />
            <div className="cl-hero-orb-b" />
          </div>

          <div className="cl-hero-content">
            <div className="cl-hero-badge">
              <span className="cl-badge-dot-wrap">
                <span className="cl-badge-dot" />
                Live on Mainnet
              </span>
              Blockchain-Verified Infrastructure Tracking
            </div>

            <h1 className="cl-hero-h1">
              <span className="cl-h1-serif">Public funds.</span>
              <span className="cl-h1-sans">Cryptographic</span>
              <span className="cl-h1-sans cl-h1-grad">proof.</span>
            </h1>

            <p className="cl-hero-sub">
              A precision cockpit for infrastructure spending. Track every escrow,
              verify every milestone, and ensure accountability with immutable on-chain evidence.
            </p>

            <div className="cl-hero-actions">
              <button className="cl-btn-prim" onClick={() => setLocation("/login")}>
                Connect Wallet <ArrowUpRight size={16} />
              </button>
              <button className="cl-btn-sec" onClick={() => setLocation("/citizen")}>
                Explore Projects
              </button>
            </div>

            <div className="cl-hero-trust">
              {[
                "IPFS-pinned proofs",
                "Multi-sig escrow",
                "Open public ledger",
                "AI anomaly detection",
              ].map((t) => (
                <div key={t} className="cl-trust-pill">
                  <CheckCircle2 size={13} className="cl-trust-icon" style={{ color: "var(--teal)" }} />
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard mockup */}
          <div className="cl-mockup-wrap">
            <div className="cl-mockup">
              <div className="cl-mockup-chrome">
                <div className="cl-chrome-btn" style={{ background: "#FC5F57" }} />
                <div className="cl-chrome-btn" style={{ background: "#FEBC2E" }} />
                <div className="cl-chrome-btn" style={{ background: "#28C840" }} />
                <div className="cl-chrome-url">
                  <Lock size={9} color="#9ca3af" />
                  <span>app.decentralitrack.in/official</span>
                </div>
              </div>
              <div className="cl-mockup-body">
                <div className="cl-mock-sidebar">
                  <div className="cl-mock-sb-logo">
                    <div className="cl-mock-sb-hex">
                      <svg viewBox="0 0 12 12" width="10" height="10">
                        <path d="M6 0 L12 3.5 L12 8.5 L6 12 L0 8.5 L0 3.5 Z" fill="white" fillOpacity="0.9"/>
                      </svg>
                    </div>
                    DTrack
                  </div>
                  {["Dashboard", "Projects", "Milestones", "Escrow", "Audit Trail", "Reports"].map((item, i) => (
                    <div key={item} className={`cl-mock-sb-item${i === 0 ? " on" : ""}`}>
                      <div className="cl-mock-sb-dot" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="cl-mock-main">
                  <div className="cl-mock-hdr">
                    <span className="cl-mock-ttl">Overview — FY 2024–25</span>
                    <span className="cl-mock-sub">Updated 2 min ago</span>
                  </div>
                  <div className="cl-mock-stats-row">
                    {[
                      { l: "Total Managed", v: "₹45.2M", c: "+12.4%" },
                      { l: "Funds Released", v: "₹12.8M", c: "+8.1%" },
                      { l: "Active Projects", v: "24", c: "+3" },
                      { l: "Pending Approvals", v: "7", c: "↑2" },
                    ].map((s) => (
                      <div key={s.l} className="cl-mock-stat">
                        <div className="cl-mock-stat-l">{s.l}</div>
                        <div className="cl-mock-stat-v">{s.v}</div>
                        <div className="cl-mock-stat-c">{s.c}</div>
                      </div>
                    ))}
                  </div>
                  <div className="cl-mock-2col">
                    <div className="cl-mock-card">
                      <div className="cl-mock-card-ttl">Active Projects</div>
                      {["Highway Extension Ph.1", "Metro Bridge Repair", "Water Treatment Plant"].map((p, i) => (
                        <div key={p} className="cl-mock-proj-row">
                          <div className="cl-mock-proj-l">
                            <div className="cl-mock-proj-ico">
                              <HardHat size={10} color="#1649FF" />
                            </div>
                            <div>
                              <div className="cl-mock-proj-n">{p}</div>
                              <div className="cl-mock-proj-s">Mumbai, IN</div>
                            </div>
                          </div>
                          <div>
                            <div className="cl-mock-proj-v">₹{(i + 1) * 2.5}M</div>
                            <div className="cl-mock-badge-pill">Active</div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="cl-mock-card">
                      <div className="cl-mock-card-ttl">System Status</div>
                      {[
                        { label: "Escrow Contracts", color: "#12A368" },
                        { label: "IPFS Pinning", color: "#12A368" },
                        { label: "AI Anomaly Engine", color: "#12A368" },
                      ].map((s) => (
                        <div key={s.label} className="cl-mock-status-row">
                          <div className="cl-mock-status-dot" style={{ background: s.color }} />
                          {s.label}
                        </div>
                      ))}
                      <div className="cl-mock-bar-wrap">
                        <div className="cl-mock-bar-lbl">
                          <span>Portfolio Completion</span>
                          <span>68%</span>
                        </div>
                        <div className="cl-mock-bar-track">
                          <div className="cl-mock-bar-fill" style={{ width: "68%" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── TICKER ── */}
        <div className="cl-ticker">
          <div className="cl-ticker-track">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <div key={i} className="cl-ticker-item">
                <span className="cl-ticker-num">{item.num}</span>
                <span className="cl-ticker-lbl">{item.lbl}</span>
                <span className="cl-ticker-sep" />
              </div>
            ))}
          </div>
        </div>

        {/* ── PITCH ── */}
        <section className="cl-pitch">
          <div className="cl-pitch-inner">
            <div className="cl-pitch-grid">
              <div className="cl-pitch-left">
                <div className="cl-eyebrow">The Problem</div>
                <h2 className="cl-section-h2">
                  Infrastructure corruption costs India{" "}
                  <em style={{ fontStyle: "normal", color: "var(--blue)" }}>₹3.5 trillion</em>{" "}
                  annually.
                </h2>
                <p>
                  Misappropriation, ghost contractors, and opaque fund flows plague public
                  works. DecentraliTrack makes corruption mathematically impossible with
                  on-chain escrow and cryptographic proofs.
                </p>
                <div className="cl-pitch-kpi-grid">
                  {[
                    { num: "₹2.4", suf: "B+", lbl: "Funds tracked on-chain" },
                    { num: "340", suf: "+", lbl: "Active projects" },
                    { num: "99.9", suf: "%", lbl: "System uptime" },
                    { num: "0", suf: "", lbl: "Manual transfers allowed" },
                  ].map((s) => (
                    <div key={s.lbl} className="cl-pitch-kpi">
                      <div className="cl-pitch-kpi-num">
                        {s.num}<em>{s.suf}</em>
                      </div>
                      <div className="cl-pitch-kpi-lbl">{s.lbl}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="cl-pitch-right">
                {[
                  {
                    bg: "var(--blue-bg)", color: "var(--blue)",
                    icon: <ShieldCheck size={20} />,
                    title: "Tamper-proof smart contracts",
                    desc: "Funds locked in audited Solidity escrow. No official can release them without cryptographic multi-sig approval from certified auditors.",
                  },
                  {
                    bg: "var(--teal-bg)", color: "var(--teal)",
                    icon: <Globe size={20} />,
                    title: "Radical public transparency",
                    desc: "Every citizen can verify any project, milestone, or fund movement directly on-chain — without creating an account or logging in.",
                  },
                  {
                    bg: "var(--gold-bg)", color: "var(--gold)",
                    icon: <Zap size={20} />,
                    title: "AI-powered anomaly detection",
                    desc: "Machine learning flags suspicious billing patterns, duplicate claims, and statistical outliers before payments are ever processed.",
                  },
                  {
                    bg: "var(--green-bg)", color: "var(--green)",
                    icon: <Layers size={20} />,
                    title: "Immutable audit trail forever",
                    desc: "Every action — submission, approval, rejection — is permanently recorded on-chain with a cryptographic timestamp.",
                  },
                ].map((p) => (
                  <div key={p.title} className="cl-pitch-point">
                    <div className="cl-pitch-ico" style={{ background: p.bg, color: p.color }}>
                      {p.icon}
                    </div>
                    <div>
                      <div className="cl-pitch-pt-title">{p.title}</div>
                      <div className="cl-pitch-pt-desc">{p.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section id="how-it-works" className="cl-hiw">
          <div className="cl-hiw-inner">
            <div className="cl-hiw-hdr">
              <div className="cl-eyebrow">How It Works</div>
              <h2 className="cl-section-h2">
                From budget to completion,<br />every step on-chain.
              </h2>
              <p>
                Three immutable stages powered by smart contracts and cryptographic proof ensure
                every rupee reaches its intended destination.
              </p>
            </div>
            <div className="cl-hiw-steps">
              {[
                {
                  n: "1",
                  title: "Government creates project & locks escrow",
                  desc: "Officials define project scope, milestones, and lock the allocated budget into a tamper-proof smart contract on-chain. Funds are committed — never discretionary.",
                },
                {
                  n: "2",
                  title: "Contractor submits cryptographic milestone proof",
                  desc: "Upon completing a milestone, contractors upload geo-tagged photos and signed documents. Each file is content-addressed and pinned to IPFS — immutable, forever.",
                },
                {
                  n: "3",
                  title: "Auditor verifies on-chain & funds auto-release",
                  desc: "Certified auditors review the proof on-chain. Multi-sig approval triggers automatic disbursement to the contractor wallet. Zero discretion. Zero delay.",
                },
              ].map((s) => (
                <div key={s.n} className="cl-step">
                  <div className="cl-step-num">{s.n}</div>
                  <div className="cl-step-title">{s.title}</div>
                  <div className="cl-step-desc">{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section id="features" className="cl-feats">
          <div className="cl-feats-inner">
            <div className="cl-feats-hdr">
              <div>
                <div className="cl-eyebrow">Features</div>
                <h2 className="cl-section-h2">Built for radical transparency</h2>
              </div>
              <p>Every feature is designed to make corruption mathematically impossible and accountability automatic — with no human discretion in the loop.</p>
            </div>
            <div className="cl-feats-grid">
              {[
                {
                  icon: <ShieldCheck size={28} strokeWidth={1.5} />,
                  title: "Smart Contract Escrow",
                  desc: "Funds locked in audited Solidity contracts. No manual transfers. No discretionary releases. Code is law.",
                },
                {
                  icon: <Layers size={28} strokeWidth={1.5} />,
                  title: "IPFS Document Pinning",
                  desc: "All milestone proofs — photos, invoices, inspection reports — are content-addressed and permanently stored.",
                },
                {
                  icon: <GitMerge size={28} strokeWidth={1.5} />,
                  title: "Multi-Signature Approvals",
                  desc: "Fund release requires signatures from multiple auditor keys, eliminating every single point of compromise.",
                },
                {
                  icon: <Globe size={28} strokeWidth={1.5} />,
                  title: "Public Ledger Explorer",
                  desc: "Citizens verify any transaction, milestone, or fund movement directly on-chain without any login.",
                },
                {
                  icon: <Zap size={28} strokeWidth={1.5} />,
                  title: "AI Anomaly Detection",
                  desc: "ML models flag suspicious billing patterns, duplicate claims, and statistical outliers in real time.",
                },
                {
                  icon: <BadgeCheck size={28} strokeWidth={1.5} />,
                  title: "Role-Based Access Control",
                  desc: "Four wallet-authenticated roles ensure each actor only sees and does exactly what their mandate allows.",
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

        {/* ── ROLES ── */}
        <section id="roles" className="cl-roles">
          <div className="cl-roles-inner">
            <div className="cl-roles-hdr">
              <div className="cl-eyebrow">Framework</div>
              <h2>Role-Based Access Control</h2>
              <p>Explore the platform through the lens of different stakeholders in the infrastructure lifecycle.</p>
            </div>
            
            <div className="cl-roles-grid">
              {[
                {
                  role: "CITIZEN",
                  name: "Citizen",
                  icon: <Users size={28} strokeWidth={1.5} />,
                  desc: "Monitor spending and track infrastructure progress in real-time.",
                },
                {
                  role: "GOVT_OFFICIAL",
                  name: "Official",
                  icon: <LayoutDashboard size={28} strokeWidth={1.5} />,
                  desc: "Create projects, define budgets, and oversee contractor activity.",
                },
                {
                  role: "CONTRACTOR",
                  name: "Contractor",
                  icon: <HardHat size={28} strokeWidth={1.5} />,
                  desc: "Submit photo proofs and claim milestone payments on completion.",
                },
                {
                  role: "AUDITOR",
                  name: "Auditor",
                  icon: <FileCheck size={28} strokeWidth={1.5} />,
                  desc: "Verify proofs and authorize automatic fund releases via multi-sig.",
                },
              ].map((r) => (
                <div 
                  key={r.role} 
                  className="cl-role-card"
                  onClick={() => setLocation("/login")}
                >
                  <div className="cl-role-ico">{r.icon}</div>
                  <div className="cl-role-name">{r.name}</div>
                  <div className="cl-role-desc">{r.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── REDESIGNED FOOTER ── */}
        <footer className="cl-footer">

          <div className="cl-footer-main">
            <div className="cl-footer-inner">
              <div className="cl-footer-grid">
                <div>
                  <a href="#" className="cl-footer-brand-h">
                    <HexLogo />
                    <span>DecentraliTrack</span>
                  </a>
                  <p className="cl-footer-mission">
                    Empowering Indian citizens with blockchain-verified infrastructure tracking. 
                    Building a future of radical public accountability.
                  </p>
                  <div className="cl-footer-socials">
                    <a href="#" className="cl-footer-social-link"><Twitter size={18} /></a>
                    <a href="#" className="cl-footer-social-link"><Github size={18} /></a>
                    <a href="#" className="cl-footer-social-link"><Linkedin size={18} /></a>
                    <a href="#" className="cl-footer-social-link"><Mail size={18} /></a>
                  </div>
                </div>
                
                <div>
                  <div className="cl-footer-col-title"><ShieldCheck size={14} /> Governance</div>
                  <ul className="cl-footer-links">
                    <li><a href="#">Smart Contract Registry</a></li>
                    <li><a href="#">Multi-sig Policy</a></li>
                    <li><a href="#">Auditor Accreditation</a></li>
                    <li><a href="#">Escrow Framework</a></li>
                    <li><a href="#">On-chain Governance</a></li>
                  </ul>
                </div>

                <div>
                  <div className="cl-footer-col-title"><Search size={14} /> Transparency</div>
                  <ul className="cl-footer-links">
                    <li><a href="#">Public Project Ledger</a></li>
                    <li><a href="#">Real-time Fund Flow</a></li>
                    <li><a href="#">Audit Trail Explorer</a></li>
                    <li><a href="#">Milestone Proofs</a></li>
                    <li><a href="#">Network Analytics</a></li>
                  </ul>
                </div>

                <div>
                  <div className="cl-support-card">
                    <div className="cl-support-title">Citizen Support</div>
                    <p className="cl-support-desc">Need help verifying a project or reporting an anomaly?</p>
                    <button className="cl-support-btn" onClick={() => setLocation("/login")}>
                      <HelpCircle size={16} /> Open Help Desk
                    </button>
                    <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--ink-3)', textAlign: 'center' }}>
                      Official Gov-Tech Infrastructure
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="cl-footer-bot">
            <div className="cl-footer-copy">
              <Building2 size={16} />
              <span>© {new Date().getFullYear()} DecentraliTrack. Digital India Initiative.</span>
            </div>
            <div className="cl-footer-legal">
              <a href="#">Accessibility</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Use</a>
              <a href="#">Security Audit</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
