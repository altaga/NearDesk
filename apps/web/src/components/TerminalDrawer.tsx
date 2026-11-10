"use client";

import React, { useState } from "react";
import { Terminal, ChevronUp, ChevronDown, CornerDownLeft, Shield } from "lucide-react";

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
      const res = await fetch("http://localhost:8000/v1/board/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: currentCmd }),
      });
      if (res.ok) {
        setLogs((prev) => [
          ...prev,
          `[GUARDRAIL] Command placed in NearDesk Approval Queue (ID: pending). Requires operator authorization.`,
        ]);
        onCommandSubmitted?.();
      } else {
        setLogs((prev) => [...prev, `[ERROR] Failed to forward command to edge node.`]);
      }
    } catch {
      setLogs((prev) => [
        ...prev,
        `[SANDBOX] Direct command simulated. Requires NearDesk API on :8000.`,
      ]);
    }
  };

  return (
    <div className="w-full bg-near-surface border-t border-near-border transition-all flex flex-col">
      {/* Bar toggle */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-6 py-2 bg-near-black border-b border-near-border flex items-center justify-between cursor-pointer select-none hover:bg-near-surfaceElevated transition-colors"
      >
        <div className="flex items-center gap-2 text-xs font-mono text-near-textSecondary">
          <Terminal className="w-3.5 h-3.5 text-near-green" />
          <span className="font-semibold text-near-textPrimary">Edge Board Terminal</span>
          <span className="text-near-textMuted text-[10px]">
            (Protected by Hardware Approval Gates)
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-near-textMuted">
          <span>{isOpen ? "Collapse" : "Expand"}</span>
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Terminal View */}
      {isOpen && (
        <div className="p-4 bg-near-black flex flex-col gap-2 font-mono text-xs">
          <div className="bg-[#050608] border border-near-border/60 rounded p-3 h-40 overflow-y-auto text-[11px] text-near-textSecondary flex flex-col gap-1">
            {logs.map((line, idx) => (
              <div
                key={idx}
                className={
                  line.startsWith("$")
                    ? "text-near-green font-semibold"
                    : line.startsWith("[GUARDRAIL]")
                    ? "text-amber-400 font-semibold"
                    : "text-near-textMuted"
                }
              >
                {line}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <span className="text-near-green font-bold text-xs">$</span>
            <input
              type="text"
              value={cmd}
              onChange={(e) => setCmd(e.target.value)}
              placeholder="Execute command on board (e.g. tegrastats, uname -a)..."
              className="flex-1 bg-near-surfaceElevated border border-near-border rounded px-2.5 py-1.5 text-xs text-near-textPrimary font-mono focus:outline-none focus:border-near-green"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-near-surfaceElevated border border-near-border text-near-green hover:bg-near-green/10 text-xs font-mono rounded flex items-center gap-1 transition-colors"
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
