"""
Example usage of RiskEngine
Demonstrates how to calculate risk scores from AI model predictions
"""

from app.services.risk_engine import RiskEngine


def main():
    """Demonstrate RiskEngine usage with various scenarios"""
    
    # Initialize Risk Engine with default thresholds
    engine = RiskEngine()
    
    print("=" * 70)
    print("Risk Engine Example Scenarios")
    print("=" * 70)
    
    # Scenario 1: Low Risk - Natural Voice
    print("\n1. LOW RISK Scenario - Natural Voice")
    print("-" * 70)
    
    low_risk_prediction = {
        'synthetic_probability': 0.12,  # 12% synthetic
        'model_confidence': 0.95,       # 95% confident
        'acoustic_indicators': {
            'spectral_anomaly': 0.15,
            'harmonic_distortion': 0.08
        }
    }
    
    result = engine.calculate_risk(low_risk_prediction)
    print(f"Synthetic Probability: {low_risk_prediction['synthetic_probability']*100:.0f}%")
    print(f"Model Confidence: {low_risk_prediction['model_confidence']*100:.0f}%")
    print(f"Risk Score: {result['risk_score']:.1f}/100")
    print(f"Risk Level: {result['risk_level']}")
    print(f"Recommendation: {result['recommendation']}")
    
    # Scenario 2: Medium Risk - Uncertain
    print("\n2. MEDIUM RISK Scenario - Uncertain Voice")
    print("-" * 70)
    
    medium_risk_prediction = {
        'synthetic_probability': 0.52,  # 52% synthetic
        'model_confidence': 0.88,       # 88% confident
        'prosody_indicators': {
            'rhythm_consistency': 0.45,
            'pitch_naturalness': 0.52
        }
    }
    
    result = engine.calculate_risk(medium_risk_prediction)
    print(f"Synthetic Probability: {medium_risk_prediction['synthetic_probability']*100:.0f}%")
    print(f"Model Confidence: {medium_risk_prediction['model_confidence']*100:.0f}%")
    print(f"Risk Score: {result['risk_score']:.1f}/100")
    print(f"Risk Level: {result['risk_level']}")
    print(f"Recommendation: {result['recommendation']}")
    
    # Scenario 3: High Risk - Likely Synthetic
    print("\n3. HIGH RISK Scenario - Likely Synthetic Voice")
    print("-" * 70)
    
    high_risk_prediction = {
        'synthetic_probability': 0.87,  # 87% synthetic
        'model_confidence': 0.93,       # 93% confident
        'acoustic_indicators': {
            'spectral_anomaly': 0.82,
            'harmonic_distortion': 0.76
        },
        'prosody_indicators': {
            'rhythm_consistency': 0.23,
            'pitch_naturalness': 0.31
        }
    }
    
    result = engine.calculate_risk(high_risk_prediction)
    print(f"Synthetic Probability: {high_risk_prediction['synthetic_probability']*100:.0f}%")
    print(f"Model Confidence: {high_risk_prediction['model_confidence']*100:.0f}%")
    print(f"Risk Score: {result['risk_score']:.1f}/100")
    print(f"Risk Level: {result['risk_level']}")
    print(f"Recommendation: {result['recommendation']}")
    
    # Scenario 4: Custom Thresholds
    print("\n4. Custom Threshold Configuration")
    print("-" * 70)
    
    custom_engine = RiskEngine(low_threshold=25, high_threshold=75)
    
    prediction = {
        'synthetic_probability': 0.60,
        'model_confidence': 0.90
    }
    
    result_default = engine.calculate_risk(prediction)
    result_custom = custom_engine.calculate_risk(prediction)
    
    print(f"Prediction: 60% synthetic, 90% confidence")
    print(f"Default Thresholds (30/70): {result_default['risk_level']} - Score {result_default['risk_score']:.1f}")
    print(f"Custom Thresholds (25/75): {result_custom['risk_level']} - Score {result_custom['risk_score']:.1f}")
    
    print("\n" + "=" * 70)
    print("Risk Engine Examples Complete")
    print("=" * 70)


if __name__ == '__main__':
    main()
