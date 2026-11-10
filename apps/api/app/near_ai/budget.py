import json
import time
from pathlib import Path
from typing import Dict, Any, List
from app.config import settings

LEDGER_PATH = settings.DATA_DIR / "near_ai_budget_ledger.json"

# Approximate rates for open-weight 70B-400B models on NEAR AI Cloud (cost per 1k tokens)
# Estimated conservatively so we never accidentally overshoot the $10 ceiling.
ESTIMATED_PROMPT_COST_PER_1K = 0.0006   # $0.60 per million input tokens
ESTIMATED_COMPLETION_COST_PER_1K = 0.0018 # $1.80 per million output tokens

class BudgetManager:
    def __init__(self, ledger_file: Path = LEDGER_PATH):
        self.ledger_file = ledger_file
        self._ensure_ledger()

    def _ensure_ledger(self) -> None:
        if not self.ledger_file.exists():
            initial_data = {
                "max_budget_usd": settings.NEAR_MAX_BUDGET_USD,
                "warning_budget_usd": settings.NEAR_BUDGET_WARNING_USD,
                "total_spent_usd": 0.0,
                "total_calls": 0,
                "total_prompt_tokens": 0,
                "total_completion_tokens": 0,
                "entries": []
            }
            self.ledger_file.write_text(json.dumps(initial_data, indent=2), encoding="utf-8")

    def _load(self) -> Dict[str, Any]:
        try:
            return json.loads(self.ledger_file.read_text(encoding="utf-8"))
        except Exception:
            self._ensure_ledger()
            return json.loads(self.ledger_file.read_text(encoding="utf-8"))

    def _save(self, data: Dict[str, Any]) -> None:
        self.ledger_file.write_text(json.dumps(data, indent=2), encoding="utf-8")

    def get_status(self) -> Dict[str, Any]:
        data = self._load()
        spent = data.get("total_spent_usd", 0.0)
        max_b = settings.NEAR_MAX_BUDGET_USD
        remaining = max(0.0, max_b - spent)
        percent_used = min(100.0, (spent / max_b) * 100.0) if max_b > 0 else 100.0
        
        return {
            "max_budget_usd": max_b,
            "warning_budget_usd": settings.NEAR_BUDGET_WARNING_USD,
            "total_spent_usd": round(spent, 5),
            "remaining_budget_usd": round(remaining, 5),
            "percent_used": round(percent_used, 2),
            "total_calls": data.get("total_calls", 0),
            "total_prompt_tokens": data.get("total_prompt_tokens", 0),
            "total_completion_tokens": data.get("total_completion_tokens", 0),
            "hard_limit_reached": spent >= max_b,
            "warning_reached": spent >= settings.NEAR_BUDGET_WARNING_USD
        }

    def can_spend(self, estimated_cost_usd: float = 0.005) -> tuple[bool, str]:
        status = self.get_status()
        if status["hard_limit_reached"]:
            return False, f"NearDesk Hard Budget Limit Reached (${status['total_spent_usd']:.3f} / ${status['max_budget_usd']:.2f}). Outbound cloud calls halted to prevent charges."
        
        if status["total_spent_usd"] + estimated_cost_usd > settings.NEAR_MAX_BUDGET_USD:
            return False, f"Call would exceed the strict $10.00 budget ceiling. Remaining: ${status['remaining_budget_usd']:.4f} USD."

        return True, "Budget OK"

    def record_usage(
        self,
        model: str,
        prompt_tokens: int,
        completion_tokens: int,
        context_note: str = ""
    ) -> float:
        cost = (
            (prompt_tokens / 1000.0) * ESTIMATED_PROMPT_COST_PER_1K +
            (completion_tokens / 1000.0) * ESTIMATED_COMPLETION_COST_PER_1K
        )
        cost = round(cost, 6)

        data = self._load()
        data["total_spent_usd"] = round(data.get("total_spent_usd", 0.0) + cost, 6)
        data["total_calls"] = data.get("total_calls", 0) + 1
        data["total_prompt_tokens"] = data.get("total_prompt_tokens", 0) + prompt_tokens
        data["total_completion_tokens"] = data.get("total_completion_tokens", 0) + completion_tokens

        entry = {
            "timestamp": time.time(),
            "model": model,
            "prompt_tokens": prompt_tokens,
            "completion_tokens": completion_tokens,
            "cost_usd": cost,
            "cumulative_spent_usd": data["total_spent_usd"],
            "note": context_note
        }
        # Keep last 100 detailed entries
        entries = data.get("entries", [])
        entries.append(entry)
        data["entries"] = entries[-100:]

        self._save(data)
        return cost

budget_manager = BudgetManager()
