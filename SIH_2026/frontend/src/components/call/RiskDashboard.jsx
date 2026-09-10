import { useState, useEffect } from 'react';
import { getAnalysisWebSocket } from '../../services/websocket';

/**
 * RiskDashboard Component
 * 
 * Displays real-time voice authenticity risk indicators during calls.
 * Subscribes to risk_update messages from the analysis WebSocket.
 * 
 * Task 8.1: Subscribe to risk_update messages and display live risk updates
 * Requirements: 11.5, 14.1, 14.2, 14.3, 15.4, 15.5
 * 
 * @param {string} callId - Unique call identifier
 * @param {object} callerInfo - Caller information (name, phoneNumber, avatar)
 * @param {boolean} isAnalyzing - Whether audio analysis is active
 */
export default function RiskDashboard({ callId, callerInfo, isAnalyzing }) {
  // State for risk data (Requirement 14.1, 14.2, 14.3)
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [riskScore, setRiskScore] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [recommendation, setRecommendation] = useState('Waiting for analysis...');
  const [indicators, setIndicators] = useState(null);
  const [riskHistory, setRiskHistory] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Subscribe to risk_update messages (Task 8.1, Requirement 15.4, 15.5)
  useEffect(() => {
    if (!callId) return;

    const analysisWS = getAnalysisWebSocket();

    // Handler for risk_update messages
    const handleRiskUpdate = (message) => {
      // Only process updates for this call (Requirement 14.1)
      if (message.call_id !== callId && message.callId !== callId) {
        return;
      }

      console.log('Risk update received:', message);

      // Update state with new risk data (Requirement 14.2, 14.3)
      setRiskLevel(message.risk_level || message.riskLevel || 'LOW');
      setRiskScore(message.risk_score || message.riskScore || 0);
      setConfidence(message.model_confidence || message.confidence || 0);
      setRecommendation(message.recommendation || 'Continue monitoring...');
      
      // Update indicators if available (Requirement 14.4, 14.5)
      if (message.acoustic_indicators || message.prosody_indicators) {
        setIndicators({
          acoustic: message.acoustic_indicators,
          prosody: message.prosody_indicators
        });
      }

      // Append to risk history for timeline tracking (Requirement 14.8)
      const timestamp = message.timestamp || new Date().toISOString();
      setRiskHistory(prev => [
        ...prev,
        {
          riskLevel: message.risk_level || message.riskLevel || 'LOW',
          riskScore: message.risk_score || message.riskScore || 0,
          timestamp
        }
      ].slice(-20)); // Keep last 20 updates

      setLastUpdate(timestamp);
    };

    // Register message handler
    analysisWS.on('risk_update', handleRiskUpdate);

    // Cleanup on unmount
    return () => {
      analysisWS.off('risk_update', handleRiskUpdate);
    };
  }, [callId]);

  // Determine risk color based on level (Requirement 14.1)
  const getRiskColor = () => {
    switch (riskLevel) {
      case 'HIGH':
        return {
          bg: 'bg-danger-dark/20',
          border: 'border-danger-dark',
          text: 'text-danger-light',
          icon: '🔴',
          gradient: 'from-danger-dark to-danger-dark/50'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-warning-dark/20',
          border: 'border-warning-dark',
          text: 'text-warning-light',
          icon: '🟡',
          gradient: 'from-warning-dark to-warning-dark/50'
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-success-dark/20',
          border: 'border-success-dark',
          text: 'text-success-light',
          icon: '🟢',
          gradient: 'from-success-dark to-success-dark/50'
        };
    }
  };

  const riskColor = getRiskColor();

  return (
    <div className="bg-dark-900/50 backdrop-blur-sm border border-dark-700 rounded-2xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-white text-2xl font-bold mb-2">Risk Dashboard</h2>
        <p className="text-gray-400 text-sm">
          {callerInfo.name} • Real-time analysis
        </p>
      </div>

      {/* Primary Risk Indicator (Requirement 14.1) */}
      <div className={`${riskColor.bg} border ${riskColor.border} rounded-xl p-6 mb-6 transition-all duration-500`}>
        <div className="text-5xl mb-3 text-center animate-pulse-slow">{riskColor.icon}</div>
        <div className={`${riskColor.text} text-2xl font-bold text-center mb-2`}>
          {riskLevel} RISK
        </div>
        <div className="text-gray-300 text-center text-sm">
          Score: {riskScore}/100
        </div>
      </div>

      {/* Risk Score Progress Bar (Requirement 14.2) */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Risk Score</span>
          <span>{riskScore}%</span>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${riskColor.gradient} transition-all duration-500`}
            style={{ width: `${Math.min(riskScore, 100)}%` }}
          />
        </div>
      </div>

      {/* Confidence Level (Requirement 14.2) */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>Model Confidence</span>
          <span>{confidence}%</span>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500"
            style={{ width: `${Math.min(confidence, 100)}%` }}
          />
        </div>
      </div>

      {/* Recommendation Text (Requirement 14.3) */}
      <div className="bg-dark-800 rounded-lg p-4 mb-6">
        <div className="text-gray-300 text-sm font-semibold mb-2">
          💡 Recommendation
        </div>
        <p className="text-gray-400 text-sm leading-relaxed">
          {recommendation}
        </p>
      </div>

      {/* Status Information */}
      <div className="space-y-3">
        <div>
          <div className="text-gray-500 text-xs mb-1">Call ID</div>
          <div className="text-white font-mono text-xs truncate">{callId}</div>
        </div>

        <div>
          <div className="text-gray-500 text-xs mb-1">Analysis Status</div>
          <div className="flex items-center gap-2">
            {isAnalyzing && (
              <div className="w-2 h-2 bg-success-light rounded-full animate-pulse" />
            )}
            <span className={isAnalyzing ? 'text-success-light' : 'text-gray-400'}>
              {isAnalyzing ? 'Active' : 'Idle'}
            </span>
          </div>
        </div>

        {lastUpdate && (
          <div>
            <div className="text-gray-500 text-xs mb-1">Last Update</div>
            <div className="text-gray-400 text-xs">
              {new Date(lastUpdate).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Acoustic Indicators (Optional - Requirement 14.4) */}
      {indicators?.acoustic && (
        <div className="mt-6 pt-6 border-t border-dark-700">
          <div className="text-gray-300 text-sm font-semibold mb-3">
            🎵 Acoustic Analysis
          </div>
          <div className="space-y-2 text-xs">
            {Object.entries(indicators.acoustic).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-400 capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="text-gray-300">
                  {typeof value === 'number' ? value.toFixed(2) : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prosody Indicators (Optional - Requirement 14.5) */}
      {indicators?.prosody && (
        <div className="mt-4 pt-4 border-t border-dark-700">
          <div className="text-gray-300 text-sm font-semibold mb-3">
            🎤 Prosody Analysis
          </div>
          <div className="space-y-2 text-xs">
            {Object.entries(indicators.prosody).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-gray-400 capitalize">
                  {key.replace(/_/g, ' ')}
                </span>
                <span className="text-gray-300">
                  {typeof value === 'number' ? value.toFixed(2) : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk History Timeline (Requirement 14.8) */}
      {riskHistory.length > 0 && (
        <div className="mt-6 pt-6 border-t border-dark-700">
          <div className="text-gray-300 text-sm font-semibold mb-3">
            📊 Risk Timeline
          </div>
          <div className="flex items-end gap-1 h-16">
            {riskHistory.map((entry, index) => {
              const height = (entry.riskScore / 100) * 100;
              const color = entry.riskLevel === 'HIGH' ? 'bg-danger-dark' :
                          entry.riskLevel === 'MEDIUM' ? 'bg-warning-dark' :
                          'bg-success-dark';
              
              return (
                <div
                  key={index}
                  className={`flex-1 ${color} rounded-t transition-all duration-300`}
                  style={{ height: `${height}%` }}
                  title={`${entry.riskLevel}: ${entry.riskScore}%`}
                />
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Start</span>
            <span>Now</span>
          </div>
        </div>
      )}

      {/* Privacy Notice */}
      <div className="mt-6 pt-6 border-t border-dark-700">
        <p className="text-gray-500 text-xs text-center">
          🔒 Audio not stored • Privacy-first analysis
        </p>
      </div>
    </div>
  );
}
