"use client";

import React, { useState, useEffect } from "react";
import { ArrowDownUp, RefreshCw, CheckCircle2 } from "lucide-react";
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
    <div className="bg-[#101217] border border-[#1C2028] rounded-lg p-4 flex flex-col gap-3">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#181B22] pb-2">
        <div className="flex items-center gap-2">
          <ArrowDownUp className="w-3.5 h-3.5 text-[#00EC97]" />
          <span className="text-[11px] font-medium tracking-tight text-[#EDEDEF]">
            NEAR Intents (1Click Swaps)
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#585E6E]">
          ChainDefuser
        </span>
      </div>

      <p className="text-[11px] text-[#787E8E] leading-relaxed">
        Autonomous solver routing across chains without bridge liquidity lockups.
      </p>

      {/* Input Rows */}
      <div className="flex flex-col gap-2 font-mono text-xs">
        {/* You Pay */}
        <div className="bg-[#0A0C0F] border border-[#1C2028] rounded p-2.5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-[#555B69]">You Pay</span>
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              className="bg-transparent text-sm text-[#EDEDEF] font-medium focus:outline-none w-28"
              placeholder="1.0"
              step="0.1"
            />
          </div>
          <select
            value={assetIn}
            onChange={(e) => setAssetIn(e.target.value)}
            className="bg-[#121419] border border-[#1E222A] rounded px-2.5 py-1 text-xs text-[#EDEDEF] focus:border-[#00EC97]/50 focus:outline-none"
          >
            <option value="SOL">SOL (Solana)</option>
            <option value="NEAR">NEAR (Native)</option>
            <option value="ETH">ETH (Ethereum)</option>
            <option value="BTC">BTC (Bitcoin)</option>
            <option value="USDC_NEAR">USDC (NEAR)</option>
          </select>
        </div>

        {/* You Receive */}
        <div className="bg-[#0A0C0F] border border-[#1C2028] rounded p-2.5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase text-[#555B69]">Estimated Output</span>
            <span className="text-sm text-[#00EC97] font-medium">
              {loading ? "..." : quote?.amount_out || "0.00"}
            </span>
          </div>
          <select
            value={assetOut}
            onChange={(e) => setAssetOut(e.target.value)}
            className="bg-[#121419] border border-[#1E222A] rounded px-2.5 py-1 text-xs text-[#EDEDEF] focus:border-[#00EC97]/50 focus:outline-none"
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
      <div className="text-[10px] font-mono text-[#555B69] flex items-center justify-between px-0.5">
        <span>Min. Received: <b className="text-[#8B92A2] font-normal">{quote?.min_amount_out || "0"}</b></span>
        <span className="text-[#00EC97]">Solvers Active</span>
      </div>

      {/* Action Button */}
      <button
        onClick={handleSwap}
        disabled={loading}
        className="w-full bg-[#14161C] border border-[#222733] hover:border-[#00EC97]/40 text-[#EDEDEF] hover:text-[#00EC97] text-xs font-medium py-2 rounded transition-colors flex items-center justify-center gap-1.5 mt-0.5"
      >
        {submitted ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-[#00EC97]" /> Intent Queued for Authorization
          </>
        ) : loading ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Querying Solvers...
          </>
        ) : (
          `Prepare Cross-Chain Intent (${assetIn} → ${assetOut})`
        )}
      </button>
    </div>
  );
};
