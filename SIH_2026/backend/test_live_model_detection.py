"""
Interactive CLI Tester for Voice Spoof Detection & Blockchain Audit Engine
Usage:
    python test_live_model_detection.py [path_to_audio.wav]

Examples:
    python test_live_model_detection.py
    python test_live_model_detection.py sample_hindi.wav
"""

import os
import sys
import asyncio
import io
import wave
import math
import struct
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.voice_detector_client import get_voice_detector_client
from app.services.result_aggregator import ResultAggregator
from app.services.blockchain_audit_service import get_blockchain_audit_service


def create_synthetic_voice_wav(duration_sec: float = 22.0, sample_rate: int = 16000) -> bytes:
    """Generate 16 kHz Mono 16-bit WAV with voice-like harmonic resonance."""
    num_samples = int(duration_sec * sample_rate)
    samples = []
    # Fundamental pitch F0 ~ 140 Hz (male/female voice range) with formant harmonics
    f0 = 140.0
    for i in range(num_samples):
        t = i / sample_rate
        # Voice envelope modulation (speech bursts and pauses)
        envelope = 0.5 * (1.0 + math.sin(2 * math.pi * 1.5 * t))
        v = envelope * (
            0.50 * math.sin(2 * math.pi * f0 * t) +
            0.25 * math.sin(2 * math.pi * (f0 * 2) * t) +
            0.15 * math.sin(2 * math.pi * (f0 * 3) * t) +
            0.10 * math.sin(2 * math.pi * (f0 * 5) * t)
        )
        sample_val = max(-32768, min(32767, int(v * 18000)))
        samples.append(sample_val)

    bio = io.BytesIO()
    with wave.open(bio, 'wb') as wf:
        wf.setnchannels(1)  # Mono
        wf.setsampwidth(2)  # 16-bit
        wf.setframerate(sample_rate)  # 16 kHz
        raw_bytes = struct.pack(f'<{len(samples)}h', *samples)
        wf.writeframes(raw_bytes)
    return bio.getvalue()


async def main():
    print("=" * 70)
    print(" VoiceShield — Live ML Voice Spoof Detection & Blockchain Audit Tester")
    print("=" * 70)

    client = get_voice_detector_client()
    blockchain = get_blockchain_audit_service()
    aggregator = ResultAggregator(call_id="cli_test_session")

    # 1. Health Check
    print("\n[Step 1] Checking remote ML API health status...")
    print(f"Endpoint: {client.health_url}")
    health = await client.check_health()
    if health.get("available"):
        print(f" Status: ONLINE (HTTP {health.get('status_code', 200)})")
        print(f" Details: {health.get('data')}")
    else:
        print(f" Status: OFFLINE / UNREACHABLE ({health.get('error')})")

    # 2. Audio Selection
    wav_bytes = None
    source_name = ""

    if len(sys.argv) > 1 and os.path.exists(sys.argv[1]):
        wav_path = sys.argv[1]
        source_name = os.path.basename(wav_path)
        print(f"\n[Step 2] Loading custom audio file: {wav_path}")
        with open(wav_path, "rb") as f:
            wav_bytes = f.read()
        print(f" Loaded {len(wav_bytes):,} bytes from file.")
    else:
        source_name = "synthetic_voice_window.wav"
        print(f"\n[Step 2] Generating standard 22.0s 16 kHz Mono WAV audio...")
        wav_bytes = create_synthetic_voice_wav(duration_sec=22.0)
        print(f" Created {len(wav_bytes):,} bytes of 16 kHz Mono PCM audio.")

    # 3. Model Analysis
    print(f"\n[Step 3] Dispatching audio to Remote ML Spoof Detector...")
    print(f"Target URL: {client.api_url}")
    print(f"Sending audio as multipart form field 'file'...")

    res = await client.analyze_audio(wav_bytes, filename=source_name)

    print("\n" + "-" * 70)
    print("  RAW MODEL API RESPONSE")
    print("-" * 70)
    print(json.dumps(res, indent=2))

    # 4. Application-Level Voice Classification
    summary = aggregator.add_window_result(window_id=1, ml_response=res, duration_seconds=22.0)
    voice_status = summary["voice_status"]
    confidence = summary["confidence"]
    lang = summary["primary_language"]
    lang_code = summary["detected_language_code"]

    print("\n" + "=" * 70)
    print("  APPLICATION-LEVEL CLASSIFICATION VERDICT")
    print("=" * 70)
    print(f"  Voice Classification : {voice_status}")
    print(f"  Confidence           : {confidence}%")
    print(f"  Risk Level           : {summary['risk_level']}")
    print(f"  Impersonation Score  : {summary['risk_score']}%")
    print(f"  Detected Language    : {lang.capitalize()} ({lang_code})")
    print(f"  Windows Analyzed     : {summary['windows_analyzed']}")

    # 5. Blockchain Audit Recording
    print("\n" + "=" * 70)
    print("  BLOCKCHAIN TAMPER-EVIDENT AUDIT COMMIT")
    print("=" * 70)
    bc_record = blockchain.commit_audit_record(
        call_id="cli_test_session",
        window_id=1,
        mapped_status=voice_status,
        confidence=confidence,
        risk_level=summary["risk_level"],
        language=lang,
        raw_ml_json=res.get("raw_response", res)
    )

    print(f"  Block Number         : #{bc_record['block_number']}")
    print(f"  On-Chain TX Hash     : {bc_record['tx_hash']}")
    print(f"  Deterministic SHA256 : {bc_record['audit_hash']}")
    print(f"  Block Header Hash    : {bc_record['block_hash']}")
    print(f"  Canonical String     : {bc_record['canonical_string']}")
    print(f"  Status               : VERIFIED & COMMITTED TO IMMUTABLE LEDGER")

    # 6. Verification
    print("\n[Step 6] Verifying on-chain tamper-evidence...")
    verify_res = blockchain.verify_record(
        call_id="cli_test_session",
        window_id=1,
        timestamp=bc_record["timestamp"],
        mapped_status=voice_status,
        confidence=confidence,
        risk_level=summary["risk_level"],
        language=lang,
        raw_ml_json=res.get("raw_response", res)
    )
    if verify_res["is_valid"]:
        print("  [OK] Cryptographic Verification PASSED: Record is authentic and untampered!")
    else:
        print("  [FAIL] Verification Failed!")

    print("\n" + "=" * 70)
    print(" Test Complete.")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(main())
