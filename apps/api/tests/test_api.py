import pytest
from app.near_chain.mpc import chain_signatures
from app.near_chain.keys import agent_keys
from app.near_chain.audit import audit_trail
from app.near_agent.identity import agent_identity
from app.near_agent.services import agent_economy
from app.near_ai.budget import budget_manager
from app.guardrails.approval import approval_manager
from app.board.telemetry import telemetry_collector

def test_telemetry():
    metrics = telemetry_collector.get_metrics()
    assert "cpu_percent" in metrics
    assert "memory" in metrics
    assert "gpu" in metrics

def test_chain_signatures_derivation():
    eth = chain_signatures.derive_address("ethereum", "1", "test.near")
    assert eth["chain"] == "ethereum"
    assert eth["derived_address"].startswith("0x")
    assert len(eth["derived_address"]) == 42

    btc = chain_signatures.derive_address("bitcoin", "1", "test.near")
    assert btc["chain"] == "bitcoin"
    assert btc["derived_address"].startswith("tb1q") or btc["derived_address"].startswith("bc1q")

    sol = chain_signatures.derive_address("solana", "1", "test.near")
    assert sol["chain"] == "solana"
    assert len(sol["derived_address"]) > 20

def test_budget_manager():
    status = budget_manager.get_status()
    assert status["max_budget_usd"] == 10.0
    assert status["remaining_budget_usd"] <= 10.0
    can_spend, reason = budget_manager.can_spend(0.001)
    assert can_spend is True

def test_approval_gate_and_audit_trail():
    # Trigger approval request
    req = approval_manager.create_request(
        action_type="chain_signature",
        title="Sign Solana Transfer",
        description="Transfer 0.5 SOL via MPC",
        payload={"chain": "solana", "amount": 0.5},
        risk_level="critical"
    )
    assert req.status == "pending"

    # Approving must automatically record into on-chain audit trail
    resolved = approval_manager.resolve(req.id, approved=True, resolved_by="operator.testnet")
    assert resolved.status == "approved"

    # Verify audit entry was created with a tx_hash and explorer url
    entries = audit_trail.get_entries(limit=5)
    matching = [e for e in entries if e.id == req.id]
    assert len(matching) == 1
    assert matching[0].payload_hash.startswith("0x")
    assert "nearblocks.io" in matching[0].explorer_url

def test_agent_key_fencing():
    fencing = agent_keys.get_active_fencing_status()
    assert fencing["master_key_protected"] is True
    assert fencing["gas_allowance_near"] > 0
    assert "v1.signer-prod.testnet" in fencing["allowed_contracts"]

def test_agent_identity_and_registry():
    profile = agent_identity.get_agent_profile()
    assert "did:near:" in profile["did"]
    assert profile["registry_status"] == "registered_active"
    assert len(profile["capabilities"]) >= 4

def test_agent_economy():
    eco = agent_economy.get_economy_metrics()
    assert eco["total_earned_near"] > 0
    assert len(eco["recent_tasks"]) >= 3
