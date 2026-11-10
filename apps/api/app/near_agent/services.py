import time
import uuid
import hashlib
from typing import Dict, Any, List
from pydantic import BaseModel, Field

class PaidTaskReceipt(BaseModel):
    task_id: str = Field(default_factory=lambda: f"task-{uuid.uuid4().hex[:8]}")
    client_agent: str
    service_type: str
    payment_near: float
    payment_tx_hash: str
    output_result: Dict[str, Any]
    timestamp: float = Field(default_factory=time.time)
    status: str = "completed"

class AgentEconomyService:
    """
    Agent Economy & Paid Edge Services engine for NearDesk.
    Allows peer NEAR agents to purchase edge compute, TEE attestation verification,
    or MPC address derivation using NEAR micropayments.
    """

    def __init__(self):
        self._total_earned_near: float = 0.45
        self._tasks: List[PaidTaskReceipt] = []
        self._init_sample_economy()

    def _init_sample_economy(self):
        # Initial sample peer tasks from the NEAR Agent Economy
        self.submit_task(
            client_agent="solana-arb-bot.near",
            service_type="mpc_address_derivation",
            payment_near=0.15,
            params={"chain": "solana", "path": "trade-pool-01"}
        )
        self.submit_task(
            client_agent="yield-optimizer.testnet",
            service_type="intent_solver_quote",
            payment_near=0.10,
            params={"pair": "NEAR-USDC", "amount": "500"}
        )
        self.submit_task(
            client_agent="audit-swarm.near",
            service_type="tee_attestation_proof",
            payment_near=0.20,
            params={"enclave": "intel-tdx"}
        )

    def get_economy_metrics(self) -> Dict[str, Any]:
        return {
            "total_earned_near": round(self._total_earned_near, 3),
            "total_tasks_fulfilled": len(self._tasks),
            "active_services": [
                {"name": "MPC Multi-Chain Derivation", "fee_near": 0.05},
                {"name": "NEAR Intent Cross-Chain Route", "fee_near": 0.05},
                {"name": "Private Edge File Verification", "fee_near": 0.10},
                {"name": "Hardware TEE Attestation Proof", "fee_near": 0.15}
            ],
            "recent_tasks": self._tasks[:10]
        }

    def submit_task(
        self,
        client_agent: str,
        service_type: str,
        payment_near: float,
        params: Dict[str, Any]
    ) -> PaidTaskReceipt:
        payment_tx = f"8Tx{hashlib.sha256(f'{client_agent}:{time.time()}'.encode()).hexdigest()[:40]}"

        # Execute simulated edge service
        output = {
            "service": service_type,
            "executed_on": "NVIDIA Jetson Edge Node",
            "proof": f"0x{hashlib.sha256(str(params).encode()).hexdigest()}",
            "response": f"Successfully executed {service_type} for {client_agent}"
        }

        receipt = PaidTaskReceipt(
            client_agent=client_agent,
            service_type=service_type,
            payment_near=payment_near,
            payment_tx_hash=payment_tx,
            output_result=output,
            timestamp=time.time(),
            status="completed"
        )

        self._tasks.insert(0, receipt)
        self._total_earned_near = round(self._total_earned_near + payment_near, 4)
        return receipt

agent_economy = AgentEconomyService()
