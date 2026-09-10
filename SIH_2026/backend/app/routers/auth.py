"""
Authentication Router
Handles user registration, login, and token management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin, UserResponse, Token
from app.auth.security import verify_password, get_password_hash, create_access_token
from app.auth.dependencies import get_current_active_user
from app.config import settings

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user
    
    - **full_name**: User's full name
    - **email**: Valid email address (must be unique)
    - **password**: Password (min 8 characters)
    
    Returns the created user object and stores hashed password
    """
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        is_active=True,
        is_verified=False,
        is_online=False,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """
    Login with email and password
    
    - **email**: User's email
    - **password**: User's password
    
    Returns JWT access token and user object on success
    """
    # Find user by email
    user = db.query(User).filter(User.email == credentials.email).first()
    
    # Verify user exists and password is correct
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )
    
    # Update user online status
    user.is_online = True
    db.commit()
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }


@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Logout current user
    
    Updates user's online status to offline.
    Note: JWT tokens are stateless, so client must discard the token.
    """
    current_user.is_online = False
    db.commit()
    
    return {
        "message": "Successfully logged out"
    }


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get current authenticated user's information
    
    Returns complete user profile for the authenticated user
    """
    return current_user


@router.get("/verify")
async def verify_token(
    current_user: User = Depends(get_current_active_user)
):
    """
    Verify if current token is valid
    
    Returns user_id if token is valid
    Useful for frontend to check auth state
    """
    return {
        "valid": True,
        "user_id": current_user.id,
        "email": current_user.email
    }
