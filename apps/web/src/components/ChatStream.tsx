"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Wrench, ChevronRight, CornerDownLeft } from "lucide-react";
import { ChatMessage } from "../lib/types";
import { sendChatMessage } from "../lib/api";

interface ChatStreamProps {
  onBudgetUpdate?: () => void;
  onApprovalUpdate?: () => void;
}

const DEFAULT_PROMPTS = [
  "Check Jetson hardware telemetry & thermal metrics",
  "Derive Ethereum and Solana addresses via NEAR Chain Signatures",
  "Get 1Click swap quote for 2.5 SOL to NEAR via solver network",
  "Verify TEE hardware attestation report for confidential computing",
  "Inspect current NEAR AI Cloud budget and token usage ($10 limit)"
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
        "Welcome to NearDesk. I am Nova, your edge-native autonomous operator running on this Jetson node. I manage local routines, derive multi-chain accounts via NEAR Chain Signatures, and route cross-chain liquidity with NEAR Intents—protected by strict human-in-the-loop approval gates.",
      tier: "edge_init",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

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
        content: response.content || "Command completed.",
        tier: response.tier,
        tools: response.tool_executions || [],
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } else {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Error processing request: ${response?.error?.message || "NearDesk API unreachable"}`,
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
    <div className="flex flex-col h-full bg-near-black border border-near-border rounded overflow-hidden">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 text-xs leading-relaxed ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role !== "user" && (
              <div className="w-6 h-6 rounded bg-near-surfaceElevated border border-near-border flex items-center justify-center shrink-0 text-near-green">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded p-3 flex flex-col gap-2 ${
                msg.role === "user"
                  ? "bg-near-surfaceElevated border border-near-border text-near-textPrimary"
                  : "bg-near-surface border border-near-border/80 text-near-textPrimary"
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center justify-between text-[10px] font-mono text-near-textMuted border-b border-near-border/40 pb-1">
                <span>{msg.role === "user" ? "Operator" : "Nova Operator"}</span>
                {msg.tier && (
                  <span className="text-near-green uppercase px-1.5 py-0.2 bg-near-green/10 rounded">
                    {msg.tier}
                  </span>
                )}
              </div>

              {/* Message Content */}
              <div className="whitespace-pre-wrap font-sans text-xs">
                {msg.content}
              </div>

              {/* Tool Execution Badges */}
              {msg.tools && msg.tools.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1 border-t border-near-border/40">
                  {msg.tools.map((t, idx) => (
                    <div
                      key={idx}
                      className="bg-near-black border border-near-border/60 rounded p-2 text-[11px] font-mono"
                    >
                      <div className="flex items-center gap-1.5 text-near-green font-semibold mb-1">
                        <Wrench className="w-3 h-3" />
                        <span>Tool Invocation: {t.tool}</span>
                      </div>
                      <pre className="text-near-textMuted text-[10px] overflow-x-auto max-h-28">
                        {JSON.stringify(t.output, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {msg.role === "user" && (
              <div className="w-6 h-6 rounded bg-near-surfaceElevated border border-near-border flex items-center justify-center shrink-0 text-near-textSecondary">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 text-xs justify-start">
            <div className="w-6 h-6 rounded bg-near-surfaceElevated border border-near-border flex items-center justify-center shrink-0 text-near-green">
              <Bot className="w-3.5 h-3.5 animate-pulse" />
            </div>
            <div className="bg-near-surface border border-near-border rounded px-3 py-2 text-near-textMuted flex items-center gap-2 font-mono text-xs">
              <Sparkles className="w-3.5 h-3.5 text-near-green animate-spin" />
              <span>Edge Agent reasoning...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Chips */}
      <div className="px-3 py-2 border-t border-near-border bg-near-surface flex items-center gap-2 overflow-x-auto">
        <span className="text-[10px] font-mono uppercase text-near-textMuted shrink-0">
          Quick Actions:
        </span>
        {DEFAULT_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="text-[11px] text-near-textSecondary bg-near-black hover:text-near-green border border-near-border hover:border-near-green/30 px-2.5 py-1 rounded shrink-0 transition-colors flex items-center gap-1"
          >
            <span>{prompt}</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-3 bg-near-surface border-t border-near-border flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Command Nova (e.g., 'Derive a Bitcoin address for subaccount 2', 'Swap SOL to NEAR')..."
          rows={2}
          className="flex-1 bg-near-black border border-near-border rounded p-2 text-xs text-near-textPrimary placeholder:text-near-textMuted focus:outline-none focus:border-near-green resize-none font-sans"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="h-10 px-4 bg-near-green hover:bg-near-greenHover disabled:opacity-40 disabled:hover:bg-near-green text-black font-semibold rounded text-xs transition-colors flex items-center gap-1.5 shrink-0 shadow-near-glow"
        >
          <span>Send</span>
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
