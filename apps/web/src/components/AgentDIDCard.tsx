"use client";

import React, { useState, useEffect } from "react";
import { Fingerprint, Copy, Check, Search, Code, ShieldCheck, ArrowUpRight } from "lucide-react";
import { fetchDIDDocument, fetchVerifiableCredential, resolveDIDOnChain } from "../lib/api";
import { W3CDIDDocument, VerifiableCredential } from "../lib/types";

export const AgentDIDCard: React.FC = () => {
  const [didDoc, setDidDoc] = useState<W3CDIDDocument | null>(null);
  const [vc, setVc] = useState<VerifiableCredential | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"document" | "credential" | "resolver">("document");
  const [searchQuery, setSearchQuery] = useState<string>("root.near");
  const [resolveResult, setResolveResult] = useState<any>(null);
  const [resolving, setResolving] = useState<boolean>(false);

  useEffect(() => {
    fetchDIDDocument().then((d) => d && setDidDoc(d));
    fetchVerifiableCredential().then((c) => c && setVc(c));
  }, []);

  const copyDID = () => {
    if (!didDoc?.id) return;
    navigator.clipboard.writeText(didDoc.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setResolving(true);
    const res = await resolveDIDOnChain(searchQuery);
    setResolveResult(res);
    setResolving(false);
  };

  return (
    <div className="bg-[#101216] border border-[#1E222A] rounded p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1A1D24] pb-2.5">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-3.5 h-3.5 text-[#00EC97]" />
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-[#EDEDEF]">
            W3C Decentralized Identifier
          </h2>
        </div>
        <span className="text-[10px] font-mono text-[#7E8492] tracking-tight">
          did:near Spec v1.0
        </span>
      </div>

      <p className="text-[11px] text-[#7E8492] leading-relaxed">
        Sovereign edge agent identity anchored cryptographically into NEAR key infrastructure.
      </p>

      {/* DID URI Bar */}
      <div className="bg-[#0A0B0E] border border-[#1A1D24] rounded px-3 py-2 flex items-center justify-between text-xs font-mono">
        <div className="flex flex-col gap-0.5 overflow-hidden pr-2">
          <span className="text-[9px] uppercase tracking-wider text-[#525866]">Agent Identifier</span>
          <span className="text-[#00EC97] font-medium truncate text-[11px]">
            {didDoc?.id || "did:near:loading..."}
          </span>
        </div>
        <button
          onClick={copyDID}
          aria-label="Copy Agent DID"
          className="flex items-center gap-1 text-[10px] text-[#9CA3AF] hover:text-[#EDEDEF] transition-colors shrink-0 bg-[#14161C] hover:bg-[#1A1D24] px-2 py-1 rounded border border-[#1E222A]"
        >
          {copied ? <Check className="w-3 h-3 text-[#00EC97]" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* View Switcher */}
      <div
        role="tablist"
        aria-label="DID Views"
        className="grid grid-cols-3 gap-1 bg-[#090A0D] p-1 border border-[#1A1D24] rounded text-[10px] font-mono"
      >
        <button
          role="tab"
          aria-selected={viewMode === "document"}
          onClick={() => setViewMode("document")}
          className={`py-1 rounded transition-colors text-center ${
            viewMode === "document"
              ? "bg-[#14171E] text-[#EDEDEF] font-medium border border-[#232833]"
              : "text-[#6B7280] hover:text-[#9CA3AF]"
          }`}
        >
          DID Document
        </button>

        <button
          role="tab"
          aria-selected={viewMode === "credential"}
          onClick={() => setViewMode("credential")}
          className={`py-1 rounded transition-colors text-center ${
            viewMode === "credential"
              ? "bg-[#14171E] text-[#EDEDEF] font-medium border border-[#232833]"
              : "text-[#6B7280] hover:text-[#9CA3AF]"
          }`}
        >
          Verifiable Credential
        </button>

        <button
          role="tab"
          aria-selected={viewMode === "resolver"}
          onClick={() => setViewMode("resolver")}
          className={`py-1 rounded transition-colors text-center ${
            viewMode === "resolver"
              ? "bg-[#14171E] text-[#EDEDEF] font-medium border border-[#232833]"
              : "text-[#6B7280] hover:text-[#9CA3AF]"
          }`}
        >
          Live Resolver
        </button>
      </div>

      {/* View 1: DID Document (JSON-LD) */}
      {viewMode === "document" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-[#6B7280]">
            <span>Verification Methods: {didDoc?.verificationMethod.length || 4} keys</span>
            <span className="text-[#00EC97] flex items-center gap-1 text-[10px]">
              <ShieldCheck className="w-3 h-3" /> W3C Conforming
            </span>
          </div>

          <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-2.5 text-[10px] font-mono text-[#9CA3AF] max-h-48 overflow-y-auto leading-relaxed">
            <pre className="whitespace-pre-wrap break-all">
              {JSON.stringify(didDoc, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* View 2: Verifiable Credential */}
      {viewMode === "credential" && (
        <div className="flex flex-col gap-2 text-xs font-mono">
          <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-2.5 flex flex-col gap-1.5 text-[10px]">
            <div className="flex items-center justify-between">
              <span className="text-[#EDEDEF] font-medium">AutonomousEdgeAgentCredential</span>
              <span className="text-[#6B7280]">Ed25519Signature2020</span>
            </div>
            <div className="flex items-center justify-between text-[#7E8492]">
              <span>Hardware Platform</span>
              <span className="text-[#EDEDEF]">{vc?.credentialSubject.hardwarePlatform || "NVIDIA Jetson Orin"}</span>
            </div>
            <div className="flex items-center justify-between text-[#7E8492]">
              <span>Enclave Security</span>
              <span className="text-[#00EC97]">{vc?.credentialSubject.executionEnvironment || "Hardware Root of Trust"}</span>
            </div>
            
            <div className="mt-1 pt-1.5 border-t border-[#16181F] text-[9px] text-[#525866] truncate font-mono">
              Proof JWS: <span className="text-[#7E8492]">{vc?.proof.jws.slice(0, 36)}...</span>
            </div>
          </div>

          <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-2.5 text-[10px] font-mono text-[#7E8492] max-h-36 overflow-y-auto">
            <pre className="whitespace-pre-wrap break-all">
              {JSON.stringify(vc, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* View 3: Live On-Chain DID Resolver */}
      {viewMode === "resolver" && (
        <div className="flex flex-col gap-2 text-xs font-mono">
          <form onSubmit={handleResolve} className="flex items-center gap-1.5">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Enter NEAR account (e.g. root.near)..."
              className="flex-1 bg-[#090A0D] border border-[#1A1D24] rounded px-2.5 py-1.5 text-[11px] text-[#EDEDEF] font-mono focus:border-[#00EC97] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              disabled={resolving}
              className="px-3 py-1.5 bg-[#14171E] border border-[#232833] hover:border-[#00EC97]/40 text-[#EDEDEF] hover:text-[#00EC97] text-[11px] font-mono rounded transition-colors"
            >
              {resolving ? "Resolving..." : "Resolve"}
            </button>
          </form>

          {resolveResult && (
            <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-2.5 flex flex-col gap-1 text-[10px] max-h-44 overflow-y-auto">
              <div className="flex items-center justify-between text-[#00EC97] font-medium">
                <span>{resolveResult.did}</span>
                <span className="text-[#6B7280]">{resolveResult.on_chain_keys_count} keys on-chain</span>
              </div>
              <pre className="text-[10px] text-[#7E8492] overflow-x-auto whitespace-pre-wrap break-all mt-1">
                {JSON.stringify(resolveResult.did_document, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
