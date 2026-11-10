"""Encrypted at rest SQLite vault for sovereign edge runtime secrets.

Values are encrypted using Fernet PBKDF2 before storage.
Secrets are NEVER injected into LLM prompt contexts.
At execution time, the secret map is injected directly into subprocess `os.environ`.
Output and logs are filtered through `redact_secrets` to mask values.
"""

from __future__ import annotations

import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

from app.config import settings
from .crypto import encrypt_value, decrypt_value
from .redact import redact

_NAME_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]{0,63}$")

_BLOCKED_NAMES = frozenset(
    {
        "PATH",
        "HOME",
        "SHELL",
        "IFS",
        "ENV",
        "BASH_ENV",
        "LD_PRELOAD",
        "LD_LIBRARY_PATH",
        "PYTHONPATH",
        "NODE_OPTIONS",
        "SSLKEYLOGFILE",
    }
)

_MAX_VALUE_LEN = 8000
_DB_PATH = settings.DATA_DIR / "neardesk_vault.db"


def _get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(_DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def _init_db() -> None:
    _DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with _get_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS neardesk_secrets (
                name TEXT PRIMARY KEY,
                ciphertext TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


_init_db()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _clean_name(name: str) -> str:
    clean = (name or "").strip()
    if not _NAME_RE.match(clean):
        raise ValueError("Invalid secret name. Use letters, digits and underscores (e.g. GITHUB_TOKEN).")
    if clean.upper() in _BLOCKED_NAMES:
        raise ValueError(f"{clean} is reserved by the OS shell and cannot be used as a secret name.")
    return clean


def put_secret(name: str, value: str) -> str:
    """Store or rotate an encrypted secret."""
    clean = _clean_name(name)
    if not value or len(value) > _MAX_VALUE_LEN:
        raise ValueError("Secret value is empty or exceeds maximum size limit (8KB).")

    ciphertext = encrypt_value(value)
    stamp = _now_iso()

    with _get_connection() as conn:
        conn.execute(
            """
            INSERT INTO neardesk_secrets (name, ciphertext, created_at, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
                ciphertext = excluded.ciphertext,
                updated_at = excluded.updated_at
            """,
            (clean, ciphertext, stamp, stamp),
        )
        conn.commit()
    return clean


def delete_secret(name: str) -> bool:
    """Delete a secret from the vault."""
    clean = _clean_name(name)
    with _get_connection() as conn:
        cursor = conn.execute("DELETE FROM neardesk_secrets WHERE name = ?", (clean,))
        conn.commit()
        return cursor.rowcount > 0


def list_secrets() -> List[Dict[str, str]]:
    """List secret keys with masked preview and timestamps (Never plaintext)."""
    with _get_connection() as conn:
        rows = conn.execute("SELECT name, created_at, updated_at FROM neardesk_secrets ORDER BY name ASC").fetchall()
        return [
            {
                "name": str(row["name"]),
                "masked_preview": "••••••••",
                "created_at": str(row["created_at"]),
                "updated_at": str(row["updated_at"]),
            }
            for row in rows
        ]


def export_env_map() -> Dict[str, str]:
    """Decrypt all secrets into a key-value dictionary.
    
    WARNING: This is ONLY to be passed into subprocess execution environments (`os.environ`).
    It must NEVER be injected into LLM prompt contexts.
    """
    found: Dict[str, str] = {}
    with _get_connection() as conn:
        rows = conn.execute("SELECT name, ciphertext FROM neardesk_secrets").fetchall()
        for row in rows:
            plain = decrypt_value(str(row["ciphertext"]))
            if plain:
                found[str(row["name"])] = plain
    return found


def redact_secrets(text: str) -> str:
    """Mask any occurrence of stored secret values within text or logs."""
    secrets = list(export_env_map().values())
    return redact(text, secrets)
