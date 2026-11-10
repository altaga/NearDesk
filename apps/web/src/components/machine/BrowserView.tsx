"use client";

import React, { useState, useEffect } from "react";
import { Globe, ArrowRight, RefreshCw, Camera, ShieldCheck, ExternalLink } from "lucide-react";
import { fetchBrowserStatus, performBrowserAction } from "../../lib/api";
import { BrowserStatus } from "../../lib/types";

export const BrowserView: React.FC = () => {
  const [url, setUrl] = useState<string>("https://near.org");
  const [status, setStatus] = useState<BrowserStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [previewKey, setPreviewKey] = useState<number>(Date.now());

  const loadStatus = async () => {
    const data = await fetchBrowserStatus();
    if (data && data.ok) {
      setStatus(data);
      if (data.url) setUrl(data.url);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleNavigate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    await performBrowserAction("navigate", url);
    await loadStatus();
    setPreviewKey(Date.now());
    setLoading(false);
  };

  const handleScreenshot = async () => {
    setLoading(true);
    await performBrowserAction("screenshot");
    await loadStatus();
    setPreviewKey(Date.now());
    setLoading(false);
  };

  return (
    <div className="flex-1 bg-[#101216] border border-[#1E222A] rounded p-4 flex flex-col gap-3 h-full min-h-0 font-mono">
      {/* Browser Controls Bar */}
      <div className="flex items-center justify-between border-b border-[#1A1D24] pb-3 gap-3">
        <form onSubmit={handleNavigate} className="flex-1 flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#090A0D] border border-[#1E222A] rounded px-3 py-1.5 flex-1 focus-within:border-[#00EC97] transition-colors">
            <Globe className="w-3.5 h-3.5 text-[#00EC97] shrink-0" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL to navigate on board (e.g. https://near.org)..."
              className="bg-transparent text-xs text-[#EDEDEF] focus:outline-none w-full font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-3.5 py-1.5 bg-[#14171E] hover:bg-[#1E222A] border border-[#1E222A] text-[#EDEDEF] hover:text-[#00EC97] text-xs font-mono rounded flex items-center gap-1.5 transition-colors"
          >
            {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
            <span>Go</span>
          </button>
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleScreenshot}
            disabled={loading}
            title="Take headless screenshot"
            className="p-2 text-[#7E8492] hover:text-[#EDEDEF] bg-[#090A0D] rounded border border-[#1E222A] transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <a
            href={status?.url || url}
            target="_blank"
            rel="noreferrer"
            title="Open in new browser tab"
            className="p-2 text-[#7E8492] hover:text-[#00EC97] bg-[#090A0D] rounded border border-[#1E222A] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Browser Status Meta */}
      <div className="flex items-center justify-between text-[11px] text-[#7E8492] px-1">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-[#00EC97] flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> Sandboxed Engine
          </span>
          <span className="text-[#3A404F]">|</span>
          <span className="text-[#EDEDEF] truncate">{status?.title || "NEAR Protocol Ecosystem"}</span>
        </div>
        <span className="shrink-0 text-[10px] text-[#555C6E]">Playwright Chromium Automation</span>
      </div>

      {/* Browser Viewport Canvas */}
      <div className="flex-1 bg-[#060709] border border-[#16181F] rounded overflow-hidden flex flex-col items-center justify-center relative min-h-0">
        <div className="w-full h-full p-2 flex items-center justify-center">
          <img
            key={previewKey}
            src={`http://localhost:8000/v1/browser/preview?t=${previewKey}`}
            alt="Browser Preview"
            onError={(e) => {
              // Hide image if empty
              (e.target as HTMLElement).style.display = "none";
            }}
            onLoad={(e) => {
              (e.target as HTMLElement).style.display = "block";
            }}
            className="max-h-full max-w-full object-contain rounded border border-[#1E222A]/50 shadow-lg"
          />
        </div>

        {/* Fallback Overlay if no screenshot yet */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-[#555C6E] pointer-events-none gap-2">
          <Globe className="w-8 h-8 text-[#1E222A]" />
          <p className="text-xs font-mono max-w-md">
            Headless Chromium engine ready on edge station. Enter a URL above and press <b className="text-[#00EC97]">Go</b> to automate and render live web interactions.
          </p>
        </div>
      </div>
    </div>
  );
};
