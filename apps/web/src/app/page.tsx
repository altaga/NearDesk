"use client";

import React, { useState, useEffect } from "react";
import { DeskHeader } from "../components/DeskHeader";
import { TelemetryBar } from "../components/TelemetryBar";
import { ChatStream } from "../components/ChatStream";
import { ChainSignaturesCard } from "../components/ChainSignaturesCard";
import { IntentSwapCard } from "../components/IntentSwapCard";
import { TerminalDrawer } from "../components/TerminalDrawer";
import { ApprovalModal } from "../components/ApprovalModal";
import { fetchTelemetry, fetchBudget, fetchApprovals } from "../lib/api";
import { TelemetryData, BudgetStatus, ApprovalRequest } from "../lib/types";

export default function DeskPage() {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [budget, setBudget] = useState<BudgetStatus | null>(null);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isApprovalOpen, setIsApprovalOpen] = useState<boolean>(false);

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

        {/* Right / Secondary Dock: NEAR Chain Signatures & NEAR Intents */}
        <section className="lg:col-span-5 h-full flex flex-col gap-4 overflow-y-auto pr-1">
          <ChainSignaturesCard />
          <IntentSwapCard />
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
