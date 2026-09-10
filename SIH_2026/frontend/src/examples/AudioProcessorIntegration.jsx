/**
 * AudioProcessor Integration Example
 * 
 * This example shows how to integrate useAudioProcessor hook
 * into the ActiveCallPage component for real-time voice analysis.
 * 
 * Requirements: 11.1, 11.2, 11.5, 11.7
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useAudioProcessor } from '../hooks/useAudioProcessor';
import { useWebSocket } from '../hooks/useWebSocket';

/**
 * Example: Complete Active Call Page with Audio Processing
 */
function ActiveCallPageWithAudioProcessing({ callId, callerInfo, remoteStream }) {
  const [riskData, setRiskData] = useState({
    riskLevel: 'LOW',
    riskScore: 0,
    confidence: 0,
    recommendation: 'Analyzing...',
  });
  
  const audioRef = useRef(null);
  const token = localStorage.getItem('access_token');
  
  // Connect to analysis WebSocket
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
  const analysisWS = useWebSocket(`${WS_URL}/ws/analysis`, token);
  
  // Handle risk updates from backend
  useEffect(() => {
    if (!analysisWS.onMessage) return;
    
    const unsubscribe = analysisWS.onMessage('risk_update', (message) => {
      console.log('Received risk update:', message);
      
      if (message.call_id === callId) {
        setRiskData({
          riskLevel: message.risk_level,
          riskScore: message.risk_score,
          confidence: message.model_confidence,
          recommendation: message.recommendation,
          acousticIndicators: message.acoustic_indicators,
          prosodyIndicators: message.prosody_indicators,
          timestamp: message.timestamp,
        });
      }
    });
    
    return unsubscribe;
  }, [analysisWS, callId]);
  
  // Send audio chunks to backend for analysis
  const sendAudioChunk = useCallback((callId, pcmData, sampleRate) => {
    if (analysisWS.isConnected) {
      console.log(`Sending audio chunk: ${pcmData.length} samples, ${sampleRate}Hz`);
      
      analysisWS.sendMessage({
        type: 'audio_chunk',
        call_id: callId,
        pcm_data: pcmData,
        sample_rate: sampleRate,
        timestamp: Date.now(),
      });
    } else {
      console.warn('Analysis WebSocket not connected, cannot send audio chunk');
    }
  }, [analysisWS]);
  
  // Initialize audio processor
  const { isProcessing } = useAudioProcessor(
    remoteStream,
    callId,
    sendAudioChunk
  );
  
  // Play remote audio
  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
      console.log('Remote stream attached to audio element');
    }
  }, [remoteStream]);
  
  return (
    <div className="active-call-page">
      {/* Audio playback (hidden) */}
      <audio ref={audioRef} autoPlay />
      
      {/* Call status */}
      <div className="call-status">
        <h2>Call with {callerInfo.name}</h2>
        <p>Phone: {callerInfo.phoneNumber}</p>
        
        {/* Processing status */}
        <div className="analysis-status">
          {analysisWS.isConnected ? (
            <span className="status-connected">📡 Analysis Connected</span>
          ) : (
            <span className="status-disconnected">📡 Connecting...</span>
          )}
          
          {isProcessing ? (
            <span className="status-processing">🎙️ Processing Audio</span>
          ) : (
            <span className="status-idle">🎙️ Waiting for Audio</span>
          )}
        </div>
      </div>
      
      {/* Risk Dashboard */}
      <div className="risk-dashboard">
        <h3>Voice Analysis</h3>
        
        {/* Risk Level Indicator */}
        <div className={`risk-indicator risk-${riskData.riskLevel.toLowerCase()}`}>
          <div className="risk-badge">
            {riskData.riskLevel === 'LOW' && '🟢 LOW RISK'}
            {riskData.riskLevel === 'MEDIUM' && '🟡 MEDIUM RISK'}
            {riskData.riskLevel === 'HIGH' && '🔴 HIGH RISK'}
          </div>
        </div>
        
        {/* Risk Metrics */}
        <div className="risk-metrics">
          <div className="metric">
            <span className="metric-label">Risk Score</span>
            <div className="metric-bar">
              <div 
                className="metric-fill"
                style={{ width: `${riskData.riskScore}%` }}
              />
            </div>
            <span className="metric-value">{riskData.riskScore}/100</span>
          </div>
          
          <div className="metric">
            <span className="metric-label">Model Confidence</span>
            <div className="metric-bar">
              <div 
                className="metric-fill"
                style={{ width: `${riskData.confidence}%` }}
              />
            </div>
            <span className="metric-value">{riskData.confidence}%</span>
          </div>
        </div>
        
        {/* Recommendation */}
        <div className="recommendation">
          <p>{riskData.recommendation}</p>
        </div>
        
        {/* Optional Indicators */}
        {riskData.acousticIndicators && (
          <div className="indicators">
            <h4>Acoustic Indicators</h4>
            <ul>
              {Object.entries(riskData.acousticIndicators).map(([key, value]) => (
                <li key={key}>
                  {key}: {(value * 100).toFixed(1)}%
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {riskData.prosodyIndicators && (
          <div className="indicators">
            <h4>Prosody Indicators</h4>
            <ul>
              {Object.entries(riskData.prosodyIndicators).map(([key, value]) => (
                <li key={key}>
                  {key}: {(value * 100).toFixed(1)}%
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Privacy Notice */}
        <div className="privacy-notice">
          🔒 Privacy: Audio is not stored
        </div>
      </div>
    </div>
  );
}

/**
 * Example: Minimal Integration
 */
function MinimalAudioProcessorExample({ remoteStream, callId }) {
  const token = localStorage.getItem('access_token');
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
  
  // Connect to analysis WebSocket
  const analysisWS = useWebSocket(`${WS_URL}/ws/analysis`, token);
  
  // Send audio chunks
  const sendAudioChunk = useCallback((callId, pcmData, sampleRate) => {
    if (analysisWS.isConnected) {
      analysisWS.sendMessage({
        type: 'audio_chunk',
        call_id: callId,
        pcm_data: pcmData,
        sample_rate: sampleRate,
        timestamp: Date.now(),
      });
    }
  }, [analysisWS]);
  
  // Initialize processor
  const { isProcessing } = useAudioProcessor(
    remoteStream,
    callId,
    sendAudioChunk
  );
  
  return (
    <div>
      {isProcessing ? '🎙️ Analyzing...' : '⏸️ Idle'}
    </div>
  );
}

/**
 * Example: Custom sendAudioChunk with Logging
 */
function AudioProcessorWithLogging({ remoteStream, callId }) {
  const token = localStorage.getItem('access_token');
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
  const analysisWS = useWebSocket(`${WS_URL}/ws/analysis`, token);
  
  const [chunkCount, setChunkCount] = useState(0);
  const [totalSamples, setTotalSamples] = useState(0);
  
  const sendAudioChunk = useCallback((callId, pcmData, sampleRate) => {
    // Update statistics
    setChunkCount(prev => prev + 1);
    setTotalSamples(prev => prev + pcmData.length);
    
    // Log chunk info
    console.log(`Chunk #${chunkCount}: ${pcmData.length} samples @ ${sampleRate}Hz`);
    console.log(`Total samples sent: ${totalSamples}`);
    
    // Send to backend
    if (analysisWS.isConnected) {
      analysisWS.sendMessage({
        type: 'audio_chunk',
        call_id: callId,
        pcm_data: pcmData,
        sample_rate: sampleRate,
        timestamp: Date.now(),
      });
    }
  }, [analysisWS, chunkCount, totalSamples]);
  
  const { isProcessing } = useAudioProcessor(
    remoteStream,
    callId,
    sendAudioChunk
  );
  
  return (
    <div>
      <p>Processing: {isProcessing ? 'Yes' : 'No'}</p>
      <p>Chunks Sent: {chunkCount}</p>
      <p>Total Samples: {totalSamples.toLocaleString()}</p>
    </div>
  );
}

/**
 * Example: Error Handling
 */
function AudioProcessorWithErrorHandling({ remoteStream, callId }) {
  const [error, setError] = useState(null);
  const token = localStorage.getItem('access_token');
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
  const analysisWS = useWebSocket(`${WS_URL}/ws/analysis`, token);
  
  const sendAudioChunk = useCallback((callId, pcmData, sampleRate) => {
    try {
      if (!analysisWS.isConnected) {
        throw new Error('Analysis WebSocket not connected');
      }
      
      if (!pcmData || pcmData.length === 0) {
        throw new Error('Invalid PCM data');
      }
      
      analysisWS.sendMessage({
        type: 'audio_chunk',
        call_id: callId,
        pcm_data: pcmData,
        sample_rate: sampleRate,
        timestamp: Date.now(),
      });
      
      // Clear error on success
      if (error) setError(null);
      
    } catch (err) {
      console.error('Failed to send audio chunk:', err);
      setError(err.message);
    }
  }, [analysisWS, error]);
  
  const { isProcessing } = useAudioProcessor(
    remoteStream,
    callId,
    sendAudioChunk
  );
  
  return (
    <div>
      {error && (
        <div className="error-message">
          ⚠️ Error: {error}
        </div>
      )}
      
      {!error && isProcessing && (
        <div className="success-message">
          ✅ Audio analysis active
        </div>
      )}
    </div>
  );
}

// Export all examples
export {
  ActiveCallPageWithAudioProcessing,
  MinimalAudioProcessorExample,
  AudioProcessorWithLogging,
  AudioProcessorWithErrorHandling,
};

export default ActiveCallPageWithAudioProcessing;
