// frontend/src/hooks/useWallet.js
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { ACTIVE_NETWORK } from "../utils/config";

const INITIAL_STATE = {
  address: null,
  provider: null,
  signer: null,
  chainId: null,
  isConnected: false,
  isCorrectNetwork: false,
  isConnecting: false,
  error: null,
};

export function useWallet() {
  const [state, setState] = useState(INITIAL_STATE);

  // ─── Detect provider (window.ethereum first as standard, fallback to okxwallet) ───
  const getEthereumProvider = () => {
    if (typeof window === "undefined") return null;
    // Prioritize standard window.ethereum (active user-preferred wallet e.g. Rabby, MetaMask, OKX)
    if (window.ethereum) return window.ethereum;
    // Fallback to OKX Wallet specific window.okxwallet if window.ethereum not present
    if (window.okxwallet) return window.okxwallet;
    return null;
  };

  // ─── Switch / add X Layer network ────────────────────────────────────────
  const switchToXLayer = useCallback(async (ethereum) => {
    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: ACTIVE_NETWORK.chainIdHex }],
      });
      return true;
    } catch (switchError) {
      // Chain not added yet — add it
      if (switchError.code === 4902) {
        try {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: ACTIVE_NETWORK.chainIdHex,
              chainName: ACTIVE_NETWORK.name,
              rpcUrls: [ACTIVE_NETWORK.rpcUrl],
              blockExplorerUrls: [ACTIVE_NETWORK.explorerUrl],
              nativeCurrency: ACTIVE_NETWORK.nativeCurrency,
            }],
          });
          return true;
        } catch {
          return false;
        }
      }
      return false;
    }
  }, []);

  // ─── Connect wallet ───────────────────────────────────────────────────────
  const connect = useCallback(async () => {
    const ethereum = getEthereumProvider();
    if (!ethereum) {
      setState(s => ({ ...s, error: "No wallet found. Install OKX Wallet or MetaMask." }));
      return;
    }

    setState(s => ({ ...s, isConnecting: true, error: null }));

    try {
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      if (!accounts.length) throw new Error("No accounts returned");

      const chainIdHex = await ethereum.request({ method: "eth_chainId" });
      const chainId = parseInt(chainIdHex, 16);

      // Switch to X Layer if needed
      if (chainId !== ACTIVE_NETWORK.chainId) {
        const switched = await switchToXLayer(ethereum);
        if (!switched) {
          setState(s => ({ ...s, isConnecting: false, error: "Please switch to X Layer network." }));
          return;
        }
      }

      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const network = await provider.getNetwork();

      setState({
        address,
        provider,
        signer,
        chainId: Number(network.chainId),
        isConnected: true,
        isCorrectNetwork: Number(network.chainId) === ACTIVE_NETWORK.chainId,
        isConnecting: false,
        error: null,
      });
    } catch (err) {
      setState(s => ({
        ...s,
        isConnecting: false,
        error: err.message || "Failed to connect wallet",
      }));
    }
  }, [switchToXLayer]);

  // ─── Disconnect ───────────────────────────────────────────────────────────
  const disconnect = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  // ─── Listen for account/chain changes ────────────────────────────────────
  useEffect(() => {
    const ethereum = getEthereumProvider();
    if (!ethereum) return;

    const handleAccountsChanged = async (accounts) => {
      if (!accounts.length) {
        setState(INITIAL_STATE);
        return;
      }
      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();
      setState(s => ({ ...s, address: accounts[0], signer }));
    };

    const handleChainChanged = (chainIdHex) => {
      const chainId = parseInt(chainIdHex, 16);
      setState(s => ({
        ...s,
        chainId,
        isCorrectNetwork: chainId === ACTIVE_NETWORK.chainId,
      }));
    };

    ethereum.on("accountsChanged", handleAccountsChanged);
    ethereum.on("chainChanged", handleChainChanged);

    // Auto-reconnect if already connected
    ethereum.request({ method: "eth_accounts" }).then((accounts) => {
      if (accounts && accounts.length) connect();
    }).catch(() => {});

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
      ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, [connect]);

  return { ...state, connect, disconnect, switchToXLayer: () => switchToXLayer(getEthereumProvider()) };
}
