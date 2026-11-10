"""Storage and perspective retrieval for Operator Experts ('Brains').

Each Brain defines an operational angle and procedural method.
When an operator references `@Name` in chat, the perspective is injected
into Nova's system instructions for that turn.
"""

from __future__ import annotations

import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from app.config import settings
from .models import Brain

_NAME_RE = re.compile(r"^[A-Za-z0-9_]{2,40}$")
_DB_PATH = settings.DATA_DIR / "neardesk_brains.db"

_DEFAULT_EXPERTS = [
    {
        "name": "SecurityAuditor",
        "angle": "Zero-trust verification, hardware isolation, principle of least privilege, strict gatekeeping on physical and on-chain side effects.",
        "method": "1. Audit required permissions, gas allowances, and access keys.\n2. Verify cryptographically SHA-256 hashes against NEAR on-chain receipts.\n3. Enforce Approval Gates on destructive shell actions and high-value transactions."
    },
    {
        "name": "DeFiSolver",
        "angle": "Atomic execution, slippage minimization, multi-chain liquidity aggregation via NEAR Intents and Defuse solvers.",
        "method": "1. Query 1Click market quotes across decentralized solvers.\n2. Evaluate gas overhead, route latency, and bridge counterparty risks.\n3. Formulate declarative non-custodial intent swap without touching raw private keys."
    },
    {
        "name": "JetsonArchitect",
        "angle": "Embedded system efficiency, Jetson Orin thermal envelope, Tegrastats telemetry, and optimal local vs cloud workload partition.",
        "method": "1. Sample Tegrastats telemetry (CPU, GPU, RAM, Thermals, NV power mode).\n2. Assess local compute availability vs strict $10 cloud budget.\n3. Optimize execution path for deterministic real-time response and zero memory leaks."
    }
]


def _get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(_DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _init_db() -> None:
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS neardesk_brains (
                name TEXT PRIMARY KEY,
                angle TEXT NOT NULL,
                method TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.commit()

        # Seed defaults if empty
        count = conn.execute("SELECT COUNT(*) as cnt FROM neardesk_brains").fetchone()["cnt"]
        if count == 0:
            stamp = _now_iso()
            for exp in _DEFAULT_EXPERTS:
                conn.execute(
                    """
                    INSERT INTO neardesk_brains (name, angle, method, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?)
                    """,
                    (exp["name"], exp["angle"], exp["method"], stamp, stamp),
                )
            conn.commit()


_init_db()


def list_brains() -> List[Brain]:
    """Return all registered expert brains."""
    with _get_connection() as conn:
        rows = conn.execute("SELECT * FROM neardesk_brains ORDER BY name ASC").fetchall()
        return [
            Brain(
                name=row["name"],
                angle=row["angle"],
                method=row["method"],
                created_at=row["created_at"],
                updated_at=row["updated_at"]
            )
            for row in rows
        ]


def get_brain(name: str) -> Optional[Brain]:
    """Retrieve an expert brain by name (case-insensitive)."""
    clean = (name or "").strip().lstrip("@")
    with _get_connection() as conn:
        row = conn.execute("SELECT * FROM neardesk_brains WHERE LOWER(name) = LOWER(?)", (clean,)).fetchone()
        if not row:
            return None
        return Brain(
            name=row["name"],
            angle=row["angle"],
            method=row["method"],
            created_at=row["created_at"],
            updated_at=row["updated_at"]
        )


def create_or_update_brain(name: str, angle: str, method: str) -> Brain:
    """Create or update an expert brain."""
    clean = (name or "").strip().lstrip("@")
    if not _NAME_RE.match(clean):
        raise ValueError("Invalid expert name. Must be 2-40 alphanumeric characters.")
    if not angle.strip() or not method.strip():
        raise ValueError("Both Angle and Method are required for an expert brain.")

    stamp = _now_iso()
    with _get_connection() as conn:
        conn.execute(
            """
            INSERT INTO neardesk_brains (name, angle, method, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
                angle = excluded.angle,
                method = excluded.method,
                updated_at = excluded.updated_at
            """,
            (clean, angle.strip(), method.strip(), stamp, stamp),
        )
        conn.commit()

    return get_brain(clean)  # type: ignore


def delete_brain(name: str) -> bool:
    """Delete an expert brain."""
    clean = (name or "").strip().lstrip("@")
    with _get_connection() as conn:
        cursor = conn.execute("DELETE FROM neardesk_brains WHERE LOWER(name) = LOWER(?)", (clean,))
        conn.commit()
        return cursor.rowcount > 0


def detect_called_experts(text: str) -> List[Brain]:
    """Scan text for @Expert mentions and return the matched brains."""
    if not text or "@" not in text:
        return []
    
    brains = list_brains()
    found: List[Brain] = []
    text_lower = text.lower()
    
    for b in brains:
        mention = f"@{b.name.lower()}"
        if mention in text_lower:
            found.append(b)
            
    return found
