"use client";

import React from "react";
import { AlertTriangle, Check, X, Terminal, ShieldAlert } from "lucide-react";
import { ApprovalRequest } from "../lib/types";
import { resolveApproval } from "../lib/api";

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  requests: ApprovalRequest[];
  onRefresh: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  requests,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const handleResolve = async (id: string, approved: boolean) => {
    await resolveApproval(id, approved);
    onRefresh();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-near-surface border border-near-border rounded-lg max-w-xl w-full p-5 flex flex-col gap-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-near-border pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-near-textPrimary">
                NearDesk Human-in-the-Loop Approval Queue
              </h3>
              <p className="text-[11px] text-near-textMuted">
                Critical actions requiring physical operator authorization.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-near-textMuted hover:text-near-textPrimary p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Request List */}
        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
          {requests.length === 0 ? (
            <div className="text-center py-8 text-xs text-near-textMuted font-mono">
              No pending approval requests. System is secure.
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="bg-near-black border border-near-border rounded p-3 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded">
                      {req.risk_level} RISK
                    </span>
                    <span className="text-xs font-semibold text-near-textPrimary">
                      {req.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-near-textMuted">
                    {new Date(req.created_at * 1000).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-xs text-near-textSecondary leading-relaxed">
                  {req.description}
                </p>

                {/* Payload Preview */}
                <div className="bg-near-surfaceElevated border border-near-border/60 rounded p-2 text-[11px] font-mono text-near-textMuted overflow-x-auto">
                  <pre>{JSON.stringify(req.payload, null, 2)}</pre>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-near-border/40">
                  <button
                    onClick={() => handleResolve(req.id, false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded hover:bg-red-500/20 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    onClick={() => handleResolve(req.id, true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-black bg-near-green hover:bg-near-greenHover rounded transition-colors shadow-near-glow"
                  >
                    <Check className="w-3.5 h-3.5" /> Authorize & Execute
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
