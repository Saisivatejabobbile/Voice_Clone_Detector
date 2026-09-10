"""
Call Session Manager
Manages active call sessions in memory

This module provides centralized management of active call sessions,
tracking state transitions, timing, and participants.

Requirements Satisfied:
- 1.3: Cleanup active call sessions on disconnect
- 7.1: Track call states
- 7.2: State transition updates  
- 7.3: Record timestamps
- 7.4: Calculate duration
"""

from typing import Dict, Optional, List
import logging
from datetime import datetime

from app.models.call_session import CallSession, CallState

logger = logging.getLogger(__name__)


class CallSessionManager:
    """
    Manages active call sessions in memory
    
    Provides centralized tracking of ongoing calls with state management,
    participant tracking, and cleanup capabilities.
    """
    
    def __init__(self):
        # call_id → CallSession
        self.active_sessions: Dict[str, CallSession] = {}
        
        # user_id → List[call_id] for quick lookup
        self.user_calls: Dict[int, List[str]] = {}
    
    def create_session(
        self,
        call_id: str,
        caller_id: int,
        callee_id: int,
        caller_name: str,
        callee_name: str
    ) -> CallSession:
        """
        Create a new call session
        
        Args:
            call_id: Unique call identifier
            caller_id: Database ID of caller
            callee_id: Database ID of callee
            caller_name: Display name of caller
            callee_name: Display name of callee
            
        Returns:
            CallSession: Created session object
        """
        session = CallSession(
            call_id=call_id,
            caller_id=caller_id,
            callee_id=callee_id,
            caller_name=caller_name,
            callee_name=callee_name
        )
        
        self.active_sessions[call_id] = session
        
        # Track user associations
        if caller_id not in self.user_calls:
            self.user_calls[caller_id] = []
        self.user_calls[caller_id].append(call_id)
        
        if callee_id not in self.user_calls:
            self.user_calls[callee_id] = []
        self.user_calls[callee_id].append(call_id)
        
        logger.info(f"Created call session: {call_id} ({caller_name} → {callee_name})")
        return session
    
    def get_session(self, call_id: str) -> Optional[CallSession]:
        """
        Get call session by ID
        
        Args:
            call_id: Call identifier
            
        Returns:
            CallSession or None if not found
        """
        return self.active_sessions.get(call_id)
    
    def update_session_status(self, call_id: str, status: str):
        """
        Update call session status
        
        Args:
            call_id: Call identifier
            status: New status (initiating, ringing, accepted, connected, ended, rejected, failed)
        """
        session = self.get_session(call_id)
        if not session:
            logger.warning(f"Cannot update status: Call {call_id} not found")
            return
        
        old_status = session.status
        session.set_state(CallState(status))
        logger.info(f"Call {call_id} status: {old_status} → {status}")
    
    def end_session(self, call_id: str) -> Optional[CallSession]:
        """
        End a call session and return it for persistence
        
        Args:
            call_id: Call identifier
            
        Returns:
            CallSession: The ended session, or None if not found
        """
        session = self.active_sessions.get(call_id)
        if not session:
            logger.warning(f"Cannot end session: Call {call_id} not found")
            return None
        
        # Set ended state
        if session.state not in [CallState.ENDED, CallState.REJECTED, CallState.FAILED]:
            session.set_state(CallState.ENDED)
        
        # Remove from active sessions
        del self.active_sessions[call_id]
        
        # Remove from user tracking
        for user_id in [session.caller_id, session.callee_id]:
            if user_id in self.user_calls:
                if call_id in self.user_calls[user_id]:
                    self.user_calls[user_id].remove(call_id)
                
                # Clean up empty lists
                if not self.user_calls[user_id]:
                    del self.user_calls[user_id]
        
        logger.info(f"Ended call session: {call_id} (duration: {session.calculate_duration()}s)")
        return session
    
    def cleanup_user_sessions(self, user_id: int) -> List[CallSession]:
        """
        Cleanup all sessions for a disconnected user
        
        Args:
            user_id: User ID that disconnected
            
        Returns:
            List of ended CallSession objects
        """
        if user_id not in self.user_calls:
            return []
        
        # Get all calls for this user
        call_ids = list(self.user_calls[user_id])
        ended_sessions = []
        
        for call_id in call_ids:
            session = self.get_session(call_id)
            if session:
                # Mark as failed (unexpected disconnect)
                session.set_state(CallState.FAILED)
                ended_session = self.end_session(call_id)
                if ended_session:
                    ended_sessions.append(ended_session)
        
        logger.info(f"Cleaned up {len(ended_sessions)} sessions for user {user_id}")
        return ended_sessions
    
    def get_user_sessions(self, user_id: int) -> List[CallSession]:
        """
        Get all active sessions for a user
        
        Args:
            user_id: User ID
            
        Returns:
            List of CallSession objects
        """
        if user_id not in self.user_calls:
            return []
        
        sessions = []
        for call_id in self.user_calls[user_id]:
            session = self.get_session(call_id)
            if session:
                sessions.append(session)
        
        return sessions
    
    def get_all_sessions(self) -> List[CallSession]:
        """
        Get all active sessions
        
        Returns:
            List of all CallSession objects
        """
        return list(self.active_sessions.values())
    
    def get_stats(self) -> dict:
        """
        Get statistics about active sessions
        
        Returns:
            dict with session counts by state
        """
        stats = {
            "total": len(self.active_sessions),
            "by_state": {}
        }
        
        for session in self.active_sessions.values():
            state = session.status
            stats["by_state"][state] = stats["by_state"].get(state, 0) + 1
        
        return stats


# Global session manager instance
session_manager = CallSessionManager()
