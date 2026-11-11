"""
NearDesk Board Emulator Server
Emulates an NVIDIA Jetson Orin Nano edge board running NearDesk sovereign firmware.
Listens on port 8800 (mapped to 127.0.0.1:18101, 18102, etc. on the host).
Provides real-time telemetry, NEAR cryptographic challenge/verification,
and persists pairing state across container restarts.
"""

from __future__ import annotations

import json
import logging
import os
import secrets
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("neardesk.board_emu")

BOARD_ID = os.getenv("NEARDESK_BOARD_ID", "jetson-nano-emu-01")
HOST_PORT = os.getenv("HOST_PORT", "18101")
NEAR_NETWORK = os.getenv("NEAR_NETWORK", "testnet")
STATE_DIR = Path(os.getenv("STATE_DIR", "/home/jetson/.config/neardesk"))
PAIRING_FILE = STATE_DIR / "pairing_state.json"
START_TIME = time.time()

STATE_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title=f"NearDesk Board Emulator ({BOARD_ID})", version="1.0.0")

# Enable wide-open CORS so local desk (localhost:3000) and cloud desk (neardesk.vercel.app)
# can probe and pair directly from the operator's browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active nonces for challenge verification
_CHALLENGES: Dict[str, Dict[str, Any]] = {}


def load_pairing_state() -> Dict[str, Any]:
    if PAIRING_FILE.exists():
        try:
            return json.loads(PAIRING_FILE.read_text(encoding="utf-8"))
        except Exception as e:
            logger.warning(f"Failed to read pairing state: {e}")
    
    # Default: Unpaired board ready for onboarding
    return {
        "paired": False,
        "board_id": BOARD_ID,
        "hardware_type": "NVIDIA Jetson Nano Developer Kit (4GB Emulated)",
        "ip_address": f"http://127.0.0.1:{HOST_PORT}",
        "connection_type": "Docker Loopback Bridge",
        "near_owner": None,
        "authorized_operators": [],
        "paired_at": None,
        "status": "unpaired_ready",
        "is_emulator": True,
    }


def save_pairing_state(state: Dict[str, Any]) -> None:
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    PAIRING_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")
    logger.info(f"Saved pairing state for {BOARD_ID}: paired={state.get('paired')}")


# --- Models ---

class ClaimRequest(BaseModel):
    board_id: Optional[str] = None
    near_account: Optional[str] = None
    ip_address: Optional[str] = None
    public_key: Optional[str] = None
    signature: Optional[str] = None


class ChallengeRequest(BaseModel):
    account_id: str


class VerifyRequest(BaseModel):
    account_id: str
    public_key: str
    signature: str
    nonce: str
    network: Optional[str] = "testnet"


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    model: Optional[str] = "local-emu"


# --- Endpoints ---

@app.get("/health")
@app.get("/v1/health")
async def health():
    """Health check for hardware discovery."""
    state = load_pairing_state()
    return {
        "status": "healthy",
        "board_type": "NVIDIA Jetson Nano Developer Kit (4GB Emulated)",
        "board_id": BOARD_ID,
        "is_emulator": True,
        "paired": state.get("paired", False),
        "uptime_seconds": round(time.time() - START_TIME, 1),
        "near_network": NEAR_NETWORK,
        "near_owner": state.get("near_owner"),
    }


@app.get("/setup")
@app.get("/v1/pair/status")
@app.get("/pair/status")
async def pair_status():
    """Current pairing and onboarding status."""
    return load_pairing_state()


@app.post("/setup")
@app.post("/v1/pair/claim")
@app.post("/pair/claim")
async def pair_claim(req: ClaimRequest):
    """Claim and provision the emulated Jetson with the operator's NEAR address."""
    state = load_pairing_state()
    owner = req.near_account or "a69d770c221f3f4b9ed0dc913a201940a355deeceb112a55b340a5cf30ee1ed6"
    b_id = req.board_id or BOARD_ID

    state["paired"] = True
    state["board_id"] = b_id
    state["near_owner"] = owner
    state["authorized_operators"] = [owner]
    state["ip_address"] = req.ip_address or f"http://127.0.0.1:{HOST_PORT}"
    state["paired_at"] = time.time()
    state["status"] = "ready"
    state["public_key"] = req.public_key or "ed25519:emulator_paired"

    save_pairing_state(state)
    logger.info(f"EMU BOARD PAIRED: {b_id} claimed by NEAR account {owner}")
    return state


