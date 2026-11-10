"use client";

import React, { useState, useEffect } from "react";
import { Fingerprint, Copy, Check, ShieldCheck, Search, Code, FileText, CheckCircle2 } from "lucide-react";
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
    <div className="bg-near-surface border border-near-border rounded p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-near-border pb-2.5">
        <div className="flex items-center gap-2">
          <Fingerprint className="w-4 h-4 text-near-green" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-near-textPrimary">
            W3C Decentralized Identifier (DID)
          </h2>
        </div>
        <span className="text-[10px] font-mono text-near-green bg-near-green/10 border border-near-green/20 px-2 py-0.5 rounded">
          did:near Specification
        </span>
      </div>

      <p className="text-[11px] text-near-textMuted leading-relaxed">
        Autonomous agent identity conforming to W3C DID Core standards and anchored into the NEAR Protocol key infrastructure.
      </p>

      {/* DID URI Bar */}
      <div className="bg-near-black border border-near-border rounded p-2.5 flex items-center justify-between text-xs font-mono">
        <div className="flex flex-col gap-0.5 overflow-hidden pr-2">
          <span className="text-[10px] uppercase text-near-textMuted">AGENT DID URI</span>
          <span className="text-near-green font-semibold truncate text-[11px]">
            {didDoc?.id || "did:near:loading..."}
          </span>
        </div>
        <button
          onClick={copyDID}
          className="flex items-center gap-1 text-[11px] text-near-textSecondary hover:text-near-green transition-colors shrink-0 bg-near-surfaceElevated px-2 py-1 rounded border border-near-border"
        >
          {copied ? <Check className="w-3 h-3 text-near-green" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Sub-tab view switcher */}
      <div className="grid grid-cols-3 gap-1 bg-near-black p-1 border border-near-border rounded text-[10px] font-mono">
        <button
          onClick={() => setViewMode("document")}
          className={`py-1 rounded flex items-center justify-center gap-1 transition-colors ${
            viewMode === "document"
              ? "bg-near-surfaceElevated text-near-green font-semibold border border-near-border"
              : "text-near-textMuted hover:text-near-textSecondary"
          }`}
        >
          <Code className="w-3 h-3" />
          <span>DID Document</span>
        </button>

        <button
          onClick={() => setViewMode("credential")}
          className={`py-1 rounded flex items-center justify-center gap-1 transition-colors ${
            viewMode === "credential"
              ? "bg-near-surfaceElevated text-near-green font-semibold border border-near-border"
              : "text-near-textMuted hover:text-near-textSecondary"
          }`}
        >
          <FileText className="w-3 h-3" />
          <span>Verifiable Credential</span>
        </button>

        <button
          onClick={() => setViewMode("resolver")}
          className={`py-1 rounded flex items-center justify-center gap-1 transition-colors ${
            viewMode === "resolver"
              ? "bg-near-surfaceElevated text-near-green font-semibold border border-near-border"
              : "text-near-textMuted hover:text-near-textSecondary"
          }`}
        >
          <Search className="w-3 h-3" />
          <span>On-Chain Resolver</span>
        </button>
      </div>

      {/* View 1: DID Document (JSON-LD) */}
      {viewMode === "document" && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-near-textMuted px-1">
            <span>Verification Methods: {didDoc?.verificationMethod.length || 4} Keys</span>
            <span className="text-near-green flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> W3C Compliant
            </span>
          </div>

          <div className="bg-near-black border border-near-border rounded p-3 text-[10px] font-mono text-near-textSecondary max-h-52 overflow-y-auto">
            <pre className="whitespace-pre-wrap break-all">
              {JSON.stringify(didDoc, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* View 2: Verifiable Credential */}
      {viewMode === "credential" && (
        <div className="flex flex-col gap-2 text-xs font-mono">
          <div className="bg-near-black border border-near-border rounded p-3 flex flex-col gap-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-near-green font-semibold">AutonomousEdgeAgentCredential</span>
              <span className="text-[10px] text-near-textMuted">Ed25519Signature2020</span>
            </div>
            <span className="text-[10px] text-near-textMuted">Hardware: {vc?.credentialSubject.hardwarePlatform}</span>
            <span className="text-[10px] text-near-textMuted">Enclave: {vc?.credentialSubject.executionEnvironment}</span>
            
            <div className="mt-1 pt-1 border-t border-near-border/40 text-[9px] text-near-textMuted break-all">
              <span className="text-near-textSecondary">Cryptographic Proof JWS: </span>
              {vc?.proof.jws.slice(0, 36)}...
            </div>
          </div>

          <div className="bg-near-black border border-near-border rounded p-2.5 text-[10px] font-mono text-near-textMuted max-h-40 overflow-y-auto">
            <pre className="whitespace-pre-wrap break-all">
              {JSON.stringify(vc, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* View 3: Live On-Chain DID Resolver */}
      {viewMode === "resolver" && (
        <div className="flex flex-col gap-2 text-xs font-mono">
          <form onSubmit={handleResolve} className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Query account or DID (e.g. root.near)..."
              className="flex-1 bg-near-black border border-near-border rounded px-2.5 py-1.5 text-xs text-near-textPrimary font-mono focus:border-near-green focus:outline-none"
            />
            <button
              type="submit"
              disabled={resolving}
              className="px-3 py-1.5 bg-near-surfaceElevated border border-near-border text-near-green hover:bg-near-green/10 text-xs font-mono rounded transition-colors"
            >
              {resolving ? "Resolving..." : "Resolve"}
            </button>
          </form>

          {resolveResult && (
            <div className="bg-near-black border border-near-border rounded p-3 flex flex-col gap-1 text-[11px] max-h-48 overflow-y-auto">
              <div className="flex items-center justify-between text-near-green font-semibold">
                <span>Resolved: {resolveResult.did}</span>
                <span className="text-[10px] text-near-textMuted">Keys: {resolveResult.on_chain_keys_count}</span>
              </div>
              <pre className="text-[10px] text-near-textSecondary overflow-x-auto whitespace-pre-wrap break-all mt-1">
                {JSON.stringify(resolveResult.did_document, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
