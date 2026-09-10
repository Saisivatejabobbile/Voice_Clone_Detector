"""
Risk Engine for Voice Analysis
Calculates risk scores from AI model predictions
"""

import logging
from typing import Dict, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class RiskEngine:
    """
    Analyzes AI model predictions and calculates risk scores.
    
    Requirements: 15.2, 15.3, 15.4
    """
    
    def __init__(
        self,
        low_threshold: int = 30,
        high_threshold: int = 70
    ):
        """
        Initialize Risk Engine with configurable thresholds.
        
        Args:
            low_threshold: Risk scores below this are LOW (default: 30)
            high_threshold: Risk scores above this are HIGH (default: 70)
        """
        self.low_threshold = low_threshold
        self.high_threshold = high_threshold
        
        logger.info(f"RiskEngine initialized (LOW<{low_threshold}, HIGH>={high_threshold})")
    
    def calculate_risk(self, model_prediction: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate risk from AI model prediction.
        
        Args:
            model_prediction: Dict with keys:
                - synthetic_probability: float (0.0-1.0)
                - model_confidence: float (0.0-1.0)
                - acoustic_indicators: dict (optional)
                - prosody_indicators: dict (optional)
        
        Returns:
            dict: Risk analysis result with:
                - synthetic_confidence: float (0-100)
                - model_confidence: float (0-100)
                - risk_score: float (0-100)
                - risk_level: str ('LOW', 'MEDIUM', 'HIGH')
                - recommendation: str (context-aware message)
                - acoustic_indicators: dict (optional, from prediction)
                - prosody_indicators: dict (optional, from prediction)
                - timestamp: str (ISO format)
        """
        try:
            # Extract values from prediction
            synthetic_prob = model_prediction.get('synthetic_probability', 0.0)
            model_conf = model_prediction.get('model_confidence', 0.0)
            
            # Convert to 0-100 scale
            synthetic_confidence = synthetic_prob * 100
            model_confidence = model_conf * 100
            
            # Calculate risk score (0-100)
            risk_score = synthetic_confidence * (model_confidence / 100)
            
            # Determine risk level
            if risk_score < self.low_threshold:
                risk_level = 'LOW'
            elif risk_score < self.high_threshold:
                risk_level = 'MEDIUM'
            else:
                risk_level = 'HIGH'
            
            # Generate context-aware recommendation
            recommendation = self._generate_recommendation(
                risk_level,
                risk_score,
                synthetic_confidence
            )
            
            # Build result
            result = {
                'synthetic_confidence': round(synthetic_confidence, 2),
                'model_confidence': round(model_confidence, 2),
                'risk_score': round(risk_score, 2),
                'risk_level': risk_level,
                'recommendation': recommendation,
                'timestamp': datetime.now(timezone.utc).isoformat()
            }
            
            # Include optional indicators if present
            if 'acoustic_indicators' in model_prediction:
                result['acoustic_indicators'] = model_prediction['acoustic_indicators']
            
            if 'prosody_indicators' in model_prediction:
                result['prosody_indicators'] = model_prediction['prosody_indicators']
            
            logger.debug(f"Risk calculated: {risk_level} (score={risk_score:.1f})")
            
            return result
            
        except Exception as e:
            logger.error(f"Error calculating risk: {e}")
            # Return safe fallback
            return {
                'synthetic_confidence': 0.0,
                'model_confidence': 0.0,
                'risk_score': 0.0,
                'risk_level': 'UNKNOWN',
                'recommendation': 'Unable to analyze call at this time',
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'error': str(e)
            }
    
    def _generate_recommendation(
        self,
        risk_level: str,
        risk_score: float,
        synthetic_confidence: float
    ) -> str:
        """Generate context-aware recommendation based on risk level."""
        
        if risk_level == 'LOW':
            return "Voice appears natural. Continue conversation normally."
        
        elif risk_level == 'MEDIUM':
            if synthetic_confidence < 40:
                return "Voice authenticity uncertain. Exercise caution and verify caller identity."
            else:
                return "Moderate synthetic indicators detected. Verify caller through alternative means."
        
        else:  # HIGH
            if synthetic_confidence > 80:
                return "⚠️ HIGH RISK: Strong synthetic voice indicators. Do not share sensitive information."
            else:
                return "⚠️ HIGH RISK: Voice authenticity questionable. End call if suspicious."


# Singleton instance
_risk_engine = None

def get_risk_engine() -> RiskEngine:
    """Get singleton Risk Engine instance."""
    global _risk_engine
    if _risk_engine is None:
        _risk_engine = RiskEngine()
    return _risk_engine
