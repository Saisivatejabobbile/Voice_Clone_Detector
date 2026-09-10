"""
User Settings Schema
Handles user preferences and settings
"""

from pydantic import BaseModel
from typing import Optional

class UserSettingsUpdate(BaseModel):
    """Schema for updating user profile"""
    full_name: Optional[str] = None
    phone: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    """Schema for changing password"""
    current_password: str
    new_password: str

class PasswordChangeResponse(BaseModel):
    """Schema for password change response"""
    message: str
