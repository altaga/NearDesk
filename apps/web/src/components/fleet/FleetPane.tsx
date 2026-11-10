"use client";

import React, { useState, useEffect } from "react";
import { Radio, RefreshCw, Plus, Check, Shield, Cpu, ExternalLink } from "lucide-react";
import { discoverNodes, fetchPairingStatus } from "../../lib/api";
import { DiscoveredNode, BoardPairingStatus, NearAccountStatus } from "../../lib/types";

interface FleetPaneProps {
  onOpenPairing: () => void;
  account: NearAccountStatus | null;
}

export const FleetPane: React.FC<FleetPaneProps> = ({ onOpenPairing, account }) => {
  const [nodes, setNodes] = useState<DiscoveredNode[]>([
    {
      label: "Local Edge Station (Dev Host)",
      url: "http://127.0.0.1:8000",
      type: "local_node",
      reachable: true,
      detected_hardware: "NVIDIA Jetson Platform",
      status: "online",
    },
    {
      label: "Jetson USB Gadget Link",
      url: "http://192.168.55.1:8800",
      type: "usb_gadget",
      reachable: false,
      detected_hardware: "Jetson Orin (USB Gadget)",
      status: "standby_ready",
    },
    {
      label: "Docker Board Emulator 01",
      url: "http://127.0.0.1:18101",
      type: "docker_emu",
      reachable: false,
      detected_hardware: "Orin Nano Container",
      status: "standby_ready",
    },
  ]);
  const [pairingStatus, setPairingStatus] = useState<BoardPairingStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const loadFleet = async () => {
    setLoading(true);
    const [discovered, status] = await Promise.all([
      discoverNodes(),
      fetchPairingStatus(),
    ]);
    setNodes(discovered);
    if (status) setPairingStatus(status);
    setLoading(false);
  };

  useEffect(() => {
    loadFleet();
    const interval = setInterval(loadFleet, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 bg-[#101216] border border-[#1E222A] rounded p-4 flex flex-col gap-3.5 h-full min-h-0 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1A1D24] pb-3">
        <div className="flex items-center gap-2.5">
          <Radio className="w-4 h-4 text-[#00EC97]" />
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#EDEDEF]">
              NearDesk Sovereign Hardware Fleet
            </h2>
            <p className="text-[10px] text-[#7E8492]">
              Manage clusters of NVIDIA Jetson Orin boards, emulators, and local edge stations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadFleet}
            className="p-1.5 text-[#7E8492] hover:text-[#00EC97] bg-[#14171E] rounded border border-[#1E222A] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={onOpenPairing}
            className="px-3 py-1.5 bg-[#00EC97] hover:bg-[#00FFA3] text-[#08090B] font-semibold text-xs rounded flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pair Jetson Board</span>
          </button>
        </div>
      </div>

      {/* Cluster Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 overflow-y-auto pr-0.5">
        {nodes.map((node, idx) => (
          <div
            key={idx}
            className={`border rounded p-3 flex flex-col gap-2.5 transition-colors ${
              node.reachable
                ? "bg-[#0A0C0F] border-[#00EC97]/40"
                : "bg-[#090A0D] border-[#1A1D24] opacity-80"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${node.reachable ? "bg-[#00EC97]" : "bg-neutral-600"}`} />
                <span className="text-xs font-semibold text-[#EDEDEF]">
                  {node.label}
                </span>
              </div>
              <span
                className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase ${
                  node.reachable
                    ? "bg-[#0E1512] text-[#00EC97] border-[#00EC97]/30"
                    : "bg-[#14161C] text-[#6B7280] border-[#1E222A]"
                }`}
              >
                {node.reachable ? "ONLINE / ACTIVE" : node.status}
              </span>
            </div>

            <div className="flex flex-col gap-1 text-[10px] text-[#7E8492] bg-[#0E1015] p-2 rounded border border-[#16181F]">
              <div className="flex items-center justify-between">
                <span>Endpoint URL:</span>
                <span className="text-[#EDEDEF]">{node.url}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Hardware Target:</span>
                <span className="text-[#00EC97]">{node.detected_hardware || "NVIDIA Jetson Platform"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Connection Type:</span>
                <span className="text-[#9CA3AF]">{node.type}</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#555C6E] pt-0.5">
              <span>Owner: <b className="text-[#7E8492] font-normal">{account?.account_id ? `${account.account_id.slice(0, 8)}...` : "sovereign"}</b></span>
              <span className="text-[#00EC97] flex items-center gap-1">
                <Shield className="w-2.5 h-2.5" /> Bound
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
