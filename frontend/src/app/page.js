"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import {
  Trophy, Zap, Bot, Wallet, Bell, Settings, TrendingUp, TrendingDown,
  Clock, Users, BarChart3, ChevronRight, Shield, Globe, Star, X,
  Play, Pause, RefreshCw, CheckCircle2, AlertCircle, ArrowUpRight,
  Target, Flame, Layers, Activity, Coins, CircleDot, Search,
  LogOut, Copy, ExternalLink, Info, Lock, Unlock, Timer, Sun, Moon
} from "lucide-react";
import { useWalletContext } from "./layout";
import { ACTIVE_NETWORK, TEAM_FLAGS, CONTRACTS } from "../utils/config";
import { useMatches } from "../hooks/useMatches";
import { useUserBets } from "../hooks/useUserBets";
import { useUSDT } from "../hooks/useUSDT";
import { useBetting } from "../hooks/useBetting";
import { useAgent } from "../hooks/useAgent";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const shortAddr = (a) => a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "";
const fmt = (n, d = 2) => Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtK = (n) => n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : String(n);
function timeUntil(ms) {
  const diff = ms - Date.now();
  if (diff <= 0) return "Live Now";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function formatTimeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "Just now";
  const m = Math.floor(diff / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Team Images ─────────────────────────────────────────────────────────────
const TEAM_IMAGES = {
  "Brazil": "https://lh3.googleusercontent.com/aida-public/AB6AXuC3D85aQkxKvJwXGtD4NNZ5RmPT7iMh73gBXJFz1KuubT3RJC4N0vzcz6HosMUaqOd33oXga8Nesec-S0-i5ZS8nuBmC6U_tqsFmx_MnVci_UFSwK7hwSMU5xTbNiLf-sSN3wHi-TEEmc9cX4mBT8dYP5dxfbkDXW1XCianLm-JCa-5XOuTiODu-xn5xpcQUmfVVfGZEU35ICZDlorGpQBIA5VBu0j3PvvfPptVbhJFg267GREyljdMrhhzCzt8s3H6TlcxNFI",
  "France": "https://lh3.googleusercontent.com/aida-public/AB6AXuBImMX2Q6kugBkzTrPhvBXAA1zFkK-TmqSKgD858rVdjqruAywDqSSZaXeTHKS8o5NsgknhXzO3uzCIdMAjp61z23qP7HkizjiNK9hTM0DOeFkA01SOncEqMPFkYgLRcDX2jvSLl-Uk23BLL7s3zzPSERluwRzWZKYqhVHVVMOA_d8tVBo2_OVPrQrux2Jl_tUjj9B4JJ4Nbu0jslf__BbTR9syZhDYANUKJbMVCet4LEpYJ9MeDtXwlGhcTCAhQ48BfpgQB34",
  "USA": "https://lh3.googleusercontent.com/aida-public/AB6AXuDFV0OmMHuv5j7EQuIhsDWrmjBTmipSGKXNFoME7QmTqRGZgoBe_wdYMGpBYhItWATQ30DPMsp1vaDk19UZsqpX-ssUagk_avLLVRhXtYHPXhdlkZCiMP8E9VkxmYHTZimRqSzAVaKXhIGJbJPiRzkXusX4_CZ2ZHbG0ubqLm8WaEkFZTlf-XmzjvW6I9w3Nca-0YokzNFns0mOwtAiV0N1TeDaxXjCKDiuG2TBgVA8bmYmLAp8WkIQy5rhbQ3dA78WLfp9zVk",
  "Mexico": "https://lh3.googleusercontent.com/aida-public/AB6AXuCaIjCUNjk3rm-ncecrkpjeSeed1QdyPdKM4r2IXYpLOhUrxMxTf9_RLoKYvSonUlcu1N-2tVaxtacj7a88ZoQesRxnYJiP0TmYkhA02z7LlDXZs6A0ad8QcL-dOeEuq5EVGuezYriXVKuuzIijC--Y9lwGb9r08Pt5_z48GBNhGhGqNBOShZ3IV3s7OMfZk5tNwSY3T73oF3t-wNHkcepifhBrYmIGzzM-C_hLWvB3ANX20f7rUEBIIAsQ4KHzuKzuseQnZkI",
  "Argentina": "https://lh3.googleusercontent.com/aida-public/AB6AXuDcxljzPRUBD0yQNyyoSxIn4rQ4y9oxkghxfScxSzM3mh3iFvuM-k6Njr3VRcLRDRnvrO--fOXMt59RWdYxG7u2Q0OJTPG6MiEyfZDuU8aggP3CXA_rGJkbjlxXqZOrqLHBri6W4rm7o5AfEwaHL_zPmU4HL2bnZoR5JKjff6Vu_JOLLFtJUIb9EoPJoOKXpuARX3JBBm2aSMPnozQ8qT3f94GMrQlJ65ROs0Vm-0nJVbkNixYHJqierAl65e_vrcvVh21MGO4",
  "Germany": "/germany_flag_avatar.png",
  "Spain": "/spain_flag_avatar.png",
  "England": "https://lh3.googleusercontent.com/aida-public/AB6AXuA1Hva7ZVb6VJ6dQF_b1yj5aejO2QCH5ySo4_-58nKvDPOls9GET0UmNrIfNp7RfGL0IcsFx-9iZytbTwM45RpUjNzWy1r9Y7URRtR3V5BnwLh89FuSXwLTelJ25Eck4Ecoa8jZ_389pzzk8B3DlirDK8wnYpyiOoS42THZ1MPX2fSO7YQGmjav16EergmkKumHZaK_SE9m1zf6XN1NVK12-_gcIELvMXRDpz5k9E6eYpjzCp8_w_1jzUwXqyqbn8SGkM35NqM",
};

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, type }) {
  const cfg = {
    success: { bg: "var(--toast-success-bg)", border: "var(--toast-success-border)", icon: <CheckCircle2 size={15} />, color: "var(--green)" },
    error: { bg: "var(--toast-error-bg)", border: "var(--toast-error-border)", icon: <AlertCircle size={15} />, color: "var(--red)" },
    info: { bg: "var(--toast-info-bg)", border: "var(--toast-info-border)", icon: <Info size={15} />, color: "var(--primary)" },
  };
  const c = cfg[type] || cfg.info;
  return (
    <div className="animate-fade-in" style={{
      position: "fixed", top: 76, right: 20, zIndex: 9999,
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 10, padding: "12px 18px",
      display: "flex", alignItems: "center", gap: 9,
      color: c.color, fontSize: 13, fontWeight: 600,
      maxWidth: 340, backdropFilter: "blur(16px)",
      boxShadow: "0 8px 32px var(--toast-shadow)"
    }}>
      {c.icon}<span>{msg}</span>
    </div>
  );
}

// ─── Team Avatar ──────────────────────────────────────────────────────────────
function TeamAvatar({ emoji, img, size = 48, borderColor = "var(--border-bright)" }) {
  return (
    <div style={{
      width: size + 6, height: size + 6, borderRadius: "50%",
      padding: "3px",
      background: "var(--avatar-border-grad)",
      border: `1px solid ${borderColor}`,
      boxShadow: "var(--avatar-shadow)",
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
    }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "var(--avatar-inner-bg)",
        overflow: "hidden", display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: size * 0.45, flexShrink: 0
      }}>
        {img ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span>{emoji}</span>}
      </div>
    </div>
  );
}

// ─── Shimmer Button component (Magic UI-style) ────────────────────────────────
function ShimmerBtn({ children, onClick, disabled, full, variant = "default" }) {
  const cls = variant === "primary" ? "btn-primary" : "btn-shimmer";
  return (
    <button
      className={cls}
      onClick={onClick}
      disabled={disabled}
      style={{ width: full ? "100%" : undefined }}
    >
      {children}
    </button>
  );
}

