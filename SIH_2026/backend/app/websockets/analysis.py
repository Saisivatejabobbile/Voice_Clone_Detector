"""
Audio Analysis WebSocket
Receives PCM audio chunks and broadcasts AI risk analysis
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Optional, Dict
import logging
import json
import asyncio
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.auth.security import decode_access_token
from app.services.audio_buffer import AudioBuffer
from app.services.audio_pipeline import process_audio_chunk, cleanup_call_buffer
from app.services.ai_model_client import get_ai_client
from app.services.risk_engine import get_risk_engine
# Lazy import: signaling_manager imported in handle_audio_chunk

router = APIRouter()
logger = logging.getLogger(__name__)


# Track active analysis sessions
# call_id → {"caller_ws": WebSocket, "callee_ws": WebSocket, "analysis_count": int}
active_analysis_sessions: Dict[str, dict] = {}

# Track audio buffers for active calls
# call_id → AudioBuffer instance
audio_buffers: Dict[str, AudioBuffer] = {}


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


@router.websocket("/ws/analysis")
async def websocket_analysis(
    websocket: WebSocket,
    token: str = Query(...),
    call_id: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Audio Analysis WebSocket Endpoint
    
    Receives PCM audio chunks from frontend and broadcasts risk analysis.
    
    Messages from client:
    {
        "type": "audio_chunk",
        "call_id": "call-123",
        "audio_data": [base64 encoded PCM data or array]
    }
    
    Messages to client:
    {
        "type": "risk_update",
        "call_id": "call-123",
        "risk_level": "LOW|MEDIUM|HIGH",
        "risk_score": 15.5,
        "synthetic_confidence": 10.2,
        "model_confidence": 95.8,
        "recommendation": "...",
        "acoustic_indicators": {...},
        "prosody_indicators": {...},
        "timestamp": "2025-01-15T10:30:00Z"
    }
    
    {
        "type": "analysis_status",
        "state": "ANALYZING|IDLE|ERROR",
        "message": "Processing audio..."
    }
    
    Connect: ws://localhost:8000/ws/analysis?token=JWT&call_id=call-123
    """
    
    # Authenticate user
    user = await get_current_user_ws(token, db)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        logger.warning("Analysis WebSocket rejected: Invalid token")
        return
    
    # Accept connection
    await websocket.accept()
    logger.info(f"User {user.id} ({user.full_name}) connected to analysis for call {call_id}")
    
    # Initialize analysis session for this call if not exists
    if call_id not in active_analysis_sessions:
        active_analysis_sessions[call_id] = {
            "websockets": [],
            "analysis_count": 0,
            "started_at": datetime.utcnow()
        }
    
    # Add this WebSocket to the session
    active_analysis_sessions[call_id]["websockets"].append({
        "user_id": user.id,
        "websocket": websocket
    })
    
    # Get AI client and risk engine instances
    ai_client = get_ai_client(use_mock=True)  # Use mock for development
    risk_engine = get_risk_engine()
    
    # Send initial status
    await websocket.send_json({
        "type": "analysis_status",
        "state": "READY",
        "message": "Audio analysis ready"
    })
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            message_type = message.get("type")
            
            if message_type == "audio_chunk":
                await handle_audio_chunk(
                    message=message,
                    call_id=call_id,
                    user_id=user.id,
                    ai_client=ai_client,
                    risk_engine=risk_engine,
                    sender_websocket=websocket
                )
            
            elif message_type == "start_analysis":
                await websocket.send_json({
                    "type": "analysis_status",
                    "state": "ANALYZING",
                    "message": "Starting audio analysis"
                })
                logger.info(f"Analysis started for call {call_id}")
            
            elif message_type == "stop_analysis":
                await websocket.send_json({
                    "type": "analysis_status",
                    "state": "STOPPED",
                    "message": "Audio analysis stopped"
                })
                logger.info(f"Analysis stopped for call {call_id}")
            
            elif message_type == "get_summary":
                # Get buffer stats
                if call_id in audio_buffers:
                    buffer = audio_buffers[call_id]
                    summary = {
                        "type": "analysis_summary",
                        "call_id": call_id,
                        "buffer_duration": buffer.get_duration(),
                        "buffer_samples": buffer.get_sample_count(),
                        "buffer_full": buffer.is_full(),
                        "analysis_count": active_analysis_sessions[call_id]["analysis_count"]
                    }
                else:
                    summary = {
                        "type": "analysis_summary",
                        "call_id": call_id,
                        "buffer_duration": 0,
                        "buffer_samples": 0,
                        "buffer_full": False,
                        "analysis_count": 0
                    }
                await websocket.send_json(summary)
            
            else:
                logger.warning(f"Unknown message type: {message_type}")
    
    except WebSocketDisconnect:
        logger.info(f"User {user.id} disconnected from analysis")
    
    except Exception as e:
        logger.error(f"Error in analysis WebSocket for user {user.id}: {e}")
    
    finally:
        # Cleanup on disconnect
        if call_id in active_analysis_sessions:
            # Remove this WebSocket from session
            active_analysis_sessions[call_id]["websockets"] = [
                ws for ws in active_analysis_sessions[call_id]["websockets"]
                if ws["user_id"] != user.id
            ]
            
            # If no more WebSockets, cleanup and remove session
            if not active_analysis_sessions[call_id]["websockets"]:
                logger.info(f"All users disconnected from analysis for call {call_id}")
                
                # Cleanup audio buffer
                cleanup_call_buffer(call_id, audio_buffers)
                
                # Remove session
                del active_analysis_sessions[call_id]


