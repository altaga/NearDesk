"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Lock, Check } from "lucide-react";
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
    <div className="bg-[#101216] border border-[#1E222A] rounded p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1A1D24] pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#00EC97]" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#EDEDEF]">
            Scoped FunctionCall Access Key
          </h2>
        </div>
        <span className="text-[10px] font-mono text-[#7E8492]">
          Deterministic Fence
        </span>
      </div>

      <p className="text-[11px] text-[#7E8492] leading-relaxed">
        Agent runs under restricted NEAR FunctionCall permissions. Fund transfers and contract deletion are mathematically barred at protocol level.
      </p>

      {/* Security Invariants */}
      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
        <div className="bg-[#090A0D] border border-[#1A1D24] rounded px-2.5 py-2 flex items-center justify-between">
          <span className="text-[#9CA3AF]">Master Key</span>
          <span className="text-[#00EC97] flex items-center gap-1 font-medium">
            <Lock className="w-2.5 h-2.5" /> Isolated
          </span>
        </div>
        <div className="bg-[#090A0D] border border-[#1A1D24] rounded px-2.5 py-2 flex items-center justify-between">
          <span className="text-[#9CA3AF]">Native Transfer</span>
          <span className="text-[#7E8492] flex items-center gap-1">
            <Check className="w-2.5 h-2.5 text-[#00EC97]" /> Blocked
          </span>
        </div>
      </div>

      {/* Gas Allowance Meter */}
      <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#7E8492] text-[10px] uppercase tracking-wider">Gas Allowance Ceiling</span>
          <span className="text-[#EDEDEF] font-medium">
            {spent.toFixed(3)} <span className="text-[#7E8492]">/ {maxAllowance.toFixed(2)} NEAR</span>
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          className="w-full bg-[#16181F] h-1.5 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-[#00EC97] transition-all duration-300"
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono text-[#6B7280]">
          <span>Remaining: <span className="text-[#EDEDEF]">{fencing?.remaining_allowance_near ?? 2.32} NEAR</span></span>
          <span>{pct}% utilized</span>
        </div>
      </div>

      {/* Allowed Smart Contracts */}
      <div className="flex flex-col gap-1.5 pt-0.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#525866]">Whitelisted Contracts</span>
        <div className="flex items-center gap-1.5">
          <span className="bg-[#090A0D] border border-[#1A1D24] px-2 py-0.5 rounded text-[10px] font-mono text-[#9CA3AF]">
            v1.signer (MPC)
          </span>
          <span className="bg-[#090A0D] border border-[#1A1D24] px-2 py-0.5 rounded text-[10px] font-mono text-[#9CA3AF]">
            intents.near (1Click)
          </span>
        </div>
      </div>
    </div>
  );
};
