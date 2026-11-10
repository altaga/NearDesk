# NearDesk API Specification

All endpoints are hosted by `apps/api` on `http://localhost:8000`.

---

## 1. System & Telemetry

### `GET /v1/health`
Returns system status, active LLM mode, and whether Jetson hardware is detected.

### `GET /v1/telemetry`
Returns real-time hardware telemetry:
```json
{
  "timestamp": 1731234567.89,
  "board_type": "NVIDIA Jetson Edge Node",
  "is_jetson": true,
  "cpu_percent": 18.4,
  "memory": {
    "total_mb": 8192,
    "used_mb": 2450,
    "percent": 29.9
  },
  "gpu": {
    "device": "NVIDIA Tegra Orin GPU",
    "load_percent": 34.0,
    "temperature_c": 48.5,
    "power_watts": 12.4
  },
  "status": "online"
}
```

### `GET /v1/budget`
Returns real-time financial spend against the strict $10.00 ceiling:
```json
{
  "max_budget_usd": 10.0,
  "warning_budget_usd": 8.0,
  "total_spent_usd": 0.0412,
  "remaining_budget_usd": 9.9588,
  "percent_used": 0.41,
  "total_calls": 3,
  "hard_limit_reached": false
}
```

---

## 2. NEAR Integration

### `POST /v1/near/derive`
Derives foreign blockchain addresses using NEAR Chain Signatures.
- **Request:**
```json
{
  "chain": "ethereum",
  "derivation_path": "1"
}
```
- **Response:**
```json
{
  "chain": "ethereum",
  "chain_family": "evm",
  "near_account": "neardesk-operator.testnet",
  "derivation_path": "ethereum,1",
  "derived_address": "0x4a9d...38bc",
  "mpc_contract": "v1.signer-prod.testnet",
  "supported_assets": ["ETH", "USDC", "USDT"]
}
```

### `POST /v1/near/intents/quote`
Retrieves a cross-chain swap quote from the 1Click Defuse solver network.
- **Request:**
```json
{
  "asset_in": "SOL",
  "asset_out": "NEAR",
  "amount_in": "2.0"
}
```

### `GET /v1/near/attestation`
Fetches cryptographic TEE hardware attestation proof from NEAR AI Cloud.

---

## 3. Agent & Chat

### `POST /v1/chat`
Sends messages to Nova (the NearDesk Sovereign Operator). Automatically executes tool dispatches or raises Approval Gates when high-risk actions are proposed.

---

## 4. Human-in-the-Loop Guardrails

### `GET /v1/approvals`
Lists all actions waiting for operator sign-off.

### `POST /v1/approvals/{id}/resolve`
Approves or rejects a queued action:
```json
{
  "approved": true,
  "resolved_by": "operator"
}
```
