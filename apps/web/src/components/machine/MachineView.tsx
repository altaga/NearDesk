"use client";

import React, { useState } from "react";
import { Folder, Terminal, Globe, Activity } from "lucide-react";
import { FilesView } from "./FilesView";
import { TerminalPane } from "./TerminalPane";
import { BrowserView } from "./BrowserView";
import { JobsPane } from "./JobsPane";

type MachineSubTab = "files" | "terminal" | "browser" | "jobs";

export const MachineView: React.FC = () => {
  const [tab, setTab] = useState<MachineSubTab>("files");

  return (
    <div className="flex-1 flex flex-col gap-3 h-full min-h-0">
      {/* Sub-tab Selector */}
      <div className="flex items-center justify-between border-b border-[#1A1D24] pb-2 text-xs font-mono">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTab("files")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              tab === "files"
                ? "bg-[#16191F] text-[#00EC97] font-semibold border border-[#232833]"
                : "text-[#7E8492] hover:text-[#EDEDEF]"
            }`}
          >
            <Folder className="w-3.5 h-3.5" />
            <span>Files</span>
          </button>

          <button
            onClick={() => setTab("terminal")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              tab === "terminal"
                ? "bg-[#16191F] text-[#00EC97] font-semibold border border-[#232833]"
                : "text-[#7E8492] hover:text-[#EDEDEF]"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Terminal</span>
          </button>

          <button
            onClick={() => setTab("browser")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              tab === "browser"
                ? "bg-[#16191F] text-[#00EC97] font-semibold border border-[#232833]"
                : "text-[#7E8492] hover:text-[#EDEDEF]"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Browser</span>
          </button>

          <button
            onClick={() => setTab("jobs")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all ${
              tab === "jobs"
                ? "bg-[#16191F] text-[#00EC97] font-semibold border border-[#232833]"
                : "text-[#7E8492] hover:text-[#EDEDEF]"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Jobs</span>
          </button>
        </div>

        <span className="text-[10px] text-[#555C6E] uppercase tracking-wider">
          Physical Jetson Edge Surface
        </span>
      </div>

      {/* Selected View */}
      <div className="flex-1 min-h-0">
        {tab === "files" && <FilesView />}
        {tab === "terminal" && <TerminalPane />}
        {tab === "browser" && <BrowserView />}
        {tab === "jobs" && <JobsPane />}
      </div>
    </div>
  );
};
