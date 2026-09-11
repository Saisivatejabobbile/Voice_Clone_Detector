"""
Voice Detector ML API Client
Modular client for remote ASSIST-based voice spoof detection API (trained on NISP dataset for Hindi & Telugu).

Endpoints:
- GET  /health
- POST /api/analyze (Header: x-api-key, multipart/form-data form field 'file')
"""

import io
import wave
import httpx
import logging
import asyncio
import numpy as np
from typing import Dict, Any, Optional
from app.config import settings

logger = logging.getLogger(__name__)


class VoiceDetectorClient:
    """
    Dedicated client for interfacing with remote Voice Spoof Detection ML API.
    Features:
    - GET /health service check
    - POST /api/analyze multipart upload of 16 kHz WAV audio
    - Header-based API key authentication (x-api-key)
    - 15-second per-request timeout
    - Exponential backoff retry (up to 3 attempts, 500ms initial delay)
    - Non-blocking error handling (never crashes live stream)
    - Complete raw JSON payload preservation
    """

    def __init__(
        self,
        api_url: Optional[str] = None,
        health_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: Optional[int] = None
    ):
        self.api_url = api_url or settings.VOICE_DETECTOR_API_URL
        self.health_url = health_url or settings.VOICE_DETECTOR_HEALTH_URL
        self.api_key = api_key or settings.VOICE_DETECTOR_API_KEY
        self.timeout = timeout or settings.VOICE_DETECTOR_TIMEOUT_SECONDS or 15
        self.max_retries = 3
        self.initial_retry_delay = 0.5  # 500ms

        logger.info(
            f"VoiceDetectorClient initialized: endpoint={self.api_url}, "
            f"timeout={self.timeout}s, retries={self.max_retries}"
        )

    async def check_health(self) -> Dict[str, Any]:
        """
        Verify remote ML API service availability via GET /health.
        
        Returns:
            dict with health status, e.g. {"status": "healthy", "available": True}
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                headers = {"x-api-key": self.api_key} if self.api_key else {}
                response = await client.get(self.health_url, headers=headers)
                if response.status_code == 200:
                    try:
                        data = response.json()
                    except Exception:
                        data = {"status": "ok", "raw": response.text}
                    logger.info(f"VoiceDetectorClient health check SUCCESS: {data}")
                    return {"available": True, "data": data, "status_code": response.status_code}
                else:
                    logger.warning(
                        f"VoiceDetectorClient health check returned status {response.status_code}: {response.text}"
                    )
                    return {"available": False, "status_code": response.status_code, "error": response.text}
        except Exception as e:
            logger.warning(f"VoiceDetectorClient health check FAILED: {e}")
            return {"available": False, "error": str(e)}

    async def analyze_audio(
        self,
        wav_bytes: bytes,
        filename: str = "target_speech_window.wav"
    ) -> Dict[str, Any]:
        """
        Send 16 kHz Mono WAV audio bytes to remote ML API with retry and fallback.
        
        Args:
            wav_bytes: 16 kHz, 16-bit PCM Mono WAV audio byte stream
            filename: Form-data filename parameter
            
        Returns:
            dict containing raw response keys:
                - language (str)
                - prediction (str): "REAL", "SYNTHETIC", or "CLONED"
                - real_probability (float)
                - synthetic_probability (float)
                - confidence (float)
                - risk_level (str)
                - original_scores (dict)
                - duration_seconds (float)
                - windows_analyzed (int)
                - original_sample_rate (int)
                - threshold (float)
                - language_confidence (float)
                - detected_language_code (str)
                - raw_response (dict)
                - is_fallback (bool)
        """
        if not wav_bytes or len(wav_bytes) == 0:
            logger.warning("VoiceDetectorClient: Received empty audio bytes. Returning insufficient audio fallback.")
            return self._insufficient_audio_fallback(reason="empty_audio_data")

        # Sanitize filename to ensure valid HTTP multipart form header
        clean_filename = "".join(c for c in filename if c.isalnum() or c in "._-") or "audio_window.wav"
        if not clean_filename.endswith(".wav"):
            clean_filename += ".wav"

        headers = {
            "x-api-key": self.api_key,
            "User-Agent": "VoiceShield-IntegrityEngine/1.0"
        }

        files = {
            "file": (clean_filename, wav_bytes, "audio/wav")
        }

        delay = self.initial_retry_delay
        last_error = None

        for attempt in range(1, self.max_retries + 1):
            try:
                logger.debug(
                    f"VoiceDetectorClient: Dispatching analysis attempt {attempt}/{self.max_retries} "
                    f"({len(wav_bytes):,} bytes, target={self.api_url})"
                )
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.post(
                        self.api_url,
                        headers=headers,
                        files=files
                    )

                    # Check for rate limits or server errors that should trigger retry
                    if response.status_code in (429, 500, 502, 503, 504):
                        logger.warning(
                            f"VoiceDetectorClient: Attempt {attempt} received HTTP {response.status_code}. "
                            f"Retrying in {delay:.2f}s..."
                        )
                        last_error = f"HTTP {response.status_code}: {response.text}"
                        await asyncio.sleep(delay)
                        delay *= 2  # Exponential backoff
                        continue

                    # Handle model language uncertainty or ambiguous language response
                    if response.status_code == 422:
                        try:
                            err_json = response.json()
                            detail = err_json.get("detail", {})
                            if isinstance(detail, dict) and detail.get("error") == "UNSUPPORTED_OR_UNCERTAIN_LANGUAGE":
                                lang = detail.get("detected_language", "und")
                                lang_conf = float(detail.get("detected_language_confidence", 50.0))
                                logger.info(f"VoiceDetectorClient: Model returned language uncertainty ({lang})")
                                return self._standardize_response({
                                    "prediction": "UNCERTAIN",
                                    "real_probability": 50.0,
                                    "synthetic_probability": 50.0,
                                    "confidence": 50.0,
                                    "risk_level": "MEDIUM",
                                    "language": lang,
                                    "detected_language_code": lang,
                                    "language_confidence": lang_conf,
                                    "raw_response": err_json,
                                    "error": "UNSUPPORTED_OR_UNCERTAIN_LANGUAGE"
                                }, is_fallback=True)
                        except Exception as parse_err:
                            logger.debug(f"Could not parse 422 detail: {parse_err}")

                    if response.status_code >= 400:
                        logger.error(f"VoiceDetectorClient: HTTP {response.status_code} error body: {response.text}")
                        last_error = f"HTTP {response.status_code}: {response.text}"

                    response.raise_for_status()
                    result = response.json()

                    logger.info(
                        f"VoiceDetectorClient: Analysis SUCCESS. "
                        f"pred={result.get('prediction')}, conf={result.get('confidence')}%, "
                        f"lang={result.get('language')} ({result.get('detected_language_code')})"
                    )

                    # Ensure standard keys are present while preserving full raw dictionary
                    standardized = self._standardize_response(result, is_fallback=False)
                    return standardized

            except (httpx.TimeoutException, httpx.NetworkError, httpx.ConnectError) as net_err:
                last_error = f"Network/Timeout error: {str(net_err)}"
                logger.warning(
                    f"VoiceDetectorClient: Attempt {attempt} failed with network error: {net_err}. "
                    f"Retrying in {delay:.2f}s..."
                )
                if attempt < self.max_retries:
                    await asyncio.sleep(delay)
                    delay *= 2
            except Exception as ex:
                last_error = f"Unexpected client error: {str(ex)}"
                logger.error(f"VoiceDetectorClient: Error during analysis attempt {attempt}: {ex}", exc_info=True)
                if attempt < self.max_retries:
                    await asyncio.sleep(delay)
                    delay *= 2

        logger.error(
            f"VoiceDetectorClient: All {self.max_retries} attempts failed ({last_error}). "
            f"Invoking resilient fallback without terminating live call stream."
        )
        return self._create_resilient_fallback(wav_bytes=wav_bytes, error_message=last_error)

    def _normalize_probability(self, value: float) -> float:
        """Auto-detect if value is in 0-1 decimal scale or 0-100 percentage scale and normalize to 0-100."""
        if 0.0 <= value <= 1.0 and value != 0.0 and value != 1.0:
            # Likely a decimal probability (e.g., 0.92), convert to percentage
            return round(value * 100.0, 2)
        return round(value, 2)

    def _standardize_response(self, raw: Dict[str, Any], is_fallback: bool = False) -> Dict[str, Any]:
        """Normalize raw JSON response while preserving all original keys.
        Handles both 0-1 decimal and 0-100 percentage scales from the ML API."""
        raw_pred = str(raw.get("prediction", raw.get("label", raw.get("result", "UNCERTAIN")))).upper().strip()
        if raw_pred in ("REAL", "BONAFIDE", "HUMAN", "GENUINE", "ORIGINAL"):
            prediction = "REAL"
        elif raw_pred in ("CLONED", "SYNTHETIC", "AI", "SPOOF", "FAKE", "CLONE", "DEEPFAKE"):
            prediction = "CLONED"
        elif raw_pred in ("INSUFFICIENT AUDIO", "INSUFFICIENT_AUDIO"):
            prediction = "INSUFFICIENT AUDIO"
        else:
            prediction = "UNCERTAIN"
        
        # Extract raw values
        raw_conf = float(raw.get("confidence", 0.0))
        raw_real = float(raw.get("real_probability", raw.get("real_prob", 0.0)))
        raw_synth = float(raw.get("synthetic_probability", raw.get("synth_prob", raw.get("fake_probability", 0.0))))
        
        has_explicit_real = ("real_probability" in raw or "real_prob" in raw) and raw_real > 0.0
        has_explicit_synth = ("synthetic_probability" in raw or "synth_prob" in raw or "fake_probability" in raw) and raw_synth > 0.0
        
        conf = self._normalize_probability(raw_conf) if raw_conf > 0 else 0.0
        
        if has_explicit_real and has_explicit_synth:
            real_prob = self._normalize_probability(raw_real)
            synth_prob = self._normalize_probability(raw_synth)
            if conf == 0.0:
                conf = round(max(real_prob, synth_prob), 2)
        elif has_explicit_real:
            real_prob = self._normalize_probability(raw_real)
            synth_prob = round(max(0.0, 100.0 - real_prob), 2)
            if conf == 0.0:
                conf = real_prob
        elif has_explicit_synth:
            synth_prob = self._normalize_probability(raw_synth)
            real_prob = round(max(0.0, 100.0 - synth_prob), 2)
            if conf == 0.0:
                conf = synth_prob
        else:
            # Neither real nor synthetic probability was explicitly returned by the ML model.
            # Derive coherently according to the model's prediction!
            if conf == 0.0:
                conf = 85.0
            if prediction == "REAL":
                real_prob = conf
                synth_prob = round(max(0.0, 100.0 - conf), 2)
            elif prediction == "CLONED":
                synth_prob = conf
                real_prob = round(max(0.0, 100.0 - conf), 2)
            else:
                real_prob = 50.0
                synth_prob = 50.0
                conf = 50.0
        
        risk_level = str(raw.get("risk_level", "LOW" if prediction == "REAL" else ("HIGH" if prediction == "CLONED" else "MEDIUM"))).upper()

        logger.info(
            f"VoiceDetectorClient STANDARDIZE: "
            f"raw_conf={raw_conf}, raw_real={raw_real}, raw_synth={raw_synth} → "
            f"normalized: conf={conf}%, real={real_prob}%, synth={synth_prob}%, "
            f"prediction={prediction}, is_fallback={is_fallback}"
        )

        return {
            "prediction": prediction,
            "real_probability": round(real_prob, 2),
            "synthetic_probability": round(synth_prob, 2),
            "confidence": round(conf, 2),
            "risk_level": risk_level,
            "original_scores": raw.get("original_scores", {
                "REAL": round(real_prob, 2),
                "SYNTHETIC": round(synth_prob, 2),
                "CLONED": round(synth_prob, 2) if prediction == "CLONED" else 0.0
            }),
            "duration_seconds": float(raw.get("duration_seconds", 25.0)),
            "windows_analyzed": int(raw.get("windows_analyzed", 1)),
            "original_sample_rate": int(raw.get("original_sample_rate", 16000)),
            "threshold": float(raw.get("threshold", 0.5)),
            "language": str(raw.get("language", "hindi")).lower(),
            "language_confidence": float(raw.get("language_confidence", 95.0)),
            "detected_language_code": str(raw.get("detected_language_code", "hi")).lower(),
            "filename": str(raw.get("filename", "audio_window.wav")),
            "is_fallback": is_fallback,
            "raw_response": raw
        }

    def _insufficient_audio_fallback(self, reason: str = "insufficient_speech") -> Dict[str, Any]:
        """Return structured response when audio length is insufficient for analysis."""
        return {
            "prediction": "INSUFFICIENT AUDIO",
            "real_probability": 0.0,
            "synthetic_probability": 0.0,
            "confidence": 0.0,
            "risk_level": "LOW",
            "original_scores": {"REAL": 0.0, "SYNTHETIC": 0.0, "CLONED": 0.0},
            "duration_seconds": 0.0,
            "windows_analyzed": 0,
            "original_sample_rate": 16000,
            "threshold": 0.5,
            "language": "unknown",
            "language_confidence": 0.0,
            "detected_language_code": "und",
            "filename": "insufficient_audio.wav",
            "is_fallback": True,
            "error": reason,
            "raw_response": {"status": "INSUFFICIENT AUDIO", "reason": reason}
        }

    def _create_resilient_fallback(self, wav_bytes: bytes, error_message: str) -> Dict[str, Any]:
        """
        Generate non-blocking UNCERTAIN fallback on remote service outage.
        Never crashes the live audio stream.
        """
        return {
            "prediction": "UNCERTAIN",
            "real_probability": 50.0,
            "synthetic_probability": 50.0,
            "confidence": 50.0,
            "risk_level": "MEDIUM",
            "original_scores": {"REAL": 50.0, "SYNTHETIC": 50.0, "CLONED": 0.0},
            "duration_seconds": 25.0,
            "windows_analyzed": 1,
            "original_sample_rate": 16000,
            "threshold": 0.5,
            "language": "hindi",
            "language_confidence": 50.0,
            "detected_language_code": "hi",
            "filename": "fallback_slice.wav",
            "is_fallback": True,
            "error": error_message,
            "raw_response": {
                "status": "service_unavailable_fallback",
                "error": error_message
            }
        }


# Singleton factory
_client_instance: Optional[VoiceDetectorClient] = None

def get_voice_detector_client() -> VoiceDetectorClient:
    """Get or create singleton VoiceDetectorClient."""
    global _client_instance
    if _client_instance is None:
        _client_instance = VoiceDetectorClient()
    return _client_instance
