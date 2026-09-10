"""
AudioBuffer for Transient Audio Storage
Bounded in-memory buffer for audio processing
"""

import logging
from collections import deque
from typing import List

logger = logging.getLogger(__name__)


class AudioBuffer:
    """
    Bounded ring buffer for transient audio storage.
    
    Stores audio samples in memory with automatic cleanup.
    Maximum duration prevents unbounded memory growth.
    
    Requirements: 11.6, 13.1, 13.2, 13.5
    """
    
    def __init__(
        self,
        sample_rate: int = 16000,
        max_duration_seconds: int = 30
    ):
        """
        Initialize audio buffer.
        
        Args:
            sample_rate: Audio sample rate (default: 16000 Hz)
            max_duration_seconds: Maximum buffer duration (default: 30s)
        """
        self.sample_rate = sample_rate
        self.max_duration_seconds = max_duration_seconds
        
        # Calculate maximum samples
        self.max_samples = sample_rate * max_duration_seconds
        
        # Use deque for efficient ring buffer (O(1) append/pop)
        self.buffer = deque(maxlen=self.max_samples)
        
        logger.info(
            f"AudioBuffer initialized: {sample_rate}Hz, "
            f"max {max_duration_seconds}s ({self.max_samples:,} samples)"
        )
    
    def append(self, pcm_chunk: List[int]) -> None:
        """
        Append PCM audio chunk to buffer.
        
        Uses ring buffer - old samples automatically dropped when full.
        
        Args:
            pcm_chunk: List of Int16 PCM samples
        """
        self.buffer.extend(pcm_chunk)
        
        logger.debug(
            f"Appended {len(pcm_chunk)} samples "
            f"(buffer: {len(self.buffer)}/{self.max_samples})"
        )
    
    def get_window(self, duration_seconds: float) -> List[int]:
        """
        Extract recent audio window from buffer.
        
        Args:
            duration_seconds: Duration of window to extract (e.g., 3.0 for 3 seconds)
        
        Returns:
            List[int]: PCM samples from recent window (may be shorter if buffer < duration)
        """
        # Calculate number of samples needed
        num_samples = int(self.sample_rate * duration_seconds)
        
        # Get most recent samples (up to num_samples)
        window_size = min(num_samples, len(self.buffer))
        
        if window_size == 0:
            return []
        
        # Extract from end of buffer
        window = list(self.buffer)[-window_size:]
        
        logger.debug(
            f"Extracted {len(window)} samples "
            f"({duration_seconds}s window)"
        )
        
        return window
    
    def clear(self) -> None:
        """Clear buffer and release memory."""
        sample_count = len(self.buffer)
        self.buffer.clear()
        
        logger.info(f"AudioBuffer cleared ({sample_count:,} samples released)")
    
    def get_duration(self) -> float:
        """Get current buffer duration in seconds."""
        return len(self.buffer) / self.sample_rate
    
    def get_sample_count(self) -> int:
        """Get current number of samples in buffer."""
        return len(self.buffer)
    
    def is_full(self) -> bool:
        """Check if buffer is at maximum capacity."""
        return len(self.buffer) >= self.max_samples
