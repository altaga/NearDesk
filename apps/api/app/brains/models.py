from pydantic import BaseModel, Field
from typing import Optional

class Brain(BaseModel):
    name: str = Field(..., description="Expert persona identifier, e.g. SecurityAuditor")
    angle: str = Field(..., description="The mindset, posture, and operational philosophy of the expert")
    method: str = Field(..., description="The step-by-step procedural methodology followed by the expert")
    created_at: str
    updated_at: str

class BrainCreateRequest(BaseModel):
    name: str = Field(..., description="Expert identifier (e.g. SecurityAuditor)")
    angle: str = Field(..., description="The perspective/angle to adopt")
    method: str = Field(..., description="The method/steps to execute")
