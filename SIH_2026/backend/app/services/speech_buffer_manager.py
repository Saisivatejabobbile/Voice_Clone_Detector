"""
Speech Buffer & Voice Activity Detection (VAD) Manager
Isolates target-speaker speech, filters non-speech/silence, accumulates usable PCM,
and generates standard 16 kHz 16-bit Mono WAV window slices.
"""

import io
import wave
import math
import struct
import logging
from collections import deque
from typing import List, Optional, Tuple
from app.config import settings

logger = logging.getLogger(__name__)


class SimpleVAD:
    """
    Energy & Zero-Crossing Rate (ZCR) Voice Activity Detector.
    Calibrates background noise dynamically and distinguishes target human speech
    from ambient silence, IVR beeps, mic hum, and background noise.
    """

    def __init__(
        self,
        sample_rate: int = 16000,
        energy_threshold: float = 350.0,
        zcr_threshold: float = 0.04
    ):
        self.sample_rate = sample_rate
        self.energy_threshold = energy_threshold
        self.zcr_threshold = zcr_threshold
        self.noise_floor = 100.0

    def is_speech(self, pcm_samples: List[int]) -> Tuple[bool, float]:
        """
        Evaluate whether a PCM audio chunk contains active speech.
        
        Args:
            pcm_samples: List of signed 16-bit integers (-32768 to 32767)
            
        Returns:
            Tuple[bool, float]: (is_speech, calculated_rms)
        """
        if not pcm_samples or len(pcm_samples) < 16:
            return False, 0.0

        # Calculate Root Mean Square (RMS) energy
        sum_squares = sum(s * s for s in pcm_samples)
        rms = math.sqrt(sum_squares / len(pcm_samples))

        # Dynamic noise floor adaptation (slow tracking)
        if rms < self.energy_threshold:
            self.noise_floor = 0.95 * self.noise_floor + 0.05 * rms

        # Effective speech energy threshold with noise margin
        active_threshold = max(self.energy_threshold, self.noise_floor * 2.2)

        if rms < active_threshold:
            return False, rms

        # Zero-Crossing Rate (ZCR) calculation to reject static DC offset or low rumble
        zero_crossings = 0
        for i in range(1, len(pcm_samples)):
            if (pcm_samples[i] >= 0 and pcm_samples[i - 1] < 0) or (pcm_samples[i] < 0 and pcm_samples[i - 1] >= 0):
                zero_crossings += 1
        zcr = zero_crossings / len(pcm_samples)

        # Human speech typically has moderate ZCR; very high ZCR is hiss/white noise, very low is 50/60Hz hum
        is_active = (rms >= active_threshold) and (0.015 <= zcr <= 0.45)
        return is_active, rms


