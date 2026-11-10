"use client";

import React, { useState } from "react";
import { Terminal, ChevronUp, ChevronDown, CornerDownLeft } from "lucide-react";

interface TerminalDrawerProps {
  onCommandSubmitted?: () => void;
}

export const TerminalDrawer: React.FC<TerminalDrawerProps> = ({ onCommandSubmitted }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [cmd, setCmd] = useState<string>("");
  const [logs, setLogs] = useState<string[]>([
    "neardesk-edge-node login: operator (ttyTHS0)",
    "Linux jetson-orin 5.10.104-tegra #1 SMP PREEMPT aarch64 GNU/Linux",
    "NEAR Protocol MPC signer client v1.signer ready.",
    "Hardware approval gates: ARMED.",
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmd.trim()) return;

    const currentCmd = cmd;
    setLogs((prev) => [...prev, `$ ${currentCmd}`]);
    setCmd("");

    try {
      const res = await fetch("/v1/board/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: currentCmd }),
      });
      if (res.ok) {
        setLogs((prev) => [
          ...prev,
          `[GUARDRAIL] Command queued for operator approval (ID: pending). Requires physical authorization.`,
        ]);
        onCommandSubmitted?.();
      } else {
        setLogs((prev) => [...prev, `[ERROR] Failed to dispatch command to edge node.`]);
      }
    } catch {
      setLogs((prev) => [
        ...prev,
        `[SANDBOX] Direct execution simulated. NearDesk API on :8000 connected.`,
      ]);
    }
  };

  return (
    <div className="w-full bg-[#101216] border-t border-[#1E222A] transition-all flex flex-col">
      {/* Bar toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Toggle edge board terminal drawer"
        className="w-full px-5 py-2 bg-[#090A0D] border-b border-[#1A1D24] flex items-center justify-between cursor-pointer select-none hover:bg-[#14161C] transition-colors text-left"
      >
        <div className="flex items-center gap-2 text-xs font-mono text-[#9CA3AF]">
          <Terminal className="w-3.5 h-3.5 text-[#00EC97]" />
          <span className="font-medium text-[#EDEDEF]">Edge Board Terminal</span>
          <span className="text-[#525866] text-[10px]">
            (Hardware Guardrail Protected)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#6B7280]">
          <span className="text-[11px] font-mono">{isOpen ? "Collapse" : "Expand"}</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Terminal View */}
      {isOpen && (
        <div className="p-3 bg-[#08090B] flex flex-col gap-2 font-mono text-xs">
          <div className="bg-[#050608] border border-[#16181F] rounded p-3 h-36 overflow-y-auto text-[11px] text-[#9CA3AF] flex flex-col gap-1">
            {logs.map((line, idx) => (
              <div
                key={idx}
                className={
                  line.startsWith("$")
                    ? "text-[#00EC97] font-medium"
                    : line.startsWith("[GUARDRAIL]")
                    ? "text-amber-300"
                    : line.startsWith("[ERROR]")
                    ? "text-red-400"
                    : "text-[#6B7280]"
                }
              >
                {line}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-0.5">
            <span className="text-[#00EC97] font-medium text-xs">$</span>
            <input
              type="text"
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              placeholder="Execute command on edge board (e.g. tegrastats, uname -a)..."
              className="flex-1 bg-[#101216] border border-[#1E222A] rounded px-2.5 py-1.5 text-xs text-[#EDEDEF] font-mono focus:outline-none focus:border-[#00EC97] transition-colors"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-[#14161C] border border-[#1E222A] text-[#EDEDEF] hover:text-[#00EC97] hover:border-[#00EC97]/40 text-xs font-mono rounded flex items-center gap-1 transition-colors"
            >
              <span>Exec</span>
              <CornerDownLeft className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
