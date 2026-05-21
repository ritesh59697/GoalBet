/**
 * GoalBet AI Agent
 * Analyzes World Cup match data and places bets on behalf of users
 * Integrates with X Layer via ethers.js
 */

import { ethers } from "ethers";
import axios from "axios";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface UserProfile {
  address: string;
  riskLevel: "conservative" | "moderate" | "aggressive";
  budget: number; // USDT remaining
  maxBetPercent: number; // % of budget per bet
}

export interface MatchAnalysis {
  matchIndex: number;
  homeTeam: string;
  awayTeam: string;
  recommendation: {
    outcome: 1 | 2 | 3; // 1=Home, 2=Draw, 3=Away
    confidence: number;  // 0-100
    suggestedAmount: number; // USDT
    reasoning: string;
  };
  historicalData: {
    homeWinRate: number;
    drawRate: number;
    awayWinRate: number;
    formScore: { home: number; away: number };
    headToHead: { homeWins: number; draws: number; awayWins: number };
  };
}

export interface AgentAction {
  type: "BET_PLACED" | "SKIPPED" | "ERROR";
  matchIndex: number;
  outcome?: number;
  amount?: number;
  txHash?: string;
  reasoning: string;
  timestamp: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const RISK_PROFILES = {
  conservative: { minConfidence: 70, maxBetPercent: 0.05, outcomeMultiplier: 0.8 },
  moderate:     { minConfidence: 55, maxBetPercent: 0.10, outcomeMultiplier: 1.0 },
  aggressive:   { minConfidence: 40, maxBetPercent: 0.20, outcomeMultiplier: 1.2 },
};

// FIFA team strength ratings (0-100 scale, updated for 2026)
const TEAM_RATINGS: Record<string, number> = {
  "France": 93, "Brazil": 92, "England": 90, "Spain": 89,
  "Argentina": 88, "Portugal": 87, "Germany": 86, "Netherlands": 85,
  "Belgium": 83, "Italy": 82, "Croatia": 80, "Uruguay": 79,
  "USA": 75, "Mexico": 74, "Japan": 73, "Morocco": 72,
  "Senegal": 70, "Australia": 68, "South Korea": 67, "Poland": 66,
};

// ─── GoalBet Agent Class ──────────────────────────────────────────────────────

export class GoalBetAgent {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private marketContract: ethers.Contract;
  private marketABI: any[];
  private actionLog: AgentAction[] = [];

  constructor(
    rpcUrl: string,
    agentPrivateKey: string,
    marketAddress: string,
    marketABI: any[]
  ) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.wallet = new ethers.Wallet(agentPrivateKey, this.provider);
    this.marketABI = marketABI;
    this.marketContract = new ethers.Contract(marketAddress, marketABI, this.wallet);
  }

  // ─── Core: Analyze a match ─────────────────────────────────────────────

  async analyzeMatch(matchIndex: number, profile: UserProfile): Promise<MatchAnalysis | null> {
    try {
      const matchData = await this.marketContract.getMatch(matchIndex);
      const { homeTeam, awayTeam, status } = matchData;

      if (status !== 0n) return null; // Only analyze OPEN markets

      const historicalData = this.getHistoricalData(homeTeam, awayTeam);
      const [contractHomeOdds, contractDrawOdds, contractAwayOdds] =
        await this.marketContract.getOdds(matchIndex);

      const recommendation = this.computeRecommendation(
        homeTeam,
        awayTeam,
        historicalData,
        Number(contractHomeOdds),
        Number(contractDrawOdds),
        Number(contractAwayOdds),
        profile
      );

      return {
        matchIndex,
        homeTeam,
        awayTeam,
        recommendation,
        historicalData,
      };
    } catch (err) {
      console.error(`Error analyzing match ${matchIndex}:`, err);
      return null;
    }
  }

  // ─── Historical + form data ────────────────────────────────────────────

  private getHistoricalData(homeTeam: string, awayTeam: string) {
    const homeRating = TEAM_RATINGS[homeTeam] ?? 65;
    const awayRating = TEAM_RATINGS[awayTeam] ?? 65;
    const ratingDiff = homeRating - awayRating;

    // Sigmoid-based probability model
    const homeWinRate = Math.round(50 + ratingDiff * 0.4 + 5); // +5 home advantage
    const awayWinRate = Math.round(50 - ratingDiff * 0.4 - 5);
    const drawRate = Math.max(10, 100 - homeWinRate - awayWinRate);

    const normalize = (h: number, d: number, a: number) => {
      const total = h + d + a;
      return { h: Math.round(h/total*100), d: Math.round(d/total*100), a: Math.round(a/total*100) };
    };

    const norm = normalize(homeWinRate, drawRate, awayWinRate);

    return {
      homeWinRate: norm.h,
      drawRate: norm.d,
      awayWinRate: norm.a,
      formScore: {
        home: Math.round(homeRating / 10),
        away: Math.round(awayRating / 10),
      },
      headToHead: {
        homeWins: Math.round(norm.h / 10),
        draws: Math.round(norm.d / 10),
        awayWins: Math.round(norm.a / 10),
      },
    };
  }

