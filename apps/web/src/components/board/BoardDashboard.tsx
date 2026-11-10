"use client";

import React, { useState, useEffect } from "react";
import { Cpu, Zap, Thermometer, HardDrive, Server, RefreshCw, Layers, Check } from "lucide-react";
import { fetchBoardHealth, fetchBoardInfo, fetchBoardProcesses } from "../../lib/api";
import { BoardHealthDetail, BoardInfoDetail, ProcessItem } from "../../lib/types";

export const BoardDashboard: React.FC = () => {
  const [health, setHealth] = useState<BoardHealthDetail | null>(null);
  const [info, setInfo] = useState<BoardInfoDetail | null>(null);
  const [processes, setProcesses] = useState<ProcessItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const refreshBoard = async () => {
    setLoading(true);
    const [h, i, p] = await Promise.all([
      fetchBoardHealth(),
      fetchBoardInfo(),
      fetchBoardProcesses(),
    ]);
    if (h) setHealth(h);
    if (i) setInfo(i);
    if (p) setProcesses(p);
    setLoading(false);
  };

  useEffect(() => {
    refreshBoard();
    const interval = setInterval(refreshBoard, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 bg-[#101216] border border-[#1E222A] rounded p-4 flex flex-col gap-3.5 h-full min-h-0 font-mono overflow-y-auto">
      {/* Hardware Header */}
      <div className="flex items-center justify-between border-b border-[#1A1D24] pb-3">
        <div className="flex items-center gap-2.5">
          <Server className="w-4 h-4 text-[#00EC97]" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-[#EDEDEF] uppercase tracking-wider">
                {info?.hardware_model || "NVIDIA Jetson Platform"}
              </h2>
              <span className="text-[10px] text-[#00EC97] bg-[#0E1512] border border-[#00EC97]/30 px-1.5 py-0.2 rounded font-medium">
                {info?.architecture || "aarch64"}
              </span>
            </div>
            <p className="text-[10px] text-[#7E8492]">
              Host: <span className="text-[#EDEDEF]">{info?.hostname}</span> · {info?.jetpack_version} · Python {info?.python}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-[10px] text-[#7E8492]">
            <span>Uptime: </span>
            <span className="text-[#EDEDEF]">
              {info ? `${Math.floor(info.uptime_seconds / 3600)}h ${Math.floor((info.uptime_seconds % 3600) / 60)}m` : "..."}
            </span>
          </div>
          <button
            onClick={refreshBoard}
            className="p-1.5 text-[#7E8492] hover:text-[#00EC97] bg-[#14171E] rounded border border-[#1E222A] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Key Metric Gauges Row */}
      <div className="grid grid-cols-4 gap-2.5 text-xs">
        {/* CPU Overall */}
        <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[#7E8492] text-[10px]">
            <span className="uppercase tracking-wider">CPU Total</span>
            <Cpu className="w-3 h-3 text-[#00EC97]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-semibold text-[#EDEDEF]">{health?.cpu.percent.toFixed(1) ?? "0.0"}%</span>
            <span className="text-[10px] text-[#555C6E]">{health?.cpu.cores || 8} cores</span>
          </div>
          <div className="w-full bg-[#14171E] h-1.5 rounded-full overflow-hidden mt-0.5">
            <div
              className="h-full bg-[#00EC97] transition-all duration-300"
              style={{ width: `${Math.min(100, health?.cpu.percent || 0)}%` }}
            />
          </div>
        </div>

        {/* RAM */}
        <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[#7E8492] text-[10px]">
            <span className="uppercase tracking-wider">Memory (RAM)</span>
            <Layers className="w-3 h-3 text-[#00EC97]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-semibold text-[#EDEDEF]">{health?.ram.percent.toFixed(1) ?? "0.0"}%</span>
            <span className="text-[10px] text-[#555C6E]">
              {health ? `${(health.ram.used_mb / 1024).toFixed(1)} / ${(health.ram.total_mb / 1024).toFixed(1)} GB` : "..."}
            </span>
          </div>
          <div className="w-full bg-[#14171E] h-1.5 rounded-full overflow-hidden mt-0.5">
            <div
              className="h-full bg-[#00EC97] transition-all duration-300"
              style={{ width: `${Math.min(100, health?.ram.percent || 0)}%` }}
            />
          </div>
        </div>

        {/* GPU / NPU */}
        <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[#7E8492] text-[10px]">
            <span className="uppercase tracking-wider">GPU / NPU Load</span>
            <Zap className="w-3 h-3 text-[#00EC97]" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-semibold text-[#EDEDEF]">{health?.gpu.load_percent.toFixed(1) ?? "0.0"}%</span>
            <span className="text-[10px] text-[#555C6E] truncate">{health?.gpu.device || "Tegra GPU"}</span>
          </div>
          <div className="w-full bg-[#14171E] h-1.5 rounded-full overflow-hidden mt-0.5">
            <div
              className="h-full bg-[#00EC97] transition-all duration-300"
              style={{ width: `${Math.min(100, health?.gpu.load_percent || 0)}%` }}
            />
          </div>
        </div>

        {/* Thermals & Power */}
        <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-3 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[#7E8492] text-[10px]">
            <span className="uppercase tracking-wider">Thermal & Power</span>
            <Thermometer className="w-3 h-3 text-[#00EC97]" />
          </div>
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-semibold text-[#EDEDEF]">{health?.thermals.cpu_temp_c.toFixed(0) ?? "0"}°C</span>
              <span className="text-[10px] text-[#00EC97]">NORMAL</span>
            </div>
            <span className="text-[10px] text-[#7E8492]">{health?.power.watts.toFixed(1)} W</span>
          </div>
          <div className="flex items-center justify-between text-[9px] text-[#555C6E] mt-0.5">
            <span>NV Power Mode:</span>
            <span className="text-[#EDEDEF]">{health?.power.mode || "15W_DEFAULT"}</span>
          </div>
        </div>
      </div>

      {/* Multi-Core CPU Distribution Grid */}
      <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] text-[#7E8492]">
          <span className="uppercase tracking-wider">Multi-Core Symmetric Multiprocessing (SMP)</span>
          <span>{health?.cpu.cores || 8} Active Hardware Threads</span>
        </div>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {health?.cpu.per_core.map((load, idx) => (
            <div key={idx} className="bg-[#12151D] border border-[#1C202A] rounded p-2 flex flex-col gap-1">
              <div className="flex items-center justify-between text-[9px] text-[#7E8492]">
                <span>CPU {idx}</span>
                <span className={load > 70 ? "text-amber-400" : "text-[#EDEDEF]"}>{load.toFixed(0)}%</span>
              </div>
              <div className="w-full bg-[#181C26] h-1 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${load > 70 ? "bg-amber-400" : "bg-[#00EC97]"}`}
                  style={{ width: `${Math.min(100, load)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Active Processes on the Board */}
      <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-3 flex flex-col gap-2 flex-1 min-h-0">
        <div className="flex items-center justify-between text-[10px] text-[#7E8492] border-b border-[#16181F] pb-1.5">
          <span className="uppercase tracking-wider">Top Running Board Processes</span>
          <span>Snapshot ({processes.length} active)</span>
        </div>

        <div className="flex-1 overflow-y-auto pr-0.5">
          <table className="w-full text-left text-[11px] text-[#9CA3AF]">
            <thead>
              <tr className="text-[10px] text-[#555C6E] border-b border-[#16181F]">
                <th className="py-1">PID</th>
                <th className="py-1">PROCESS NAME</th>
                <th className="py-1 text-right">CPU %</th>
                <th className="py-1 text-right">MEMORY</th>
                <th className="py-1 text-right">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {processes.map((proc) => (
                <tr key={proc.pid} className="border-b border-[#14171E] hover:bg-[#12151D] transition-colors">
                  <td className="py-1.5 text-[#555C6E]">{proc.pid}</td>
                  <td className="py-1.5 text-[#EDEDEF] font-medium">{proc.name}</td>
                  <td className="py-1.5 text-right text-[#00EC97]">{proc.cpu_percent.toFixed(1)}%</td>
                  <td className="py-1.5 text-right">{proc.memory_mb.toFixed(1)} MB</td>
                  <td className="py-1.5 text-right text-[10px]">
                    <span className="px-1.5 py-0.2 rounded bg-[#14171E] text-[#7E8492] border border-[#1E222A]">
                      {proc.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
