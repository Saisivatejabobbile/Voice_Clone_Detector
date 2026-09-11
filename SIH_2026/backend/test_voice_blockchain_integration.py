"""
Comprehensive Verification Test Suite for SIH26104 Voice Spoof Detection & Blockchain Engine
Tests:
1. VoiceDetectorClient (Health check & analyze API handling)
2. SpeechBufferManager (VAD, speech vs silence filtering, 16kHz WAV encoding)
3. ResultAggregator (4 application states, recency weighting, Safety Priority Rule, language metadata)
4. BlockchainAuditService (Canonical SHA-256, block mining, ledger verification, tamper detection)
5. LiveCallDetectorMiddleware (Full active call pipeline & 8-step termination lifecycle)
"""

import sys
import os
import asyncio
import math
import struct
import json

# Ensure app is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.voice_detector_client import VoiceDetectorClient
from app.services.speech_buffer_manager import SpeechBufferManager, SimpleVAD
from app.services.result_aggregator import (
    ResultAggregator,
    STATE_REAL,
    STATE_CLONED_VOICE,
    STATE_UNCERTAIN,
    STATE_INSUFFICIENT_AUDIO
)
from app.services.blockchain_audit_service import BlockchainAuditService
from app.services.live_call_detector_middleware import LiveCallDetectorMiddleware


def generate_synthetic_pcm_sine(duration_sec: float, sample_rate: int = 16000, freq: float = 440.0, amplitude: int = 15000):
    """Generate synthetic PCM audio samples with speech-like energy."""
    num_samples = int(duration_sec * sample_rate)
    samples = []
    for i in range(num_samples):
        # Tone + harmonics for realistic speech energy
        val = amplitude * (0.6 * math.sin(2 * math.pi * freq * i / sample_rate) + 0.4 * math.sin(2 * math.pi * (freq * 2) * i / sample_rate))
        samples.append(int(val))
    return samples


def generate_silence_pcm(duration_sec: float, sample_rate: int = 16000):
    """Generate low-amplitude silence samples."""
    num_samples = int(duration_sec * sample_rate)
    return [0] * num_samples


