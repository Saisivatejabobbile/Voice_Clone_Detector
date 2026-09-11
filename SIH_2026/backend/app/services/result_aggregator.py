"""
Result Aggregator & Voice State Engine
Implements application-level voice classification mapping (REAL, CLONED VOICE, UNCERTAIN, INSUFFICIENT AUDIO),
recency-weighted multi-window aggregation, spoof priority safety rules, and language switching tracking.
"""

import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from app.config import settings

logger = logging.getLogger(__name__)

# The 4 strictly defined application states
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


class ResultAggregator:
    """
    Session-level result aggregator for a live call.
    Maintains an immutable chronological history of all ML predictions,
    performs multi-window weighted scoring, manages language metadata,
    and maps raw predictions into the four core application states.
    """

    def __init__(
        self,
        call_id: str,
        uncertain_threshold: Optional[float] = None
    ):
        self.call_id = call_id
        self.uncertain_threshold = uncertain_threshold or getattr(settings, 'UNCERTAIN_CONFIDENCE_THRESHOLD', 60.0)
        
        # Chronological immutable window records
        self.window_history: List[Dict[str, Any]] = []
        
        # Language tracking
        self.detected_languages: List[Dict[str, Any]] = []
        self.primary_language: str = "hindi"
        self.primary_language_code: str = "hi"

        # Current aggregated state
        self.current_state: str = STATE_INSUFFICIENT_AUDIO
        self.current_confidence: float = 0.0
        self.current_risk_level: str = "LOW"
        self.current_risk_score: float = 0.0

        logger.info(
            f"ResultAggregator initialized for call {call_id}: "
            f"uncertain_threshold={self.uncertain_threshold}%"
        )

    def map_single_window_prediction(self, ml_response: Dict[str, Any]) -> str:
        """
        Map a single ML model response to one of the application states:
        - REAL
        - CLONED VOICE
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

        # Ambiguity / low confidence check
        prob_diff = abs(real_prob - synth_prob)
        if confidence < self.uncertain_threshold or (prob_diff < 15.0 and confidence < 75.0):
            logger.info(
                f"Call {self.call_id}: Prediction '{prediction}' flagged UNCERTAIN "
                f"(conf={confidence:.1f}%, real={real_prob:.1f}%, synth={synth_prob:.1f}%)"
            )
            return STATE_UNCERTAIN

        # Classification mapping
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
        Record a new window response from the ML detector and compute new aggregated verdict.
        Never overwrites raw scores or deletes previous responses.
        
        Args:
            window_id: Window sequence index
            ml_response: Full raw JSON response from VoiceDetectorClient
            duration_seconds: Duration of speech analyzed in this window
            
        Returns:
            dict: Current aggregated assessment
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        mapped_status = self.map_single_window_prediction(ml_response)

        # Track language metadata
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

        # Immutable window entry preserving complete raw payload
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

        # Recompute aggregated session verdict
        self._recalculate_aggregated_verdict()

        logger.info(
            f"Call {self.call_id} Window #{window_id} recorded: "
            f"mapped={mapped_status} | aggregated={self.current_state} "
            f"(conf={self.current_confidence:.1f}%, risk={self.current_risk_level})"
        )

        return self.get_summary()

    def _recalculate_aggregated_verdict(self) -> None:
        """
        Multi-window recency-weighted aggregation with Safety Priority Rule.
        """
        if not self.window_history:
            self.current_state = STATE_INSUFFICIENT_AUDIO
            self.current_confidence = 0.0
            self.current_risk_level = "LOW"
            self.current_risk_score = 0.0
            return

        # 1. Safety Priority Rule:
        # If any window has a high-confidence CLONED VOICE (SYNTHETIC/CLONED with conf >= 75%)
        # or two consecutive windows show CLONED VOICE, prioritize CLONED VOICE for operator alert.
        cloned_windows = [
            w for w in self.window_history 
            if w["mapped_status"] == STATE_CLONED_VOICE and w["confidence"] >= self.uncertain_threshold
        ]
        
        has_high_threat = any(w["confidence"] >= 75.0 for w in cloned_windows)
        has_multiple_spoofs = len(cloned_windows) >= 2

        # 2. Recency-weighted score calculation
        # Weights: 0.7^(N - 1 - i)
        weights = []
        n = len(self.window_history)
        decay = 0.75
        for i in range(n):
            w = decay ** (n - 1 - i)
            weights.append(w)
        total_weight = sum(weights) or 1.0

        weighted_real_prob = sum(self.window_history[i]["real_probability"] * weights[i] for i in range(n)) / total_weight
        weighted_synth_prob = sum(self.window_history[i]["synthetic_probability"] * weights[i] for i in range(n)) / total_weight
        weighted_confidence = sum(self.window_history[i]["confidence"] * weights[i] for i in range(n)) / total_weight

        # 3. Determine final state
        if has_high_threat or has_multiple_spoofs:
            self.current_state = STATE_CLONED_VOICE
            max_spoof_conf = max(w["confidence"] for w in cloned_windows)
            self.current_confidence = round(max_spoof_conf, 2)
            self.current_risk_score = round(max(weighted_synth_prob, max_spoof_conf), 1)
            self.current_risk_level = "HIGH" if self.current_risk_score >= 70.0 else "MEDIUM"
            logger.warning(
                f"Call {self.call_id}: Safety Priority Rule triggered -> CLONED VOICE "
                f"(high_threat={has_high_threat}, count={len(cloned_windows)}, score={self.current_risk_score}%)"
            )
            return

        # Probabilistic evaluation
        prob_difference = abs(weighted_real_prob - weighted_synth_prob)
        if weighted_confidence < self.uncertain_threshold or prob_difference < 15.0:
            self.current_state = STATE_UNCERTAIN
            self.current_confidence = round(weighted_confidence, 2)
            self.current_risk_score = round(weighted_synth_prob, 1)
            self.current_risk_level = "MEDIUM"
        elif weighted_synth_prob > weighted_real_prob:
            self.current_state = STATE_CLONED_VOICE
            self.current_confidence = round(weighted_confidence, 2)
            self.current_risk_score = round(weighted_synth_prob, 1)
            self.current_risk_level = "HIGH" if self.current_risk_score >= 70.0 else "MEDIUM"
        else:
            self.current_state = STATE_REAL
            self.current_confidence = round(weighted_confidence, 2)
            self.current_risk_score = round(weighted_synth_prob, 1)
            self.current_risk_level = "LOW"

    def finalize_call(self, total_usable_speech_sec: float) -> Dict[str, Any]:
        """
        Execute final verdict aggregation upon call termination.
        If any windows have been analyzed (including short-call cutoff analysis),
        computes the real aggregated verdict.
        Only marks INSUFFICIENT AUDIO if literally zero analyzed speech exists (< 1.0s).
        """
        if len(self.window_history) > 0:
            self._recalculate_aggregated_verdict()
            logger.info(
                f"Call {self.call_id} finalized with {len(self.window_history)} analyzed window(s) "
                f"({total_usable_speech_sec:.2f}s speech) -> State={self.current_state}, Risk={self.current_risk_score}"
            )
        else:
            self.current_state = STATE_INSUFFICIENT_AUDIO
            self.current_confidence = 0.0
            self.current_risk_level = "LOW"
            self.current_risk_score = 0.0
            logger.info(
                f"Call {self.call_id} terminated with INSUFFICIENT AUDIO "
                f"({total_usable_speech_sec:.2f}s usable speech - no speech frames captured)"
            )

        return self.get_summary()

    def get_summary(self) -> Dict[str, Any]:
        """Return standardized user-facing verdict summary."""
        return {
            "call_id": self.call_id,
            "voice_status": self.current_state,
            "confidence": self.current_confidence,
            "risk_level": self.current_risk_level,
            "risk_score": self.current_risk_score,
            "primary_language": self.primary_language,
            "detected_language_code": self.primary_language_code,
            "detected_languages": self.detected_languages,
            "windows_analyzed": len(self.window_history),
            "window_history": self.window_history,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
