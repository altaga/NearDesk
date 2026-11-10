import json
import logging
from typing import List, Dict, Any, Optional
from app.config import settings
from app.router.hybrid import hybrid_router
from app.near_ai.client import near_ai_client
from app.near_ai.budget import budget_manager
from app.chat.desk_tools import TOOL_DEFINITIONS, dispatch_tool
from app.board.telemetry import telemetry_collector
from app.near_chain.mpc import chain_signatures
from app.near_intents.swap import near_intents

logger = logging.getLogger("neardesk.engine")

SYSTEM_PROMPT = """You are Nova, the sovereign autonomous operator for NearDesk.
You run on an edge-native node (NVIDIA Jetson) integrated with NEAR Protocol.

Your capabilities include:
1. NEAR Chain Signatures (MPC): You derive and manage Bitcoin, Ethereum, Solana, and Base accounts directly from NEAR.
2. NEAR Intents: You find cross-chain liquidity and quotes through the 1Click Defuse solver network.
3. Edge Hardware Control: You inspect telemetry, files, and can run board shell commands through interactive approval gates.
4. TEE Verifiability: Your reasoning can be cryptographically verified using Intel TDX / NVIDIA confidential computing attestation reports from NEAR AI Cloud.

Operational Guidelines:
- Be concise, precise, and professional (Swiss engineering style).
- Always advise when an action will trigger an Approval Gate.
- Keep the user's budget in mind (Strict $10 limit).
"""

