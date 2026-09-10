"""
AI Model Client for Voice Analysis
Interfaces with external AI model API for voice authenticity analysis
"""

import httpx
import logging
import asyncio
import random
from typing import Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)


class AIModelClient:
    """
    Client for interfacing with external AI model API.
    Handles secure API key management and request/response processing.
    """
    
    def __init__(self):
        """Initialize AI model client with secure credentials from settings."""
        self.api_url = settings.MODEL_API_URL
        self.api_key = settings.MODEL_API_KEY
        self.timeout = settings.MODEL_TIMEOUT_SECONDS or 10
        
        logger.info(f"AIModelClient initialized with URL: {self.api_url}")
    
    async def predict(
        self,
        audio_data: bytes,
        sample_rate: int = 16000
    ) -> Dict[str, Any]:
        """
        Send audio to external AI model and get prediction.
        
        Args:
            audio_data: Raw PCM audio bytes
            sample_rate: Sample rate of audio (default: 16000 Hz)
            
        Returns:
            dict: Prediction results with structure:
                {
                    "synthetic_probability": float (0.0-1.0),
                    "model_confidence": float (0.0-1.0),
                    "acoustic_indicators": dict (optional),
                    "prosody_indicators": dict (optional)
                }
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    self.api_url,
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/octet-stream",
                        "X-Sample-Rate": str(sample_rate)
                    },
                    content=audio_data,
                    timeout=self.timeout
                )
                
                response.raise_for_status()
                result = response.json()
                
                logger.debug(f"AI model prediction: {result}")
                return result
                
        except httpx.TimeoutException:
            logger.error("AI model request timeout")
            return self._fallback_prediction()
            
        except httpx.HTTPStatusError as e:
            logger.error(f"AI model HTTP error: {e.response.status_code} - {e}")
            return self._fallback_prediction()
            
        except Exception as e:
            logger.error(f"AI model unexpected error: {e}")
            return self._fallback_prediction()
    
    def _fallback_prediction(self) -> Dict[str, Any]:
        """
        Return safe fallback prediction when model is unavailable.
        
        Returns:
            dict: Safe default prediction indicating model unavailability
        """
        return {
            "synthetic_probability": 0.0,
            "model_confidence": 0.0,
            "error": "Model temporarily unavailable"
        }


class MockAIModelClient(AIModelClient):
    """
    Mock implementation of AI model client for development and testing.
    Generates realistic synthetic predictions without requiring external API.
    
    Requirements: 15.1, 15.2
    """
    
    def __init__(self):
        """Initialize mock client without requiring API credentials."""
        # Don't call super().__init__() to avoid needing real credentials
        self.api_url = "mock://ai-model"
        self.api_key = "mock-key"
        self.timeout = 10
        
        logger.info("MockAIModelClient initialized (development mode)")
    
    async def predict(
        self,
        audio_data: bytes,
        sample_rate: int = 16000
    ) -> Dict[str, Any]:
        """
        Generate mock AI prediction with realistic random values.
        
        Args:
            audio_data: Raw PCM audio bytes (not used in mock)
            sample_rate: Sample rate of audio (not used in mock)
            
        Returns:
            dict: Mock prediction with realistic random values:
                - synthetic_probability: 0.05-0.85 (random)
                - model_confidence: 0.85-0.98 (random)
                - acoustic_indicators: dict with random values
                - prosody_indicators: dict with random values
        """
        # Simulate network delay (0.5 seconds)
        await asyncio.sleep(0.5)
        
        # Generate random synthetic probability (5% to 85%)
        synthetic_probability = random.uniform(0.05, 0.85)
        
        # Generate random model confidence (85% to 98%)
        model_confidence = random.uniform(0.85, 0.98)
        
        # Generate optional acoustic indicators
        acoustic_indicators = {
            "spectral_anomaly": round(random.uniform(0.0, 1.0), 3),
            "harmonic_distortion": round(random.uniform(0.0, 1.0), 3),
            "noise_floor": round(random.uniform(0.0, 0.5), 3),
            "frequency_consistency": round(random.uniform(0.5, 1.0), 3)
        }
        
        # Generate optional prosody indicators
        prosody_indicators = {
            "rhythm_consistency": round(random.uniform(0.0, 1.0), 3),
            "pitch_naturalness": round(random.uniform(0.0, 1.0), 3),
            "speech_rate_variance": round(random.uniform(0.0, 0.8), 3),
            "pause_pattern_naturalness": round(random.uniform(0.3, 1.0), 3)
        }
        
        result = {
            "synthetic_probability": round(synthetic_probability, 4),
            "model_confidence": round(model_confidence, 4),
            "acoustic_indicators": acoustic_indicators,
            "prosody_indicators": prosody_indicators
        }
        
        logger.debug(f"Mock AI prediction generated: synthetic_prob={result['synthetic_probability']:.2f}, "
                    f"confidence={result['model_confidence']:.2f}")
        
        return result


# Factory function to get appropriate client based on configuration
def get_ai_client(use_mock: bool = True) -> AIModelClient:
    """
    Get AI model client instance (real or mock).
    
    Args:
        use_mock: If True, return MockAIModelClient for development.
                  If False, return real AIModelClient for production.
    
    Returns:
        AIModelClient: Appropriate client implementation
    """
    if use_mock or not settings.MODEL_API_KEY:
        logger.info("Using MockAIModelClient (development mode)")
        return MockAIModelClient()
    else:
        logger.info("Using real AIModelClient (production mode)")
        return AIModelClient()
