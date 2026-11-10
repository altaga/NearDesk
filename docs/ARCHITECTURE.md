# NearDesk System Architecture

NearDesk is organized as a modular monorepo separating edge hardware drivers, the core operator API, and the sovereign Next.js web console.

---

## 1. High-Level Topology

```
┌────────────────────────────────────────────────────────┐
│               NearDesk Web Console (Next.js)           │
│  - Operator Chat Stream (Nova)                         │
│  - Live Jetson Hardware & Thermal Telemetry            │
│  - NEAR Chain Signatures Key Deriver & Visualizer      │
│  - NEAR Intents 1Click Solver Swap Widget              │
│  - Interactive Human-in-the-Loop Approval Queue        │
└───────────────────────────▲────────────────────────────┘
                            │ HTTP / WebSockets (Port 8000)
┌───────────────────────────▼────────────────────────────┐
│               NearDesk Core API (FastAPI)              │
│  - Hybrid Router (Local Deterministic vs NEAR AI)      │
│  - Strict Budget Guard ($10.00 Ceiling Meter)          │
│  - Chain Signatures MPC Client (v1.signer)             │
│  - NEAR Intents 1Click Client (ChainDefuser)           │
│  - Approval Gate Engine                                │
└───────────────────────────▲────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
┌───────────▼──────────────┐   ┌────────────▼─────────────┐
│  NVIDIA Jetson Edge Node │   │  NEAR Protocol Network   │
│  - Tegra Stats & Sysfs   │   │  - cloud-api.near.ai     │
│  - Local Edge LLM        │   │  - v1.signer (MPC)       │
│  - Board Agent Daemon    │   │  - 1Click Solvers        │
└──────────────────────────┘   └──────────────────────────┘
```

---

## 2. Component Breakdown

### A. Core Operator API (`apps/api`)
- **`app/near_ai/budget.py`:** Enforces a hard $10.00 budget ceiling on all outbound cloud inference. Records token usage, prompt/completion estimates, and writes to a persistent JSON ledger.
- **`app/near_ai/client.py`:** Connects to `https://cloud-api.near.ai/v1`. Supports chat completions and validates cryptographic TEE attestation reports (`/v1/attestation/report`).
- **`app/near_chain/mpc.py`:** Handles cross-chain address derivation for Bitcoin, Ethereum, Solana, and Base using the NEAR MPC root key. Crafts signing payloads for the `v1.signer` contract.
- **`app/near_intents/swap.py`:** Communicates with the 1Click swap API and Defuse solver network for cross-chain liquidity.
- **`app/guardrails/approval.py`:** In-memory authorization queue. Commands, transaction signing, and disk edits remain in `pending` state until the human operator signs off.
- **`app/board/telemetry.py`:** Samples hardware state from Jetson sysfs/tegrastats or host GPUs.

### B. Sovereign Web Desk (`apps/web`)
- Built with **Next.js 14**, **Tailwind CSS**, and **Lucide Icons**.
- Adheres to Swiss design principles: dark obsidian surfaces (`#08090B`), NEAR emerald accent (`#00EC97`), clean 1px borders, and monospace data representation.
- Provides real-time polling of telemetry, budget status, and pending approvals.

### C. Board Agent & Emulator (`apps/board-agent`, `apps/board-emu`)
- **`apps/board-agent`:** Standalone Python daemon that monitors board health, dials out to the API, and manages local edge tasks.
- **`apps/board-emu`:** A Docker container with simulated Tegra/sysfs releases, enabling developers to test edge agent workflows without physical Jetson hardware.

---

## 3. Security Philosophy

1. **Local Privacy First:** Light classification, hardware queries, and telemetry never leave the board.
2. **Cryptographic Multi-Chain Execution:** No private keys for Bitcoin, Ethereum, or Solana are ever stored on disk. Instead, keys are derived mathematically from the board's NEAR identity.
3. **Physical Operator Authority:** The agent cannot execute shell commands or move funds unilaterally. The UI features prominent Approval Gates.
