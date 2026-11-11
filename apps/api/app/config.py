import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Literal

# Find repository root secrets.env or container mount if present
REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent

candidate_secrets = [
    Path(os.environ.get("SECRETS_FILE", "")) if os.environ.get("SECRETS_FILE") else None,
    Path("/home/jetson/secrets.env"),
    Path("/opt/neardesk/secrets.env"),
    Path("/app/secrets.env"),
    REPO_ROOT / "secrets.env",
    Path(".env")
]

SECRETS_FILE = next((p for p in candidate_secrets if p is not None and p.exists() and p.is_file()), Path(".env"))

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=SECRETS_FILE if SECRETS_FILE.exists() else ".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # NEAR AI Cloud Configuration
    NEARAI_API_KEY: str = Field(default="", description="NEAR AI Cloud API Key from cloud.near.ai")
    NEARAI_BASE_URL: str = Field(default="https://cloud-api.near.ai/v1")
    NEARAI_MODEL: str = Field(default="qwen/qwen3.5-397b-a17b")
    
    # HARD BUDGET CEILING (USD) - STRICTLY RESPECTED
    NEAR_MAX_BUDGET_USD: float = Field(default=10.0, description="Strict total project ceiling for NEAR AI calls")
    NEAR_BUDGET_WARNING_USD: float = Field(default=8.0, description="Soft alert threshold")

    # NEAR Blockchain Configuration
    NEAR_NETWORK: Literal["testnet", "mainnet"] = Field(default="testnet")
    NEAR_RPC_URL: str = Field(default="https://rpc.testnet.near.org")
    NEAR_ACCOUNT_ID: str = Field(default="")
    NEAR_PRIVATE_KEY: str = Field(default="")
    
    # NEAR Chain Signatures (MPC Contract)
    NEAR_MPC_CONTRACT_ID: str = Field(default="v1.signer-prod.testnet")
    
    # NEAR Intents API (1Click Cross-Chain Swap & Defuse)
    NEAR_INTENTS_API_URL: str = Field(default="https://1click.chaindefuser.com/v0")
    NEAR_INTENTS_JWT: str = Field(default="")

    # Local Edge Inference (Ollama on Jetson or Dev Machine)
    OLLAMA_URL: str = Field(default="http://127.0.0.1:11434")
    OLLAMA_MODEL: str = Field(default="qwen2.5-coder:7b")

    # Hybrid Routing Mode: hybrid | near_cloud | local_only
    LLM_MODE: Literal["hybrid", "near_cloud", "local_only"] = Field(default="hybrid")
    
    # NearDesk Security & Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DESK_AUTH_SECRET: str = Field(default="neardesk_local_secret")
    DATA_DIR: Path = Path(__file__).resolve().parent.parent / "data"

settings = Settings()
settings.DATA_DIR.mkdir(parents=True, exist_ok=True)
