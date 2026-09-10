"""
Unit tests for AI Model Client

Tests the AIModelClient class for secure API integration,
error handling, and fallback behavior.

Tests requirements 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7
"""

import sys
sys.path.insert(0, 'app')

import pytest
import httpx
from unittest.mock import AsyncMock, patch, MagicMock
from services.ai_model_client import AIModelClient


@pytest.fixture
def ai_client():
    """Create AI model client instance for testing"""
    with patch('services.ai_model_client.settings') as mock_settings:
        mock_settings.MODEL_API_URL = "https://api.example.com/predict"
        mock_settings.MODEL_API_KEY = "test-api-key-12345"
        mock_settings.MODEL_TIMEOUT_SECONDS = 10
        client = AIModelClient()
    return client


@pytest.fixture
def sample_audio_data():
    """Generate sample PCM audio data"""
    # Simulate 1 second of 16kHz Int16 PCM audio
    import struct
    samples = [int(32767 * 0.5) for _ in range(16000)]
    return struct.pack(f'{len(samples)}h', *samples)


@pytest.mark.asyncio
async def test_predict_success(ai_client, sample_audio_data):
    """Test successful prediction from AI model API"""
    mock_response = {
        "synthetic_probability": 0.85,
        "model_confidence": 0.92,
        "acoustic_indicators": {
            "spectral_anomaly": 0.7,
            "harmonic_distortion": 0.6
        },
        "prosody_indicators": {
            "rhythm_consistency": 0.8,
            "pitch_naturalness": 0.75
        }
    }
    
    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        
        mock_response_obj = MagicMock()
        mock_response_obj.json.return_value = mock_response
        mock_response_obj.raise_for_status = MagicMock()
        
        mock_client.post = AsyncMock(return_value=mock_response_obj)
        
        result = await ai_client.predict(sample_audio_data, sample_rate=16000)
        
        # Verify result
        assert result["synthetic_probability"] == 0.85
        assert result["model_confidence"] == 0.92
        assert "acoustic_indicators" in result
        assert "prosody_indicators" in result
        
        # Verify request was made correctly
        mock_client.post.assert_called_once()
        call_args = mock_client.post.call_args
        
        # Check URL
        assert call_args[0][0] == "https://api.example.com/predict"
        
        # Check headers
        headers = call_args[1]["headers"]
        assert headers["Authorization"] == "Bearer test-api-key-12345"
        assert headers["Content-Type"] == "application/octet-stream"
        assert headers["X-Sample-Rate"] == "16000"
        
        # Check timeout
        assert call_args[1]["timeout"] == 10


@pytest.mark.asyncio
async def test_predict_timeout(ai_client, sample_audio_data):
    """Test timeout handling returns fallback prediction"""
    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        
        mock_client.post = AsyncMock(side_effect=httpx.TimeoutException("Request timeout"))
        
        result = await ai_client.predict(sample_audio_data, sample_rate=16000)
        
        # Verify fallback prediction
        assert result["synthetic_probability"] == 0.0
        assert result["model_confidence"] == 0.0
        assert result["error"] == "Model temporarily unavailable"


@pytest.mark.asyncio
async def test_predict_http_error(ai_client, sample_audio_data):
    """Test HTTP error handling returns fallback prediction"""
    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.text = "Internal Server Error"
        
        mock_client.post = AsyncMock(
            side_effect=httpx.HTTPStatusError(
                "Server error",
                request=MagicMock(),
                response=mock_response
            )
        )
        
        result = await ai_client.predict(sample_audio_data, sample_rate=16000)
        
        # Verify fallback prediction
        assert result["synthetic_probability"] == 0.0
        assert result["model_confidence"] == 0.0
        assert result["error"] == "Model temporarily unavailable"


@pytest.mark.asyncio
async def test_predict_empty_audio(ai_client):
    """Test empty audio data returns fallback prediction"""
    result = await ai_client.predict(b"", sample_rate=16000)
    
    # Verify fallback prediction
    assert result["synthetic_probability"] == 0.0
    assert result["model_confidence"] == 0.0
    assert result["error"] == "Model temporarily unavailable"


