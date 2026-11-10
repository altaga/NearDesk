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
    from app.config import settings
    assert settings.NEAR_MPC_CONTRACT_ID in fencing["allowed_contracts"]

def test_agent_identity_and_registry():
    profile = agent_identity.get_agent_profile()
    assert "did:near:" in profile["did"]
    assert profile["registry_status"] == "registered_active"
    assert len(profile["capabilities"]) >= 4

def test_agent_economy():
    eco = agent_economy.get_economy_metrics()
    assert eco["total_earned_near"] > 0
    assert len(eco["recent_tasks"]) >= 3

def test_board_pairing_and_discovery():
    from app.board.pairing import pairing_manager
    status = pairing_manager.get_status()
    assert "board_id" in status
    assert status["paired"] is True

    # Test claiming board
    claimed = pairing_manager.claim_board(
        board_id="jetson-orin-test-01",
        ip_address="192.168.55.1",
        near_account="test.near"
    )
    assert claimed["board_id"] == "jetson-orin-test-01"
    assert claimed["near_owner"] == "test.near"

def test_w3c_did_and_verifiable_credentials():
    from app.near_agent.did import agent_did
    # 1. Test DID Document
    did_doc = agent_did.generate_did_document()
    assert did_doc["id"].startswith("did:near:")
    assert len(did_doc["verificationMethod"]) >= 4
    assert len(did_doc["service"]) >= 3

    # 2. Test Verifiable Credential
    vc = agent_did.generate_signed_verifiable_credential()
    assert "VerifiableCredential" in vc["type"]
    assert "proof" in vc
    assert vc["proof"]["type"] == "Ed25519Signature2020"
    assert len(vc["proof"]["jws"]) > 20


def test_vault_runtime_injection_and_redaction():
    from app.vault import service, redact, StreamRedactor
    
    # 1. Put secret
    clean = service.put_secret("TEST_GITHUB_TOKEN", "ghp_super_secret_token_12345")
    assert clean == "TEST_GITHUB_TOKEN"

    # 2. Verify list_secrets NEVER reveals plain value
    secrets_list = service.list_secrets()
    found = [s for s in secrets_list if s["name"] == "TEST_GITHUB_TOKEN"]
    assert len(found) == 1
    assert found[0]["masked_preview"] == "••••••••"
    assert "ghp_super_secret_token_12345" not in str(found[0])

    # 3. Export env map for runtime injection
    env_map = service.export_env_map()
    assert "TEST_GITHUB_TOKEN" in env_map
    assert env_map["TEST_GITHUB_TOKEN"] == "ghp_super_secret_token_12345"

    # 4. Verify redaction masks secret values in logs and stdout
    raw_log = "Error in curl https://api.github.com with token ghp_super_secret_token_12345 returned 401"
    masked = service.redact_secrets(raw_log)
    assert "ghp_super_secret_token_12345" not in masked
    assert "••••" in masked

    # 5. Clean up
    deleted = service.delete_secret("TEST_GITHUB_TOKEN")
    assert deleted is True

def test_expert_brains_perspective():
    from app.brains import service
    
    # 1. List pre-seeded default experts
    brains = service.list_brains()
    names = [b.name for b in brains]
    assert "SecurityAuditor" in names
    assert "DeFiSolver" in names
    assert "JetsonArchitect" in names

    # 2. Test detect_called_experts
    prompt = "Please @SecurityAuditor inspect our board firewall"
    detected = service.detect_called_experts(prompt)
    assert len(detected) == 1
    assert detected[0].name == "SecurityAuditor"
    assert "Zero-trust" in detected[0].angle

    # 3. Create custom expert
    custom = service.create_or_update_brain(
        name="PerformanceAnalyst",
        angle="Latency minimization and zero-copy throughput.",
        method="1. Benchmark pipeline.\n2. Profile hot paths.\n3. Eliminate bottleneck."
    )
    assert custom.name == "PerformanceAnalyst"
    
    # Clean up custom
    deleted = service.delete_brain("PerformanceAnalyst")
    assert deleted is True
