"use client";

import React from "react";
import { Check, X, ShieldAlert } from "lucide-react";
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="approval-modal-title"
      className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
    >
      <div className="bg-[#101216] border border-[#1E222A] rounded-lg max-w-xl w-full p-5 flex flex-col gap-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1A1D24] pb-3">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <div>
              <h3 id="approval-modal-title" className="text-xs font-semibold text-[#EDEDEF]">
                Human-in-the-Loop Verification Queue
              </h3>
              <p className="text-[11px] text-[#7E8492]">
                Critical edge operations requiring physical operator confirmation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close approval queue"
            className="text-[#6B7280] hover:text-[#EDEDEF] p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Request List */}
        <div className="flex flex-col gap-2.5 max-h-[60vh] overflow-y-auto pr-0.5">
          {requests.length === 0 ? (
            <div className="text-center py-8 text-xs text-[#6B7280] font-mono">
              Queue clear. No pending approval requests.
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="bg-[#090A0D] border border-[#1A1D24] rounded p-3 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono uppercase bg-[#20150A] text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded font-medium">
                      {req.risk_level} Risk
                    </span>
                    <span className="text-xs font-semibold text-[#EDEDEF]">
                      {req.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#6B7280]">
                    {new Date(req.created_at * 1000).toLocaleTimeString()}
                  </span>
                </div>

                <p className="text-[11px] text-[#9CA3AF] leading-relaxed">
                  {req.description}
                </p>

                {/* Payload Preview */}
                <div className="bg-[#0E1015] border border-[#16181F] rounded p-2 text-[10px] font-mono text-[#7E8492] overflow-x-auto max-h-36">
                  <pre>{JSON.stringify(req.payload, null, 2)}</pre>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#16181F]">
                  <button
                    onClick={() => handleResolve(req.id, false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-red-400 bg-[#1A0F11] border border-red-500/20 rounded hover:bg-[#251215] transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    onClick={() => handleResolve(req.id, true)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-[11px] font-semibold text-[#08090B] bg-[#00EC97] hover:bg-[#00FFA3] rounded transition-colors"
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
