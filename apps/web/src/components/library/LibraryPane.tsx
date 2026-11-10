"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Key, Shield, Save, Check, RefreshCw } from "lucide-react";
import { fetchMemory, saveMemory } from "../../lib/api";
import { MemoryDoc } from "../../lib/types";

export const LibraryPane: React.FC = () => {
  const [memory, setMemory] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  const loadMem = async () => {
    setLoading(true);
    const data = await fetchMemory();
    if (data && data.ok) {
      setMemory(data.content);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMem();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const ok = await saveMemory(memory);
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="flex-1 min-h-0 grid grid-cols-12 gap-3 h-full font-mono text-xs">
      {/* Left: Memory Editor */}
      <div className="col-span-8 bg-[#101216] border border-[#1E222A] rounded p-4 flex flex-col gap-3 h-full min-h-0">
        <div className="flex items-center justify-between border-b border-[#1A1D24] pb-2.5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[#00EC97]" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#EDEDEF]">
              Sovereign Agent Memory & Invariants
            </h2>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 bg-[#14171E] hover:bg-[#1E222A] border border-[#1E222A] text-[#00EC97] text-xs font-mono rounded flex items-center gap-1.5 transition-colors"
          >
            {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
            <span>{saved ? "Saved" : saving ? "Saving..." : "Save Memory"}</span>
          </button>
        </div>

        <p className="text-[11px] text-[#7E8492] leading-relaxed">
          Persistent context read by Nova on every conversation turn. Contains physical hardware invariants, budget ceilings, and operator preferences.
        </p>

        <textarea
          value={memory}
          onChange={(e) => setMemory(e.target.value)}
          placeholder="System memory Markdown..."
          className="flex-1 bg-[#090A0D] border border-[#1A1D24] rounded p-3 text-[11px] font-mono text-[#EDEDEF] focus:border-[#00EC97] focus:outline-none resize-none leading-relaxed"
        />
      </div>

      {/* Right: Security & Secrets Vault */}
      <div className="col-span-4 flex flex-col gap-3 h-full min-h-0">
        <div className="bg-[#101216] border border-[#1E222A] rounded p-4 flex flex-col gap-2.5">
          <div className="flex items-center gap-2 border-b border-[#1A1D24] pb-2">
            <Key className="w-3.5 h-3.5 text-[#00EC97]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#EDEDEF]">
              Sovereign Secrets Vault
            </span>
          </div>

          <div className="flex flex-col gap-2 text-[11px]">
            <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-2.5 flex items-center justify-between">
              <span className="text-[#9CA3AF]">NEAR Node Private Key</span>
              <span className="text-[#00EC97] font-medium text-[10px]">Disk Keystore (Encrypted)</span>
            </div>

            <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-2.5 flex items-center justify-between">
              <span className="text-[#9CA3AF]">NEAR AI Cloud Token</span>
              <span className="text-[#00EC97] font-medium text-[10px]">Active (Strict $10 Cap)</span>
            </div>

            <div className="bg-[#090A0D] border border-[#1A1D24] rounded p-2.5 flex items-center justify-between">
              <span className="text-[#9CA3AF]">MPC Derivation Curve</span>
              <span className="text-[#7E8492] font-medium text-[10px]">secp256k1 + ed25519</span>
            </div>
          </div>
        </div>

        <div className="bg-[#101216] border border-[#1E222A] rounded p-4 flex flex-col gap-2 flex-1 min-h-0">
          <div className="flex items-center gap-2 border-b border-[#1A1D24] pb-2">
            <Shield className="w-3.5 h-3.5 text-[#00EC97]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#EDEDEF]">
              Operator Guardrail Policy
            </span>
          </div>

          <ul className="text-[10px] text-[#7E8492] flex flex-col gap-1.5 leading-relaxed overflow-y-auto">
            <li>• Destructive commands (rm, dd, mkfs, reboot) require physical operator confirmation.</li>
            <li>• No fund transfers can be performed by the agent without an approval gate.</li>
            <li>• Scoped FunctionCall Access Keys strictly bar account deletion.</li>
            <li>• All actions committed with SHA-256 hashes to NEAR blocks.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
