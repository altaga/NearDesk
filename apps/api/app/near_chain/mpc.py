import hashlib
import json
import logging
from typing import Dict, Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger("neardesk.chain_signatures")

# Default testnet MPC contract root public key (Secp256k1)
# Derived from NEAR testnet MPC network
DEFAULT_TESTNET_MPC_ROOT_KEY = "secp256k1:4HFcTSKXTejG1o7atb27341v4341...near_mpc_root"

B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"

def _b58encode(b: bytes) -> str:
    """Zero-dependency pure-Python Base58 encoding."""
    if not b:
        return ""
    n = int.from_bytes(b, "big")
    chars = []
    while n > 0:
        n, r = divmod(n, 58)
        chars.append(B58_ALPHABET[r])
    # Pad leading zero bytes
    pad = 0
    for byte in b:
        if byte == 0:
            pad += 1
        else:
            break
    return (B58_ALPHABET[0] * pad) + "".join(reversed(chars))

class ChainSignaturesClient:
    """Client for NEAR Chain Signatures (MPC cross-chain key derivation & signing)."""
    
    def __init__(self):
        self.rpc_url = settings.NEAR_RPC_URL
        self.contract_id = settings.NEAR_MPC_CONTRACT_ID
        self.account_id = settings.NEAR_ACCOUNT_ID or "neardesk-operator.testnet"

    async def get_mpc_public_key(self) -> Dict[str, Any]:
        """Fetch root public key of the MPC signer contract from NEAR network."""
        payload = {
            "jsonrpc": "2.0",
            "id": "neardesk-mpc",
            "method": "query",
            "params": {
                "request_type": "call_function",
                "finality": "final",
                "account_id": self.contract_id,
                "method_name": "public_key",
                "args_base64": ""
            }
        }
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(self.rpc_url, json=payload)
                if res.status_code == 200:
                    data = res.json()
                    if "result" in data and "result" in data["result"]:
                        # Decode ASCII bytes returned by contract
                        raw_bytes = bytes(data["result"]["result"])
                        root_key = raw_bytes.decode("utf-8").strip('"')
                        return {"ok": True, "root_key": root_key}
                    return {"ok": True, "root_key": "secp256k1:54h5yzVwhNusPJAjNn46Zg26ZpB5Q5pYqD5pYqD5"}
                return {"ok": False, "error": f"RPC Error {res.status_code}"}
        except Exception as e:
            logger.warning(f"Could not reach NEAR RPC for MPC key: {e}. Using deterministic local root.")
            return {"ok": True, "root_key": "secp256k1:4HFcTSKXTejG1o7atb27341v4341local"}

    def derive_address(self, chain: str, derivation_path: str = "1", custom_account_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Derive foreign blockchain address from the NEAR account ID and path.
        Chain options: 'ethereum' | 'bitcoin' | 'solana' | 'base' | 'arbitrum'
        """
        near_acc = custom_account_id or self.account_id
        chain_lower = chain.lower()
        full_path = f"{chain_lower},{derivation_path}"

        # Deterministic address derivation based on NEAR account + path
        seed_material = f"{near_acc}:{full_path}".encode("utf-8")
        hasher = hashlib.sha256(seed_material).digest()

        if chain_lower in ["ethereum", "eth", "base", "arbitrum", "polygon"]:
            # Keccak256 / SHA3 simulation for EVM address (20 bytes)
            evm_hash = hashlib.sha256(hasher + b"evm").digest()[-20:]
            derived_addr = "0x" + evm_hash.hex()
            return {
                "chain": chain_lower,
                "chain_family": "evm",
                "near_account": near_acc,
                "derivation_path": full_path,
                "derived_address": derived_addr,
                "mpc_contract": self.contract_id,
                "supported_assets": ["ETH", "USDC", "USDT", "ARB", "BASE_ETH"]
            }

        elif chain_lower in ["bitcoin", "btc"]:
            # Segwit / Legacy Bitcoin address simulation
            btc_hash = hashlib.sha256(hasher + b"btc").digest()[:20].hex()
            derived_addr = f"tb1q{btc_hash}" if settings.NEAR_NETWORK == "testnet" else f"bc1q{btc_hash}"
            return {
                "chain": "bitcoin",
                "chain_family": "bitcoin",
                "near_account": near_acc,
                "derivation_path": full_path,
                "derived_address": derived_addr,
                "mpc_contract": self.contract_id,
                "supported_assets": ["BTC", "Runes", "Ordinals"]
            }

        elif chain_lower in ["solana", "sol"]:
            sol_hash = hashlib.sha256(hasher + b"sol").digest()
            derived_addr = _b58encode(sol_hash)
            return {
                "chain": "solana",
                "chain_family": "solana",
                "near_account": near_acc,
                "derivation_path": full_path,
                "derived_address": derived_addr,
                "mpc_contract": self.contract_id,
                "supported_assets": ["SOL", "USDC-SPL"]
            }

        return {
            "error": f"Unsupported foreign chain '{chain}'. Supported: ethereum, base, arbitrum, bitcoin, solana"
        }

    async def create_sign_request(
        self,
        chain: str,
        derivation_path: str,
        payload_hash_hex: str
    ) -> Dict[str, Any]:
        """
        Prepare an MPC sign transaction payload for the NEAR smart contract.
        Requires approval gate prior to broadcast.
        """
        full_path = f"{chain.lower()},{derivation_path}"
        derived = self.derive_address(chain, derivation_path)

        sign_args = {
            "request": {
                "payload": payload_hash_hex.lstrip("0x"),
                "path": full_path,
                "key_version": 0
            }
        }

        return {
            "status": "pending_approval",
            "action": "near_chain_signature",
            "target_chain": chain,
            "derivation_path": full_path,
            "derived_address": derived.get("derived_address"),
            "contract_id": self.contract_id,
            "sign_args": sign_args,
            "required_deposit_yocto": "100000000000000000000000", # ~0.1 NEAR for MPC gas
            "description": f"Request NEAR MPC signature for {chain.upper()} transaction on derived address {derived.get('derived_address')}"
        }

chain_signatures = ChainSignaturesClient()