class SpeechBufferManager:
    """
    Manages transient audio accumulation for a single call session.
    Enforces target speaker isolation, VAD filtering, 60s ring buffer boundaries,
    and sliding window generation for the remote ML detector.
    """

    def __init__(
        self,
        call_id: str,
        sample_rate: int = 16000,
        min_usable_speech_sec: Optional[float] = None,
        window_size_sec: Optional[float] = None,
        window_slide_step_sec: Optional[float] = None,
        max_buffer_sec: Optional[float] = None
    ):
        self.call_id = call_id
        self.sample_rate = sample_rate
        self.min_usable_speech_sec = min_usable_speech_sec or getattr(settings, 'MIN_USABLE_SPEECH_SEC', 20.0)
        self.window_size_sec = window_size_sec or getattr(settings, 'WINDOW_SIZE_SEC', 25.0)
        self.window_slide_step_sec = window_slide_step_sec or getattr(settings, 'WINDOW_SLIDE_STEP_SEC', 5.0)
        self.max_buffer_sec = max_buffer_sec or getattr(settings, 'MAX_BUFFER_SEC', 60.0)

        # Convert to sample counts
        self.max_samples = int(self.sample_rate * self.max_buffer_sec)
        self.min_usable_samples = int(self.sample_rate * self.min_usable_speech_sec)
        self.window_size_samples = int(self.sample_rate * self.window_size_sec)
        self.window_slide_samples = int(self.sample_rate * self.window_slide_step_sec)

        # Deque ring buffer stores strictly usable target speech PCM samples
        self.usable_buffer = deque(maxlen=self.max_samples)
        
        # Telemetry metrics
        self.total_frames_received = 0
        self.total_speech_frames = 0
        self.total_silence_frames = 0
        self.total_usable_speech_samples = 0
        self.last_analyzed_sample_index = 0
        self.current_window_id = 0

        # Voice Activity Detector
        self.vad = SimpleVAD(sample_rate=self.sample_rate)

        logger.info(
            f"SpeechBufferManager created for call {call_id}: "
            f"min_speech={self.min_usable_speech_sec}s, window={self.window_size_sec}s, "
            f"slide={self.window_slide_step_sec}s, max_buf={self.max_buffer_sec}s"
        )

    def ingest_pcm_chunk(self, pcm_samples: List[int]) -> bool:
        """
        Ingest a raw PCM chunk from the remote target speaker stream.
        Passes through VAD; only speech samples are accumulated in the ring buffer.
        
        Args:
            pcm_samples: List of signed 16-bit integer PCM audio samples
            
        Returns:
            bool: True if chunk was classified as speech and buffered, False if silence/discarded
        """
        if not pcm_samples:
            return False

        self.total_frames_received += 1
        is_speech, rms = self.vad.is_speech(pcm_samples)

        if is_speech:
            self.total_speech_frames += 1
            self.usable_buffer.extend(pcm_samples)
            self.total_usable_speech_samples += len(pcm_samples)
            logger.debug(
                f"Call {self.call_id}: Speech frame #{self.total_speech_frames} appended "
                f"({len(pcm_samples)} samples, rms={rms:.1f}, "
                f"total_usable={self.get_usable_speech_duration():.2f}s)"
            )
            return True
        else:
            self.total_silence_frames += 1
            logger.debug(
                f"Call {self.call_id}: Discarded non-speech frame "
                f"({len(pcm_samples)} samples, rms={rms:.1f})"
            )
            return False

    def get_usable_speech_duration(self) -> float:
        """Total accumulated usable target speech in seconds."""
        return len(self.usable_buffer) / self.sample_rate

    def get_lifetime_speech_duration(self) -> float:
        """Lifetime usable speech detected across the entire call session."""
        return self.total_usable_speech_samples / self.sample_rate

    def is_ready_for_analysis(self) -> bool:
        """
        Determine if enough usable target speech has accumulated for an analysis slice.
        - First analysis requires >= MIN_USABLE_SPEECH_SEC (20.0s).
        - Subsequent analyses trigger when usable speech has grown by WINDOW_SLIDE_STEP_SEC (5.0s).
        """
        usable_samples = len(self.usable_buffer)
        if usable_samples < self.min_usable_samples:
            return False

        # If we haven't done an analysis yet, we are ready
        if self.current_window_id == 0:
            return True

        # Check if we have accumulated at least slide_step new samples since last analysis
        samples_since_last = usable_samples - self.last_analyzed_sample_index
        if samples_since_last >= self.window_slide_samples:
            return True

        return False

    def extract_window_wav(self) -> Optional[Tuple[bytes, int, float]]:
        """
        Extract a 16 kHz Mono 16-bit WAV slice for the ML API.
        Extracts up to WINDOW_SIZE_SEC of the most recent usable target speech.
        
        Returns:
            Optional[Tuple[bytes, int, float]]: (wav_bytes, window_id, duration_seconds)
            or None if insufficient speech.
        """
        usable_samples = len(self.usable_buffer)
        if usable_samples < self.min_usable_samples:
            logger.debug(
                f"Call {self.call_id}: Cannot extract window: usable speech "
                f"{usable_samples / self.sample_rate:.2f}s < {self.min_usable_speech_sec}s"
            )
            return None

        # Take up to WINDOW_SIZE_SEC samples from the end of the usable buffer
        slice_length = min(usable_samples, self.window_size_samples)
        slice_samples = list(self.usable_buffer)[-slice_length:]

        self.current_window_id += 1
        self.last_analyzed_sample_index = usable_samples
        duration_sec = len(slice_samples) / self.sample_rate

        # Pack into 16-bit PCM Mono WAV format
        wav_bytes = self._encode_pcm_to_wav(slice_samples, sample_rate=self.sample_rate)

        logger.info(
            f"Call {self.call_id}: Extracted Window #{self.current_window_id} "
            f"({len(slice_samples)} samples, {duration_sec:.2f}s, WAV size={len(wav_bytes):,} bytes)"
        )
        return wav_bytes, self.current_window_id, duration_sec

    def extract_final_window_wav(self) -> Optional[Tuple[bytes, int, float]]:
        """
        Executed during call termination lifecycle.
        If total usable speech >= MIN_USABLE_SPEECH_SEC, produces a final window slice.
        """
        usable_samples = len(self.usable_buffer)
        if usable_samples < self.min_usable_samples:
            return None

        return self.extract_window_wav()

    def _encode_pcm_to_wav(self, pcm_samples: List[int], sample_rate: int = 16000) -> bytes:
        """
        Convert list of signed 16-bit integers to standard RIFF WAV byte format.
        Channels: 1 (Mono), Sample Width: 2 bytes (16-bit), Rate: 16000 Hz.
        """
        byte_io = io.BytesIO()
        with wave.open(byte_io, 'wb') as wav_file:
            wav_file.setnchannels(1)  # Mono
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            # Clip and pack as signed short integers ('h' in struct format)
            clipped_samples = [max(-32768, min(32767, int(s))) for s in pcm_samples]
            raw_pcm_bytes = struct.pack(f'<{len(clipped_samples)}h', *clipped_samples)
            wav_file.writeframes(raw_pcm_bytes)

        return byte_io.getvalue()

    def clear(self) -> None:
        """Zero out buffer memory on call hangup/destruction."""
        released = len(self.usable_buffer)
        self.usable_buffer.clear()
        logger.info(f"SpeechBufferManager: Cleared buffer for call {self.call_id} ({released:,} samples released)")
