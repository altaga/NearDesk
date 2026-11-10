"use client";

import React, { useState, useRef, useEffect } from "react";
import { CornerDownLeft, ChevronDown, ChevronRight, Terminal, Sparkles } from "lucide-react";
import { ChatMessage } from "../lib/types";
import { sendChatMessage } from "../lib/api";

interface ChatStreamProps {
  onBudgetUpdate?: () => void;
  onApprovalUpdate?: () => void;
}

const QUICK_ACTIONS = [
  "Hardware telemetry & thermal metrics",
  "Derive Ethereum and Solana addresses",
  "Quote 2.5 SOL to NEAR via 1Click",
  "Verify TEE hardware attestation",
  "Inspect NEAR AI budget status"
];

export const ChatStream: React.FC<ChatStreamProps> = ({
  onBudgetUpdate,
  onApprovalUpdate,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro-1",
      role: "assistant",
      content:
        "NearDesk edge operator initialized. Local routines operate on hardware; multi-chain accounts derive via NEAR Chain Signatures; cross-chain liquidity settles through NEAR Intents. High-risk actions require operator authorization.",
      tier: "local_fast",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const toggleTool = (idxKey: string) => {
    setExpandedTools((prev) => ({ ...prev, [idxKey]: !prev[idxKey] }));
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const payload = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: text },
    ];

    const response = await sendChatMessage(payload);

    if (response && response.ok) {
      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: "assistant",
        content: response.content || "Execution completed.",
        tier: response.tier,
        tools: response.tool_executions || [],
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } else {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Execution error: ${response?.error?.message || "NearDesk API unreachable"}`,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    }

    setLoading(false);
    onBudgetUpdate?.();
    onApprovalUpdate?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0D11] border border-[#1A1D24] rounded-lg overflow-hidden">
      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className="flex flex-col gap-1.5 max-w-3xl">
              {/* Header Label */}
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#585F70]">
                <span className={isUser ? "text-[#EDEDEF] font-medium" : "text-[#00EC97] font-medium"}>
                  {isUser ? "Operator" : "Nova"}
                </span>
                {msg.tier && (
                  <span className="text-[9px] uppercase px-1 py-0.2 bg-[#14171E] text-[#7E8492] rounded-sm">
                    {msg.tier}
                  </span>
                )}
                <span className="text-[#323744]">·</span>
                <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>

              {/* Message Body */}
              <div className={`text-xs leading-relaxed ${isUser ? "text-[#EDEDEF] pl-1" : "text-[#B4BAC7] pl-1 font-normal"}`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
              </div>

              {/* Collapsible Tools */}
              {msg.tools && msg.tools.length > 0 && (
                <div className="flex flex-col gap-1.5 mt-2 pl-1">
                  {msg.tools.map((t, idx) => {
                    const key = `${msg.id}-${idx}`;
                    const isExpanded = expandedTools[key];
                    return (
                      <div key={key} className="bg-[#101217] border border-[#1E222B] rounded text-[11px] font-mono overflow-hidden">
                        <button
                          onClick={() => toggleTool(key)}
                          className="w-full px-3 py-1.5 flex items-center justify-between text-[#8E95A5] hover:text-[#EDEDEF] hover:bg-[#15181F] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Terminal className="w-3 h-3 text-[#00EC97]" />
                            <span>Tool: {t.tool}</span>
                          </div>
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </button>
                        {isExpanded && (
                          <div className="p-3 bg-[#08090C] border-t border-[#1A1D24] text-[10px] text-[#7E8492] overflow-x-auto max-h-48">
                            <pre>{JSON.stringify(t.output, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#6B7280] font-mono py-2 pl-1">
            <Sparkles className="w-3 h-3 text-[#00EC97] animate-spin" />
            <span>Processing reasoning routine...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="px-4 py-2 bg-[#0E1015] border-t border-[#181B22] flex items-center gap-2 overflow-x-auto select-none">
        <span className="text-[10px] font-mono text-[#4C5261] uppercase tracking-wider shrink-0">Prompts:</span>
        {QUICK_ACTIONS.map((action, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(action)}
            disabled={loading}
            className="text-[11px] text-[#7E8492] hover:text-[#EDEDEF] bg-[#14161D] hover:bg-[#1B1E27] border border-[#20242E] px-2.5 py-1 rounded shrink-0 transition-colors"
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-3 bg-[#0B0D11] border-t border-[#181B22]">
        <div className="relative flex items-center bg-[#101217] border border-[#1E222A] focus-within:border-[#00EC97]/50 rounded-lg p-2 transition-colors">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Instruct Nova (e.g. 'Derive Solana address', 'Quote 2.5 SOL to NEAR')..."
            rows={1}
            className="w-full bg-transparent text-xs text-[#EDEDEF] placeholder-[#505666] focus:outline-none resize-none font-sans pr-10"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="absolute right-2 p-1.5 text-black bg-[#00EC97] hover:bg-[#00FFA3] disabled:opacity-20 disabled:hover:bg-[#00EC97] rounded transition-colors"
          >
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