  // ─── Recommendation engine ─────────────────────────────────────────────

  private computeRecommendation(
    homeTeam: string,
    awayTeam: string,
    hist: MatchAnalysis["historicalData"],
    contractHomeOdds: number,
    contractDrawOdds: number,
    contractAwayOdds: number,
    profile: UserProfile
  ): MatchAnalysis["recommendation"] {
    const riskConfig = RISK_PROFILES[profile.riskLevel];

    // Expected value calculation: EV = (probability * odds) - 1
    // Odds are in basis points (10000 = 1x)
    const homeEV = (hist.homeWinRate / 100) * (contractHomeOdds / 10000) - 1;
    const drawEV  = (hist.drawRate / 100)    * (contractDrawOdds / 10000) - 1;
    const awayEV  = (hist.awayWinRate / 100) * (contractAwayOdds / 10000) - 1;

    // Pick best EV
    const outcomes = [
      { outcome: 1 as const, ev: homeEV, prob: hist.homeWinRate, label: `${homeTeam} win` },
      { outcome: 2 as const, ev: drawEV,  prob: hist.drawRate,    label: "Draw" },
      { outcome: 3 as const, ev: awayEV,  prob: hist.awayWinRate, label: `${awayTeam} win` },
    ];

    outcomes.sort((a, b) => b.ev - a.ev);
    const best = outcomes[0];

    // Kelly criterion for bet sizing (conservative fraction)
    const kellyFraction = Math.max(0, best.ev) * riskConfig.outcomeMultiplier * 0.25;
    const maxBet = profile.budget * riskConfig.maxBetPercent;
    const suggestedAmount = Math.min(
      Math.round(profile.budget * kellyFraction * 100) / 100,
      maxBet,
      100 // hard cap 100 USDT per bet
    );

    const confidence = Math.min(100, Math.round(best.prob * riskConfig.outcomeMultiplier));

    const reasoning = [
      `${best.label} has ${best.prob}% historical probability.`,
      `Expected value: ${(best.ev * 100).toFixed(1)}%.`,
      `Current market odds: ${(contractHomeOdds/10000).toFixed(2)}x / ${(contractDrawOdds/10000).toFixed(2)}x / ${(contractAwayOdds/10000).toFixed(2)}x.`,
      `Risk profile: ${profile.riskLevel}. Kelly sizing: ${(kellyFraction*100).toFixed(1)}% of budget.`,
    ].join(" ");

    return {
      outcome: best.outcome,
      confidence,
      suggestedAmount: Math.max(1, suggestedAmount), // min 1 USDT
      reasoning,
    };
  }

  // ─── Execute: Place bet on-chain ───────────────────────────────────────

  async executeBet(
    user: UserProfile,
    analysis: MatchAnalysis
  ): Promise<AgentAction> {
    const riskConfig = RISK_PROFILES[user.riskLevel];
    const { recommendation, matchIndex, homeTeam, awayTeam } = analysis;

    // Skip if confidence too low
    if (recommendation.confidence < riskConfig.minConfidence) {
      return {
        type: "SKIPPED",
        matchIndex,
        reasoning: `Confidence ${recommendation.confidence}% below threshold ${riskConfig.minConfidence}% for ${user.riskLevel} profile.`,
        timestamp: Date.now(),
      };
    }

    // Skip if suggested amount too low
    if (recommendation.suggestedAmount < 1) {
      return {
        type: "SKIPPED",
        matchIndex,
        reasoning: `Suggested amount $${recommendation.suggestedAmount} too low.`,
        timestamp: Date.now(),
      };
    }

    try {
      const amountInUnits = ethers.parseUnits(
        recommendation.suggestedAmount.toString(),
        6 // USDT decimals
      );

      const tx = await this.marketContract.agentPlaceBet(
        user.address,
        matchIndex,
        recommendation.outcome,
        amountInUnits,
        { gasLimit: 300000 }
      );

      const receipt = await tx.wait();

      const action: AgentAction = {
        type: "BET_PLACED",
        matchIndex,
        outcome: recommendation.outcome,
        amount: recommendation.suggestedAmount,
        txHash: receipt.hash,
        reasoning: recommendation.reasoning,
        timestamp: Date.now(),
      };

      this.actionLog.push(action);
      console.log(`✅ Bet placed: ${homeTeam} vs ${awayTeam} — ${recommendation.suggestedAmount} USDT | TX: ${receipt.hash}`);
      return action;

    } catch (err: any) {
      const action: AgentAction = {
        type: "ERROR",
        matchIndex,
        reasoning: `Contract call failed: ${err.message}`,
        timestamp: Date.now(),
      };
      this.actionLog.push(action);
      console.error(`❌ Bet failed for match ${matchIndex}:`, err.message);
      return action;
    }
  }

