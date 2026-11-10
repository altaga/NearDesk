"use client";

import React, { useState } from "react";
import { KeyRound, ShieldCheck, History, Coins, Fingerprint } from "lucide-react";
import { ChainSignaturesCard } from "../ChainSignaturesCard";
import { IntentSwapCard } from "../IntentSwapCard";
import { AgentFencingCard } from "../AgentFencingCard";
import { AuditTrailCard } from "../AuditTrailCard";
import { AgentEconomyCard } from "../AgentEconomyCard";
import { AgentDIDCard } from "../AgentDIDCard";

type NearSubTab = "chains" | "fencing" | "audit" | "revenue" | "did";

export const NEARSovereignHub: React.FC = () => {
  const [tab, setTab] = useState<NearSubTab>("chains");

  return (
    <div className="flex-1 flex flex-col gap-3 h-full min-h-0 font-mono">
      {/* Subtab Bar */}
      <div className="flex items-center justify-between border-b border-[#1A1D24] pb-2 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTab("chains")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              tab === "chains"
                ? "bg-[#16191F] text-[#00EC97] font-semibold border border-[#232833]"
                : "text-[#7E8492] hover:text-[#EDEDEF]"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Chain Signatures (MPC)</span>
          </button>

          <button
            onClick={() => setTab("fencing")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              tab === "fencing"
                ? "bg-[#16191F] text-[#00EC97] font-semibold border border-[#232833]"
                : "text-[#7E8492] hover:text-[#EDEDEF]"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Key Fencing</span>
          </button>

          <button
            onClick={() => setTab("audit")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              tab === "audit"
                ? "bg-[#16191F] text-[#00EC97] font-semibold border border-[#232833]"
                : "text-[#7E8492] hover:text-[#EDEDEF]"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail</span>
          </button>

          <button
            onClick={() => setTab("revenue")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              tab === "revenue"
                ? "bg-[#16191F] text-[#00EC97] font-semibold border border-[#232833]"
                : "text-[#7E8492] hover:text-[#EDEDEF]"
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Agent Revenue</span>
          </button>

          <button
            onClick={() => setTab("did")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              tab === "did"
                ? "bg-[#16191F] text-[#00EC97] font-semibold border border-[#232833]"
                : "text-[#7E8492] hover:text-[#EDEDEF]"
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>W3C DID Identity</span>
          </button>
        </div>

        <span className="text-[10px] text-[#555C6E] uppercase tracking-wider">
          Decentralized Web3 Execution Layer
        </span>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto pr-0.5 min-h-0">
        {tab === "chains" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <ChainSignaturesCard />
            <IntentSwapCard />
          </div>
        )}

        {tab === "fencing" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AgentFencingCard />
            <ChainSignaturesCard />
          </div>
        )}

        {tab === "audit" && (
          <div className="max-w-3xl">
            <AuditTrailCard />
          </div>
        )}

        {tab === "revenue" && (
          <div className="max-w-3xl">
            <AgentEconomyCard />
          </div>
        )}

        {tab === "did" && (
          <div className="max-w-3xl">
            <AgentDIDCard />
          </div>
        )}
      </div>
    </div>
  );
};
