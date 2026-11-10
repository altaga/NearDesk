import time
from typing import Dict, Any, List
from app.config import settings

class AgentIdentityManager:
    """Manages NEAR Agent Registry profile, decentralized DID, and on-chain capability declarations."""

    def __init__(self):
        self.account_id = settings.NEAR_ACCOUNT_ID or "neardesk-operator.testnet"
        self.agent_name = "Nova"
        self.version = "0.1.0"

    def get_agent_profile(self) -> Dict[str, Any]:
        return {
            "did": f"did:near:{self.account_id}",
            "name": f"{self.agent_name} — NearDesk Sovereign Edge Station",
            "version": self.version,
            "owner": self.account_id,
            "hardware_node": "NVIDIA Jetson Orin Edge Platform",
            "registry_status": "registered_active",
            "near_ai_hub_url": f"https://app.near.ai/agents/{self.account_id}",
            "capabilities": [
                {
                    "name": "NEAR Chain Signatures (MPC)",
                    "chains": ["Bitcoin", "Ethereum", "Solana", "Base", "Arbitrum"],
                    "contract": settings.NEAR_MPC_CONTRACT_ID,
                    "description": "Multi-chain key derivation and native transaction signing without cross-chain bridges"
                },
                {
                    "name": "NEAR Intents (1Click Swaps)",
                    "solver_network": "ChainDefuser",
                    "description": "Cross-chain liquidity routing and execution via autonomous intent solvers"
                },
                {
                    "name": "Private Edge Inference",
                    "runtime": "Edge Native / Ollama",
                    "description": "Zero-leakage local processing for sensitive files and terminal execution"
                },
                {
                    "name": "Hardware-Verified TEE Ingestion",
                    "enclave": "Intel TDX / NVIDIA Confidential Computing",
                    "attestation_endpoint": f"{settings.NEARAI_BASE_URL}/attestation/report"
                }
            ],
            "security_specs": {
                "fencing": "Scoped FunctionCall Access Keys",
                "approval_gates": "Human-in-the-Loop required for shell & value transfers",
                "max_cloud_budget_usd": settings.NEAR_MAX_BUDGET_USD
            },
            "last_active": time.time()
        }

agent_identity = AgentIdentityManager()
