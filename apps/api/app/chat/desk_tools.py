import subprocess
import os
from pathlib import Path
from typing import Dict, Any, List
from app.near_ai.client import near_ai_client
from app.near_ai.budget import budget_manager
from app.near_chain.mpc import chain_signatures
from app.near_intents.swap import near_intents
from app.guardrails.approval import approval_manager
from app.board.telemetry import telemetry_collector

# Tool Definitions (JSON Schema for OpenAI / NEAR AI Cloud function calling)
TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "near_derive_address",
            "description": "Derive a foreign blockchain address (Ethereum, Bitcoin, Solana, Base) from a NEAR account using NEAR Chain Signatures MPC.",
            "parameters": {
                "type": "object",
                "properties": {
                    "chain": {
                        "type": "string",
                        "enum": ["ethereum", "bitcoin", "solana", "base", "arbitrum"],
                        "description": "The foreign blockchain network"
                    },
                    "derivation_path": {
                        "type": "string",
                        "description": "Subaccount or key path, e.g. '1', '2', 'trade-bot'"
                    }
                },
                "required": ["chain"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "near_intent_quote",
            "description": "Fetch a cross-chain swap quote from the NEAR Intents solver network (1Click swaps).",
            "parameters": {
                "type": "object",
                "properties": {
                    "asset_in": {
                        "type": "string",
                        "description": "Source asset (e.g. 'SOL', 'NEAR', 'ETH', 'BTC', 'USDC_NEAR')"
                    },
                    "asset_out": {
                        "type": "string",
                        "description": "Destination asset (e.g. 'NEAR', 'SOL', 'ETH', 'BTC', 'USDT_NEAR')"
                    },
                    "amount_in": {
                        "type": "string",
                        "description": "Input amount (e.g. '1.5')"
                    }
                },
                "required": ["asset_in", "asset_out", "amount_in"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "near_budget_status",
            "description": "Check current NEAR AI Cloud USD spend, tokens consumed, and remaining balance against the strict $10.00 ceiling.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "near_tee_attestation",
            "description": "Verify cryptographic hardware attestation report of the NEAR AI Cloud confidential computing enclave.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "execute_command",
            "description": "Execute a shell command on the Jetson edge board or host system. Automatically triggers an Approval Gate.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "Shell command to execute"
                    }
                },
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Read contents of a file on the board disk.",
            "parameters": {
                "type": "object",
                "properties": {
                    "path": {
                        "type": "string",
                        "description": "Absolute or relative file path"
                    }
                },
                "required": ["path"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_board_metrics",
            "description": "Fetch real-time hardware telemetry from the Jetson board (CPU, GPU, RAM, temperature, power).",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    }
]

async def dispatch_tool(name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
    """Execute tool call or route through approval gate."""
    
    if name == "near_derive_address":
        chain = arguments.get("chain", "ethereum")
        path = arguments.get("derivation_path", "1")
        return chain_signatures.derive_address(chain=chain, derivation_path=path)

    elif name == "near_intent_quote":
        asset_in = arguments.get("asset_in", "SOL")
        asset_out = arguments.get("asset_out", "NEAR")
        amount_in = arguments.get("amount_in", "1")
        return await near_intents.get_quote(asset_in, asset_out, amount_in)

    elif name == "near_budget_status":
        return budget_manager.get_status()

    elif name == "near_tee_attestation":
        return await near_ai_client.get_tee_attestation()

    elif name == "get_board_metrics":
        return telemetry_collector.get_metrics()

    elif name == "read_file":
        path_str = arguments.get("path", "")
        p = Path(path_str)
        if not p.exists():
            return {"error": f"File not found: {path_str}"}
        try:
            content = p.read_text(encoding="utf-8", errors="replace")[:4000]
            return {"path": path_str, "content": content}
        except Exception as e:
            return {"error": str(e)}

    elif name == "execute_command":
        cmd = arguments.get("command", "")
        # High-risk action -> Approval Gate triggered!
        req = approval_manager.create_request(
            action_type="shell_execution",
            title=f"Execute: {cmd[:40]}",
            description=f"Agent wants to execute shell command on the board: `{cmd}`",
            payload={"command": cmd},
            risk_level="high"
        )
        return {
            "requires_approval": True,
            "request_id": req.id,
            "status": "pending_operator_approval",
            "message": f"Shell command '{cmd}' has been placed in the NearDesk Approval Queue."
        }

    return {"error": f"Unknown tool: {name}"}