@app.post("/v1/pair/reset")
@app.post("/pair/reset")
async def pair_reset():
    """Reset pairing state for testing onboarding flows."""
    state = {
        "paired": False,
        "board_id": BOARD_ID,
        "hardware_type": "NVIDIA Jetson Nano Developer Kit (4GB Emulated)",
        "ip_address": f"http://127.0.0.1:{HOST_PORT}",
        "connection_type": "Docker Loopback Bridge",
        "near_owner": None,
        "authorized_operators": [],
        "paired_at": None,
        "status": "unpaired_ready",
        "is_emulator": True,
    }
    save_pairing_state(state)
    logger.info(f"EMU BOARD RESET: {BOARD_ID} unpaired")
    return state


@app.get("/v1/board/info")
@app.get("/board/info")
async def board_info():
    """Jetson Orin platform specification and hardware capabilities."""
    state = load_pairing_state()
    return {
        "board_id": BOARD_ID,
        "model": "NVIDIA Jetson Nano Developer Kit (4GB Emulated)",
        "soc": "Tegra210",
        "cuda_cores": 128,
        "tensor_cores": 0,
        "memory_gb": 4,
        "jetpack_version": "4.6.1",
        "l4t_version": "32.7.1",
        "is_emulator": True,
        "paired": state.get("paired", False),
        "near_owner": state.get("near_owner"),
        "features": ["nv_tegra_release", "tegrastats", "near_ed25519_auth", "nep413_handshake"],
    }


@app.get("/v1/telemetry")
@app.get("/telemetry")
async def telemetry():
    """Live emulated tegrastats telemetry frame."""
    now = time.time()
    # Subtle oscillation to make metrics feel realistic
    cycle = (now % 60) / 60.0
    cpu = round(16.0 + 8.0 * cycle, 1)
    gpu_load = round(22.0 + 14.0 * cycle, 1)
    temp = round(44.0 + 3.0 * cycle, 1)
    power = round(9.0 + 2.5 * cycle, 1)

    return {
        "type": "telemetry_frame",
        "board_id": BOARD_ID,
        "timestamp": now,
        "hardware": "NVIDIA Jetson Nano (Emulated 4GB)",
        "cpu_percent": cpu,
        "ram_used_mb": 1540,
        "ram_total_mb": 4096,
        "gpu": {
            "device": "NVIDIA Tegra Maxwell GPU (128 CUDA)",
            "load_percent": gpu_load,
            "temperature_c": temp,
            "power_watts": power,
        },
        "status": "online",
        "is_emulator": True,
    }


@app.post("/v1/auth/challenge")
@app.post("/auth/challenge")
async def auth_challenge(req: ChallengeRequest):
    """Issue cryptographic challenge nonce for NEAR wallet signature."""
    nonce = secrets.token_hex(16)
    msg = f"NearDesk Sovereign Auth Handshake | Board: {BOARD_ID} | Nonce: {nonce} | Account: {req.account_id}"
    _CHALLENGES[nonce] = {
        "account_id": req.account_id,
        "nonce": nonce,
        "message": msg,
        "created_at": time.time(),
    }
    return {
        "nonce": nonce,
        "challenge": msg,
        "board_id": BOARD_ID,
        "network": NEAR_NETWORK,
    }


@app.post("/v1/auth/verify")
@app.post("/auth/verify")
async def auth_verify(req: VerifyRequest):
    """Verify cryptographic signature and return operator desk token."""
    state = load_pairing_state()
    owner = state.get("near_owner")
    
    is_owner = (owner is not None and req.account_id.lower() == owner.lower()) or not state.get("paired")

    token = f"emu_{BOARD_ID}_{secrets.token_hex(16)}"
    return {
        "status": "authorized",
        "account_id": req.account_id,
        "public_key": req.public_key,
        "role": "operator_owner" if is_owner else "guest_fenced",
        "fencing_mode": "on_chain_ed25519",
        "token": token,
        "signature_verified_at": time.time(),
        "is_emulator": True,
    }


@app.post("/v1/chat/completions")
async def chat_completions(req: ChatRequest):
    """Emulated local edge inference completion."""
    last_msg = req.messages[-1].content if req.messages else ""
    return {
        "id": f"chatcmpl-emu-{secrets.token_hex(8)}",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": "qwen3.5:4b-emulator",
        "choices": [
            {
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": f"[NearDesk Nano Emulator {BOARD_ID}]: Edge station active. Telemetry nominal. Query received: \"{last_msg[:60]}\"",
                },
                "finish_reason": "stop",
            }
        ],
    }


if __name__ == "__main__":
    port = int(os.getenv("EMU_PORT", "8800"))
    logger.info(f"Starting NearDesk Board Emulator on 0.0.0.0:{port} (ID: {BOARD_ID})")
    uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
