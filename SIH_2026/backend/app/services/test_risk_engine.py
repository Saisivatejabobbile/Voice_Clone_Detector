"""
Unit tests for Risk Engine
Validates risk score calculation and categorization logic
"""

import pytest
from app.services.risk_engine import RiskEngine


class TestRiskEngine:
    """Test suite for RiskEngine class"""
    
    def test_initialization_default_thresholds(self):
        """Test RiskEngine initializes with correct default thresholds"""
        engine = RiskEngine()
        assert engine.low_threshold == 30
        assert engine.high_threshold == 70
    
    def test_initialization_custom_thresholds(self):
        """Test RiskEngine accepts custom threshold configuration"""
        engine = RiskEngine(low_threshold=25, high_threshold=75)
        assert engine.low_threshold == 25
        assert engine.high_threshold == 75
    
    def test_calculate_risk_low_level(self):
        """Test risk calculation for LOW risk scenario"""
        engine = RiskEngine()
        
        prediction = {
            'synthetic_probability': 0.15,  # 15%
            'model_confidence': 0.90        # 90%
        }
        
        result = engine.calculate_risk(prediction)
        
        # Verify calculations
        assert result['synthetic_confidence'] == 15.0
        assert result['model_confidence'] == 90.0
        assert result['risk_score'] == pytest.approx(13.5, rel=0.01)  # 15 * 0.90 = 13.5
        assert result['risk_level'] == 'LOW'
        assert 'natural' in result['recommendation'].lower()
        assert 'timestamp' in result
    
    def test_calculate_risk_medium_level(self):
        """Test risk calculation for MEDIUM risk scenario"""
        engine = RiskEngine()
        
        prediction = {
            'synthetic_probability': 0.50,  # 50%
            'model_confidence': 0.95        # 95%
        }
        
        result = engine.calculate_risk(prediction)
        
        # Verify calculations
        assert result['synthetic_confidence'] == 50.0
        assert result['model_confidence'] == 95.0
        assert result['risk_score'] == pytest.approx(47.5, rel=0.01)  # 50 * 0.95 = 47.5
        assert result['risk_level'] == 'MEDIUM'
        assert 'moderate' in result['recommendation'].lower() or 'verify' in result['recommendation'].lower()
    
    def test_calculate_risk_high_level(self):
        """Test risk calculation for HIGH risk scenario"""
        engine = RiskEngine()
        
        prediction = {
            'synthetic_probability': 0.85,  # 85%
            'model_confidence': 0.92        # 92%
        }
        
        result = engine.calculate_risk(prediction)
        
        # Verify calculations
        assert result['synthetic_confidence'] == 85.0
        assert result['model_confidence'] == 92.0
        assert result['risk_score'] == pytest.approx(78.2, rel=0.01)  # 85 * 0.92 = 78.2
        assert result['risk_level'] == 'HIGH'
        assert 'high risk' in result['recommendation'].lower() or 'synthetic' in result['recommendation'].lower()
    
    def test_calculate_risk_threshold_boundaries(self):
        """Test risk level boundaries at exact threshold values"""
        engine = RiskEngine()
        
        # Just below LOW threshold (29.9)
        result = engine.calculate_risk({
            'synthetic_probability': 0.299,
            'model_confidence': 1.0
        })
        assert result['risk_level'] == 'LOW'
        
        # At LOW threshold (30.0)
        result = engine.calculate_risk({
            'synthetic_probability': 0.30,
            'model_confidence': 1.0
        })
        assert result['risk_level'] == 'MEDIUM'
        
        # Just below HIGH threshold (69.9)
        result = engine.calculate_risk({
            'synthetic_probability': 0.699,
            'model_confidence': 1.0
        })
        assert result['risk_level'] == 'MEDIUM'
        
        # At HIGH threshold (70.0)
        result = engine.calculate_risk({
            'synthetic_probability': 0.70,
            'model_confidence': 1.0
        })
        assert result['risk_level'] == 'HIGH'
    
    def test_calculate_risk_with_optional_indicators(self):
        """Test that optional acoustic and prosody indicators are preserved"""
        engine = RiskEngine()
        
        prediction = {
            'synthetic_probability': 0.50,
            'model_confidence': 0.90,
            'acoustic_indicators': {
                'spectral_anomaly': 0.45,
                'harmonic_distortion': 0.32
            },
            'prosody_indicators': {
                'rhythm_consistency': 0.67,
                'pitch_naturalness': 0.78
            }
        }
        
        result = engine.calculate_risk(prediction)
        
        # Verify optional fields are included
        assert 'acoustic_indicators' in result
        assert result['acoustic_indicators']['spectral_anomaly'] == 0.45
        assert 'prosody_indicators' in result
        assert result['prosody_indicators']['pitch_naturalness'] == 0.78
    
    def test_calculate_risk_missing_optional_indicators(self):
        """Test that missing optional indicators don't cause errors"""
        engine = RiskEngine()
        
        prediction = {
            'synthetic_probability': 0.40,
            'model_confidence': 0.85
        }
        
        result = engine.calculate_risk(prediction)
        
        # Verify calculation works without optional fields
        assert result['risk_score'] == pytest.approx(34.0, rel=0.01)
        assert 'acoustic_indicators' not in result or result.get('acoustic_indicators') is None
        assert 'prosody_indicators' not in result or result.get('prosody_indicators') is None
    
    def test_calculate_risk_zero_values(self):
        """Test risk calculation with zero probabilities"""
        engine = RiskEngine()
        
        prediction = {
            'synthetic_probability': 0.0,
            'model_confidence': 0.0
        }
        
        result = engine.calculate_risk(prediction)
        
        assert result['synthetic_confidence'] == 0.0
        assert result['model_confidence'] == 0.0
        assert result['risk_score'] == 0.0
        assert result['risk_level'] == 'LOW'
    
    def test_calculate_risk_maximum_values(self):
        """Test risk calculation with maximum probabilities"""
        engine = RiskEngine()
        
        prediction = {
            'synthetic_probability': 1.0,
            'model_confidence': 1.0
        }
        
        result = engine.calculate_risk(prediction)
        
        assert result['synthetic_confidence'] == 100.0
        assert result['model_confidence'] == 100.0
        assert result['risk_score'] == 100.0
        assert result['risk_level'] == 'HIGH'
    
    def test_calculate_risk_error_handling(self):
        """Test error handling for malformed predictions"""
        engine = RiskEngine()
        
        # Missing required fields - should default to 0.0 and return LOW risk
        result = engine.calculate_risk({})
        
        # Should handle gracefully with defaults
        assert result['risk_level'] == 'LOW'
        assert result['synthetic_confidence'] == 0.0
        assert result['model_confidence'] == 0.0
        assert result['risk_score'] == 0.0
        assert 'error' not in result  # No error, just defaults
    
    def test_recommendation_contextual_messages(self):
        """Test that recommendations are contextually appropriate"""
        engine = RiskEngine()
        
        # LOW risk recommendation
        low_result = engine.calculate_risk({
            'synthetic_probability': 0.10,
            'model_confidence': 0.90
        })
        assert 'natural' in low_result['recommendation'].lower()
        assert 'continue' in low_result['recommendation'].lower()
        
        # MEDIUM risk recommendation
        medium_result = engine.calculate_risk({
            'synthetic_probability': 0.45,
            'model_confidence': 0.90
        })
        assert 'verify' in medium_result['recommendation'].lower() or 'caution' in medium_result['recommendation'].lower()
        
        # HIGH risk recommendation
        high_result = engine.calculate_risk({
            'synthetic_probability': 0.85,
            'model_confidence': 0.95
        })
        assert 'high risk' in high_result['recommendation'].lower() or 'synthetic' in high_result['recommendation'].lower()
    
    def test_timestamp_format(self):
        """Test that timestamp is in ISO format"""
        engine = RiskEngine()
        
        result = engine.calculate_risk({
            'synthetic_probability': 0.50,
            'model_confidence': 0.90
        })
        
        timestamp = result['timestamp']
        assert 'T' in timestamp
        
        # Verify it's a valid ISO timestamp
        from datetime import datetime
        parsed = datetime.fromisoformat(timestamp)
        assert parsed is not None
    
    def test_custom_threshold_affects_categorization(self):
        """Test that custom thresholds correctly affect risk level categorization"""
        engine_custom = RiskEngine(low_threshold=20, high_threshold=80)
        
        prediction = {
            'synthetic_probability': 0.25,
            'model_confidence': 1.0
        }
        
        result = engine_custom.calculate_risk(prediction)
        
        # With default thresholds (30, 70), this would be LOW
        # With custom thresholds (20, 80), this should be MEDIUM
        assert result['risk_score'] == 25.0
        assert result['risk_level'] == 'MEDIUM'


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
