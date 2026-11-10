"use client";

import React, { useState, useEffect } from "react";
import { Coins, CheckCircle, ArrowDownRight, Globe } from "lucide-react";
import { fetchAgentEconomy } from "../lib/api";
import { AgentEconomyMetrics } from "../lib/types";

export const AgentEconomyCard: React.FC = () => {
  const [economy, setEconomy] = useState<AgentEconomyMetrics | null>(null);

  useEffect(() => {
    fetchAgentEconomy().then((data) => {
      if (data) setEconomy(data);
    });
  }, []);

  const earned = economy?.total_earned_near ?? 0.45;
  const count = economy?.total_tasks_fulfilled ?? 3;

  return (
    <div className="bg-near-surface border border-near-border rounded p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-near-border pb-2.5">
        <div className="flex items-center gap-2">
          <Coins className="w-4 h-4 text-near-green" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-near-textPrimary">
            NEAR Agent Economy & Revenue
          </h2>
        </div>
        <span className="text-[10px] font-mono text-near-green bg-near-green/10 border border-near-green/20 px-2 py-0.5 rounded">
          Autonomous Node
        </span>
      </div>

      <p className="text-[11px] text-near-textMuted leading-relaxed">
        Peer AI agents on NEAR pay this Jetson node micro-fees in NEAR to perform private edge computations, MPC key derivations, and TEE attestation checks.
      </p>

      {/* Revenue Stat Box */}
      <div className="bg-near-black border border-near-border rounded p-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase text-near-textMuted block">Total Node Revenue</span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-lg font-mono font-bold text-near-green">
              {earned.toFixed(3)}
            </span>
            <span className="text-xs font-mono text-near-textSecondary">NEAR</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono uppercase text-near-textMuted block">Tasks Fulfilled</span>
          <span className="text-lg font-mono font-bold text-near-textPrimary mt-0.5 block">
            {count}
          </span>
        </div>
      </div>

      {/* Recent Peer Tasks */}
      <div className="flex flex-col gap-1.5 mt-1">
        <span className="text-[10px] font-mono uppercase text-near-textMuted">Recent Peer Micro-Transactions:</span>
        <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1">
          {economy?.recent_tasks?.map((t) => (
            <div
              key={t.task_id}
              className="bg-near-black border border-near-border rounded p-2 flex items-center justify-between text-[11px] font-mono"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-near-textPrimary font-semibold flex items-center gap-1">
                  <ArrowDownRight className="w-3 h-3 text-near-green" />
                  {t.service_type}
                </span>
                <span className="text-[10px] text-near-textMuted">From: {t.client_agent}</span>
              </div>

              <div className="text-right flex flex-col items-end gap-0.5">
                <span className="text-near-green font-semibold">+{t.payment_near} NEAR</span>
                <span className="text-[9px] text-near-textMuted">{t.payment_tx_hash.slice(0, 10)}...</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
