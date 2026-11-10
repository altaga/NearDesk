"use client";

import React, { useState, useEffect } from "react";
import { ArrowDownUp, RefreshCw, Layers, CheckCircle2 } from "lucide-react";
import { fetchIntentQuote } from "../lib/api";
import { IntentQuote } from "../lib/types";

export const IntentSwapCard: React.FC = () => {
  const [assetIn, setAssetIn] = useState<string>("SOL");
  const [assetOut, setAssetOut] = useState<string>("NEAR");
  const [amountIn, setAmountIn] = useState<string>("1.5");
  const [quote, setQuote] = useState<IntentQuote | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const getQuote = async () => {
    if (!amountIn || isNaN(Number(amountIn))) return;
    setLoading(true);
    const res = await fetchIntentQuote(assetIn, assetOut, amountIn);
    if (res) setQuote(res);
    setLoading(false);
  };

  useEffect(() => {
    getQuote();
  }, [assetIn, assetOut, amountIn]);

  const handleSwap = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="bg-near-surface border border-near-border rounded p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-near-border pb-2.5">
        <div className="flex items-center gap-2">
          <ArrowDownUp className="w-4 h-4 text-near-green" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-near-textPrimary">
            NEAR Intents (1Click Swaps)
          </h2>
        </div>
        <span className="text-[10px] font-mono text-near-green bg-near-green/10 border border-near-green/20 px-2 py-0.5 rounded">
          ChainDefuser
        </span>
      </div>

      <p className="text-[11px] text-near-textMuted leading-relaxed">
        Declarative cross-chain swaps settled natively across chains via decentralized solvers without traditional bridge risks.
      </p>

      {/* Input Rows */}
      <div className="flex flex-col gap-2">
        {/* You Pay */}
        <div className="bg-near-black border border-near-border rounded p-2.5 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono uppercase text-near-textMuted">You Pay</span>
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              className="bg-transparent font-mono text-sm text-near-textPrimary font-semibold focus:outline-none w-28"
              placeholder="1.0"
              step="0.1"
            />
          </div>
          <select
            value={assetIn}
            onChange={(e) => setAssetIn(e.target.value)}
            className="bg-near-surfaceElevated border border-near-border rounded px-2.5 py-1 text-xs text-near-textPrimary font-mono focus:border-near-green focus:outline-none"
          >
            <option value="SOL">SOL (Solana)</option>
            <option value="NEAR">NEAR (Native)</option>
            <option value="ETH">ETH (Ethereum)</option>
            <option value="BTC">BTC (Bitcoin)</option>
            <option value="USDC_NEAR">USDC (NEAR)</option>
          </select>
        </div>

        {/* You Receive */}
        <div className="bg-near-black border border-near-border rounded p-2.5 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono uppercase text-near-textMuted">Estimated Output</span>
            <span className="font-mono text-sm text-near-green font-semibold">
              {loading ? "Calculating..." : quote?.amount_out || "0.00"}
            </span>
          </div>
          <select
            value={assetOut}
            onChange={(e) => setAssetOut(e.target.value)}
            className="bg-near-surfaceElevated border border-near-border rounded px-2.5 py-1 text-xs text-near-textPrimary font-mono focus:border-near-green focus:outline-none"
          >
            <option value="NEAR">NEAR (Native)</option>
            <option value="SOL">SOL (Solana)</option>
            <option value="ETH">ETH (Ethereum)</option>
            <option value="BTC">BTC (Bitcoin)</option>
            <option value="USDT_NEAR">USDT (NEAR)</option>
          </select>
        </div>
      </div>

      {/* Solver Route Info */}
      <div className="text-[10px] font-mono text-near-textMuted flex items-center justify-between px-1">
        <span>Min. Received: <span className="text-near-textSecondary">{quote?.min_amount_out || "0"}</span></span>
        <span className="text-near-green flex items-center gap-1">
          <Layers className="w-3 h-3" /> Solvers: MPC Network
        </span>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSwap}
        disabled={loading}
        className="w-full bg-near-surfaceElevated border border-near-green/30 text-near-green hover:bg-near-green/10 text-xs font-semibold py-2 rounded transition-colors flex items-center justify-center gap-1.5 mt-1"
      >
        {submitted ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5" /> Intent Queued in Approval Gate
          </>
        ) : loading ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Fetching Solver Quote...
          </>
        ) : (
          `Prepare Cross-Chain Intent (${assetIn} → ${assetOut})`
        )}
      </button>
    </div>
  );
};
