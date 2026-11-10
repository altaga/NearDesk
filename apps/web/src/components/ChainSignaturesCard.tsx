"use client";

import React, { useState, useEffect } from "react";
import { Copy, Check, RefreshCw, KeyRound } from "lucide-react";
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
    <div className="bg-[#101217] border border-[#1C2028] rounded-lg p-4 flex flex-col gap-3">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-[#181B22] pb-2">
        <div className="flex items-center gap-2">
          <KeyRound className="w-3.5 h-3.5 text-[#00EC97]" />
          <span className="text-[11px] font-medium tracking-tight text-[#EDEDEF]">
            Chain Signatures (MPC)
          </span>
        </div>
        <span className="text-[10px] font-mono text-[#585E6E]">
          v1.signer
        </span>
      </div>

      <p className="text-[11px] text-[#787E8E] leading-relaxed">
        One NEAR identity derives and signs transactions for foreign chains via decentralized threshold cryptography.
      </p>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
        <div>
          <label className="text-[10px] uppercase text-[#555B69] block mb-1">Chain</label>
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value)}
            className="w-full bg-[#0A0C0F] border border-[#1E222A] rounded px-2.5 py-1.5 text-xs text-[#EDEDEF] focus:border-[#00EC97]/50 focus:outline-none"
          >
            <option value="ethereum">Ethereum (EVM)</option>
            <option value="bitcoin">Bitcoin (Segwit)</option>
            <option value="solana">Solana (SPL)</option>
            <option value="base">Base (L2)</option>
            <option value="arbitrum">Arbitrum (L2)</option>
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase text-[#555B69] block mb-1">Path Index</label>
          <input
            type="text"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            className="w-full bg-[#0A0C0F] border border-[#1E222A] rounded px-2.5 py-1.5 text-xs text-[#EDEDEF] focus:border-[#00EC97]/50 focus:outline-none"
            placeholder="1"
          />
        </div>
      </div>

      {/* Derived Address Output */}
      <div className="bg-[#0A0C0F] border border-[#1C2028] rounded p-3 flex flex-col gap-1.5 mt-1 font-mono">
        <div className="flex items-center justify-between text-[10px] text-[#555B69]">
          <span>DERIVED {chain.toUpperCase()} ADDRESS</span>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1 text-[#8B92A2] hover:text-[#00EC97] transition-colors"
          >
            {copied ? <Check className="w-2.5 h-2.5 text-[#00EC97]" /> : <Copy className="w-2.5 h-2.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        <div className="text-xs text-[#EDEDEF] break-all bg-[#121419] px-2.5 py-1.5 rounded border border-[#181B22]">
          {loading ? (
            <span className="text-[#555B69] flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin text-[#00EC97]" /> Computing MPC derivation...
            </span>
          ) : (
            data?.derived_address || "Unavailable"
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#555B69] pt-0.5">
          <span>Path: <b className="text-[#8B92A2] font-normal">{data?.derivation_path}</b></span>
          <span className="text-[#00EC97]">Threshold Verified</span>
        </div>
      </div>
    </div>
  );
};
