"""
Live Call Voice Detector & Blockchain Audit Middleware Hook
Pluggable integration middleware coordinating VAD speech buffering, remote ML model inference,
result state aggregation, blockchain audit logging, and WebSocket telemetries.
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from app.services.voice_detector_client import get_voice_detector_client, VoiceDetectorClient
from app.services.speech_buffer_manager import SpeechBufferManager
from app.services.result_aggregator import ResultAggregator, STATE_INSUFFICIENT_AUDIO
from app.services.blockchain_audit_service import get_blockchain_audit_service, BlockchainAuditService
from app.config import settings

logger = logging.getLogger(__name__)


class LiveCallSessionDetector:
    """
    Manages detection state and audio pipeline for a single live call.
    """

    def __init__(
        self,
        call_id: str,
        ml_client: Optional[VoiceDetectorClient] = None,
        blockchain_service: Optional[BlockchainAuditService] = None
    ):
        self.call_id = call_id
        self.ml_client = ml_client or get_voice_detector_client()
        self.blockchain_service = blockchain_service or get_blockchain_audit_service()
        
        self.buffer_manager = SpeechBufferManager(call_id=call_id)
        self.aggregator = ResultAggregator(call_id=call_id)
        
        self.is_active = True
        self.is_analyzing = False
        self.latest_blockchain_record: Optional[Dict[str, Any]] = None
        self.latest_payload: Optional[Dict[str, Any]] = None
        self.created_at = datetime.now(timezone.utc)

    async def ingest_audio_chunk(
        self,
        pcm_samples: List[int],
        broadcast_callback = None
    ) -> Optional[Dict[str, Any]]:
        """
        Ingest incoming target-speaker PCM frames from remote stream.
        If sufficient usable speech has accumulated, asynchronously dispatches
        to ML API, records blockchain proof, and broadcasts telemetry to frontend.
        """
        if not self.is_active:
            logger.debug(f"Call {self.call_id}: Ingestion skipped (session inactive)")
            return None

        # 1. Target VAD & Buffering
        is_speech = self.buffer_manager.ingest_pcm_chunk(pcm_samples)
        
        # Track usable speech progress while accumulating the initial 20-second window
        usable_sec = self.buffer_manager.get_usable_speech_duration()
        if self.buffer_manager.current_window_id == 0:
            last_p = getattr(self, '_last_progress_sec', 0.0)
            if (usable_sec - last_p) >= 1.0 or (last_p == 0.0 and usable_sec >= 0.5):
                self._last_progress_sec = usable_sec
                progress_payload = {
                    "type": "risk_update",
                    "call_id": self.call_id,
                    "voice_status": STATE_INSUFFICIENT_AUDIO,
                    "risk_level": "LOW",
                    "risk_score": 0,
                    "confidence": 0,
                    "model_confidence": 0,
                    "target_speech_analyzed": round(usable_sec, 1),
                    "windows_analyzed": 0,
                    "recommendation": f"Accumulating target speech samples ({usable_sec:.1f}s / 20.0s required for AI evaluation)...",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                if broadcast_callback:
                    try:
                        res = broadcast_callback(progress_payload)
                        if asyncio.iscoroutine(res):
                            await res
                    except Exception as b_err:
                        logger.warning(f"Call {self.call_id}: Error in progress heartbeat callback: {b_err}")

        if not is_speech:
            return None

        # 2. Check if ready for window analysis (20.0s reached)
        if self.buffer_manager.is_ready_for_analysis() and not self.is_analyzing:
            # Extract window WAV
            window_data = self.buffer_manager.extract_window_wav()
            if window_data:
                wav_bytes, window_id, duration_sec = window_data
                # Trigger analysis in background to not block WebSocket frame reading
                asyncio.create_task(
                    self._execute_window_analysis(
                        wav_bytes=wav_bytes,
                        window_id=window_id,
                        duration_sec=duration_sec,
                        broadcast_callback=broadcast_callback
                    )
                )

        return self.latest_payload

    async def _execute_window_analysis(
        self,
        wav_bytes: bytes,
        window_id: int,
        duration_sec: float,
        broadcast_callback = None
    ) -> None:
        """
        Execute ML dispatch -> Aggregator -> Blockchain commit -> Telemetry broadcast.
        """
        self.is_analyzing = True
        try:
            logger.info(
                f"Call {self.call_id}: Executing ML analysis for Window #{window_id} "
                f"({duration_sec:.2f}s target speech)"
            )
            
            # Step 1: Dispatch to POST /api/analyze with 16 kHz Mono WAV
            ml_response = await self.ml_client.analyze_audio(
                wav_bytes=wav_bytes,
                filename=f"call_{self.call_id}_w{window_id}.wav"
            )

            # Step 2: Record in Aggregator and compute current verdict
            summary = self.aggregator.add_window_result(
                window_id=window_id,
                ml_response=ml_response,
                duration_seconds=duration_sec
            )

            # Step 3: Record on Blockchain Ledger (Section 17)
            bc_record = self.blockchain_service.commit_audit_record(
                call_id=self.call_id,
                window_id=window_id,
                mapped_status=summary["voice_status"],
                confidence=summary["confidence"],
                risk_level=summary["risk_level"],
                language=summary["primary_language"],
                raw_ml_json=ml_response.get("raw_response", ml_response)
            )
            self.latest_blockchain_record = bc_record

            # Step 4: Construct user-facing payload matching frontend contract
            payload = self._construct_telemetry_payload(summary, bc_record)
            self.latest_payload = payload

            # Step 5: Broadcast to frontend via callback
            if broadcast_callback:
                try:
                    await broadcast_callback(payload)
                except Exception as b_err:
                    logger.warning(f"Call {self.call_id}: Error broadcasting telemetry: {b_err}")

        except Exception as e:
            logger.error(f"Call {self.call_id}: Error in window analysis #{window_id}: {e}", exc_info=True)
        finally:
            self.is_analyzing = False

    def _construct_telemetry_payload(
        self,
        summary: Dict[str, Any],
        blockchain_record: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Construct frontend-ready telemetry matching Section 18 Contract."""
        lang_name = summary.get("primary_language", "hindi").capitalize()
        lang_code = summary.get("detected_language_code", "hi")
        lang_display = f"{lang_name} ({lang_code})"

        status = summary.get("voice_status", STATE_INSUFFICIENT_AUDIO)
        score = summary.get("risk_score", 0.0)

        recommendation = "Verified authentic human speech."
        if status == "CLONED VOICE":
            recommendation = "CRITICAL WARNING: High confidence synthetic / cloned voice detected! Verify caller identity out-of-band."
        elif status == "UNCERTAIN":
            recommendation = "Acoustic signals ambiguous. Continue monitoring target speech."
        elif status == STATE_INSUFFICIENT_AUDIO:
            recommendation = "Awaiting sufficient usable target speech samples for verification..."

        payload = {
            "type": "risk_update",
            "call_id": self.call_id,
            "voice_status": status,
            "confidence": summary.get("confidence", 0.0),
            "risk_level": summary.get("risk_level", "LOW"),
            "risk_score": score,
            "model_confidence": summary.get("confidence", 0.0),
            "recommendation": recommendation,
            "detected_language": lang_display,
            "primary_language": summary.get("primary_language", "hindi"),
            "detected_language_code": lang_code,
            "target_speech_analyzed": round(self.buffer_manager.get_lifetime_speech_duration(), 2),
            "windows_analyzed": summary.get("windows_analyzed", 0),
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

        if blockchain_record:
            payload["blockchain_audit"] = {
                "verified": blockchain_record.get("verified", True),
                "block_number": blockchain_record.get("block_number"),
                "tx_hash": blockchain_record.get("tx_hash"),
                "audit_hash": blockchain_record.get("audit_hash"),
                "block_hash": blockchain_record.get("block_hash"),
                "canonical_string": blockchain_record.get("canonical_string")
            }

        return payload

    async def terminate_call_lifecycle(
        self,
        broadcast_callback = None
    ) -> Dict[str, Any]:
        """
        Executes the Mandatory 8-Step Call Termination Lifecycle (Section 14).
        1. Immediately stop incoming audio buffering.
        2. Inspect total accumulated usable target speech (< 20.0s -> INSUFFICIENT AUDIO, >= 20.0s -> final slice).
        3. Complete any in-flight ML requests.
        4. Execute final call aggregation across all recorded windows.
        5. Store the final call-level result and complete raw ML history.
        6. Generate the final deterministic call integrity audit hash.
        7. Record the final audit hash on the blockchain integrity layer.
        8. Push the final verified verdict payload to frontend.
        """
        logger.info(f"Call {self.call_id}: Initiating 8-Step Call Termination Lifecycle...")
        
        # Step 1: Stop incoming audio buffering
        self.is_active = False

        # Step 2: Inspect total accumulated usable target speech
        total_usable_speech = self.buffer_manager.get_lifetime_speech_duration()
        min_speech = getattr(settings, 'MIN_USABLE_SPEECH_SEC', 20.0)

        # Check if accumulated speech warrants a final window (even if call was cut under 20.0s)
        final_window = self.buffer_manager.extract_final_window_wav()
        if final_window:
            wav_bytes, window_id, duration_sec = final_window
            try:
                logger.info(
                    f"Call {self.call_id}: Running cutoff/final ML analysis on {duration_sec:.2f}s of speech"
                )
                ml_response = await self.ml_client.analyze_audio(
                    wav_bytes=wav_bytes,
                    filename=f"call_{self.call_id}_w{window_id}_cutoff.wav"
                )
                self.aggregator.add_window_result(
                    window_id=window_id,
                    ml_response=ml_response,
                    duration_seconds=duration_sec
                )
            except Exception as e:
                logger.error(f"Call {self.call_id}: Error analyzing final window: {e}")

        # Step 3: Complete in-flight ML requests
        wait_cycles = 0
        while self.is_analyzing and wait_cycles < 30:  # Max 3 seconds
            await asyncio.sleep(0.1)
            wait_cycles += 1

        # Step 4: Execute final call aggregation across all recorded windows
        final_summary = self.aggregator.finalize_call(total_usable_speech_sec=total_usable_speech)

        # Step 5 & 6 & 7: Commit Final Call Verdict to Blockchain
        final_bc_record = self.blockchain_service.commit_audit_record(
            call_id=self.call_id,
            window_id=999,  # 999 denotes final session block
            mapped_status=final_summary["voice_status"],
            confidence=final_summary["confidence"],
            risk_level=final_summary["risk_level"],
            language=final_summary["primary_language"],
            raw_ml_json={
                "call_summary": final_summary,
                "total_usable_speech_sec": total_usable_speech,
                "windows_count": final_summary["windows_analyzed"]
            }
        )
        self.latest_blockchain_record = final_bc_record

        # Step 8: Push the final verified verdict payload to the frontend
        final_payload = self._construct_telemetry_payload(final_summary, final_bc_record)
        final_payload["type"] = "final_call_verdict"
        self.latest_payload = final_payload

        if broadcast_callback:
            try:
                await broadcast_callback(final_payload)
            except Exception as e:
                logger.warning(f"Call {self.call_id}: Error pushing final verdict: {e}")

        # Direct broadcast to open analysis WebSockets
        try:
            from app.websockets.analysis import active_analysis_sessions
            if self.call_id in active_analysis_sessions:
                for ws_info in active_analysis_sessions[self.call_id].get("websockets", []):
                    try:
                        await ws_info["websocket"].send_json(final_payload)
                        risk_dup = dict(final_payload)
                        risk_dup["type"] = "risk_update"
                        await ws_info["websocket"].send_json(risk_dup)
                    except Exception:
                        pass
        except Exception:
            pass

        # Clean up memory buffers
        self.buffer_manager.clear()
        logger.info(
            f"Call {self.call_id}: Termination lifecycle COMPLETED. "
            f"Final State={final_summary['voice_status']}, TX={final_bc_record.get('tx_hash')}"
        )
        return final_payload


class LiveCallDetectorMiddleware:
    """
    Global middleware registry for managing active call detectors.
    Ensures seamless plug-in into FastAPI routes and WebSockets.
    """

    def __init__(self):
        self.active_sessions: Dict[str, LiveCallSessionDetector] = {}

    def get_or_create_session(self, call_id: str) -> LiveCallSessionDetector:
        """Retrieve existing or initialize new detector for call_id."""
        if call_id not in self.active_sessions:
            logger.info(f"LiveCallDetectorMiddleware: Creating detector for call {call_id}")
            self.active_sessions[call_id] = LiveCallSessionDetector(call_id=call_id)
        return self.active_sessions[call_id]

    def get_session(self, call_id: str) -> Optional[LiveCallSessionDetector]:
        return self.active_sessions.get(call_id)

    async def process_chunk(
        self,
        call_id: str,
        pcm_samples: List[int],
        broadcast_callback = None
    ) -> Optional[Dict[str, Any]]:
        """Pass PCM chunk to active call session detector."""
        session = self.get_or_create_session(call_id)
        return await session.ingest_audio_chunk(pcm_samples, broadcast_callback)

    async def terminate_call(
        self,
        call_id: str,
        broadcast_callback = None
    ) -> Optional[Dict[str, Any]]:
        """Trigger the 8-step termination lifecycle and cleanup session."""
        if call_id in self.active_sessions:
            session = self.active_sessions[call_id]
            result = await session.terminate_call_lifecycle(broadcast_callback)
            del self.active_sessions[call_id]
            return result
        return None


# Global singleton middleware
detector_middleware = LiveCallDetectorMiddleware()
