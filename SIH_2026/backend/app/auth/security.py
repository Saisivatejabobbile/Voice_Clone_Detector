"""
Security Utilities
Password hashing and JWT token management
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
import logging

from app.config import settings

logger = logging.getLogger(__name__)

import bcrypt

# Password hashing context - fallback
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    Supports direct bcrypt verification to avoid passlib Python 3.12 wrap bugs.
    """
    if not plain_password or not hashed_password:
        return False
    try:
        truncated = plain_password.encode('utf-8')[:72]
        return bcrypt.checkpw(truncated, hashed_password.encode('utf-8'))
    except Exception as e:
        try:
            return pwd_context.verify(plain_password.encode('utf-8')[:72].decode('utf-8', errors='ignore'), hashed_password)
        except Exception:
            return False


def get_password_hash(password: str) -> str:
    """
    Hash a plain password using bcrypt.
    """
    truncated = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(truncated, salt).decode('utf-8')


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Data to encode in the token (typically {"sub": user_id})
        expires_delta: Optional expiration time delta
        
    Returns:
        str: Encoded JWT token
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    
    logger.info(f"Created token with expiry: {expire}")
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decode and verify a JWT access token.
    
    Args:
        token: JWT token string
        
    Returns:
        Optional[Dict]: Decoded token payload or None if invalid
    """
    try:
        logger.info(f"Decoding token with SECRET_KEY: {settings.SECRET_KEY[:10]}... and ALGORITHM: {settings.ALGORITHM}")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        logger.info(f"Token decoded successfully: {payload}")
        return payload
    except JWTError as e:
        logger.error(f"JWT decode error: {type(e).__name__}: {str(e)}")
        return None
