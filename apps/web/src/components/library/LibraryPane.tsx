"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Shield, Save, Check, Key, Users } from "lucide-react";
import { fetchMemory, saveMemory } from "../../lib/api";
import { VaultCard } from "./VaultCard";
import { ExpertsCard } from "./ExpertsCard";

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
      {/* Left Column: Persistent Memory & Guardrail Invariants */}
      <div className="col-span-6 flex flex-col gap-3 h-full min-h-0">
        <div className="bg-[#101216] border border-[#1E222A] rounded p-4 flex flex-col gap-3 flex-1 min-h-0">
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
            Persistent context loaded dynamically on every conversation turn. Contains physical hardware rules, strict budget limits, and operator operational parameters.
          </p>

          <textarea
            value={memory}
            onChange={(e) => setMemory(e.target.value)}
            placeholder="System memory Markdown..."
            className="flex-1 bg-[#090A0D] border border-[#1A1D24] rounded p-3 text-[11px] font-mono text-[#EDEDEF] focus:border-[#00EC97] focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Guardrail Policy Summary */}
        <div className="bg-[#101216] border border-[#1E222A] rounded p-3 flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2 border-b border-[#1A1D24] pb-1.5">
            <Shield className="w-3.5 h-3.5 text-[#00EC97]" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#EDEDEF]">
              Active Guardrail Policies
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-[#7E8492]">
            <div className="bg-[#090A0D] p-2 rounded border border-[#1A1D24]">
              <span className="text-[#EDEDEF] font-semibold block mb-0.5">Execution Gates</span>
              Approval Gate required for destructive commands (rm, dd, flash) and fund transfers.
            </div>
            <div className="bg-[#090A0D] p-2 rounded border border-[#1A1D24]">
              <span className="text-[#EDEDEF] font-semibold block mb-0.5">Key Scoping</span>
              FunctionCall keys limited to 2.5 N gas allowance. Root account deletion barred.
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Encrypted Runtime Vault & Expert Brains */}
      <div className="col-span-6 flex flex-col gap-3 h-full min-h-0">
        <VaultCard />
        <ExpertsCard />
      </div>
    </div>
  );
};
