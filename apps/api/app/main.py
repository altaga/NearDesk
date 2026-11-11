from fastapi import FastAPI, HTTPException, Body, Request, Response, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json

from app.config import settings
from app.board.telemetry import telemetry_collector
from app.board.ws_manager import board_ws_manager
from app.board.pairing import pairing_manager
from app.near_ai.budget import budget_manager
from app.near_ai.client import near_ai_client
from app.near_chain.mpc import chain_signatures
from app.near_chain.onchain import near_onchain
from app.near_chain.keys import agent_keys
from app.near_chain.audit import audit_trail
from app.near_agent.identity import agent_identity
from app.near_agent.services import agent_economy
from app.near_agent.did import agent_did
from app.near_intents.swap import near_intents
from app.guardrails.approval import approval_manager
from app.chat.engine import chat_engine
from app.edge.files import list_files as fs_list, read_file as fs_read, write_file as fs_write
from app.browser.runtime import browser_runtime
from app.jobs.manager import jobs_manager
from app.memory.manager import memory_manager
from app.vault.routes import router as vault_router
from app.brains.routes import router as brains_router
from app.webrtc import webrtc_manager
from app.auth import near_auth_manager

app = FastAPI(
    title="NearDesk Sovereign Operator API",
    description="Edge AI & NEAR Protocol Agent Node (Chain Signatures, Intents, TEE Verifiable Cloud, Machine Desk Surface)",
    version="0.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(vault_router)
app.include_router(brains_router)

# -------------------------------------------------------------
# Data Models
# -------------------------------------------------------------
class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    history: Optional[List[Dict[str, Any]]] = None

class DeriveAddressRequest(BaseModel):
    chain: str
    derivation_path: str = "1"
    account_id: Optional[str] = None

class IntentQuoteRequest(BaseModel):
    asset_in: str
    asset_out: str
    amount_in: str
    slippage_bps: int = 50

class ResolveApprovalRequest(BaseModel):
    approved: bool
    resolved_by: str = "operator"

class TerminalCommandRequest(BaseModel):
    command: str

class ClaimBoardRequest(BaseModel):
    board_id: str
    ip_address: str = "192.168.55.1"
    near_account: Optional[str] = None

class SubmitPeerTaskRequest(BaseModel):
    client_agent: str
    service_type: str
    payment_near: float = 0.05
    params: Dict[str, Any] = {}

class ResolveDIDRequest(BaseModel):
    did_or_account: str

class WriteFileRequest(BaseModel):
    path: str
    content: str

class BrowserActionRequest(BaseModel):
    action: str
    url: Optional[str] = None
    selector: Optional[str] = None
    text: Optional[str] = None

class EnqueueJobRequest(BaseModel):
    name: str
    kind: str = "custom_task"
    details: str = ""

class SaveMemoryRequest(BaseModel):
    content: str

# -------------------------------------------------------------
# System & Telemetry Routes
# -------------------------------------------------------------
@app.get("/health")
@app.get("/v1/health")
async def health():
    return {
        "status": "healthy",
        "service": "NearDesk API",
        "version": "0.2.0",
        "llm_mode": settings.LLM_MODE,
        "near_network": settings.NEAR_NETWORK,
        "jetson_detected": telemetry_collector.is_jetson,
        "board_type": telemetry_collector.get_board_info().get("hardware_model"),
        "fencing": "FunctionCall Key Enforced"
    }

@app.get("/v1/telemetry")
async def get_telemetry():
    """Live CPU, GPU, RAM, temperature, power telemetry."""
    return telemetry_collector.get_metrics()

@app.get("/v1/board/info")
async def get_board_info():
    """Hardware platform, Jetson Tegra model, kernel architecture, uptime."""
    return telemetry_collector.get_board_info()

@app.get("/v1/board/health")
async def get_board_health():
    """Deep hardware health (multi-core CPU, swap, thermals, power mode)."""
    return telemetry_collector.get_board_health()

@app.get("/v1/board/processes")
async def get_board_processes(limit: int = 15):
    """List of active running processes on the edge station."""
    return telemetry_collector.get_processes(limit=limit)

@app.get("/v1/budget")
async def get_budget():
    """Real-time USD budget status against the strict $10.00 ceiling."""
    return budget_manager.get_status()

# -------------------------------------------------------------
# Machine: Filesystem Workspace Routes
# -------------------------------------------------------------
@app.get("/v1/edge/files")
async def list_files_endpoint(path: str = Query(default=".")):
    """List files and folders in the operator workspace."""
    return fs_list(path)

@app.get("/v1/edge/files/read")
async def read_file_endpoint(path: str = Query(...)):
    """Read file content under desk root."""
    res = fs_read(path)
    if not res.get("ok"):
        raise HTTPException(status_code=404, detail=res.get("error", "File not found"))
    return res

@app.post("/v1/edge/files/write")
async def write_file_endpoint(req: WriteFileRequest):
    """Write content to workspace file."""
    return fs_write(req.path, req.content)

# -------------------------------------------------------------
# Machine: Headless Browser Automation Routes
# -------------------------------------------------------------
@app.get("/v1/browser/status")
async def browser_status():
    """Get active headless Chromium state."""
    return browser_runtime.get_status()

@app.post("/v1/browser/action")
async def browser_action(req: BrowserActionRequest):
    """Execute navigation or interaction in headless Chromium on the board."""
    return await browser_runtime.execute_action(
        action=req.action,
        url=req.url,
        selector=req.selector,
        text=req.text
    )

@app.get("/v1/browser/preview")
async def browser_preview():
    """Get latest browser screenshot image."""
    img_bytes = browser_runtime.get_preview_image()
    if img_bytes:
        return Response(content=img_bytes, media_type="image/png")
    # Return 1x1 png if no screenshot available yet
    return Response(content=b"", media_type="image/png")

# -------------------------------------------------------------
# Machine: Background Jobs Supervisor Routes
# -------------------------------------------------------------
@app.get("/v1/jobs")
async def list_jobs():
    """List durable background jobs and system daemons on the board."""
    return {"jobs": jobs_manager.list_jobs()}

@app.post("/v1/jobs/enqueue")
async def enqueue_job(req: EnqueueJobRequest):
    """Enqueue a durable background agent or job."""
    return jobs_manager.enqueue_job(req.name, req.kind, req.details)

@app.post("/v1/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    """Stop a running edge daemon or task."""
    ok = jobs_manager.cancel_job(job_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"ok": True, "job_id": job_id, "status": "stopped"}

# -------------------------------------------------------------
# Library & Memory Routes
# -------------------------------------------------------------
@app.get("/v1/memory")
async def get_memory():
    """Retrieve persistent sovereign memory for the operator agent."""
    return memory_manager.get_memory()

@app.post("/v1/memory")
async def save_memory(req: SaveMemoryRequest):
    """Save persistent instructions and operator preferences."""
    return memory_manager.save_memory(req.content)

# -------------------------------------------------------------
# NEAR Protocol & Sovereign Agent Routes
# -------------------------------------------------------------
@app.get("/v1/near/attestation")
async def get_attestation():
    """Cryptographic TEE hardware attestation report from NEAR AI Cloud."""
    return await near_ai_client.get_tee_attestation()

@app.get("/v1/near/models")
async def list_models():
    """List open-weight TEE models on NEAR AI Cloud."""
    return await near_ai_client.get_models()

@app.post("/v1/near/derive")
async def derive_address(req: DeriveAddressRequest):
    """Derive Bitcoin, Ethereum, Solana, or Base address via NEAR Chain Signatures."""
    return chain_signatures.derive_address(
        chain=req.chain,
        derivation_path=req.derivation_path,
        custom_account_id=req.account_id
    )

@app.post("/v1/near/intents/quote")
async def intent_quote(req: IntentQuoteRequest):
    """Get swap quote from NEAR Intents 1Click solver network."""
    return await near_intents.get_quote(
        asset_in=req.asset_in,
        asset_out=req.asset_out,
        amount_in=req.amount_in,
        slippage_tolerance_bps=req.slippage_bps
    )

@app.get("/v1/near/account")
async def get_near_account():
    """Live on-chain account status (balance, implicit account, funding help)."""
    return await near_onchain.get_account_status()

@app.post("/v1/near/account/broadcast_test")
async def broadcast_test():
    """Broadcast an on-chain action or verify current testnet credentials."""
    return await near_onchain.broadcast_onchain_audit_action(
        action_title="Manual Operator On-Chain Ping",
        payload_hash="0xpingtest"
    )

@app.get("/v1/near/fencing")
async def get_fencing():
    """Status of Scoped FunctionCall Keys and wallet gas allowance guardrails."""
    return agent_keys.get_active_fencing_status()

@app.get("/v1/near/audit")
async def get_audit_trail():
    """Immutable on-chain verifiable audit log of all approved hardware & financial operations."""
    return audit_trail.get_entries()

@app.get("/v1/near/agent/profile")
async def get_agent_profile():
    """NEAR Agent Registry & DID identity profile."""
    return agent_identity.get_agent_profile()

@app.get("/v1/near/agent/did")
async def get_agent_did_document():
    """W3C-compliant DID Document (did:near:<account_id>) for this autonomous agent."""
    return agent_did.generate_did_document()

@app.get("/v1/near/agent/credential")
async def get_agent_verifiable_credential():
    """W3C-compliant Verifiable Credential signed with node's Ed25519 key."""
    return agent_did.generate_signed_verifiable_credential()

@app.post("/v1/near/agent/did/resolve")
async def resolve_did(req: ResolveDIDRequest):
    """Resolve any did:near:<account> on-chain using NEAR RPC access keys."""
    return await agent_did.resolve_did_onchain(req.did_or_account)

@app.get("/v1/near/agent/economy")
async def get_agent_economy():
    """Earnings, fulfilled tasks, and active services in the NEAR Agent Economy."""
    return agent_economy.get_economy_metrics()

@app.post("/v1/near/agent/task")
async def submit_peer_task(req: SubmitPeerTaskRequest):
    """Process a paid edge task submitted by a peer NEAR agent with micro-payment."""
    return agent_economy.submit_task(
        client_agent=req.client_agent,
        service_type=req.service_type,
        payment_near=req.payment_near,
        params=req.params
    )

# -------------------------------------------------------------
# Chat & Approval Gates
# -------------------------------------------------------------
@app.post("/v1/chat")
async def chat(req: ChatRequest):
    """Chat with Nova, the NearDesk Sovereign Operator."""
    return await chat_engine.process_message(
        messages=req.messages,
        history=req.history
    )

@app.get("/v1/approvals")
async def list_pending_approvals():
    """List pending actions waiting for operator approval."""
    return approval_manager.get_pending()

@app.post("/v1/approvals/{request_id}/resolve")
async def resolve_approval(request_id: str, req: ResolveApprovalRequest):
    """Approve or reject a high-risk operation (shell command, chain signature, transfer)."""
    resolved = approval_manager.resolve(
        request_id=request_id,
        approved=req.approved,
        resolved_by=req.resolved_by
    )
    if not resolved:
        raise HTTPException(status_code=404, detail="Approval request not found")
    return resolved

@app.post("/v1/board/terminal")
async def submit_terminal_command(req: TerminalCommandRequest):
    """Submit a command to the terminal. Triggers an Approval Gate before executing."""
    approval = approval_manager.create_request(
        action_type="shell_execution",
        title=f"Terminal: {req.command[:35]}",
        description=f"Direct terminal execution requested: `{req.command}`",
        payload={"command": req.command},
        risk_level="high"
    )
    return {
        "requires_approval": True,
        "approval_id": approval.id,
        "status": "pending_operator_approval",
        "command": req.command
    }

# -------------------------------------------------------------
# WebSocket Relay & Jetson Board Pairing Endpoints
# -------------------------------------------------------------
@app.websocket("/v1/agent/ws")
async def agent_websocket(websocket: WebSocket, board_id: str = "jetson-orin-station-01"):
    """Bidirectional WebSocket connection for remote Jetson edge nodes."""
    await board_ws_manager.register_board(board_id, websocket)
    try:
        while True:
            raw_data = await websocket.receive_text()
            try:
                data = json.loads(raw_data)
                msg_type = data.get("type")
                if msg_type == "telemetry_frame":
                    board_ws_manager.update_telemetry(board_id, data)
                elif msg_type == "command_result":
                    cmd_id = data.get("cmd_id")
                    output = data.get("output", {})
                    board_ws_manager.resolve_command(cmd_id, output)
            except Exception:
                pass
    except WebSocketDisconnect:
        board_ws_manager.unregister_board(board_id)

@app.get("/setup")
@app.get("/v1/pair/status")
async def get_pairing_status():
    """Current hardware pairing state of the station."""
    return pairing_manager.get_status()

@app.get("/v1/pair/discover")
async def discover_nodes():
    """Scan USB Gadget link (192.168.55.1) and LAN for connectable Jetson hardware."""
    return await pairing_manager.discover_nodes()

@app.post("/setup")
@app.post("/v1/pair/claim")
async def claim_board(req: ClaimBoardRequest):
    """Claim and provision a physical Jetson board with the operator's NEAR DID."""
    near_acc = req.near_account or settings.NEAR_ACCOUNT_ID or "01f72953344b853c9cf949217997e481bd04a1a33bea8e36060abf80e0118e7c"
    return pairing_manager.claim_board(
        board_id=req.board_id,
        ip_address=req.ip_address,
        near_account=near_acc
    )

@app.get("/v1/agent/remote_nodes")
async def list_remote_nodes():
    """List active live WebSocket connected Jetson boards."""
    return board_ws_manager.get_connected_boards()

class WebRTCOfferRequest(BaseModel):
    sdp: str
    type: str
    near_account: Optional[str] = None
    signature: Optional[str] = None

class AuthChallengeRequest(BaseModel):
    account_id: str

class AuthVerifyRequest(BaseModel):
    account_id: str
    public_key: str
    signature: str
    nonce: str
    network: Optional[str] = "testnet"

class SignChallengeRequest(BaseModel):
    account_id: str
    nonce: str

@app.post("/v1/auth/sign_challenge")
async def sign_challenge_endpoint(req: SignChallengeRequest):
    """Sign an active challenge with the bound node key for operator authentication."""
    from app.auth.near_auth import _ACTIVE_CHALLENGES
    challenge_data = _ACTIVE_CHALLENGES.get(req.nonce)
    if not challenge_data:
        raise HTTPException(status_code=400, detail="Invalid or expired challenge nonce")
    
    sig_b64, pub_key_str = near_onchain.sign_message_bytes(challenge_data["message"].encode("utf-8"))
    return {
        "signature": sig_b64,
        "public_key": pub_key_str,
        "account_id": req.account_id,
        "nonce": req.nonce
    }

@app.post("/v1/auth/challenge")
async def create_auth_challenge(req: AuthChallengeRequest):
    """Generate a cryptographic timestamped challenge for the operator's NEAR wallet."""
    return near_auth_manager.generate_challenge(req.account_id)

@app.post("/v1/auth/verify")
async def verify_auth_signature(req: AuthVerifyRequest):
    """Verify NEAR Ed25519 signature against on-chain public keys."""
    res = await near_auth_manager.verify_signature(
        account_id=req.account_id,
        public_key=req.public_key,
        signature=req.signature,
        nonce=req.nonce,
        network=req.network or "testnet"
    )
    if not res.get("verified"):
        raise HTTPException(
            status_code=401,
            detail=res.get("error", "Cryptographic verification failed")
        )
    return res

@app.get("/v1/webrtc/ice_servers")
async def get_ice_servers():
    """Public STUN servers for direct P2P NAT Traversal."""
    return {
        "ice_servers": [
            {"urls": "stun:stun.l.google.com:19302"},
            {"urls": "stun:stun1.l.google.com:19302"},
            {"urls": "stun:stun2.l.google.com:19302"},
        ]
    }

@app.post("/v1/webrtc/offer")
async def handle_webrtc_offer(req: WebRTCOfferRequest):
    """Establish direct P2P WebRTC DataChannel session bypassing cloud relays."""
    return await webrtc_manager.handle_offer(
        sdp=req.sdp,
        sdp_type=req.type,
        near_account=req.near_account
    )

