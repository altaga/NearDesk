import httpx
import logging
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger("neardesk.intents")

# Common Defuse Asset Identifiers for NEAR Intents
POPULAR_ASSETS = {
    "NEAR": "nep141:wrap.near",
    "USDC_NEAR": "nep141:17208628f84f5d6ee666596475b7a02622212d324b91460837dca931cd73da39",
    "USDT_NEAR": "nep141:usdt.tether-token.near",
    "SOL": "solana:sol",
    "ETH": "eth:eth",
    "BTC": "bitcoin:btc",
    "BASE_ETH": "base:eth",
    "ARB_ETH": "arbitrum:eth"
}

class NearIntentsClient:
    """Client for NEAR Intents 1Click Cross-Chain Swaps and Solvers."""
    
    def __init__(self):
        self.base_url = settings.NEAR_INTENTS_API_URL.rstrip("/")
        self.jwt = settings.NEAR_INTENTS_JWT

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.jwt:
            headers["Authorization"] = f"Bearer {self.jwt}"
        return headers

    def resolve_asset_id(self, symbol_or_id: str) -> str:
        sym = symbol_or_id.upper()
        return POPULAR_ASSETS.get(sym, symbol_or_id)

    async def get_quote(
        self,
        asset_in: str,
        asset_out: str,
        amount_in: str,
        slippage_tolerance_bps: int = 50
    ) -> Dict[str, Any]:
        """Fetch 1Click swap quote from NEAR Intents solver network."""
        resolved_in = self.resolve_asset_id(asset_in)
        resolved_out = self.resolve_asset_id(asset_out)

        payload = {
            "defuse_asset_identifier_in": resolved_in,
            "defuse_asset_identifier_out": resolved_out,
            "exact_amount_in": str(amount_in),
            "slippage_tolerance": slippage_tolerance_bps
        }

        try:
            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(
                    f"{self.base_url}/quote",
                    headers=self._headers(),
                    json=payload
                )

                if res.status_code == 200:
                    data = res.json()
                    return {
                        "ok": True,
                        "asset_in": asset_in,
                        "asset_out": asset_out,
                        "amount_in": str(amount_in),
                        "amount_out": data.get("amount_out"),
                        "min_amount_out": data.get("min_amount_out"),
                        "expiration": data.get("expiration_timestamp"),
                        "quote_id": data.get("quote_id", "live-solver-quote"),
                        "solvers": data.get("solvers", ["Defuse MPC Network"])
                    }
                else:
                    logger.warning(f"Intents quote API returned {res.status_code}: {res.text}. Providing simulated quote.")
                    # Provide realistic estimation if endpoint is rate-limited or in sandbox
                    return self._fallback_quote(asset_in, asset_out, amount_in)
        except Exception as e:
            logger.warning(f"Error querying NEAR Intents: {e}. Returning simulated quote.")
            return self._fallback_quote(asset_in, asset_out, amount_in)

    def _fallback_quote(self, asset_in: str, asset_out: str, amount_in: str) -> Dict[str, Any]:
        """Realistic fallback quote when offline or during testnet prototyping."""
        try:
            val = float(amount_in)
        except ValueError:
            val = 1.0

        # Estimated cross-rates for demo purposes
        rate_table = {
            ("SOL", "NEAR"): 41.2,
            ("NEAR", "SOL"): 0.024,
            ("ETH", "NEAR"): 620.0,
            ("NEAR", "ETH"): 0.0016,
            ("NEAR", "USDC_NEAR"): 4.85,
            ("USDC_NEAR", "NEAR"): 0.206,
            ("BTC", "NEAR"): 21500.0,
            ("NEAR", "BTC"): 0.000046
        }

        pair = (asset_in.upper(), asset_out.upper())
        rate = rate_table.get(pair, 1.0)
        est_out = round(val * rate, 6)

        return {
            "ok": True,
            "mode": "simulated_solver_quote",
            "asset_in": asset_in.upper(),
            "asset_out": asset_out.upper(),
            "amount_in": str(amount_in),
            "amount_out": str(est_out),
            "min_amount_out": str(round(est_out * 0.995, 6)),
            "expiration": 300,
            "solvers": ["NearDesk Solver Node (Testnet)"],
            "fee_bps": 15
        }

    def prepare_swap_intent(
        self,
        asset_in: str,
        asset_out: str,
        amount_in: str,
        recipient_account: str
    ) -> Dict[str, Any]:
        """Prepare swap intent payload requiring operator gate approval."""
        quote = self._fallback_quote(asset_in, asset_out, amount_in)
        return {
            "status": "pending_approval",
            "action": "near_intent_swap",
            "asset_in": asset_in,
            "asset_out": asset_out,
            "amount_in": amount_in,
            "expected_out": quote.get("amount_out"),
            "recipient": recipient_account,
            "description": f"Execute NEAR Intent cross-chain swap: {amount_in} {asset_in} -> {quote.get('amount_out')} {asset_out} to {recipient_account}"
        }

near_intents = NearIntentsClient()
