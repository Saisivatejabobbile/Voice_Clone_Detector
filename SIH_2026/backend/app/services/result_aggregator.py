"""
Result Aggregator & Voice State Engine
Implements application-level voice classification mapping (REAL, CLONED VOICE, UNCERTAIN, INSUFFICIENT AUDIO),
anti-flapping hysteresis decision engine, recency-weighted multi-window aggregation,
and multi-lingual language tracking.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.config import settings

logger = logging.getLogger(__name__)

# The 4 strictly defined user-facing application states (Section 3)
STATE_REAL = "REAL"
STATE_CLONED_VOICE = "CLONED VOICE"
STATE_UNCERTAIN = "UNCERTAIN"
STATE_INSUFFICIENT_AUDIO = "INSUFFICIENT AUDIO"

VALID_APPLICATION_STATES = {
    STATE_REAL,
    STATE_CLONED_VOICE,
    STATE_UNCERTAIN,
    STATE_INSUFFICIENT_AUDIO
}

# Stability status states for internal/operator diagnostics (Section 28)
STABILITY_INITIALIZING = "INITIALIZING"
STABILITY_STABLE = "STABLE"
STABILITY_TRANSITIONING = "TRANSITIONING"


class ResultAggregator:
    """
    Call-level decision engine for live and finalized calls.
    Maintains an immutable chronological history of all ML window predictions,
    performs multi-window weighted scoring, manages language metadata,
    and applies hysteresis / anti-flapping rules to ensure the user-facing result
    remains completely stable rather than oscillating on individual windows.
    """

    def __init__(
        self,
        call_id: str,
        uncertain_threshold: Optional[float] = None,
        min_confirming_windows: int = 2
    ):
        self.call_id = call_id
        self.uncertain_threshold = uncertain_threshold or getattr(settings, 'UNCERTAIN_CONFIDENCE_THRESHOLD', 45.0)
        self.min_confirming_windows = min_confirming_windows
        
        # Chronological immutable window records (Section 13)
        self.window_history: List[Dict[str, Any]] = []
        
        # Multi-lingual language tracking (Section 22)
        self.detected_languages: List[Dict[str, Any]] = []
        self.primary_language: str = "hindi"
        self.primary_language_code: str = "hi"

        # Current call-level decision state (Section 13, 14, 16)
        self.current_state: str = STATE_INSUFFICIENT_AUDIO
        self.established_state: Optional[str] = None
        self.stability_status: str = STABILITY_INITIALIZING
        self.stability_reason: str = "Waiting for initial speech window"
        self.current_confidence: float = 0.0
        self.current_risk_level: str = "LOW"
        self.current_risk_score: float = 0.0

        # Anti-flapping hysteresis tracking
        self.candidate_state: Optional[str] = None
        self.consecutive_candidate_count: int = 0

        logger.info(
            f"ResultAggregator initialized for call {call_id}: "
            f"uncertain_threshold={self.uncertain_threshold}%, min_confirming={self.min_confirming_windows}"
        )

    def map_single_window_prediction(self, ml_response: Dict[str, Any]) -> str:
        """
        Map a single raw ML model response to one of the 4 application states (Section 3, 23):
        - REAL
        - CLONED VOICE (from raw SYNTHETIC or CLONED)
        - UNCERTAIN
        - INSUFFICIENT AUDIO
        
        Matches the accurate evaluation logic used in the audio file analysis endpoint.
        """
        prediction = str(ml_response.get("prediction", "UNCERTAIN")).upper().strip()
        confidence = float(ml_response.get("confidence", 0.0))
        real_prob = float(ml_response.get("real_probability", 0.0))
        synth_prob = float(ml_response.get("synthetic_probability", 0.0))
        is_fallback = ml_response.get("is_fallback", False)

        # Check for insufficient audio
        if prediction == "INSUFFICIENT AUDIO" or ml_response.get("error") == "insufficient_speech":
            return STATE_INSUFFICIENT_AUDIO

        # If this is a fallback response (API failure / uncertain language), mark as UNCERTAIN
        if is_fallback:
            return STATE_UNCERTAIN

        # Ambiguous / Low confidence below threshold → UNCERTAIN
        if 0 < confidence < self.uncertain_threshold:
            logger.info(
                f"Call {self.call_id}: Window confidence {confidence:.1f}% < threshold {self.uncertain_threshold}% → UNCERTAIN"
            )
            return STATE_UNCERTAIN

        # High synthetic probability or explicit synthetic prediction -> CLONED VOICE
        if prediction in ("SYNTHETIC", "CLONED", "AI", "SPOOF", "FAKE", "CLONE", "DEEPFAKE") or synth_prob >= 60.0:
            return STATE_CLONED_VOICE

        # High real probability or explicit real prediction -> REAL
        if prediction in ("REAL", "BONAFIDE", "HUMAN", "GENUINE", "ORIGINAL") or (real_prob >= 60.0 and synth_prob < 40.0):
            return STATE_REAL

        return STATE_UNCERTAIN

    def add_window_result(
        self,
        window_id: int,
        ml_response: Dict[str, Any],
        duration_seconds: float
    ) -> Dict[str, Any]:
        """
        Record a new window response from the ML detector and compute a stable call-level verdict.
        Never overwrites raw scores or deletes previous responses (Section 13).
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        mapped_status = self.map_single_window_prediction(ml_response)

        # Track language metadata (Section 22)
        lang = ml_response.get("language", "hindi")
        lang_code = ml_response.get("detected_language_code", "hi")
        lang_conf = float(ml_response.get("language_confidence", 90.0))

        lang_record = {
            "window_id": window_id,
            "language": lang,
            "code": lang_code,
            "confidence": lang_conf,
            "timestamp": timestamp
        }
        self.detected_languages.append(lang_record)
        self.primary_language = lang
        self.primary_language_code = lang_code

        # Immutable window entry preserving complete raw payload (Section 13, 23)
        window_entry = {
            "window_id": window_id,
            "timestamp": timestamp,
            "duration_seconds": duration_seconds,
            "mapped_status": mapped_status,
            "raw_prediction": ml_response.get("prediction"),
            "confidence": float(ml_response.get("confidence", 0.0)),
            "real_probability": float(ml_response.get("real_probability", 0.0)),
            "synthetic_probability": float(ml_response.get("synthetic_probability", 0.0)),
            "risk_level": ml_response.get("risk_level", "MEDIUM"),
            "original_scores": ml_response.get("original_scores", {}),
            "language": lang,
            "detected_language_code": lang_code,
            "language_confidence": lang_conf,
            "is_fallback": ml_response.get("is_fallback", False),
            "raw_response": ml_response.get("raw_response", ml_response)
        }
        self.window_history.append(window_entry)

        # Recompute stable call-level verdict faithfully matching the ML detector
        self._recalculate_aggregated_verdict(latest_window=window_entry)

        logger.info(
            f"Call {self.call_id} Window #{window_id}: "
            f"prediction={window_entry['raw_prediction']}, confidence={window_entry['confidence']:.1f}%, "
            f"synth_prob={window_entry['synthetic_probability']:.1f}% | "
            f"Current call-level decision: {self.current_state} | "
            f"Stability: {self.stability_status} | Reason: {self.stability_reason}"
        )

        return self.get_summary()

    def _recalculate_aggregated_verdict(self, latest_window: Optional[Dict[str, Any]] = None) -> None:
        """
        Decision Engine with Recency-Weighted Scoring and Safety Prioritization.
        Directly reflects the ML model's output without artificial score capping or dampening.
        """
        if not self.window_history:
            self.current_state = STATE_INSUFFICIENT_AUDIO
            self.established_state = None
            self.stability_status = STABILITY_INITIALIZING
            self.stability_reason = "No speech windows analyzed"
            self.current_confidence = 0.0
            self.current_risk_level = "LOW"
            self.current_risk_score = 0.0
            return

        n = len(self.window_history)

        # Recency-weighted score calculation: 0.8^(N - 1 - i)
        decay = 0.80
        weights = [decay ** (n - 1 - i) for i in range(n)]
        total_weight = sum(weights) or 1.0

        weighted_real_prob = sum(self.window_history[i]["real_probability"] * weights[i] for i in range(n)) / total_weight
        weighted_synth_prob = sum(self.window_history[i]["synthetic_probability"] * weights[i] for i in range(n)) / total_weight
        weighted_confidence = sum(self.window_history[i]["confidence"] * weights[i] for i in range(n)) / total_weight

        latest_status = latest_window["mapped_status"] if latest_window else None
        latest_synth = latest_window.get("synthetic_probability", 0.0) if latest_window else 0.0

        # Safety Priority Rule: If latest window or weighted evidence indicates CLONED VOICE, prioritize alert!
        if latest_status == STATE_CLONED_VOICE or latest_synth >= 60.0 or weighted_synth_prob >= 55.0:
            self.established_state = STATE_CLONED_VOICE
            self.current_state = STATE_CLONED_VOICE
            self.consecutive_candidate_count = 0
            self.candidate_state = None
            self.stability_status = STABILITY_STABLE
            self.stability_reason = f"CRITICAL: Synthetic AI voice signature detected (latest={latest_synth:.1f}%, weighted={weighted_synth_prob:.1f}%)"
            self.current_confidence = round(max(weighted_confidence, latest_synth), 1)
            self.current_risk_score = round(max(latest_synth, weighted_synth_prob), 1)
            self.current_risk_level = "HIGH"
            logger.warning(f"Call {self.call_id}: CLONED VOICE prioritized! ({self.stability_reason})")
            return

        # Authentic Human Voice Rule
        if latest_status == STATE_REAL or (weighted_real_prob >= 60.0 and weighted_synth_prob < 40.0):
            # If previously flagged as CLONED VOICE, require 2 confirming REAL windows to switch back
            if self.established_state == STATE_CLONED_VOICE:
                if self.candidate_state == STATE_REAL:
                    self.consecutive_candidate_count += 1
                else:
                    self.candidate_state = STATE_REAL
                    self.consecutive_candidate_count = 1
                
                if self.consecutive_candidate_count >= self.min_confirming_windows and weighted_real_prob >= 70.0:
                    self.established_state = STATE_REAL
                    self.current_state = STATE_REAL
                    self.consecutive_candidate_count = 0
                    self.candidate_state = None
                    self.stability_status = STABILITY_STABLE
                    self.stability_reason = f"Confirmed {self.min_confirming_windows} consecutive REAL windows"
                else:
                    self.current_state = STATE_CLONED_VOICE
                    self.stability_status = STABILITY_STABLE
                    self.stability_reason = "Retaining CLONED VOICE alert until confirmed real speech"
            else:
                self.established_state = STATE_REAL
                self.current_state = STATE_REAL
                self.consecutive_candidate_count = 0
                self.candidate_state = None
                self.stability_status = STABILITY_STABLE
                self.stability_reason = f"Authentic human speech verified (real={weighted_real_prob:.1f}%, synth={weighted_synth_prob:.1f}%)"
        else:
            self.established_state = STATE_UNCERTAIN
            self.current_state = STATE_UNCERTAIN
            self.consecutive_candidate_count = 0
            self.candidate_state = None
            self.stability_status = STABILITY_STABLE
            self.stability_reason = f"Inconclusive acoustic indicators (synth={weighted_synth_prob:.1f}%, real={weighted_real_prob:.1f}%)"

        # Update metrics for current state without arbitrary caps
        if self.current_state == STATE_CLONED_VOICE:
            self.current_confidence = round(max(weighted_confidence, weighted_synth_prob), 1)
            self.current_risk_score = round(max(weighted_synth_prob, self.current_confidence), 1)
            self.current_risk_level = "HIGH"
        elif self.current_state == STATE_REAL:
            self.current_confidence = round(max(weighted_confidence, weighted_real_prob), 1)
            self.current_risk_score = round(weighted_synth_prob, 1)
            self.current_risk_level = "LOW"
        elif self.current_state == STATE_UNCERTAIN:
            self.current_confidence = round(weighted_confidence, 1)
            self.current_risk_score = round(weighted_synth_prob, 1)
            if weighted_synth_prob >= 60.0:
                self.current_risk_level = "HIGH"
            elif weighted_synth_prob >= 35.0:
                self.current_risk_level = "MEDIUM"
            else:
                self.current_risk_level = "LOW"
        else:
            self.current_confidence = 0.0
            self.current_risk_score = 0.0
            self.current_risk_level = "LOW"

    def finalize_call(self, total_usable_speech_sec: float) -> Dict[str, Any]:
        """
        Execute final verdict aggregation upon call termination (Section 11, 12, 19, 20).
        If any windows have been analyzed (including short-call cutoff analysis),
        computes the real final aggregated verdict.
        Only marks INSUFFICIENT AUDIO if literally zero analyzed speech exists (< 1.0s).
        """
        if len(self.window_history) > 0:
            self._recalculate_aggregated_verdict()
            self.stability_reason = (
                f"Analyzed {len(self.window_history)} window(s) with {total_usable_speech_sec:.1f}s of target speech. "
                f"Decision finalized as {self.current_state} (Confidence: {self.current_confidence}%, Risk: {self.current_risk_score}%)."
            )
            logger.info(
                f"Call {self.call_id} finalized with {len(self.window_history)} analyzed window(s) "
                f"({total_usable_speech_sec:.2f}s usable speech) -> Final State={self.current_state}, "
                f"Risk={self.current_risk_score}, Conf={self.current_confidence}%"
            )
        else:
            self.current_state = STATE_INSUFFICIENT_AUDIO
            self.established_state = STATE_INSUFFICIENT_AUDIO
            self.stability_status = STABILITY_STABLE
            self.stability_reason = f"Call ended with {total_usable_speech_sec:.1f}s of target speech (<10.0s threshold). Insufficient audio duration for AI model inference."
            self.current_confidence = 0.0
            self.current_risk_level = "LOW"
            self.current_risk_score = 0.0
            logger.info(
                f"Call {self.call_id} terminated with INSUFFICIENT AUDIO "
                f"({total_usable_speech_sec:.2f}s usable speech < 10.0s threshold)"
            )

        return self.get_summary()

    def get_summary(self) -> Dict[str, Any]:
        """Return standardized user-facing and operator verdict summary."""
        return {
            "call_id": self.call_id,
            "voice_status": self.current_state,
            "confidence": self.current_confidence,
            "risk_level": self.current_risk_level,
            "risk_score": self.current_risk_score,
            "stability_status": self.stability_status,
            "stability_reason": self.stability_reason,
            "primary_language": self.primary_language,
            "detected_language_code": self.primary_language_code,
            "detected_languages": self.detected_languages,
            "windows_analyzed": len(self.window_history),
            "window_history": self.window_history,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
