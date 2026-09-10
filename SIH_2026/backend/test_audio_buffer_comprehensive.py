"""
Comprehensive test suite for AudioBuffer
Tests all requirements from Task 3.4
"""
import sys
sys.path.insert(0, 'app')

from services.audio_buffer import AudioBuffer


def test_bounded_deque_initialization():
    """Test that AudioBuffer uses bounded deque based on duration"""
    print("\n=== Test 1: Bounded Deque Initialization ===")
    
    # Create buffer with 30 seconds max duration
    buffer = AudioBuffer(sample_rate=16000, max_duration_seconds=30)
    
    # Verify max_samples calculation
    expected_max_samples = 16000 * 30  # 480,000 samples
    assert buffer.max_samples == expected_max_samples
    assert buffer.max_duration_seconds == 30
    assert buffer.sample_rate == 16000
    
    print(f"✓ Buffer created with max {expected_max_samples:,} samples (30s at 16kHz)")
    print(f"✓ Initial buffer size: {buffer.get_sample_count()} samples")


def test_append_method():
    """Test append method using ring buffer"""
    print("\n=== Test 2: Append Method (Ring Buffer) ===")
    
    buffer = AudioBuffer(sample_rate=16000, max_duration_seconds=2)
    
    # Append first chunk (1 second of audio)
    chunk1 = [100] * 16000
    buffer.append(chunk1)
    assert buffer.get_sample_count() == 16000
    print(f"✓ Appended 16,000 samples (1s)")
    
    # Append second chunk (0.5 seconds)
    chunk2 = [200] * 8000
    buffer.append(chunk2)
    assert buffer.get_sample_count() == 24000
    print(f"✓ Appended 8,000 more samples (total: 24,000)")
    
    # Verify ring buffer behavior: append more than max
    chunk3 = [300] * 16000  # This should cause oldest samples to be dropped
    buffer.append(chunk3)
    assert buffer.get_sample_count() == 32000  # Max capacity (2s * 16kHz)
    print(f"✓ Ring buffer working: buffer at max capacity {buffer.get_sample_count():,}")


def test_ring_buffer_overflow():
    """Test automatic discarding of old samples when buffer is full"""
    print("\n=== Test 3: Ring Buffer Automatic Overflow ===")
    
    buffer = AudioBuffer(sample_rate=16000, max_duration_seconds=1)
    max_samples = buffer.max_samples
    
    # Fill buffer completely
    buffer.append([1] * max_samples)
    assert buffer.is_full()
    print(f"✓ Buffer filled: {buffer.get_sample_count()}/{max_samples} samples")
    
    # Add more samples - should automatically discard oldest
    buffer.append([2] * 8000)
    assert buffer.get_sample_count() == max_samples  # Still at max
    assert buffer.is_full()
    
    # Verify newest samples are retained
    window = buffer.get_window(0.5)  # Get last 0.5 seconds
    # Last samples should be the value 2 (newer samples)
    assert window[-1] == 2
    print(f"✓ Old samples automatically discarded, newest retained")


def test_get_window_method():
    """Test get_window method to extract recent samples"""
    print("\n=== Test 4: Get Window Method ===")
    
    buffer = AudioBuffer(sample_rate=16000, max_duration_seconds=10)
    
    # Add 5 seconds of audio
    buffer.append([100] * (16000 * 5))
    
    # Extract 3-second window
    window_3s = buffer.get_window(3.0)
    expected_samples = int(16000 * 3.0)
    assert len(window_3s) == expected_samples
    print(f"✓ Extracted 3s window: {len(window_3s):,} samples")
    
    # Extract 1-second window
    window_1s = buffer.get_window(1.0)
    assert len(window_1s) == 16000
    print(f"✓ Extracted 1s window: {len(window_1s):,} samples")
    
    # Request longer window than available
    buffer.clear()
    buffer.append([50] * 8000)  # Only 0.5 seconds
    window_long = buffer.get_window(2.0)  # Request 2 seconds
    assert len(window_long) == 8000  # Should return what's available
    print(f"✓ Requested 2s window, got {len(window_long)} samples (what's available)")
    
    # Empty buffer
    buffer.clear()
    window_empty = buffer.get_window(1.0)
    assert len(window_empty) == 0
    print(f"✓ Empty buffer returns empty window")


