"""
Contact Schemas
Pydantic models for contact request/response validation
"""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class ContactCreate(BaseModel):
    """Schema for creating a new contact"""
    contact_name: str
    contact_email: EmailStr


class ContactResponse(BaseModel):
    """Schema for contact response"""
    id: int
    contact_name: str
    contact_email: str
    contact_user_id: Optional[int] = None
    is_registered: bool = False  # Whether contact is a registered user
    is_online: bool = False  # Whether contact is online (if registered)
    created_at: datetime
    
    class Config:
        from_attributes = True
