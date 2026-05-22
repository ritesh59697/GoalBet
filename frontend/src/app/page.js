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
import { ACTIVE_NETWORK, TEAM_FLAGS } from "../utils/config";
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
      <div style={{ padding: "24px 20px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <TeamAvatar emoji={match.homeFlag} img={homeImg} size={56} borderColor="var(--vs-badge-border)" />
          <div style={{ marginTop: 10, fontSize: 14, fontWeight: 750, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>{match.homeTeam}</div>
          <div style={{ fontSize: 9.5, color: "var(--text-secondary)", marginTop: 2, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{match.homeFlag} Home</div>
        </div>

        <div style={{ textAlign: "center", padding: "0 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            fontSize: 10, fontWeight: 900, color: "var(--primary)",
            letterSpacing: "0.12em", padding: "3px 9px", background: "var(--vs-badge-bg)",
            border: "1px solid var(--vs-badge-border)", borderRadius: 20,
            marginBottom: 6, textShadow: "var(--vs-badge-shadow)"
          }}>VS</div>
          <div style={{ fontSize: 9, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, letterSpacing: "0.06em" }}>
            LIQUIDITY
          </div>
        </div>

        <div style={{ textAlign: "center", flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <TeamAvatar emoji={match.awayFlag} img={awayImg} size={56} borderColor="var(--purple-alpha-border)" />
          <div style={{ marginTop: 10, fontSize: 14, fontWeight: 750, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>{match.awayTeam}</div>
          <div style={{ fontSize: 9.5, color: "var(--text-secondary)", marginTop: 2, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>{match.awayFlag} Away</div>
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
            <span className="odds-value">{opt.odds}x</span>
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
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 9.5, fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--primary)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--primary)", boxShadow: "0 0 4px var(--primary)" }} /> {hp}%
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--text-secondary)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--dot-draw)" }} /> {dp}%
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "var(--red)" }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--red)", boxShadow: "0 0 4px var(--red)" }} /> {ap}%
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

  useEffect(() => {
    if (status === "success" && lastResult) {
      onSuccess(lastResult);
    }
  }, [status, lastResult, onSuccess]);

  const numAmount = parseFloat(amount) || 0;
  const place = async () => {
    if (!outcome) return;
    if (numAmount <= 0) return;
    await placeBet(match.index, outcome, numAmount);
  };

  const payout = potentialPayout || (numAmount * (odds[outcome] || 1));
  const profit = payout > numAmount ? payout - numAmount : 0;

  const homeImg = TEAM_IMAGES[match.homeTeam];
  const awayImg = TEAM_IMAGES[match.awayTeam];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: theme === "dark" ? "rgba(0,0,0,0.88)" : "rgba(15,23,42,0.6)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card animate-slide-up" style={{ width: "100%", maxWidth: 440, border: "1px solid var(--primary-alpha-border)" }}>
        <div style={{ padding: 24 }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 4 }}>
                Place Your Bet
              </h2>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 8 }}>
                <TeamAvatar emoji={match.homeFlag} img={homeImg} size={18} />
                <span style={{ fontWeight: 600 }}>{match.homeTeam} vs {match.awayTeam}</span>
                <TeamAvatar emoji={match.awayFlag} img={awayImg} size={18} />
              </div>
            </div>
            <button onClick={onClose} className="btn-ghost" style={{ padding: "6px 8px", borderRadius: 8 }}>
              <X size={16} />
            </button>
          </div>

          <>
            {/* Outcome selector */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 9 }}>Select Outcome</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[1, 2, 3].map(o => {
                  const isSel = outcome === o;
                  const oColors = {
                    1: { text: "var(--primary)", border: "var(--primary-alpha-border)", bg: "var(--primary-alpha-bg)", shadow: "var(--vs-badge-shadow)" },
                    2: { text: "var(--text-primary)", border: "var(--border-bright)", bg: "var(--border)", shadow: "none" },
                    3: { text: "var(--red)", border: "var(--red-alpha-border)", bg: "var(--red-alpha-bg)", shadow: "none" }
                  }[o];
                  return (
                    <button key={o} onClick={() => setOutcome(o)} style={{
                      padding: "12px 8px", borderRadius: 8, cursor: "pointer",
                      border: isSel ? `1px solid ${oColors.border}` : "1px solid var(--border)",
                      background: isSel ? oColors.bg : "transparent",
                      textAlign: "center", transition: "all 0.18s",
                      boxShadow: isSel ? oColors.shadow : "none"
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: isSel ? oColors.text : "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                        {["HOME", "DRAW", "AWAY"][o - 1]}
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: isSel ? oColors.text : "var(--text-primary)" }}>
                        {odds[o]}x
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 9 }}>Stake Amount (USDT)</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 9 }}>
                {[10, 25, 50, 100, 250].map(a => {
                  const isActive = parseFloat(amount) === a;
                  return (
                    <button key={a} onClick={() => setAmount(a.toString())} style={{
                      flex: 1, padding: "7px 0", borderRadius: 6, fontSize: 12, fontWeight: 600,
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
                  type="number" value={amount} min={0.1} step={0.1}
                  onChange={e => setAmount(e.target.value)}
                  className="input"
                  style={{ paddingLeft: 34, paddingRight: 52 }}
                />
                <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12, fontWeight: 600, color: "var(--primary)", fontFamily: "'JetBrains Mono', monospace" }}>USDT</span>
              </div>
            </div>

            {/* Payout estimate */}
            {outcome && (
              <div style={{
                background: "var(--success-bg)", border: "1px solid var(--success-border)",
                borderRadius: 8, padding: "14px 16px", marginBottom: 16,
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <div>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Potential Payout</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--success-text)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: -0.5 }}>
                    ${fmt(payout)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Profit</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: "var(--success-text)", fontFamily: "'JetBrains Mono', monospace", letterSpacing: -0.5 }}>
                    +${fmt(profit)}
                  </div>
                </div>
              </div>
            )}

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

// ─── Matches Tab ──────────────────────────────────────────────────────────────
function MatchesTab({ matches = [], loading, onBet }) {
  const [search, setSearch] = useState("");
  const filtered = matches.filter(m =>
    !search || m.homeTeam.toLowerCase().includes(search.toLowerCase()) || m.awayTeam.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div>
      {/* Controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 6 }}>
            Featured <span className="text-gradient-primary-purple" style={{ fontStyle: "italic" }}>Matches</span>
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Top liquidity prediction pools · FIFA World Cup 2026 · X Layer</p>
        </div>
        <div style={{ position: "relative" }}>
          <Search size={14} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
          <input placeholder="Search matches…" value={search} onChange={e => setSearch(e.target.value)}
            className="input" style={{ paddingLeft: 36, width: 240, fontSize: 13, height: 42, borderRadius: 8 }} />
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
function AgentTab({ address, signer, matches, usdtBalance, refetchUsdt, onNotif, theme }) {
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
    { text: "[System] GoalBet Agent v2.1 initialized.", col: "var(--text-secondary)" },
    { text: "[Auth] Connected to X Layer Oracle nodes.", col: "var(--text-secondary)" },
    { text: "[Scan] Monitoring active World Cup markets…", col: "var(--text-secondary)" },
    { text: "> Odds engine ready. EV model loaded.", col: "#a78bfa" },
    { text: "> Kelly criterion sizing: ACTIVE", col: "#00d4ff" },
    { text: "[Success] Agent standing by for authorization.", col: "#4ade80" },
  ]);

  useEffect(() => {
    if (isAuthorized) {
      addLog(`[Active] Agent is authorized on-chain. Remaining budget: $${remainingBudget} USDT.`, "#4ade80");
    } else {
      addLog("[Standby] Agent unauthorized on-chain. Ready to accept delegation.", "var(--text-secondary)");
    }
  }, [isAuthorized, remainingBudget]);

  const RISK = {
    conservative: { color: "var(--green)", bg: "var(--success-bg)", border: "var(--success-border)", icon: <Shield size={13} />, desc: "Min 70% confidence · Max 5% per bet" },
    moderate: { color: "var(--purple)", bg: "var(--purple-alpha-bg)", border: "var(--purple-alpha-border)", icon: <Target size={13} />, desc: "Min 55% confidence · Max 10% per bet" },
    aggressive: { color: "var(--red)", bg: "var(--danger-bg)", border: "var(--danger-border)", icon: <Flame size={13} />, desc: "Min 40% confidence · Max 20% per bet" },
  };

  const addLog = (text, col) => {
    setLogs(p => [...p, { text, col }]);
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 50);
  };

  const analyze = async () => {
    if (!matches || matches.length === 0) {
      onNotif("No matches available to analyze.", "error");
      return;
    }
    setAn(true); addLog("[Scan] Running EV analysis across all markets…", "#a78bfa");
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
      addLog(`[Done] Analysis complete. ${recCount} bets recommended.`, "#4ade80");
    } catch (e) {
      onNotif("Analysis failed: " + e.message, "error");
      addLog("[Error] Analysis failed.", "#f87171");
    }
    setAn(false);
  };

  const executeManualCycle = async () => {
    if (!isAuthorized) {
      onNotif("Authorize the agent first before running a cycle!", "error");
      return;
    }
    addLog("[Trigger] Initiating manual agent cycle run on X Layer...", "#00d4ff");
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
        addLog(`[Summary] Bets Placed: ${data.summary.betsPlaced}, Skipped: ${data.summary.skipped}, Errors: ${data.summary.errors}`, "#4ade80");
        if (data.actions && data.actions.length > 0) {
          data.actions.forEach(act => {
            if (act.type === "BET_PLACED") {
              addLog(`[Bet Placed] Match ${act.matchIndex}: Outcome ${act.outcome} | Amount: $${act.amount} USDT | TX: ${act.txHash.slice(0, 12)}...`, "#4ade80");
            } else if (act.type === "SKIPPED") {
              addLog(`[Skipped] Match ${act.matchIndex}: ${act.reasoning}`, "var(--text-muted)");
            } else if (act.type === "ERROR") {
              addLog(`[Error] Match ${act.matchIndex}: ${act.reasoning}`, "#f87171");
            }
          });
        } else {
          addLog("[Cycle] No actions taken by agent.", "var(--text-muted)");
        }
        refetchAgent();
        refetchUsdt();
        onNotif("Agent cycle execution completed successfully!", "success");
      } else {
        addLog(`[Error] Agent cycle failed: ${data.error}`, "#f87171");
        onNotif(`Agent cycle failed: ${data.error}`, "error");
      }
    } catch (e) {
      addLog(`[Error] Network error during execution: ${e.message}`, "#f87171");
      onNotif("Network error during agent execution.", "error");
    } finally {
      setRunningCycle(false);
    }
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 400px",
      gap: 28,
      width: "100%",
      maxWidth: "100%",
      alignItems: "stretch",
    }}>

      {/* ── Left: Config panel ── */}
      <div className="card" style={{
        padding: "32px",
        display: "flex",
        flexDirection: "column",
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
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
              <input type="number" value={budget} min={0.1} step={0.1} onChange={e => setBudget(e.target.value)}
                className="input" style={{ paddingLeft: 36, paddingRight: 60, height: 46, fontSize: 15 }} />
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
                    const success = await topUpBudget(val);
                    if (success) {
                      onNotif(`Topped up agent budget by $${val} USDT!`, "success");
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
                const success = await revokeAgent();
                if (success) {
                  onNotif("Agent authorization revoked!", "success");
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
                const success = await authorizeAgent(numericBudget);
                if (success) {
                  onNotif(`Agent active with $${budget} USDT!`, "success");
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
        minHeight: 520,
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
function PortfolioTab({ address, signer, refetchUsdt, onNotif }) {
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
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 24 }}>
      <section>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          {[
            { label: "Total Wagered", value: `$${fmt(totalBetAmount)}`, icon: <Coins size={16} />, color: "var(--primary)" },
            { label: "Profit / Loss", value: `${totalPnl >= 0 ? "+" : ""}$${fmt(totalPnl)}`, icon: <TrendingUp size={16} />, color: totalPnl >= 0 ? "var(--green)" : "var(--red)" },
            { label: "Claimable", value: `$${fmt(claimable)}`, icon: <Unlock size={16} />, color: "var(--gold)" },
          ].map(s => (
            <div key={s.label} className="stat-card" style={{ background: "var(--card-header-bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 6, color: s.color }}>{s.icon}<span style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{s.label}</span></div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: s.color, fontFamily: "'JetBrains Mono', monospace" }}>{s.value}</div>
            </div>
          ))}
        </div>

        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 18, display: "flex", alignItems: "center", gap: 10 }}>
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
              return (
                <div key={bet.betId} className="card" style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
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
                            onNotif(`Claimed successfully!`, "success");
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
            <button className="btn-ghost" style={{ fontSize: 12, gap: 5 }}>View All <ChevronRight size={13} /></button>
          </div>
        </div>
      </aside>
    </div>
  );
}

// ─── Leaderboard Tab ──────────────────────────────────────────────────────────
function LeaderboardTab() {
  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, fontWeight: 400, letterSpacing: "-0.01em", marginBottom: 6, display: "flex", alignItems: "center", gap: 12 }}>
          <Trophy size={24} style={{ color: "var(--gold)" }} /> Global Leaderboard
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 500 }}>Ranked by on-chain USDT profit · World Cup 2026 · X Layer</p>
      </div>
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "grid", gridTemplateColumns: "48px 1fr 80px 80px", gap: 8, fontSize: 10, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.07em" }}>
          <span>Rank</span><span>Wallet</span><span style={{ textAlign: "center" }}>Win %</span><span style={{ textAlign: "right" }}>Profit</span>
        </div>
        {LEADERBOARD.map(row => (
          <div key={row.rank} style={{
            padding: "16px 20px", borderBottom: "1px solid var(--border)",
            display: "grid", gridTemplateColumns: "48px 1fr 80px 80px", gap: 8,
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
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>{row.addr}</div>
              <div style={{ fontSize: 10, color: "var(--text-muted)" }}>X Layer Testnet · {100 - row.rank * 5} bets</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{row.winRate}%</div>
              <div style={{ height: 3, borderRadius: 2, background: "var(--border-bright)", marginTop: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${row.winRate}%`, background: "linear-gradient(90deg,var(--primary),var(--purple))", borderRadius: 2 }} />
              </div>
            </div>
            <div style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: "var(--green)", fontFamily: "'JetBrains Mono', monospace" }}>
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

  useEffect(() => {
    const saved = localStorage.getItem("goalbet-theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("goalbet-theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const { matches, loading: matchesLoading, refetch: refetchMatches } = useMatches();
  const { balance: usdtBalance, refetch: refetchUsdt } = useUSDT(wallet.address, wallet.provider);

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
          <div style={{ display: "flex", gap: 0, height: 60, alignItems: "center" }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`tab-item ${tab === t.id ? "active" : ""}`}
                style={{ height: "100%", borderRadius: 0 }}>
                {t.icon}{t.label}
              </button>
            ))}
          </div>

          {/* Right actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button onClick={toggleTheme} className="btn-ghost" style={{ padding: "7px 10px", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }} title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="btn-ghost" style={{ padding: "7px 10px", borderRadius: 8 }}>
              <Bell size={15} />
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", background: "var(--primary-alpha-bg)", border: "1px solid var(--primary-alpha-border)", borderRadius: 7 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--primary)", boxShadow: "0 0 6px var(--primary)" }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--primary)", fontFamily: "'JetBrains Mono', monospace" }}>{ACTIVE_NETWORK.name}</span>
            </div>
            {wallet.isConnected ? (
              <button className="btn-ghost" onClick={wallet.disconnect} style={{ gap: 7 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "linear-gradient(135deg,var(--green),var(--primary))", display: "flex", alignItems: "center", justifyContent: "center" }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{shortAddr(wallet.address)}</span>
                <LogOut size={12} />
              </button>
            ) : (
              <ShimmerBtn variant="primary" onClick={wallet.connect}>
                <Wallet size={14} /> {wallet.isConnecting ? "Connecting…" : "Connect Wallet"}
              </ShimmerBtn>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero Stats ── */}
      <div style={{ paddingTop: 64, borderBottom: "1px solid var(--border)", background: "var(--hero-bg)", position: "relative" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "36px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 28 }}>
          {/* Headline */}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Star size={11} style={{ color: "var(--primary)" }} />
              <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>FIFA World Cup 2026 · Prediction Markets</span>
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(34px, 4.5vw, 54px)", fontWeight: 400, letterSpacing: "-0.02em", lineHeight: 1.05, margin: 0 }}>
              Bet On-Chain.
              <span className="text-gradient-hero" style={{ display: "block", fontStyle: "italic" }}>
                Win in USDT.
              </span>
            </h1>
          </div>

          {/* Stats */}
          <div style={{
            display: "flex",
            gap: 0,
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderTop: "1px solid var(--border-bright)",
            boxShadow: theme === "dark" ? "0 20px 48px rgba(0,0,0,0.8)" : "0 20px 48px rgba(15,23,42,0.05)",
            borderRadius: 16,
            overflow: "hidden",
            backdropFilter: "blur(28px)"
          }}>
            {[
              { label: "Total Pool", value: `$${fmtK(totalPool)}`, icon: <Coins size={13} /> },
              { label: "Open Markets", value: `${matches ? matches.filter(m => m.status === 0).length : 0}`, icon: <Activity size={13} /> },
              { label: "Blockchain", value: "X Layer", icon: <Globe size={13} /> },
              { label: "Event", value: "X Cup 2026", icon: <Trophy size={13} /> },
            ].map((s, i, arr) => (
              <div key={s.label} style={{
                padding: "20px 32px",
                textAlign: "center",
                borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
                minWidth: 125,
                position: "relative"
              }}>
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
      <main style={{ width: "100%", maxWidth: 1400, margin: "0 auto", padding: "32px 32px 72px", flex: 1 }}>
        {tab === "matches" && <MatchesTab matches={matches} loading={matchesLoading} onBet={openBet} />}
        {tab === "agent" && <AgentTab address={wallet.address} signer={wallet.signer} matches={matches} usdtBalance={usdtBalance} refetchUsdt={refetchUsdt} onNotif={notify} theme={theme} />}
        {tab === "portfolio" && <PortfolioTab address={wallet.address} signer={wallet.signer} refetchUsdt={refetchUsdt} onNotif={notify} />}
        {tab === "leaderboard" && <LeaderboardTab />}
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "24px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div className="text-gradient-logo" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, fontWeight: 400, letterSpacing: "-0.01em" }}>GoalBet</div>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {["Whitepaper", "Verification", "Odds API", "Support", "Privacy"].map(l => (
              <a key={l} href="#" style={{ fontSize: 12, color: "var(--text-secondary)", textDecoration: "none", fontWeight: 500, transition: "color 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--primary)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text-secondary)"}
              >{l}</a>
            ))}
          </div>
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>© 2026 GoalBet · Secured by X Layer</span>
        </div>
      </footer>

      {/* ── Bet Modal ── */}
      {modal && (
        <BetModal
          match={modal.match}
          initOutcome={modal.outcome}
          onClose={() => setModal(null)}
          signer={wallet.signer}
          theme={theme}
          onSuccess={result => {
            notify(`Bet placed! TX: ${result.txHash.slice(0, 12)}…`, "success");
            refetchMatches();
            refetchUsdt();
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
