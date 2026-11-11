#!/bin/bash
set -euo pipefail

echo "=========================================================="
echo "  NearDesk Sovereign Jetson Nano Board Container Booting  "
echo "  Platform: NVIDIA Jetson Nano (4GB Unified LPDDR4)       "
echo "  L4T Release: R32.7.1 (BOARD: t210ref)                   "
echo "=========================================================="

STATE_DIR="${STATE_DIR:-/home/jetson/.config/neardesk}"
DATA_DIR="${DATA_DIR:-/home/jetson/data}"
WORKSPACE_DIR="${DESK_ROOT:-/home/jetson/workspace}"
BOARD_ID="${NEARDESK_BOARD_ID:-jetson-nano-board-01}"
HOST_PORT="${HOST_PORT:-8000}"

mkdir -p "$STATE_DIR" "$DATA_DIR" "$WORKSPACE_DIR"

# Initialize README in workspace if empty
if [ ! -f "$WORKSPACE_DIR/README.md" ]; then
  cat <<'EOF' > "$WORKSPACE_DIR/README.md"
# NearDesk NVIDIA Jetson Nano Edge Station (Test Board)

Welcome to the sovereign edge operator environment.
- Hardware: NVIDIA Jetson Nano Developer Kit (4GB Emulated)
- OS: Linux for Tegra (L4T R32.7.1)
- Operator: jetson (UID 1000)
- Workspace: /home/jetson/workspace
- Telemetry: Tegra Maxwell GPU (128 CUDA cores), thermals, power mode (10W_DEFAULT)
EOF
fi

# Ensure pairing state exists
PAIRING_FILE="$DATA_DIR/pairing_state.json"
if [ ! -f "$PAIRING_FILE" ]; then
  cat <<EOF > "$PAIRING_FILE"
{
  "paired": true,
  "board_id": "$BOARD_ID",
  "hardware_type": "NVIDIA Jetson Nano Developer Kit (4GB)",
  "ip_address": "http://127.0.0.1:$HOST_PORT",
  "connection_type": "Docker Jetson Nano Test Bridge",
  "near_owner": "${NEAR_ACCOUNT_ID:-a69d770c221f3f4b9ed0dc913a201940a355deeceb112a55b340a5cf30ee1ed6}",
  "authorized_operators": [
    "${NEAR_ACCOUNT_ID:-a69d770c221f3f4b9ed0dc913a201940a355deeceb112a55b340a5cf30ee1ed6}"
  ],
  "paired_at": $(date +%s),
  "status": "ready",
  "is_emulator": true
}
EOF
fi

# Also link into STATE_DIR for compatibility
ln -sf "$PAIRING_FILE" "$STATE_DIR/pairing_state.json" 2>/dev/null || cp "$PAIRING_FILE" "$STATE_DIR/pairing_state.json"

API_PID=""
AGENT_PID=""

cleanup() {
  echo "==> Shutting down NearDesk Jetson Nano services..."
  if [ -n "$AGENT_PID" ]; then
    kill -TERM "$AGENT_PID" 2>/dev/null || true
  fi
  if [ -n "$API_PID" ]; then
    kill -TERM "$API_PID" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
  echo "==> NearDesk services stopped."
}
trap cleanup EXIT INT TERM

# Start NearDesk Core Board API (FastAPI)
echo "==> Starting NearDesk Core API on 0.0.0.0:8000 (single worker for lean memory)..."
cd /opt/neardesk/api
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1 --loop asyncio &
API_PID=$!

# Wait for Board API healthcheck
echo "==> Awaiting API readiness..."
ready=0
for i in $(seq 1 40); do
  if python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=1)" 2>/dev/null; then
    ready=1
    break
  fi
  sleep 0.5
done

if [ "$ready" -ne 1 ]; then
  echo "ERROR: NearDesk Core API failed to start on 0.0.0.0:8000!" >&2
  exit 1
fi
echo "==> NearDesk Core API is HEALTHY on port 8000."

# Start NearDesk Board Agent (WebSocket Daemon for streaming tegrastats & command execution)
echo "==> Starting NearDesk Board Agent (WS relay)..."
export NEARDESK_WS_URL="ws://127.0.0.1:8000/v1/agent/ws"
export NEARDESK_BOARD_ID="$BOARD_ID"
cd /opt/neardesk/board-agent
python -m neardesk_agent &
AGENT_PID=$!

echo "==> Jetson Nano Board online and operational (ID: $BOARD_ID)!"
echo "==> Listening on container ports 8000 & 8800 (mapped to host 8000 / 18101)"

# Keep container running and wait on the API process
wait "$API_PID"
