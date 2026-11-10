"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, Trash2, Sparkles, Copy, Check, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import { fetchBrains, createBrain, deleteBrain } from "../../lib/api";
import { BrainItem } from "../../lib/types";

export const ExpertsCard: React.FC = () => {
  const [brains, setBrains] = useState<BrainItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [angle, setAngle] = useState<string>("");
  const [method, setMethod] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedName, setCopiedName] = useState<string | null>(null);
  const [expandedName, setExpandedName] = useState<string | null>("SecurityAuditor");

  const loadBrains = async () => {
    setLoading(true);
    const data = await fetchBrains();
    setBrains(data);
    setLoading(false);
  };

  useEffect(() => {
    loadBrains();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !angle.trim() || !method.trim()) {
      setError("Name, Angle, and Method are all required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await createBrain(name.trim(), angle.trim(), method.trim());
    setSubmitting(false);
    if (res) {
      setName("");
      setAngle("");
      setMethod("");
      setShowAddForm(false);
      await loadBrains();
    } else {
      setError("Failed to create expert persona. Ensure name is 2-40 alphanumeric characters.");
    }
  };

  const handleDelete = async (brainName: string) => {
    if (!confirm(`Delete expert persona @${brainName}?`)) return;
    const ok = await deleteBrain(brainName);
    if (ok) {
      await loadBrains();
    }
  };

  const copyInvocation = (brainName: string) => {
    navigator.clipboard.writeText(`@${brainName} `);
    setCopiedName(brainName);
    setTimeout(() => setCopiedName(null), 2000);
  };

  return (
    <div className="bg-[#101216] border border-[#1E222A] rounded p-4 flex flex-col gap-3 font-mono text-xs flex-1 min-h-0">
      <div className="flex items-center justify-between border-b border-[#1A1D24] pb-2.5">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-[#00EC97]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#EDEDEF]">
            Operator Experts & Personas
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] bg-[#00EC97]/10 text-[#00EC97] px-2 py-0.5 rounded border border-[#00EC97]/20">
            @Tag Invocation
          </span>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-2 py-1 bg-[#14171E] hover:bg-[#1E222A] border border-[#1E222A] text-[#EDEDEF] text-[11px] rounded flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3 text-[#00EC97]" />
            <span>Add Expert</span>
          </button>
        </div>
      </div>

      <div className="text-[10px] text-[#7E8492] leading-tight">
        Reference <code className="text-[#00EC97]">@ExpertName</code> in any operator chat message to adopt their specific posture, angle, and operational procedure for that turn.
      </div>

      {showAddForm && (
        <form onSubmit={handleCreate} className="bg-[#090A0D] border border-[#00EC97]/30 rounded p-3 flex flex-col gap-2.5">
          <div className="text-[11px] font-semibold text-[#EDEDEF] flex items-center justify-between">
            <span>Register New Expert Persona</span>
            <span className="text-[10px] text-[#00EC97]">Dynamic Prompt Injection</span>
          </div>

          {error && (
            <div className="text-[10px] text-[#FF4B4B] flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div>
              <label className="text-[10px] text-[#7E8492] uppercase tracking-wider block mb-1">
                Expert Name (without @)
              </label>
              <input
                type="text"
                placeholder="e.g. NearContractAuditor, ThermalProfiler"
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[^A-Za-z0-9_]/g, ""))}
                className="w-full bg-[#101216] border border-[#1E222A] rounded px-2.5 py-1.5 text-xs text-[#EDEDEF] focus:border-[#00EC97] focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#7E8492] uppercase tracking-wider block mb-1">
                Angle & Philosophy (The Posture)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Zero-trust verification, hardware isolation, minimal gas policies..."
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                className="w-full bg-[#101216] border border-[#1E222A] rounded px-2.5 py-1.5 text-xs text-[#EDEDEF] focus:border-[#00EC97] focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="text-[10px] text-[#7E8492] uppercase tracking-wider block mb-1">
                Method (Step-by-Step Procedure)
              </label>
              <textarea
                rows={2}
                placeholder="1. Query state. 2. Verify cryptographically. 3. Propose action."
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full bg-[#101216] border border-[#1E222A] rounded px-2.5 py-1.5 text-xs text-[#EDEDEF] focus:border-[#00EC97] focus:outline-none resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-2.5 py-1 text-[11px] text-[#7E8492] hover:text-[#EDEDEF]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1 bg-[#00EC97] hover:bg-[#00EC97]/90 text-[#090A0D] text-[11px] font-semibold rounded flex items-center gap-1"
            >
              <Check className="w-3 h-3" />
              <span>{submitting ? "Registering..." : "Save Persona"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Brains List */}
      <div className="flex flex-col gap-2 overflow-y-auto flex-1 min-h-0 pr-0.5">
        {loading ? (
          <div className="text-[11px] text-[#7E8492] py-2 text-center">Loading registered personas...</div>
        ) : brains.length === 0 ? (
          <div className="text-[11px] text-[#7E8492] py-3 text-center border border-dashed border-[#1E222A] rounded">
            No expert brains registered.
          </div>
        ) : (
          brains.map((b) => {
            const isExpanded = expandedName === b.name;
            const isDefault = ["SecurityAuditor", "DeFiSolver", "JetsonArchitect"].includes(b.name);

            return (
              <div
                key={b.name}
                className="bg-[#090A0D] border border-[#1A1D24] hover:border-[#1E222A] rounded p-2.5 flex flex-col gap-2 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#00EC97] bg-[#00EC97]/10 px-2 py-0.5 rounded border border-[#00EC97]/20">
                      @{b.name}
                    </span>
                    {isDefault && (
                      <span className="text-[9px] text-[#7E8492] border border-[#1E222A] px-1.5 py-0.5 rounded">
                        Core System Expert
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyInvocation(b.name)}
                      className="px-2 py-1 bg-[#14171E] hover:bg-[#1E222A] text-[#EDEDEF] text-[10px] rounded flex items-center gap-1 transition-colors"
                      title="Copy @tag to chat"
                    >
                      {copiedName === b.name ? <Check className="w-3 h-3 text-[#00EC97]" /> : <Copy className="w-3 h-3 text-[#7E8492]" />}
                      <span>{copiedName === b.name ? "Copied" : "Invoke"}</span>
                    </button>
                    {!isDefault && (
                      <button
                        onClick={() => handleDelete(b.name)}
                        className="p-1 text-[#7E8492] hover:text-[#FF4B4B] hover:bg-[#FF4B4B]/10 rounded"
                        title={`Delete @${b.name}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => setExpandedName(isExpanded ? null : b.name)}
                      className="p-1 text-[#7E8492] hover:text-[#EDEDEF]"
                    >
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-[#9CA3AF] leading-relaxed">
                  <span className="text-[#7E8492] font-semibold">Angle: </span>
                  {b.angle}
                </div>

                {isExpanded && (
                  <div className="mt-1 pt-2 border-t border-[#1A1D24] flex flex-col gap-1 text-[10px]">
                    <span className="text-[#7E8492] font-semibold uppercase tracking-wider">Methodology:</span>
                    <pre className="text-[#EDEDEF] whitespace-pre-wrap font-mono bg-[#101216] p-2 rounded border border-[#1A1D24] leading-relaxed">
                      {b.method}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