@pytest.mark.asyncio
async def test_predict_no_api_key(sample_audio_data):
    """Test missing API key returns fallback prediction"""
    with patch('services.ai_model_client.settings') as mock_settings:
        mock_settings.MODEL_API_URL = "https://api.example.com/predict"
        mock_settings.MODEL_API_KEY = ""  # Empty API key
        mock_settings.MODEL_TIMEOUT_SECONDS = 10
        
        client = AIModelClient()
        result = await client.predict(sample_audio_data, sample_rate=16000)
        
        # Verify fallback prediction
        assert result["synthetic_probability"] == 0.0
        assert result["model_confidence"] == 0.0
        assert result["error"] == "Model temporarily unavailable"


@pytest.mark.asyncio
async def test_predict_request_error(ai_client, sample_audio_data):
    """Test network request error handling"""
    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        
        mock_client.post = AsyncMock(
            side_effect=httpx.RequestError("Connection failed")
        )
        
        result = await ai_client.predict(sample_audio_data, sample_rate=16000)
        
        # Verify fallback prediction
        assert result["synthetic_probability"] == 0.0
        assert result["model_confidence"] == 0.0
        assert result["error"] == "Model temporarily unavailable"


@pytest.mark.asyncio
async def test_predict_invalid_json_response(ai_client, sample_audio_data):
    """Test invalid JSON response handling"""
    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        
        mock_response_obj = MagicMock()
        mock_response_obj.json.side_effect = ValueError("Invalid JSON")
        mock_response_obj.raise_for_status = MagicMock()
        
        mock_client.post = AsyncMock(return_value=mock_response_obj)
        
        result = await ai_client.predict(sample_audio_data, sample_rate=16000)
        
        # Verify fallback prediction
        assert result["synthetic_probability"] == 0.0
        assert result["model_confidence"] == 0.0
        assert result["error"] == "Model temporarily unavailable"


@pytest.mark.asyncio
async def test_predict_optional_indicators(ai_client, sample_audio_data):
    """Test prediction with optional indicators omitted"""
    mock_response = {
        "synthetic_probability": 0.45,
        "model_confidence": 0.88
        # No acoustic_indicators or prosody_indicators
    }
    
    with patch('httpx.AsyncClient') as mock_client_class:
        mock_client = AsyncMock()
        mock_client_class.return_value.__aenter__.return_value = mock_client
        
        mock_response_obj = MagicMock()
        mock_response_obj.json.return_value = mock_response
        mock_response_obj.raise_for_status = MagicMock()
        
        mock_client.post = AsyncMock(return_value=mock_response_obj)
        
        result = await ai_client.predict(sample_audio_data, sample_rate=16000)
        
        # Verify result handles missing optional fields
        assert result["synthetic_probability"] == 0.45
        assert result["model_confidence"] == 0.88


def test_fallback_prediction(ai_client):
    """Test fallback prediction structure"""
    fallback = ai_client._fallback_prediction()
    
    # Verify structure
    assert fallback["synthetic_probability"] == 0.0
    assert fallback["model_confidence"] == 0.0
    assert fallback["error"] == "Model temporarily unavailable"
    # Optional indicators are not included in fallback
    assert "acoustic_indicators" not in fallback or fallback.get("acoustic_indicators") is None
    assert "prosody_indicators" not in fallback or fallback.get("prosody_indicators") is None


def test_get_ai_model_client_singleton():
    """Test singleton pattern for get_ai_client"""
    from services.ai_model_client import get_ai_client
    
    with patch('services.ai_model_client.settings') as mock_settings:
        mock_settings.MODEL_API_URL = "https://api.example.com/predict"
        mock_settings.MODEL_API_KEY = "test-key"
        mock_settings.MODEL_TIMEOUT_SECONDS = 10
        
        # Get real client (not mock)
        client1 = get_ai_client(use_mock=False)
        client2 = get_ai_client(use_mock=False)
        
        # Both should be AIModelClient instances
        from services.ai_model_client import AIModelClient
        assert isinstance(client1, AIModelClient)
        assert isinstance(client2, AIModelClient)


if __name__ == "__main__":
    print("=" * 60)
    print("AI Model Client Unit Tests")
    print("=" * 60)
    pytest.main([__file__, "-v", "--tb=short"])
