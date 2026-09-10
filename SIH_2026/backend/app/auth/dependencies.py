"""
Authentication Dependencies
FastAPI dependencies for protected routes
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import logging

from app.database import get_db
from app.models.user import User
from app.auth.security import decode_access_token


# HTTP Bearer token security scheme
security = HTTPBearer()
logger = logging.getLogger(__name__)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Get the current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Authorization credentials (Bearer token)
        db: Database session
        
    Returns:
        User: Authenticated user object
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Extract token
    token = credentials.credentials
    logger.info(f"Attempting to decode token: {token[:20]}...")
    
    # Decode token
    payload = decode_access_token(token)
    if payload is None:
        logger.error("Token decode failed - payload is None")
        raise credentials_exception
    
    logger.info(f"Token decoded successfully. Payload: {payload}")
    
    # Get user_id from token
    user_id: str = payload.get("sub")
    if user_id is None:
        logger.error("No 'sub' field in token payload")
        raise credentials_exception
    
    logger.info(f"Looking up user with ID: {user_id}")
    
    # Get user from database
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        logger.error(f"User with ID {user_id} not found in database")
        raise credentials_exception
    
    logger.info(f"User found: {user.email}")
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get the current authenticated and active user.
    
    Args:
        current_user: Current user from get_current_user
        
    Returns:
        User: Active user object
        
    Raises:
        HTTPException: If user is not active
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    return current_user
