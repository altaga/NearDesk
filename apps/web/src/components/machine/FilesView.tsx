"use client";

import React, { useState, useEffect } from "react";
import { Folder, FileText, ChevronRight, CornerLeftUp, RefreshCw, FileCode, HardDrive } from "lucide-react";
import { fetchFiles, fetchFileContent } from "../../lib/api";
import { FileListing, FileContent } from "../../lib/types";

export const FilesView: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(".");
  const [listing, setListing] = useState<FileListing | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileContent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fileLoading, setFileLoading] = useState<boolean>(false);

  const loadDirectory = async (path: string) => {
    setLoading(true);
    const data = await fetchFiles(path);
    if (data && data.ok) {
      setListing(data);
      setCurrentPath(data.relative_path);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadDirectory(".");
  }, []);

  const handleOpenEntry = async (entry: { name: string; type: "dir" | "file" }) => {
    if (entry.type === "dir") {
      const nextPath = currentPath === "." ? entry.name : `${currentPath}/${entry.name}`;
      setSelectedFile(null);
      await loadDirectory(nextPath);
    } else {
      setFileLoading(true);
      const filePath = currentPath === "." ? entry.name : `${currentPath}/${entry.name}`;
      const content = await fetchFileContent(filePath);
      if (content && content.ok) {
        setSelectedFile(content);
      }
      setFileLoading(false);
    }
  };

  const handleGoUp = async () => {
    if (currentPath === "." || !currentPath) return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    const parent = parts.length === 0 ? "." : parts.join("/");
    setSelectedFile(null);
    await loadDirectory(parent);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex-1 min-h-0 grid grid-cols-12 gap-3 h-full">
      {/* File Browser Sidebar */}
      <div className="col-span-5 bg-[#101216] border border-[#1E222A] rounded p-3 flex flex-col gap-2.5 h-full min-h-0">
        {/* Navigation & Breadcrumbs Header */}
        <div className="flex items-center justify-between border-b border-[#1A1D24] pb-2">
          <div className="flex items-center gap-1.5 overflow-hidden text-xs font-mono">
            <HardDrive className="w-3.5 h-3.5 text-[#00EC97] shrink-0" />
            <span className="text-[#EDEDEF] truncate">{listing?.path || "/"}</span>
          </div>
          <div className="flex items-center gap-1">
            {currentPath !== "." && (
              <button
                onClick={handleGoUp}
                title="Go to parent directory"
                className="p-1 text-[#7E8492] hover:text-[#EDEDEF] bg-[#14171E] rounded border border-[#1E222A]"
              >
                <CornerLeftUp className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => loadDirectory(currentPath)}
              title="Refresh directory"
              className="p-1 text-[#7E8492] hover:text-[#00EC97] bg-[#14171E] rounded border border-[#1E222A]"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto pr-0.5 flex flex-col gap-1 text-[11px] font-mono">
          {listing?.entries?.length === 0 ? (
            <div className="text-center py-8 text-[#6B7280]">Directory is empty</div>
          ) : (
            listing?.entries?.map((entry) => (
              <div
                key={entry.name}
                onClick={() => handleOpenEntry(entry)}
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors border ${
                  selectedFile?.name === entry.name
                    ? "bg-[#14171E] border-[#00EC97]/40 text-[#EDEDEF]"
                    : "bg-[#090A0D] border-transparent hover:border-[#1E222A] text-[#9CA3AF] hover:text-[#EDEDEF]"
                }`}
              >
                <div className="flex items-center gap-2 overflow-hidden pr-2">
                  {entry.type === "dir" ? (
                    <Folder className="w-3.5 h-3.5 text-[#00EC97] shrink-0" />
                  ) : (
                    <FileCode className="w-3.5 h-3.5 text-[#7E8492] shrink-0" />
                  )}
                  <span className="truncate">{entry.name}</span>
                </div>
                <span className="text-[10px] text-[#555C6E] shrink-0">
                  {entry.type === "dir" ? "dir" : formatSize(entry.size)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Code / File Viewer */}
      <div className="col-span-7 bg-[#101216] border border-[#1E222A] rounded p-3 flex flex-col gap-2 h-full min-h-0">
        <div className="flex items-center justify-between border-b border-[#1A1D24] pb-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-[#00EC97]" />
            <span className="text-[#EDEDEF] font-medium truncate">
              {selectedFile ? selectedFile.name : "No file selected"}
            </span>
          </div>
          {selectedFile && (
            <span className="text-[10px] text-[#6B7280]">
              {formatSize(selectedFile.size)} {selectedFile.truncated ? "(Truncated at 256KB)" : ""}
            </span>
          )}
        </div>

        <div className="flex-1 bg-[#090A0D] border border-[#1A1D24] rounded p-3 overflow-y-auto text-[11px] font-mono text-[#9CA3AF] leading-relaxed">
          {fileLoading ? (
            <div className="flex items-center justify-center h-full text-[#6B7280]">
              <RefreshCw className="w-4 h-4 animate-spin mr-2 text-[#00EC97]" />
              Reading file from board disk...
            </div>
          ) : selectedFile ? (
            <pre className="whitespace-pre-wrap font-mono select-text">
              {selectedFile.content}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-[#555C6E] gap-1">
              <Folder className="w-6 h-6 text-[#1E222A]" />
              <span>Select a file from the workspace tree to inspect source code.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
