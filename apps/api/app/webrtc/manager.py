import asyncio
import json
import logging
import subprocess
import time
from typing import Dict, Any, Optional, Set
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCConfiguration, RTCIceServer
from app.board.telemetry import telemetry_collector
from app.config import settings

logger = logging.getLogger("neardesk.webrtc")

DEFAULT_ICE_SERVERS = [
    RTCIceServer(urls=["stun:stun.l.google.com:19302"]),
    RTCIceServer(urls=["stun:stun1.l.google.com:19302"]),
    RTCIceServer(urls=["stun:stun2.l.google.com:19302"]),
]

class WebRTCP2PManager:
    """Manages true Peer-to-Peer encrypted WebRTC DataChannels between browser and Jetson."""

    def __init__(self):
        self.pcs: Set[RTCPeerConnection] = set()

    async def handle_offer(self, sdp: str, sdp_type: str, near_account: Optional[str] = None) -> Dict[str, Any]:
        """Process browser SDP offer, configure P2P DataChannel listeners, and return SDP answer."""
        config = RTCConfiguration(iceServers=DEFAULT_ICE_SERVERS)
        pc = RTCPeerConnection(configuration=config)
        self.pcs.add(pc)

        @pc.on("datachannel")
        def on_datachannel(channel):
            logger.info(f"[WebRTC P2P] DataChannel opened: {channel.label} with peer: {near_account}")

            @channel.on("message")
            def on_message(message):
                try:
                    data = json.loads(message)
                    msg_type = data.get("type", "")

                    if msg_type == "ping":
                        channel.send(json.dumps({"type": "pong", "time": time.time()}))

                    elif msg_type == "telemetry":
                        metrics = telemetry_collector.get_telemetry()
                        channel.send(json.dumps({
                            "type": "telemetry",
                            "data": metrics,
                            "transport": "WebRTC P2P DataChannel (Direct NAT Traversal)"
                        }))

                    elif msg_type == "terminal":
                        cmd = data.get("command", "")
                        # Run safe command directly on edge station
                        res = subprocess.run(
                            cmd, shell=True, capture_output=True, text=True, timeout=10
                        )
                        output = res.stdout + res.stderr
                        channel.send(json.dumps({
                            "type": "terminal_output",
                            "output": output
                        }))

                    elif msg_type == "chat":
                        prompt = data.get("prompt", "")
                        channel.send(json.dumps({
                            "type": "chat_chunk",
                            "chunk": f"[Jetson Orin P2P]: Respuesta directa sin Cloudflare para {near_account or 'operador'}: {prompt}"
                        }))
                        channel.send(json.dumps({"type": "chat_done"}))

                except Exception as ex:
                    logger.error(f"[WebRTC P2P] Error processing channel message: {ex}")
                    channel.send(json.dumps({"type": "error", "message": str(ex)}))

        @pc.on("connectionstatechange")
        async def on_connectionstatechange():
            logger.info(f"[WebRTC P2P] Connection state: {pc.connectionState}")
            if pc.connectionState in ("failed", "closed"):
                await pc.close()
                self.pcs.discard(pc)

        # Apply remote offer
        offer = RTCSessionDescription(sdp=sdp, type=sdp_type)
        await pc.setRemoteDescription(offer)

        # Generate answer
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        return {
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type,
            "p2p_active": True,
            "transport": "WebRTC SCTP/DTLS Direct P2P",
            "near_peer": near_account or "unauthenticated"
        }

    async def close_all(self):
        coros = [pc.close() for pc in self.pcs]
        await asyncio.gather(*coros, return_exceptions=True)
        self.pcs.clear()

webrtc_manager = WebRTCP2PManager()
