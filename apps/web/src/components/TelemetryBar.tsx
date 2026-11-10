"use client";

import React from "react";
import { TelemetryData } from "../lib/types";

interface TelemetryBarProps {
  telemetry: TelemetryData | null;
}

export const TelemetryBar: React.FC<TelemetryBarProps> = ({ telemetry }) => {
  const cpu = telemetry?.cpu_percent ?? 0;
  const memUsed = telemetry?.memory?.used_mb ?? 0;
  const memPct = telemetry?.memory?.percent ?? 0;
  const gpuLoad = telemetry?.gpu?.load_percent ?? 0;
  const temp = telemetry?.gpu?.temperature_c ?? 0;
  const watts = telemetry?.gpu?.power_watts ?? 0;

  return (
    <div className="h-6 w-full bg-[#07080A] border-b border-[#14161C] px-5 flex items-center justify-between text-[10px] font-mono text-[#686F7E] select-none">
      <div className="flex items-center gap-3">
        <span>
          CPU <b className="text-[#EDEDEF] font-normal">{cpu.toFixed(0)}%</b>
        </span>
        <span className="text-[#20242D]">·</span>
        <span>
          RAM <b className="text-[#EDEDEF] font-normal">{(memUsed / 1024).toFixed(1)} GB</b>{" "}
          <span className="text-[#454B57]">({memPct}%)</span>
        </span>
        <span className="text-[#20242D]">·</span>
        <span>
          GPU <b className="text-[#00EC97] font-normal">{gpuLoad.toFixed(0)}%</b>
        </span>
        <span className="text-[#20242D]">·</span>
        <span>
          TEMP <b className="text-[#EDEDEF] font-normal">{temp.toFixed(0)}°C</b>
        </span>
        <span className="text-[#20242D]">·</span>
        <span>
          PWR <b className="text-[#EDEDEF] font-normal">{watts.toFixed(1)}W</b>
        </span>
      </div>

      <div className="hidden sm:flex items-center gap-2 text-[#565C6B]">
        <span>RPC rpc.mainnet.near.org</span>
        <span className="w-1 h-1 rounded-full bg-[#00EC97]/80" />
      </div>
    </div>
  );
};
