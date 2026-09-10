"""
Call History Service
Service layer for managing call history persistence and retrieval

This module provides CallHistoryService which handles the creation and retrieval
of call history records in the database. It integrates with CallSession in-memory
objects to persist completed call data along with risk analysis results.

Requirements Satisfied:
- 8.1: Create call history records when calls end
- 8.2: Store caller ID, callee ID, start time, end time, duration, and final call state
- 8.3: Store risk analysis results including risk level, risk score, and detailed indicators
- 8.4: Associate call participants with call history records via foreign keys
- 8.5: Create call history records for rejected/failed calls with zero duration
"""

from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import or_
import logging

from app.models.call_history import CallHistory
from app.models.call_session import CallSession

logger = logging.getLogger(__name__)


class CallHistoryService:
    """
    Service for persisting and retrieving call history records.
    
    This service provides methods to:
    - Create call history records from completed CallSession objects
    - Retrieve call history for users
    - Handle database errors gracefully
    
    Requirements Satisfied:
        - 8.1: Create call history record when call ends
        - 8.2: Store complete call metadata
        - 8.3: Store risk analysis results
        - 8.4: Foreign key associations to users
        - 8.5: Handle rejected/failed calls
    """
    
    def __init__(self, db: Session):
        """
        Initialize CallHistoryService with database session.
        
        Args:
            db: SQLAlchemy database session
        """
        self.db = db
    
    async def create_call_record(
        self,
        call_session: CallSession,
        final_risk_level: Optional[str] = None,
        final_risk_score: Optional[int] = None
    ) -> Optional[CallHistory]:
        """
        Create a call history record from a completed call session.
        
        This method persists call metadata and risk analysis results to the database.
        It handles both successful calls (with duration) and failed/rejected calls
        (with zero duration).
        
        Args:
            call_session: The CallSession object containing call metadata
            final_risk_level: The last known risk level (LOW/MEDIUM/HIGH), optional
            final_risk_score: The last known risk score (0-100), optional
        
        Returns:
            CallHistory: The created database record, or None if creation failed
        
        Raises:
            No exceptions are raised; errors are logged and None is returned
        
        Requirements Satisfied:
            - 8.1: Create call history record with call data
            - 8.2: Store timing, duration, and participants
            - 8.3: Store risk analysis results
            - 8.4: Foreign key constraints to users table
            - 8.5: Zero duration for rejected/failed calls
        """
        try:
            # Use risk data from call_session if not provided explicitly
            if final_risk_level is None and call_session.final_risk_level:
                final_risk_level = call_session.final_risk_level
            if final_risk_score is None and call_session.final_risk_score:
                final_risk_score = call_session.final_risk_score
            
            # Determine call status for database
            # Map CallState to database-friendly status
            status_mapping = {
                "initiating": "failed",
                "ringing": "failed",
                "accepted": "failed",
                "connected": "completed",
                "ended": "completed",
                "rejected": "rejected",
                "failed": "failed",
            }
            db_status = status_mapping.get(call_session.status, "failed")
            
            # Create CallHistory record
            call_history = CallHistory(
                id=call_session.call_id,
                caller_id=call_session.caller_id,
                callee_id=call_session.callee_id,
                started_at=call_session.started_at,
                ended_at=call_session.ended_at,
                duration_seconds=call_session.calculate_duration(),
                status=db_status,
                risk_level=final_risk_level,
                risk_score=final_risk_score
            )
            
            # Add to database
            self.db.add(call_history)
            self.db.commit()
            self.db.refresh(call_history)
            
            logger.info(
                f"Created call history record: call_id={call_history.id}, "
                f"caller_id={call_history.caller_id}, callee_id={call_history.callee_id}, "
                f"duration={call_history.duration_seconds}s, status={call_history.status}, "
                f"risk_level={call_history.risk_level}"
            )
            
            return call_history
            
        except IntegrityError as e:
            # Handle foreign key violations or unique constraint violations
            self.db.rollback()
            logger.error(
                f"IntegrityError creating call history for call_id={call_session.call_id}: {e}"
            )
            return None
            
        except Exception as e:
            # Handle any other database errors
            self.db.rollback()
            logger.error(
                f"Error creating call history for call_id={call_session.call_id}: {e}",
                exc_info=True
            )
            return None
    
    async def get_user_call_history(
        self,
        user_id: int,
        limit: int = 50
    ) -> List[CallHistory]:
        """
        Retrieve call history for a user.
        
        Returns all calls where the user was either the caller or the callee,
        ordered by most recent first.
        
        Args:
            user_id: Database ID of the user
            limit: Maximum number of records to return (default: 50)
        
        Returns:
            List of CallHistory records ordered by started_at descending
        
        Requirements Satisfied:
            - 8.2: Retrieve call history with participant information
            - 8.3: Include risk analysis results in retrieved records
            - 8.4: Query using foreign key relationships
        """
        try:
            query = (
                self.db.query(CallHistory)
                .filter(
                    or_(
                        CallHistory.caller_id == user_id,
                        CallHistory.callee_id == user_id
                    )
                )
                .order_by(CallHistory.started_at.desc())
                .limit(limit)
            )
            
            call_history = query.all()
            
            logger.info(
                f"Retrieved {len(call_history)} call history records for user_id={user_id}"
            )
            
            return call_history
            
        except Exception as e:
            logger.error(
                f"Error retrieving call history for user_id={user_id}: {e}",
                exc_info=True
            )
            return []
