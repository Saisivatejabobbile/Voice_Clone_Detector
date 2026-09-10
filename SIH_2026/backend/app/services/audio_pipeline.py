"""
Audio Processing Pipeline
Handles audio chunk processing through AI analysis pipeline
"""

import logging
from typing import Dict, Any, List
from app.services.audio_buffer import AudioBuffer
from app.services.ai_model_client import AIModelClient
from app.services.risk_engine import RiskEngine

logger = logging.getLogger(__name__)


async def process_audio_chunk(
    call_id: str,
    pcm_data: List[int],
    sample_rate: int,
    audio_buffers: Dict[str, AudioBuffer],
    ai_client: AIModelClient,
    risk_engine: RiskEngine,
    active_analysis_sessions: Dict,
    receiver_user_id: int
) -> None:
    """
    Process incoming audio chunk and generate risk update.
    
    This function orchestrates the complete audio analysis pipeline:
    1. Get or create AudioBuffer for the call
    2. Append PCM data to buffer
    3. Extract 3-second analysis window
    4. Call AI model for prediction
    5. Calculate risk using risk engine
    6. Send risk_update message to receiver via connection_manager
    
    Args:
        call_id: Unique call identifier
        pcm_data: List of Int16 PCM audio samples
        sample_rate: Audio sample rate (typically 16000 Hz)
        audio_buffers: Dict mapping call_id to AudioBuffer instances
        ai_client: AI model client for voice analysis
        risk_engine: Risk engine for calculating threat levels
        connection_manager: Connection manager for sending WebSocket messages
        receiver_user_id: User ID of the call receiver (who sees risk dashboard)
    
    Requirements: 11.2, 11.4, 11.5, 15.1, 15.4, 15.5
    """
    try:
        # Step 1: Get or create AudioBuffer for this call
        if call_id not in audio_buffers:
            logger.info(f"Creating new AudioBuffer for call {call_id}")
            audio_buffers[call_id] = AudioBuffer(
                sample_rate=sample_rate,
                max_duration_seconds=30
            )
        
        buffer = audio_buffers[call_id]
        
        # Step 2: Append PCM data to buffer
        buffer.append(pcm_data)
        logger.debug(
            f"Appended {len(pcm_data)} samples to buffer for call {call_id} "
            f"(buffer now: {buffer.get_duration():.2f}s)"
        )
        
        # Step 3: Extract 3-second analysis window
        audio_window = buffer.get_window(duration_seconds=3.0)
        
        # Skip analysis if buffer doesn't have enough data yet
        if len(audio_window) < sample_rate * 1.0:  # Need at least 1 second
            logger.debug(
                f"Insufficient audio data for analysis (have {len(audio_window)} samples, "
                f"need {sample_rate * 1.0}). Skipping this chunk."
            )
            return
        
        # Convert audio window to bytes for AI model
        # Pack as Int16 little-endian PCM
        import struct
        audio_bytes = struct.pack(f'{len(audio_window)}h', *audio_window)
        
        logger.debug(
            f"Extracted {len(audio_window)} samples ({len(audio_window)/sample_rate:.2f}s) "
            f"for AI analysis"
        )
        
        # Step 4: Call AI model for prediction
        logger.debug(f"Calling AI model for call {call_id}")
        model_prediction = await ai_client.predict(
            audio_data=audio_bytes,
            sample_rate=sample_rate
        )
        
        logger.debug(
            f"AI prediction received: synthetic_prob={model_prediction.get('synthetic_probability', 0):.3f}, "
            f"confidence={model_prediction.get('model_confidence', 0):.3f}"
        )
        
        # Step 5: Calculate risk using risk engine
        risk_result = risk_engine.calculate_risk(model_prediction)
        
        logger.info(
            f"Risk calculated for call {call_id}: {risk_result['risk_level']} "
            f"(score={risk_result['risk_score']:.1f})"
        )
        
        # Step 6: Send risk_update message to receiver
        risk_update_message = {
            'type': 'risk_update',
            'call_id': call_id,
            'risk_level': risk_result['risk_level'],
            'risk_score': risk_result['risk_score'],
            'synthetic_confidence': risk_result['synthetic_confidence'],
            'model_confidence': risk_result['model_confidence'],
            'recommendation': risk_result['recommendation'],
            'timestamp': risk_result['timestamp']
        }
        
        # Include optional indicators if present
        if risk_result.get('acoustic_indicators'):
            risk_update_message['acoustic_indicators'] = risk_result['acoustic_indicators']
        
        if risk_result.get('prosody_indicators'):
            risk_update_message['prosody_indicators'] = risk_result['prosody_indicators']
        
        # Broadcast to all connected analysis WebSockets for this call
        if call_id in active_analysis_sessions:
            session = active_analysis_sessions[call_id]
            for ws_info in session.get('websockets', []):
                try:
                    await ws_info['websocket'].send_json(risk_update_message)
                except Exception as ws_error:
                    logger.warning(f"Failed to send risk update to user {ws_info['user_id']}: {ws_error}")
            
            logger.debug(f"Risk update broadcast to {len(session.get('websockets', []))} connected clients")
        
    except Exception as e:
        logger.error(f"Error processing audio chunk for call {call_id}: {e}", exc_info=True)
        
        # Send error status to receiver
        try:
            # Broadcast error to all connected analysis WebSockets
            if call_id in active_analysis_sessions:
                for ws_info in active_analysis_sessions[call_id].get('websockets', []):
                    try:
                        await ws_info['websocket'].send_json({
                            'type': 'analysis_status',
                            'state': 'ERROR',
                            'message': f'Analysis error: {str(e)}',
                            'call_id': call_id
                        })
                    except:
                        pass
        except Exception as send_error:
            logger.error(f"Failed to send error status: {send_error}")


def cleanup_call_buffer(call_id: str, audio_buffers: Dict[str, AudioBuffer]) -> None:
    """
    Clean up audio buffer for a completed call.
    
    Releases memory by clearing and removing the buffer for the specified call.
    
    Args:
        call_id: Unique call identifier
        audio_buffers: Dict mapping call_id to AudioBuffer instances
    """
    if call_id in audio_buffers:
        buffer = audio_buffers[call_id]
        buffer.clear()
        del audio_buffers[call_id]
        logger.info(f"Audio buffer cleaned up for call {call_id}")
    else:
        logger.warning(f"Attempted to cleanup non-existent buffer for call {call_id}")
