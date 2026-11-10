"""HTTP endpoints for managing encrypted operator vault secrets."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict

from . import service

router = APIRouter(prefix="/v1/vault", tags=["vault"])


class SecretPutRequest(BaseModel):
    name: str = Field(..., description="Secret environment variable name, e.g. GITHUB_TOKEN")
    value: str = Field(..., description="Secret value to encrypt at rest")


class SecretResponse(BaseModel):
    name: str
    masked_preview: str
    created_at: str
    updated_at: str


@router.get("", response_model=List[SecretResponse])
async def get_secrets():
    """List stored secrets (names and timestamps only, values masked)."""
    return service.list_secrets()


@router.post("")
async def create_or_update_secret(req: SecretPutRequest):
    """Encrypt and store a secret for runtime execution."""
    try:
        clean = service.put_secret(req.name, req.value)
        return {"ok": True, "name": clean, "message": "Secret encrypted and saved to vault."}
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/{name}")
async def delete_secret(name: str):
    """Delete a secret from the vault."""
    deleted = service.delete_secret(name)
    if not deleted:
        raise HTTPException(status_code=404, detail="Secret not found")
    return {"ok": True, "name": name, "message": "Secret removed from vault."}
