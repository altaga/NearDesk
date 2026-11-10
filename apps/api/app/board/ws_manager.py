import asyncio
import json
import logging
import time
from typing import Dict, Any, List, Optional
from fastapi import WebSocket

logger = logging.getLogger("neardesk.ws_manager")

class RemoteBoardManager:
    """
    Manages live bidirectional WebSocket connections with remote Jetson boards
    and edge node agents. Dispatches remote shell execution, telemetry, and jobs.
    """

    def __init__(self):
        self._active_connections: Dict[str, WebSocket] = {}
        self._board_telemetry: Dict[str, Any] = {}
        self._command_waiters: Dict[str, asyncio.Future] = {}

    async def register_board(self, board_id: str, websocket: WebSocket):
        await websocket.accept()
        self._active_connections[board_id] = websocket
        logger.info(f"EDGE WS: Remote board connected [{board_id}]")

    def unregister_board(self, board_id: str):
        if board_id in self._active_connections:
            del self._active_connections[board_id]
            logger.warning(f"EDGE WS: Remote board disconnected [{board_id}]")

    def get_connected_boards(self) -> List[Dict[str, Any]]:
        result = []
        for board_id, ws in self._active_connections.items():
            telemetry = self._board_telemetry.get(board_id, {})
            result.append({
                "board_id": board_id,
                "connected": True,
                "hardware": telemetry.get("hardware", "NVIDIA Jetson Edge Node"),
                "cpu_percent": telemetry.get("cpu_percent", 0.0),
                "ram_used_mb": telemetry.get("ram_used_mb", 0.0),
                "last_heartbeat": telemetry.get("timestamp", time.time())
            })
        return result

    def update_telemetry(self, board_id: str, data: Dict[str, Any]):
        self._board_telemetry[board_id] = data

    async def dispatch_command(self, board_id: str, command: str, timeout: float = 30.0) -> Dict[str, Any]:
        """Send a shell command to a remote Jetson board and wait for execution output."""
        ws = self._active_connections.get(board_id)
        if not ws:
            return {
                "ok": False,
                "error": f"Board '{board_id}' is not connected via WebSocket."
            }

        cmd_id = f"cmd-{int(time.time() * 1000)}"
        loop = asyncio.get_event_loop()
        future = loop.create_future()
        self._command_waiters[cmd_id] = future

        message = {
            "type": "execute_command",
            "cmd_id": cmd_id,
            "command": command
        }

        try:
            await ws.send_text(json.dumps(message))
            result = await asyncio.wait_for(future, timeout=timeout)
            return {"ok": True, "output": result}
        except asyncio.TimeoutError:
            return {"ok": False, "error": f"Execution timed out after {timeout}s on board {board_id}"}
        except Exception as e:
            return {"ok": False, "error": str(e)}
        finally:
            self._command_waiters.pop(cmd_id, None)

    def resolve_command(self, cmd_id: str, result: Dict[str, Any]):
        future = self._command_waiters.get(cmd_id)
        if future and not future.done():
            future.set_result(result)

board_ws_manager = RemoteBoardManager()
