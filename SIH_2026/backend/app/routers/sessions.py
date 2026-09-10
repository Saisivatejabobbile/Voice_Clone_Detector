"""
Session Management Router
Handles active sessions and logout operations
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session as DBSession
from typing import List
from datetime import datetime
import secrets

from app.database import get_db
from app.models.user import User
from app.models.session import Session
from app.schemas.session import SessionResponse, LogoutAllResponse
from app.auth.dependencies import get_current_active_user

router = APIRouter()


def get_device_info(user_agent: str) -> str:
    """Extract device info from user agent"""
    ua_lower = user_agent.lower()
    
    # Detect OS
    if 'windows' in ua_lower:
        os = 'Windows'
    elif 'mac' in ua_lower or 'darwin' in ua_lower:
        os = 'macOS'
    elif 'linux' in ua_lower:
        os = 'Linux'
    elif 'android' in ua_lower:
        os = 'Android'
    elif 'iphone' in ua_lower or 'ipad' in ua_lower:
        os = 'iOS'
    else:
        os = 'Unknown'
    
    # Detect Browser
    if 'chrome' in ua_lower and 'edg' not in ua_lower:
        browser = 'Chrome'
    elif 'firefox' in ua_lower:
        browser = 'Firefox'
    elif 'safari' in ua_lower and 'chrome' not in ua_lower:
        browser = 'Safari'
    elif 'edg' in ua_lower:
        browser = 'Edge'
    else:
        browser = 'Browser'
    
    return f"{browser} on {os}"


@router.get("/sessions", response_model=List[SessionResponse])
async def get_active_sessions(
    request: Request,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get all active sessions for current user
    """
    # Get current session ID from Authorization header
    auth_header = request.headers.get("Authorization", "")
    current_token = auth_header.replace("Bearer ", "") if auth_header else None
    
    # Get all sessions for user
    sessions = db.query(Session).filter(
        Session.user_id == current_user.id
    ).order_by(Session.last_activity.desc()).all()
    
    # Mark current session
    session_list = []
    for sess in sessions:
        session_dict = {
            "session_id": sess.session_id,
            "user_id": sess.user_id,
            "device_info": sess.device_info or "Unknown Device",
            "ip_address": sess.ip_address or "Unknown",
            "user_agent": sess.user_agent or "",
            "created_at": sess.created_at,
            "last_activity": sess.last_activity,
            "is_current": sess.session_id == current_token
        }
        session_list.append(SessionResponse(**session_dict))
    
    return session_list


@router.delete("/sessions/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def logout_session(
    session_id: str,
    request: Request,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Logout a specific session
    """
    # Find session
    session = db.query(Session).filter(
        Session.session_id == session_id,
        Session.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Delete session
    db.delete(session)
    db.commit()
    
    return None


@router.post("/sessions/logout-all", response_model=LogoutAllResponse)
async def logout_all_devices(
    request: Request,
    db: DBSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Logout from all devices except current
    """
    # Get current session ID
    auth_header = request.headers.get("Authorization", "")
    current_token = auth_header.replace("Bearer ", "") if auth_header else None
    
    # Delete all sessions except current
    query = db.query(Session).filter(
        Session.user_id == current_user.id
    )
    
    if current_token:
        query = query.filter(Session.session_id != current_token)
    
    sessions_count = query.count()
    query.delete(synchronize_session=False)
    db.commit()
    
    return LogoutAllResponse(
        message=f"Logged out from {sessions_count} device(s)",
        sessions_terminated=sessions_count
    )


def create_session(
    db: DBSession,
    user_id: int,
    token: str,
    ip_address: str,
    user_agent: str
):
    """
    Helper function to create a new session
    """
    device_info = get_device_info(user_agent)
    
    # Check if session already exists
    existing = db.query(Session).filter(
        Session.session_id == token
    ).first()
    
    if existing:
        # Update last activity
        existing.last_activity = datetime.utcnow()
        db.commit()
        return existing
    
    # Create new session
    new_session = Session(
        session_id=token,
        user_id=user_id,
        device_info=device_info,
        ip_address=ip_address,
        user_agent=user_agent
    )
    
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    
    return new_session
