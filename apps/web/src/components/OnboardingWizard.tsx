"use client";

import React, { useState, useEffect } from "react";
import { Check, X, ArrowRight, RefreshCw, Radio, Shield, Key } from "lucide-react";
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div className="bg-[#101216] border border-[#1E222A] rounded-lg max-w-xl w-full p-6 flex flex-col gap-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1A1D24] pb-3.5">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono text-[#00EC97] bg-[#0A0C0F] border border-[#1E222A] px-2 py-0.5 rounded font-medium">
              0{step} / 03
            </span>
            <div>
              <h3 id="wizard-title" className="text-xs font-semibold text-[#EDEDEF]">
                {step === 1 && "Hardware Discovery & Interconnect"}
                {step === 2 && "Sovereign Account & Key Provisioning"}
                {step === 3 && "Guardrails Verification & Activation"}
              </h3>
              <p className="text-[11px] text-[#7E8492]">
                {step === 1 && "USB-C gadget interface, LAN broadcast, or container emulator."}
                {step === 2 && "Bind physical hardware root to your NEAR account."}
                {step === 3 && "Enforce $10 budget limit and approval gates."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close setup modal"
            className="text-[#6B7280] hover:text-[#EDEDEF] p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step 1: Discovery */}
        {step === 1 && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#7E8492] uppercase tracking-wider text-[10px]">
                Detected Edge Endpoints
              </span>
              <button
                onClick={scanHardware}
                disabled={scanning}
                className="text-[#00EC97] hover:underline flex items-center gap-1 transition-opacity hover:opacity-80"
              >
                <RefreshCw className={`w-3 h-3 ${scanning ? "animate-spin" : ""}`} />
                <span>Rescan</span>
              </button>
            </div>

            <div className="flex flex-col gap-1.5 max-h-52 overflow-y-auto pr-0.5">
              {nodes.map((node, idx) => {
                const isSelected = selectedNode === node.url;
                return (
                  <div
                    key={idx}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedNode(node.url)}
                    className={`border rounded p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-[#0A0C0F] border-[#00EC97]/60 text-[#EDEDEF]"
                        : "bg-[#090A0D] border-[#1A1D24] text-[#9CA3AF] hover:border-[#232833]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${node.reachable ? "bg-[#00EC97]" : "bg-neutral-600"}`} />
                      <div className="flex flex-col">
                        <span className="text-[11px] font-medium text-[#EDEDEF]">
                          {node.label}
                        </span>
                        <span className="text-[10px] font-mono text-[#6B7280]">
                          {node.url}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                        node.reachable
                          ? "bg-[#0E1512] text-[#00EC97] border-[#00EC97]/30"
                          : "bg-[#14161C] text-[#6B7280] border-[#1E222A]"
                      }`}
                    >
                      {node.reachable ? "ONLINE" : node.status}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-2.5 flex flex-col gap-1 text-[11px] font-mono">
              <label className="text-[10px] text-[#6B7280] uppercase tracking-wider">Node Machine Identifier</label>
              <input
                type="text"
                value={boardId}
                onChange={(e) => setBoardId(e.target.value)}
                className="bg-[#101216] border border-[#1E222A] rounded px-2.5 py-1.5 text-xs text-[#EDEDEF] font-mono focus:border-[#00EC97] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 2: Key Binding */}
        {step === 2 && (
          <div className="flex flex-col gap-3 font-mono text-xs">
            <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-3 flex flex-col gap-1.5">
              <span className="text-[10px] uppercase text-[#6B7280] tracking-wider">Sovereign Account Identifier</span>
              <div className="bg-[#101216] p-2 rounded text-[#00EC97] break-all text-[11px] border border-[#1E222A] font-medium">
                {account?.account_id || "01f72953344b853c9cf949217997e481bd04a1a33bea8e36060abf80e0118e7c"}
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#7E8492] pt-1">
                <span>Network: <span className="text-[#EDEDEF]">{account?.network.toUpperCase() || "MAINNET"}</span></span>
                <span className="text-[#00EC97] flex items-center gap-1">
                  <Check className="w-3 h-3" /> Cryptographically Bound
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-2.5 flex flex-col gap-1">
                <span className="text-[9px] uppercase text-[#6B7280] tracking-wider">Access Scope</span>
                <span className="text-[#EDEDEF] font-medium text-[11px]">FunctionCall Only</span>
                <span className="text-[#7E8492]">Allowance: 2.5 NEAR</span>
              </div>

              <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-2.5 flex flex-col gap-1">
                <span className="text-[9px] uppercase text-[#6B7280] tracking-wider">Multi-Chain MPC</span>
                <span className="text-[#EDEDEF] font-medium text-[11px]">BTC, ETH, SOL</span>
                <span className="text-[#7E8492]">Derived Deterministic</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Guardrail Activation */}
        {step === 3 && (
          <div className="flex flex-col gap-3 font-mono text-xs">
            <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-3 flex flex-col gap-2 text-[11px]">
              <span className="text-[10px] uppercase tracking-wider text-[#00EC97] font-semibold">Pre-Flight Safety Verifications</span>
              <div className="flex flex-col gap-1.5 text-[#EDEDEF]">
                <div className="flex items-center justify-between">
                  <span>Physical Approval Gates</span>
                  <span className="text-[#00EC97] font-medium">ARMED</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hard LLM Budget Limit</span>
                  <span className="text-[#00EC97] font-medium">$10.00 USD CAP</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>WebSocket Node Relay</span>
                  <span className="text-[#00EC97] font-medium">ws://:8000/v1/agent/ws</span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-[#7E8492] font-sans leading-relaxed">
              Upon confirmation, this Jetson station will be enrolled in the cluster with an immutable W3C DID document.
            </p>
          </div>
        )}

        {/* Footer Navigation */}
        <div className="flex items-center justify-between border-t border-[#1A1D24] pt-3">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="text-xs font-mono text-[#7E8492] hover:text-[#EDEDEF] px-3 py-1.5 rounded transition-colors"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={handleNext}
            disabled={pairing}
            className="px-4 py-2 bg-[#00EC97] hover:bg-[#00FFA3] text-[#08090B] font-semibold rounded text-xs transition-colors flex items-center gap-1.5"
          >
            <span>{step === 3 ? (pairing ? "Pairing Node..." : "Activate Station") : "Proceed"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
