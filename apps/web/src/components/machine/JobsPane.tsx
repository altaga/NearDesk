"use client";

import React, { useState, useEffect } from "react";
import { Activity, RefreshCw, XCircle, Play, CheckCircle2, Cpu } from "lucide-react";
import { fetchJobs, cancelJob } from "../../lib/api";
import { JobItem } from "../../lib/types";

export const JobsPane: React.FC = () => {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const loadJobs = async () => {
    setLoading(true);
    const data = await fetchJobs();
    setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStop = async (jobId: string) => {
    await cancelJob(jobId);
    await loadJobs();
  };

  return (
    <div className="flex-1 bg-[#101216] border border-[#1E222A] rounded p-4 flex flex-col gap-3 h-full min-h-0 font-mono">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1A1D24] pb-2.5">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-[#00EC97]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#EDEDEF]">
            Edge Station Process Supervisor & Durable Daemons
          </span>
        </div>
        <button
          onClick={loadJobs}
          className="text-xs text-[#7E8492] hover:text-[#00EC97] flex items-center gap-1 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          <span>Sync</span>
        </button>
      </div>

      <p className="text-[11px] text-[#7E8492] leading-relaxed">
        Autonomous daemons running in background on the Jetson node, handling Tegrastats telemetry, NEAR Intent solver network listeners, and MPC key caches.
      </p>

      {/* Jobs List */}
      <div className="flex-1 overflow-y-auto pr-0.5 flex flex-col gap-2 min-h-0">
        {jobs.map((job) => (
          <div
            key={job.id}
            className="bg-[#090A0D] border border-[#1A1D24] rounded p-3 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[9px] uppercase px-1.5 py-0.5 rounded border font-medium ${
                    job.status === "running"
                      ? "bg-[#0E1512] text-[#00EC97] border-[#00EC97]/30"
                      : job.status === "idle"
                      ? "bg-[#14161C] text-[#7E8492] border-[#1E222A]"
                      : "bg-[#201012] text-red-400 border-red-500/20"
                  }`}
                >
                  {job.status}
                </span>
                <span className="text-xs font-semibold text-[#EDEDEF]">
                  {job.name}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-[#7E8492]">
                <span className="flex items-center gap-1">
                  <Cpu className="w-2.5 h-2.5 text-[#00EC97]" />
                  {job.cpu_usage.toFixed(1)}% CPU
                </span>
                <span className="text-[#3A404F]">|</span>
                <span className="text-[#555C6E]">{job.id}</span>
              </div>
            </div>

            <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
              {job.details}
            </p>

            <div className="flex items-center justify-between text-[10px] text-[#555C6E] pt-1 border-t border-[#16181F]">
              <span>Type: <b className="text-[#7E8492] font-normal">{job.kind}</b></span>
              {job.status === "running" && (
                <button
                  onClick={() => handleStop(job.id)}
                  className="text-red-400 hover:text-red-300 flex items-center gap-1 hover:underline transition-colors"
                >
                  <XCircle className="w-3 h-3" /> Stop Daemon
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