async def handle_audio_chunk(
    message: dict,
    call_id: str,
    user_id: int,
    ai_client,
    risk_engine,
    sender_websocket: WebSocket
):
    """
    Handle incoming audio chunk
    
    Args:
        message: Message with audio data
        call_id: Call ID
        user_id: User ID who sent the audio
        ai_client: AI model client instance
        risk_engine: Risk engine instance
        sender_websocket: WebSocket that sent the audio
    """
    audio_data = message.get("audio_data")
    sample_rate = message.get("sample_rate", 16000)
    
    if not audio_data:
        logger.warning("Received audio_chunk without audio_data")
        return
    
    # Increment analysis count
    if call_id in active_analysis_sessions:
        active_analysis_sessions[call_id]["analysis_count"] += 1
        count = active_analysis_sessions[call_id]["analysis_count"]
    else:
        count = 1
    
    # Log every 10th chunk to avoid spam
    if count % 10 == 0:
        logger.info(f"Processing audio chunk #{count} for call {call_id}")
    
    try:
        # Convert audio data to list of integers if needed
        # Frontend sends PCM data as array of Int16 values
        if isinstance(audio_data, str):
            # If base64 encoded, decode it
            import base64
            audio_bytes = base64.b64decode(audio_data)
            import struct
            pcm_data = list(struct.unpack(f'{len(audio_bytes)//2}h', audio_bytes))
        elif isinstance(audio_data, list):
            pcm_data = audio_data
        else:
            logger.warning(f"Unexpected audio_data type: {type(audio_data)}")
            return
        # Process audio chunk through the pipeline
        await process_audio_chunk(
            call_id=call_id,
            pcm_data=pcm_data,
            sample_rate=sample_rate,
            audio_buffers=audio_buffers,
            ai_client=ai_client,
            risk_engine=risk_engine,
            active_analysis_sessions=active_analysis_sessions,
            receiver_user_id=user_id
        )
    
    except Exception as e:
        logger.error(f"Error handling audio chunk: {e}", exc_info=True)
        
        # Send error status
        await sender_websocket.send_json({
            "type": "analysis_status",
            "state": "ERROR",
            "message": f"Analysis error: {str(e)}"
        })


def get_active_analysis_count() -> int:
    """
    Get number of active analysis sessions
    
    Returns:
        int: Number of active sessions
    """
    return len(active_analysis_sessions)


def get_session_info(call_id: str) -> Optional[dict]:
    """
    Get information about an analysis session
    
    Args:
        call_id: Call ID
        
    Returns:
        dict: Session info or None
    """
    if call_id not in active_analysis_sessions:
        return None
    
    session = active_analysis_sessions[call_id]
    return {
        "call_id": call_id,
        "connected_users": len(session["websockets"]),
        "analysis_count": session["analysis_count"],
        "duration": (datetime.utcnow() - session["started_at"]).total_seconds()
    }
