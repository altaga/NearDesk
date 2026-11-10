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
        return req

approval_manager = ApprovalManager()
