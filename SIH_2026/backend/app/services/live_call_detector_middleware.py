"""
Live Call Voice Detector & Blockchain Audit Middleware Hook
Pluggable integration middleware coordinating target speaker VAD, remote ASSIST ML inference,
hysteresis result aggregation, blockchain audit logging, and WebSocket telemetries.
"""

import time
import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from app.services.voice_detector_client import get_voice_detector_client, VoiceDetectorClient
from app.services.speech_buffer_manager import SpeechBufferManager
from app.services.result_aggregator import ResultAggregator, STATE_INSUFFICIENT_AUDIO, STATE_REAL, STATE_CLONED_VOICE, STATE_UNCERTAIN
from app.services.blockchain_audit_service import get_blockchain_audit_service, BlockchainAuditService
from app.config import settings

logger = logging.getLogger(__name__)


class LiveCallSessionDetector:
    """
    Manages detection state and audio pipeline for a single live call.
    Maintains target speaker isolation, speech buffering, stable call-level decisions,
    and blockchain commitments.
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
        self.analyzed_requests: set = set()

    async def ingest_audio_chunk(
        self,
        pcm_samples: List[int],
        speaker_role: str = "target",
        broadcast_callback = None
    ) -> Optional[Dict[str, Any]]:
        """
        Ingest incoming audio frames (Section 4, 5, 6, 7).
        - If speaker_role == 'target': speech is isolated via VAD and buffered.
        - If speaker_role != 'target': audio is tracked as other_speaker_duration and excluded.
        If sufficient usable speech has accumulated (>= 20.0s), creates analysis window.
        """
        if not self.is_active:
            logger.debug(f"Call {self.call_id}: Ingestion skipped (session inactive)")
            return None

        # 1. Target VAD & Buffering
        is_speech = self.buffer_manager.ingest_pcm_chunk(pcm_samples, speaker_role=speaker_role)
        metrics = self.buffer_manager.get_progress_metrics()
        
        # Track usable speech progress while accumulating the initial 20-second window
        usable_sec = metrics["usable_audio_duration"]
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
                    "call_duration": metrics["call_duration"],
                    "target_speech_duration": metrics["target_speech_duration"],
                    "other_speaker_duration": metrics["other_speaker_duration"],
                    "silence_duration": metrics["silence_duration"],
                    "usable_audio_duration": metrics["usable_audio_duration"],
                    "windows_analyzed": 0,
                    "stability_status": self.aggregator.stability_status,
                    "stability_reason": self.aggregator.stability_reason,
                    "recommendation": f"Accumulating target speech samples ({usable_sec:.1f}s / 20.0s required for AI evaluation)...",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                self.latest_payload = progress_payload
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
        Prevents duplicate requests with unique request_id (Section 29 Check 8).
        Gracefully handles ML API failure without crashing or falsifying REAL (Section 29 Check 7).
        """
        self.is_analyzing = True
        request_id = f"req_{self.call_id}_w{window_id}_{int(time.time() * 1000)}"

        if request_id in self.analyzed_requests:
            logger.warning(f"Call {self.call_id}: Duplicate window request {request_id} ignored")
            self.is_analyzing = False
            return

        self.analyzed_requests.add(request_id)

        try:
            logger.info(
                f"Call {self.call_id}: Executing ML analysis for Window #{window_id} "
                f"({duration_sec:.2f}s target speech, req={request_id})"
            )
            
            # Step 1: Dispatch to POST /api/analyze with 16 kHz Mono WAV
            try:
                ml_response = await self.ml_client.analyze_audio(
                    wav_bytes=wav_bytes,
                    filename=f"call_{self.call_id}_w{window_id}.wav"
                )
            except Exception as api_err:
                # Handle API failure gracefully (Section 29 Check 7)
                logger.error(f"Call {self.call_id}: ML API failure on Window #{window_id}: {api_err}")
                ml_response = {
                    "prediction": "UNCERTAIN",
                    "confidence": 0.0,
                    "real_probability": 0.0,
                    "synthetic_probability": 0.0,
                    "risk_level": "MEDIUM",
                    "error": str(api_err),
                    "is_fallback": True
                }

            # Step 2: Record in Aggregator and compute current stable verdict
            summary = self.aggregator.add_window_result(
                window_id=window_id,
                ml_response=ml_response,
                duration_seconds=duration_sec
            )

            # Step 3: Record on Blockchain Ledger (Section 24, 25)
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
                    res = broadcast_callback(payload)
                    if asyncio.iscoroutine(res):
                        await res
                except Exception as b_err:
                    logger.warning(f"Call {self.call_id}: Error broadcasting telemetry: {b_err}")

        except Exception as e:
            logger.error(f"Call {self.call_id}: Error in window analysis #{window_id}: {e}", exc_info=True)
        finally:
            self.is_analyzing = False

    def _construct_telemetry_payload(
        self,
        summary: Dict[str, Any],
        bc_record: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Build standardized WebSocket telemetry payload matching frontend specifications.
        """
        voice_status = summary["voice_status"]
        confidence = summary["confidence"]
        risk_score = summary["risk_score"]
        risk_level = summary["risk_level"]
        metrics = self.buffer_manager.get_progress_metrics()

        recommendation_map = {
            STATE_CLONED_VOICE: "CRITICAL ALERT: AI synthesized voice clone detected. Do not share credentials or authorize funds.",
            STATE_REAL: "Voice authenticity verified. Organic human vocal harmonics confirmed.",
            STATE_UNCERTAIN: "Voice features inconclusive. Continue speech to improve confidence.",
            STATE_INSUFFICIENT_AUDIO: "Insufficient speech frames captured for reliable evaluation."
        }
        recommendation = recommendation_map.get(
            voice_status,
            "Monitoring audio stream for voice synthesis markers..."
        )

        payload = {
            "type": "risk_update",
            "call_id": self.call_id,
            "voice_status": voice_status,
            "risk_level": risk_level,
            "risk_score": risk_score,
            "confidence": confidence,
            "model_confidence": confidence,
            "primary_language": summary["primary_language"],
            "detected_language_code": summary["detected_language_code"],
            "detected_languages": summary.get("detected_languages", []),
            "target_speech_analyzed": metrics["target_speech_duration"],
            "call_duration": metrics["call_duration"],
            "target_speech_duration": metrics["target_speech_duration"],
            "other_speaker_duration": metrics["other_speaker_duration"],
            "silence_duration": metrics["silence_duration"],
            "usable_audio_duration": metrics["usable_audio_duration"],
            "windows_analyzed": summary["windows_analyzed"],
            "stability_status": summary.get("stability_status", "STABLE"),
            "stability_reason": summary.get("stability_reason", ""),
            "recommendation": recommendation,
            "timestamp": summary.get("timestamp", datetime.now(timezone.utc).isoformat())
        }

        if bc_record:
            payload.update({
                "blockchain_tx_hash": bc_record.get("tx_hash"),
                "blockchain_block_number": bc_record.get("block_number"),
                "blockchain_audit_hash": bc_record.get("audit_hash"),
                "blockchain_verified": bc_record.get("verified", True)
            })

        return payload

    async def terminate_call_lifecycle(
        self,
        broadcast_callback = None
    ) -> Dict[str, Any]:
        """
        Execute call termination lifecycle (Section 11, 12, 19, 20, 21):
        1. Stop collection immediately.
        2. Flush target speaker buffer.
        3. If usable speech >= 1.0s, run final ML window analysis immediately.
        4. Aggregate all windows into the final call verdict.
        5. Record final result on blockchain ledger.
        6. Broadcast final verdict to frontend.
        """
        logger.info(f"Call {self.call_id}: Starting call termination lifecycle...")
        self.is_active = False

        total_usable_speech = self.buffer_manager.get_lifetime_speech_duration()
        sent_to_model_sec = 0.0

        # Step 1: Check if accumulated speech warrants a final window (>= 10.0s threshold)
        final_window = self.buffer_manager.extract_final_window_wav()
        if final_window:
            wav_bytes, window_id, duration_sec = final_window
            sent_to_model_sec = duration_sec
            try:
                logger.info(
                    f"Call {self.call_id}: Running cutoff/final ML analysis on {duration_sec:.2f}s of speech (>= 10.0s threshold)"
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
        elif len(self.aggregator.window_history) > 0:
            # Full 20s window(s) were analyzed during the live call
            sent_to_model_sec = sum(w.get("duration_seconds", 0.0) for w in self.aggregator.window_history)

        # Step 2: Complete in-flight ML requests
        wait_cycles = 0
        while self.is_analyzing and wait_cycles < 20:
            await asyncio.sleep(0.2)
            wait_cycles += 1

        # Step 3: Finalize Aggregator
        final_summary = self.aggregator.finalize_call(total_usable_speech)

        # Step 4: Record final call verdict on Blockchain Ledger (Section 24, 25)
        raw_final_summary = dict(final_summary)
        raw_final_summary.pop("window_history", None)
        final_bc_record = self.blockchain_service.commit_audit_record(
            call_id=self.call_id,
            window_id=999,  # 999 indicates Final Call Ledger Block
            mapped_status=final_summary["voice_status"],
            confidence=final_summary["confidence"],
            risk_level=final_summary["risk_level"],
            language=final_summary["primary_language"],
            raw_ml_json=raw_final_summary
        )

        final_payload = self._construct_telemetry_payload(final_summary, final_bc_record)
        final_payload["type"] = "final_call_verdict"
        final_payload["is_call_ended"] = True
        final_payload["audio_sent_to_model_sec"] = round(sent_to_model_sec, 2)
        final_payload["target_speech_collected_sec"] = round(total_usable_speech, 2)
        final_payload["stability_reason"] = final_summary.get("stability_reason", "")
        if final_bc_record:
            final_payload["blockchain_audit"] = {
                "tx_hash": final_bc_record.get("tx_hash"),
                "block_number": final_bc_record.get("block_number"),
                "audit_hash": final_bc_record.get("audit_hash"),
                "verified": final_bc_record.get("verified", True)
            }

        # Broadcast final verdict
        if broadcast_callback:
            try:
                res = broadcast_callback(final_payload)
                if asyncio.iscoroutine(res):
                    await res
            except Exception as e:
                logger.warning(f"Call {self.call_id}: Error pushing final verdict: {e}")

        # Direct broadcast to open analysis WebSockets
        try:
            from app.websockets.analysis import active_analysis_sessions
            if self.call_id in active_analysis_sessions:
                for ws_info in active_analysis_sessions[self.call_id].get("websockets", []):
                    # Only send final risk verdict to receiver
                    if ws_info.get("role") != "caller":
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
            f"[VoiceShield Console Audit] Call {self.call_id} ended. "
            f"Target speech collected: {total_usable_speech:.1f}s. "
            f"Audio sent to model: {sent_to_model_sec:.1f}s. "
            f"Final Decision: {final_summary['voice_status']} (Confidence: {final_summary['confidence']}%, Risk: {final_summary['risk_level']}). "
            f"Reason: {final_summary.get('stability_reason')}"
        )
        return final_payload


class LiveCallDetectorMiddleware:
    """
    Application-wide singleton manager for live call detection sessions.
    """

    def __init__(self):
        self.active_sessions: Dict[str, LiveCallSessionDetector] = {}

    def get_or_create_session(self, call_id: str) -> LiveCallSessionDetector:
        if call_id not in self.active_sessions:
            logger.info(f"Middleware: Initializing detection session for call {call_id}")
            self.active_sessions[call_id] = LiveCallSessionDetector(call_id=call_id)
        return self.active_sessions[call_id]

    async def process_chunk(
        self,
        call_id: str,
        pcm_samples: List[int],
        speaker_role: str = "target",
        broadcast_callback = None
    ) -> Optional[Dict[str, Any]]:
        session = self.get_or_create_session(call_id)
        return await session.ingest_audio_chunk(
            pcm_samples=pcm_samples,
            speaker_role=speaker_role,
            broadcast_callback=broadcast_callback
        )

    async def terminate_call(
        self,
        call_id: str,
        broadcast_callback = None
    ) -> Optional[Dict[str, Any]]:
        if call_id in self.active_sessions:
            session = self.active_sessions[call_id]
            final_verdict = await session.terminate_call_lifecycle(broadcast_callback)
            del self.active_sessions[call_id]
            return final_verdict
        return None

    def get_session(self, call_id: str) -> Optional[LiveCallSessionDetector]:
        return self.active_sessions.get(call_id)


# Global singleton instance
detector_middleware = LiveCallDetectorMiddleware()
