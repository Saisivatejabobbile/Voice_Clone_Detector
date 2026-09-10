"""Test Risk Engine"""
import sys
sys.path.insert(0, 'app')

from services.risk_engine import RiskEngine

def test_risk_engine():
    engine = RiskEngine()
    
    # Test LOW risk
    low_pred = {'synthetic_probability': 0.15, 'model_confidence': 0.90}
    result = engine.calculate_risk(low_pred)
    assert result['risk_level'] == 'LOW'
    print(f"[PASS] LOW risk: {result['risk_score']:.1f} - {result['recommendation']}")
    
    # Test MEDIUM risk
    med_pred = {'synthetic_probability': 0.50, 'model_confidence': 0.88}
    result = engine.calculate_risk(med_pred)
    assert result['risk_level'] == 'MEDIUM'
    print(f"[PASS] MEDIUM risk: {result['risk_score']:.1f} - {result['recommendation']}")
    
    # Test HIGH risk
    high_pred = {'synthetic_probability': 0.85, 'model_confidence': 0.92}
    result = engine.calculate_risk(high_pred)
    assert result['risk_level'] == 'HIGH'
    print(f"[PASS] HIGH risk: {result['risk_score']:.1f} - {result['recommendation']}")
    
    print("\n=== All RiskEngine tests passed! ===")

if __name__ == '__main__':
    test_risk_engine()
