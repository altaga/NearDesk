"""NearDesk Sovereign Secrets Vault (Fernet PBKDF2 encryption at rest, runtime subprocess injection)."""

from .service import export_env_map, redact_secrets, list_secrets, put_secret, delete_secret
from .redact import redact, StreamRedactor
