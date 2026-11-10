"use client";

export type P2PConnectionState = "disconnected" | "connecting" | "connected" | "failed";

export interface P2PMessage {
  type: string;
  data?: any;
  output?: string;
  chunk?: string;
  error?: string;
  time?: number;
  transport?: string;
}

class WebRTCP2PClient {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private state: P2PConnectionState = "disconnected";
  private listeners: Set<(msg: P2PMessage) => void> = new Set();
  private stateListeners: Set<(state: P2PConnectionState) => void> = new Set();

  getState(): P2PConnectionState {
    return this.state;
  }

  onStateChange(cb: (state: P2PConnectionState) => void): () => void {
    this.stateListeners.add(cb);
    cb(this.state);
    return () => this.stateListeners.delete(cb);
  }

  onMessage(cb: (msg: P2PMessage) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private setState(newState: P2PConnectionState) {
    this.state = newState;
    this.stateListeners.forEach((cb) => cb(newState));
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("neardesk_p2p_state", { detail: { state: newState } })
      );
    }
  }

  async connect(nearAccount?: string): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (this.state === "connected" || this.state === "connecting") return true;

    this.setState("connecting");

    try {
      // 1. Fetch public STUN servers for NAT Traversal
      const iceServers = [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
        { urls: "stun:stun2.l.google.com:19302" },
      ];

      this.pc = new RTCPeerConnection({ iceServers });

      // 2. Create the P2P DataChannel
      this.dc = this.pc.createDataChannel("neardesk-p2p", {
        ordered: true,
      });

      this.dc.onopen = () => {
        console.log("[WebRTC P2P] DataChannel OPEN directly to Jetson Orin!");
        this.setState("connected");
        this.send({ type: "ping" });
      };

      this.dc.onclose = () => {
        console.log("[WebRTC P2P] DataChannel CLOSED");
        this.setState("disconnected");
      };

      this.dc.onerror = (err) => {
        console.error("[WebRTC P2P] DataChannel error:", err);
        this.setState("failed");
      };

      this.dc.onmessage = (event) => {
        try {
          const parsed: P2PMessage = JSON.parse(event.data);
          this.listeners.forEach((cb) => cb(parsed));
        } catch {
          this.listeners.forEach((cb) =>
            cb({ type: "raw", data: event.data })
          );
        }
      };

      // 3. ICE handling & gathering
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      // Wait for local ICE candidates to gather
      await new Promise<void>((resolve) => {
        if (!this.pc) return resolve();
        if (this.pc.iceGatheringState === "complete") {
          resolve();
        } else {
          const checkState = () => {
            if (this.pc?.iceGatheringState === "complete") {
              this.pc.removeEventListener("icegatheringstatechange", checkState);
              resolve();
            }
          };
          this.pc.addEventListener("icegatheringstatechange", checkState);
          // Safety timeout 1500ms
          setTimeout(resolve, 1500);
        }
      });

      const sdpToSend = this.pc.localDescription?.sdp || offer.sdp;
      const typeToSend = this.pc.localDescription?.type || offer.type;

      // 4. Send initial SDP Offer to Jetson signaling endpoint
      const res = await fetch("/v1/webrtc/offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sdp: sdpToSend,
          type: typeToSend,
          near_account: nearAccount || null,
        }),
      });

      if (!res.ok) {
        throw new Error(`Signaling failed HTTP ${res.status}`);
      }

      const answer = await res.json();

      // 5. Apply Jetson's SDP Answer
      await this.pc.setRemoteDescription(
        new RTCSessionDescription({
          type: answer.type,
          sdp: answer.sdp,
        })
      );

      return true;
    } catch (err) {
      console.error("[WebRTC P2P] Handshake failed:", err);
      this.setState("failed");
      return false;
    }
  }

  send(msg: Record<string, any>): boolean {
    if (this.dc && this.dc.readyState === "open") {
      this.dc.send(JSON.stringify(msg));
      return true;
    }
    return false;
  }

  disconnect() {
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this.setState("disconnected");
  }
}

export const p2pClient = new WebRTCP2PClient();