class ChatEngine:
    async def process_message(
        self,
        messages: List[Dict[str, str]],
        history: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Process incoming chat message using hybrid routing (Local vs NEAR AI Cloud)."""
        latest_user_msg = messages[-1]["content"] if messages else ""
        tier, reason = hybrid_router.route_prompt(latest_user_msg)

        logger.info(f"Chat routed to [{tier}] because [{reason}]")

        # ---------------------------------------------------------
        # TIER 1: Local Fast / Budget Saver
        # ---------------------------------------------------------
        if tier == "local_fast":
            local_resp = await self._handle_local_fast(latest_user_msg)
            if local_resp:
                return {
                    "ok": True,
                    "tier": "local_fast",
                    "route_reason": reason,
                    "content": local_resp["content"],
                    "tool_executions": local_resp.get("tools", []),
                    "budget": budget_manager.get_status()
                }

        # ---------------------------------------------------------
        # TIER 2: NEAR AI Cloud (Reasoning & Function Calling)
        # ---------------------------------------------------------
        full_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        if history:
            full_messages.extend(history[-6:])  # Keep context compact to save tokens
        full_messages.extend(messages)

        res = await near_ai_client.chat_completion(
            messages=full_messages,
            tools=TOOL_DEFINITIONS,
            temperature=0.2
        )

        if not res["ok"]:
            # Cloud failed or budget halted -> gracefully fall back to local answer
            err_msg = res.get("error", {}).get("message", "NEAR AI Cloud error")
            return {
                "ok": True,
                "tier": "local_fallback",
                "route_reason": f"cloud_unavailable_{err_msg[:30]}",
                "content": f"[NearDesk Edge Operator]\n{self._generate_fallback_response(latest_user_msg)}\n\n*(Note: Cloud reasoning was skipped: {err_msg})*",
                "tool_executions": [],
                "budget": budget_manager.get_status()
            }

        # Parse model response & function calls
        cloud_result = res["result"]
        choice = cloud_result["choices"][0]
        message_obj = choice.get("message", {})
        content = message_obj.get("content", "") or ""
        tool_calls = message_obj.get("tool_calls", [])

        tool_executions = []
        if tool_calls:
            for tc in tool_calls:
                fn_name = tc.get("function", {}).get("name")
                args_raw = tc.get("function", {}).get("arguments", "{}")
                try:
                    args = json.loads(args_raw)
                except Exception:
                    args = {}
                
                tool_output = await dispatch_tool(fn_name, args)
                tool_executions.append({
                    "tool": fn_name,
                    "arguments": args,
                    "output": tool_output
                })

        return {
            "ok": True,
            "tier": "near_cloud",
            "model": cloud_result.get("model", settings.NEARAI_MODEL),
            "content": content if content else self._format_tool_results_summary(tool_executions),
            "tool_executions": tool_executions,
            "metering": res.get("metering", {}),
            "budget": budget_manager.get_status()
        }

    async def _handle_local_fast(self, prompt: str) -> Optional[Dict[str, Any]]:
        """Handles telemetry, budget, derivation and quotes locally without spending tokens."""
        lower = prompt.lower()

        # Telemetry
        if any(w in lower for w in ["metrics", "cpu", "gpu", "ram", "temp", "hardware"]):
            metrics = telemetry_collector.get_metrics()
            content = (
                f"### NearDesk Hardware Telemetry\n\n"
                f"- **Node:** `{metrics['board_type']}`\n"
                f"- **CPU Load:** `{metrics['cpu_percent']}%`\n"
                f"- **RAM:** `{metrics['memory']['used_mb']} MB / {metrics['memory']['total_mb']} MB ({metrics['memory']['percent']}%)`\n"
                f"- **GPU / NPU:** `{metrics['gpu']['device']}` ({metrics['gpu']['load_percent']}%)\n"
                f"- **Temperature:** `{metrics['gpu']['temperature_c']}°C` | **Power:** `{metrics['gpu']['power_watts']}W`"
            )
            return {"content": content, "tools": [{"tool": "get_board_metrics", "output": metrics}]}

        # Budget
        if any(w in lower for w in ["budget", "spent", "balance", "cost", "token"]):
            b = budget_manager.get_status()
            content = (
                f"### NearDesk AI Cloud Budget Status\n\n"
                f"- **Ceiling Limit:** `${b['max_budget_usd']:.2f} USD`\n"
                f"- **Total Spent:** `${b['total_spent_usd']:.4f} USD` ({b['percent_used']}%)\n"
                f"- **Remaining:** `${b['remaining_budget_usd']:.4f} USD`\n"
                f"- **Total Cloud Calls:** `{b['total_calls']}`\n"
                f"- **Tokens Processed:** `{b['total_prompt_tokens'] + b['total_completion_tokens']}`"
            )
            return {"content": content, "tools": [{"tool": "near_budget_status", "output": b}]}

        # Chain Signatures (Derive Address)
        if any(w in lower for w in ["derive", "solana address", "ethereum address", "bitcoin address", "btc address"]):
            chain = "ethereum"
            if "solana" in lower or "sol" in lower:
                chain = "solana"
            elif "bitcoin" in lower or "btc" in lower:
                chain = "bitcoin"
            elif "base" in lower:
                chain = "base"
            
            res = chain_signatures.derive_address(chain=chain, derivation_path="1")
            content = (
                f"### NEAR Chain Signatures Derived Address\n\n"
                f"- **Foreign Network:** `{res['chain'].upper()}`\n"
                f"- **Derived Address:** `{res['derived_address']}`\n"
                f"- **Root NEAR Account:** `{res['near_account']}`\n"
                f"- **Derivation Path:** `{res['derivation_path']}`\n"
                f"- **MPC Contract:** `{res['mpc_contract']}`\n\n"
                f"This address is controlled entirely by your NEAR account via decentralized MPC threshold signatures."
            )
            return {"content": content, "tools": [{"tool": "near_derive_address", "output": res}]}

        # Intents quote
        if any(w in lower for w in ["quote", "swap rate", "swap 1", "swap sol", "swap near"]):
            q = await near_intents.get_quote("SOL", "NEAR", "1")
            content = (
                f"### NEAR Intents (1Click Cross-Chain Swap Quote)\n\n"
                f"- **Route:** `{q['asset_in']} -> {q['asset_out']}`\n"
                f"- **Input:** `{q['amount_in']} {q['asset_in']}`\n"
                f"- **Output:** `{q['amount_out']} {q['asset_out']}`\n"
                f"- **Guaranteed Min:** `{q['min_amount_out']} {q['asset_out']}`\n"
                f"- **Solvers Active:** `{', '.join(q['solvers'])}`\n"
                f"- **Expiration:** `{q['expiration']}s`"
            )
            return {"content": content, "tools": [{"tool": "near_intent_quote", "output": q}]}

        return None

    def _generate_fallback_response(self, prompt: str) -> str:
        return f"Acknowledged operator request: '{prompt}'. Executing edge-native routines without cloud token consumption."

    def _format_tool_results_summary(self, tool_executions: List[Dict[str, Any]]) -> str:
        if not tool_executions:
            return "Command processed."
        summaries = []
        for te in tool_executions:
            summaries.append(f"Executed tool `{te['tool']}` with result: `{str(te['output'])[:120]}...`")
        return "\n".join(summaries)

chat_engine = ChatEngine()
