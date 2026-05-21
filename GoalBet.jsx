import { useState, useEffect, useCallback } from "react";

// ─── Mock Data (replace with contract calls) ──────────────────────────────────
const MOCK_MATCHES = [
  { id: 0, homeTeam: "Brazil", awayTeam: "Mexico", homeFlag: "🇧🇷", awayFlag: "🇲🇽", kickoff: Date.now() + 86400000 * 1, status: "OPEN", homeOdds: 1.8, drawOdds: 3.2, awayOdds: 4.5, totalPool: 12450, homePool: 7200, drawPool: 2800, awayPool: 2450 },
  { id: 1, homeTeam: "Argentina", awayTeam: "Germany", homeFlag: "🇦🇷", awayFlag: "🇩🇪", kickoff: Date.now() + 86400000 * 2, status: "OPEN", homeOdds: 2.1, drawOdds: 3.0, awayOdds: 3.1, totalPool: 28900, homePool: 11200, drawPool: 8300, awayPool: 9400 },
  { id: 2, homeTeam: "France", awayTeam: "England", homeFlag: "🇫🇷", awayFlag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", kickoff: Date.now() + 86400000 * 3, status: "OPEN", homeOdds: 2.0, drawOdds: 3.3, awayOdds: 3.5, totalPool: 34200, homePool: 15600, drawPool: 9800, awayPool: 8800 },
  { id: 3, homeTeam: "Spain", awayTeam: "Portugal", homeFlag: "🇪🇸", awayFlag: "🇵🇹", kickoff: Date.now() + 86400000 * 4, status: "OPEN", homeOdds: 2.3, drawOdds: 3.1, awayOdds: 2.8, totalPool: 19800, homePool: 8200, drawPool: 5900, awayPool: 5700 },
  { id: 4, homeTeam: "Netherlands", awayTeam: "Italy", homeFlag: "🇳🇱", awayFlag: "🇮🇹", kickoff: Date.now() + 86400000 * 5, status: "OPEN", homeOdds: 2.2, drawOdds: 3.0, awayOdds: 3.0, totalPool: 8700, homePool: 3900, drawPool: 2600, awayPool: 2200 },
];

const MOCK_LEADERBOARD = [
  { rank: 1, address: "0x1a2b...9f0e", profit: 2840, bets: 12, winRate: 75 },
  { rank: 2, address: "0x3c4d...7a8b", profit: 1920, bets: 8, winRate: 62 },
  { rank: 3, address: "0x5e6f...5c6d", profit: 1340, bets: 15, winRate: 60 },
  { rank: 4, address: "0x7g8h...3e4f", profit: 890, bets: 6, winRate: 83 },
  { rank: 5, address: "0x9i0j...1g2h", profit: 520, bets: 9, winRate: 55 },
];

const TEAM_RATINGS = {
  "France": 93, "Brazil": 92, "England": 90, "Spain": 89,
  "Argentina": 88, "Portugal": 87, "Germany": 86, "Netherlands": 85,
  "Italy": 82, "Mexico": 74,
};

// ─── Utility ──────────────────────────────────────────────────────────────────
function formatTime(ms) {
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function shortAddr(addr) {
  if (!addr) return "";
  return addr.slice(0, 6) + "..." + addr.slice(-4);
}

// ─── Countdown ────────────────────────────────────────────────────────────────
function Countdown({ kickoff }) {
  const [remaining, setRemaining] = useState(kickoff - Date.now());
  useEffect(() => {
    const t = setInterval(() => setRemaining(kickoff - Date.now()), 60000);
    return () => clearInterval(t);
  }, [kickoff]);
  return <span>{remaining > 0 ? formatTime(remaining) : "LIVE"}</span>;
}

// ─── Pool Bar ─────────────────────────────────────────────────────────────────
function PoolBar({ homePool, drawPool, awayPool, totalPool }) {
  const hp = ((homePool / totalPool) * 100).toFixed(0);
  const dp = ((drawPool / totalPool) * 100).toFixed(0);
  const ap = ((awayPool / totalPool) * 100).toFixed(0);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: "flex", height: 6, borderRadius: 4, overflow: "hidden", gap: 2 }}>
        <div style={{ width: `${hp}%`, background: "#00d4ff", borderRadius: "4px 0 0 4px" }} />
        <div style={{ width: `${dp}%`, background: "#888" }} />
        <div style={{ width: `${ap}%`, background: "#ff6b35", borderRadius: "0 4px 4px 0" }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "#666" }}>
        <span style={{ color: "#00d4ff" }}>Home {hp}%</span>
        <span>Draw {dp}%</span>
        <span style={{ color: "#ff6b35" }}>Away {ap}%</span>
      </div>
    </div>
  );
}

