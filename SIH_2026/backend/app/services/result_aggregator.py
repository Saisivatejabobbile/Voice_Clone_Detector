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
        self.uncertain_threshold = uncertain_threshold or getattr(settings, 'UNCERTAIN_CONFIDENCE_THRESHOLD', 60.0)
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
        """
        prediction = str(ml_response.get("prediction", "UNCERTAIN")).upper().strip()
        confidence = float(ml_response.get("confidence", 0.0))
        real_prob = float(ml_response.get("real_probability", 0.0))
        synth_prob = float(ml_response.get("synthetic_probability", 0.0))

        # Check for insufficient audio
        if prediction == "INSUFFICIENT AUDIO" or ml_response.get("error") == "insufficient_speech":
            return STATE_INSUFFICIENT_AUDIO

        # Ambiguity / low confidence check -> UNCERTAIN (Section 17)
        prob_diff = abs(real_prob - synth_prob)
        if confidence < self.uncertain_threshold or (prob_diff < 15.0 and confidence < 75.0):
            return STATE_UNCERTAIN

        # Classification mapping: SYNTHETIC / CLONED -> CLONED VOICE
        if prediction == "REAL":
            return STATE_REAL
        elif prediction in ("SYNTHETIC", "CLONED"):
            return STATE_CLONED_VOICE
        else:
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
        
        Args:
            window_id: Window sequence index
            ml_response: Full raw JSON response from VoiceDetectorClient
            duration_seconds: Duration of speech analyzed in this window
            
        Returns:
            dict: Current aggregated assessment
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

        # Recompute stable call-level verdict with anti-flapping hysteresis (Section 14, 15, 16)
        self._recalculate_aggregated_verdict(latest_window=window_entry)

        # Developer debug log matching Section 28 & 30
        logger.info(
            f"Call {self.call_id} Window #{window_id}: "
            f"prediction={window_entry['raw_prediction']}, confidence={window_entry['confidence']:.1f}% | "
            f"Current call-level decision: {self.current_state} | "
            f"Stability: {self.stability_status} | Reason: {self.stability_reason}"
        )

        return self.get_summary()

    def _recalculate_aggregated_verdict(self, latest_window: Optional[Dict[str, Any]] = None) -> None:
        """
        Stable Call-Level Decision Engine with Recency-Weighted Scoring and Hysteresis (Section 14, 15, 16).
        Prevents rapid oscillation:
        REAL -> CLONED VOICE -> REAL -> CLONED VOICE
        A single dissenter or weak window does NOT flip an established state.
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

        # 1. Recency-weighted score calculation
        # Weights: 0.8^(N - 1 - i)
        decay = 0.80
        weights = [decay ** (n - 1 - i) for i in range(n)]
        total_weight = sum(weights) or 1.0

        weighted_real_prob = sum(self.window_history[i]["real_probability"] * weights[i] for i in range(n)) / total_weight
        weighted_synth_prob = sum(self.window_history[i]["synthetic_probability"] * weights[i] for i in range(n)) / total_weight
        weighted_confidence = sum(self.window_history[i]["confidence"] * weights[i] for i in range(n)) / total_weight

        # Candidate assessment from multi-window weighted evidence
        prob_difference = abs(weighted_real_prob - weighted_synth_prob)
        if weighted_confidence < self.uncertain_threshold or prob_difference < 12.0:
            evidence_candidate = STATE_UNCERTAIN
        elif weighted_synth_prob > weighted_real_prob:
            evidence_candidate = STATE_CLONED_VOICE
        else:
            evidence_candidate = STATE_REAL

        # Window 1: Establish initial call-level baseline
        if self.established_state is None or self.established_state == STATE_INSUFFICIENT_AUDIO:
            if evidence_candidate in (STATE_REAL, STATE_CLONED_VOICE):
                if weighted_confidence >= self.uncertain_threshold:
                    self.established_state = evidence_candidate
                    self.current_state = evidence_candidate
                    self.stability_status = STABILITY_STABLE
                    self.stability_reason = f"Initial state established as {evidence_candidate} ({weighted_confidence:.1f}% confidence)"
                else:
                    self.established_state = STATE_UNCERTAIN
                    self.current_state = STATE_UNCERTAIN
                    self.stability_status = STABILITY_STABLE
                    self.stability_reason = f"Initial window confidence ({weighted_confidence:.1f}%) below threshold, set to UNCERTAIN"
            else:
                self.established_state = STATE_UNCERTAIN
                self.current_state = STATE_UNCERTAIN
                self.stability_status = STABILITY_STABLE
                self.stability_reason = "Initial evidence inconclusive (UNCERTAIN)"
            self.consecutive_candidate_count = 0
            self.candidate_state = None

        else:
            # Subsequent windows: Hysteresis / Anti-Flapping evaluation (Section 14 & 16)
            latest_status = latest_window["mapped_status"] if latest_window else evidence_candidate

            if latest_status == self.established_state:
                # Latest window confirms the established state
                self.consecutive_candidate_count = 0
                self.candidate_state = None
                self.current_state = self.established_state
                self.stability_status = STABILITY_STABLE
                self.stability_reason = f"Evidence consistently confirms established {self.established_state}"

            else:
                # Latest window differs from established state: Track candidate persistence
                if self.candidate_state == latest_status:
                    self.consecutive_candidate_count += 1
                else:
                    self.candidate_state = latest_status
                    self.consecutive_candidate_count = 1

                # Check if strong enough evidence exists to flip the established state
                can_switch = False
                switch_reason = ""

                # Rule A: Switching from REAL -> CLONED VOICE
                # Requires at least min_confirming_windows (>= 2) consecutive CLONED VOICE windows
                # OR overwhelming weighted synthetic evidence (>= 80%)
                if self.established_state == STATE_REAL and latest_status == STATE_CLONED_VOICE:
                    if self.consecutive_candidate_count >= self.min_confirming_windows and weighted_synth_prob >= 65.0:
                        can_switch = True
                        switch_reason = f"Confirmed {self.consecutive_candidate_count} consecutive CLONED VOICE windows (weighted synth={weighted_synth_prob:.1f}%)"
                    elif weighted_synth_prob >= 80.0:
                        can_switch = True
                        switch_reason = f"Overwhelming synthetic probability ({weighted_synth_prob:.1f}% >= 80%)"

                # Rule B: Switching from CLONED VOICE -> REAL
                # Requires at least min_confirming_windows (>= 2) consecutive REAL windows with high confidence
                elif self.established_state == STATE_CLONED_VOICE and latest_status == STATE_REAL:
                    if self.consecutive_candidate_count >= self.min_confirming_windows and weighted_real_prob >= 70.0:
                        can_switch = True
                        switch_reason = f"Confirmed {self.consecutive_candidate_count} consecutive REAL windows (weighted real={weighted_real_prob:.1f}%)"
                    elif weighted_real_prob >= 82.0:
                        can_switch = True
                        switch_reason = f"Overwhelming real probability ({weighted_real_prob:.1f}% >= 82%)"

                # Rule C: Switching from solid state (REAL or CLONED) -> UNCERTAIN
                # Requires at least 3 consecutive uncertain windows
                elif self.established_state in (STATE_REAL, STATE_CLONED_VOICE) and latest_status == STATE_UNCERTAIN:
                    if self.consecutive_candidate_count >= 3:
                        can_switch = True
                        switch_reason = "3 consecutive inconclusive windows"

                # Rule D: Switching from UNCERTAIN -> REAL or CLONED VOICE
                elif self.established_state == STATE_UNCERTAIN:
                    if self.consecutive_candidate_count >= self.min_confirming_windows and weighted_confidence >= self.uncertain_threshold:
                        can_switch = True
                        switch_reason = f"Sufficient confirmed evidence for {latest_status}"

                if can_switch:
                    # Execute transition
                    old_state = self.established_state
                    self.established_state = latest_status
                    self.current_state = latest_status
                    self.consecutive_candidate_count = 0
                    self.candidate_state = None
                    self.stability_status = STABILITY_STABLE
                    self.stability_reason = f"Transitioned from {old_state} to {latest_status}: {switch_reason}"
                    logger.warning(
                        f"Call {self.call_id}: State transitioned to {self.current_state} ({switch_reason})"
                    )
                else:
                    # Retain established state - DO NOT FLAP!
                    self.current_state = self.established_state
                    self.stability_status = STABILITY_STABLE
                    self.stability_reason = "Insufficient evidence to change stable result"

        # Update metrics for current state
        if self.current_state == STATE_CLONED_VOICE:
            self.current_confidence = round(max(weighted_confidence, weighted_synth_prob), 1)
            self.current_risk_score = round(max(weighted_synth_prob, self.current_confidence), 1)
            self.current_risk_level = "HIGH" if self.current_risk_score >= 70.0 else "MEDIUM"
        elif self.current_state == STATE_REAL:
            self.current_confidence = round(max(weighted_confidence, weighted_real_prob), 1)
            self.current_risk_score = round(weighted_synth_prob, 1)
            self.current_risk_level = "LOW"
        elif self.current_state == STATE_UNCERTAIN:
            self.current_confidence = round(weighted_confidence, 1)
            self.current_risk_score = round(weighted_synth_prob, 1)
            self.current_risk_level = "MEDIUM"
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
            logger.info(
                f"Call {self.call_id} finalized with {len(self.window_history)} analyzed window(s) "
                f"({total_usable_speech_sec:.2f}s usable speech) -> Final State={self.current_state}, "
                f"Risk={self.current_risk_score}, Conf={self.current_confidence}%"
            )
        else:
            self.current_state = STATE_INSUFFICIENT_AUDIO
            self.established_state = STATE_INSUFFICIENT_AUDIO
            self.stability_status = STABILITY_STABLE
            self.stability_reason = "Call terminated with insufficient usable speech"
            self.current_confidence = 0.0
            self.current_risk_level = "LOW"
            self.current_risk_score = 0.0
            logger.info(
                f"Call {self.call_id} terminated with INSUFFICIENT AUDIO "
                f"({total_usable_speech_sec:.2f}s usable speech < minimum threshold)"
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
