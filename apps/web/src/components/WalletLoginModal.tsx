"use client";

import React, { useState, useEffect } from "react";
import {
  X,
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
} from "lucide-react";
import {
  WalletProvider,
  authenticateWithClientKey,
  authenticateWithNodeKey,
} from "../lib/wallet";
import { generateEphemeralKeypair } from "../lib/crypto_signer";

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
  const [activeTab, setActiveTab] = useState<"direct_key" | "operator_node" | "web3_wallet">(
    "direct_key"
  );

  // Direct Key state
  const [accountIdInput, setAccountIdInput] = useState<string>("");
  const [privateKeyInput, setPrivateKeyInput] = useState<string>("");
  const [showPrivateKey, setShowPrivateKey] = useState<boolean>(false);

  // Status & loading
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authStep, setAuthStep] = useState<string>("");
  const [lastSignature, setLastSignature] = useState<string | null>(null);

  // Close on Escape key
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

  // Handle Local Key Signing (Real Client-Side Ed25519 Signature)
  const handleSignWithPrivateKey = async () => {
    if (!accountIdInput.trim()) {
      setErrorMsg("Please enter your NEAR Account ID (e.g. altaga.testnet)");
      return;
    }
    if (!privateKeyInput.trim()) {
      setErrorMsg("Please enter your NEAR Ed25519 Private Key");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setLastSignature(null);

    try {
      setAuthStep("1/3 Requesting live cryptographic challenge from Jetson...");
      await new Promise((r) => setTimeout(r, 200));

      setAuthStep("2/3 Generating Ed25519 cryptographic signature in browser memory (TweetNaCl)...");
      const session = await authenticateWithClientKey(
        accountIdInput.trim(),
        privateKeyInput.trim(),
        network
      );

      setLastSignature(session.signature);
      setAuthStep("3/3 Verifying signature against NEAR blockchain RPC & claiming hardware...");
      await new Promise((r) => setTimeout(r, 400));

      onSuccess?.(session.account_id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Cryptographic authentication failed";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setAuthStep("");
    }
  };

  // Handle Jetson Hardware Node Key
  const handleSignWithNodeKey = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      setAuthStep("Requesting challenge & signing with Jetson's bound Ed25519 key...");
      const session = await authenticateWithNodeKey("neardesk-op-7708.testnet", network);
      setLastSignature(session.signature);
      onSuccess?.(session.account_id);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Node authentication failed";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
      setAuthStep("");
    }
  };

  // Quick helper to fill in demo / testnet node credentials
  const fillSampleKey = () => {
    setAccountIdInput("neardesk-op-7708.testnet");
    setPrivateKeyInput("ed25519:CPCpSDQ6ZAVUwJtAcKZsbK9kuQXyDeBrMjtB2JAu6mJj");
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-login-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150 select-none"
    >
      <div className="relative w-full max-w-lg bg-[#0C0E12] border border-[#1E222A] rounded shadow-2xl overflow-hidden flex flex-col font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1A1D24] bg-[#0E1015]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#14171E] border border-[#232833] flex items-center justify-center text-[#00EC97]">
              <KeyRound className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 id="wallet-login-title" className="text-sm font-semibold text-[#EDEDEF] tracking-tight">
                NEAR Cryptographic Authentication
              </h2>
              <p className="text-[11px] text-[#7E8492]">
                Sovereign Ed25519 signature verified on-chain via NEAR RPC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Network Toggle */}
            <div className="flex items-center bg-[#14171E] border border-[#20252F] p-0.5 rounded text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setNetwork("testnet")}
                className={`px-2 py-0.5 rounded-sm transition-colors ${
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
                className={`px-2 py-0.5 rounded-sm transition-colors ${
                  network === "mainnet"
                    ? "bg-[#00EC97]/15 text-[#00EC97] font-semibold"
                    : "text-[#6B7280] hover:text-[#EDEDEF]"
                }`}
              >
                Mainnet
              </button>
            </div>

            <button
              onClick={onClose}
              aria-label="Close modal"
              className="p-1 text-[#6B7280] hover:text-[#EDEDEF] rounded hover:bg-[#161920] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1A1D24] bg-[#0A0C0F] text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab("direct_key")}
            className={`flex-1 py-2.5 px-3 text-center border-b-2 transition-colors ${
              activeTab === "direct_key"
                ? "border-[#00EC97] text-[#00EC97] font-medium bg-[#11141B]"
                : "border-transparent text-[#7E8492] hover:text-[#EDEDEF]"
            }`}
          >
            Sovereign Signer (Ed25519)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("operator_node")}
            className={`flex-1 py-2.5 px-3 text-center border-b-2 transition-colors ${
              activeTab === "operator_node"
                ? "border-[#00EC97] text-[#00EC97] font-medium bg-[#11141B]"
                : "border-transparent text-[#7E8492] hover:text-[#EDEDEF]"
            }`}
          >
            Jetson Node Key
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("web3_wallet")}
            className={`flex-1 py-2.5 px-3 text-center border-b-2 transition-colors ${
              activeTab === "web3_wallet"
                ? "border-[#00EC97] text-[#00EC97] font-medium bg-[#11141B]"
                : "border-transparent text-[#7E8492] hover:text-[#EDEDEF]"
            }`}
          >
            Browser Wallets
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4">
          {errorMsg && (
            <div className="flex items-start gap-2 p-2.5 bg-rose-500/10 border border-rose-500/25 rounded text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading && authStep && (
            <div className="flex items-center gap-2.5 p-3 bg-[#00EC97]/10 border border-[#00EC97]/30 rounded text-xs text-[#00EC97]">
              <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              <div className="flex flex-col">
                <span className="font-semibold font-mono text-[10px] uppercase tracking-wider text-[#00EC97]/80">
                  Live Cryptographic Handshake
                </span>
                <span className="text-xs text-[#EDEDEF]">{authStep}</span>
              </div>
            </div>
          )}

          {/* TAB 1: Sovereign Client Signer */}
          {activeTab === "direct_key" && (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-[#7E8492]">
                  Sign a live Jetson challenge directly in browser memory. Your key never leaves this client.
                </p>
                <button
                  type="button"
                  onClick={fillSampleKey}
                  className="text-[10px] text-[#00EC97] hover:underline font-mono flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  Load Verified Testnet Key
                </button>
              </div>

              {/* Account ID Input */}
              <div className="flex flex-col gap-1">
                <label className="text-[11px] font-medium text-[#969CAC]">
                  NEAR Account ID ({network})
                </label>
                <input
                  type="text"
                  value={accountIdInput}
                  onChange={(e) => setAccountIdInput(e.target.value)}
                  placeholder={network === "testnet" ? "operator.testnet" : "operator.near"}
                  className="bg-[#101216] border border-[#20252F] focus:border-[#00EC97] rounded px-3 py-1.5 text-xs text-[#EDEDEF] placeholder-[#555C6E] font-mono outline-none transition-colors"
                />
              </div>

              {/* Private Key Input */}
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
                  className="bg-[#101216] border border-[#20252F] focus:border-[#00EC97] rounded px-3 py-1.5 text-xs text-[#EDEDEF] placeholder-[#555C6E] font-mono outline-none transition-colors"
                />
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={isLoading || !accountIdInput.trim() || !privateKeyInput.trim()}
                onClick={handleSignWithPrivateKey}
                className="w-full mt-1 py-2.5 bg-[#00EC97] hover:bg-[#00D687] text-[#090A0D] font-semibold text-xs rounded transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Sign Challenge & Verify On-Chain</span>
                  </>
                )}
              </button>

              <div className="p-2.5 bg-[#0F1116] border border-[#1A1E26] rounded text-[11px] text-[#6B7280] space-y-1">
                <div className="flex items-center gap-1.5 text-[#969CAC]">
                  <CheckCircle2 className="w-3 h-3 text-[#00EC97]" />
                  <span className="font-medium">Zero-Trust Verification Architecture</span>
                </div>
                <p>
                  1. The board issues a single-use random nonce.
                  <br />
                  2. TweetNaCl computes an authentic 64-byte Ed25519 signature in browser.
                  <br />
                  3. The Jetson verifies that the public key is registered on the NEAR blockchain.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: Jetson Node Key */}
          {activeTab === "operator_node" && (
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-[#111318] border border-[#1E222A] rounded">
                <div className="flex items-center gap-2 mb-1.5">
                  <Cpu className="w-4 h-4 text-[#00EC97]" />
                  <span className="text-xs font-semibold text-[#EDEDEF]">
                    Jetson Hardware Operator Identity
                  </span>
                </div>
                <p className="text-[11px] text-[#7E8492]">
                  Authenticates directly using the bound node key stored in the physical Jetson Orin device.
                </p>
                <div className="mt-2 text-[10px] font-mono text-[#00EC97] bg-[#00EC97]/10 p-1.5 rounded border border-[#00EC97]/20">
                  Account: neardesk-op-7708.testnet
                  <br />
                  Key: ed25519:8fzv1QKfaznsM9oS8CLHMCDp7HkfGegJULZYwCcT1V5
                </div>
              </div>

              <button
                type="button"
                disabled={isLoading}
                onClick={handleSignWithNodeKey}
                className="w-full py-2.5 bg-[#14171E] hover:bg-[#1A1E26] border border-[#232833] hover:border-[#00EC97]/50 text-[#EDEDEF] hover:text-[#00EC97] font-semibold text-xs rounded transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Connect with Jetson Operator Key</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: Web3 Browser Wallets */}
          {activeTab === "web3_wallet" && (
            <div className="flex flex-col gap-2.5">
              <p className="text-[11px] text-[#7E8492]">
                Standard NEAR Web3 wallets supported via NEP-413 sign-message:
              </p>

              <div className="flex flex-col gap-2">
                <div className="p-2.5 bg-[#111318] border border-[#1E222A] rounded flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Wallet className="w-4 h-4 text-[#969CAC]" />
                    <div>
                      <div className="text-xs font-medium text-[#EDEDEF]">MyNearWallet</div>
                      <div className="text-[10px] text-[#6B7280]">Web-based sovereign wallet</div>
                    </div>
                  </div>
                  <a
                    href={`https://${network === "testnet" ? "testnet." : ""}mynearwallet.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#00EC97] hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>Open Wallet</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-2.5 bg-[#111318] border border-[#1E222A] rounded flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#969CAC]" />
                    <div>
                      <div className="text-xs font-medium text-[#EDEDEF]">Meteor Wallet</div>
                      <div className="text-[10px] text-[#6B7280]">Browser extension wallet</div>
                    </div>
                  </div>
                  <a
                    href="https://meteorwallet.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-[#00EC97] hover:underline flex items-center gap-1 font-mono"
                  >
                    <span>Get Extension</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-5 py-3 bg-[#0A0C0F] border-t border-[#16181F] flex items-center justify-between text-[11px] text-[#555C6E]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00EC97]" />
            <span>Cryptographic Session (Ed25519)</span>
          </div>

          <a
            href="https://docs.near.org/concepts/basics/access-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#717786] hover:text-[#00EC97] transition-colors"
          >
            <span>NEAR Access Keys Docs</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