// ─── Bet Modal ────────────────────────────────────────────────────────────────
function BetModal({ match, onClose, onBet }) {
  const [outcome, setOutcome] = useState(null);
  const [amount, setAmount] = useState(10);
  const [step, setStep] = useState("pick"); // pick | confirm | success

  const outcomeNames = { 1: `${match.homeTeam} Win`, 2: "Draw", 3: `${match.awayTeam} Win` };
  const odds = { 1: match.homeOdds, 2: match.drawOdds, 3: match.awayOdds };
  const potential = outcome ? (amount * odds[outcome]).toFixed(2) : "—";

  const handleConfirm = () => {
    setStep("success");
    onBet({ matchId: match.id, outcome, amount });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      backdropFilter: "blur(8px)"
    }}>
      <div style={{
        background: "#111", border: "1px solid #222", borderRadius: 16,
        padding: 32, width: 420, maxWidth: "90vw", position: "relative"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 16, right: 16, background: "none",
          border: "none", color: "#666", fontSize: 20, cursor: "pointer"
        }}>✕</button>

        {step === "success" ? (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "white", marginBottom: 8 }}>
              Bet Placed!
            </div>
            <div style={{ color: "#666", fontSize: 14, marginBottom: 4 }}>
              ${amount} on {outcomeNames[outcome]}
            </div>
            <div style={{ color: "#00d4ff", fontSize: 13, marginBottom: 20 }}>
              Your Bet Receipt NFT is being minted on X Layer ⛓️
            </div>
            <button onClick={onClose} style={{
              background: "#00d4ff", color: "#000", border: "none", borderRadius: 8,
              padding: "10px 24px", fontWeight: 700, cursor: "pointer", fontSize: 14
            }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "white", marginBottom: 4 }}>
              Place Your Bet
            </div>
            <div style={{ color: "#666", fontSize: 13, marginBottom: 24 }}>
              {match.homeFlag} {match.homeTeam} vs {match.awayTeam} {match.awayFlag}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Pick Outcome</div>
              <div style={{ display: "flex", gap: 8 }}>
                {[1, 2, 3].map(o => (
                  <button key={o} onClick={() => setOutcome(o)} style={{
                    flex: 1, padding: "12px 8px", borderRadius: 10,
                    border: outcome === o ? "2px solid #00d4ff" : "1px solid #222",
                    background: outcome === o ? "rgba(0,212,255,0.1)" : "#1a1a1a",
                    color: outcome === o ? "#00d4ff" : "#888",
                    cursor: "pointer", textAlign: "center", transition: "all 0.2s"
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{outcomeNames[o]}</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{odds[o]}x</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Bet Amount (USDT)</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {[5, 10, 25, 50, 100].map(a => (
                  <button key={a} onClick={() => setAmount(a)} style={{
                    flex: 1, padding: "8px 4px", borderRadius: 8,
                    border: amount === a ? "1px solid #00d4ff" : "1px solid #222",
                    background: amount === a ? "rgba(0,212,255,0.1)" : "#1a1a1a",
                    color: amount === a ? "#00d4ff" : "#666",
                    cursor: "pointer", fontSize: 12, fontWeight: 600
                  }}>${a}</button>
                ))}
              </div>
              <input type="number" value={amount} min={1} max={1000}
                onChange={e => setAmount(Number(e.target.value))}
                style={{
                  width: "100%", padding: "10px 14px", background: "#1a1a1a",
                  border: "1px solid #333", borderRadius: 8, color: "white",
                  fontSize: 16, outline: "none", boxSizing: "border-box"
                }}
              />
            </div>

            {outcome && (
              <div style={{
                background: "#1a1a1a", borderRadius: 10, padding: "12px 16px",
                marginBottom: 20, display: "flex", justifyContent: "space-between",
                border: "1px solid #222"
              }}>
                <div>
                  <div style={{ color: "#666", fontSize: 11 }}>Potential Payout</div>
                  <div style={{ color: "#00d4ff", fontSize: 20, fontWeight: 700 }}>${potential}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ color: "#666", fontSize: 11 }}>Profit</div>
                  <div style={{ color: "#4ade80", fontSize: 20, fontWeight: 700 }}>+${(potential - amount).toFixed(2)}</div>
                </div>
              </div>
            )}

            <button
              disabled={!outcome}
              onClick={step === "pick" ? () => setStep("confirm") : handleConfirm}
              style={{
                width: "100%", padding: "14px", borderRadius: 10,
                background: outcome ? "linear-gradient(135deg, #00d4ff, #7b2ff7)" : "#222",
                color: outcome ? "#000" : "#444", border: "none",
                fontWeight: 700, fontSize: 15, cursor: outcome ? "pointer" : "not-allowed",
                transition: "all 0.2s"
              }}
            >
              {step === "confirm" ? `Confirm — Bet $${amount} →` : "Continue →"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Agent Panel ──────────────────────────────────────────────────────────────
function AgentPanel({ matches }) {
  const [riskLevel, setRiskLevel] = useState("moderate");
  const [budget, setBudget] = useState(100);
  const [isRunning, setIsRunning] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [actions, setActions] = useState([]);

  const RISK_CONFIG = {
    conservative: { minConf: 70, maxBetPct: 5, color: "#4ade80" },
    moderate:     { minConf: 55, maxBetPct: 10, color: "#facc15" },
    aggressive:   { minConf: 40, maxBetPct: 20, color: "#f87171" },
  };

  const analyzeMatches = () => {
    const results = matches.map(m => {
      const homeR = TEAM_RATINGS[m.homeTeam] ?? 65;
      const awayR = TEAM_RATINGS[m.awayTeam] ?? 65;
      const diff = homeR - awayR;
      const homeProb = Math.min(80, Math.max(20, 50 + diff * 0.4 + 5));
      const awayProb = Math.min(80, Math.max(20, 50 - diff * 0.4 - 5));
      const drawProb = Math.max(10, 100 - homeProb - awayProb);

      const homeEV = (homeProb / 100) * m.homeOdds - 1;
      const drawEV  = (drawProb / 100)  * m.drawOdds  - 1;
      const awayEV  = (awayProb / 100)  * m.awayOdds  - 1;

      const best = [
        { outcome: 1, ev: homeEV, prob: homeProb, name: `${m.homeTeam} Win` },
        { outcome: 2, ev: drawEV,  prob: drawProb,  name: "Draw" },
        { outcome: 3, ev: awayEV,  prob: awayProb,  name: `${m.awayTeam} Win` },
      ].sort((a, b) => b.ev - a.ev)[0];

      const conf = Math.min(100, Math.round(best.prob));
      const cfg = RISK_CONFIG[riskLevel];
      const kelly = Math.max(0, best.ev) * 0.25;
      const suggested = Math.min(Math.round(budget * kelly), budget * cfg.maxBetPct / 100, 50);

      return {
        matchId: m.id,
        homeTeam: m.homeTeam,
        awayTeam: m.awayTeam,
        homeFlag: m.homeFlag,
        awayFlag: m.awayFlag,
        recommendation: best.name,
        confidence: conf,
        suggestedAmount: Math.max(1, suggested),
        reasoning: `${best.name} (${best.prob.toFixed(0)}% prob, EV ${(best.ev*100).toFixed(1)}%)`,
        willBet: conf >= cfg.minConf && suggested >= 1,
      };
    });
    return results;
  };

  const handleRun = async () => {
    setIsRunning(true);
    setAnalysis(null);
    setActions([]);
    await new Promise(r => setTimeout(r, 1200));
    const results = analyzeMatches();
    setAnalysis(results);
    setIsRunning(false);

    // Simulate placing bets
    const betActions = [];
    for (const r of results) {
      if (r.willBet) {
        await new Promise(res => setTimeout(res, 600));
        betActions.push({
          type: "BET_PLACED",
          matchId: r.matchId,
          text: `Bet $${r.suggestedAmount} on ${r.recommendation} (${r.homeTeam} vs ${r.awayTeam})`,
          txHash: "0x" + Math.random().toString(16).slice(2, 18) + "...",
        });
        setActions([...betActions]);
      }
    }
  };

  return (
    <div style={{ background: "#0d0d0d", borderRadius: 16, padding: 24, border: "1px solid #1a1a1a" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: "linear-gradient(135deg, #00d4ff22, #7b2ff722)",
          border: "1px solid #00d4ff44",
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
        }}>🤖</div>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: "white" }}>AI Betting Agent</div>
          <div style={{ color: "#555", fontSize: 12 }}>Autonomous match analysis + execution</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span style={{ background: "#0f2", color: "#000", borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 700 }}>● ACTIVE</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Risk Profile</div>
          <div style={{ display: "flex", gap: 6 }}>
            {["conservative", "moderate", "aggressive"].map(r => (
              <button key={r} onClick={() => setRiskLevel(r)} style={{
                flex: 1, padding: "8px 4px", borderRadius: 8, border: riskLevel === r ? `1px solid ${RISK_CONFIG[r].color}` : "1px solid #222",
                background: riskLevel === r ? `${RISK_CONFIG[r].color}22` : "#1a1a1a",
                color: riskLevel === r ? RISK_CONFIG[r].color : "#555",
                cursor: "pointer", fontSize: 10, fontWeight: 600, textTransform: "capitalize"
              }}>{r}</button>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Agent Budget (USDT)</div>
          <input type="number" value={budget} min={10} max={1000}
            onChange={e => setBudget(Number(e.target.value))}
            style={{
              width: "100%", padding: "8px 12px", background: "#1a1a1a",
              border: "1px solid #333", borderRadius: 8, color: "white", fontSize: 14,
              outline: "none", boxSizing: "border-box"
            }}
          />
        </div>
      </div>

      <div style={{
        background: "#111", borderRadius: 10, padding: "12px 16px",
        marginBottom: 16, fontSize: 12, color: "#666", border: "1px solid #1a1a1a"
      }}>
        <span style={{ color: RISK_CONFIG[riskLevel].color, fontWeight: 600 }}>
          {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)} mode:
        </span>{" "}
        Min {RISK_CONFIG[riskLevel].minConf}% confidence required · Max {RISK_CONFIG[riskLevel].maxBetPct}% of budget per bet
      </div>

      <button onClick={handleRun} disabled={isRunning} style={{
        width: "100%", padding: "13px", borderRadius: 10,
        background: isRunning ? "#222" : "linear-gradient(135deg, #00d4ff, #7b2ff7)",
        color: isRunning ? "#555" : "#000", border: "none",
        fontWeight: 700, fontSize: 14, cursor: isRunning ? "not-allowed" : "pointer",
        marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 8
      }}>
        {isRunning ? (
          <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Analyzing matches...</>
        ) : "🤖 Run Agent Cycle"}
      </button>

      {analysis && (
        <div>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Analysis Results</div>
          {analysis.map(r => (
            <div key={r.matchId} style={{
              background: "#111", borderRadius: 10, padding: "12px 14px", marginBottom: 8,
              border: `1px solid ${r.willBet ? "#00d4ff33" : "#1a1a1a"}`,
              display: "flex", alignItems: "center", gap: 12
            }}>
              <div style={{ fontSize: 20 }}>{r.homeFlag}{r.awayFlag}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "white", fontWeight: 600, marginBottom: 2 }}>
                  {r.homeTeam} vs {r.awayTeam}
                </div>
                <div style={{ fontSize: 11, color: "#666" }}>{r.reasoning}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {r.willBet ? (
                  <>
                    <div style={{ color: "#00d4ff", fontSize: 12, fontWeight: 700 }}>${r.suggestedAmount}</div>
                    <div style={{ color: "#555", fontSize: 10 }}>{r.confidence}% conf</div>
                  </>
                ) : (
                  <div style={{ color: "#444", fontSize: 11 }}>SKIP</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {actions.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 11, color: "#555", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Transactions</div>
          {actions.map((a, i) => (
            <div key={i} style={{
              background: "#0a1a0a", border: "1px solid #0f2f0f", borderRadius: 8,
              padding: "10px 14px", marginBottom: 6, display: "flex", alignItems: "center", gap: 10
            }}>
              <span style={{ color: "#4ade80" }}>✓</span>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#4ade80", fontSize: 12 }}>{a.text}</div>
                <div style={{ color: "#555", fontSize: 10 }}>TX: {a.txHash}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Match Card ───────────────────────────────────────────────────────────────
function MatchCard({ match, onBet }) {
  return (
    <div style={{
      background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16,
      padding: 20, transition: "border-color 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "#2a2a2a"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "#1a1a1a"}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "flex-start" }}>
        <span style={{
          background: "#00d4ff22", color: "#00d4ff",
          borderRadius: 6, padding: "3px 10px", fontSize: 10, fontWeight: 700, letterSpacing: 1
        }}>LIVE BETTING</span>
        <span style={{ color: "#555", fontSize: 11 }}>
          ⏱ <Countdown kickoff={match.kickoff} />
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>{match.homeFlag}</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: "white", fontWeight: 700 }}>{match.homeTeam}</div>
        </div>
        <div style={{ textAlign: "center", padding: "0 16px" }}>
          <div style={{ color: "#333", fontSize: 20, fontWeight: 700 }}>VS</div>
          <div style={{ color: "#555", fontSize: 10, marginTop: 4 }}>${(match.totalPool / 1000).toFixed(1)}K pool</div>
        </div>
        <div style={{ textAlign: "center", flex: 1 }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>{match.awayFlag}</div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 15, color: "white", fontWeight: 700 }}>{match.awayTeam}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {[
          { label: match.homeTeam, odds: match.homeOdds, outcome: 1, color: "#00d4ff" },
          { label: "Draw", odds: match.drawOdds, outcome: 2, color: "#888" },
          { label: match.awayTeam, odds: match.awayOdds, outcome: 3, color: "#ff6b35" },
        ].map(opt => (
          <button key={opt.outcome} onClick={() => onBet(match, opt.outcome)} style={{
            flex: 1, padding: "10px 6px", borderRadius: 10,
            border: `1px solid ${opt.color}33`,
            background: `${opt.color}11`,
            color: opt.color, cursor: "pointer", transition: "all 0.15s",
            textAlign: "center"
          }}
            onMouseEnter={e => { e.currentTarget.style.background = `${opt.color}22`; e.currentTarget.style.borderColor = `${opt.color}88`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${opt.color}11`; e.currentTarget.style.borderColor = `${opt.color}33`; }}
          >
            <div style={{ fontSize: 10, marginBottom: 2, opacity: 0.7 }}>{opt.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{opt.odds}x</div>
          </button>
        ))}
      </div>

      <PoolBar {...match} />
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function GoalBet() {
  const [tab, setTab] = useState("matches");
  const [betModal, setBetModal] = useState(null);
  const [connected, setConnected] = useState(false);
  const [userAddress, setUserAddress] = useState("");
  const [myBets, setMyBets] = useState([]);
  const [notification, setNotification] = useState(null);

  const showNotif = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleConnect = () => {
    setConnected(true);
    setUserAddress("0x" + Math.random().toString(16).slice(2, 12) + "..." + Math.random().toString(16).slice(2, 6));
    showNotif("Wallet connected via OKX Wallet ✓");
  };

  const handleBet = (match, preOutcome = null) => {
    if (!connected) { showNotif("Connect your wallet first", "error"); return; }
    setBetModal({ match, preOutcome });
  };

  const handleBetPlaced = ({ matchId, outcome, amount }) => {
    const match = MOCK_MATCHES.find(m => m.id === matchId);
    const names = { 1: `${match.homeTeam} Win`, 2: "Draw", 3: `${match.awayTeam} Win` };
    setMyBets(prev => [...prev, {
      id: prev.length,
      match: `${match.homeTeam} vs ${match.awayTeam}`,
      prediction: names[outcome],
      amount,
      odds: [match.homeOdds, match.drawOdds, match.awayOdds][outcome - 1],
      status: "PENDING",
      txHash: "0x" + Math.random().toString(16).slice(2, 18),
    }]);
  };

  const tabs = [
    { id: "matches", label: "⚽ Matches" },
    { id: "agent", label: "🤖 AI Agent" },
    { id: "mybets", label: "🎯 My Bets" },
    { id: "leaderboard", label: "🏆 Leaderboard" },
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#080808", color: "white",
      fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateY(-20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      {/* Notification */}
      {notification && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: notification.type === "error" ? "#2a0a0a" : "#0a2a0a",
          border: `1px solid ${notification.type === "error" ? "#f87171" : "#4ade80"}`,
          borderRadius: 10, padding: "12px 20px", color: notification.type === "error" ? "#f87171" : "#4ade80",
          fontSize: 13, fontWeight: 600, animation: "slideIn 0.3s ease"
        }}>{notification.msg}</div>
      )}

      {/* Header */}
      <header style={{
        background: "#0a0a0a", borderBottom: "1px solid #1a1a1a",
        padding: "0 24px", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 64, position: "sticky", top: 0, zIndex: 100
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "linear-gradient(135deg, #00d4ff, #7b2ff7)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 700
          }}>⚽</div>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 20, color: "white", lineHeight: 1 }}>GoalBet</div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 1 }}>WORLD CUP 2026 • X LAYER</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "#111", borderRadius: 8, padding: "4px 12px", fontSize: 12, color: "#555", border: "1px solid #1a1a1a" }}>
            <span style={{ color: "#00d4ff" }}>●</span> X Layer Mainnet
          </div>
          {connected ? (
            <div style={{
              background: "#0f2f1f", border: "1px solid #1a5c3a", borderRadius: 8,
              padding: "6px 14px", fontSize: 12, color: "#4ade80", fontWeight: 600
            }}>{userAddress}</div>
          ) : (
            <button onClick={handleConnect} style={{
              background: "linear-gradient(135deg, #00d4ff, #7b2ff7)",
              color: "#000", border: "none", borderRadius: 8,
              padding: "8px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer"
            }}>Connect OKX Wallet</button>
          )}
        </div>
      </header>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(180deg, #0a0a1a 0%, #080808 100%)",
        borderBottom: "1px solid #1a1a1a", padding: "32px 24px",
        textAlign: "center", position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", inset: 0,
          background: "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.06) 0%, transparent 60%)",
          pointerEvents: "none"
        }} />
        <div style={{ fontSize: 11, color: "#00d4ff", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>
          ⚽ FIFA World Cup 2026
        </div>
        <h1 style={{
          fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 5vw, 48px)",
          color: "white", marginBottom: 12, lineHeight: 1.1
        }}>
          Predict. Bet. Win.<br />
          <span style={{ background: "linear-gradient(135deg, #00d4ff, #7b2ff7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            On-Chain.
          </span>
        </h1>
        <p style={{ color: "#555", fontSize: 14, marginBottom: 24 }}>
          Decentralized prediction markets on X Layer · AI-powered betting agent · Bet Receipt NFTs
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
          {[
            { label: "Total Pool", value: "$104K" },
            { label: "Active Bets", value: "2,841" },
            { label: "Matches Live", value: "5" },
            { label: "Chain", value: "X Layer" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: "white" }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "#555" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: "#0a0a0a", borderBottom: "1px solid #1a1a1a", padding: "0 24px", display: "flex", gap: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "14px 20px", background: "none", border: "none",
            borderBottom: tab === t.id ? "2px solid #00d4ff" : "2px solid transparent",
            color: tab === t.id ? "#00d4ff" : "#555",
            cursor: "pointer", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
            transition: "color 0.2s"
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 24px" }}>

        {tab === "matches" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
            {MOCK_MATCHES.map(m => (
              <MatchCard key={m.id} match={m} onBet={(match) => handleBet(match)} />
            ))}
          </div>
        )}

        {tab === "agent" && (
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "white", marginBottom: 6 }}>AI Betting Agent</h2>
              <p style={{ color: "#555", fontSize: 14 }}>
                Set your risk profile and budget. The agent analyzes all open matches using historical team ratings,
                Kelly criterion sizing, and expected value calculations — then places bets autonomously on X Layer.
              </p>
            </div>
            <AgentPanel matches={MOCK_MATCHES} />
          </div>
        )}

        {tab === "mybets" && (
          <div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "white", marginBottom: 20 }}>My Bets</h2>
            {myBets.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "60px 20px",
                border: "1px dashed #222", borderRadius: 16, color: "#444"
              }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                <div style={{ fontSize: 16, marginBottom: 6 }}>No bets yet</div>
                <div style={{ fontSize: 13 }}>Go to Matches and place your first bet</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {myBets.map(b => (
                  <div key={b.id} style={{
                    background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 12,
                    padding: "16px 20px", display: "flex", alignItems: "center", gap: 16
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: "white", marginBottom: 3 }}>{b.match}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>
                        Predicted: <span style={{ color: "#00d4ff" }}>{b.prediction}</span> · {b.odds}x odds
                      </div>
                      <div style={{ fontSize: 10, color: "#444", marginTop: 3 }}>TX: {b.txHash}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: "white", fontWeight: 700 }}>${b.amount}</div>
                      <div style={{ color: "#4ade80", fontSize: 12 }}>Pot. ${(b.amount * b.odds).toFixed(2)}</div>
                      <div style={{ background: "#1a2a1a", color: "#4ade80", borderRadius: 20, padding: "2px 8px", fontSize: 10, marginTop: 4 }}>
                        {b.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "leaderboard" && (
          <div style={{ maxWidth: 700, margin: "0 auto" }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, color: "white", marginBottom: 6 }}>Leaderboard</h2>
            <p style={{ color: "#555", fontSize: 14, marginBottom: 20 }}>Top predictors this tournament</p>
            <div style={{ background: "#0d0d0d", border: "1px solid #1a1a1a", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 100px 80px 80px", padding: "10px 20px", borderBottom: "1px solid #1a1a1a" }}>
                {["#", "Wallet", "Profit", "Bets", "Win Rate"].map(h => (
                  <div key={h} style={{ fontSize: 11, color: "#444", textTransform: "uppercase", letterSpacing: 1 }}>{h}</div>
                ))}
              </div>
              {MOCK_LEADERBOARD.map((l, i) => (
                <div key={l.rank} style={{
                  display: "grid", gridTemplateColumns: "48px 1fr 100px 80px 80px",
                  padding: "14px 20px", borderBottom: i < MOCK_LEADERBOARD.length - 1 ? "1px solid #111" : "none",
                  alignItems: "center"
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                    background: l.rank === 1 ? "#ffd70022" : l.rank === 2 ? "#c0c0c022" : "#cd7f3222",
                    border: `1px solid ${l.rank === 1 ? "#ffd700" : l.rank === 2 ? "#c0c0c0" : "#cd7f32"}44`,
                    fontSize: 12, fontWeight: 700,
                    color: l.rank === 1 ? "#ffd700" : l.rank === 2 ? "#c0c0c0" : "#cd7f32"
                  }}>{l.rank}</div>
                  <div style={{ fontFamily: "monospace", fontSize: 13, color: "#888" }}>{l.address}</div>
                  <div style={{ color: "#4ade80", fontWeight: 700 }}>+${l.profit.toLocaleString()}</div>
                  <div style={{ color: "#666", fontSize: 13 }}>{l.bets}</div>
                  <div style={{ color: l.winRate >= 70 ? "#4ade80" : "#facc15", fontSize: 13, fontWeight: 600 }}>{l.winRate}%</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid #1a1a1a", padding: "20px 24px", marginTop: 40,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        flexWrap: "wrap", gap: 12
      }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", color: "#444", fontSize: 14 }}>GoalBet × X Layer</div>
        <div style={{ color: "#333", fontSize: 12 }}>
          Built for X Cup Hackathon 2026 · Deployed on{" "}
          <a href="https://www.oklink.com/x-layer" target="_blank" rel="noreferrer"
            style={{ color: "#555", textDecoration: "none" }}>X Layer</a>
        </div>
      </footer>

      {/* Bet Modal */}
      {betModal && (
        <BetModal
          match={betModal.match}
          onClose={() => setBetModal(null)}
          onBet={handleBetPlaced}
        />
      )}
    </div>
  );
}
