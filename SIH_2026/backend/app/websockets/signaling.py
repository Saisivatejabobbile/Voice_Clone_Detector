"""
WebRTC Signaling WebSocket
Handles real-time call signaling between peers
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional
import logging
import json
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.call_session import CallSession, CallState
from app.auth.security import decode_access_token
from app.websockets.connection_manager import signaling_manager, ConnectionManager
from app.services.call_session_manager import session_manager, CallSessionManager
from app.services.call_history import CallHistoryService

router = APIRouter()
logger = logging.getLogger(__name__)


async def get_current_user_ws(
    token: str = Query(...),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Get current user from WebSocket token query parameter
    
    Args:
        token: JWT token from query string
        db: Database session
        
    Returns:
        User object or None if invalid
    """
    payload = decode_access_token(token)
    if not payload:
        return None
    
    user_id = payload.get("sub")
    if not user_id:
        return None
    
    user = db.query(User).filter(User.id == int(user_id)).first()
    return user


async def handle_signaling_message(
    user_id: int,
    message: dict,
    connection_manager: ConnectionManager,
    session_manager: CallSessionManager,
    db: Session
) -> None:
    """
    Route signaling messages between peers with validation.
    
    Handles all WebRTC signaling message types and manages call session state.
    Validates that target users are online before forwarding messages.
    
    Supported message types:
    - call_initiate: Start new call
    - call_accept: Accept incoming call
    - call_reject: Reject incoming call
    - sdp_offer: WebRTC SDP offer
    - sdp_answer: WebRTC SDP answer
    - ice_candidate: ICE candidate for NAT traversal
    - hangup: End active call
    
    Requirements Satisfied:
    - 1.5: Route signaling messages between authenticated peers
    - 2.4: Create SDP offer and send to signaling server
    - 2.5: Verify callee is online before forwarding call
    - 2.6: Send error if callee is offline
    - 3.4: Send call acceptance message
    - 3.5: Send call rejection message
    - 6.3: Send hangup message
    - 6.4: Close peer connection and stop streams
    - 6.5: Handle received hangup message
    
    Args:
        user_id: ID of the user sending the message
        message: Message dict containing type and message-specific data
        connection_manager: Manager for WebSocket connections
        session_manager: Manager for call sessions
        db: Database session
    """
    message_type = message.get("type")
    logger.info(f"Routing message from user {user_id}: {message_type}")
    
    try:
        # Route to appropriate handler based on message type
        if message_type == "call_initiate":
            await _handle_call_initiate_routing(user_id, message, connection_manager, session_manager, db)
        
        elif message_type == "call_accept":
            await _handle_call_accept_routing(user_id, message, connection_manager, session_manager)
        
        elif message_type == "call_reject":
            await _handle_call_reject_routing(user_id, message, connection_manager, session_manager)
        
        elif message_type == "sdp_offer":
            await _handle_sdp_routing(user_id, message, "sdp_offer", connection_manager, session_manager)
        
        elif message_type == "sdp_answer":
            await _handle_sdp_routing(user_id, message, "sdp_answer", connection_manager, session_manager)
        
        elif message_type == "ice_candidate":
            await _handle_ice_candidate_routing(user_id, message, connection_manager, session_manager)
        
        elif message_type == "hangup":
            await _handle_hangup_routing(user_id, message, connection_manager, session_manager, db)
        
        else:
            logger.warning(f"Unknown message type received from user {user_id}: {message_type}")
            await connection_manager.send_personal_message({
                "type": "error",
                "message": f"Unknown message type: {message_type}"
            }, user_id)
    
    except Exception as e:
        logger.error(f"Error handling signaling message from user {user_id}: {e}", exc_info=True)
        await connection_manager.send_personal_message({
            "type": "error",
            "message": "Internal server error processing message"
        }, user_id)


async def _handle_call_initiate_routing(
    caller_id: int,
    message: dict,
    connection_manager: ConnectionManager,
    session_manager: CallSessionManager,
    db: Session
) -> None:
    """Handle call initiation routing with validation."""
    call_id = message.get("call_id")
    callee_id = message.get("callee_id")
    
    if not call_id or not callee_id:
        logger.error(f"Missing call_id or callee_id in call_initiate from user {caller_id}")
        await connection_manager.send_personal_message({
            "type": "error",
            "message": "Missing required fields: call_id, callee_id"
        }, caller_id)
        return
    
    # Validate target user is online
    if not connection_manager.is_user_connected(callee_id):
        logger.warning(f"Call initiation failed: User {callee_id} is offline")
        await connection_manager.send_personal_message({
            "type": "call_failed",
            "call_id": call_id,
            "reason": "user_offline",
            "message": "Target user is not online"
        }, caller_id)
        return
    
    # Get user info from database
    caller = db.query(User).filter(User.id == caller_id).first()
    callee = db.query(User).filter(User.id == callee_id).first()
    
    if not caller or not callee:
        logger.error(f"User not found: caller={caller_id}, callee={callee_id}")
        await connection_manager.send_personal_message({
            "type": "error",
            "message": "User not found"
        }, caller_id)
        return
    
    # Create call session
    call_session = session_manager.create_session(
        call_id=call_id,
        caller_id=caller_id,
        callee_id=callee_id,
        caller_name=caller.full_name,
        callee_name=callee.full_name
    )
    call_session.set_state(CallState.RINGING)
    
    logger.info(f"Call initiated: {caller.full_name} → {callee.full_name} (ID: {call_id})")
    
    # Forward call initiation to callee
    await connection_manager.send_personal_message({
        "type": "incoming_call",
        "call_id": call_id,
        "from": caller_id,
        "caller_name": caller.full_name,
        "caller_email": caller.email
    }, callee_id)


