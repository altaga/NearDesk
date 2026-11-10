"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Cpu,
  ShieldCheck,
  Terminal,
  Radio,
  ArrowRight,
  Lock,
  Zap,
  Activity,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Flame,
  CheckCircle2,
  HardDrive,
  Network,
} from "lucide-react";
import { getStoredWalletSession, WalletSession } from "../lib/wallet";

export default function PresentationPage() {
  const [walletSession, setWalletSession] = useState<WalletSession | null>(null);

  useEffect(() => {
    setWalletSession(getStoredWalletSession());
  }, []);

  return (
    <div className="min-h-screen w-screen bg-[#07080A] text-[#EDEDEF] flex flex-col font-sans selection:bg-[#00EC97]/20 selection:text-[#00EC97] overflow-x-hidden">
      {/* 1. Header / Navbar */}
      <header className="sticky top-0 z-40 w-full px-6 py-4 flex items-center justify-between border-b border-[#14171E] bg-[#07080A]/85 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#10131A] border border-[#1E232E] flex items-center justify-center text-[#00EC97] font-bold text-xs tracking-tighter shadow-sm">
            ND
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight text-[#EDEDEF]">
              NearDesk
            </span>
            <span className="text-[10px] font-mono text-[#717786]">
              Sovereign Jetson AI Desk
            </span>
          </div>
        </div>

        {/* Middle Hardware Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[#0E1015] border border-[#1B1F28] rounded-full text-[11px] font-mono text-[#8C92A0]">
          <span className="w-2 h-2 rounded-full bg-[#00EC97] animate-pulse" />
          <span>NVIDIA Jetson Orin Platform</span>
          <span className="text-[#3A404F]">/</span>
          <span>WebRTC P2P</span>
          <span className="text-[#3A404F]">/</span>
          <span className="text-[#00EC97]">NEAR Testnet Active</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          {walletSession?.connected ? (
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 bg-[#00EC97] hover:bg-[#00D687] text-[#08090C] font-semibold text-xs rounded transition-all flex items-center gap-1.5 shadow-sm"
            >
              <span>Operator Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 bg-[#12151D] hover:bg-[#181D26] border border-[#222733] hover:border-[#00EC97]/40 text-[#EDEDEF] text-xs font-medium rounded transition-all flex items-center gap-1.5"
              >
                <KeyRound className="w-3.5 h-3.5 text-[#00EC97]" />
                <span>Connect Wallet</span>
              </Link>
              <Link
                href="/dashboard"
                className="px-3.5 py-1.5 bg-[#00EC97] hover:bg-[#00D687] text-[#08090C] font-semibold text-xs rounded transition-all flex items-center gap-1 shadow-sm"
              >
                <span>Launch Desk</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </>
          )}
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative px-6 pt-16 pb-20 max-w-6xl mx-auto flex flex-col items-center text-center">
        {/* Glow ambient background */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[280px] bg-[#00EC97]/5 blur-[120px] pointer-events-none rounded-full" />

        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#10131A] border border-[#1E232E] rounded-full text-xs font-mono text-[#00EC97] mb-6">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Zero-Cloud Cryptographic Sovereignty</span>
        </div>

        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-[#EDEDEF] max-w-3xl leading-[1.12]">
          Physical AI Operator Desk for NVIDIA Jetson.
        </h1>

        <p className="mt-5 text-base md:text-lg text-[#858B99] max-w-2xl leading-relaxed">
          Local edge intelligence meets NEAR Protocol. Direct peer-to-peer WebRTC transport, on-chain cryptographic hardware fencing, and autonomous hybrid model routing.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/login"
            className="px-5 py-2.5 bg-[#00EC97] hover:bg-[#00D687] text-[#08090C] font-semibold text-sm rounded transition-all flex items-center gap-2 shadow-lg shadow-[#00EC97]/10"
          >
            <Lock className="w-4 h-4" />
            <span>Connect Wallet & Enter Desk</span>
          </Link>

          <Link
            href="/dashboard"
            className="px-5 py-2.5 bg-[#12151D] hover:bg-[#181D26] border border-[#222733] hover:border-[#353D4E] text-[#EDEDEF] font-medium text-sm rounded transition-all flex items-center gap-2"
          >
            <span>Explore Live Dashboard</span>
            <ArrowRight className="w-4 h-4 text-[#717786]" />
          </Link>
        </div>

        {/* Quick Specs Strip */}
        <div className="mt-14 w-full grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
          <div className="p-4 bg-[#0B0D11] border border-[#171A21] rounded">
            <span className="text-[10px] font-mono uppercase text-[#6B7280]">Transport Layer</span>
            <div className="text-sm font-semibold text-[#EDEDEF] mt-0.5">WebRTC P2P DataChannels</div>
            <p className="text-[11px] text-[#717786] mt-1">Zero cloud relay in terminal or telemetry streams</p>
          </div>

          <div className="p-4 bg-[#0B0D11] border border-[#171A21] rounded">
            <span className="text-[10px] font-mono uppercase text-[#6B7280]">Authentication</span>
            <div className="text-sm font-semibold text-[#EDEDEF] mt-0.5">NEAR Ed25519 Signatures</div>
            <p className="text-[11px] text-[#717786] mt-1">Verified on-chain via official NEAR RPC nodes</p>
          </div>

          <div className="p-4 bg-[#0B0D11] border border-[#171A21] rounded">
            <span className="text-[10px] font-mono uppercase text-[#6B7280]">Model Router</span>
            <div className="text-sm font-semibold text-[#EDEDEF] mt-0.5">Hybrid Edge / NEAR AI Cloud</div>
            <p className="text-[11px] text-[#717786] mt-1">Ollama local edge + NEAR AI Cloud (TEE Enclaves)</p>
          </div>

          <div className="p-4 bg-[#0B0D11] border border-[#171A21] rounded">
            <span className="text-[10px] font-mono uppercase text-[#6B7280]">Hardware Target</span>
            <div className="text-sm font-semibold text-[#EDEDEF] mt-0.5">NVIDIA Jetson Orin 8GB</div>
            <p className="text-[11px] text-[#717786] mt-1">Full Tegrastats, thermal sensors & GPIO control</p>
          </div>
        </div>
      </section>

      {/* 3. Deep Architecture Pillars */}
      <section className="px-6 py-16 border-t border-[#13161D] bg-[#090B0E]/60">
        <div className="max-w-6xl mx-auto flex flex-col gap-10">
          <div>
            <span className="text-xs font-mono uppercase text-[#00EC97] tracking-wider">
              System Architecture
            </span>
            <h2 className="text-2xl md:text-3xl font-semibold text-[#EDEDEF] mt-1.5 tracking-tight">
              Designed for physical edge sovereignty.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Pillar 1: WebRTC P2P */}
            <div className="p-6 bg-[#0C0E13] border border-[#1B1F28] rounded flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded bg-[#131720] border border-[#212734] flex items-center justify-center text-[#00EC97] mb-4">
                  <Network className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-[#EDEDEF] tracking-tight">
                  P2P Direct Encrypted Channels
                </h3>
                <p className="text-xs text-[#7E8492] mt-2 leading-relaxed">
                  Terminal keystrokes, remote shell stdout, files, and tegrastats telemetry communicate directly between browser and Jetson using SCTP over DTLS/UDP. STUN is used strictly for ICE candidate discovery, eliminating third-party data proxies.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#161A22] text-[11px] font-mono text-[#00EC97]">
                Latency: Sub-millisecond on LAN
              </div>
            </div>

            {/* Pillar 2: NEAR Fencing */}
            <div className="p-6 bg-[#0C0E13] border border-[#1B1F28] rounded flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded bg-[#131720] border border-[#212734] flex items-center justify-center text-[#00EC97] mb-4">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-[#EDEDEF] tracking-tight">
                  On-Chain Cryptographic Fencing
                </h3>
                <p className="text-xs text-[#7E8492] mt-2 leading-relaxed">
                  Destructive shell actions, firmware patches, and agent executions require mathematical proof from authorized NEAR access keys. Zero Web2 session spoofing: all commands verify cryptographic signatures against the blockchain state trie.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#161A22] text-[11px] font-mono text-[#00EC97]">
                Standard: NEP-413 Ed25519 Verify
              </div>
            </div>

            {/* Pillar 3: Hybrid LLM Router */}
            <div className="p-6 bg-[#0C0E13] border border-[#1B1F28] rounded flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded bg-[#131720] border border-[#212734] flex items-center justify-center text-[#00EC97] mb-4">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-base font-semibold text-[#EDEDEF] tracking-tight">
                  NEAR AI Cloud & Sovereign Budget
                </h3>
                <p className="text-xs text-[#7E8492] mt-2 leading-relaxed">
                  Light queries execute locally on Jetson Orin Ampere GPU via Ollama. Complex reasoning routes dynamically to NEAR AI Cloud models (Llama 3.3 70B, Qwen 2.5 Coder, DeepSeek V3) with verifiable TEE hardware attestation and strict NEAR budget metering.
                </p>
              </div>
              <div className="mt-5 pt-4 border-t border-[#161A22] text-[11px] font-mono text-[#00EC97]">
                Modes: Hybrid · Local-Fast · NEAR AI Cloud
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Live Node Status Banner */}
      <section className="px-6 py-14 max-w-6xl mx-auto w-full">
        <div className="p-6 bg-[#0C0E13] border border-[#1C202A] rounded-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded bg-[#13161E] border border-[#232936] flex items-center justify-center text-[#00EC97] shrink-0">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#EDEDEF]">
                  NVIDIA Jetson Edge Station Ready
                </h3>
                <span className="w-2 h-2 rounded-full bg-[#00EC97]" />
              </div>
              <p className="text-xs text-[#7E8492] mt-0.5">
                Hardware Node: kratos · IP: 192.168.1.102 / 192.168.55.1 · Fast API Daemon v0.2.0 Active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/login"
              className="px-4 py-2 bg-[#00EC97] hover:bg-[#00D687] text-[#08090C] font-semibold text-xs rounded transition-all flex items-center gap-1.5"
            >
              <span>Connect Wallet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 5. Minimalist Swiss Footer */}
      <footer className="mt-auto px-6 py-6 border-t border-[#13161D] bg-[#07080A] flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-[#6B7280] font-mono">
        <div className="flex items-center gap-2">
          <span>NearDesk Physical Edge Platform</span>
          <span>·</span>
          <span>Open-Source Hardware Operator</span>
        </div>

        <div className="flex items-center gap-4">
          <a
            href="https://docs.near.org"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#00EC97] transition-colors flex items-center gap-1"
          >
            <span>NEAR Docs</span>
            <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href="https://testnet.nearblocks.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#00EC97] transition-colors flex items-center gap-1"
          >
            <span>NearBlocks Explorer</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </footer>
    </div>
  );
}
