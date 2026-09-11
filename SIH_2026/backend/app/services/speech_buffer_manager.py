"""
Speech Buffer & Voice Activity Detection (VAD) Manager
Isolates target-speaker speech, filters non-speech/silence, accumulates usable PCM,
and generates standard 16 kHz 16-bit Mono WAV window slices.
Tracks call duration, target speech, other speaker duration, and silence duration separately.
"""

import io
import time
import wave
import math
import struct
import logging
from collections import deque
from typing import List, Optional, Tuple, Dict, Any
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
        energy_threshold: float = 150.0,
        zcr_threshold: float = 0.04
    ):
        self.sample_rate = sample_rate
        self.energy_threshold = energy_threshold
        self.zcr_threshold = zcr_threshold
        self.noise_floor = 50.0

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
    Tracks distinct durations: call_duration, target_speech, other_speaker, silence.
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
        
        # Telemetry and separate duration metrics (Section 7)
        self.session_start_time = time.time()
        self.total_frames_received = 0
        self.total_speech_frames = 0
        self.total_silence_frames = 0
        self.total_usable_speech_samples = 0
        self.other_speaker_samples = 0
        self.silence_samples = 0
        self.last_analyzed_sample_index = 0
        self.current_window_id = 0

        # Voice Activity Detector
        self.vad = SimpleVAD(sample_rate=self.sample_rate)

        logger.info(
            f"SpeechBufferManager created for call {call_id}: "
            f"min_speech={self.min_usable_speech_sec}s, window={self.window_size_sec}s, "
            f"slide={self.window_slide_step_sec}s, max_buf={self.max_buffer_sec}s"
        )

    def ingest_pcm_chunk(self, pcm_samples: List[int], speaker_role: str = "target") -> bool:
        """
        Ingest a raw PCM chunk from the audio stream (Section 4, 5, 6, 7).
        - If speaker_role is NOT 'target': accumulates other_speaker_duration and excludes from buffer.
        - If speaker_role IS 'target': passes through VAD. Silence is excluded from usable buffer.
        
        Args:
            pcm_samples: List of signed 16-bit integer PCM audio samples
            speaker_role: 'target' (target speaker to evaluate) or 'other' (interlocutor/agent)
            
        Returns:
            bool: True if chunk was classified as usable target speech, False otherwise
        """
        if not pcm_samples:
            return False

        self.total_frames_received += 1

        # Check speaker role: only target speaker speech is analyzed (Section 4, 5)
        if speaker_role.lower() != "target":
            self.other_speaker_samples += len(pcm_samples)
            logger.debug(
                f"Call {self.call_id}: Excluded {len(pcm_samples)} samples from non-target speaker ({speaker_role})"
            )
            return False

        # Target speaker VAD: Silence must not be counted as usable speech (Section 7, 8)
        is_speech, rms = self.vad.is_speech(pcm_samples)

        if is_speech:
            self.total_speech_frames += 1
            self.usable_buffer.extend(pcm_samples)
            self.total_usable_speech_samples += len(pcm_samples)
            logger.debug(
                f"Call {self.call_id}: Target speech frame #{self.total_speech_frames} appended "
                f"({len(pcm_samples)} samples, rms={rms:.1f}, "
                f"total_usable={self.get_usable_speech_duration():.2f}s)"
            )
            return True
        else:
            self.total_silence_frames += 1
            self.silence_samples += len(pcm_samples)
            logger.debug(
                f"Call {self.call_id}: Discarded target silence/noise frame "
                f"({len(pcm_samples)} samples, rms={rms:.1f})"
            )
            return False

    def get_call_duration(self) -> float:
        """Wall-clock elapsed call duration in seconds."""
        return max(0.0, time.time() - self.session_start_time)

    def get_usable_speech_duration(self) -> float:
        """Total accumulated usable target speech currently in ring buffer (seconds)."""
        return len(self.usable_buffer) / self.sample_rate

    def get_lifetime_speech_duration(self) -> float:
        """Lifetime usable target speech detected across the entire call session (seconds)."""
        return self.total_usable_speech_samples / self.sample_rate

    def get_other_speaker_duration(self) -> float:
        """Duration of other-speaker audio detected/excluded in seconds (Section 7)."""
        return self.other_speaker_samples / self.sample_rate

    def get_silence_duration(self) -> float:
        """Duration of discarded silence/ambient noise in seconds (Section 7)."""
        return self.silence_samples / self.sample_rate

    def get_progress_metrics(self) -> Dict[str, Any]:
        """
        Return the 5 distinct durations specified in Section 7 & 27.
        """
        return {
            "call_duration": round(self.get_call_duration(), 1),
            "target_speech_duration": round(self.get_lifetime_speech_duration(), 1),
            "other_speaker_duration": round(self.get_other_speaker_duration(), 1),
            "silence_duration": round(self.get_silence_duration(), 1),
            "usable_audio_duration": round(self.get_usable_speech_duration(), 1),
            "windows_analyzed": self.current_window_id
        }

    def is_ready_for_analysis(self) -> bool:
        """
        Determine if enough usable target speech has accumulated for an analysis slice.
        - First analysis requires >= MIN_USABLE_SPEECH_SEC (20.0s).
        - Subsequent analyses trigger when usable speech has grown by WINDOW_SLIDE_STEP_SEC (5.0s).
        Never triggers purely on wall-clock time if silence or other speaker is active (Section 8).
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
        Executed during call termination lifecycle (Section 11, 12, 20).
        Produces a final window slice of whatever usable target speech was accumulated,
        even if the call was cut under 20.0 seconds (requires at least 1.0s).
        """
        usable_samples = len(self.usable_buffer)
        min_cutoff_samples = int(self.sample_rate * 1.0)
        if usable_samples < min_cutoff_samples:
            return None

        slice_samples = list(self.usable_buffer)
        self.current_window_id += 1
        self.last_analyzed_sample_index = usable_samples
        duration_sec = len(slice_samples) / self.sample_rate

        wav_bytes = self._encode_pcm_to_wav(slice_samples, sample_rate=self.sample_rate)
        logger.info(
            f"Call {self.call_id}: Extracted Cutoff/Final Window #{self.current_window_id} "
            f"({len(slice_samples)} samples, {duration_sec:.2f}s, WAV size={len(wav_bytes):,} bytes)"
        )
        return wav_bytes, self.current_window_id, duration_sec

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
        """Clean up buffers upon call termination."""
        self.usable_buffer.clear()
        self.total_usable_speech_samples = 0
