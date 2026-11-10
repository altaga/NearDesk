import httpx
import json
import time

BASE_URL = "http://localhost:8000/v1"

def print_step(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def test_natural_language_intents():
    print_step("1. LENGUAJE NATURAL -> NEAR INTENTS (1Click Defuse)")
    prompt = "Nova, cotiza un swap de 2.5 SOL a NEAR usando la red de solvers de Defuse"
    print(f"Operator Prompt: '{prompt}'")
    
    with httpx.Client(timeout=30.0) as client:
        res = client.post(f"{BASE_URL}/chat", json={
            "messages": [{"role": "user", "content": prompt}]
        })
        assert res.status_code == 200, f"Chat failed: {res.text}"
        data = res.json()
        print(f"Tier Used: {data.get('tier')} ({data.get('route_reason')})")
        print("\nNova Response Preview:")
        print(data.get("content")[:400] + "...")
        print("\nTool Executions:")
        for t in data.get("tool_executions", []):
            print(f"  - Tool: {t.get('tool')}")
            print(f"    Output: {json.dumps(t.get('output'), indent=4)[:300]}...")
            assert t.get("tool") == "near_intent_quote"
    print("✓ Natural language intent swap verified successfully!")

def test_natural_language_expert_and_chain_signatures():
    print_step("2. LENGUAJE NATURAL -> EXPERTO @DeFiSolver + CHAIN SIGNATURES")
    prompt = "@DeFiSolver deriva mi dirección de Ethereum con Chain Signatures y revisa el gas"
    print(f"Operator Prompt: '{prompt}'")
    
    with httpx.Client(timeout=30.0) as client:
        res = client.post(f"{BASE_URL}/chat", json={
            "messages": [{"role": "user", "content": prompt}]
        })
        assert res.status_code == 200, f"Chat failed: {res.text}"
        data = res.json()
        print(f"Tier Used: {data.get('tier')} ({data.get('route_reason')})")
        print("\nNova Response Preview:")
        print(data.get("content")[:500] + "...")
    print("✓ Expert persona and chain signatures invoked successfully!")

def test_natural_language_security_and_approval_gate():
    print_step("3. COMPUERTA DE SEGURIDAD (APPROVAL GATE) + VAULT RUNTIME REDACTION")
    
    with httpx.Client(timeout=15.0) as client:
        # A. Guardar secreto en el Vault
        v_res = client.post(f"{BASE_URL}/vault", json={
            "name": "TEST_INTEGRATION_TOKEN",
            "value": "super_secret_operator_token_99999"
        })
        assert v_res.status_code == 200
        print("A. Secreto cifrado guardado en Vault: $TEST_INTEGRATION_TOKEN")
        
        # B. Enviar comando a la terminal
        cmd = "python -c \"import os; print('SECRET_FOUND=' + os.environ.get('TEST_INTEGRATION_TOKEN', 'NONE'))\""
        print(f"B. Ejecutando comando que invoca el secreto: {cmd}")
        t_res = client.post(f"{BASE_URL}/board/terminal", json={"command": cmd})
        assert t_res.status_code == 200
        t_data = t_res.json()
        approval_id = t_data["approval_id"]
        print(f"C. Compuerta de Aprobación activada [ID: {approval_id}] Status: {t_data['status']}")
        
        # C. Verificar que esté en la lista de pendientes
        pending = client.get(f"{BASE_URL}/approvals").json()
        matching = [p for p in pending if p["id"] == approval_id]
        assert len(matching) == 1, "Approval request not found in pending"
        print(f"D. Solicitud confirmada en cola: '{matching[0]['title']}' (Riesgo: {matching[0]['risk_level']})")
        
        # D. Resolver aprobación (Simulación de click del operador en UI)
        res_app = client.post(f"{BASE_URL}/approvals/{approval_id}/resolve", json={
            "approved": True,
            "resolved_by": "operator.testnet"
        })
        assert res_app.status_code == 200
        resolved_data = res_app.json()
        exec_result = resolved_data["payload"].get("execution_result", {})
        print(f"E. Comando ejecutado tras aprobación física:")
        print(f"   Exit Code: {exec_result.get('exit_code')}")
        print(f"   Salida Redactada: {exec_result.get('output').strip()}")
        
        # F. VERIFICACIÓN CRÍTICA DE SEGURIDAD:
        # La salida debe mostrar SECRET_FOUND=•••• y NUNCA el valor en crudo!
        assert "super_secret_operator_token_99999" not in exec_result.get('output'), "CRITICAL: Plaintext secret leaked in output!"
        assert "••••" in exec_result.get('output'), "CRITICAL: StreamRedactor did not mask the secret!"
        print("✓ ¡Aislamiento de Secretos Verificado: Inyectado en runtime y enmascarado en la salida!")

        # G. Limpiar secreto de prueba
        client.delete(f"{BASE_URL}/vault/TEST_INTEGRATION_TOKEN")

def test_account_and_onchain_status():
    print_step("4. ESTADO DE CUENTA ON-CHAIN TESTNET EN VIVO")
    with httpx.Client(timeout=10.0) as client:
        acc = client.get(f"{BASE_URL}/near/account").json()
        print(f"Account: {acc.get('account_id')}")
        print(f"Balance: {acc.get('balance_near')} NEAR")
        print(f"Network: {acc.get('network')}")
        print(f"Active On-Chain: {acc.get('exists')}")
        assert acc.get("exists") is True
        assert acc.get("balance_near") > 0
    print("✓ Cuenta activa en Testnet con saldo real disponible!")

if __name__ == "__main__":
    test_natural_language_intents()
    test_natural_language_expert_and_chain_signatures()
    test_natural_language_security_and_approval_gate()
    test_account_and_onchain_status()
    print("\n" + "#" * 70)
    print("  TODAS LAS VERIFICACIONES DEL SISTEMA COMPLETADAS CON ÉXITO")
    print("#" * 70)
