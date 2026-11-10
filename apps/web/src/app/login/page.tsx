"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Wallet,
  ShieldCheck,
  Cpu,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  KeyRound,
  Sparkles,
  Eye,
  EyeOff,
  Flame,
  ArrowLeft,
  ChevronRight,
} from "lucide-react";
import {
  WalletProvider,
  authenticateWithClientKey,
  authenticateWithNodeKey,
  authenticateWithMeteor,
  getStoredWalletSession,
} from "../../lib/wallet";

export default function LoginPage() {
  const router = useRouter();
  const [network, setNetwork] = useState<"testnet" | "mainnet">("testnet");
  const [activeTab, setActiveTab] = useState<"meteor" | "direct_key" | "operator_node">(
    "meteor"
  );

  // Direct Key inputs
  const [accountIdInput, setAccountIdInput] = useState<string>("");
  const [privateKeyInput, setPrivateKeyInput] = useState<string>("");
  const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);

  // Status & loading
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<string>("");
  const [isMeteorDetected, setIsMeteorDetected] = useState<boolean>(false);

  // Check if user is already logged in or if Meteor is present
  useEffect(() => {
    const existing = getStoredWalletSession();
    if (existing?.connected) {
      // User already authenticated
    }

    // Detect Meteor or NEAR extension
    const checkInjected = () => {
      const win = window as unknown as { meteor?: unknown; near?: unknown };
      if (win.meteor || win.near) {
        setIsMeteorDetected(true);
      }
    };
    checkInjected();
    const t = setTimeout(checkInjected, 1000);
    return () => clearTimeout(t);
  }, []);

  // 1. Connect via Meteor Wallet Extension
  const handleConnectMeteor = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      setAuthStep("Requesting account authorization from Meteor Wallet extension...");
      await new Promise((r) => setTimeout(r, 200));

      setAuthStep("Requesting cryptographic signature for live Jetson challenge...");
      const session = await authenticateWithMeteor(network);

      setAuthStep("Signature verified on-chain! Initializing desk session...");
      await new Promise((r) => setTimeout(r, 600));

      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Meteor authentication failed";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setAuthStep("");
    }
  };

  // 2. Connect via Sovereign Client Signer (TweetNaCl)
  const handleSignWithPrivateKey = async () => {
    if (!accountIdInput.trim()) {
      setErrorMsg("Please enter your NEAR Account ID (e.g. your-name.testnet)");
      return;
    }
    if (!privateKeyInput.trim()) {
      setErrorMsg("Please enter your NEAR Ed25519 Private Key");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      setAuthStep("1/3 Requesting live cryptographic challenge from Jetson...");
      await new Promise((r) => setTimeout(r, 200));

      setAuthStep("2/3 Generating Ed25519 signature in browser memory (TweetNaCl)...");
      await authenticateWithClientKey(
        accountIdInput.trim(),
        privateKeyInput.trim(),
        network
      );

      setAuthStep("3/3 Verified against NEAR RPC! Routing to Operator Dashboard...");
      await new Promise((r) => setTimeout(r, 500));

      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cryptographic authentication failed";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setAuthStep("");
    }
  };

  // 3. Connect via Jetson Hardware Node Key
  const handleSignWithNodeKey = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      setAuthStep("Authenticating using physical Jetson node key...");
      await authenticateWithNodeKey("neardesk-op-7708.testnet", network);
      setAuthStep("Hardware operator session established! Routing...");
      await new Promise((r) => setTimeout(r, 500));
      router.push("/dashboard");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Node authentication failed";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setAuthStep("");
    }
  };

  // Fill the Burnable Wallet created on-chain
  const fillBurnableWallet = () => {
    setAccountIdInput("a69d770c221f3f4b9ed0dc913a201940a355deeceb112a55b340a5cf30ee1ed6");
    setPrivateKeyInput("ed25519:2DAx8zC2k2vW2Zg19QLsxBNKoLmVXsH7agj9kiKgZWwNXMsEkyFTKKi68nYnZD47jJhSJtmPYTRebyu668NpMYER");
  };

  return (
    <div className="min-h-screen w-screen bg-[#07080A] text-[#EDEDEF] flex flex-col font-sans selection:bg-[#00EC97]/20 selection:text-[#00EC97]">
      {/* Top Simple Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-[#15181F] bg-[#090A0D]/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs font-mono text-[#7E8492] hover:text-[#EDEDEF] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Presentation</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Network Switcher */}
          <div className="flex items-center bg-[#101216] border border-[#1E222A] p-0.5 rounded text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setNetwork("testnet")}
              className={`px-2.5 py-1 rounded transition-colors ${
                network === "testnet"
                  ? "bg-[#00EC97]/15 text-[#00EC97] font-semibold"
                  : "text-[#6B7280] hover:text-[#EDEDEF]"
              }`}
            >
              Testnet
            </button>
            <button
              type="button"
              onClick={() => setNetwork("mainnet")}
              className={`px-2.5 py-1 rounded transition-colors ${
                network === "mainnet"
                  ? "bg-[#00EC97]/15 text-[#00EC97] font-semibold"
                  : "text-[#6B7280] hover:text-[#EDEDEF]"
              }`}
            >
              Mainnet
            </button>
          </div>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-[#0C0E12] border border-[#1E222A] rounded-lg shadow-2xl overflow-hidden flex flex-col">
          {/* Card Header */}
          <div className="p-6 border-b border-[#181B22] bg-[#0E1015]">
            <div className="w-10 h-10 rounded bg-[#13161D] border border-[#222732] flex items-center justify-center text-[#00EC97] mb-3 shadow-inner">
              <KeyRound className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-semibold text-[#EDEDEF] tracking-tight">
              Authenticate Operator Desk
            </h1>
            <p className="text-xs text-[#7E8492] mt-1 leading-relaxed">
              Sovereign cryptographic handshake verified directly by your NVIDIA Jetson Orin platform via NEAR blockchain RPC.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-[#181B22] bg-[#0A0C0F] text-xs font-mono">
            <button
              type="button"
              onClick={() => setActiveTab("meteor")}
              className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "meteor"
                  ? "border-[#00EC97] text-[#00EC97] font-medium bg-[#11141B]"
                  : "border-transparent text-[#7E8492] hover:text-[#EDEDEF]"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Meteor Wallet</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("direct_key")}
              className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "direct_key"
                  ? "border-[#00EC97] text-[#00EC97] font-medium bg-[#11141B]"
                  : "border-transparent text-[#7E8492] hover:text-[#EDEDEF]"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sovereign Signer</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("operator_node")}
              className={`flex-1 py-3 text-center border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === "operator_node"
                  ? "border-[#00EC97] text-[#00EC97] font-medium bg-[#11141B]"
                  : "border-transparent text-[#7E8492] hover:text-[#EDEDEF]"
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Node Key</span>
            </button>
          </div>

          {/* Form Area */}
          <div className="p-6 flex flex-col gap-4">
            {errorMsg && (
              <div className="flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/25 rounded text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isLoading && authStep && (
              <div className="flex items-center gap-3 p-3.5 bg-[#00EC97]/10 border border-[#00EC97]/30 rounded text-xs text-[#00EC97]">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold font-mono text-[10px] uppercase tracking-wider text-[#00EC97]/80">
                    Cryptographic Verification Active
                  </span>
                  <span className="text-xs text-[#EDEDEF] truncate">{authStep}</span>
                </div>
              </div>
            )}

            {/* TAB 1: METEOR WALLET */}
            {activeTab === "meteor" && (
              <div className="flex flex-col gap-3.5">
                <div className="p-3.5 bg-[#101217] border border-[#1D212B] rounded flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#EDEDEF]">
                      <ShieldCheck className="w-4 h-4 text-[#00EC97]" />
                      <span>Meteor Wallet Extension</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        isMeteorDetected
                          ? "bg-[#00EC97]/15 text-[#00EC97] border-[#00EC97]/30"
                          : "bg-[#1E222A] text-[#7E8492] border-[#2C323E]"
                      }`}
                    >
                      {isMeteorDetected ? "Extension Detected" : "Browser Web3 Standard"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7E8492] leading-relaxed">
                    Connects directly to your Meteor Wallet extension to sign a live hardware nonce challenge via NEP-413 signMessage.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleConnectMeteor}
                  className="w-full py-3 bg-[#00EC97] hover:bg-[#00D687] text-[#08090C] font-semibold text-xs rounded transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Sign In with Meteor Wallet</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>

                <div className="p-3 bg-[#0E1015] border border-[#191C24] rounded text-[11px] text-[#6B7280] space-y-1">
                  <div className="flex items-center gap-1.5 text-[#969CAC] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00EC97]" />
                    <span>How it works:</span>
                  </div>
                  <p>
                    1. Jetson generates a single-use random nonce.
                    <br />
                    2. Meteor Wallet signs the challenge with your account key.
                    <br />
                    3. Jetson verifies the signature against NEAR Testnet RPC.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: SOVEREIGN SIGNER (DIRECT KEY) */}
            {activeTab === "direct_key" && (
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-[#7E8492]">
                    Key signs challenge in browser memory with TweetNaCl. Never leaves your client.
                  </p>
                  <button
                    type="button"
                    onClick={fillBurnableWallet}
                    className="text-[10px] text-[#00EC97] hover:underline font-mono flex items-center gap-1"
                  >
                    <Flame className="w-3 h-3 text-[#00EC97]" />
                    Load Burnable Testnet Wallet
                  </button>
                </div>

                {/* Account ID */}
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-medium text-[#969CAC]">
                    NEAR Account ID ({network})
                  </label>
                  <input
                    type="text"
                    value={accountIdInput}
                    onChange={(e) => setAccountIdInput(e.target.value)}
                    placeholder="account.testnet or 64-hex implicit"
                    className="bg-[#101216] border border-[#20252F] focus:border-[#00EC97] rounded px-3 py-2 text-xs text-[#EDEDEF] placeholder-[#555C6E] font-mono outline-none transition-colors"
                  />
                </div>

                {/* Private Key */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-[#969CAC]">
                      NEAR Ed25519 Private Key
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPrivateKey(!showPrivateKey)}
                      className="text-[10px] text-[#717786] hover:text-[#EDEDEF] flex items-center gap-1"
                    >
                      {showPrivateKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{showPrivateKey ? "Hide" : "Show"}</span>
                    </button>
                  </div>
                  <input
                    type={showPrivateKey ? "text" : "password"}
                    value={privateKeyInput}
                    onChange={(e) => setPrivateKeyInput(e.target.value)}
                    placeholder="ed25519:..."
                    className="bg-[#101216] border border-[#20252F] focus:border-[#00EC97] rounded px-3 py-2 text-xs text-[#EDEDEF] placeholder-[#555C6E] font-mono outline-none transition-colors"
                  />
                </div>

                <button
                  type="button"
                  disabled={isLoading || !accountIdInput.trim() || !privateKeyInput.trim()}
                  onClick={handleSignWithPrivateKey}
                  className="w-full mt-1 py-3 bg-[#00EC97] hover:bg-[#00D687] text-[#08090C] font-semibold text-xs rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Sign Challenge & Enter Dashboard</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* TAB 3: JETSON NODE KEY */}
            {activeTab === "operator_node" && (
              <div className="flex flex-col gap-3.5">
                <div className="p-3.5 bg-[#101217] border border-[#1D212B] rounded">
                  <div className="flex items-center gap-2 mb-1">
                    <Cpu className="w-4 h-4 text-[#00EC97]" />
                    <span className="text-xs font-semibold text-[#EDEDEF]">
                      Jetson Bound Hardware Key
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7E8492] leading-relaxed">
                    Uses the node-bound Ed25519 credential provisioned on the physical Jetson Orin device (`neardesk-op-7708.testnet`).
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleSignWithNodeKey}
                  className="w-full py-3 bg-[#13161D] hover:bg-[#1A1F29] border border-[#242A36] hover:border-[#00EC97]/50 text-[#EDEDEF] hover:text-[#00EC97] font-semibold text-xs rounded transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Sign In with Jetson Node Key</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="px-6 py-3.5 bg-[#090A0D] border-t border-[#15181F] flex items-center justify-between text-[11px] text-[#6B7280]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00EC97]" />
              <span>NVIDIA Jetson Edge Node Online</span>
            </div>

            <Link
              href="/dashboard"
              className="text-[#7E8492] hover:text-[#00EC97] flex items-center gap-1 transition-colors"
            >
              <span>Explore as Guest</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
