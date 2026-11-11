# =============================================================================
# NearDesk NVIDIA Jetson Nano Sovereign Board Container (Emulator / Test Board)
# =============================================================================
# Emulates an NVIDIA Jetson Nano edge station (4GB LPDDR4, Maxwell Tegra GPU)
# Runs the full NearDesk Core API and Board Agent daemon (CPU-only, no CUDA/GPU required).
# Provides real Linux terminal execution, filesystem workspace, NEAR MPC Chain
# Signatures, 1Click Intents, and hardware telemetry.
# =============================================================================

FROM python:3.11-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    MALLOC_ARENA_MAX=2 \
    BOARD_TYPE=jetson_nano \
    NEARDESK_BOARD_ID=jetson-nano-board-01 \
    NEARDESK_BOARD_EMU=true \
    NEAR_NETWORK=testnet \
    LLM_MODE=near_cloud \
    HOME=/home/jetson \
    DESK_ROOT=/home/jetson/workspace \
    DATA_DIR=/home/jetson/data \
    STATE_DIR=/home/jetson/.config/neardesk

# Create non-root operator 'jetson' matching real physical board and install base tooling
RUN useradd -m -u 1000 -s /bin/bash jetson \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
      bash \
      ca-certificates \
      curl \
      git \
      procps \
      iproute2 \
      net-tools \
      nano \
      sudo \
      htop \
 && echo "jetson ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers \
 && rm -rf /var/lib/apt/lists/*

# Authentic NVIDIA Jetson Nano L4T hardware signature (R32.7.1, BOARD: t210ref)
RUN mkdir -p /etc \
 && printf '%s\n' \
      "# R32 (release), REVISION: 7.1, GCID: 29818004, BOARD: t210ref, EABI: aarch64, DATE: Wed Jan 12 03:41:10 UTC 2022" \
      > /etc/nv_tegra_release

WORKDIR /opt/neardesk

# Install Python requirements for NearDesk Core API and Board Agent
COPY apps/api/requirements.txt /opt/neardesk/api-requirements.txt
COPY apps/board-agent/requirements.txt /opt/neardesk/agent-requirements.txt

RUN pip install --no-cache-dir \
      fastapi>=0.115.0 \
      uvicorn[standard]>=0.30.0 \
      pydantic>=2.8.0 \
      pydantic-settings>=2.4.0 \
      httpx>=0.27.0 \
      python-dotenv>=1.0.1 \
      psutil>=6.0.0 \
      cryptography>=43.0.0 \
      base58>=2.1.1 \
      websockets>=13.0 \
      pynacl \
      aiortc>=1.16.0

# Copy application sources
COPY apps/api/app /opt/neardesk/api/app
COPY apps/board-agent/neardesk_agent /opt/neardesk/board-agent/neardesk_agent
COPY apps/board-agent/neardesk_agent /opt/neardesk/api/neardesk_agent
COPY apps/board-emu/entrypoint.sh /entrypoint.sh

# Prepare workspace and volume mounts with jetson user permissions
RUN sed -i 's/\r$//' /entrypoint.sh \
 && chmod 0755 /entrypoint.sh \
 && mkdir -p /home/jetson/.config/neardesk /home/jetson/data /home/jetson/workspace \
 && chown -R jetson:jetson /home/jetson /opt/neardesk

USER jetson
WORKDIR /home/jetson

EXPOSE 8000 8800

ENTRYPOINT ["/entrypoint.sh"]
