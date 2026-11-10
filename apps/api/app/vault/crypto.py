import base64
import hashlib
from cryptography.fernet import Fernet
import os

_SALT = b"neardesk-vault-v1"
_ROUNDS = 100_000

def _get_master_key() -> bytes:
    seed = os.environ.get("NEARDESK_VAULT_KEY", "neardesk-default-sovereign-vault-key-2026")
    return hashlib.pbkdf2_hmac("sha256", seed.encode("utf-8"), _SALT, _ROUNDS, dklen=32)

def encrypt_value(plain: str) -> str:
    cipher = Fernet(base64.urlsafe_b64encode(_get_master_key()))
    return cipher.encrypt(plain.encode("utf-8")).decode("ascii")

def decrypt_value(ciphertext: str) -> str:
    try:
        cipher = Fernet(base64.urlsafe_b64encode(_get_master_key()))
        return cipher.decrypt(ciphertext.encode("ascii")).decode("utf-8")
    except Exception:
        return ""
