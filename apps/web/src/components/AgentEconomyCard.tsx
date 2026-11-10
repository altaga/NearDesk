"use client";

import React, { useState, useEffect } from "react";
import { Coins, ArrowDownLeft } from "lucide-react";
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
    <div className="bg-[#101216] border border-[#1E222A] rounded p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1A1D24] pb-2.5">
        <div className="flex items-center gap-2">
          <Coins className="w-3.5 h-3.5 text-[#00EC97]" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#EDEDEF]">
            Autonomous Node Revenue
          </h2>
        </div>
        <span className="text-[10px] font-mono text-[#7E8492]">
          Peer Micro-Settlement
        </span>
      </div>

      <p className="text-[11px] text-[#7E8492] leading-relaxed">
        Peer agents compensate this Jetson node in NEAR for edge inference, TEE attestation verification, and MPC signing.
      </p>

      {/* Revenue Stat Box */}
      <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-3 flex items-center justify-between">
        <div>
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#525866] block">Total Settled Revenue</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-mono font-semibold text-[#00EC97] tracking-tight">
              {earned.toFixed(3)}
            </span>
            <span className="text-xs font-mono text-[#7E8492]">NEAR</span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[9px] font-mono uppercase tracking-wider text-[#525866] block">Jobs Fulfilled</span>
          <span className="text-xl font-mono font-semibold text-[#EDEDEF] mt-0.5 block tracking-tight">
            {count}
          </span>
        </div>
      </div>

      {/* Recent Peer Inflows */}
      <div className="flex flex-col gap-1.5 pt-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#525866]">Recent Micro-Payments</span>
        <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-0.5">
          {economy?.recent_tasks?.map((t) => (
            <div
              key={t.task_id}
              className="bg-[#090A0D] border border-[#1A1D24] rounded p-2 flex items-center justify-between text-[10px] font-mono"
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-[#EDEDEF] font-medium flex items-center gap-1">
                  <ArrowDownLeft className="w-3 h-3 text-[#00EC97]" />
                  {t.service_type}
                </span>
                <span className="text-[9px] text-[#6B7280]">Client: {t.client_agent}</span>
              </div>

              <div className="text-right flex flex-col items-end gap-0.5">
                <span className="text-[#00EC97] font-medium">+{t.payment_near} NEAR</span>
                <span className="text-[9px] text-[#525866]">{t.payment_tx_hash.slice(0, 10)}...</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
