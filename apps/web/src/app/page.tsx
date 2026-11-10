"use client";

import React, { useState, useEffect } from "react";
import { DeskHeader } from "../components/DeskHeader";
import { TelemetryBar } from "../components/TelemetryBar";
import { ChatStream } from "../components/ChatStream";
import { ChainSignaturesCard } from "../components/ChainSignaturesCard";
import { IntentSwapCard } from "../components/IntentSwapCard";
import { AgentFencingCard } from "../components/AgentFencingCard";
import { AuditTrailCard } from "../components/AuditTrailCard";
import { AgentEconomyCard } from "../components/AgentEconomyCard";
import { TerminalDrawer } from "../components/TerminalDrawer";
import { ApprovalModal } from "../components/ApprovalModal";
import { fetchTelemetry, fetchBudget, fetchApprovals } from "../lib/api";
import { TelemetryData, BudgetStatus, ApprovalRequest } from "../lib/types";
import { KeyRound, ShieldCheck, History, Coins } from "lucide-react";

type RightPanelTab = "chain_intents" | "security_fencing" | "audit_trail" | "agent_economy";

export default function DeskPage() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [budget, setBudget] = useState<BudgetStatus | null>(null);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isApprovalOpen, setIsApprovalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<RightPanelTab>("chain_intents");

  const refreshState = async () => {
    const [t, b, a] = await Promise.all([
      fetchTelemetry(),
      fetchBudget(),
      fetchApprovals(),
    ]);
    if (t) setTelemetry(t);
    if (b) setBudget(b);
    if (a) setApprovals(a);
  };

  useEffect(() => {
    refreshState();
    const interval = setInterval(refreshState, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-near-black text-near-textPrimary overflow-hidden font-sans">
      {/* 1. Masthead */}
      <DeskHeader
        telemetry={telemetry}
        budget={budget}
        pendingApprovalsCount={approvals.length}
        onOpenApprovals={() => setIsApprovalOpen(true)}
      />

      {/* 2. System & RPC Telemetry */}
      <TelemetryBar telemetry={telemetry} />

      {/* 3. Primary Workspace Grid */}
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
        {/* Left / Primary Console: Chat with Nova Operator */}
        <section className="lg:col-span-7 h-full flex flex-col min-h-0">
          <ChatStream
            onBudgetUpdate={refreshState}
            onApprovalUpdate={refreshState}
          />
        </section>

        {/* Right / Secondary Dock with Tabbed Views */}
        <section className="lg:col-span-5 h-full flex flex-col gap-3 min-h-0">
          {/* Tab Selector */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-near-surface border border-near-border rounded text-[11px] font-mono">
            <button
              onClick={() => setActiveTab("chain_intents")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded transition-all ${
                activeTab === "chain_intents"
                  ? "bg-near-black text-near-green font-semibold border border-near-border/80 shadow-surface-subtle"
                  : "text-near-textMuted hover:text-near-textSecondary"
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Multi-Chain</span>
            </button>

            <button
              onClick={() => setActiveTab("security_fencing")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded transition-all ${
                activeTab === "security_fencing"
                  ? "bg-near-black text-near-green font-semibold border border-near-border/80 shadow-surface-subtle"
                  : "text-near-textMuted hover:text-near-textSecondary"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Fencing</span>
            </button>

            <button
              onClick={() => setActiveTab("audit_trail")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded transition-all ${
                activeTab === "audit_trail"
                  ? "bg-near-black text-near-green font-semibold border border-near-border/80 shadow-surface-subtle"
                  : "text-near-textMuted hover:text-near-textSecondary"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Audit Trail</span>
            </button>

            <button
              onClick={() => setActiveTab("agent_economy")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded transition-all ${
                activeTab === "agent_economy"
                  ? "bg-near-black text-near-green font-semibold border border-near-border/80 shadow-surface-subtle"
                  : "text-near-textMuted hover:text-near-textSecondary"
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Economy</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-0">
            {activeTab === "chain_intents" && (
              <>
                <ChainSignaturesCard />
                <IntentSwapCard />
              </>
            )}

            {activeTab === "security_fencing" && (
              <>
                <AgentFencingCard />
                <ChainSignaturesCard />
              </>
            )}

            {activeTab === "audit_trail" && <AuditTrailCard />}

            {activeTab === "agent_economy" && <AgentEconomyCard />}
          </div>
        </section>
      </main>

      {/* 4. Edge Hardware Terminal Drawer */}
      <TerminalDrawer onCommandSubmitted={refreshState} />

      {/* 5. Human-in-the-Loop Approval Modal */}
      <ApprovalModal
        isOpen={isApprovalOpen}
        onClose={() => setIsApprovalOpen(false)}
        requests={approvals}
        onRefresh={refreshState}
      />
    </div>
  );
}
