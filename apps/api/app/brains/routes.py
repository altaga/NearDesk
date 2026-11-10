"""HTTP endpoints for managing Operator Experts ('Brains')."""

from fastapi import APIRouter, HTTPException
from typing import List

from .models import Brain, BrainCreateRequest
from . import service

router = APIRouter(prefix="/v1/brains", tags=["brains"])


@router.get("", response_model=List[Brain])
async def list_experts():
    """List all registered expert brains (personas)."""
    return service.list_brains()


@router.get("/{name}", response_model=Brain)
async def get_expert(name: str):
    """Retrieve an expert profile by name."""
    b = service.get_brain(name)
    if not b:
        raise HTTPException(status_code=404, detail="Expert brain not found")
    return b


@router.post("", response_model=Brain)
async def create_or_update_expert(req: BrainCreateRequest):
    """Create or update an expert profile."""
    try:
        return service.create_or_update_brain(req.name, req.angle, req.method)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@router.delete("/{name}")
async def delete_expert(name: str):
    """Delete an expert profile."""
    deleted = service.delete_brain(name)
    if not deleted:
        raise HTTPException(status_code=404, detail="Expert brain not found")
    return {"ok": True, "name": name, "message": "Expert profile deleted"}