// ─── Number Ticker (Magic UI-inspired) ───────────────────────────────────────
function NumberTicker({ value, prefix = "", suffix = "" }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      setDisplay(value);
    }
  }, [value]);
  return (
    <span className="number-ticker animate-number">
      {prefix}{typeof display === "number" ? fmt(display, 0) : display}{suffix}
    </span>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────
const LEADERBOARD = [
  { rank: 1, addr: "0x7F...3aB9", winRate: 68, profit: 45230, medal: "🥇" },
  { rank: 2, addr: "0x12...9cF4", winRate: 62, profit: 32105, medal: "🥈" },
  { rank: 3, addr: "0x9A...e2D1", winRate: 59, profit: 28450, medal: "🥉" },
  { rank: 4, addr: "0x4B...f1A8", winRate: 54, profit: 21000, medal: null },
  { rank: 5, addr: "0xD3...7eC2", winRate: 51, profit: 18750, medal: null },
  { rank: 6, addr: "0xE5...b3F7", winRate: 49, profit: 15200, medal: null },
  { rank: 7, addr: "0xA2...d1C9", winRate: 47, profit: 11800, medal: null },
];

// ─── Match Card ───────────────────────────────────────────────────────────────
function MatchCard({ match, onBet }) {
  const t = match.totalPool || 1;
  const hp = Math.round((match.homePool / t) * 100);
  const dp = Math.round((match.drawPool / t) * 100);
  const ap = Math.round((match.awayPool / t) * 100);

  const homeImg = TEAM_IMAGES[match.homeTeam];
  const awayImg = TEAM_IMAGES[match.awayTeam];

  return (
    <div className="card animate-slide-up" style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      {/* Header stripe */}
      <div style={{
        padding: "14px 20px", display: "flex", justifyContent: "space-between",
        alignItems: "center", borderBottom: "1px solid var(--border)",
        background: "var(--card-header-bg)"
      }}>
        <span className="badge badge-open" style={{ gap: 5, padding: "4px 10px" }}>
          <Clock size={10} /> {timeUntil(match.kickoffTime)}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Globe size={11} style={{ color: "var(--text-secondary)" }} />
          <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>{match.league || "World Cup"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>
          <Coins size={11} style={{ color: "var(--primary)" }} />${fmtK(match.totalPool)}
        </div>
      </div>

      {/* Teams */}
      <div style={{ padding: "26px 20px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <TeamAvatar emoji={match.homeFlag} img={homeImg} size={64} borderColor="rgba(0, 212, 255, 0.35)" />
          <div className="font-sans" style={{ marginTop: 12, fontSize: 14.5, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>{match.homeTeam}</div>
          <div style={{ fontSize: 9.5, color: "var(--text-secondary)", marginTop: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{match.homeFlag} Home</div>
        </div>

        <div style={{ textAlign: "center", padding: "0 12px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            fontSize: 9.5, fontWeight: 900, color: "var(--primary)",
            letterSpacing: "0.12em", padding: "3px 9px", background: "var(--vs-badge-bg)",
            border: "1px solid var(--vs-badge-border)", borderRadius: 20,
            marginBottom: 6, textShadow: "var(--vs-badge-shadow)",
            boxShadow: "0 0 12px rgba(0, 212, 255, 0.2)"
          }}>VS</div>
          <div style={{ fontSize: 8.5, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.06em" }}>
            LIQUIDITY
          </div>
        </div>

        <div style={{ textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <TeamAvatar emoji={match.awayFlag} img={awayImg} size={64} borderColor="rgba(123, 47, 247, 0.35)" />
          <div className="font-sans" style={{ marginTop: 12, fontSize: 14.5, fontWeight: 800, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>{match.awayTeam}</div>
          <div style={{ fontSize: 9.5, color: "var(--text-secondary)", marginTop: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{match.awayFlag} Away</div>
        </div>
      </div>

      {/* Odds */}
      <div style={{ padding: "0 20px 16px", display: "flex", gap: 8 }}>
        {[
          { label: "Home", odds: match.odds.home, o: 1, cls: "odds-btn-home" },
          { label: "Draw", odds: match.odds.draw, o: 2, cls: "odds-btn-draw" },
          { label: "Away", odds: match.odds.away, o: 3, cls: "odds-btn-away" },
        ].map(opt => (
          <button
            key={opt.o}
            className={`odds-btn ${opt.cls}`}
            disabled={match.status !== 0}
            onClick={() => onBet(match, opt.o)}
          >
            <span className="odds-label">{opt.label}</span>
            <span className="odds-value font-mono">{opt.odds}x</span>
          </button>
        ))}
      </div>

      {/* Pool bar */}
      <div style={{ padding: "0 20px 20px" }}>
        <div className="pool-bar-track">
          <div className="pool-bar-home" style={{ width: `${hp}%` }} />
          <div className="pool-bar-draw" style={{ width: `${dp}%` }} />
          <div className="pool-bar-away" style={{ width: `${ap}%` }} />
        </div>
        <div className="font-mono" style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 9.5, fontWeight: 700 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--primary)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--primary)", boxShadow: "0 0 4px var(--primary)" }} /> {hp}%
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--text-secondary)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--dot-draw)" }} /> {dp}%
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--purple)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--purple)", boxShadow: "0 0 4px var(--purple)" }} /> {ap}%
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Bet Modal ────────────────────────────────────────────────────────────────
function BetModal({ match, initOutcome, onClose, onSuccess, signer, theme }) {
  const [outcome, setOutcome] = useState(initOutcome || null);
  const [amount, setAmount] = useState("50");
  const [potentialPayout, setPotentialPayout] = useState(0);

  const { status, error, lastResult, placeBet, simulatePayout, reset } = useBetting(signer);

  const odds = { 1: match.odds.home, 2: match.odds.draw, 3: match.odds.away };
  const OPT_LABELS = { 1: "Home Win", 2: "Draw", 3: "Away Win" };

  useEffect(() => {
    const numAmount = parseFloat(amount) || 0;
    if (outcome && numAmount > 0) {
      simulatePayout(match.index, outcome, numAmount).then(val => {
        setPotentialPayout(val);
      }).catch(err => {
        console.error("Payout simulation failed:", err);
        setPotentialPayout(numAmount * (odds[outcome] || 1));
      });
    } else {
      setPotentialPayout(0);
    }
  }, [match.index, outcome, amount, simulatePayout, odds]);

  const numAmount = parseFloat(amount) || 0;
  
  // Calculate potential payout with professional empty-pool fallback
  let payout = potentialPayout;
  if (outcome && numAmount > 0) {
    const fallbackPayout = numAmount * (odds[outcome] || 1);
    if (!payout || payout <= numAmount) {
      payout = fallbackPayout;
    }
  }
  const profit = payout - numAmount;

  useEffect(() => {
    if (status === "success" && lastResult) {
      onSuccess({
        ...lastResult,
        amount: numAmount,
        outcome,
        payout
      });
    }
  }, [status, lastResult, onSuccess, numAmount, outcome, payout]);

  const place = async () => {
    if (!outcome) return;
    if (numAmount <= 0) return;
    await placeBet(match.index, outcome, numAmount);
  };

  const homeImg = TEAM_IMAGES[match.homeTeam];
  const awayImg = TEAM_IMAGES[match.awayTeam];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: theme === "dark" ? "rgba(2,2,3,0.85)" : "rgba(15, 23, 42, 0.3)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card animate-slide-up" style={{ width: "100%", maxWidth: 440, border: "1px solid var(--border)", borderTop: "1px solid rgba(0, 212, 255, 0.25)" }}>
        <div style={{ padding: 24 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 4 }}>
                Place Your Bet
              </h2>
              <div className="font-sans" style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
                <TeamAvatar emoji={match.homeFlag} img={homeImg} size={18} />
                <span style={{ fontWeight: 600 }}>{match.homeTeam} vs {match.awayTeam}</span>
                <TeamAvatar emoji={match.awayFlag} img={awayImg} size={18} />
              </div>
            </div>
            <button onClick={onClose} className="btn-ghost" style={{ width: 32, height: 32, padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={14} />
            </button>
          </div>

          <>
            {/* Outcome selector */}
            <div style={{ marginBottom: 18 }}>
              <div className="font-sans" style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 9 }}>Select Outcome</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[1, 2, 3].map(o => {
                  const isSel = outcome === o;
                  const oColors = {
                    1: { text: "var(--primary)", border: "var(--primary-alpha-border)", bg: "var(--primary-alpha-bg)", shadow: "var(--vs-badge-shadow)" },
                    2: { text: "var(--text-primary)", border: "var(--border-bright)", bg: "var(--pool-track-bg)", shadow: "none" },
                    3: { text: "var(--purple)", border: "var(--purple-alpha-border)", bg: "var(--purple-alpha-bg)", shadow: "0 0 12px rgba(123, 47, 247, 0.2)" }
                  }[o];
                  return (
                    <button key={o} onClick={() => setOutcome(o)} style={{
                      padding: "12px 8px", borderRadius: 8, cursor: "pointer",
                      border: isSel ? `1px solid ${oColors.border}` : "1px solid var(--border)",
                      background: isSel ? oColors.bg : "transparent",
                      textAlign: "center", transition: "all 0.18s",
                      boxShadow: isSel ? oColors.shadow : "none"
                    }}>
                      <div className="font-sans" style={{ fontSize: 10, fontWeight: 700, color: isSel ? oColors.text : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                        {["HOME", "DRAW", "AWAY"][o - 1]}
                      </div>
                      <div className="font-mono" style={{ fontSize: 20, fontWeight: 750, color: isSel ? oColors.text : "var(--text-primary)" }}>
                        {odds[o]}x
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 18 }}>
              <div className="font-sans" style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 9 }}>Stake Amount (USDT)</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 9 }}>
                {[10, 25, 50, 100, 250].map(a => {
                  const isActive = parseFloat(amount) === a;
                  return (
                    <button key={a} onClick={() => setAmount(a.toString())} className="font-mono" style={{
                      flex: 1, padding: "7px 0", borderRadius: 6, fontSize: 12, fontWeight: 700,
                      border: `1px solid ${isActive ? "var(--primary)" : "var(--border)"}`,
                      background: isActive ? "var(--btn-amount-bg)" : "transparent",
                      color: isActive ? "var(--primary)" : "var(--text-muted)",
                      cursor: "pointer", transition: "all 0.15s"
                    }}>${a}</button>
                  );
                })}
              </div>
              <div style={{ position: "relative" }}>
                <Coins size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  type="number" value={amount} min={0.01} step={0.01}
                  onChange={e => setAmount(e.target.value)}
                  className="input font-mono"
                  style={{ paddingLeft: 34, paddingRight: 52 }}
                />
                <span className="font-mono" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 700, color: "var(--primary)" }}>USDT</span>
              </div>
            </div>

            {/* Payout estimate */}
            {outcome && (() => {
              const isLoss = profit < 0;
              const profitColor = isLoss ? "var(--danger-text)" : "var(--success-text)";
              const profitBg = isLoss ? "var(--danger-bg)" : "var(--success-bg)";
              const profitBorder = isLoss ? "1px solid var(--danger-border)" : "1px solid var(--success-border)";
              const profitSign = isLoss ? "-" : "+";
              return (
                <div style={{
                  background: profitBg, border: profitBorder,
                  borderRadius: 8, padding: "14px 16px", marginBottom: 16,
                  display: "flex", justifyContent: "space-between", alignItems: "center"
                }}>
                  <div>
                    <div className="font-sans" style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Potential Payout</div>
                    <div className="font-mono" style={{ fontSize: 22, fontWeight: 800, color: profitColor, letterSpacing: -0.5 }}>
                      ${fmt(payout)}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="font-sans" style={{ fontSize: 10, color: profitColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{isLoss ? "Loss" : "Profit"}</div>
                    <div className="font-mono" style={{ fontSize: 22, fontWeight: 800, color: profitColor, letterSpacing: -0.5 }}>
                      {profitSign}${fmt(Math.abs(profit))}
                    </div>
                  </div>
                </div>
              );
            })()}

            {error && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--danger-text)", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "var(--danger-bg)", borderRadius: 7, border: "1px solid var(--danger-border)" }}>
                <AlertCircle size={14} />{error}
              </div>
            )}

            <ShimmerBtn variant="primary" full onClick={place} disabled={!outcome || status === "approving" || status === "betting"}>
              {status === "approving" && <><RefreshCw size={14} className="animate-spin" /> Approving USDT…</>}
              {status === "betting" && <><RefreshCw size={14} className="animate-spin" /> Placing on X Layer…</>}
              {status !== "approving" && status !== "betting" && <><Zap size={14} /> {outcome ? `Bet $${amount} on ${OPT_LABELS[outcome]}` : "Select an outcome"}</>}
            </ShimmerBtn>
          </>
        </div>
      </div>
    </div>
  );
}

function InfoModal({ type, onClose, theme }) {
  const MODAL_CONTENT = {
    whitepaper: {
      title: "GoalBet Whitepaper",
      subtitle: "Decentralized Parimutuel Sports Betting & AI Execution",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-primary)" }}>
            GoalBet is a state-of-the-art decentralized sports betting protocol that leverages parimutuel pooling and autonomous AI execution on the <strong>X Layer</strong> blockchain.
          </p>
          <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)", marginTop: 6 }}>1. Parimutuel Pooling</h4>
          <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
            Unlike traditional bookmakers, all stakes for a given match outcome are pooled. Winning tickets split the total pool (minus a small fee of 2%) proportionally to their wager. The odds are calculated dynamically and finalized only when the pool locks at kickoff.
          </p>
          <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)", marginTop: 6 }}>2. Autonomous AI Delegation</h4>
          <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
            Users can delegate their betting activity to a localized AI Betting Agent. By authorizing the contract and depositing USDT, the agent calculates Expected Value (EV) using current pool sizes and historical team data, executing bets sizing based on the Kelly Criterion.
          </p>
          <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)", marginTop: 6 }}>3. Yield & Rewards</h4>
          <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
            Winnings are distributed automatically in USDT. Claims are fully decentralized and can be triggered directly via the smart contract.
          </p>
        </div>
      )
    },
    verification: {
      title: "On-Chain Verification",
      subtitle: "Verify contract addresses and logs on the X Layer Explorer",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-primary)" }}>
            All transaction logic, wagers, and agent executions are executed transparently on-chain. You can verify the smart contracts directly:
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
            <div style={{ background: "rgba(0,0,0,0.08)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>Prediction Market Contract</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "var(--primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {CONTRACTS.PREDICTION_MARKET || "0x12114397DCD0A58E10ff4eeb1d55c58558849dC7"}
                </span>
                {CONTRACTS.PREDICTION_MARKET && (
                  <a href={`${ACTIVE_NETWORK.explorerUrl}/address/${CONTRACTS.PREDICTION_MARKET}`} target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.08)", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", fontWeight: 700 }}>USDT Token Contract</span>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono', monospace", color: "var(--purple)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {CONTRACTS.USDT || "0x1E4a5963aBFD975d8c9021ce480b42188849D41d"}
                </span>
                {CONTRACTS.USDT && (
                  <a href={`${ACTIVE_NETWORK.explorerUrl}/address/${CONTRACTS.USDT}`} target="_blank" rel="noreferrer" style={{ color: "var(--text-secondary)", display: "flex", alignItems: "center" }}>
                    <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6, lineHeight: 1.5 }}>
            Verification transaction links are also included with every notification message and inside the wagers list on your Portfolio page.
          </p>
        </div>
      )
    },
    odds: {
      title: "Odds Calculations & API",
      subtitle: "Dynamic Parimutuel Odds Mechanism",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-primary)" }}>
            GoalBet operates on a decentralized parimutuel wagering model, meaning there are no fixed bookmaker margins. Odds are determined purely by user participation.
          </p>
          <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)", marginTop: 6 }}>Dynamic Formula</h4>
          <div style={{ background: "var(--primary-alpha-bg)", border: "1px solid var(--primary-alpha-border)", padding: "12px", borderRadius: 8, textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: "var(--primary)" }}>
            Odds = (Total Pool * 0.98) / Outcome Pool
          </div>
          <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
            As users place bets, the pools change, and odds adjust. When a match starts, the odds freeze. Winnings are settled based on these frozen closing odds.
          </p>
          <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)", marginTop: 6 }}>Oracle Resolution</h4>
          <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
            Match data is fetched from decentralized sports data feeds. Oracle nodes resolve matches directly on the blockchain after final whistle verification. If a match is cancelled or postponed, all pools are fully refunded in USDT.
          </p>
        </div>
      )
    },
    support: {
      title: "Customer Support",
      subtitle: "Get assistance or submit platform feedback",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-primary)" }}>
            Have questions or encountered an issue with your wagers? We are here to help.
          </p>
          <div style={{ background: "rgba(0,0,0,0.03)", padding: "16px", borderRadius: 10, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              <strong>Email Support:</strong> support@goalbet.io
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              <strong>Discord Community:</strong> discord.gg/goalbet
            </div>
            <div style={{ fontSize: 11, color: "var(--text-muted)", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              Please include your wallet address, transaction hash, and match ID in any support query to expedite resolution.
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)", marginBottom: 8 }}>Submit Feedback</h4>
            <input placeholder="Your email address" className="input" style={{ marginBottom: 8, fontSize: 12 }} />
            <textarea placeholder="Describe your issue or feedback..." className="input" style={{ minHeight: 80, fontSize: 12, resize: "none", fontFamily: "sans-serif" }} />
            <button onClick={() => alert("Feedback submitted! Thank you.")} className="btn-shimmer" style={{ width: "100%", marginTop: 8 }}>Send Message</button>
          </div>
        </div>
      )
    },
    privacy: {
      title: "Decentralized Privacy Policy",
      subtitle: "Your keys, your data. No central tracking.",
      content: (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--text-primary)" }}>
            GoalBet is committed to absolute user privacy. Our architecture contains no centralized login, database, or analytics trackers.
          </p>
          <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)", marginTop: 6 }}>1. Zero Personal Data</h4>
          <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
            We do not collect names, email addresses, IP addresses, or location data. Your identity is simply your public cryptographic wallet address.
          </p>
          <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)", marginTop: 6 }}>2. Local Storage Only</h4>
          <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
            Your UI settings, active theme selection (Light vs. Dark mode), and notification transaction histories are stored purely within your own browser's LocalStorage. No cookies are transmitted to third parties.
          </p>
          <h4 style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--primary)", marginTop: 6 }}>3. Smart Contract Execution</h4>
          <p style={{ fontSize: 12.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
            All transaction parameters are publicly accessible on the public blockchain ledger (X Layer). By using GoalBet, you acknowledge that on-chain actions are immutable.
          </p>
        </div>
      )
    }
  };

  const data = MODAL_CONTENT[type] || MODAL_CONTENT.whitepaper;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 10000,
      background: theme === "dark" ? "rgba(2,2,3,0.85)" : "rgba(15, 23, 42, 0.3)",
      backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card animate-slide-up" style={{
        width: "100%",
        maxWidth: 480,
        border: "1px solid var(--border)",
        borderTop: "1px solid rgba(0, 212, 255, 0.25)",
        maxHeight: "90vh",
        overflowY: "auto"
      }}>
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
            <div>
              <h2 className="font-serif" style={{ fontSize: 24, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 4 }}>
                {data.title}
              </h2>
              <p className="font-sans" style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0 }}>{data.subtitle}</p>
            </div>
            <button onClick={onClose} className="btn-ghost" style={{ width: 32, height: 32, padding: 0, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={14} />
            </button>
          </div>
          <div style={{ height: 1, background: "var(--border)", marginBottom: 18 }} />
          <div className="font-sans">{data.content}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Matches Tab ──────────────────────────────────────────────────────────────
function MatchesTab({ matches = [], loading, onBet }) {
  const [search, setSearch] = useState("");
  const filtered = matches.filter(m =>
    !search || m.homeTeam.toLowerCase().includes(search.toLowerCase()) || m.awayTeam.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      {/* Controls */}
      <div className="font-sans" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 className="font-serif" style={{ fontSize: 34, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 6 }}>
            Featured <span className="text-gradient-primary-purple" style={{ fontStyle: "italic" }}>Matches</span>
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Top liquidity prediction pools · FIFA World Cup 2026 · X Layer</p>
        </div>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
          <input placeholder="Search matches…" value={search} onChange={e => setSearch(e.target.value)}
            className="input font-sans" style={{ paddingLeft: 36, width: 240, fontSize: 13, height: 42, borderRadius: 8 }} />
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: 300, color: "var(--primary)", gap: 12 }}>
          <RefreshCw size={24} className="animate-spin" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Loading live matches from X Layer...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <CircleDot size={32} style={{ opacity: 0.4, color: "var(--primary)" }} />
          <div>No matches found. Check back later!</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map(m => <MatchCard key={m.index} match={m} onBet={onBet} />)}
        </div>
      )}
    </div>
  );
}

