import asyncio
import logging
import os
import psutil
import time
from typing import Dict, Any
import httpx

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("neardesk.board_agent")

API_URL = os.getenv("NEARDESK_API_URL", "http://127.0.0.1:8000")
BOARD_ID = os.getenv("NEARDESK_BOARD_ID", "jetson-orin-01")
HEARTBEAT_INTERVAL = int(os.getenv("HEARTBEAT_INTERVAL", "5"))

class NearDeskBoardAgent:
    """Outbound Edge Agent running on the Jetson board."""

    def __init__(self):
        self.api_url = API_URL.rstrip("/")
        self.board_id = BOARD_ID
        self.running = True

    def get_hardware_telemetry(self) -> Dict[str, Any]:
        mem = psutil.virtual_memory()
        cpu = psutil.cpu_percent()
        is_jetson = os.path.exists("/etc/nv_tegra_release")

        return {
            "board_id": self.board_id,
            "timestamp": time.time(),
            "hardware": "NVIDIA Jetson" if is_jetson else "Edge Dev Host",
            "cpu_percent": cpu,
            "ram_used_mb": round(mem.used / (1024 * 1024), 1),
            "ram_total_mb": round(mem.total / (1024 * 1024), 1),
            "status": "active"
        }

    async def heartbeat_loop(self):
        logger.info(f"Starting NearDesk Board Agent for node: {self.board_id}")
        logger.info(f"Connecting to NearDesk API at: {self.api_url}")

        async with httpx.AsyncClient(timeout=10.0) as client:
            while self.running:
                telemetry = self.get_hardware_telemetry()
                try:
                    res = await client.get(f"{self.api_url}/v1/health")
                    if res.status_code == 200:
                        logger.debug(f"Heartbeat OK: CPU {telemetry['cpu_percent']}%, RAM {telemetry['ram_used_mb']}MB")
                    else:
                        logger.warning(f"NearDesk API returned {res.status_code}")
                except Exception as e:
                    logger.debug(f"Waiting for NearDesk API to be reachable... ({e})")

                await asyncio.sleep(HEARTBEAT_INTERVAL)

def main():
    agent = NearDeskBoardAgent()
    try:
        asyncio.run(agent.heartbeat_loop())
    except KeyboardInterrupt:
        logger.info("Board Agent stopped by operator.")

if __name__ == "__main__":
    main()
