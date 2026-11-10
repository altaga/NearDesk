import pytest
from app.near_chain.mpc import chain_signatures
from app.near_ai.budget import budget_manager
from app.guardrails.approval import approval_manager
from app.board.telemetry import telemetry_collector

def test_telemetry():
    metrics = telemetry_collector.get_metrics()
    assert "cpu_percent" in metrics
    assert "memory" in metrics
    assert "gpu" in metrics

def test_chain_signatures_derivation():
    # Test EVM derivation
    eth = chain_signatures.derive_address("ethereum", "1", "test.near")
    assert eth["chain"] == "ethereum"
    assert eth["derived_address"].startswith("0x")
    assert len(eth["derived_address"]) == 42

    # Test Bitcoin derivation
    btc = chain_signatures.derive_address("bitcoin", "1", "test.near")
    assert btc["chain"] == "bitcoin"
    assert btc["derived_address"].startswith("tb1q") or btc["derived_address"].startswith("bc1q")

    # Test Solana derivation
    sol = chain_signatures.derive_address("solana", "1", "test.near")
    assert sol["chain"] == "solana"
    assert len(sol["derived_address"]) > 20

def test_budget_manager():
    status = budget_manager.get_status()
    assert status["max_budget_usd"] == 10.0
    assert status["remaining_budget_usd"] <= 10.0
    
    can_spend, reason = budget_manager.can_spend(0.001)
    assert can_spend is True

def test_approval_gate():
    req = approval_manager.create_request(
        action_type="shell_execution",
        title="Test Shell Execution",
        description="Run test command",
        payload={"command": "ls -la"},
        risk_level="high"
    )
    assert req.status == "pending"
    
    # Resolve approval
    resolved = approval_manager.resolve(req.id, approved=True, resolved_by="test_operator")
    assert resolved.status == "approved"
    assert resolved.resolved_by == "test_operator"