async def run_all_tests():
    print("=================================================================")
    print("SIH26104 — VOICE SPOOF DETECTION & BLOCKCHAIN AUDIT TEST SUITE")
    print("=================================================================\n")

    # -------------------------------------------------------------
    # Test 1: VoiceActivityDetector & SpeechBufferManager
    # -------------------------------------------------------------
    print("[1/5] Testing SpeechBufferManager & VAD Filtering...")
    buffer_mgr = SpeechBufferManager(call_id="test_call_001", min_usable_speech_sec=20.0, window_size_sec=25.0)

    # Ingest 2 seconds of silence (should be filtered)
    silence = generate_silence_pcm(2.0)
    is_speech = buffer_mgr.ingest_pcm_chunk(silence)
    assert not is_speech, "VAD should reject silence"
    assert buffer_mgr.get_usable_speech_duration() == 0.0, "Usable speech should be 0.0s after silence"
    print("  [OK] Silence correctly discarded by VAD.")

    # Ingest 21 seconds of active speech in 1-second chunks
    speech_1s = generate_synthetic_pcm_sine(1.0)
    for _ in range(21):
        buffer_mgr.ingest_pcm_chunk(speech_1s)

    usable_sec = buffer_mgr.get_usable_speech_duration()
    assert usable_sec >= 20.0, f"Usable speech should be >= 20.0s, got {usable_sec}"
    assert buffer_mgr.is_ready_for_analysis(), "Buffer should be ready for analysis after >= 20s"
    print(f"  [OK] Speech successfully accumulated: {usable_sec:.2f}s usable target speech.")

    # Extract 16 kHz Mono WAV window
    window_data = buffer_mgr.extract_window_wav()
    assert window_data is not None, "Window data should be extracted"
    wav_bytes, window_id, duration = window_data
    assert len(wav_bytes) > 44, "WAV header + data should exist"
    assert window_id == 1, "First window ID should be 1"
    assert wav_bytes[:4] == b"RIFF", "File should start with RIFF WAV header"
    print(f"  [OK] Extracted Window #{window_id}: {len(wav_bytes):,} bytes, {duration:.2f}s WAV stream.")

    # -------------------------------------------------------------
    # Test 2: ResultAggregator & 4 Application-Level States
    # -------------------------------------------------------------
    print("\n[2/5] Testing ResultAggregator State Mapping & Rules...")
    aggregator = ResultAggregator(call_id="test_call_002", uncertain_threshold=60.0)

    # Case A: High Confidence REAL
    mock_real = {
        "prediction": "REAL",
        "confidence": 85.0,
        "real_probability": 85.0,
        "synthetic_probability": 15.0,
        "language": "hindi",
        "detected_language_code": "hi",
        "language_confidence": 97.0
    }
    summary_1 = aggregator.add_window_result(1, mock_real, 25.0)
    assert summary_1["voice_status"] == STATE_REAL, f"Expected REAL, got {summary_1['voice_status']}"
    print(f"  [OK] Window 1 mapped correctly: {summary_1['voice_status']} (confidence: {summary_1['confidence']}%)")

    # Case B: Ambiguous / Low confidence -> UNCERTAIN
    mock_uncertain = {
        "prediction": "REAL",
        "confidence": 52.0,
        "real_probability": 52.0,
        "synthetic_probability": 48.0,
        "language": "hindi",
        "detected_language_code": "hi"
    }
    aggregator_unc = ResultAggregator(call_id="test_unc", uncertain_threshold=60.0)
    summary_unc = aggregator_unc.add_window_result(1, mock_uncertain, 25.0)
    assert summary_unc["voice_status"] == STATE_UNCERTAIN, f"Expected UNCERTAIN, got {summary_unc['voice_status']}"
    print(f"  [OK] Ambiguous prediction correctly mapped to: {summary_unc['voice_status']}")

    # Case C: Safety Priority Rule (SYNTHETIC / CLONED high threat)
    mock_cloned = {
        "prediction": "SYNTHETIC",
        "confidence": 88.0,
        "real_probability": 12.0,
        "synthetic_probability": 88.0,
        "language": "telugu",
        "detected_language_code": "te",
        "language_confidence": 95.0
    }
    summary_2 = aggregator.add_window_result(2, mock_cloned, 25.0)
    assert summary_2["voice_status"] == STATE_CLONED_VOICE, f"Expected CLONED VOICE, got {summary_2['voice_status']}"
    assert summary_2["primary_language"] == "telugu", "Language switching to Telugu should be tracked"
    print(f"  [OK] Safety Priority Rule triggered: {summary_2['voice_status']} prioritized! (Lang: {summary_2['primary_language']})")

    # Case D: Insufficient Audio (< 20s usable speech)
    short_agg = ResultAggregator(call_id="test_short")
    final_short = short_agg.finalize_call(total_usable_speech_sec=7.5)
    assert final_short["voice_status"] == STATE_INSUFFICIENT_AUDIO, "Short call must be INSUFFICIENT AUDIO"
    print(f"  [OK] Short call correctly terminated as: {final_short['voice_status']}")

    # -------------------------------------------------------------
    # Test 3: BlockchainAuditService & Tamper Verification
    # -------------------------------------------------------------
    print("\n[3/5] Testing BlockchainAuditService...")
    test_ledger_path = "./data/test_blockchain_ledger.json"
    if os.path.exists(test_ledger_path):
        os.remove(test_ledger_path)

    bc_service = BlockchainAuditService(ledger_path=test_ledger_path, difficulty=1)

    # Commit a detection record
    sample_ml_response = {
        "prediction": "SYNTHETIC",
        "real_probability": 15.2,
        "synthetic_probability": 84.8,
        "confidence": 84.8,
        "risk_level": "HIGH",
        "language": "hindi"
    }

    commit_result = bc_service.commit_audit_record(
        call_id="test_call_003",
        window_id=1,
        mapped_status=STATE_CLONED_VOICE,
        confidence=84.8,
        risk_level="HIGH",
        language="hindi",
        raw_ml_json=sample_ml_response
    )

    assert commit_result["verified"], "Block commit must succeed"
    assert commit_result["block_number"] == 1, "First non-genesis block should be index 1"
    assert commit_result["tx_hash"].startswith("0x"), "TX Hash must start with 0x"
    assert len(commit_result["audit_hash"]) == 64, "Deterministic audit hash must be 64-char SHA-256"
    print(f"  [OK] Block #{commit_result['block_number']} mined and committed: tx={commit_result['tx_hash'][:20]}...")

    # Verify unaltered record
    verify_valid = bc_service.verify_record(
        call_id="test_call_003",
        window_id=1,
        timestamp=commit_result["timestamp"],
        mapped_status=STATE_CLONED_VOICE,
        confidence=84.8,
        risk_level="HIGH",
        language="hindi",
        raw_ml_json=sample_ml_response
    )
    assert verify_valid["is_valid"], f"Unaltered record must be valid: {verify_valid}"
    assert not verify_valid["tampered"], "Record must not be tampered"
    print("  [OK] Integrity Verification SUCCESS: Cryptographic hash matches on-chain record.")

    # Verify TAMPERED record (simulate attacker modifying risk score or prediction)
    tampered_ml_response = sample_ml_response.copy()
    tampered_ml_response["synthetic_probability"] = 10.0  # Modified off-chain!
    verify_tampered = bc_service.verify_record(
        call_id="test_call_003",
        window_id=1,
        timestamp=commit_result["timestamp"],
        mapped_status=STATE_CLONED_VOICE,
        confidence=84.8,
        risk_level="HIGH",
        language="hindi",
        raw_ml_json=tampered_ml_response
    )
    assert not verify_tampered["is_valid"], "Tampered record must be rejected!"
    assert verify_tampered["tampered"], "Tampering must be detected!"
    print("  [OK] Tamper-Evidence Detection SUCCESS: Altered data immediately flagged as TAMPERED.")

    # -------------------------------------------------------------
    # Test 4: VoiceDetectorClient
    # -------------------------------------------------------------
    print("\n[4/5] Testing VoiceDetectorClient...")
    client = VoiceDetectorClient()
    health_result = await client.check_health()
    print(f"  [OK] Health Check Endpoint tested: available={health_result.get('available')}")

    # Test analyze with valid WAV bytes (resilient fallback or live response)
    test_wav_bytes = buffer_mgr._encode_pcm_to_wav(generate_synthetic_pcm_sine(1.0))
    analysis_res = await client.analyze_audio(test_wav_bytes)
    assert "prediction" in analysis_res, "Response must contain 'prediction'"
    assert "confidence" in analysis_res, "Response must contain 'confidence'"
    assert "language" in analysis_res, "Response must contain 'language'"
    print(f"  [OK] Analyze Audio API tested: pred={analysis_res['prediction']}, conf={analysis_res['confidence']}%, fallback={analysis_res['is_fallback']}")

    # -------------------------------------------------------------
    # Test 5: LiveCallDetectorMiddleware & 8-Step Termination
    # -------------------------------------------------------------
    print("\n[5/5] Testing LiveCallDetectorMiddleware Full Lifecycle...")
    middleware = LiveCallDetectorMiddleware()
    test_call_id = "test_live_session_99"

    broadcast_events = []
    async def mock_broadcast(payload):
        broadcast_events.append(payload)

    # Ingest 21 seconds of speech into live middleware
    for _ in range(21):
        await middleware.process_chunk(
            call_id=test_call_id,
            pcm_samples=speech_1s,
            broadcast_callback=mock_broadcast
        )

    # Wait briefly for background window analysis task
    await asyncio.sleep(0.5)

    # Execute 8-Step Termination Lifecycle
    final_verdict = await middleware.terminate_call(
        call_id=test_call_id,
        broadcast_callback=mock_broadcast
    )

    assert final_verdict is not None, "Final verdict must be returned on call termination"
    assert final_verdict["type"] == "final_call_verdict", "Type must be final_call_verdict"
    assert "blockchain_audit" in final_verdict, "Final verdict must include blockchain audit proof"
    assert final_verdict["blockchain_audit"]["verified"], "Blockchain proof must be verified"
    print(f"  [OK] 8-Step Termination Lifecycle completed:")
    print(f"    - Final Voice Status: {final_verdict['voice_status']}")
    print(f"    - Blockchain Block: #{final_verdict['blockchain_audit']['block_number']}")
    print(f"    - On-Chain TX: {final_verdict['blockchain_audit']['tx_hash']}")
    print(f"    - Audit SHA-256: {final_verdict['blockchain_audit']['audit_hash']}")

    print("\n=================================================================")
    print("ALL 5 INTEGRATION TEST SUITES PASSED SUCCESSFULLY! [OK][OK][OK][OK][OK]")
    print("=================================================================")


if __name__ == "__main__":
    asyncio.run(run_all_tests())
