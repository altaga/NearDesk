"use client";

import React, { useState } from "react";
import { Copy, Check, SlidersHorizontal, AlertCircle } from "lucide-react";
import { BudgetStatus, TelemetryData, NearAccountStatus } from "../lib/types";

interface DeskHeaderProps {
  telemetry: TelemetryData | null;
  budget: BudgetStatus | null;
  account: NearAccountStatus | null;
  pendingApprovalsCount: number;
  onOpenApprovals: () => void;
  onOpenOnboarding: () => void;
}

export const DeskHeader: React.FC<DeskHeaderProps> = ({
  telemetry,
  budget,
  account,
  pendingApprovalsCount,
  onOpenApprovals,
  onOpenOnboarding,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const spent = budget?.total_spent_usd ?? 0.0;
  const maxB = budget?.max_budget_usd ?? 10.0;

  const copyAccount = () => {
    if (!account?.account_id) return;
    navigator.clipboard.writeText(account.account_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="h-12 w-full bg-[#090A0D]/90 backdrop-blur-md border-b border-[#1A1D24] px-5 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Subtle Breadcrumb */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00EC97]" />
          <span className="text-xs font-semibold tracking-tight text-[#EDEDEF]">
            Near<span className="text-[#00EC97]">Desk</span>
          </span>
        </div>

        <span className="text-[#2C313C]">/</span>

        <span className="text-[11px] text-[#7E8492] font-medium tracking-tight">
          {telemetry?.is_jetson ? "NVIDIA Jetson Orin" : "Edge Station"}
        </span>

        <span className="text-[10px] font-mono uppercase text-[#00EC97]/80 bg-[#00EC97]/8 border border-[#00EC97]/20 px-1.5 py-0.2 rounded-sm ml-1">
          {account?.network || "Mainnet"}
        </span>
      </div>

      {/* Right Controls: Minimal, Precision Detailing */}
      <div className="flex items-center gap-2 text-xs font-mono">
        {/* Approvals Trigger */}
        {pendingApprovalsCount > 0 && (
          <button
            onClick={onOpenApprovals}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-sans font-medium text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded hover:bg-amber-500/20 transition-colors"
          >
            <AlertCircle className="w-3 h-3" />
            <span>{pendingApprovalsCount} Action{pendingApprovalsCount > 1 ? "s" : ""}</span>
          </button>
        )}

        {/* Account & Balance Pill */}
        {account && (
          <button
            onClick={copyAccount}
            title={`Copy ${account.account_id}`}
            className="flex items-center gap-1.5 bg-[#121418] hover:bg-[#181B21] border border-[#20252E] px-2 py-1 rounded text-[11px] transition-colors"
          >
            <span className="text-[#969CAC]">
              {account.account_id.length > 14
                ? `${account.account_id.slice(0, 5)}...${account.account_id.slice(-4)}`
                : account.account_id}
            </span>
            <span className="text-[#3A404F]">|</span>
            <span className="text-[#00EC97] font-semibold">
              {account.balance_near.toFixed(2)} N
            </span>
            {copied ? (
              <Check className="w-2.5 h-2.5 text-[#00EC97]" />
            ) : (
              <Copy className="w-2.5 h-2.5 text-[#555C6E]" />
            )}
          </button>
        )}

        {/* AI Budget Capsule */}
        <div className="flex items-center gap-1.5 bg-[#121418] border border-[#20252E] px-2 py-1 rounded text-[11px] text-[#969CAC]">
          <span className="text-[#555C6E]">AI:</span>
          <span className="text-[#EDEDEF]">${spent.toFixed(3)}</span>
          <span className="text-[#404655]">/</span>
          <span className="text-[#687082]">${maxB.toFixed(0)}</span>
        </div>

        {/* Hardware Setup / Pairing Drawer Toggle */}
        <button
          onClick={onOpenOnboarding}
          title="Hardware Pairing & Discovery"
          className="p-1.5 text-[#7E8492] hover:text-[#EDEDEF] bg-[#121418] hover:bg-[#181B21] border border-[#20252E] rounded transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
