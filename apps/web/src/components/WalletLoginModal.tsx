"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Flame,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  authenticateWithMeteor,
  authenticateWithBurnableWallet,
  authenticateWithClientKey,
  isMeteorInstalled,
} from "../lib/wallet";

interface WalletLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (accountId: string) => void;
}

export const WalletLoginModal: React.FC<WalletLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");
  const [isMeteorDetected, setIsMeteorDetected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<string>("");
  const [showManual, setShowManual] = useState<boolean>(false);
  const [manualAccount, setManualAccount] = useState<string>("");
  const [manualKey, setManualKey] = useState<string>("");

  useEffect(() => {
    if (!isOpen) return;
    const check = () => {
      if (isMeteorInstalled()) {
        setIsMeteorDetected(true);
      }
    };
    check();
    const t = setTimeout(check, 800);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 1. Primary: Connect Meteor Wallet
  const handleConnectMeteor = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setAuthStep("Opening Meteor Wallet prompt...");
    try {
      const session = await authenticateWithMeteor(network);
      setAuthStep("Connected!");
      await new Promise((r) => setTimeout(r, 400));
      onSuccess?.(session.account_id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Meteor authentication failed";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setAuthStep("");
    }
  };

  // 2. Quick: Burnable Testnet Wallet
  const handleQuickBurnable = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setAuthStep("Activating testnet wallet...");
    try {
      const session = await authenticateWithBurnableWallet(network);
      setAuthStep("Connected!");
      await new Promise((r) => setTimeout(r, 400));
      onSuccess?.(session.account_id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setAuthStep("");
    }
  };

  // 3. Manual Key Sign In
  const handleManualSignIn = async () => {
    if (!manualAccount.trim() || !manualKey.trim()) {
      setErrorMsg("Please enter both Account ID and Private Key.");
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setAuthStep("Verifying key...");
    try {
      const session = await authenticateWithClientKey(
        manualAccount.trim(),
        manualKey.trim(),
        network
      );
      setAuthStep("Connected!");
      await new Promise((r) => setTimeout(r, 400));
      onSuccess?.(session.account_id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setAuthStep("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm select-none">
      <div className="w-full max-w-sm bg-[#0C0E13] border border-[#1E232E] rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#1A1D24] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00EC97]/10 border border-[#00EC97]/25 flex items-center justify-center text-[#00EC97]">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#EDEDEF]">
                Connect NEAR Wallet
              </h2>
              <p className="text-[11px] text-[#7E8492]">
                Switch or authenticate your operator identity
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-[#6B7280] hover:text-[#EDEDEF] rounded hover:bg-[#1A1D24] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex flex-col gap-4">
          {/* Network Pill */}
          <div className="flex items-center justify-between text-xs font-mono py-1 px-2.5 bg-[#101217] border border-[#1A1E26] rounded">
            <span className="text-[#6B7280]">Network</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setNetwork("testnet")}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  network === "testnet"
                    ? "bg-[#00EC97]/20 text-[#00EC97] font-semibold"
                    : "text-[#6B7280] hover:text-[#EDEDEF]"
                }`}
              >
                Testnet
              </button>
              <button
                onClick={() => setNetwork("mainnet")}
                className={`px-2 py-0.5 rounded text-[10px] ${
                  network === "mainnet"
                    ? "bg-[#00EC97]/20 text-[#00EC97] font-semibold"
                    : "text-[#6B7280] hover:text-[#EDEDEF]"
                }`}
              >
                Mainnet
              </button>
            </div>
          </div>

          {/* Feedback banners */}
          {errorMsg && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/25 rounded flex items-start gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {authStep && (
            <div className="p-2.5 bg-[#00EC97]/10 border border-[#00EC97]/25 rounded flex items-center gap-2 text-xs text-[#00EC97]">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{authStep}</span>
            </div>
          )}

          {/* Connect Meteor Button */}
          <div className="flex flex-col gap-1.5">
            <button
              onClick={handleConnectMeteor}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#00EC97] hover:bg-[#00D687] text-[#08090C] font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00EC97]/10 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Flame className="w-4 h-4" />
              )}
              <span>Connect Meteor Wallet</span>
            </button>

            {isMeteorDetected && (
              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#00EC97]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00EC97] animate-pulse" />
                <span>Meteor Extension Ready</span>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-[#171B23]" />
            <span className="text-[10px] font-mono uppercase text-[#4A5060]">or quick test</span>
            <div className="h-[1px] flex-1 bg-[#171B23]" />
          </div>

          {/* 1-Click Funded Testnet Wallet */}
          <button
            onClick={handleQuickBurnable}
            disabled={isLoading}
            className="w-full py-2 px-3 bg-[#11141B] hover:bg-[#161A23] border border-[#1E232E] hover:border-[#2C3342] text-[#EDEDEF] text-xs font-medium rounded-lg transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00EC97]" />
              <span>Funded Testnet Wallet</span>
            </div>
            <span className="text-[10px] font-mono text-[#00EC97] bg-[#00EC97]/10 px-1.5 py-0.5 rounded">
              0.50 NEAR
            </span>
          </button>

          {/* Manual Input Accordion */}
          <div className="pt-1 border-t border-[#14171F]">
            <button
              onClick={() => setShowManual(!showManual)}
              className="flex items-center justify-center gap-1.5 w-full text-[10px] text-[#6B7280] hover:text-[#EDEDEF] transition-colors cursor-pointer py-1"
            >
              <span>Manual Key Entry</span>
              {showManual ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {showManual && (
              <div className="mt-2 flex flex-col gap-2">
                <input
                  type="text"
                  placeholder="Account ID (e.g. name.testnet)"
                  value={manualAccount}
                  onChange={(e) => setManualAccount(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#090B0E] border border-[#1A1E27] rounded text-xs text-[#EDEDEF] font-mono placeholder:text-[#4A5060] focus:outline-none focus:border-[#00EC97]"
                />
                <input
                  type="password"
                  placeholder="Ed25519 Private Key"
                  value={manualKey}
                  onChange={(e) => setManualKey(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-[#090B0E] border border-[#1A1E27] rounded text-xs text-[#EDEDEF] font-mono placeholder:text-[#4A5060] focus:outline-none focus:border-[#00EC97]"
                />
                <button
                  onClick={handleManualSignIn}
                  disabled={isLoading}
                  className="w-full py-1.5 bg-[#161A23] hover:bg-[#1E232E] text-[#EDEDEF] text-xs font-medium rounded transition-colors cursor-pointer"
                >
                  Sign In with Key
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 bg-[#090A0D] border-t border-[#14171F] flex items-center justify-between text-[10px] text-[#555C6E] font-mono">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3 text-[#00EC97]" />
            <span>NEP-413 Ed25519</span>
          </div>
          <span>NearDesk</span>
        </div>
      </div>
    </div>
  );
};
