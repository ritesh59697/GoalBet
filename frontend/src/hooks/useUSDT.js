import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACTS, ACTIVE_NETWORK, USDT_DECIMALS, runWithRpcFallback } from "../utils/config";
import { ERC20_ABI } from "../utils/abis";

export function useUSDT(userAddress, provider) {
  const [balance, setBalance] = useState(0);
  const [allowance, setAllowance] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchBalances = useCallback(async () => {
    if (!userAddress) { setBalance(0); setAllowance(0); return; }
    setLoading(true);
    try {
      if (provider) {
        const usdt = new ethers.Contract(CONTRACTS.USDT, ERC20_ABI, provider);
        const [bal, allow] = await Promise.all([
          usdt.balanceOf(userAddress),
          usdt.allowance(userAddress, CONTRACTS.PREDICTION_MARKET),
        ]);
        setBalance(Number(ethers.formatUnits(bal, USDT_DECIMALS)));
        setAllowance(Number(ethers.formatUnits(allow, USDT_DECIMALS)));
      } else {
        await runWithRpcFallback(async (p) => {
          const usdt = new ethers.Contract(CONTRACTS.USDT, ERC20_ABI, p);
          const [bal, allow] = await Promise.all([
            usdt.balanceOf(userAddress),
            usdt.allowance(userAddress, CONTRACTS.PREDICTION_MARKET),
          ]);
          setBalance(Number(ethers.formatUnits(bal, USDT_DECIMALS)));
          setAllowance(Number(ethers.formatUnits(allow, USDT_DECIMALS)));
        });
      }
    } catch (err) {
      console.error("fetchBalances error:", err);
    } finally {
      setLoading(false);
    }
  }, [userAddress, provider]);

  useEffect(() => {
    fetchBalances();
    const interval = setInterval(fetchBalances, 15_000);
    return () => clearInterval(interval);
  }, [fetchBalances]);

  const hasEnough = (amount) => balance >= amount;
  const isApproved = (amount) => allowance >= amount;

  return { balance, allowance, loading, hasEnough, isApproved, refetch: fetchBalances };
}
