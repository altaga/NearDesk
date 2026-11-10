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
    <div className="bg-[#101216] border border-[#1E222A] rounded p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1A1D24] pb-2.5">
        <div className="flex items-center gap-2">
          <History className="w-3.5 h-3.5 text-[#00EC97]" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#EDEDEF]">
            Verifiable Action Audit Trail
          </h2>
        </div>
        <button
          onClick={loadTrail}
          aria-label="Synchronize Audit Trail"
          className="text-[10px] font-mono text-[#7E8492] hover:text-[#EDEDEF] flex items-center gap-1 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          <span>Sync</span>
        </button>
      </div>

      <p className="text-[11px] text-[#7E8492] leading-relaxed">
        Hardware executions and MPC sign operations hashed with SHA-256 and committed into NEAR blocks.
      </p>

      {/* Entries Ledger */}
      <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-0.5">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="bg-[#090A0D] border border-[#1A1D24] rounded p-2.5 flex flex-col gap-1.5 text-xs font-mono"
          >
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-[#00EC97] uppercase tracking-wider font-medium">
                {entry.action_type}
              </span>
              <span className="text-[#6B7280]">
                {new Date(entry.timestamp * 1000).toLocaleTimeString()}
              </span>
            </div>

            <div className="text-[#EDEDEF] font-medium text-[11px] tracking-tight">
              {entry.title}
            </div>

            {/* Block & Hash Proof */}
            <div className="flex flex-col gap-1 text-[10px] text-[#7E8492] bg-[#0E1014] p-2 rounded border border-[#16181F]">
              <div className="flex items-center justify-between">
                <span>Payload Hash:</span>
                <span className="text-[#9CA3AF] font-mono">{entry.payload_hash.slice(0, 16)}...</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Block #{entry.block_height}:</span>
                <a
                  href={entry.explorer_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#00EC97] hover:underline flex items-center gap-1 font-mono transition-opacity hover:opacity-80"
                >
                  <span>{entry.tx_hash.slice(0, 14)}...</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>

            <div className="flex items-center justify-between text-[9px] text-[#6B7280] pt-0.5">
              <span>Operator: {entry.operator}</span>
              <span className="text-[#00EC97] flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5" /> Anchored
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
