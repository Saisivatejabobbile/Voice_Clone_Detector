"""
Example: Using AI Model Client in Audio Processing Pipeline

This demonstrates how MockAIModelClient integrates with the WebRTC
voice calling feature for real-time risk analysis.
"""

import asyncio
from app.services import get_ai_client


async def example_audio_processing_pipeline():
    """
    Simulate the audio processing pipeline for WebRTC voice analysis.
    This shows how MockAIModelClient would be used in practice.
    """
    print("=" * 70)
    print("AI Model Client Integration Example")
    print("WebRTC Voice Calling - Real-time Risk Analysis")
    print("=" * 70)
    
    # Initialize AI client (mock for development)
    ai_client = get_ai_client(use_mock=True)
    print(f"\n✓ Initialized: {type(ai_client).__name__}")
    
    # Simulate receiving audio chunks from AudioWorklet
    print("\n" + "-" * 70)
    print("Simulating Real-time Audio Processing")
    print("-" * 70)
    
    call_id = "call-123-456"
    
    # Simulate 3 audio chunks arriving over time
    for chunk_num in range(1, 4):
        print(f"\n[Chunk {chunk_num}] Received audio from remote stream...")
        
        # In real implementation, this would be actual PCM audio data
        # from the AudioWorklet processor
        dummy_audio_chunk = b'\x00' * 4096
        
        # Send to AI model for analysis
        print(f"  → Sending to AI model API...")
        prediction = await ai_client.predict(
            audio_data=dummy_audio_chunk,
            sample_rate=16000
        )
        
        # Extract prediction results
        synthetic_prob = prediction['synthetic_probability']
        model_conf = prediction['model_confidence']
        
        # Calculate risk score (as Risk Engine would do)
        risk_score = int(synthetic_prob * model_conf * 100)
        
        # Determine risk level
        if risk_score < 30:
            risk_level = "LOW"
        elif risk_score < 70:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"
        
        # Display results
        print(f"  ✓ Analysis complete:")
        print(f"    Risk Level: {risk_level}")
        print(f"    Risk Score: {risk_score}/100")
        print(f"    Synthetic Probability: {synthetic_prob:.2%}")
        print(f"    Model Confidence: {model_conf:.2%}")
        
        # Show acoustic indicators if present
        if 'acoustic_indicators' in prediction:
            print(f"    Acoustic Indicators:")
            for key, value in prediction['acoustic_indicators'].items():
                print(f"      • {key}: {value:.3f}")
        
        # Show prosody indicators if present
        if 'prosody_indicators' in prediction:
            print(f"    Prosody Indicators:")
            for key, value in prediction['prosody_indicators'].items():
                print(f"      • {key}: {value:.3f}")
        
        # In real implementation, this would be sent to frontend
        risk_update_message = {
            "type": "risk_update",
            "callId": call_id,
            "riskLevel": risk_level,
            "riskScore": risk_score,
            "syntheticConfidence": int(synthetic_prob * 100),
            "modelConfidence": int(model_conf * 100),
            "acousticIndicators": prediction.get('acoustic_indicators'),
            "prosodyIndicators": prediction.get('prosody_indicators'),
            "timestamp": "2024-01-15T10:30:00Z"
        }
        
        print(f"  → Broadcasting to frontend Risk Dashboard...")
        # await connection_manager.send_to_user(user_id, risk_update_message)
        
        # Simulate time between chunks (in real scenario, ~2-3 seconds)
        if chunk_num < 3:
            print(f"  ... waiting for next audio chunk ...")
            await asyncio.sleep(0.5)
    
    print("\n" + "=" * 70)
    print("Pipeline Example Complete")
    print("=" * 70)
    print("\nIntegration Points:")
    print("  1. AudioWorklet extracts PCM audio from remote stream")
    print("  2. Frontend sends audio chunks via WebSocket to backend")
    print("  3. Backend uses AIModelClient.predict() for analysis")
    print("  4. RiskEngine calculates risk score and level")
    print("  5. Backend sends risk_update to frontend Risk Dashboard")
    print("  6. Frontend displays real-time risk indicators to user")
    
    print("\nSecurity Features:")
    print("  ✓ API keys stored only in backend")
    print("  ✓ Raw audio processed transiently (not stored)")
    print("  ✓ Only risk metadata persisted to database")
    print("  ✓ Mock mode for safe development testing")


async def example_error_handling():
    """
    Demonstrate error handling and fallback behavior.
    """
    print("\n\n" + "=" * 70)
    print("Error Handling Example")
    print("=" * 70)
    
    # Create real client (will fail without API key)
    print("\n[Test] Creating real AIModelClient without API key...")
    from app.services import AIModelClient
    
    real_client = AIModelClient()
    dummy_audio = b'\x00' * 4096
    
    print("  → Calling predict() (will use fallback)...")
    result = await real_client.predict(dummy_audio)
    
    print(f"  ✓ Fallback activated:")
    print(f"    synthetic_probability: {result['synthetic_probability']}")
    print(f"    model_confidence: {result['model_confidence']}")
    print(f"    error: {result.get('error')}")
    
    print("\n  → This ensures the system continues to function")
    print("    even when the external AI API is unavailable.")


if __name__ == "__main__":
    print("\n")
    asyncio.run(example_audio_processing_pipeline())
    asyncio.run(example_error_handling())
    print("\n")
