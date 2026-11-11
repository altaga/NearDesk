"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Terminal,
  Cpu,
  ShieldCheck,
  Radio,
  BookOpen,
  KeyRound,
  History,
  Coins,
  Fingerprint,
  SlidersHorizontal,
  ArrowLeft,
  Lock,
} from "lucide-react";
import { DeskHeader } from "../../components/DeskHeader";
import { TelemetryBar } from "../../components/TelemetryBar";
import { ChatStream } from "../../components/ChatStream";
import { MachineView } from "../../components/machine/MachineView";
import { BoardDashboard } from "../../components/board/BoardDashboard";
import { NEARSovereignHub } from "../../components/near/NEARSovereignHub";
import { FleetPane } from "../../components/fleet/FleetPane";
import { LibraryPane } from "../../components/library/LibraryPane";
import { ChainSignaturesCard } from "../../components/ChainSignaturesCard";
import { IntentSwapCard } from "../../components/IntentSwapCard";
import { AgentFencingCard } from "../../components/AgentFencingCard";
import { AuditTrailCard } from "../../components/AuditTrailCard";
import { AgentEconomyCard } from "../../components/AgentEconomyCard";
import { AgentDIDCard } from "../../components/AgentDIDCard";
import { TerminalDrawer } from "../../components/TerminalDrawer";
import { ApprovalModal } from "../../components/ApprovalModal";
import { OnboardingWizard } from "../../components/OnboardingWizard";
import { WalletLoginModal } from "../../components/WalletLoginModal";
import { WalletSession, getStoredWalletSession, clearWalletSession } from "../../lib/wallet";
import { fetchTelemetry, fetchBudget, fetchApprovals, fetchOnChainAccount } from "../../lib/api";
import { TelemetryData, BudgetStatus, ApprovalRequest, NearAccountStatus } from "../../lib/types";

export type DeskMainView = "chat" | "machine" | "board" | "near" | "fleet" | "library";
type RightPanelTab = "chain_intents" | "security_fencing" | "audit_trail" | "agent_economy" | "did_identity";

