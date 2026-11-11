<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./logos/logo-titled-color-dark.png">
    <source media="(prefers-color-scheme: light)" srcset="./logos/logo-titled-color-light.png">
    <img src="./logos/logo-titled-color-dark.png" alt="NearDesk Logo" width="420">
  </picture>
</p>

# NearDesk 🟢

> **The Sovereign Edge AI Operator Desk for NEAR Protocol**  
> *Hardware-anchored agents, decentralized MPC Chain Signatures, 1Click cross-chain intents, Scoped FunctionCall fencing, and verifiable on-chain audit trails.*  
>  
> 🌐 **Live Production Console:** [https://neardesk-sandy.vercel.app](https://neardesk-sandy.vercel.app)

---

## 🚀 Overview

**NearDesk** is an edge-native operator station designed to run directly on physical hardware (such as the **NVIDIA Jetson Orin / Nano**) or in a local edge environment.

By fusing **local private compute** on physical edge nodes with **NEAR Protocol's Chain Abstraction & Agentic Stack**, NearDesk delivers true **User-Owned AI**:
- **Sovereign Local Execution:** Shell commands, hardware diagnostics, and sensitive data processing stay strictly private on the edge node.
- **NEAR Chain Signatures (MPC):** A single NEAR account controls and signs transactions natively for **Bitcoin, Ethereum, Solana, and Base** without cross-chain bridges or exposed private keys.
- **NEAR Intents (1Click Cross-Chain Swaps):** The agent autonomously sources quotes and initiates swaps via the Defuse solver network.
- **Scoped FunctionCall Key Fencing:** Mathematical boundary preventing the agent from transferring master account funds or deleting contracts under prompt injection.
- **On-Chain Verifiable Audit Trail:** Every approved action and signature is hashed and permanently anchored into NEAR testnet blocks.
- **Agent Economy & Peer Micropayments:** Other AI agents pay our node micro-fees in NEAR to execute private edge computations and attestation proofs.
- **Confidential Computing (TEE):** Cloud reasoning requests routed to NEAR AI Cloud (`cloud-api.near.ai`) run inside hardware-verified Intel TDX and NVIDIA Confidential Computing enclaves.
- **Human-in-the-Loop Approval Gates:** No shell commands, file modifications, or financial signatures can be executed without physical operator authorization in the UI.
- **Strict Budget Ceiling:** Hard-enforced financial guardrails (metered down to the fraction of a cent) respecting a **strict \$10.00 USD budget**.

---

## 🏆 NEAR Hackathon Tracks Addressed

NearDesk is built to compete as a flagship entry across three core tracks:

| Track | Why NearDesk is Built for This |
|---|---|
| **🥇 1. Privacy & Private AI** | Edge-first deployment on NVIDIA Jetson. Private data and terminal commands never touch the public internet. Cloud inference utilizes verifiable TEE hardware attestation. |
| **🥈 2. AI Security & Defense** | Scoped FunctionCall keys restrict the agent's gas allowance on-chain. Visual Approval Gates ensure rogue or jailbroken prompts cannot execute destructive actions without operator consent. |
| **🥉 3. Agent Economy & Unstoppable DeFi** | The edge node holds multi-chain balances (BTC/ETH/SOL) via NEAR Chain Signatures, performs 1Click Intent swaps, and earns NEAR by providing paid edge services to other agents. |

---

## 🏛️ System Architecture

```mermaid
flowchart TD
    subgraph OperatorDesk["NearDesk Operator Console (Next.js 14)"]
        UI["Swiss-Engineered Dark UI (#00EC97)"]
        TelemetryBar["Jetson Hardware & Thermal Telemetry"]
        CSCard["NEAR Chain Signatures Console (BTC/ETH/SOL)"]
        IntentCard["1Click Intents Swap Engine (Defuse)"]
        FencingCard["Scoped FunctionCall Key Fencing"]
        AuditCard["On-Chain Verifiable Audit Trail"]
        EconomyCard["Agent Economy Peer Micropayments"]
        GateModal["Human-in-the-Loop Approval Gate"]
    end

    subgraph EdgeNode["Physical Edge Station (NVIDIA Jetson / Host Node)"]
        FastAPI["NearDesk Core API (Port 8000)"]
        OllamaLocal["Local Edge LLM (Private & Sovereign)"]
        BudgetGuard["Budget Guardrail (Strict $10.00 Limit)"]
        LocalTools["Shell / File / Hardware Drivers"]
    end

    subgraph NEARProtocol["NEAR Protocol & Decentralized Stack"]
        MPC["v1.signer (MPC Multi-Chain Signer)"]
        Intents["NEAR Intents / Defuse Solver Network"]
        NEARCloud["NEAR AI Cloud (TEE Verifiable Ingestion)"]
        AuditLedger["NEAR On-Chain Blocks (Audit Trail)"]
        AgentRegistry["NEAR Agent Registry & DID"]
    end

    UI <--> FastAPI
    FastAPI --> LocalTools
    FastAPI --> BudgetGuard
    BudgetGuard --> NEARCloud
    FastAPI --> MPC
    FastAPI --> Intents
    FastAPI --> AuditLedger
    FastAPI --> AgentRegistry
    LocalTools -.-> GateModal
```

---

## ⚡ Quickstart

### 1. Prerequisites
- **Node.js:** v18+ (Node 20 or 22 recommended)
- **Python:** 3.10+
- *(Optional)* **Docker:** for the Jetson board emulator

### 2. Configure Secrets
Copy the template and fill in your API key:
```bash
cp secrets.env.example secrets.env
```

Edit `secrets.env`:
```env
NEARAI_API_KEY=sk-...
NEARAI_BASE_URL=https://cloud-api.near.ai/v1
NEAR_MAX_BUDGET_USD=10.00
NEAR_NETWORK=testnet
NEAR_ACCOUNT_ID=your-account.testnet
```

### 3. Start NearDesk API (Backend)
```bash
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
API docs available at: `http://localhost:8000/docs`

### 4. Start NearDesk Web Console (Frontend)
```bash
cd apps/web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the operator console.

### 5. Run API Test Suite
```bash
cd apps/api
python -m pytest tests -q
```
*(7 tests passing: Telemetry, Multi-Chain Derivations, Budget Ceiling, Approval Gates, FunctionCall Key Fencing, Audit Trail, Agent Economy).*

### 6. (Optional) Run the Jetson Board Emulator
Simulate a physical Jetson Orin board inside Docker:
```bash
npm run emu:up
```

---

## 🛠️ Built With

- **AI Ingestion:** [NEAR AI Cloud](https://cloud.near.ai) (OpenAI-compatible TEE endpoints).
- **Multi-Chain Execution:** [NEAR Chain Signatures](https://near.org) (`v1.signer-prod.testnet`).
- **Cross-Chain Settlement:** [NEAR Intents & Defuse](https://near-intents.org).
- **Backend:** FastAPI, Python 3.11, Pydantic, HTTPX.
- **Frontend:** Next.js 14, Tailwind CSS, Lucide Icons (Swiss dark industrial aesthetic).
- **Edge Deployment:** NVIDIA Jetson Linux (L4T / Tegra), Docker Compose.

---

## 🔒 Security & Guardrails

- **Zero Unsigned Operations:** All foreign transactions are signed through decentralized MPC nodes.
- **Mathematical Key Fencing:** Agent uses a Scoped FunctionCall Access Key limited to 2.5 NEAR gas allowance and restricted contracts (`v1.signer`, `intents.near`).
- **Physical Approval Gates:** High-risk actions (executing shell scripts or broadcasting cross-chain swaps) generate interactive tickets that require manual confirmation.
- **Cryptographic Audit Trail:** Approved operations generate SHA-256 receipts permanently anchored on NEAR testnet.
- **Budget Lock:** Cloud calls are instantly frozen once the \$10 budget threshold is reached, falling back to 100% local edge processing.
