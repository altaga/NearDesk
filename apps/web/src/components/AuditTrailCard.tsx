"use client";

import React, { useState, useEffect } from "react";
import { History, ExternalLink, ShieldCheck, RefreshCw } from "lucide-react";
import { fetchAuditTrail } from "../lib/api";
import { AuditEntry } from "../lib/types";

export const AuditTrailCard: React.FC = () => {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadTrail = async () => {
    setLoading(true);
    const data = await fetchAuditTrail();
    setEntries(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTrail();
    const interval = setInterval(loadTrail, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-near-surface border border-near-border rounded p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-near-border pb-2.5">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-near-green" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-near-textPrimary">
            On-Chain Verifiable Audit Trail
          </h2>
        </div>
        <button
          onClick={loadTrail}
          className="text-[10px] font-mono text-near-textSecondary hover:text-near-green flex items-center gap-1 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          <span>Sync</span>
        </button>
      </div>

      <p className="text-[11px] text-near-textMuted leading-relaxed">
        Every approved action on the edge hardware or multi-chain signer is cryptographically hashed and anchored into NEAR testnet blocks.
      </p>

      {/* Entries List */}
      <div className="flex flex-col gap-2.5 max-h-[420px] overflow-y-auto pr-1">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-near-black border border-near-border rounded p-2.5 flex flex-col gap-1.5 text-xs font-mono"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-near-green uppercase font-semibold bg-near-green/10 border border-near-green/20 px-1.5 py-0.2 rounded">
                {entry.action_type}
              </span>
              <span className="text-[10px] text-near-textMuted">
                {new Date(entry.timestamp * 1000).toLocaleTimeString()}
              </span>
            </div>

            <div className="text-near-textPrimary font-semibold text-[11px]">
              {entry.title}
            </div>

            {/* Hashes */}
            <div className="flex flex-col gap-0.5 text-[10px] text-near-textMuted bg-near-surfaceElevated p-2 rounded border border-near-border/50">
              <div className="flex items-center justify-between">
                <span>Payload Hash:</span>
                <span className="text-near-textSecondary font-mono">{entry.payload_hash.slice(0, 18)}...</span>
              </div>
              <div className="flex items-center justify-between">
                <span>NEAR Block #{entry.block_height}:</span>
                <a
                  href={entry.explorer_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-near-green hover:underline flex items-center gap-1 font-mono"
                >
                  <span>{entry.tx_hash.slice(0, 16)}...</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-near-textMuted pt-0.5">
              <span>Operator: <span className="text-near-textSecondary">{entry.operator}</span></span>
              <span className="text-near-green flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Anchored
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