// ─── AI Agent Tab ─────────────────────────────────────────────────────────────
function AgentTab({ address, signer, matches, usdtBalance, refetchUsdt, onNotif, addNotif, theme }) {
  const [risk, setRisk] = useState("moderate");
  const [budget, setBudget] = useState("100");
  const [analysing, setAn] = useState(false);
  const [analyses, setAns] = useState([]);
  const [runningCycle, setRunningCycle] = useState(false);
  const logRef = useRef(null);

  const {
    isAuthorized,
    remainingBudget,
    loading: agentLoading,
    error: agentError,
    txStatus,
    authorizeAgent,
    topUpBudget,
    revokeAgent,
    refetch: refetchAgent,
  } = useAgent(address, signer);

  const [logs, setLogs] = useState([
    { text: "[System] GoalBet Agent v2.1 initialized.", col: "var(--terminal-system)" },
    { text: "[Auth] Connected to X Layer Oracle nodes.", col: "var(--terminal-system)" },
    { text: "[Scan] Monitoring active World Cup markets…", col: "var(--terminal-system)" },
    { text: "> Odds engine ready. EV model loaded.", col: "var(--terminal-info)" },
    { text: "> Kelly criterion sizing: ACTIVE", col: "var(--terminal-primary)" },
    { text: "[Success] Agent standing by for authorization.", col: "var(--terminal-success)" },
  ]);

  useEffect(() => {
    if (isAuthorized) {
      addLog(`[Active] Agent is authorized on-chain. Remaining budget: $${remainingBudget} USDT.`, "var(--terminal-success)");
    } else {
      addLog("[Standby] Agent unauthorized on-chain. Ready to accept delegation.", "var(--terminal-system)");
    }
  }, [isAuthorized, remainingBudget]);

  const RISK = {
    conservative: { color: "var(--green)", bg: "var(--success-bg)", border: "var(--success-border)", icon: <Shield size={13} />, desc: "Min 70% confidence · Max 5% per bet" },
    moderate: { color: "var(--purple)", bg: "var(--purple-alpha-bg)", border: "var(--purple-alpha-border)", icon: <Target size={13} />, desc: "Min 55% confidence · Max 10% per bet" },
    aggressive: { color: "var(--red)", bg: "var(--danger-bg)", border: "var(--danger-border)", icon: <Flame size={13} />, desc: "Min 40% confidence · Max 20% per bet" },
  };

  const addLog = (text, col, txHash) => {
    setLogs(p => [...p, { text, col, txHash }]);
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 50);
  };

  const analyze = async () => {
    if (!matches || matches.length === 0) {
      onNotif("No matches available to analyze.", "error");
      return;
    }
    setAn(true); addLog("[Scan] Running EV analysis across all markets…", "var(--terminal-info)");
    try {
      const currentBudget = isAuthorized ? remainingBudget : (parseFloat(budget) || 0);
      const results = await Promise.all(matches.map(async m => {
        const r = await fetch("/api/agent-analysis", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchIndex: m.index,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            riskLevel: risk,
            budget: currentBudget,
            contractOdds: {
              home: Math.round(m.odds.home * 10000),
              draw: Math.round(m.odds.draw * 10000),
              away: Math.round(m.odds.away * 10000)
            }
          })
        });
        const d = await r.json();
        return { match: m, ...(d.analysis || {}) };
      }));
      setAns(results);
      const confThreshold = risk === "conservative" ? 70 : risk === "moderate" ? 55 : 40;
      const recCount = results.filter(r => r.recommendation?.confidence >= confThreshold).length;
      addLog(`[Done] Analysis complete. ${recCount} bets recommended.`, "var(--terminal-success)");
    } catch (e) {
      onNotif("Analysis failed: " + e.message, "error");
      addLog("[Error] Analysis failed.", "var(--terminal-danger)");
    }
    setAn(false);
  };

  const executeManualCycle = async () => {
    if (!isAuthorized) {
      onNotif("Authorize the agent first before running a cycle!", "error");
      return;
    }
    addLog("[Trigger] Initiating manual agent cycle run on X Layer...", "var(--terminal-primary)");
    setRunningCycle(true);
    try {
      const res = await fetch("/api/agent-run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": process.env.NEXT_PUBLIC_CRON_SECRET || "some_random_string",
        },
        body: JSON.stringify({
          users: [{ address, riskLevel: risk, budget: remainingBudget }],
        }),
      });
      const data = await res.json();
      if (data.success) {
        addLog(`[Summary] Bets Placed: ${data.summary.betsPlaced}, Skipped: ${data.summary.skipped}, Errors: ${data.summary.errors}`, "var(--terminal-success)");
        if (data.actions && data.actions.length > 0) {
          data.actions.forEach(act => {
            if (act.type === "BET_PLACED") {
              addLog(`[Bet Placed] Match ${act.matchIndex}: Outcome ${act.outcome} | Amount: $${act.amount} USDT | TX: ${act.txHash.slice(0, 12)}...`, "var(--terminal-success)", act.txHash);
              const outcomeLabel = { 1: "Home Win", 2: "Draw", 3: "Away Win" }[act.outcome] || "Unknown";
              addNotif(
                "Agent Bet Placed",
                `AI Betting Agent autonomously placed $${act.amount} USDT on ${outcomeLabel} for match index ${act.matchIndex}`,
                act.txHash
              );
            } else if (act.type === "SKIPPED") {
              addLog(`[Skipped] Match ${act.matchIndex}: ${act.reasoning}`, "var(--terminal-system)");
            } else if (act.type === "ERROR") {
              addLog(`[Error] Match ${act.matchIndex}: ${act.reasoning}`, "var(--terminal-danger)");
            }
          });
        } else {
          addLog("[Cycle] No actions taken by agent.", "var(--terminal-system)");
        }
        addNotif(
          "Agent Run Completed",
          `Agent cycle completed. Placed: ${data.summary.betsPlaced}, Skipped: ${data.summary.skipped}`,
          null
        );
        refetchAgent();
        refetchUsdt();
        onNotif("Agent cycle execution completed successfully!", "success");
      } else {
        addLog(`[Error] Agent cycle failed: ${data.error}`, "var(--terminal-danger)");
        onNotif(`Agent cycle failed: ${data.error}`, "error");
      }
    } catch (e) {
      addLog(`[Error] Network error during execution: ${e.message}`, "var(--terminal-danger)");
      onNotif("Network error during agent execution.", "error");
    } finally {
      setRunningCycle(false);
    }
  };

  return (
    <div className="agent-tab-container font-sans">

      {/* ── Left: Config panel ── */}
      <div className="card" style={{
        padding: "32px",
        display: "flex",
        flexDirection: "column",
        minHeight: 620,
      }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "linear-gradient(135deg, var(--primary-alpha-bg), var(--purple-alpha-bg))",
                border: "1px solid var(--primary-alpha-border)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: theme === "dark" ? "0 0 24px rgba(0,212,255,0.18)" : "none",
                position: "relative", flexShrink: 0
              }}>
                <Bot size={22} style={{ color: "var(--primary)" }} />
                {isAuthorized && <div style={{ position: "absolute", inset: -2, borderRadius: 14, border: "2px solid var(--primary-alpha-border)", animation: "pulse-glow 2s infinite" }} />}
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: -0.4, lineHeight: 1.1, margin: 0 }}>AI Betting Agent</h2>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0, marginTop: 3 }}>Autonomous execution · X Layer Mainnet</p>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <div style={{
              padding: "4px 10px", borderRadius: 20,
              background: isAuthorized ? "var(--success-bg)" : "var(--border-bright)",
              border: `1px solid ${isAuthorized ? "var(--success-border)" : "var(--border)"}`,
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: isAuthorized ? "var(--success-text)" : "var(--dot-draw)" }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: isAuthorized ? "var(--success-text)" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{isAuthorized ? "Active" : "Standby"}</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", marginBottom: 28 }} />

        {agentError && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", color: "var(--danger-text)", fontSize: 13, marginBottom: 18, padding: "8px 12px", background: "var(--danger-bg)", borderRadius: 7, border: "1px solid var(--danger-border)" }}>
            <AlertCircle size={14} />{agentError}
          </div>
        )}

        {/* Risk Profile */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Risk Profile</span>
            <span style={{ fontSize: 11, color: RISK[risk].color, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              {RISK[risk].icon} {risk.charAt(0).toUpperCase() + risk.slice(1)}
            </span>
          </div>
          <div className="risk-profile-grid">
            {["conservative", "moderate", "aggressive"].map(r => {
              const cfg = RISK[r];
              const sel = risk === r;
              return (
                <button key={r} onClick={() => setRisk(r)} style={{
                  padding: "14px 8px", borderRadius: 10, cursor: "pointer",
                  border: sel ? `1px solid ${cfg.border}` : "1px solid var(--border)",
                  background: sel ? cfg.bg : "var(--card-header-bg)",
                  textAlign: "center", transition: "all 0.2s",
                  boxShadow: sel ? `0 0 20px ${cfg.bg}, inset 0 1px 0 ${cfg.border}` : "none"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, marginBottom: 5, color: sel ? cfg.color : "var(--text-muted)" }}>
                    {cfg.icon}
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: "capitalize" }}>{r}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", lineHeight: 1.3 }}>
                    {r === "conservative" ? "Low yield" : r === "moderate" ? "Balanced" : "High variance"}
                  </div>
                </button>
              );
            })}
          </div>
          <div style={{
            marginTop: 10, fontSize: 11, color: RISK[risk].color,
            display: "flex", alignItems: "center", gap: 6,
            padding: "8px 12px",
            background: RISK[risk].bg,
            borderRadius: 7, border: `1px solid ${RISK[risk].border}`
          }}>
            {RISK[risk].icon} <span>{RISK[risk].desc}</span>
          </div>
        </div>

        {/* Escrow Budget */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Escrow Budget</span>
            {!isAuthorized && (
              <button onClick={() => setBudget(usdtBalance.toString())} style={{
                fontSize: 11, color: "var(--primary)", background: "var(--primary-alpha-bg)",
                border: "1px solid var(--primary-alpha-border)", cursor: "pointer",
                fontWeight: 700, padding: "3px 10px", borderRadius: 5, letterSpacing: "0.04em"
              }}>MAX</button>
            )}
          </div>
          {isAuthorized ? (
            <div style={{
              background: "var(--primary-alpha-bg)", border: "1px solid var(--primary-alpha-border)",
              borderRadius: 10, padding: "16px 20px"
            }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Authorized Escrow</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "var(--primary)", fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmt(remainingBudget)} <span style={{ fontSize: 14 }}>USDT</span>
                </span>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Agent authorized</span>
              </div>
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <Wallet size={14} style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input type="number" value={budget} min={0.01} step={0.01} onChange={e => setBudget(e.target.value)}
                className="input font-mono" style={{ paddingLeft: 36, paddingRight: 60, height: 46, fontSize: 15 }} />
              <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 700, color: "var(--primary)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em" }}>USDT</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            <Coins size={11} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Available Balance: <span style={{ color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{fmt(usdtBalance)} USDT</span></span>
          </div>

          {isAuthorized && (
            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <input
                type="number"
                placeholder="Top up amount"
                id="topup-amount-input"
                className="input"
                style={{ height: 38, fontSize: 13, flex: 1 }}
              />
              <button
                className="btn-shimmer"
                onClick={async () => {
                  const el = document.getElementById("topup-amount-input");
                  const val = parseFloat(el?.value || "0");
                  if (val > 0) {
                    const result = await topUpBudget(val);
                    if (result && result.success) {
                      addNotif(
                        "Budget Topped Up",
                        `Added $${val} USDT to AI Betting Agent's budget`,
                        result.txHash
                      );
                      onNotif(
                        <span>
                          Topped up agent budget by ${val} USDT!{" "}
                          <a
                            href={`${ACTIVE_NETWORK.explorerUrl}/tx/${result.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "var(--primary)", textDecoration: "underline", marginLeft: 4 }}
                          >
                            Verify
                          </a>
                        </span>,
                        "success"
                      );
                      if (el) el.value = "";
                      refetchUsdt();
                    } else {
                      onNotif("Top up failed", "error");
                    }
                  } else {
                    onNotif("Enter a valid amount", "error");
                  }
                }}
                style={{ padding: "0 16px", height: 38, borderRadius: 8, fontSize: 12, cursor: "pointer" }}
                disabled={txStatus === "approving" || txStatus === "authorizing"}
              >
                {txStatus === "approving" && "Approving..."}
                {txStatus === "authorizing" && "Topping up..."}
                {txStatus !== "approving" && txStatus !== "authorizing" && "Top Up"}
              </button>
            </div>
          )}
        </div>

        {/* Analysis preview — only when populated */}
        {analyses.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>Agent Analysis Preview</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {analyses.map((a, i) => a?.recommendation && (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                  background: "var(--card-header-bg)", border: "1px solid var(--border)",
                  borderRadius: 8
                }}>
                  <span style={{ fontSize: 18 }}>{a.match.homeFlag}{a.match.awayFlag}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{a.match.homeTeam} vs {a.match.awayTeam}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.recommendation.reasoning?.slice(0, 72)}…</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {a.recommendation.confidence >= (risk === "conservative" ? 70 : risk === "moderate" ? 55 : 40) ? (
                      <>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", fontFamily: "'JetBrains Mono', monospace" }}>${a.recommendation.suggestedAmount}</div>
                        <div style={{ fontSize: 10, color: "var(--green)" }}>{a.recommendation.confidence}% conf</div>
                      </>
                    ) : (
                      <span className="badge" style={{ background: "var(--border-bright)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>SKIP</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spacer pushes buttons to bottom */}
        <div style={{ flex: 1 }} />

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", marginBottom: 24 }} />

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
          <button className="btn-ghost" onClick={analyze} disabled={analysing}
            style={{ flex: 1, height: 46, borderRadius: 10, justifyContent: "center", gap: 8 }}>
            {analysing
              ? <><RefreshCw size={14} className="animate-spin" />Analyzing…</>
              : <><BarChart3 size={14} />Preview Analysis</>}
          </button>
          {isAuthorized ? (
            <button
              className="btn-ghost"
              onClick={async () => {
                const result = await revokeAgent();
                if (result && result.success) {
                  addNotif(
                    "Agent Revoked",
                    "Revoked authorization and escrow budget for the AI Betting Agent",
                    result.txHash
                  );
                  onNotif(
                    <span>
                      Agent authorization revoked!{" "}
                      <a
                        href={`${ACTIVE_NETWORK.explorerUrl}/tx/${result.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--primary)", textDecoration: "underline", marginLeft: 4 }}
                      >
                        Verify
                      </a>
                    </span>,
                    "success"
                  );
                  refetchUsdt();
                } else {
                  onNotif("Revoke failed", "error");
                }
              }}
              style={{
                flex: 1.5, height: 46, borderRadius: 10, gap: 8,
                border: "1px solid var(--danger-border)",
                color: "var(--danger-text)",
                background: "var(--danger-bg)",
                cursor: "pointer"
              }}
              disabled={txStatus === "revoking"}
            >
              {txStatus === "revoking" ? <><RefreshCw size={14} className="animate-spin" /> Revoking…</> : <><Lock size={15} /> Revoke Agent</>}
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={async () => {
                if (!address) { onNotif("Connect your wallet first!", "error"); return; }
                const numericBudget = parseFloat(budget) || 0;
                if (numericBudget <= 0) { onNotif("Enter a valid budget amount", "error"); return; }
                const result = await authorizeAgent(numericBudget);
                if (result && result.success) {
                  addNotif(
                    "Agent Authorized",
                    `Authorized AI Betting Agent with a budget of $${budget} USDT`,
                    result.txHash
                  );
                  onNotif(
                    <span>
                      Agent active with ${budget} USDT!{" "}
                      <a
                        href={`${ACTIVE_NETWORK.explorerUrl}/tx/${result.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--primary)", textDecoration: "underline", marginLeft: 4 }}
                      >
                        Verify
                      </a>
                    </span>,
                    "success"
                  );
                  refetchUsdt();
                } else {
                  onNotif("Authorization failed", "error");
                }
              }}
              style={{
                flex: 2, height: 46, borderRadius: 10, gap: 8,
              }}
              disabled={txStatus === "approving" || txStatus === "authorizing"}
            >
              {txStatus === "approving" && <><RefreshCw size={14} className="animate-spin" /> Approving USDT…</>}
              {txStatus === "authorizing" && <><RefreshCw size={14} className="animate-spin" /> Authorizing…</>}
              {txStatus !== "approving" && txStatus !== "authorizing" && <><Zap size={15} />Authorize Agent & Escrow</>}
            </button>
          )}
        </div>
      </div>

      {/* ── Right: Log panel ── */}
      <div className="card" style={{
        padding: "32px 28px 28px",
        display: "flex",
        flexDirection: "column",
        minHeight: 620,
      }}>
        {/* Log header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: "var(--purple-alpha-bg)",
            border: "1px solid var(--purple-alpha-border)",
            display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            <Activity size={15} style={{ color: "var(--purple)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, fontWeight: 400, letterSpacing: "-0.01em" }}>Live Execution Log</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2, fontWeight: 500 }}>Real-time agent activity stream</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {isAuthorized && (
              <button
                className="btn-shimmer"
                onClick={executeManualCycle}
                disabled={runningCycle}
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 6,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "var(--primary-alpha-bg)",
                  border: "1px solid var(--primary-alpha-border)",
                  color: "var(--primary)",
                  cursor: "pointer",
                }}
              >
                {runningCycle ? <RefreshCw size={11} className="animate-spin" /> : <Play size={11} />}
                {runningCycle ? "Running..." : "Run Cycle"}
              </button>
            )}
            <div style={{
              display: "flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 20,
              background: isAuthorized ? "var(--success-bg)" : "var(--border)",
              border: `1px solid ${isAuthorized ? "var(--success-border)" : "var(--border)"}`
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: isAuthorized ? "var(--success-text)" : "var(--dot-draw)",
                boxShadow: isAuthorized ? "0 0 8px var(--success-text)" : "none"
              }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: isAuthorized ? "var(--success-text)" : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {isAuthorized ? "Active" : "Idle"}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border-bright)", marginBottom: 20 }} />

        {/* Terminal — flex:1 fills remaining height */}
        <div ref={logRef} className="terminal" style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {logs.map((l, i) => (
            <div key={i} className="terminal-line" style={{ color: l.col || "var(--text-secondary)", animationDelay: `${i * 0.04}s` }}>
              <span style={{ color: "var(--text-muted)", marginRight: 8, userSelect: "none", fontSize: 10 }}>›</span>
              {l.text}
              {l.txHash && (
                <a
                  href={`${ACTIVE_NETWORK.explorerUrl}/tx/${l.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    color: "var(--primary)",
                    marginLeft: 8,
                    textDecoration: "underline",
                    fontSize: 10,
                    fontWeight: 600,
                    fontFamily: "sans-serif"
                  }}
                >
                  [Verify On-Chain]
                </a>
              )}
            </div>
          ))}
        </div>

        {/* Footer bar */}
        <div style={{ height: 1, background: "var(--border)", marginTop: 20, marginBottom: 16 }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Globe size={11} style={{ color: "var(--text-muted)" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>X Layer Mainnet</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>Latency: <span style={{ color: "var(--green)" }}>12ms</span></span>
            <div style={{ width: 1, height: 12, background: "var(--border)" }} />
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>{logs.length} events</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Portfolio Tab ────────────────────────────────────────────────────────────
function PortfolioTab({ address, signer, refetchUsdt, onNotif, addNotif }) {
  const { bets, loading, totalPnl, totalBetAmount, claimableBets, refetch: refetchBets } = useUserBets(address);
  const { claimWinnings, status: claimStatus } = useBetting(signer);

  const claimable = claimableBets.reduce((acc, b) => acc + b.potentialPayout, 0);

  if (!address) {
    return (
      <div className="card" style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <Wallet size={32} style={{ opacity: 0.4, color: "var(--primary)" }} />
        <div>Connect your wallet to view your betting history and claim rewards.</div>
      </div>
    );
  }

  return (
    <div className="portfolio-grid font-sans">
      <section>
        {/* Stats */}
        <div className="portfolio-stats-container">
          {[
            { label: "Total Wagered", value: `$${fmt(totalBetAmount)}`, icon: <Coins size={16} />, color: "var(--primary)" },
            { label: "Profit / Loss", value: `${totalPnl >= 0 ? "+" : ""}$${fmt(totalPnl)}`, icon: <TrendingUp size={16} />, color: totalPnl >= 0 ? "var(--green)" : "var(--red)" },
            { label: "Claimable", value: `$${fmt(claimable)}`, icon: <Unlock size={16} />, color: "var(--gold)" },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ background: "var(--card-header-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px" }}>
              <div className="font-sans" style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, color: s.color }}>{s.icon}<span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</span></div>
              <div className="font-mono" style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
          <Wallet size={18} style={{ color: "var(--primary)" }} /> My Bets
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", height: 150, color: "var(--primary)", gap: 8 }}>
              <RefreshCw size={18} className="animate-spin" />
              <span style={{ fontSize: 12, fontWeight: 500 }}>Fetching bets...</span>
            </div>
          ) : bets.length === 0 ? (
            <div className="card" style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <CircleDot size={24} style={{ opacity: 0.4, color: "var(--primary)" }} />
              <div>No bets placed yet. Visit Markets to make your first bet!</div>
            </div>
          ) : (
            bets.map(bet => {
              const estMultiplier = bet.amount > 0 ? (bet.potentialPayout / bet.amount).toFixed(2) : "0.00";
              const borderLeftStyle = bet.isWinner 
                ? "4px solid #00ff88" 
                : bet.matchStatus === 0 
                  ? "4px solid #00d4ff" 
                  : "4px solid rgba(255, 255, 255, 0.05)";
              const boxShadowStyle = bet.isWinner
                ? "0 16px 40px rgba(0, 0, 0, 0.75), inset 4px 0 10px rgba(0, 255, 136, 0.08)"
                : bet.matchStatus === 0
                  ? "0 16px 40px rgba(0, 0, 0, 0.75), inset 4px 0 10px rgba(0, 212, 255, 0.08)"
                  : "0 16px 40px rgba(0, 0, 0, 0.75)";
              return (
                <div key={bet.betId} className="card" style={{ padding: "16px 20px", borderLeft: borderLeftStyle, boxShadow: boxShadowStyle }}>
                  <div className="font-sans" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    {/* Teams */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {TEAM_IMAGES[bet.homeTeam] ? <img src={TEAM_IMAGES[bet.homeTeam]} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} /> : <span style={{ fontSize: 20 }}>{TEAM_FLAGS[bet.homeTeam] || "🏴"}</span>}
                      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>vs</span>
                      {TEAM_IMAGES[bet.awayTeam] ? <img src={TEAM_IMAGES[bet.awayTeam]} alt="" style={{ width: 28, height: 28, borderRadius: 4, objectFit: "cover" }} /> : <span style={{ fontSize: 20 }}>{TEAM_FLAGS[bet.awayTeam] || "🏴"}</span>}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{bet.homeTeam} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>vs</span> {bet.awayTeam}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 12, color: "var(--primary)" }}>{bet.outcomeName}</span>
                        <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>@ {estMultiplier}x</span>
                        {bet.isAgentBet && <span className="badge badge-agent"><Bot size={9} />Agent</span>}
                        {bet.txHash && (
                          <a
                            href={`${ACTIVE_NETWORK.explorerUrl}/tx/${bet.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              fontSize: 11,
                              color: "var(--text-secondary)",
                              textDecoration: "underline",
                              marginLeft: 6
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = "var(--primary)"}
                            onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
                          >
                            Verify <ExternalLink size={10} />
                          </a>
                        )}
                        {bet.claimed && bet.claimTxHash && (
                          <a
                            href={`${ACTIVE_NETWORK.explorerUrl}/tx/${bet.claimTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3,
                              fontSize: 11,
                              color: "var(--gold)",
                              textDecoration: "underline",
                              marginLeft: 6
                            }}
                            onMouseEnter={e => e.currentTarget.style.color = "var(--primary)"}
                            onMouseLeave={e => e.currentTarget.style.color = "var(--gold)"}
                          >
                            Verify Claim <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Amount */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>Wager</div>
                      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>${fmt(bet.amount)}</div>
                    </div>

                    {/* Payout */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2 }}>{bet.canClaim ? "Payout" : "Est. Payout"}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: bet.isWinner ? "var(--green)" : "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>${fmt(bet.potentialPayout)}</div>
                    </div>

                    {/* Action */}
                    {bet.canClaim ? (
                      <button
                        className="btn-shimmer"
                        onClick={async () => {
                          onNotif(`Claiming $${fmt(bet.potentialPayout)} USDT…`, "info");
                          const txHash = await claimWinnings(bet.betId);
                          if (txHash) {
                            addNotif(
                              "Reward Claimed",
                              `Claimed winnings of $${fmt(bet.potentialPayout)} USDT for match ${bet.homeTeam} vs ${bet.awayTeam}`,
                              txHash
                            );
                            onNotif(
                              <span>
                                Claimed successfully!{" "}
                                <a
                                  href={`${ACTIVE_NETWORK.explorerUrl}/tx/${txHash}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  style={{ color: "var(--primary)", textDecoration: "underline", marginLeft: 4 }}
                                >
                                  Verify
                                </a>
                              </span>,
                              "success"
                            );
                            refetchBets();
                            refetchUsdt();
                          } else {
                            onNotif("Claim failed", "error");
                          }
                        }}
                        style={{ gap: 6 }}
                        disabled={claimStatus === "claiming"}
                      >
                        {claimStatus === "claiming" ? <RefreshCw size={13} className="animate-spin" /> : <ArrowUpRight size={13} />} Claim
                      </button>
                    ) : bet.matchStatus === 0 ? (
                      <span className="badge badge-live"><CircleDot size={9} /> Live</span>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Leaderboard sidebar */}
      <aside>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <Trophy size={18} style={{ color: "var(--gold)" }} /> Top Bettors
        </h2>
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* Header */}
          <div style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "36px 1fr 80px", gap: 8, fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
            <span>#</span><span>Wallet</span><span style={{ textAlign: "right" }}>Profit</span>
          </div>
          {LEADERBOARD.map(row => (
            <div key={row.rank} style={{
              padding: "12px 16px", borderBottom: "1px solid var(--border)",
              display: "grid", gridTemplateColumns: "36px 1fr 80px", gap: 8,
              alignItems: "center", cursor: "pointer",
              transition: "background 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--border-bright)"}
              onMouseLeave={e => e.currentTarget.style.background = ""}
            >
              <span style={{ fontSize: row.medal ? 16 : 13, fontWeight: 700, color: ["#d4af37", "#C0C0C0", "#CD7F32"][row.rank - 1] || "var(--text-muted)" }}>
                {row.medal || row.rank}
              </span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "var(--text-primary)" }}>{row.addr}</div>
                <div style={{ fontSize: 10, color: "var(--text-muted)" }}>Win rate: {row.winRate}%</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 12, fontWeight: 700, color: "var(--green)", fontFamily: "'JetBrains Mono', monospace" }}>
                +{fmtK(row.profit)}
              </div>
            </div>
          ))}
          <div style={{ padding: "12px 16px", textAlign: "center" }}>
            <button onClick={() => setTab("leaderboard")} className="btn-ghost" style={{ fontSize: 12, gap: 5, width: "100%", justifyContent: "center" }}>View All <ChevronRight size={13} /></button>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ─── Leaderboard Tab ──────────────────────────────────────────────────────────
function LeaderboardTab() {
  return (
    <div className="font-sans" style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="font-serif" style={{ fontSize: 28, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 6, display: "flex", alignItems: "center", gap: 12 }}>
          <Trophy size={24} style={{ color: "var(--gold)" }} /> Global Leaderboard
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Ranked by on-chain USDT profit · World Cup 2026 · X Layer</p>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="font-sans" style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "48px 1fr 80px 100px", gap: 8, fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          <span>Rank</span><span>Wallet</span><span style={{ textAlign: "center" }}>Win %</span><span style={{ textAlign: "right" }}>Profit</span>
        </div>
        {LEADERBOARD.map(row => (
          <div key={row.rank} style={{
            padding: "16px 20px", borderBottom: "1px solid var(--border)",
            display: "grid", gridTemplateColumns: "48px 1fr 80px 100px", gap: 8,
            alignItems: "center", cursor: "pointer", transition: "background 0.15s"
          }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--border-bright)"}
            onMouseLeave={e => e.currentTarget.style.background = ""}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: row.medal ? 18 : 14, fontWeight: 700, color: ["#d4af37", "#C0C0C0", "#CD7F32"][row.rank - 1] || "var(--text-muted)" }}>
                {row.medal || row.rank}
              </span>
            </div>
            <div>
              <div className="font-mono" style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{row.addr}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>X Layer Mainnet · {100 - row.rank * 5} bets</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div className="font-mono" style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{row.winRate}%</div>
              <div style={{ height: 3, borderRadius: 2, background: "var(--border-bright)", marginTop: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${row.winRate}%`, background: "linear-gradient(90deg,var(--primary),var(--purple))", borderRadius: 2 }} />
              </div>
            </div>
            <div className="font-mono" style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--green)" }}>
              +{fmtK(row.profit)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Home() {
  const wallet = useWalletContext() || {};
  const [tab, setTab] = useState("matches");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [footerModal, setFooterModal] = useState(null);
  
  // Notification history state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);
  const [showSwapWarning, setShowSwapWarning] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("goalbet-theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
    
    // Load notifications from local storage
    const savedNotifs = localStorage.getItem("goalbet_notifications");
    if (savedNotifs) {
      try {
        const parsed = JSON.parse(savedNotifs);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    }
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset swap warning when wallet changes
  useEffect(() => {
    if (wallet.address) {
      setShowSwapWarning(true);
    }
  }, [wallet.address]);

  const addNotification = useCallback((title, message, txHash = null) => {
    const newNotif = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      title,
      message,
      txHash,
      timestamp: Date.now(),
      read: false
    };
    setNotifications(prev => {
      const updated = [newNotif, ...prev].slice(0, 50);
      localStorage.setItem("goalbet_notifications", JSON.stringify(updated));
      return updated;
    });
    setUnreadCount(prev => prev + 1);
  }, []);

  const toggleNotifications = () => {
    setShowNotifDropdown(!showNotifDropdown);
    if (!showNotifDropdown) {
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, read: true }));
        localStorage.setItem("goalbet_notifications", JSON.stringify(updated));
        return updated;
      });
      setUnreadCount(0);
    }
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("goalbet-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const { matches, loading: matchesLoading, refetch: refetchMatches } = useMatches();
  const { balance: usdtBalance, loading: usdtLoading, refetch: refetchUsdt } = useUSDT(wallet.address, wallet.provider);

  const notify = useCallback((msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const openBet = (match, outcome) => {
    if (!wallet.isConnected) { notify("Connect your wallet first!", "error"); return; }
    setModal({ match, outcome });
  };

  const TABS = [
    { id: "matches", label: "Markets", icon: <BarChart3 size={14} /> },
    { id: "agent", label: "AI Agent", icon: <Bot size={14} /> },
    { id: "portfolio", label: "Portfolio", icon: <Wallet size={14} /> },
    { id: "leaderboard", label: "Leaderboard", icon: <Trophy size={14} /> },
  ];

  const totalPool = matches ? matches.reduce((a, m) => a + m.totalPool, 0) : 0;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="grid-bg" />
      {toast && <Toast {...toast} />}

      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="nav-inner">
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "var(--bg-card)",
              border: "1px solid var(--border-bright)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 16px rgba(0,212,255,0.15)"
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12" stroke="var(--purple)" strokeWidth="1.5" />
                <path d="M12 2L15 9H22L16.5 13.5L18.5 20.5L12 16L5.5 20.5L7.5 13.5L2 9H9L12 2Z" fill="var(--bg-card)" stroke="var(--primary)" strokeWidth="1" />
              </svg>
            </div>
            <div>
              <div className="text-gradient-logo" style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 20,
                fontWeight: 400,
                letterSpacing: "-0.01em",
                lineHeight: 1
              }}>GoalBet</div>
              <div style={{ fontSize: 9, color: "var(--text-secondary)", letterSpacing: 1.8, textTransform: "uppercase", fontWeight: 700, marginTop: 2 }}>X Layer · 2026</div>
            </div>
          </div>

          {/* Desktop tabs */}
          <div className="desktop-only" style={{ display: "flex", gap: 0, height: 60, alignItems: "center" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`tab-item ${tab === t.id ? "active" : ""}`}
                style={{ height: "100%", borderRadius: 0 }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div className="nav-right">
            <button onClick={toggleTheme} className="btn-ghost" style={{ padding: "7px 10px", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }} title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <div ref={notifRef} style={{ position: "relative" }}>
              <button
                onClick={toggleNotifications}
                className="btn-ghost"
                style={{
                  padding: "7px 10px",
                  borderRadius: 8,
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Bell size={15} />
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: 2,
                    right: 2,
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--primary)",
                    boxShadow: "0 0 6px var(--primary)",
                    border: "1px solid var(--bg)"
                  }} />
                )}
              </button>

              {showNotifDropdown && (
                <div className="card animate-fade-in" style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  width: 320,
                  maxHeight: 400,
                  overflowY: "auto",
                  zIndex: 200,
                  padding: "16px",
                  background: "var(--bg-card)",
                  backdropFilter: "blur(28px)",
                  WebkitBackdropFilter: "blur(28px)",
                  border: "1px solid var(--border)",
                  borderTop: "1px solid rgba(0, 212, 255, 0.25)",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.85), inset 0 1px 0 rgba(255,255,255,0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border)", paddingBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>Notifications</span>
                    {notifications.length > 0 && (
                      <button
                        onClick={() => {
                          setNotifications([]);
                          localStorage.setItem("goalbet_notifications", "[]");
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--text-muted)",
                          fontSize: 11,
                          fontWeight: 500,
                          cursor: "pointer"
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = "var(--primary)"}
                        onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ padding: "24px 0", textAlign: "center", color: "var(--text-secondary)", fontSize: 12 }}>
                      No notifications yet
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {notifications.map(n => (
                        <div key={n.id} style={{
                          padding: "10px",
                          borderRadius: 8,
                          background: "var(--card-header-bg)",
                          border: "1px solid var(--border)",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <span style={{ fontSize: 12, fontWeight: 750, color: "var(--text-primary)" }}>{n.title}</span>
                            <span style={{ fontSize: 9, color: "var(--text-muted)" }}>{formatTimeAgo(n.timestamp)}</span>
                          </div>
                          <p style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.3 }}>{n.message}</p>
                          {n.txHash && (
                            <a
                              href={`${ACTIVE_NETWORK.explorerUrl}/tx/${n.txHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                fontSize: 10,
                                color: "var(--primary)",
                                textDecoration: "underline",
                                marginTop: 4,
                                fontWeight: 600
                              }}
                            >
                              Verify On-Chain <ExternalLink size={8} />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="desktop-only" style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "var(--primary-alpha-bg)", border: "1px solid var(--primary-alpha-border)", borderRadius: 7 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", boxShadow: "0 0 6px var(--primary)" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--primary)", fontFamily: "'JetBrains Mono', monospace" }}>{ACTIVE_NETWORK.name}</span>
            </div>
            {wallet.isConnected ? (
              <button className="btn-ghost" onClick={wallet.disconnect} style={{ gap: 7 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{shortAddr(wallet.address)}</span>
                <LogOut size={12} />
              </button>
            ) : (
              <ShimmerBtn variant="primary" onClick={wallet.connect}>
                <Wallet size={14} /> {wallet.isConnecting ? "Connecting…" : <>Connect<span className="desktop-only"> Wallet</span></>}
              </ShimmerBtn>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Stats ── */}
      <div style={{ paddingTop: 64, borderBottom: "1px solid var(--border)", background: "var(--hero-bg)", position: "relative", overflow: "hidden" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "36px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 28 }}>
          {/* Headline */}
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute",
              top: "-40%",
              left: "-20%",
              width: "140%",
              height: "180%",
              background: "radial-gradient(circle, rgba(0,212,255,0.08) 0%, rgba(123,47,247,0.04) 50%, transparent 100%)",
              filter: "blur(40px)",
              zIndex: -1,
              pointerEvents: "none"
            }} />
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Star size={11} style={{ color: "var(--primary)", fill: "var(--primary)" }} />
              <span className="font-sans" style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>FIFA World Cup 2026 · Prediction Markets</span>
            </div>
            <h1 className="font-serif" style={{ fontSize: "clamp(34px, 4.5vw, 54px)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.05, margin: 0 }}>
              Bet On-Chain.
              <span className="text-gradient-hero" style={{ display: "block", fontStyle: "italic" }}>
                Win in USDT.
              </span>
            </h1>
          </div>

          {/* Stats */}
          <div className="hero-stats-container">
            {[
              { label: "Total Pool", value: `$${fmtK(totalPool)}`, icon: <Coins size={13} /> },
              { label: "Open Markets", value: `${matches ? matches.filter(m => m.status === 0).length : 0}`, icon: <Activity size={13} /> },
              { label: "Blockchain", value: "X Layer", icon: <Globe size={13} /> },
              { label: "Event", value: "X Cup 2026", icon: <Trophy size={13} /> },
            ].map((s, i) => (
              <div key={s.label} className="hero-stat-item">
                <div style={{
                  position: "absolute",
                  top: 0, left: "10%", right: "10%",
                  height: 1,
                  background: i % 2 === 0 ? "linear-gradient(90deg, transparent, var(--primary), transparent)" : "linear-gradient(90deg, transparent, var(--purple), transparent)",
                  opacity: 0.6
                }} />
                <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: -0.5, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, textShadow: theme === "dark" ? "0 0 12px rgba(0,212,255,0.12)" : "none" }}>{s.value}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8, fontSize: 11, color: "var(--text-secondary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.icon}<span>{s.label}</span></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <main className="main-content">
        {wallet.isConnected && !usdtLoading && usdtBalance < 0.01 && showSwapWarning && (
          <div className="swap-warning-banner">
            <div className="swap-warning-content">
              <AlertCircle className="swap-warning-icon" size={18} />
              <span className="swap-warning-text">
                Please Swap your <strong>OKB</strong> to <strong>USDT</strong> to trade on GoalBet.
                <a 
                  href="https://www.okx.com/web3/dex-swap" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="swap-warning-link"
                >
                  Swap on OKX DEX <ArrowUpRight size={14} />
                </a>
              </span>
            </div>
            <button 
              className="swap-warning-close" 
              onClick={() => setShowSwapWarning(false)}
              aria-label="Dismiss warning"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {tab === "matches" && <MatchesTab matches={matches} loading={matchesLoading} onBet={openBet} />}
        {tab === "agent" && <AgentTab address={wallet.address} signer={wallet.signer} matches={matches} usdtBalance={usdtBalance} refetchUsdt={refetchUsdt} onNotif={notify} addNotif={addNotification} theme={theme} />}
        {tab === "portfolio" && <PortfolioTab address={wallet.address} signer={wallet.signer} refetchUsdt={refetchUsdt} onNotif={notify} addNotif={addNotification} />}
        {tab === "leaderboard" && <LeaderboardTab />}
      </main>

      {/* ── Footer ── */}
      <footer className="footer-section">
        <div className="footer-inner">
          <div className="text-gradient-logo" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 400, letterSpacing: "-0.01em" }}>GoalBet</div>
          <div className="footer-links">
            {[
              { label: "Whitepaper", key: "whitepaper" },
              { label: "Verification", key: "verification" },
              { label: "Odds API", key: "odds" },
              { label: "Support", key: "support" },
              { label: "Privacy", key: "privacy" }
            ].map(l => (
              <button key={l.key} onClick={() => setFooterModal(l.key)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--text-secondary)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--primary)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
              >{l.label}</button>
            ))}
          </div>
          <div className="footer-credits">
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>© 2026 GoalBet · Secured by X Layer</span>
            <span style={{ fontSize: 10.5, color: "var(--text-muted)", fontWeight: 500 }}>
              Built by{" "}
              <a
                href="https://github.com/Ritesh59697"
                target="_blank"
                rel="noopener noreferrer"
                className="developer-link"
              >
                Ritesh59697
              </a>
            </span>
          </div>
        </div>
      </footer>

      {/* ── Sticky Mobile Navigation ── */}
      <div className="mobile-only mobile-bottom-nav">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`mobile-bottom-nav-item ${tab === t.id ? "active" : ""}`}>
            {t.icon}
            <span style={{ fontSize: 9 }}>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Info Modal ── */}
      {footerModal && (
        <InfoModal
          type={footerModal}
          onClose={() => setFooterModal(null)}
          theme={theme}
        />
      )}

      {/* ── Bet Modal ── */}
      {modal && (
        <BetModal
          match={modal.match}
          initOutcome={modal.outcome}
          onClose={() => setModal(null)}
          signer={wallet.signer}
          theme={theme}
          onSuccess={result => {
            const outcomeName = { 1: "Home Win", 2: "Draw", 3: "Away Win" }[result.outcome] || "Unknown";
            addNotification(
              "Bet Placed Successfully",
              `Placed $${result.amount} USDT on ${outcomeName} for ${modal.match.homeTeam} vs ${modal.match.awayTeam}`,
              result.txHash
            );
            notify(
              <span>
                Bet placed!{" "}
                <a
                  href={`${ACTIVE_NETWORK.explorerUrl}/tx/${result.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--primary)", textDecoration: "underline", marginLeft: 4 }}
                >
                  Verify
                </a>
              </span>,
              "success"
            );
            refetchMatches();
            refetchUsdt();
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
