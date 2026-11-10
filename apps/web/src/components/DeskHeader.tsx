"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Copy,
  Check,
  SlidersHorizontal,
  AlertCircle,
  Wallet,
  ExternalLink,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from "lucide-react";
import { BudgetStatus, TelemetryData, NearAccountStatus } from "../lib/types";
import { WalletSession } from "../lib/wallet";
import { p2pClient, P2PConnectionState } from "../lib/webrtc";

interface DeskHeaderProps {
  telemetry: TelemetryData | null;
  budget: BudgetStatus | null;
  account: NearAccountStatus | null;
  walletSession: WalletSession | null;
  pendingApprovalsCount: number;
  onOpenApprovals: () => void;
  onOpenOnboarding: () => void;
  onOpenWalletLogin: () => void;
  onDisconnectWallet: () => void;
}

export const DeskHeader: React.FC<DeskHeaderProps> = ({
  telemetry,
  budget,
  account,
  walletSession,
  pendingApprovalsCount,
  onOpenApprovals,
  onOpenOnboarding,
  onOpenWalletLogin,
  onDisconnectWallet,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [p2pState, setP2pState] = useState<P2PConnectionState>("disconnected");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // WebRTC P2P status sync
  useEffect(() => {
    return p2pClient.onStateChange((state) => {
      setP2pState(state);
    });
  }, []);

  const spent = budget?.total_spent_usd ?? 0.0;
  const maxB = budget?.max_budget_usd ?? 10.0;

  // Active account priority: connected wallet session or default board account
  const activeAccountId = walletSession?.account_id || account?.account_id || "";
  const activeBalance = walletSession?.balance_near ?? account?.balance_near ?? 0.0;
  const activeNetwork = walletSession?.network || account?.network || "testnet";
  const isConnected = !!walletSession?.connected || (!!account && !!account.account_id);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copyAccount = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeAccountId) return;
    navigator.clipboard.writeText(activeAccountId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const explorerUrl =
    activeNetwork === "mainnet"
      ? `https://nearblocks.io/address/${activeAccountId}`
      : `https://testnet.nearblocks.io/address/${activeAccountId}`;

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
          {activeNetwork}
        </span>

        {/* WebRTC Direct P2P Status Pill */}
        <button
          type="button"
          title={
            p2pState === "connected"
              ? "Encrypted P2P DataChannel active directly to NVIDIA Jetson (zero cloud relays)"
              : "Click to establish direct WebRTC P2P link with Jetson"
          }
          onClick={() => {
            if (p2pState !== "connected") {
              p2pClient.connect(activeAccountId);
            }
          }}
          className={`flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded border transition-all ${
            p2pState === "connected"
              ? "text-[#00EC97] bg-[#00EC97]/10 border-[#00EC97]/30 shadow-sm"
              : p2pState === "connecting"
              ? "text-amber-300 bg-amber-500/10 border-amber-500/25"
              : "text-[#717786] bg-[#121418] border-[#20252E] hover:text-[#EDEDEF] hover:border-[#2C323E]"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              p2pState === "connected"
                ? "bg-[#00EC97] animate-pulse"
                : p2pState === "connecting"
                ? "bg-amber-400"
                : "bg-[#555C6E]"
            }`}
          />
          <span>
            {p2pState === "connected"
              ? "P2P DIRECT"
              : p2pState === "connecting"
              ? "CONNECTING P2P..."
              : "START P2P"}
          </span>
        </button>
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
            <span>
              {pendingApprovalsCount} Action{pendingApprovalsCount > 1 ? "s" : ""}
            </span>
          </button>
        )}

        {/* NEAR Wallet Connection Capsule */}
        {isConnected && activeAccountId ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-1.5 bg-[#121418] hover:bg-[#181B21] border border-[#20252E] hover:border-[#2C323E] px-2.5 py-1 rounded text-[11px] transition-all"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-[#00EC97]" />
              <span className="text-[#EDEDEF] font-medium">
                {activeAccountId.length > 16
                  ? `${activeAccountId.slice(0, 6)}...${activeAccountId.slice(-4)}`
                  : activeAccountId}
              </span>
              <span className="text-[#3A404F]">|</span>
              <span className="text-[#00EC97] font-semibold">
                {activeBalance.toFixed(2)} N
              </span>
              <ChevronDown className="w-3 h-3 text-[#555C6E]" />
            </button>

            {/* Wallet Dropdown Popover */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-56 bg-[#0E1015] border border-[#222733] rounded shadow-2xl p-2 z-50 flex flex-col gap-1 font-sans text-xs">
                <div className="px-2 py-1.5 border-b border-[#1A1D24] flex flex-col">
                  <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-mono">
                    Authenticated Account
                  </span>
                  <span className="text-xs font-mono text-[#EDEDEF] truncate mt-0.5">
                    {activeAccountId}
                  </span>
                  <span className="text-[10px] text-[#00EC97] font-mono mt-0.5">
                    Balance: {activeBalance.toFixed(4)} NEAR
                  </span>
                </div>

                {walletSession?.signature && (
                  <div className="p-1.5 bg-[#12151B] border border-[#1E232E] rounded text-[10px] font-mono text-[#7E8492] flex flex-col gap-0.5 my-0.5">
                    <span className="text-[#00EC97] flex items-center gap-1 font-semibold">
                      <ShieldCheck className="w-3 h-3" />
                      ED25519 Verified On-Chain
                    </span>
                    <span className="truncate text-[#555C6E] text-[9px]">
                      PK: {walletSession.public_key}
                    </span>
                    <span className="text-[#EDEDEF] text-[10px]">
                      Role: {walletSession.role === "operator_owner" ? "Hardware Owner" : "Guest Sandbox"}
                    </span>
                  </div>
                )}

                <button
                  onClick={copyAccount}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-left text-[#969CAC] hover:text-[#EDEDEF] hover:bg-[#161920] rounded transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Copy className="w-3 h-3 text-[#6B7280]" />
                    <span>Copy Address</span>
                  </span>
                  {copied && <Check className="w-3 h-3 text-[#00EC97]" />}
                </button>

                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between w-full px-2 py-1.5 text-left text-[#969CAC] hover:text-[#EDEDEF] hover:bg-[#161920] rounded transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink className="w-3 h-3 text-[#6B7280]" />
                    <span>View on NearBlocks</span>
                  </span>
                </a>

                <div className="h-[1px] bg-[#1A1D24] my-1" />

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onOpenWalletLogin();
                  }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-left text-[#969CAC] hover:text-[#00EC97] hover:bg-[#161920] rounded transition-colors"
                >
                  <Wallet className="w-3 h-3 text-[#6B7280]" />
                  <span>Switch Wallet</span>
                </button>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onDisconnectWallet();
                  }}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-left text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
                >
                  <LogOut className="w-3 h-3 text-rose-400" />
                  <span>Disconnect</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={onOpenWalletLogin}
            className="flex items-center gap-1.5 bg-[#00EC97]/10 hover:bg-[#00EC97]/20 border border-[#00EC97]/30 hover:border-[#00EC97]/60 text-[#00EC97] font-semibold px-2.5 py-1 rounded text-[11px] transition-all shadow-sm"
          >
            <Wallet className="w-3 h-3" />
            <span>Connect Wallet</span>
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
