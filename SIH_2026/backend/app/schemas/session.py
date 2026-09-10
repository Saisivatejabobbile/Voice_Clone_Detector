"""
Session Schema
Handles user session tracking
"""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class SessionResponse(BaseModel):
    """Schema for active session"""
    session_id: str
    user_id: int
    device_info: str
    ip_address: str
    user_agent: str
    created_at: datetime
    last_activity: datetime
    is_current: bool = False

    class Config:
        from_attributes = True

class LogoutAllResponse(BaseModel):
    """Schema for logout all response"""
    message: str
    sessions_terminated: int
