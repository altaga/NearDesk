"use client";

import React, { useState } from "react";
import { Shield, Cpu, Activity, Coins, Lock, Wallet, Copy, Check } from "lucide-react";
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
  const pct = budget?.percent_used ?? 0.0;

  const copyAccount = () => {
    if (!account?.account_id) return;
    navigator.clipboard.writeText(account.account_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="w-full bg-near-surface border-b border-near-border px-6 py-3 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Brand & Node Identity */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-near-green shadow-near-glow animate-pulse" />
          <span className="font-bold tracking-tight text-base text-near-textPrimary flex items-center gap-1.5">
            Near<span className="text-near-green">Desk</span>
          </span>
          <span className="text-[10px] font-mono tracking-widest uppercase bg-near-surfaceElevated border border-near-border px-2 py-0.5 rounded text-near-textSecondary">
            Edge Node v0.2.0
          </span>
        </div>

        {/* Status Pills */}
        <div className="hidden md:flex items-center gap-2 border-l border-near-border pl-4">
          <div className="flex items-center gap-1.5 text-xs text-near-textSecondary bg-near-black border border-near-border px-2.5 py-1 rounded">
            <Cpu className="w-3.5 h-3.5 text-near-green" />
            <span className="font-medium text-near-textPrimary">
              {telemetry?.is_jetson ? "NVIDIA Jetson Orin" : "Edge Host Node"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-near-textSecondary bg-near-black border border-near-border px-2.5 py-1 rounded">
            <Shield className="w-3.5 h-3.5 text-near-green" />
            <span>TEE Verifiable</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-near-textSecondary bg-near-black border border-near-border px-2.5 py-1 rounded">
            <Lock className="w-3.5 h-3.5 text-near-green" />
            <span>NEAR MPC Signer</span>
          </div>

          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-1.5 text-xs text-near-textSecondary hover:text-near-green bg-near-black border border-near-border px-2.5 py-1 rounded transition-colors"
          >
            <span>Hardware Setup</span>
          </button>
        </div>
      </div>

      {/* Right Controls: Real Account + Approvals + Strict Budget Meter */}
      <div className="flex items-center gap-3">
        {/* Real NEAR On-Chain Account Pill */}
        {account && (
          <button
            onClick={copyAccount}
            title={account.account_id}
            className="hidden sm:flex items-center gap-1.5 bg-near-black hover:bg-near-surfaceElevated border border-near-border px-2.5 py-1.5 rounded text-xs font-mono transition-colors"
          >
            <Wallet className="w-3.5 h-3.5 text-near-green" />
            <span className="text-near-textSecondary">
              {account.account_id.length > 16
                ? `${account.account_id.slice(0, 6)}...${account.account_id.slice(-4)}`
                : account.account_id}
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
              account.balance_near > 0 ? "bg-near-green/10 text-near-green" : "bg-zinc-800 text-zinc-400"
            }`}>
              {account.balance_near.toFixed(2)} NEAR
            </span>
            {copied ? <Check className="w-3 h-3 text-near-green" /> : <Copy className="w-3 h-3 text-near-textMuted" />}
          </button>
        )}

        {/* Approval Queue Trigger */}
        {pendingApprovalsCount > 0 && (
          <button
            onClick={onOpenApprovals}
            className="flex items-center gap-2 px-3 py-1 text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded hover:bg-amber-500/20 transition-all animate-pulse"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>{pendingApprovalsCount} Action{pendingApprovalsCount > 1 ? "s" : ""} Pending</span>
          </button>
        )}

        {/* Budget Meter ($10 Strict Ceiling) */}
        <div className="flex items-center gap-3 bg-near-black border border-near-border px-3 py-1.5 rounded">
          <div className="flex items-center gap-1.5 text-xs">
            <Coins className="w-3.5 h-3.5 text-near-green" />
            <span className="text-near-textMuted font-mono">NEAR AI Budget:</span>
            <span className="font-mono font-semibold text-near-textPrimary">
              ${spent.toFixed(4)}
            </span>
            <span className="text-near-textMuted font-mono">/ ${maxB.toFixed(2)}</span>
          </div>

          <div className="w-16 bg-near-surfaceElevated h-1.5 rounded-full overflow-hidden border border-near-border">
            <div
              className={`h-full transition-all duration-300 ${
                pct > 80 ? "bg-red-500" : pct > 50 ? "bg-amber-400" : "bg-near-green"
              }`}
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
        </div>
      </div>
    </header>
  );
};
