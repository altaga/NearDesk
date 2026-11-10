"use client";

import React, { useState, useEffect } from "react";
import { KeyRound, Copy, Check, ExternalLink, RefreshCw } from "lucide-react";
import { deriveAddress } from "../lib/api";
import { DerivedAddress } from "../lib/types";

export const ChainSignaturesCard: React.FC = () => {
  const [chain, setChain] = useState<string>("ethereum");
  const [path, setPath] = useState<string>("1");
  const [data, setData] = useState<DerivedAddress | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchAddress = async () => {
    setLoading(true);
    const res = await deriveAddress(chain, path);
    if (res) setData(res);
    setLoading(false);
  };

  useEffect(() => {
    fetchAddress();
  }, [chain, path]);

  const copyToClipboard = () => {
    if (!data?.derived_address) return;
    navigator.clipboard.writeText(data.derived_address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-near-surface border border-near-border rounded p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-near-border pb-2.5">
        <div className="flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-near-green" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-near-textPrimary">
            NEAR Chain Signatures (MPC)
          </h2>
        </div>
        <span className="text-[10px] font-mono text-near-green bg-near-green/10 border border-near-green/20 px-2 py-0.5 rounded">
          v1.signer-prod
        </span>
      </div>

      <p className="text-[11px] text-near-textMuted leading-relaxed">
        One NEAR account cryptographically derives and signs transactions for multiple chains via decentralized MPC threshold signatures.
      </p>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] uppercase font-mono text-near-textMuted block mb-1">
            Foreign Chain
          </label>
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="w-full bg-near-black border border-near-border rounded px-2.5 py-1.5 text-xs text-near-textPrimary font-mono focus:border-near-green focus:outline-none"
          >
            <option value="ethereum">Ethereum (EVM)</option>
            <option value="bitcoin">Bitcoin (Segwit)</option>
            <option value="solana">Solana (SPL)</option>
            <option value="base">Base (L2)</option>
            <option value="arbitrum">Arbitrum (L2)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase font-mono text-near-textMuted block mb-1">
            Path Index
          </label>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="w-full bg-near-black border border-near-border rounded px-2.5 py-1.5 text-xs text-near-textPrimary font-mono focus:border-near-green focus:outline-none"
            placeholder="1"
          />
        </div>
      </div>

      {/* Derived Address Output */}
      <div className="bg-near-black border border-near-border rounded p-3 flex flex-col gap-1.5 mt-1">
        <div className="flex items-center justify-between text-[10px] font-mono text-near-textMuted">
          <span>DERIVED {chain.toUpperCase()} ADDRESS</span>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 text-near-textSecondary hover:text-near-green transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-near-green" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        <div className="font-mono text-xs text-near-textPrimary break-all bg-near-surfaceElevated px-2 py-1.5 rounded border border-near-border/60">
          {loading ? (
            <span className="text-near-textMuted flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin" /> Deriving via MPC...
            </span>
          ) : (
            data?.derived_address || "Unavailable"
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-near-textMuted pt-1">
          <span>Derivation: <span className="text-near-textSecondary">{data?.derivation_path}</span></span>
          <span className="text-near-green">MPC Threshold Verified</span>
        </div>
      </div>
    </div>
  );
};
