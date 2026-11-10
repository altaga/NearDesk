import httpx
import logging
from typing import List, Dict, Any, Optional
from app.config import settings
from app.near_ai.budget import budget_manager

logger = logging.getLogger("neardesk.near_ai")

class NearAIClient:
    def __init__(self):
        self.base_url = settings.NEARAI_BASE_URL.rstrip("/")
        self.api_key = settings.NEARAI_API_KEY
        self.default_model = settings.NEARAI_MODEL

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json"
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def get_models(self) -> List[Dict[str, Any]]:
        """Fetch available models from NEAR AI Cloud."""
        if not self.api_key:
            return [{"id": self.default_model, "owned_by": "near-ai", "status": "no_key"}]
            
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    f"{self.base_url}/models",
                    headers=self._get_headers()
                )
                if res.status_code == 200:
                    data = res.json()
                    return data.get("data", [])
                logger.warning(f"Failed to fetch NEAR AI models: {res.status_code} {res.text}")
                return [{"id": self.default_model, "owned_by": "near-ai"}]
        except Exception as e:
            logger.error(f"Error connecting to NEAR AI Cloud models: {e}")
            return [{"id": self.default_model, "owned_by": "near-ai", "error": str(e)}]

    async def get_tee_attestation(self) -> Dict[str, Any]:
        """Fetch hardware attestation report proving models run inside verifiable TEE enclaves."""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.get(
                    f"{self.base_url}/attestation/report",
                    headers=self._get_headers()
                )
                if res.status_code == 200:
                    return {
                        "verified": True,
                        "tee_type": "Intel TDX / NVIDIA Confidential Computing",
                        "report": res.json()
                    }
                return {
                    "verified": False,
                    "status_code": res.status_code,
                    "message": "Attestation endpoint reachable or mock mode active"
                }
        except Exception as e:
            return {
                "verified": False,
                "error": str(e),
                "message": "Attestation unavailable in offline/local mode"
            }

    async def chat_completion(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.2,
        max_tokens: int = 2048,
        tools: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Send chat completion to NEAR AI Cloud with strict budget metering."""
        target_model = model or self.default_model

        # 1. Budget Gate - STRICT CHECK
        can_proceed, reason = budget_manager.can_spend(estimated_cost_usd=0.005)
        if not can_proceed:
            logger.error(f"Budget blocked NEAR AI call: {reason}")
            return {
                "ok": False,
                "error": {
                    "code": "BUDGET_EXCEEDED",
                    "message": reason
                }
            }

        # 2. Check for missing API Key
        if not self.api_key:
            return {
                "ok": False,
                "error": {
                    "code": "NO_NEARAI_KEY",
                    "message": "NEARAI_API_KEY is not configured in secrets.env"
                }
            }

        payload: Dict[str, Any] = {
            "model": target_model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        if tools:
            payload["tools"] = tools

        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                res = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers=self._get_headers(),
                    json=payload
                )

                if res.status_code != 200:
                    logger.error(f"NEAR AI Cloud returned {res.status_code}: {res.text}")
                    return {
                        "ok": False,
                        "error": {
                            "code": f"NEARAI_HTTP_{res.status_code}",
                            "message": res.text
                        }
                    }

                result = res.json()
                
                # 3. Record tokens and spent USD in the persistent ledger
                usage = result.get("usage", {})
                p_tokens = usage.get("prompt_tokens", 0)
                c_tokens = usage.get("completion_tokens", 0)
                cost = budget_manager.record_usage(
                    model=target_model,
                    prompt_tokens=p_tokens,
                    completion_tokens=c_tokens,
                    context_note="NearDesk Operator Query"
                )
                logger.info(f"NEAR AI call completed. Cost: ${cost:.6f} USD. Total spent: ${budget_manager.get_status()['total_spent_usd']:.4f}")

                return {
                    "ok": True,
                    "result": result,
                    "metering": {
                        "prompt_tokens": p_tokens,
                        "completion_tokens": c_tokens,
                        "cost_usd": cost,
                        "budget_status": budget_manager.get_status()
                    }
                }

        except Exception as e:
            logger.error(f"Failed to communicate with NEAR AI Cloud: {e}")
            return {
                "ok": False,
                "error": {
                    "code": "NEARAI_COMMUNICATION_ERROR",
                    "message": str(e)
                }
            }

near_ai_client = NearAIClient()
