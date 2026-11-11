import {
  TelemetryData,
  BudgetStatus,
  DerivedAddress,
  IntentQuote,
  ApprovalRequest,
  KeyFencingStatus,
  AuditEntry,
  AgentProfile,
  AgentEconomyMetrics,
  NearAccountStatus,
  BoardPairingStatus,
  DiscoveredNode,
  W3CDIDDocument,
  VerifiableCredential,
  FileListing,
  FileContent,
  BoardInfoDetail,
  BoardHealthDetail,
  ProcessItem,
  BrowserStatus,
  JobItem,
  MemoryDoc,
  VaultSecret,
  BrainItem,
} from "./types";

const API_BASE = typeof window !== "undefined" ? "/v1" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/v1");

export async function fetchTelemetry(): Promise<TelemetryData | null> {
  try {
    const res = await fetch(`${API_BASE}/telemetry`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchBudget(): Promise<BudgetStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/budget`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function deriveAddress(chain: string, derivationPath: string = "1"): Promise<DerivedAddress | null> {
  try {
    const res = await fetch(`${API_BASE}/near/derive`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chain, derivation_path: derivationPath }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchIntentQuote(assetIn: string, assetOut: string, amountIn: string): Promise<IntentQuote | null> {
  try {
    const res = await fetch(`${API_BASE}/near/intents/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ asset_in: assetIn, asset_out: assetOut, amount_in: amountIn }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchApprovals(): Promise<ApprovalRequest[]> {
  try {
    const res = await fetch(`${API_BASE}/approvals`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function resolveApproval(requestId: string, approved: boolean): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/approvals/${requestId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved, resolved_by: "operator" }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchFencing(): Promise<KeyFencingStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/near/fencing`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAuditTrail(): Promise<AuditEntry[]> {
  try {
    const res = await fetch(`${API_BASE}/near/audit`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function fetchAgentProfile(): Promise<AgentProfile | null> {
  try {
    const res = await fetch(`${API_BASE}/near/agent/profile`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchAgentEconomy(): Promise<AgentEconomyMetrics | null> {
  try {
    const res = await fetch(`${API_BASE}/near/agent/economy`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchOnChainAccount(): Promise<NearAccountStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/near/account`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchPairingStatus(): Promise<BoardPairingStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/pair/status`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export const LOCAL_EMU_TARGETS = [
  { url: "http://127.0.0.1:18101", label: "Docker Board Emulator 01 (Port 18101)", type: "docker_emu" },
  { url: "http://127.0.0.1:18102", label: "Docker Board Emulator 02 (Port 18102)", type: "docker_emu" },
  { url: "http://127.0.0.1:18103", label: "Docker Board Emulator 03 (Port 18103)", type: "docker_emu" },
  { url: "http://192.168.55.1:8800", label: "Jetson USB Gadget Link", type: "usb_gadget" },
];

export async function discoverNodes(): Promise<DiscoveredNode[]> {
  let backendNodes: DiscoveredNode[] = [];
  try {
    const res = await fetch(`${API_BASE}/pair/discover`, { cache: "no-store" });
    if (res.ok) {
      backendNodes = await res.json();
    }
  } catch {
    // Backend discover failed or offline
  }

  // Client-side direct probing for local Docker emulators & USB links
  if (typeof window !== "undefined") {
    const localProbes = await Promise.all(
      LOCAL_EMU_TARGETS.map(async (target) => {
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 1200);
        try {
          const res = await fetch(`${target.url}/v1/health`, {
            method: "GET",
            mode: "cors",
            cache: "no-store",
            signal: ctrl.signal,
          });
          clearTimeout(timeout);
          if (res.ok) {
            const data = await res.json().catch(() => ({}));
            return {
              label: target.label,
              url: target.url,
              type: target.type,
              reachable: true,
              detected_hardware: data.board_type || "NVIDIA Jetson Orin Nano (Emulated)",
              status: "online",
            } as DiscoveredNode;
          }
        } catch {
          // Probe timed out or offline
        } finally {
          clearTimeout(timeout);
        }
        return null;
      })
    );

    // Merge: Replace unreachable backend entries with reachable local probe entries
    for (const probe of localProbes) {
      if (!probe) continue;
      const idx = backendNodes.findIndex((n) => n.url === probe.url);
      if (idx >= 0) {
        backendNodes[idx] = probe;
      } else {
        backendNodes.push(probe);
      }
    }
  }

  return backendNodes;
}

export async function claimBoard(boardId: string, ipAddress: string, nearAccount?: string): Promise<BoardPairingStatus | null> {
  // If claiming a local emulator directly, call the emulator's endpoint
  if (typeof window !== "undefined" && (ipAddress.includes("127.0.0.1") || ipAddress.includes("localhost"))) {
    try {
      const emuRes = await fetch(`${ipAddress}/v1/pair/claim`, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ board_id: boardId, ip_address: ipAddress, near_account: nearAccount }),
      });
      if (emuRes.ok) {
        const emuData = await emuRes.json();
        // Also inform the backend desk
        fetch(`${API_BASE}/pair/claim`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ board_id: boardId, ip_address: ipAddress, near_account: nearAccount }),
        }).catch(() => {});
        return emuData;
      }
    } catch (e) {
      console.warn("Direct emulator claim fallback to backend:", e);
    }
  }

  try {
    const res = await fetch(`${API_BASE}/pair/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ board_id: boardId, ip_address: ipAddress, near_account: nearAccount }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchDIDDocument(): Promise<W3CDIDDocument | null> {
  try {
    const res = await fetch(`${API_BASE}/near/agent/did`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchVerifiableCredential(): Promise<VerifiableCredential | null> {
  try {
    const res = await fetch(`${API_BASE}/near/agent/credential`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function resolveDIDOnChain(didOrAccount: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/near/agent/did/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ did_or_account: didOrAccount }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function sendChatMessage(messages: Array<{ role: string; content: string }>): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) {
      const err = await res.json();
      return { ok: false, error: err };
    }
    return await res.json();
  } catch (e: any) {
    return { ok: false, error: { message: e.message || "Failed to reach NearDesk API" } };
  }
}

// -------------------------------------------------------------
// Machine: Filesystem
// -------------------------------------------------------------
export async function fetchFiles(path: string = "."): Promise<FileListing | null> {
  try {
    const res = await fetch(`${API_BASE}/edge/files?path=${encodeURIComponent(path)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchFileContent(path: string): Promise<FileContent | null> {
  try {
    const res = await fetch(`${API_BASE}/edge/files/read?path=${encodeURIComponent(path)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveFileContent(path: string, content: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/edge/files/write`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, content }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// Board Telemetry & Processes
// -------------------------------------------------------------
export async function fetchBoardInfo(): Promise<BoardInfoDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/board/info`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchBoardHealth(): Promise<BoardHealthDetail | null> {
  try {
    const res = await fetch(`${API_BASE}/board/health`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchBoardProcesses(): Promise<ProcessItem[]> {
  try {
    const res = await fetch(`${API_BASE}/board/processes`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// -------------------------------------------------------------
// Browser Automation
// -------------------------------------------------------------
export async function fetchBrowserStatus(): Promise<BrowserStatus | null> {
  try {
    const res = await fetch(`${API_BASE}/browser/status`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function performBrowserAction(action: string, url?: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/browser/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, url }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// -------------------------------------------------------------
// Jobs Supervisor
// -------------------------------------------------------------
export async function fetchJobs(): Promise<JobItem[]> {
  try {
    const res = await fetch(`${API_BASE}/jobs`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.jobs || [];
  } catch {
    return [];
  }
}

export async function cancelJob(jobId: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/jobs/${jobId}/cancel`, { method: "POST" });
    return res.ok;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// Memory
// -------------------------------------------------------------
export async function fetchMemory(): Promise<MemoryDoc | null> {
  try {
    const res = await fetch(`${API_BASE}/memory`, { cache: "no-store" });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function saveMemory(content: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/memory`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    return res.ok;
  } catch {
    return false;
  }
}


// -------------------------------------------------------------
// Sovereign Secrets Vault (Runtime Subprocess Injection)
// -------------------------------------------------------------
export async function fetchVaultSecrets(): Promise<VaultSecret[]> {
  try {
    const res = await fetch(`${API_BASE}/vault`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function createVaultSecret(name: string, value: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/vault`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, value }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function deleteVaultSecret(name: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/vault/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}

// -------------------------------------------------------------
// Operator Brains (Expert Personas & Perspectives)
// -------------------------------------------------------------
export async function fetchBrains(): Promise<BrainItem[]> {
  try {
    const res = await fetch(`${API_BASE}/brains`, { cache: "no-store" });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function createBrain(name: string, angle: string, method: string): Promise<BrainItem | null> {
  try {
    const res = await fetch(`${API_BASE}/brains`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, angle, method }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function deleteBrain(name: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/brains/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
    return res.ok;
  } catch {
    return false;
  }
}
