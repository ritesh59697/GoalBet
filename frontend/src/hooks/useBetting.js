import { useState, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACTS, USDT_DECIMALS } from "../utils/config";
import { PREDICTION_MARKET_ABI, ERC20_ABI } from "../utils/abis";

export function useBetting(signer) {
  const [status, setStatus] = useState("idle");
  const [error, setError]   = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const reset = () => { setStatus("idle"); setError(null); };

  // ─── Check & request USDT approval ───────────────────────────────────────
  const ensureApproval = useCallback(async (amountUsdt) => {
    if (!signer) throw new Error("Wallet not connected");
    const usdt = new ethers.Contract(CONTRACTS.USDT, ERC20_ABI, signer);
    const address = await signer.getAddress();
    const amountWei = ethers.parseUnits(amountUsdt.toString(), USDT_DECIMALS);

    const allowance = await usdt.allowance(address, CONTRACTS.PREDICTION_MARKET);
    if (allowance >= amountWei) return; // Already approved

    setStatus("approving");
    // Approve max to avoid repeated approvals
    const tx = await usdt.approve(CONTRACTS.PREDICTION_MARKET, ethers.MaxUint256);
    await tx.wait();
  }, [signer]);

  // ─── Place a bet ──────────────────────────────────────────────────────────
  const placeBet = useCallback(async (
    matchIndex,
    outcome,
    amountUsdt
  ) => {
    if (!signer) { setError("Connect your wallet first"); return null; }
    setError(null);

    try {
      await ensureApproval(amountUsdt);
      setStatus("betting");

      const market = new ethers.Contract(CONTRACTS.PREDICTION_MARKET, PREDICTION_MARKET_ABI, signer);
      const amountWei = ethers.parseUnits(amountUsdt.toString(), USDT_DECIMALS);

      const tx = await market.placeBet(matchIndex, outcome, amountWei);
      const receipt = await tx.wait();

      // Parse BetPlaced event to get betId
      const iface = new ethers.Interface(PREDICTION_MARKET_ABI);
      let betId = 0;
      for (const log of receipt.logs) {
        try {
          const parsed = iface.parseLog(log);
          if (parsed?.name === "BetPlaced") {
            betId = Number(parsed.args.betId);
            break;
          }
        } catch {}
      }

      const result = { betId, txHash: receipt.hash };
      setLastResult(result);
      setStatus("success");
      return result;

    } catch (err) {
      const msg = err?.reason || err?.message || "Transaction failed";
      setError(msg.includes("user rejected") ? "Transaction cancelled" : msg);
      setStatus("error");
      return null;
    }
  }, [signer, ensureApproval]);

  // ─── Claim winnings for a single bet ─────────────────────────────────────
  const claimWinnings = useCallback(async (betId) => {
    if (!signer) { setError("Connect your wallet first"); return null; }
    setError(null);
    setStatus("claiming");

    try {
      const market = new ethers.Contract(CONTRACTS.PREDICTION_MARKET, PREDICTION_MARKET_ABI, signer);
      const tx = await market.claimWinnings(betId);
      const receipt = await tx.wait();
      setStatus("success");
      return receipt.hash;
    } catch (err) {
      const msg = err?.reason || err?.message || "Claim failed";
      setError(msg.includes("user rejected") ? "Transaction cancelled" : msg);
      setStatus("error");
      return null;
    }
  }, [signer]);

  // ─── Claim all winnings for a match ──────────────────────────────────────
  const claimAll = useCallback(async (matchIndex) => {
    if (!signer) { setError("Connect your wallet first"); return null; }
    setError(null);
    setStatus("claiming");

    try {
      const market = new ethers.Contract(CONTRACTS.PREDICTION_MARKET, PREDICTION_MARKET_ABI, signer);
      const tx = await market.claimAll(matchIndex);
      const receipt = await tx.wait();
      setStatus("success");
      return receipt.hash;
    } catch (err) {
      const msg = err?.reason || err?.message || "Claim failed";
      setError(msg.includes("user rejected") ? "Transaction cancelled" : msg);
      setStatus("error");
      return null;
    }
  }, [signer]);

  // ─── Simulate payout before betting (read-only) ───────────────────────────
  const simulatePayout = useCallback(async (
    matchIndex,
    outcome,
    amountUsdt
  ) => {
    try {
      const provider = signer?.provider || new ethers.JsonRpcProvider(
        process.env.NEXT_PUBLIC_RPC_URL || "https://rpc.xlayer.tech"
      );
      const market = new ethers.Contract(CONTRACTS.PREDICTION_MARKET, PREDICTION_MARKET_ABI, provider);
      const amountWei = ethers.parseUnits(amountUsdt.toString(), USDT_DECIMALS);
      const payout = await market.getPotentialPayout(matchIndex, outcome, amountWei);
      return Number(ethers.formatUnits(payout, USDT_DECIMALS));
    } catch {
      return 0;
    }
  }, [signer]);

  return { status, error, lastResult, placeBet, claimWinnings, claimAll, simulatePayout, reset };
}
