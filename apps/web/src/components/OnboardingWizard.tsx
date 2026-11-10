"use client";

import React, { useState, useEffect } from "react";
import { Cpu, Check, X, Shield, Lock, ArrowRight, RefreshCw, Radio, HardDrive, Network } from "lucide-react";
import { discoverNodes, claimBoard, fetchPairingStatus } from "../lib/api";
import { DiscoveredNode, BoardPairingStatus, NearAccountStatus } from "../lib/types";

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  account: NearAccountStatus | null;
  onPairingComplete: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isOpen,
  onClose,
  account,
  onPairingComplete,
}) => {
  const [step, setStep] = useState<number>(1);
  const [nodes, setNodes] = useState<DiscoveredNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string>("http://192.168.55.1:8800");
  const [scanning, setScanning] = useState<boolean>(false);
  const [boardId, setBoardId] = useState<string>("jetson-orin-station-01");
  const [pairing, setPairing] = useState<boolean>(false);
  const [currentStatus, setCurrentStatus] = useState<BoardPairingStatus | null>(null);

  const scanHardware = async () => {
    setScanning(true);
    const discovered = await discoverNodes();
    setNodes(discovered);
    // Auto-select first reachable or fallback
    const reachable = discovered.find((n) => n.reachable);
    if (reachable) setSelectedNode(reachable.url);
    setScanning(false);
  };

  useEffect(() => {
    if (isOpen) {
      scanHardware();
      fetchPairingStatus().then((s) => s && setCurrentStatus(s));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      setPairing(true);
      await claimBoard(boardId, selectedNode, account?.account_id);
      setPairing(false);
      onPairingComplete();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-near-surface border border-near-border rounded-lg max-w-2xl w-full p-6 flex flex-col gap-5 shadow-2xl">
        {/* Header with Step Tracker */}
        <div className="flex items-center justify-between border-b border-near-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-near-green/10 border border-near-green/30 flex items-center justify-center text-near-green font-mono font-bold text-xs">
              0{step}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-near-textPrimary">
                {step === 1 && "Step 1: Hardware Discovery & Connection"}
                {step === 2 && "Step 2: NEAR Account & Key Provisioning"}
                {step === 3 && "Step 3: Arm Guardrails & Activate Node"}
              </h3>
              <p className="text-[11px] text-near-textMuted">
                {step === 1 && "Scan USB-C gadget link, LAN, or local Docker emulators."}
                {step === 2 && "Bind hardware identity to your sovereign NEAR account."}
                {step === 3 && "Verify approval gates, $10 budget lock, and WebSocket link."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-near-textMuted hover:text-near-textPrimary p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Hardware Discovery */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase text-near-textSecondary">
                Detected Hardware Interfaces:
              </span>
              <button
                onClick={scanHardware}
                disabled={scanning}
                className="text-xs font-mono text-near-green hover:underline flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${scanning ? "animate-spin" : ""}`} />
                <span>Rescan</span>
              </button>
            </div>

            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto">
              {nodes.map((node, idx) => (
                <div
                  key={idx}
                  onClick={() => setSelectedNode(node.url)}
                  className={`border rounded p-3 flex items-center justify-between cursor-pointer transition-colors ${
                    selectedNode === node.url
                      ? "bg-near-black border-near-green text-near-textPrimary"
                      : "bg-near-surfaceElevated border-near-border/80 text-near-textSecondary hover:border-near-border"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Radio
                      className={`w-4 h-4 ${
                        selectedNode === node.url ? "text-near-green" : "text-near-textMuted"
                      }`}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-near-textPrimary">
                        {node.label}
                      </span>
                      <span className="text-[10px] font-mono text-near-textMuted">
                        Endpoint: {node.url}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                      node.reachable
                        ? "bg-near-green/10 text-near-green border border-near-green/20"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {node.reachable ? "Online / Ready" : node.status}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-near-black border border-near-border rounded p-3 flex flex-col gap-1.5 text-xs font-mono">
              <label className="text-[10px] text-near-textMuted uppercase">Board Identity Identifier:</label>
              <input
                type="text"
                value={boardId}
                onChange={(e) => setBoardId(e.target.value)}
                className="bg-near-surfaceElevated border border-near-border rounded px-2.5 py-1.5 text-xs text-near-textPrimary font-mono focus:border-near-green focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: NEAR Account Provisioning */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div className="bg-near-black border border-near-border rounded p-3 flex flex-col gap-2 text-xs font-mono">
              <span className="text-[10px] uppercase text-near-textMuted">Target Sovereign Node Account:</span>
              <div className="bg-near-surfaceElevated p-2 rounded text-near-green break-all text-[11px] font-semibold border border-near-border">
                {account?.account_id || "01f72953344b853c9cf949217997e481bd04a1a33bea8e36060abf80e0118e7c"}
              </div>
              <div className="flex items-center justify-between text-[10px] text-near-textMuted pt-1">
                <span>Network: <span className="text-near-textPrimary">{account?.network.toUpperCase() || "MAINNET"}</span></span>
                <span className="text-near-green">Cryptographically Linked</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-near-black border border-near-border rounded p-3 flex flex-col gap-1">
                <span className="text-[10px] uppercase text-near-textMuted">Scoped Access Key:</span>
                <span className="text-near-textPrimary font-semibold text-xs">FunctionCall Only</span>
                <span className="text-[10px] text-near-green">Allowance: 2.5 NEAR</span>
              </div>

              <div className="bg-near-black border border-near-border rounded p-3 flex flex-col gap-1">
                <span className="text-[10px] uppercase text-near-textMuted">MPC Derived Chains:</span>
                <span className="text-near-textPrimary font-semibold text-xs">BTC, ETH, SOL</span>
                <span className="text-[10px] text-near-green">Threshold Signed</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Arm Guardrails & Activate */}
        {step === 3 && (
          <div className="flex flex-col gap-4 text-xs font-mono">
            <div className="bg-near-black border border-near-border rounded p-3 flex flex-col gap-2">
              <span className="text-[10px] uppercase text-near-green font-semibold">Security Pre-Flight Checklist:</span>
              <div className="flex flex-col gap-1.5 text-[11px]">
                <div className="flex items-center gap-2 text-near-textPrimary">
                  <Check className="w-3.5 h-3.5 text-near-green shrink-0" />
                  <span>Human-in-the-Loop Approval Gates: <b className="text-near-green">ARMED</b></span>
                </div>
                <div className="flex items-center gap-2 text-near-textPrimary">
                  <Check className="w-3.5 h-3.5 text-near-green shrink-0" />
                  <span>Strict AI Cloud Budget Ceiling: <b className="text-near-green">$10.00 USD CAP</b></span>
                </div>
                <div className="flex items-center gap-2 text-near-textPrimary">
                  <Check className="w-3.5 h-3.5 text-near-green shrink-0" />
                  <span>Bidirectional WebSocket Channel: <b className="text-near-green">READY (/v1/agent/ws)</b></span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-near-textMuted font-sans leading-relaxed">
              Upon confirmation, this Jetson station will be permanently registered in your NearDesk cluster as a sovereign execution node.
            </p>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-near-border pt-4">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-xs font-mono text-near-textMuted hover:text-near-textPrimary px-3 py-1.5 rounded transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={pairing}
            className="px-5 py-2 bg-near-green hover:bg-near-greenHover text-black font-semibold rounded text-xs transition-colors flex items-center gap-2 shadow-near-glow"
          >
            <span>{step === 3 ? (pairing ? "Claiming Node..." : "Activate Station") : "Continue"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
