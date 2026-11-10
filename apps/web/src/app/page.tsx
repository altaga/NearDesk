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
import { AgentDIDCard } from "../components/AgentDIDCard";
import { TerminalDrawer } from "../components/TerminalDrawer";
import { ApprovalModal } from "../components/ApprovalModal";
import { OnboardingWizard } from "../components/OnboardingWizard";
import { fetchTelemetry, fetchBudget, fetchApprovals, fetchOnChainAccount } from "../lib/api";
import { TelemetryData, BudgetStatus, ApprovalRequest, NearAccountStatus } from "../lib/types";
import { KeyRound, ShieldCheck, History, Coins, Fingerprint } from "lucide-react";

type RightPanelTab = "chain_intents" | "security_fencing" | "audit_trail" | "agent_economy" | "did_identity";

export default function DeskPage() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [budget, setBudget] = useState<BudgetStatus | null>(null);
  const [account, setAccount] = useState<NearAccountStatus | null>(null);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isApprovalOpen, setIsApprovalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<RightPanelTab>("chain_intents");

  const refreshState = async () => {
    const [t, b, a, acc] = await Promise.all([
      fetchTelemetry(),
      fetchBudget(),
      fetchApprovals(),
      fetchOnChainAccount(),
    ]);
    if (t) setTelemetry(t);
    if (b) setBudget(b);
    if (a) setApprovals(a);
    if (acc) setAccount(acc);
  };

  useEffect(() => {
    refreshState();
    const interval = setInterval(refreshState, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-[#090A0D] text-[#EDEDEF] overflow-hidden font-sans">
      {/* 1. Swiss Masthead */}
      <DeskHeader
        telemetry={telemetry}
        budget={budget}
        account={account}
        pendingApprovalsCount={approvals.length}
        onOpenApprovals={() => setIsApprovalOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* 2. Micro Status Telemetry Ribbon */}
      <TelemetryBar telemetry={telemetry} />

      {/* 3. Primary Workspace Grid */}
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3.5 p-3.5">
        {/* Left / Primary Console: Chat with Nova Edge Agent */}
        <section className="lg:col-span-7 h-full flex flex-col min-h-0">
          <ChatStream
            onBudgetUpdate={refreshState}
            onApprovalUpdate={refreshState}
          />
        </section>

        {/* Right / Secondary Control Dock */}
        <section className="lg:col-span-5 h-full flex flex-col gap-2.5 min-h-0">
          {/* Segmented Control Header */}
          <div
            role="tablist"
            aria-label="Agent Capabilities"
            className="grid grid-cols-5 gap-1 p-1 bg-[#101216] border border-[#1E222A] rounded text-[10px] font-mono select-none"
          >
            <button
              role="tab"
              aria-selected={activeTab === "chain_intents"}
              onClick={() => setActiveTab("chain_intents")}
              className={`flex items-center justify-center gap-1 py-1.5 rounded transition-all ${
                activeTab === "chain_intents"
                  ? "bg-[#16191F] text-[#00EC97] font-medium border border-[#232833]"
                  : "text-[#6B7280] hover:text-[#9CA3AF]"
              }`}
            >
              <KeyRound className="w-3 h-3" />
              <span>Chains</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === "security_fencing"}
              onClick={() => setActiveTab("security_fencing")}
              className={`flex items-center justify-center gap-1 py-1.5 rounded transition-all ${
                activeTab === "security_fencing"
                  ? "bg-[#16191F] text-[#00EC97] font-medium border border-[#232833]"
                  : "text-[#6B7280] hover:text-[#9CA3AF]"
              }`}
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Fencing</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === "audit_trail"}
              onClick={() => setActiveTab("audit_trail")}
              className={`flex items-center justify-center gap-1 py-1.5 rounded transition-all ${
                activeTab === "audit_trail"
                  ? "bg-[#16191F] text-[#00EC97] font-medium border border-[#232833]"
                  : "text-[#6B7280] hover:text-[#9CA3AF]"
              }`}
            >
              <History className="w-3 h-3" />
              <span>Audit</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === "agent_economy"}
              onClick={() => setActiveTab("agent_economy")}
              className={`flex items-center justify-center gap-1 py-1.5 rounded transition-all ${
                activeTab === "agent_economy"
                  ? "bg-[#16191F] text-[#00EC97] font-medium border border-[#232833]"
                  : "text-[#6B7280] hover:text-[#9CA3AF]"
              }`}
            >
              <Coins className="w-3 h-3" />
              <span>Revenue</span>
            </button>

            <button
              role="tab"
              aria-selected={activeTab === "did_identity"}
              onClick={() => setActiveTab("did_identity")}
              className={`flex items-center justify-center gap-1 py-1.5 rounded transition-all ${
                activeTab === "did_identity"
                  ? "bg-[#16191F] text-[#00EC97] font-medium border border-[#232833]"
                  : "text-[#6B7280] hover:text-[#9CA3AF]"
              }`}
            >
              <Fingerprint className="w-3 h-3" />
              <span>DID</span>
            </button>
          </div>

          {/* Dock Panels */}
          <div className="flex-1 overflow-y-auto pr-0.5 flex flex-col gap-2.5 min-h-0">
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

            {activeTab === "did_identity" && <AgentDIDCard />}
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

      {/* 6. Hardware Discovery & Provisioning Wizard */}
      <OnboardingWizard
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        account={account}
        onPairingComplete={refreshState}
      />
    </div>
  );
}
