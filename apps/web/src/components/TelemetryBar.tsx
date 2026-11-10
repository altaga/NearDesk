"use client";

import React from "react";
import { Cpu, HardDrive, Thermometer, Zap, Layers, Network } from "lucide-react";
import { TelemetryData } from "../lib/types";

interface TelemetryBarProps {
  telemetry: TelemetryData | null;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({ telemetry }) => {
  const cpu = telemetry?.cpu_percent ?? 0;
  const memUsed = telemetry?.memory?.used_mb ?? 0;
  const memTotal = telemetry?.memory?.total_mb ?? 1;
  const memPct = telemetry?.memory?.percent ?? 0;
  const gpuLoad = telemetry?.gpu?.load_percent ?? 0;
  const temp = telemetry?.gpu?.temperature_c ?? 0;
  const watts = telemetry?.gpu?.power_watts ?? 0;

  return (
    <div className="w-full bg-near-black border-b border-near-border px-6 py-2 flex items-center justify-between text-xs font-mono text-near-textSecondary select-none">
      <div className="flex items-center gap-6 overflow-x-auto">
        {/* CPU */}
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-near-textMuted" />
          <span className="text-near-textMuted uppercase text-[10px]">CPU</span>
          <span className={`font-semibold ${cpu > 80 ? "text-red-400" : "text-near-textPrimary"}`}>
            {cpu.toFixed(1)}%
          </span>
        </div>

        {/* RAM */}
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-near-textMuted" />
          <span className="text-near-textMuted uppercase text-[10px]">RAM</span>
          <span className="text-near-textPrimary font-semibold">
            {memUsed.toFixed(0)} MB
          </span>
          <span className="text-near-textMuted">({memPct}%)</span>
        </div>

        {/* GPU / NPU */}
        <div className="flex items-center gap-2">
          <HardDrive className="w-3.5 h-3.5 text-near-textMuted" />
          <span className="text-near-textMuted uppercase text-[10px]">NPU/GPU</span>
          <span className="text-near-green font-semibold">{gpuLoad.toFixed(1)}%</span>
        </div>

        {/* Thermal */}
        <div className="flex items-center gap-2">
          <Thermometer className="w-3.5 h-3.5 text-near-textMuted" />
          <span className="text-near-textMuted uppercase text-[10px]">TEMP</span>
          <span className={`font-semibold ${temp > 70 ? "text-amber-400" : "text-near-textPrimary"}`}>
            {temp.toFixed(1)}°C
          </span>
        </div>

        {/* Power */}
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-near-textMuted" />
          <span className="text-near-textMuted uppercase text-[10px]">POWER</span>
          <span className="text-near-textPrimary font-semibold">{watts.toFixed(1)} W</span>
        </div>
      </div>

      {/* Network / RPC */}
      <div className="hidden sm:flex items-center gap-2">
        <Network className="w-3.5 h-3.5 text-near-green" />
        <span className="text-near-textMuted uppercase text-[10px]">NEAR RPC</span>
        <span className="text-near-green font-semibold">rpc.mainnet.near.org (22ms)</span>
      </div>
    </div>
  );
};
