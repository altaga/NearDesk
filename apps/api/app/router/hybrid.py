import logging
from typing import Dict, Any, Tuple
from app.config import settings
from app.near_ai.budget import budget_manager

logger = logging.getLogger("neardesk.router")

# Keywords that can be fulfilled immediately by local tools or deterministic handlers
LOCAL_INTENTS = [
    "metrics", "cpu", "gpu", "ram", "memory", "temperature", "temp", "status",
    "budget", "spent", "balance", "cost", "tokens",
    "derive", "address", "mpc", "solana address", "ethereum address", "bitcoin address",
    "quote", "swap rate", "attestation", "tee"
]

class HybridRouter:
    """Intelligently routes requests between local edge handling and NEAR AI Cloud to minimize spend."""
    
    def route_prompt(self, message: str) -> Tuple[str, str]:
        """
        Returns (route_tier, reason).
        Tiers: 'local_fast' | 'near_cloud'
        """
        lower = message.lower()

        # 1. Check strict budget limit
        budget_status = budget_manager.get_status()
        if budget_status["hard_limit_reached"]:
            return "local_fast", "budget_ceiling_reached_halt_cloud"

        # 2. Check LLM_MODE configuration
        if settings.LLM_MODE == "local_only":
            return "local_fast", "forced_local_only_mode"
        if settings.LLM_MODE == "near_cloud":
            return "near_cloud", "forced_near_cloud_mode"

        # 3. Explicit Expert Persona requested (@SecurityAuditor, etc.) -> Cloud Reasoning
        if "@" in message:
            return "near_cloud", "expert_persona_reasoning"

        # 4. Quick deterministic heuristic: if query is directly actionable locally, save tokens!
        for kw in LOCAL_INTENTS:
            if kw in lower:
                return "local_fast", f"matched_deterministic_intent_{kw}"

        # 5. Complex reasoning, coding, or open queries -> NEAR AI Cloud
        return "near_cloud", "complex_reasoning_routed_to_near_ai"

hybrid_router = HybridRouter()
