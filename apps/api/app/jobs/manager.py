import time
import uuid
from typing import Dict, Any, List, Optional

class JobsManager:
    """Supervises durable background tasks and edge daemons on the Jetson station."""

    def __init__(self):
        self.jobs: Dict[str, Dict[str, Any]] = {
            "daemon-tegrastats": {
                "id": "daemon-tegrastats",
                "name": "Hardware Tegrastats Poller",
                "kind": "system_daemon",
                "status": "running",
                "cpu_usage": 0.4,
                "created_at": time.time() - 3600,
                "started_at": time.time() - 3600,
                "details": "Streams thermals, NV power mode, and RAM load to WebSocket relay"
            },
            "daemon-near-intents": {
                "id": "daemon-near-intents",
                "name": "NEAR Intent Solver Watcher",
                "kind": "solver_daemon",
                "status": "running",
                "cpu_usage": 0.8,
                "created_at": time.time() - 2400,
                "started_at": time.time() - 2400,
                "details": "Listens for 1Click cross-chain settlement intents on ChainDefuser"
            },
            "daemon-mpc-key-vault": {
                "id": "daemon-mpc-key-vault",
                "name": "NEAR MPC Key Derivation Cache",
                "kind": "cryptographic_worker",
                "status": "idle",
                "cpu_usage": 0.1,
                "created_at": time.time() - 1200,
                "started_at": time.time() - 1200,
                "details": "Pre-computes deterministic foreign address curves for BTC, ETH, and SOL"
            }
        }

    def list_jobs(self) -> List[Dict[str, Any]]:
        return list(self.jobs.values())

    def enqueue_job(self, name: str, kind: str, details: str = "") -> Dict[str, Any]:
        job_id = f"job-{uuid.uuid4().hex[:8]}"
        job = {
            "id": job_id,
            "name": name,
            "kind": kind,
            "status": "running",
            "cpu_usage": 1.2,
            "created_at": time.time(),
            "started_at": time.time(),
            "details": details or f"Executing edge task: {name}"
        }
        self.jobs[job_id] = job
        return job

    def cancel_job(self, job_id: str) -> bool:
        if job_id in self.jobs:
            self.jobs[job_id]["status"] = "stopped"
            return True
        return False

jobs_manager = JobsManager()