export default function DashboardPage() {
  const router = useRouter();
  const [activeView, setActiveView] = useState<DeskMainView>("chat");
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [budget, setBudget] = useState<BudgetStatus | null>(null);
  const [account, setAccount] = useState<NearAccountStatus | null>(null);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isApprovalOpen, setIsApprovalOpen] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState<boolean>(false);
  const [walletSession, setWalletSession] = useState<WalletSession | null>(null);
  const [activeRightTab, setActiveRightTab] = useState<RightPanelTab>("chain_intents");

  // Sync wallet session on mount and upon changes
  useEffect(() => {
    const syncWallet = () => {
      const sess = getStoredWalletSession();
      setWalletSession(sess);
    };
    syncWallet();
    window.addEventListener("neardesk_wallet_change", syncWallet);
    return () => window.removeEventListener("neardesk_wallet_change", syncWallet);
  }, []);

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

  const NAV_ITEMS: Array<{ id: DeskMainView; label: string; icon: React.FC<{ className?: string }> }> = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "machine", label: "Machine", icon: Terminal },
    { id: "board", label: "Board", icon: Cpu },
    { id: "near", label: "NEAR Hub", icon: ShieldCheck },
    { id: "fleet", label: "Fleet", icon: Radio },
    { id: "library", label: "Library", icon: BookOpen },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#090A0D] text-[#EDEDEF] overflow-hidden font-sans">
      {/* 1. Left Operator Navigation Rail */}
      <aside
        aria-label="Operator Navigation Rail"
        className="w-14 bg-[#0A0C0F] border-r border-[#1A1D24] flex flex-col items-center py-3 justify-between select-none z-30 shrink-0"
      >
        {/* Brand Logo & Back to Home */}
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/"
            title="NearDesk Home Presentation"
            className="w-8 h-8 rounded bg-[#101216] hover:bg-[#161920] border border-[#1E222A] flex items-center justify-center p-1 shadow-sm transition-colors"
          >
            <img
              src="/logo.png"
              alt="NearDesk Logo"
              className="w-full h-full object-contain"
            />
          </Link>

          <div className="w-6 h-[1px] bg-[#1E222A]" />

          {/* Navigation Items */}
          <nav className="flex flex-col gap-1.5" aria-label="Main Views">
            {NAV_ITEMS.map((item) => {
              const IconComp = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={`w-9 h-9 rounded flex items-center justify-center transition-all ${
                    isActive
                      ? "bg-[#16191F] text-[#00EC97] border border-[#232833] shadow-sm"
                      : "text-[#6B7280] hover:text-[#EDEDEF] hover:bg-[#121419]"
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rail Bottom Status & Setup */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => setIsOnboardingOpen(true)}
            title="Hardware Pairing & Discovery"
            className="w-8 h-8 rounded flex items-center justify-center text-[#6B7280] hover:text-[#EDEDEF] hover:bg-[#121419] transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </button>

          <div className="w-2 h-2 rounded-full bg-[#00EC97] title='Connected to NearDesk Edge API'" />
        </div>
      </aside>

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Header */}
        <DeskHeader
          telemetry={telemetry}
          budget={budget}
          account={account}
          walletSession={walletSession}
          pendingApprovalsCount={approvals.length}
          onOpenApprovals={() => setIsApprovalOpen(true)}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          onOpenWalletLogin={() => {
            router.push("/login");
          }}
          onDisconnectWallet={() => {
            clearWalletSession();
            setWalletSession(null);
          }}
        />

        {/* Micro Telemetry Status Bar */}
        <TelemetryBar telemetry={telemetry} />

        {/* Active View Container */}
        <div className="flex-1 min-h-0 p-3.5 overflow-hidden">
          {/* VIEW 1: CHAT + QUICK CONTEXT DOCK */}
          {activeView === "chat" && (
            <main className="h-full grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0">
              {/* Left / Primary Console: Chat with Nova */}
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
                    aria-selected={activeRightTab === "chain_intents"}
                    onClick={() => setActiveRightTab("chain_intents")}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded transition-all ${
                      activeRightTab === "chain_intents"
                        ? "bg-[#16191F] text-[#00EC97] font-medium border border-[#232833]"
                        : "text-[#6B7280] hover:text-[#9CA3AF]"
                    }`}
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>Chains</span>
                  </button>

                  <button
                    role="tab"
                    aria-selected={activeRightTab === "security_fencing"}
                    onClick={() => setActiveRightTab("security_fencing")}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded transition-all ${
                      activeRightTab === "security_fencing"
                        ? "bg-[#16191F] text-[#00EC97] font-medium border border-[#232833]"
                        : "text-[#6B7280] hover:text-[#9CA3AF]"
                    }`}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    <span>Fencing</span>
                  </button>

                  <button
                    role="tab"
                    aria-selected={activeRightTab === "audit_trail"}
                    onClick={() => setActiveRightTab("audit_trail")}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded transition-all ${
                      activeRightTab === "audit_trail"
                        ? "bg-[#16191F] text-[#00EC97] font-medium border border-[#232833]"
                        : "text-[#6B7280] hover:text-[#9CA3AF]"
                    }`}
                  >
                    <History className="w-3 h-3" />
                    <span>Audit</span>
                  </button>

                  <button
                    role="tab"
                    aria-selected={activeRightTab === "agent_economy"}
                    onClick={() => setActiveRightTab("agent_economy")}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded transition-all ${
                      activeRightTab === "agent_economy"
                        ? "bg-[#16191F] text-[#00EC97] font-medium border border-[#232833]"
                        : "text-[#6B7280] hover:text-[#9CA3AF]"
                    }`}
                  >
                    <Coins className="w-3 h-3" />
                    <span>Revenue</span>
                  </button>

                  <button
                    role="tab"
                    aria-selected={activeRightTab === "did_identity"}
                    onClick={() => setActiveRightTab("did_identity")}
                    className={`flex items-center justify-center gap-1 py-1.5 rounded transition-all ${
                      activeRightTab === "did_identity"
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
                  {activeRightTab === "chain_intents" && (
                    <>
                      <ChainSignaturesCard />
                      <IntentSwapCard />
                    </>
                  )}

                  {activeRightTab === "security_fencing" && (
                    <>
                      <AgentFencingCard />
                      <ChainSignaturesCard />
                    </>
                  )}

                  {activeRightTab === "audit_trail" && <AuditTrailCard />}

                  {activeRightTab === "agent_economy" && <AgentEconomyCard />}

                  {activeRightTab === "did_identity" && <AgentDIDCard />}
                </div>
              </section>
            </main>
          )}

          {/* VIEW 2: MACHINE (FILES, TERMINAL, BROWSER, JOBS) */}
          {activeView === "machine" && <MachineView />}

          {/* VIEW 3: BOARD DASHBOARD (TEGRASTATS, SMP CORES, GPU, THERMALS, PROCESSES) */}
          {activeView === "board" && <BoardDashboard />}

          {/* VIEW 4: NEAR SOVEREIGN HUB (FULL SCREEN WEB3 SUITE) */}
          {activeView === "near" && <NEARSovereignHub />}

          {/* VIEW 5: FLEET MANAGER (DISCOVERY, USB GADGET, LAN, EMULATORS) */}
          {activeView === "fleet" && (
            <FleetPane
              onOpenPairing={() => setIsOnboardingOpen(true)}
              account={account}
            />
          )}

          {/* VIEW 6: LIBRARY & SOVEREIGN VAULT (MEMORY & SECRETS) */}
          {activeView === "library" && <LibraryPane />}
        </div>

        {/* Global Terminal Drawer (Expandable anytime) */}
        <TerminalDrawer onCommandSubmitted={refreshState} />

        {/* Approval Queue Modal */}
        <ApprovalModal
          isOpen={isApprovalOpen}
          onClose={() => setIsApprovalOpen(false)}
          requests={approvals}
          onRefresh={refreshState}
        />

        {/* Hardware Discovery & Onboarding Wizard */}
        <OnboardingWizard
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          account={account}
          onPairingComplete={refreshState}
        />

        {/* Web3 NEAR Wallet Login Modal */}
        <WalletLoginModal
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
          onSuccess={() => {
            refreshState();
          }}
        />
      </div>
    </div>
  );
}
