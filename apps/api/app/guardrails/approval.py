import uuid
import time
import logging
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

logger = logging.getLogger("neardesk.guardrails")

class ApprovalRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    action_type: str  # "shell_execution", "file_modification", "chain_signature", "intent_swap"
    title: str
    description: str
    payload: Dict[str, Any]
    risk_level: str = "medium"  # "low", "medium", "critical"
    created_at: float = Field(default_factory=time.time)
    status: str = "pending"  # "pending", "approved", "rejected"
    resolved_at: Optional[float] = None
    resolved_by: Optional[str] = None

class ApprovalManager:
    """Human-in-the-loop approval gate for high-risk operations on NearDesk."""
    
    def __init__(self):
        self._requests: Dict[str, ApprovalRequest] = {}

    def create_request(
        self,
        action_type: str,
        title: str,
        description: str,
        payload: Dict[str, Any],
        risk_level: str = "medium"
    ) -> ApprovalRequest:
        req = ApprovalRequest(
            action_type=action_type,
            title=title,
            description=description,
            payload=payload,
            risk_level=risk_level
        )
        self._requests[req.id] = req
        logger.warning(f"GUARDRAIL: New approval gate triggered [{req.id}] - {title} ({risk_level})")
        return req

    def get_pending(self) -> List[ApprovalRequest]:
        return [r for r in self._requests.values() if r.status == "pending"]

    def get_by_id(self, request_id: str) -> Optional[ApprovalRequest]:
        return self._requests.get(request_id)

    def resolve(self, request_id: str, approved: bool, resolved_by: str = "operator") -> Optional[ApprovalRequest]:
        req = self._requests.get(request_id)
        if not req:
            return None
        
        req.status = "approved" if approved else "rejected"
        req.resolved_at = time.time()
        req.resolved_by = resolved_by
        logger.info(f"GUARDRAIL: Request {request_id} was {req.status} by {resolved_by}")

        if approved:
            # If this was a shell command approval, execute it with runtime injected vault secrets
            if req.action_type == "shell_execution":
                cmd = req.payload.get("command", "")
                if cmd:
                    try:
                        import subprocess
                        import os
                        from app.vault.service import export_env_map, redact_secrets
                        env = os.environ.copy()
                        env.update(export_env_map())
                        res = subprocess.run(
                            cmd,
                            shell=True,
                            capture_output=True,
                            text=True,
                            timeout=30,
                            env=env
                        )
                        raw_out = (res.stdout or "") + (res.stderr or "")
                        redacted_out = redact_secrets(raw_out)[:4000]
                        req.payload["execution_result"] = {
                            "exit_code": res.returncode,
                            "output": redacted_out,
                            "executed_at": time.time()
                        }
                    except Exception as exc:
                        req.payload["execution_result"] = {
                            "exit_code": -1,
                            "output": f"Execution error: {exc}",
                            "executed_at": time.time()
                        }

            try:
                from app.near_chain.audit import audit_trail
                audit_trail.record_action(
                    action_id=req.id,
                    action_type=req.action_type,
                    title=req.title,
                    operator=resolved_by,
                    payload=req.payload
                )
            except Exception as e:
                logger.error(f"Failed to record audit trail entry: {e}")

        return req

approval_manager = ApprovalManager()
