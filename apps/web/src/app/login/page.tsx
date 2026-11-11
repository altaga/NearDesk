"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Flame,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  authenticateWithMeteor,
  authenticateWithBurnableWallet,
  authenticateWithClientKey,
  isMeteorInstalled,
  getStoredWalletSession,
} from "../../lib/wallet";

export default function LoginPage() {
  const router = useRouter();
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");
  const [isMeteorDetected, setIsMeteorDetected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<string>("");
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualAccount, setManualAccount] = useState<string>("");
  const [manualKey, setManualKey] = useState<string>("");

  useEffect(() => {
    const existing = getStoredWalletSession();
    if (existing?.connected) {
      window.location.href = "/dashboard";
      return;
    }

    const check = () => {
      if (isMeteorInstalled()) {
        setIsMeteorDetected(true);
      }
    };
    check();
    const t1 = setTimeout(check, 500);
    const t2 = setTimeout(check, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [router]);

  // 1. Primary Action: Connect Meteor Wallet
  const handleConnectMeteor = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setAuthStep("Opening Meteor Wallet approval prompt...");
    try {
      await authenticateWithMeteor(network);
      setAuthStep("Connected! Entering dashboard...");
      await new Promise((r) => setTimeout(r, 300));
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Meteor authentication failed";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setAuthStep("");
    }
  };

  // 2. 1-Click Funded Testnet Account (0.50 NEAR)
  const handleQuickBurnable = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setAuthStep("Activating funded testnet operator session...");
    try {
      await authenticateWithBurnableWallet(network);
      setAuthStep("Verified! Entering dashboard...");
      await new Promise((r) => setTimeout(r, 300));
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign in failed";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setAuthStep("");
    }
  };

  // 3. Manual Key Sign In (if user toggles it)
  const handleManualSignIn = async () => {
    if (!manualAccount.trim() || !manualKey.trim()) {
      setErrorMsg("Please enter both Account ID and Private Key.");
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    setAuthStep("Verifying key against NEAR RPC...");
    try {
      await authenticateWithClientKey(manualAccount.trim(), manualKey.trim(), network);
      setAuthStep("Verified! Entering dashboard...");
      await new Promise((r) => setTimeout(r, 300));
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setAuthStep("");
    }
  };

  return (
    <div className="min-h-screen bg-[#07080A] text-[#EDEDEF] flex flex-col justify-between selection:bg-[#00EC97]/20 selection:text-[#00EC97]">
      {/* Top Bar */}
      <header className="h-14 border-b border-[#14171F] px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-[#7E8492] hover:text-[#EDEDEF] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Overview</span>
          </Link>
          <div className="h-4 w-[1px] bg-[#1C202B]" />
          <div className="flex items-center gap-2">
            <img
              src="/logos/logo-symbol-color-dark.png"
              alt="NearDesk Logo"
              className="w-5 h-5 object-contain"
            />
            <span className="text-xs font-semibold text-[#EDEDEF] tracking-tight">NearDesk</span>
          </div>
        </div>

        {/* Network selector */}
        <div className="flex items-center p-0.5 bg-[#0E1015] border border-[#1A1D24] rounded text-[11px] font-mono">
          <button
            onClick={() => setNetwork("testnet")}
            className={`px-2.5 py-0.5 rounded transition-all ${
              network === "testnet"
                ? "bg-[#00EC97]/15 text-[#00EC97] font-semibold"
                : "text-[#6B7280] hover:text-[#EDEDEF]"
            }`}
          >
            Testnet
          </button>
          <button
            onClick={() => setNetwork("mainnet")}
            className={`px-2.5 py-0.5 rounded transition-all ${
              network === "mainnet"
                ? "bg-[#00EC97]/15 text-[#00EC97] font-semibold"
                : "text-[#6B7280] hover:text-[#EDEDEF]"
            }`}
          >
            Mainnet
          </button>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-[#0C0E13] border border-[#1B1F28] rounded-xl p-7 flex flex-col gap-6 shadow-2xl">
          {/* Header */}
          <div className="flex flex-col gap-2 text-center items-center">
            <div className="w-12 h-12 rounded-xl bg-[#10131B] border border-[#1E232E] flex items-center justify-center p-2 mb-1 shadow-inner">
              <img
                src="/logos/logo-symbol-color-dark.png"
                alt="NearDesk Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-lg font-semibold text-[#EDEDEF] tracking-tight">
              Connect NEAR Wallet
            </h1>
            <p className="text-xs text-[#7E8492] max-w-xs">
              Sign in with your wallet to authenticate and control your sovereign edge node.
            </p>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-lg flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {authStep && (
            <div className="p-3 bg-[#00EC97]/10 border border-[#00EC97]/25 rounded-lg flex items-center gap-2.5 text-xs text-[#00EC97]">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <span>{authStep}</span>
            </div>
          )}

          {/* Primary Action Button */}
          <div className="flex flex-col gap-2.5">
            <button
              onClick={handleConnectMeteor}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-[#00EC97] hover:bg-[#00D687] text-[#08090C] font-semibold text-sm rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#00EC97]/10 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Flame className="w-4 h-4" />
              )}
              <span>{isLoading ? "Connecting..." : "Connect Meteor Wallet"}</span>
            </button>

            {isMeteorDetected ? (
              <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-[#00EC97]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00EC97] animate-pulse" />
                <span>Meteor Wallet Extension Ready</span>
              </div>
            ) : (
              <p className="text-[11px] text-[#6B7280] text-center">
                Click to open Meteor Wallet approval prompt
              </p>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-[1px] flex-1 bg-[#171B23]" />
            <span className="text-[10px] font-mono uppercase text-[#4A5060]">or quick access</span>
            <div className="h-[1px] flex-1 bg-[#171B23]" />
          </div>

          {/* 1-Click Funded Testnet Account */}
          <button
            onClick={handleQuickBurnable}
            disabled={isLoading}
            className="w-full py-2.5 px-3.5 bg-[#11141B] hover:bg-[#161A23] border border-[#1E232E] hover:border-[#2C3342] text-[#EDEDEF] text-xs font-medium rounded-lg transition-all flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00EC97]" />
              <span>Test with Funded Account</span>
            </div>
            <span className="text-[10px] font-mono text-[#00EC97] bg-[#00EC97]/10 px-1.5 py-0.5 rounded">
              0.50 NEAR
            </span>
          </button>

          {/* Manual Input Toggle */}
          <div className="pt-2 border-t border-[#14171F]">
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="flex items-center justify-center gap-1.5 w-full text-[11px] text-[#6B7280] hover:text-[#EDEDEF] transition-colors cursor-pointer"
            >
              <span>Manual Key / Account Entry</span>
              {showManualInput ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>

            {showManualInput && (
              <div className="mt-3 flex flex-col gap-2.5 pt-2">
                <input
                  type="text"
                  placeholder="Account ID (e.g. name.testnet)"
                  value={manualAccount}
                  onChange={(e) => setManualAccount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090B0E] border border-[#1A1E27] rounded text-xs text-[#EDEDEF] font-mono placeholder:text-[#4A5060] focus:outline-none focus:border-[#00EC97]"
                />
                <input
                  type="password"
                  placeholder="Ed25519 Private Key"
                  value={manualKey}
                  onChange={(e) => setManualKey(e.target.value)}
                  className="w-full px-3 py-2 bg-[#090B0E] border border-[#1A1E27] rounded text-xs text-[#EDEDEF] font-mono placeholder:text-[#4A5060] focus:outline-none focus:border-[#00EC97]"
                />
                <button
                  onClick={handleManualSignIn}
                  disabled={isLoading}
                  className="w-full py-2 bg-[#161A23] hover:bg-[#1E232E] text-[#EDEDEF] text-xs font-medium rounded transition-colors cursor-pointer"
                >
                  Sign In with Key
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-10 border-t border-[#12141A] px-6 flex items-center justify-between text-[11px] text-[#555C6E] font-mono">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3 h-3 text-[#00EC97]" />
          <span>NEP-413 Ed25519 Standard</span>
        </div>
        <div className="flex items-center gap-2">
          <img
            src="/logos/logo-symbol-color-dark.png"
            alt="NearDesk"
            className="w-3.5 h-3.5 object-contain opacity-70"
          />
          <span>NearDesk Physical Edge</span>
        </div>
      </footer>
    </div>
  );
}