async def _handle_call_accept_routing(
    callee_id: int,
    message: dict,
    connection_manager: ConnectionManager,
    session_manager: CallSessionManager
) -> None:
    """Handle call acceptance routing."""
    call_id = message.get("call_id")
    
    if not call_id:
        logger.error(f"Missing call_id in call_accept from user {callee_id}")
        return
    
    call_session = session_manager.get_session(call_id)
    if not call_session:
        logger.error(f"Call session {call_id} not found for acceptance")
        await connection_manager.send_personal_message({
            "type": "error",
            "message": "Call session not found"
        }, callee_id)
        return
    
    # Update call session status
    session_manager.update_session_status(call_id, CallState.ACCEPTED.value)
    
    # Validate caller is still online
    if not connection_manager.is_user_connected(call_session.caller_id):
        logger.warning(f"Caller {call_session.caller_id} is no longer online")
        await connection_manager.send_personal_message({
            "type": "call_failed",
            "call_id": call_id,
            "reason": "caller_offline"
        }, callee_id)
        session_manager.end_session(call_id)
        return
    
    logger.info(f"Call {call_id} accepted by user {callee_id}")
    
    # Forward acceptance to caller
    await connection_manager.send_personal_message({
        "type": "call_accepted",
        "call_id": call_id,
        "by": callee_id
    }, call_session.caller_id)


async def _handle_call_reject_routing(
    callee_id: int,
    message: dict,
    connection_manager: ConnectionManager,
    session_manager: CallSessionManager
) -> None:
    """Handle call rejection routing."""
    call_id = message.get("call_id")
    
    if not call_id:
        logger.error(f"Missing call_id in call_reject from user {callee_id}")
        return
    
    call_session = session_manager.get_session(call_id)
    if not call_session:
        logger.warning(f"Call session {call_id} not found for rejection")
        return
    
    # Update call session status
    session_manager.update_session_status(call_id, CallState.REJECTED.value)
    
    logger.info(f"Call {call_id} rejected by user {callee_id}")
    
    # Forward rejection to caller (if still online)
    if connection_manager.is_user_connected(call_session.caller_id):
        await connection_manager.send_personal_message({
            "type": "call_rejected",
            "call_id": call_id,
            "by": callee_id
        }, call_session.caller_id)
    
    # End the session
    session_manager.end_session(call_id)


async def _handle_sdp_routing(
    user_id: int,
    message: dict,
    message_type: str,
    connection_manager: ConnectionManager,
    session_manager: CallSessionManager
) -> None:
    """Handle SDP offer/answer routing."""
    call_id = message.get("call_id")
    target_user_id = message.get("to")
    sdp = message.get("sdp")
    
    if not call_id or not target_user_id or not sdp:
        logger.error(f"Missing required fields in {message_type} from user {user_id}")
        await connection_manager.send_personal_message({
            "type": "error",
            "message": f"Missing required fields: call_id, to, sdp"
        }, user_id)
        return
    
    call_session = session_manager.get_session(call_id)
    if not call_session:
        logger.warning(f"Call session {call_id} not found for {message_type}")
        await connection_manager.send_personal_message({
            "type": "error",
            "message": "Call session not found"
        }, user_id)
        return
    
    # Validate target user is online
    if not connection_manager.is_user_connected(target_user_id):
        logger.warning(f"Target user {target_user_id} is offline for {message_type}")
        await connection_manager.send_personal_message({
            "type": "call_failed",
            "call_id": call_id,
            "reason": "peer_offline"
        }, user_id)
        return
    
    # Update session state if this is an answer
    if message_type == "sdp_answer":
        session_manager.update_session_status(call_id, CallState.CONNECTED.value)
    
    logger.debug(f"Forwarding {message_type} from {user_id} to {target_user_id}")
    
    # Forward SDP to target user
    await connection_manager.send_personal_message({
        "type": message_type,
        "call_id": call_id,
        "from": user_id,
        "sdp": sdp
    }, target_user_id)


