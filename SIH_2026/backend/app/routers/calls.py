"""
Calls Router
Handles call history and session information
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone

from app.database import get_db
from app.models.user import User
from app.models.call_history import CallHistory
from app.schemas.call import CallHistoryResponse, CallHistoryCreate
from app.auth.dependencies import get_current_active_user

router = APIRouter()


def ensure_utc_timestamp(dt):
    """Ensure datetime is timezone-aware UTC for JSON serialization"""
    if dt is None:
        return None
    # If naive datetime (no timezone info), assume it's UTC
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    # If already timezone-aware, convert to UTC
    return dt.astimezone(timezone.utc)


@router.post("/history", status_code=status.HTTP_201_CREATED)
async def create_call_history(
    call_data: CallHistoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Create a new call history record
    
    - **call_id**: Unique call identifier
    - **callee_id**: ID of the user who was called
    - **started_at**: When the call started
    - **ended_at**: When the call ended
    - **duration_seconds**: Call duration in seconds
    - **call_status**: Call status (completed, rejected, failed)
    """
    # Create new call history record
    new_call = CallHistory(
        id=call_data.call_id,
        caller_id=current_user.id,
        callee_id=call_data.callee_id,
        started_at=call_data.started_at,
        ended_at=call_data.ended_at,
        duration_seconds=call_data.duration_seconds,
        status=call_data.call_status,
        risk_level=None,  # Will be set by voice analysis later
        risk_score=None
    )
    
    db.add(new_call)
    db.commit()
    db.refresh(new_call)
    
    return {
        "message": "Call history saved",
        "call_id": call_data.call_id,
        "duration_seconds": call_data.duration_seconds
    }


@router.get("/history", response_model=List[CallHistoryResponse])
async def get_call_history(
    limit: int = 50,
    offset: int = 0,
    risk_level: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get call history for current user with contact information
    
    - **limit**: Maximum number of records to return (default: 50)
    - **offset**: Number of records to skip (default: 0)
    - **risk_level**: Filter by risk level (LOW, MEDIUM, HIGH)
    
    Returns calls where user was either caller or callee, enriched with contact info
    """
    query = db.query(CallHistory).filter(
        (CallHistory.caller_id == current_user.id) | 
        (CallHistory.callee_id == current_user.id)
    )
    
    # Filter by risk level if provided
    if risk_level:
        query = query.filter(CallHistory.risk_level == risk_level.upper())
    
    # Order by most recent first
    query = query.order_by(CallHistory.ended_at.desc())
    
    # Apply pagination
    calls = query.offset(offset).limit(limit).all()
    
    # Enrich with contact information
    enriched_calls = []
    for call in calls:
        # Determine the "other" person (not current user)
        if call.caller_id == current_user.id:
            # Current user is caller, get callee info
            other_user_id = call.callee_id
        else:
            # Current user is callee, get caller info
            other_user_id = call.caller_id
        
        # Get other user's details
        other_user = db.query(User).filter(User.id == other_user_id).first()
        
        # FIX: Ensure timestamps are timezone-aware UTC before JSON serialization
        call_dict = {
            "id": call.id,
            "caller_id": call.caller_id,
            "callee_id": call.callee_id,
            "started_at": ensure_utc_timestamp(call.started_at),
            "ended_at": ensure_utc_timestamp(call.ended_at),
            "duration_seconds": call.duration_seconds,
            "status": call.status,
            "risk_level": call.risk_level,
            "risk_score": call.risk_score,
            "created_at": ensure_utc_timestamp(call.created_at),
            "contact_name": other_user.full_name if other_user else "Unknown",
            "contact_email": other_user.email if other_user else "unknown@example.com",
            "contact_id": other_user_id,
        }
        enriched_calls.append(call_dict)
    
    return enriched_calls


@router.get("/{call_id}", response_model=CallHistoryResponse)
async def get_call_by_id(
    call_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get specific call details by call_id
    
    Returns complete call history record including risk analysis
    """
    call = db.query(CallHistory).filter(CallHistory.id == call_id).first()
    
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found"
        )
    
    # Verify user was participant in this call
    if call.caller_id != current_user.id and call.callee_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this call record"
        )
    
    return call


@router.get("/stats/summary")
async def get_call_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Get call statistics summary for current user
    
    Returns:
    - Total calls
    - Calls by risk level (LOW, MEDIUM, HIGH)
    - Average call duration
    """
    # Get all calls for user
    calls = db.query(CallHistory).filter(
        (CallHistory.caller_id == current_user.id) | 
        (CallHistory.callee_id == current_user.id)
    ).all()
    
    total_calls = len(calls)
    
    # Count by risk level
    low_risk = sum(1 for call in calls if call.risk_level == "LOW")
    medium_risk = sum(1 for call in calls if call.risk_level == "MEDIUM")
    high_risk = sum(1 for call in calls if call.risk_level == "HIGH")
    
    # Calculate average duration
    durations = [call.duration_seconds for call in calls if call.duration_seconds]
    avg_duration = sum(durations) / len(durations) if durations else 0
    
    return {
        "total_calls": total_calls,
        "by_risk_level": {
            "LOW": low_risk,
            "MEDIUM": medium_risk,
            "HIGH": high_risk
        },
        "average_duration": int(avg_duration)
    }


@router.delete("/{call_id}")
async def delete_call_history(
    call_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete a call history record
    
    Only the caller can delete the call record
    """
    call = db.query(CallHistory).filter(CallHistory.id == call_id).first()
    
    if not call:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Call not found"
        )
    
    # Only caller can delete
    if call.caller_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the caller can delete this record"
        )
    
    db.delete(call)
    db.commit()
    
    return {
        "message": "Call history deleted",
        "call_id": call_id
    }
