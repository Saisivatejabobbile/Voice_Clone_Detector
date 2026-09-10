"""Test AudioBuffer"""
import sys
sys.path.insert(0, 'app')

from services.audio_buffer import AudioBuffer

def test_audio_buffer():
    # Create buffer (1 second max for testing)
    buffer = AudioBuffer(sample_rate=16000, max_duration_seconds=1)
    
    # Test append
    chunk = [100] * 8000  # 0.5 seconds
    buffer.append(chunk)
    assert buffer.get_sample_count() == 8000
    print(f"[PASS] Appended 8000 samples, duration: {buffer.get_duration():.2f}s")
    
    # Test window extraction
    window = buffer.get_window(0.3)  # 300ms window
    assert len(window) == 4800  # 16000 * 0.3
    print(f"[PASS] Extracted 300ms window: {len(window)} samples")
    
    # Test ring buffer (overflow)
    buffer.append([200] * 16000)  # Fill completely
    assert buffer.is_full()
    print(f"[PASS] Buffer full at {buffer.get_sample_count()} samples")
    
    # Test clear
    buffer.clear()
    assert buffer.get_sample_count() == 0
    print("[PASS] Buffer cleared")
    
    print("\n=== All AudioBuffer tests passed! ===")

if __name__ == '__main__':
    test_audio_buffer()
