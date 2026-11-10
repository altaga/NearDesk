"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { fetchFencing } from "../lib/api";
import { KeyFencingStatus } from "../lib/types";

export const AgentFencingCard: React.FC = () => {
  const [fencing, setFencing] = useState<KeyFencingStatus | null>(null);

  useEffect(() => {
    fetchFencing().then((data) => {
      if (data) setFencing(data);
    });
  }, []);

  const spent = fencing?.spent_allowance_near ?? 0.18;
  const maxAllowance = fencing?.gas_allowance_near ?? 2.5;
  const pct = fencing?.allowance_used_pct ?? 7.2;

  return (
    <div className="bg-near-surface border border-near-border rounded p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-near-border pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-near-green" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-near-textPrimary">
            NEAR Scoped FunctionCall Fencing
          </h2>
        </div>
        <span className="text-[10px] font-mono text-near-green bg-near-green/10 border border-near-green/20 px-2 py-0.5 rounded">
          Mathematical Boundary
        </span>
      </div>

      <p className="text-[11px] text-near-textMuted leading-relaxed">
        The agent operates strictly using a restricted FunctionCall Access Key. It cannot transfer arbitrary account funds or delete contracts, even under prompt injection.
      </p>

      {/* Security Guarantees Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
        <div className="bg-near-black border border-near-border rounded p-2 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-near-green shrink-0" />
          <span className="text-near-textSecondary">Master Key Locked</span>
        </div>
        <div className="bg-near-black border border-near-border rounded p-2 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-near-green shrink-0" />
          <span className="text-near-textSecondary">Transfer Immature Blocked</span>
        </div>
      </div>

      {/* Gas Allowance Meter */}
      <div className="bg-near-black border border-near-border rounded p-3 flex flex-col gap-2 mt-1">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-near-textMuted">AGENT GAS ALLOWANCE</span>
          <span className="text-near-textPrimary font-semibold">
            {spent.toFixed(3)} / {maxAllowance.toFixed(2)} NEAR
          </span>
        </div>

        <div className="w-full bg-near-surfaceElevated h-2 rounded-full overflow-hidden border border-near-border">
          <div
            className="h-full bg-near-green transition-all duration-300"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-near-textMuted pt-1 border-t border-near-border/40">
          <span>Remaining: <span className="text-near-green">{fencing?.remaining_allowance_near ?? 2.32} NEAR</span></span>
          <span>Used: {pct}%</span>
        </div>
      </div>

      {/* Allowed Contracts List */}
      <div className="text-[10px] font-mono text-near-textMuted flex flex-col gap-1">
        <span>Restricted Smart Contracts:</span>
        <div className="flex flex-wrap gap-1.5">
          <span className="bg-near-surfaceElevated border border-near-border px-2 py-0.5 rounded text-near-textSecondary">
            v1.signer-prod.testnet
          </span>
          <span className="bg-near-surfaceElevated border border-near-border px-2 py-0.5 rounded text-near-textSecondary">
            intents.near
          </span>
        </div>
      </div>
    </div>
  );
};
