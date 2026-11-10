FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    procps \
    && rm -rf /var/lib/apt/lists/*

# Fake Jetson hardware flag for emulator
RUN mkdir -p /etc && echo "R35 (release), REVISION: 4.1, GCID: 33958178, BOARD: t186ref, EABI: aarch64" > /etc/nv_tegra_release

COPY apps/board-agent/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/board-agent/neardesk_agent /app/neardesk_agent

ENV NEARDESK_API_URL="http://host.docker.internal:8000"
ENV NEARDESK_BOARD_ID="jetson-orin-emu-01"

CMD ["python", "-m", "neardesk_agent"]