async def _handle_ice_candidate_routing(
    user_id: int,
    message: dict,
    connection_manager: ConnectionManager,
    session_manager: CallSessionManager
) -> None:
    """Handle ICE candidate routing."""
    call_id = message.get("call_id")
    target_user_id = message.get("to")
    candidate = message.get("candidate")
    
    if not call_id or not target_user_id:
        logger.error(f"Missing required fields in ice_candidate from user {user_id}")
        return
    
    call_session = session_manager.get_session(call_id)
    if not call_session:
        logger.debug(f"Call session {call_id} not found for ICE candidate (may have ended)")
        return
    
    # Validate target user is online
    if not connection_manager.is_user_connected(target_user_id):
        logger.debug(f"Target user {target_user_id} is offline, skipping ICE candidate")
        return
    
    logger.debug(f"Forwarding ICE candidate from {user_id} to {target_user_id}")
    
    # Forward ICE candidate to target user
    await connection_manager.send_personal_message({
        "type": "ice_candidate",
        "call_id": call_id,
        "from": user_id,
        "candidate": candidate
    }, target_user_id)


async def _handle_hangup_routing(
    user_id: int,
    message: dict,
    connection_manager: ConnectionManager,
    session_manager: CallSessionManager,
    db: Session
) -> None:
    """Handle hangup routing."""
    call_id = message.get("call_id")
    
    if not call_id:
        logger.error(f"Missing call_id in hangup from user {user_id}")
        return
    
    call_session = session_manager.get_session(call_id)
    if not call_session:
        logger.warning(f"Call session {call_id} not found for hangup")
        return
    
    # Update call session status
    session_manager.update_session_status(call_id, CallState.ENDED.value)
    
    # Determine the other peer
    other_user_id = (
        call_session.callee_id if call_session.caller_id == user_id
        else call_session.caller_id
    )
    
    logger.info(f"Call {call_id} ended by user {user_id}")
    
    # Forward hangup to other peer (if still online)
    if connection_manager.is_user_connected(other_user_id):
        await connection_manager.send_personal_message({
            "type": "hangup",
            "call_id": call_id,
            "by": user_id
        }, other_user_id)
    
    # Save call history before ending session
    call_history_service = CallHistoryService(db)
    final_session = session_manager.end_session(call_id)
    
    if final_session:
        # Extract final risk data from call session (if available)
        final_risk_level = getattr(final_session, 'final_risk_level', None)
        final_risk_score = getattr(final_session, 'final_risk_score', None)
        
        # Create call history record
        result = await call_history_service.create_call_record(
            call_session=final_session,
            final_risk_level=final_risk_level,
            final_risk_score=final_risk_score
        )
        
        if result:
            logger.info(f"Call history saved for {call_id}: duration={result.duration_seconds}s, risk={result.risk_level}")
        else:
            logger.error(f"Failed to save call history for {call_id}")



@router.websocket("/ws/signaling")
async def websocket_signaling(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebRTC Signaling WebSocket Endpoint
    
    Handles all WebRTC signaling messages:
    - call_initiate: Start a call
    - call_accept: Accept incoming call
    - call_reject: Reject incoming call
    - offer: WebRTC SDP offer
    - answer: WebRTC SDP answer
    - ice_candidate: ICE candidate
    - hangup: End call
    
    Connect: ws://localhost:8000/ws/signaling?token=YOUR_JWT_TOKEN
    """
    
    # Authenticate user
    user = await get_current_user_ws(token, db)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        logger.warning("WebSocket connection rejected: Invalid token")
        return
    
    # Connect user
    await signaling_manager.connect(websocket, user.id, {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email
    })
    
    # Update user online status
    user.is_online = True
    db.commit()
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Route message using centralized handler
            await handle_signaling_message(
                user_id=user.id,
                message=message,
                connection_manager=signaling_manager,
                session_manager=session_manager,
                db=db
            )
    
    except WebSocketDisconnect:
        logger.info(f"User {user.id} disconnected from signaling")
    
    except Exception as e:
        logger.error(f"Error in WebSocket for user {user.id}: {e}")
    
    finally:
        # Cleanup on disconnect
        signaling_manager.disconnect(user.id)
        
        # Update user online status
        user.is_online = False
        user.last_seen = datetime.utcnow()
        db.commit()
        
        # Clean up any active calls for this user
        ended_sessions = session_manager.cleanup_user_sessions(user.id)
        
        # Save call history and notify peers of unexpected disconnect
        call_history_service = CallHistoryService(db)
        
        for call_session in ended_sessions:
            # Save call history with 'failed' status (unexpected disconnect)
            try:
                result = await call_history_service.create_call_record(
                    call_session=call_session,
                    final_risk_level=getattr(call_session, 'final_risk_level', None),
                    final_risk_score=getattr(call_session, 'final_risk_score', None)
                )
                if result:
                    logger.info(f"Call history saved for disconnected call {call_session.call_id}: duration={result.duration_seconds}s")
            except Exception as e:
                logger.error(f"Failed to save call history for {call_session.call_id} on disconnect: {e}")
            
            # Notify the other participant
            other_user_id = (
                call_session.callee_id if call_session.caller_id == user.id
                else call_session.caller_id
            )
            
            if signaling_manager.is_user_connected(other_user_id):
                await signaling_manager.send_personal_message({
                    "type": "hangup",
                    "call_id": call_session.call_id,
                    "reason": "peer_disconnected"
                }, other_user_id)
