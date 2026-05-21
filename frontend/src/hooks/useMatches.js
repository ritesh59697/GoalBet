import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACTS, ACTIVE_NETWORK, TEAM_FLAGS, USDT_DECIMALS } from "../utils/config";
import { PREDICTION_MARKET_ABI } from "../utils/abis";



export function useMatches() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new ethers.JsonRpcProvider(ACTIVE_NETWORK.rpcUrl);
      const contract = new ethers.Contract(
        CONTRACTS.PREDICTION_MARKET,
        PREDICTION_MARKET_ABI,
        provider
      );

      const count = Number(await contract.getMatchCount());
      const results = [];

      // Batch fetch all matches + odds in parallel
      await Promise.all(
        Array.from({ length: count }, async (_, i) => {
          const [m, odds] = await Promise.all([
            contract.getMatch(i),
            contract.getOdds(i),
          ]);

          const totalPool = Number(ethers.formatUnits(m.totalPool, USDT_DECIMALS));
          const homePool  = Number(ethers.formatUnits(m.outcomePools[1], USDT_DECIMALS));
          const drawPool  = Number(ethers.formatUnits(m.outcomePools[2], USDT_DECIMALS));
          const awayPool  = Number(ethers.formatUnits(m.outcomePools[3], USDT_DECIMALS));

          // odds from contract are in basis points (10000 = 1x)
          const toDecimal = (bp) => Math.round((Number(bp) / 10000) * 100) / 100;

          results[i] = {
            index: i,
            homeTeam: m.homeTeam,
            awayTeam: m.awayTeam,
            homeFlag: TEAM_FLAGS[m.homeTeam] || "🏳️",
            awayFlag: TEAM_FLAGS[m.awayTeam] || "🏳️",
            matchId: m.matchId,
            kickoffTime: Number(m.kickoffTime) * 1000,
            totalPool,
            homePool,
            drawPool,
            awayPool,
            result: Number(m.result),
            status: Number(m.status),
            odds: {
              home: toDecimal(odds.homeOdds),
              draw: toDecimal(odds.drawOdds),
              away: toDecimal(odds.awayOdds),
            },
          };
        })
      );

      setMatches(results.filter(Boolean));
    } catch (err) {
      console.error("fetchMatches error:", err);
      setError(err.message || "Failed to load matches");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    // Refresh odds every 30s
    const interval = setInterval(fetchMatches, 30_000);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  return { matches, loading, error, refetch: fetchMatches };
}
