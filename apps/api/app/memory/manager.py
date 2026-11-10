import os
from pathlib import Path
from typing import Dict, Any, List

MEMORY_FILE = Path(os.environ.get("DESK_ROOT", Path.cwd())) / ".desk" / "SOVEREIGN_MEMORY.md"

DEFAULT_MEMORY = """# NearDesk Sovereign Agent Memory

## System Invariants
- Jetson edge node execution runs with deterministic approval gates for destructive commands.
- Foreign blockchain transactions must be signed via NEAR Chain Signatures MPC (`v1.signer`).
- All cloud inference spend strictly capped at $10.00 USD.
- Operator actions must be hashed and committed to the on-chain audit trail.

## Known Hardware Topology
- Node: NVIDIA Jetson Orin Series / Edge Emulated Node
- Gadget Link: 192.168.55.1:8800
- Protocol: NEAR Mainnet (`rpc.mainnet.near.org`)
"""

class MemoryManager:
    def __init__(self):
        MEMORY_FILE.parent.mkdir(parents=True, exist_ok=True)
        if not MEMORY_FILE.exists():
            MEMORY_FILE.write_text(DEFAULT_MEMORY, encoding="utf-8")

    def get_memory(self) -> Dict[str, Any]:
        try:
            content = MEMORY_FILE.read_text(encoding="utf-8")
            return {"ok": True, "content": content, "path": str(MEMORY_FILE)}
        except Exception as e:
            return {"ok": False, "error": str(e), "content": DEFAULT_MEMORY}

    def save_memory(self, content: str) -> Dict[str, Any]:
        try:
            MEMORY_FILE.write_text(content, encoding="utf-8")
            return {"ok": True, "size": len(content)}
        except Exception as e:
            return {"ok": False, "error": str(e)}

memory_manager = MemoryManager()
