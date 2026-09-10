"""
User Schemas
Pydantic models for user-related requests and responses
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    """Schema for user registration"""
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """Schema for user response (public data)"""
    id: int
    email: str
    full_name: str
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    is_active: bool
    is_verified: bool
    is_online: bool
    created_at: datetime
    last_seen: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    """Schema for decoded token data"""
    user_id: Optional[int] = None