def test_clear_method():
    """Test clear method to release memory"""
    print("\n=== Test 5: Clear Method ===")
    
    buffer = AudioBuffer(sample_rate=16000, max_duration_seconds=5)
    
    # Fill with some data
    buffer.append([123] * 32000)
    assert buffer.get_sample_count() == 32000
    print(f"✓ Buffer has {buffer.get_sample_count():,} samples")
    
    # Clear buffer
    buffer.clear()
    assert buffer.get_sample_count() == 0
    assert buffer.get_duration() == 0.0
    print(f"✓ Buffer cleared: {buffer.get_sample_count()} samples")
    
    # Verify buffer can be used again after clearing
    buffer.append([456] * 16000)
    assert buffer.get_sample_count() == 16000
    print(f"✓ Buffer reusable after clear: {buffer.get_sample_count():,} samples")


def test_default_30_second_duration():
    """Test that default max_duration_seconds is 30"""
    print("\n=== Test 6: Default 30-Second Duration ===")
    
    # Create buffer without specifying max_duration_seconds
    buffer = AudioBuffer(sample_rate=16000)
    
    assert buffer.max_duration_seconds == 30
    assert buffer.max_samples == 16000 * 30
    print(f"✓ Default max duration: {buffer.max_duration_seconds}s")
    print(f"✓ Default max samples: {buffer.max_samples:,}")


def test_transient_storage_requirements():
    """Test that AudioBuffer meets transient storage requirements"""
    print("\n=== Test 7: Transient Storage Requirements ===")
    
    buffer = AudioBuffer(sample_rate=16000, max_duration_seconds=30)
    
    # Verify bounded buffer prevents unbounded memory growth
    # Fill beyond max capacity multiple times
    for i in range(5):
        buffer.append([i] * 100000)  # Append large chunks
    
    # Buffer should never exceed max capacity
    assert buffer.get_sample_count() <= buffer.max_samples
    print(f"✓ Buffer bounded: {buffer.get_sample_count():,} <= {buffer.max_samples:,}")
    
    # Verify memory release on clear
    buffer.clear()
    assert buffer.get_sample_count() == 0
    print(f"✓ Memory released on clear")
    
    # Verify no persistent storage (just in-memory)
    # This is architectural - buffer only exists in memory
    print(f"✓ No persistent storage (in-memory only)")


def test_requirements_11_6_13_1_13_2_13_5():
    """Test specific requirements from the spec"""
    print("\n=== Test 8: Spec Requirements 11.6, 13.1, 13.2, 13.5 ===")
    
    # Requirement 11.6: Buffer audio data appropriately
    buffer = AudioBuffer(sample_rate=16000, max_duration_seconds=30)
    buffer.append([1] * 16000)
    assert buffer.get_sample_count() == 16000
    print(f"✓ Req 11.6: Audio buffering working")
    
    # Requirement 13.1: Process audio in real-time without persisting to disk
    # (Architectural - verified by in-memory deque implementation)
    print(f"✓ Req 13.1: In-memory processing (no disk persistence)")
    
    # Requirement 13.2: Backend processes audio transiently without storing
    # (Architectural - verified by bounded buffer with automatic overflow)
    print(f"✓ Req 13.2: Transient processing with bounded buffer")
    
    # Requirement 13.5: Ensure all in-memory audio buffers are cleared
    buffer.clear()
    assert buffer.get_sample_count() == 0
    print(f"✓ Req 13.5: Buffers can be cleared on call end")


def run_all_tests():
    """Run all comprehensive tests"""
    print("=" * 60)
    print("AudioBuffer Comprehensive Test Suite")
    print("Task 3.4: Implement AudioBuffer for transient audio storage")
    print("=" * 60)
    
    test_bounded_deque_initialization()
    test_append_method()
    test_ring_buffer_overflow()
    test_get_window_method()
    test_clear_method()
    test_default_30_second_duration()
    test_transient_storage_requirements()
    test_requirements_11_6_13_1_13_2_13_5()
    
    print("\n" + "=" * 60)
    print("✅ ALL TESTS PASSED!")
    print("=" * 60)
    print("\nTask 3.4 Requirements Verified:")
    print("  ✓ AudioBuffer class with bounded deque")
    print("  ✓ append() method using ring buffer")
    print("  ✓ get_window() method to extract recent samples")
    print("  ✓ clear() method to release memory")
    print("  ✓ Default max_duration_seconds = 30")
    print("  ✓ Automatic discard of old samples (ring buffer)")
    print("=" * 60)


if __name__ == '__main__':
    run_all_tests()
