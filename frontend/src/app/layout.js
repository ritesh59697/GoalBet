"use client";
import "./globals.css";
import { createContext, useContext } from "react";
import { useWallet } from "../hooks/useWallet";

export const WalletContext = createContext(null);
export function useWalletContext() {
  return useContext(WalletContext);
}

export default function RootLayout({ children }) {
  const wallet = useWallet();
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="GoalBet — Decentralized FIFA World Cup 2026 prediction markets on X Layer. Bet in USDT, powered by AI agent and Bet Receipt NFTs." />
        <title>GoalBet — On-Chain World Cup Predictions</title>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var theme = localStorage.getItem('goalbet-theme') || 'light';
                document.documentElement.setAttribute('data-theme', theme);
              })()
            `,
          }}
        />
        {/* Fonts: Inter + DM Serif + JetBrains Mono */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=DM+Serif+Display:ital@0;1&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <WalletContext.Provider value={wallet}>
          {children}
        </WalletContext.Provider>
      </body>
    </html>
  );
}
