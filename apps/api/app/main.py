from fastapi import FastAPI, HTTPException, Body, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional

from app.config import settings
from app.board.telemetry import telemetry_collector
from app.near_ai.budget import budget_manager
from app.near_ai.client import near_ai_client
from app.near_chain.mpc import chain_signatures
from app.near_intents.swap import near_intents
from app.guardrails.approval import approval_manager
from app.chat.engine import chat_engine

app = FastAPI(
    title="NearDesk Sovereign Operator API",
    description="Edge AI & NEAR Protocol Agent Node (Chain Signatures, Intents, TEE Verifiable Cloud)",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

# -------------------------------------------------------------
# Routes
# -------------------------------------------------------------
@app.get("/v1/health")
async def health():
    return {
        "status": "healthy",
        "service": "NearDesk API",
        "llm_mode": settings.LLM_MODE,
        "near_network": settings.NEAR_NETWORK,
        "jetson_detected": telemetry_collector.is_jetson
    }

@app.get("/v1/telemetry")
async def get_telemetry():
    """Live CPU, GPU, RAM, temperature, power telemetry."""
    return telemetry_collector.get_metrics()

@app.get("/v1/budget")
async def get_budget():
    """Real-time USD budget status against the strict $10.00 ceiling."""
    return budget_manager.get_status()

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
