"""
Call Schemas
Pydantic models for call-related requests and responses
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class CallInitiate(BaseModel):
    """Schema for initiating a call"""
    callee_id: int = Field(..., description="ID of user to call")


class CallAccept(BaseModel):
    """Schema for accepting a call"""
    call_id: str


class CallReject(BaseModel):
    """Schema for rejecting a call"""
    call_id: str


class CallHistoryCreate(BaseModel):
    """Schema for creating call history"""
    call_id: str = Field(..., description="Unique call identifier")
    callee_id: int = Field(..., description="ID of user who was called")
    started_at: datetime = Field(..., description="Call start time")
    ended_at: datetime = Field(..., description="Call end time")
    duration_seconds: int = Field(..., ge=0, description="Duration in seconds")
    call_status: str = Field(default="completed", description="Call status")


class CallHistoryResponse(BaseModel):
    """Schema for call history response with contact enrichment"""
    id: str  # UUID as string
    caller_id: int
    callee_id: int
    started_at: datetime
    ended_at: Optional[datetime]
    duration_seconds: int
    status: str  # 'completed', 'rejected', 'failed'
    risk_level: Optional[str]  # 'LOW', 'MEDIUM', 'HIGH'
    risk_score: Optional[int]  # 0-100
    created_at: datetime
    # Contact information (added for display)
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_id: Optional[int] = None
    
    class Config:
        from_attributes = True


class RiskAnalysisUpdate(BaseModel):
    """Schema for risk analysis update"""
    risk_level: str = Field(..., description="Risk level: LOW, MEDIUM, HIGH")
    risk_score: float = Field(..., ge=0, le=100, description="Risk score 0-100")
    synthetic_confidence: float = Field(..., ge=0, le=100)
    model_confidence: float = Field(..., ge=0, le=100)
    recommendation: str
    acoustic_indicators: Optional[Dict[str, Any]] = None
    prosody_indicators: Optional[Dict[str, Any]] = None