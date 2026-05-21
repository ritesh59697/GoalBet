import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACTS, ACTIVE_NETWORK, USDT_DECIMALS, OUTCOME_LABELS, MARKET_STATUS } from "../utils/config";
import { PREDICTION_MARKET_ABI } from "../utils/abis";

export function useUserBets(userAddress) {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPnl, setTotalPnl] = useState(0);

  const fetchBets = useCallback(async () => {
    if (!userAddress) { setBets([]); return; }
    setLoading(true);

    try {
      const provider = new ethers.JsonRpcProvider(ACTIVE_NETWORK.rpcUrl);
      const contract = new ethers.Contract(CONTRACTS.PREDICTION_MARKET, PREDICTION_MARKET_ABI, provider);

      const matchCount = Number(await contract.getMatchCount());
      const allBets = [];

      // Fetch bets for each match in parallel
      await Promise.all(
        Array.from({ length: matchCount }, async (_, matchIndex) => {
          const betIds = await contract.getUserBetsForMatch(matchIndex, userAddress);
          if (!betIds.length) return;

          const matchData = await contract.getMatch(matchIndex);
          const matchStatus = Number(matchData.status);
          const matchResult = Number(matchData.result);
          const totalPool = Number(ethers.formatUnits(matchData.totalPool, USDT_DECIMALS));

          for (const betIdRaw of betIds) {
            const betId = Number(betIdRaw);
            const bet = await contract.getBet(betId);
            const outcome = Number(bet.outcome);
            const amount = Number(ethers.formatUnits(bet.amount, USDT_DECIMALS));

            // Calculate potential payout
            const winningPool = Number(ethers.formatUnits(matchData.outcomePools[outcome], USDT_DECIMALS));
            const netPool = totalPool * (1 - 0.02); // 2% fee
            const potentialPayout = winningPool > 0 ? (amount / winningPool) * netPool : 0;

            const isWinner = matchStatus === 2 && matchResult === outcome;
            const canClaim = (isWinner || matchStatus === 3) && !bet.claimed;

            allBets.push({
              betId,
              matchIndex,
              homeTeam: matchData.homeTeam,
              awayTeam: matchData.awayTeam,
              outcome,
              outcomeName: OUTCOME_LABELS[outcome] || "Unknown",
              amount,
              potentialPayout: Math.round(potentialPayout * 100) / 100,
              claimed: bet.claimed,
              isAgentBet: bet.isAgentBet,
              timestamp: Number(bet.timestamp) * 1000,
              matchStatus,
              matchResult,
              isWinner,
              canClaim,
            });
          }
        })
      );

      // Sort newest first
      allBets.sort((a, b) => b.timestamp - a.timestamp);
      setBets(allBets);

      // Calculate P&L
      const claimed = allBets.filter(b => b.claimed);
      const pnl = claimed.reduce((acc, b) => acc + b.potentialPayout - b.amount, 0);
      setTotalPnl(Math.round(pnl * 100) / 100);

    } catch (err) {
      console.error("fetchBets error:", err);
    } finally {
      setLoading(false);
    }
  }, [userAddress]);

  useEffect(() => {
    fetchBets();
  }, [fetchBets]);

  const pendingBets    = bets.filter(b => b.matchStatus === 0 || b.matchStatus === 1);
  const claimableBets  = bets.filter(b => b.canClaim);
  const settledBets    = bets.filter(b => b.matchStatus === 2 || b.matchStatus === 3);
  const totalBetAmount = bets.reduce((acc, b) => acc + b.amount, 0);

  return {
    bets, loading, totalPnl, totalBetAmount,
    pendingBets, claimableBets, settledBets,
    refetch: fetchBets,
  };
}
