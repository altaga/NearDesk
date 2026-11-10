import json
import logging
import time
from pathlib import Path
from typing import Dict, Any, List, Optional
import httpx
from app.config import settings

logger = logging.getLogger("neardesk.pairing")

PAIRING_FILE = settings.DATA_DIR / "pairing_state.json"

KNOWN_TARGETS = [
    {"type": "usb_gadget", "url": "http://192.168.55.1:8800", "label": "Jetson USB Gadget Link"},
    {"type": "docker_emu", "url": "http://127.0.0.1:18101", "label": "Docker Board Emulator 01"},
    {"type": "docker_emu_2", "url": "http://127.0.0.1:18102", "label": "Docker Board Emulator 02"},
    {"type": "local_node", "url": "http://127.0.0.1:8000", "label": "Local Edge Station (Dev Host)"}
]

class BoardPairingManager:
    """Manages discovery, USB/LAN pairing, and initial onboarding of Jetson hardware to NEAR."""

    def __init__(self):
        self._ensure_pairing_file()

    def _ensure_pairing_file(self):
        if not PAIRING_FILE.exists():
            initial_state = {
                "paired": True, # Default paired to local host for out-of-the-box dev experience
                "board_id": "jetson-orin-station-01",
                "hardware_type": "NVIDIA Jetson Orin (8GB Unified LPDDR5)",
                "ip_address": "127.0.0.1",
                "connection_type": "Local / Direct Edge Loopback",
                "near_owner": settings.NEAR_ACCOUNT_ID or "01f72953344b853c9cf949217997e481bd04a1a33bea8e36060abf80e0118e7c",
                "paired_at": time.time(),
                "status": "ready"
            }
            PAIRING_FILE.write_text(json.dumps(initial_state, indent=2), encoding="utf-8")

    def get_status(self) -> Dict[str, Any]:
        try:
            return json.loads(PAIRING_FILE.read_text(encoding="utf-8"))
        except Exception:
            self._ensure_pairing_file()
            return json.loads(PAIRING_FILE.read_text(encoding="utf-8"))

    async def discover_nodes(self) -> List[Dict[str, Any]]:
        """Scan standard Jetson USB-C and emulator endpoints."""
        discovered = []

        async with httpx.AsyncClient(timeout=1.5) as client:
            for target in KNOWN_TARGETS:
                url = target["url"]
                try:
                    res = await client.get(f"{url}/v1/health")
                    if res.status_code == 200:
                        data = res.json()
                        discovered.append({
                            "label": target["label"],
                            "url": url,
                            "type": target["type"],
                            "reachable": True,
                            "detected_hardware": data.get("board_type", "NVIDIA Jetson Platform"),
                            "status": "online"
                        })
                    else:
                        discovered.append({
                            "label": target["label"],
                            "url": url,
                            "type": target["type"],
                            "reachable": False,
                            "status": f"HTTP {res.status_code}"
                        })
                except Exception:
                    discovered.append({
                        "label": target["label"],
                        "url": url,
                        "type": target["type"],
                        "reachable": False,
                        "status": "unreachable_offline"
                    })

        return discovered

    def claim_board(self, board_id: str, ip_address: str, near_account: str) -> Dict[str, Any]:
        """Complete pairing ceremony binding a physical Jetson to the NEAR account."""
        new_state = {
            "paired": True,
            "board_id": board_id,
            "hardware_type": "NVIDIA Jetson Edge Node",
            "ip_address": ip_address,
            "connection_type": "USB-C Gadget Link (192.168.55.1)" if "192.168.55.1" in ip_address else "LAN / Direct Link",
            "near_owner": near_account,
            "paired_at": time.time(),
            "status": "ready"
        }
        PAIRING_FILE.write_text(json.dumps(new_state, indent=2), encoding="utf-8")
        logger.info(f"BOARD PAIRED: {board_id} claimed by NEAR account {near_account}")
        return new_state

pairing_manager = BoardPairingManager()