  // ─── Run full agent cycle ──────────────────────────────────────────────

  async runCycle(users: UserProfile[]): Promise<AgentAction[]> {
    console.log(`\n🤖 GoalBet Agent Cycle — ${new Date().toISOString()}`);
    const actions: AgentAction[] = [];

    const matchCount = await this.marketContract.getMatchCount();
    console.log(`📊 Total matches: ${matchCount}`);

    for (const user of users) {
      if (user.budget < 1) {
        console.log(`⏭️  Skipping ${user.address} — insufficient budget`);
        continue;
      }

      for (let i = 0; i < Number(matchCount); i++) {
        const analysis = await this.analyzeMatch(i, user);
        if (!analysis) continue;

        const action = await this.executeBet(user, analysis);
        actions.push(action);

        // Update budget estimate after bet
        if (action.type === "BET_PLACED" && action.amount) {
          user.budget -= action.amount;
        }
      }
    }

    return actions;
  }

  getActionLog(): AgentAction[] {
    return this.actionLog;
  }
}

// ─── API Route Handler (for Next.js) ──────────────────────────────────────────

export async function getAgentAnalysis(
  matchIndex: number,
  homeTeam: string,
  awayTeam: string,
  riskLevel: "conservative" | "moderate" | "aggressive",
  budget: number,
  contractOdds: { home: number; draw: number; away: number }
): Promise<{
  recommendation: { outcome: number; outcomeName: string; confidence: number; suggestedAmount: number; reasoning: string };
  historicalData: any;
}> {
  const TEAM_RATINGS_LOCAL: Record<string, number> = {
    "France": 93, "Brazil": 92, "England": 90, "Spain": 89,
    "Argentina": 88, "Portugal": 87, "Germany": 86, "Netherlands": 85,
    "Belgium": 83, "Italy": 82, "Croatia": 80, "Uruguay": 79,
    "USA": 75, "Mexico": 74, "Japan": 73, "Morocco": 72,
    "Senegal": 70, "Australia": 68, "South Korea": 67, "Poland": 66,
  };

  const homeRating = TEAM_RATINGS_LOCAL[homeTeam] ?? 65;
  const awayRating = TEAM_RATINGS_LOCAL[awayTeam] ?? 65;
  const ratingDiff = homeRating - awayRating;

  const homeWinProb = Math.min(85, Math.max(15, 50 + ratingDiff * 0.4 + 5));
  const awayWinProb = Math.min(85, Math.max(15, 50 - ratingDiff * 0.4 - 5));
  const drawProb = Math.max(10, 100 - homeWinProb - awayWinProb);

  const riskConfig = RISK_PROFILES[riskLevel];

  const homeEV = (homeWinProb / 100) * (contractOdds.home / 10000) - 1;
  const drawEV  = (drawProb / 100)    * (contractOdds.draw / 10000) - 1;
  const awayEV  = (awayWinProb / 100) * (contractOdds.away / 10000) - 1;

  const outcomes = [
    { outcome: 1, ev: homeEV, prob: homeWinProb, label: `${homeTeam} Win` },
    { outcome: 2, ev: drawEV,  prob: drawProb,    label: "Draw" },
    { outcome: 3, ev: awayEV,  prob: awayWinProb, label: `${awayTeam} Win` },
  ].sort((a, b) => b.ev - a.ev);

  const best = outcomes[0];
  const kellyFraction = Math.max(0, best.ev) * riskConfig.outcomeMultiplier * 0.25;
  const suggestedAmount = Math.min(
    Math.max(1, Math.round(budget * kellyFraction)),
    budget * riskConfig.maxBetPercent,
    100
  );

  return {
    recommendation: {
      outcome: best.outcome,
      outcomeName: best.label,
      confidence: Math.min(100, Math.round(best.prob * riskConfig.outcomeMultiplier)),
      suggestedAmount,
      reasoning: `${best.label} has ${best.prob.toFixed(0)}% historical win probability. EV: ${(best.ev * 100).toFixed(1)}%. Based on FIFA ratings: ${homeTeam} (${homeRating}) vs ${awayTeam} (${awayRating}).`,
    },
    historicalData: {
      homeWinRate: Math.round(homeWinProb),
      drawRate: Math.round(drawProb),
      awayWinRate: Math.round(awayWinProb),
      homeRating,
      awayRating,
    },
  };
}
