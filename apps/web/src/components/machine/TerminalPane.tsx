"use client";

import React, { useState } from "react";
import { Terminal, CornerDownLeft, Shield, Check, RefreshCw } from "lucide-react";

export const TerminalPane: React.FC = () => {
  const [cmd, setCmd] = useState<string>("");
  const [executing, setExecuting] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([
    "neardesk-edge-node login: operator (ttyTHS0)",
    "Linux jetson-orin 5.10.104-tegra #1 SMP PREEMPT aarch64 GNU/Linux",
    "NEAR Protocol MPC signer client v1.signer ready.",
    "Hardware approval gates: ARMED.",
    "Type any command to execute on edge station (e.g. uname -a, tegrastats, ls -la).",
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmd.trim() || executing) return;

    const currentCmd = cmd;
    setLogs((prev) => [...prev, `$ ${currentCmd}`]);
    setCmd("");
    setExecuting(true);

    try {
      const res = await fetch("http://localhost:8000/v1/board/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: currentCmd }),
      });
      if (res.ok) {
        setLogs((prev) => [
          ...prev,
          `[GUARDRAIL] Command placed in NearDesk Approval Queue. Requires operator confirmation.`,
        ]);
      } else {
        setLogs((prev) => [...prev, `[ERROR] Failed to send command to edge board.`]);
      }
    } catch {
      setLogs((prev) => [...prev, `[SIMULATION] Executed command in local sandbox.`]);
    }
    setExecuting(false);
  };

  return (
    <div className="flex-1 bg-[#101216] border border-[#1E222A] rounded p-4 flex flex-col gap-3 h-full min-h-0 font-mono">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between border-b border-[#1A1D24] pb-2.5">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#00EC97]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#EDEDEF]">
            Interactive Edge Board Shell (PTY)
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[#7E8492]">
          <span className="text-[#00EC97] flex items-center gap-1">
            <Shield className="w-3 h-3" /> Approval Gates Active
          </span>
          <span className="text-[#3A404F]">|</span>
          <span>ttyTHS0 (115200 8N1)</span>
        </div>
      </div>

      {/* Terminal Output Screen */}
      <div className="flex-1 bg-[#060709] border border-[#16181F] rounded p-3 overflow-y-auto text-[11px] text-[#9CA3AF] flex flex-col gap-1 leading-relaxed select-text">
        {logs.map((line, idx) => (
          <div
            key={idx}
            className={
              line.startsWith("$")
                ? "text-[#00EC97] font-semibold"
                : line.startsWith("[GUARDRAIL]")
                ? "text-amber-300 font-medium"
                : line.startsWith("[ERROR]")
                ? "text-red-400 font-medium"
                : "text-[#7E8492]"
            }
          >
            {line}
          </div>
        ))}
      </div>

      {/* Command Input Prompt */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
        <span className="text-[#00EC97] font-semibold text-xs">$</span>
        <input
          type="text"
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          placeholder="Execute shell command on Jetson (e.g. tegrastats, uname -a, ps aux)..."
          className="flex-1 bg-[#0A0C0F] border border-[#1E222A] rounded px-3 py-2 text-xs text-[#EDEDEF] font-mono focus:border-[#00EC97] focus:outline-none transition-colors"
        />
        <button
          type="submit"
          disabled={executing}
          className="px-4 py-2 bg-[#14171E] hover:bg-[#1E222A] border border-[#1E222A] hover:border-[#00EC97]/40 text-[#EDEDEF] hover:text-[#00EC97] text-xs font-mono rounded flex items-center gap-1.5 transition-colors"
        >
          {executing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CornerDownLeft className="w-3 h-3" />}
          <span>Run</span>
        </button>
      </form>
    </div>
  );
};
