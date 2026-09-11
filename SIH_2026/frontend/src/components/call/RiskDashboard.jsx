import { useState, useEffect } from 'react';
import { getAnalysisWebSocket } from '../../services/websocket';

/**
 * RiskDashboard Component - Enterprise Real-Time AI Impersonation Risk & Blockchain Audit Monitor
 * 
 * Implements SIH26104 Requirements:
 * - 4 Application-Level Voice Classifications:
 *   1. REAL (Verified authentic human speech)
 *   2. CLONED VOICE (Synthetic/cloned voice impersonation threat)
 *   3. UNCERTAIN (Ambiguous speech acoustic patterns)
 *   4. INSUFFICIENT AUDIO (Accumulating target-speaker speech before analysis)
 * - Tamper-Evident Blockchain Audit Proof (SHA-256 canonical hash & block ID)
 * - Multi-Language Detection Telemetry (Hindi, Telugu, Code-mixed)
 * - Usable Target Speech Telemetry
 */
export default function RiskDashboard({ callId, callerInfo = {}, isAnalyzing, externalData = null }) {
  const [voiceStatus, setVoiceStatus] = useState('SAMPLING');
  const [isCallEnded, setIsCallEnded] = useState(false);
  const [audioSentToModelSec, setAudioSentToModelSec] = useState(0);
  const [riskLevel, setRiskLevel] = useState('LOW');
  const [riskScore, setRiskScore] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [recommendation, setRecommendation] = useState('Listening to remote caller. Target speech is isolated and ambient silence is excluded...');
  const [blockchainAudit, setBlockchainAudit] = useState(null);
  const [detectedLanguage, setDetectedLanguage] = useState(null);
  const [targetSpeechAnalyzed, setTargetSpeechAnalyzed] = useState(0);
  const [windowsAnalyzed, setWindowsAnalyzed] = useState(0);
  const [indicators, setIndicators] = useState(null);
  const [riskHistory, setRiskHistory] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Synchronize with external static data (e.g. from Audio File Upload Analysis)
  useEffect(() => {
    if (!externalData) return;

    const score = externalData.risk_score ?? externalData.riskScore ?? 0;
    const level = externalData.risk_level ?? externalData.riskLevel ?? 'LOW';
    const status = externalData.voice_status || (score >= 60 ? 'CLONED VOICE' : 'REAL');

    setVoiceStatus(status);
    setRiskLevel(level);
    setRiskScore(score);
    setConfidence(externalData.confidence ?? externalData.model_confidence ?? 0);
    setRecommendation(externalData.recommendation || (status === 'CLONED VOICE' ? 'AI synthetic voice signature detected.' : 'Authentic human voice verified.'));

    if (externalData.blockchain_audit) {
      setBlockchainAudit(externalData.blockchain_audit);
    }
    if (externalData.detected_language) {
      setDetectedLanguage(externalData.detected_language);
    }
    if (externalData.duration_seconds !== undefined) {
      setTargetSpeechAnalyzed(externalData.duration_seconds);
    }
    if (externalData.windows_analyzed !== undefined) {
      setWindowsAnalyzed(externalData.windows_analyzed);
    }
    if (externalData.acoustic_indicators || externalData.prosody_indicators) {
      setIndicators({
        acoustic: externalData.acoustic_indicators,
        prosody: externalData.prosody_indicators
      });
    }

    const timestamp = externalData.timestamp || new Date().toISOString();
    setLastUpdate(timestamp);
    setRiskHistory([
      {
        voiceStatus: status,
        riskLevel: level,
        riskScore: score,
        timestamp
      }
    ]);
  }, [externalData]);

  useEffect(() => {
    if (!callId) return;

    const analysisWS = getAnalysisWebSocket();

    const handleRiskUpdate = (message) => {
      if (message.call_id !== callId && message.callId !== callId) {
        return;
      }

      console.log('Risk/Blockchain telemetry received:', message);

      const score = message.risk_score ?? message.riskScore ?? 0;
      let level = message.risk_level ?? message.riskLevel ?? 'LOW';
      const status = message.voice_status || (score >= 60 ? 'CLONED VOICE' : score > 0 ? 'REAL' : 'SAMPLING');

      const isEnded = Boolean(message.is_call_ended || message.type === 'final_call_verdict');
      if (isEnded) {
        setIsCallEnded(true);
      }

      setVoiceStatus(status);
      setRiskLevel(level);
      setRiskScore(score);
      setConfidence(message.model_confidence ?? message.confidence ?? 0);
      setRecommendation(message.recommendation || 'Active live monitoring...');

      if (message.blockchain_audit) {
        setBlockchainAudit(message.blockchain_audit);
      }
      if (message.detected_language) {
        setDetectedLanguage(message.detected_language);
      }
      if (message.target_speech_analyzed !== undefined) {
        setTargetSpeechAnalyzed(message.target_speech_analyzed);
      } else if (message.usable_audio_duration !== undefined) {
        setTargetSpeechAnalyzed(message.usable_audio_duration);
      }
      if (message.windows_analyzed !== undefined) {
        setWindowsAnalyzed(message.windows_analyzed);
      }

      if (message.acoustic_indicators || message.prosody_indicators) {
        setIndicators({
          acoustic: message.acoustic_indicators,
          prosody: message.prosody_indicators
        });
      }

      // Mandatory User Audit Log upon call termination
      if (isEnded) {
        const speechSec = message.target_speech_analyzed ?? message.usable_audio_duration ?? message.target_speech_collected_sec ?? targetSpeechAnalyzed;
        const sentSec = message.audio_sent_to_model_sec !== undefined 
          ? message.audio_sent_to_model_sec 
          : (speechSec >= 10.0 ? speechSec : 0.0);
        setAudioSentToModelSec(sentSec);
        
        const finalStatus = message.voice_status || status;
        const finalReason = message.stability_reason || message.reason || message.recommendation || (speechSec < 10.0 ? 'Call ended before collecting minimum 10 seconds of speech required for AI detection.' : 'Acoustic neural evaluation completed.');
        
        console.group('%c[VoiceShield] CALL TERMINATED - FINAL VOICE AUDIT', 'background: #0B1F3A; color: #00C2FF; font-weight: bold; font-size: 12px; padding: 4px;');
        console.log(`⏱ Total Usable Speech Collected: %c${Number(speechSec).toFixed(1)}s`, 'font-weight: bold; color: #38BDF8;');
        console.log(`🤖 Audio Sent to Model API: %c${Number(sentSec).toFixed(1)}s`, 'font-weight: bold; color: #A78BFA;');
        console.log(`🎙 Primary Decision: %c${finalStatus}`, `font-weight: bold; font-size: 13px; color: ${finalStatus === 'CLONED VOICE' ? '#EF4444' : finalStatus === 'REAL' ? '#10B981' : '#F59E0B'};`);
        console.log(`📊 Model Confidence: %c${message.model_confidence ?? message.confidence ?? 0}%`, 'font-weight: bold;');
        console.log(`🛡 Risk Evaluation: %c${level} (${score}%)`, 'font-weight: bold;');
        console.log(`📝 Evaluation Reason / Rationale: %c${finalReason}`, 'font-style: italic; color: #94A3B8;');
        console.groupEnd();
      }

      const timestamp = message.timestamp || new Date().toISOString();
      setRiskHistory(prev => [
        ...prev,
        {
          voiceStatus: status,
          riskLevel: level,
          riskScore: score,
          timestamp
        }
      ].slice(-24));

      setLastUpdate(timestamp);
    };

    analysisWS.on('risk_update', handleRiskUpdate);
    analysisWS.on('final_call_verdict', handleRiskUpdate);

    return () => {
      analysisWS.off('risk_update', handleRiskUpdate);
      analysisWS.off('final_call_verdict', handleRiskUpdate);
    };
  }, [callId]);

  // Semantic styling configuration based strictly on application states
  const getStatusConfig = () => {
    // If call ended and < 10s speech was collected:
    if (isCallEnded && (windowsAnalyzed === 0 || voiceStatus === 'INSUFFICIENT AUDIO') && targetSpeechAnalyzed < 10.0) {
      return {
        title: 'INSUFFICIENT AUDIO',
        subLabel: 'CALL ENDED WITH LESS THAN 10s SPEECH',
        badgeBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
        scoreColor: 'text-[#F59E0B]',
        barColor: 'bg-[#F59E0B]',
        bannerBg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/80 text-amber-900 dark:text-amber-200',
        indicatorColor: '#F59E0B',
        icon: (
          <svg className="w-5 h-5 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      };
    }

    switch (voiceStatus) {
      case 'CLONED VOICE':
      case 'SYNTHETIC':
      case 'AI CLONED':
        return {
          title: 'AI CLONED',
          subLabel: 'CRITICAL SYNTHETIC CLONE DETECTED',
          badgeBg: 'bg-rose-100 dark:bg-red-950/80 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700',
          scoreColor: 'text-[#EF4444]',
          barColor: 'bg-[#EF4444]',
          bannerBg: 'bg-rose-50 dark:bg-red-950/50 border-rose-200 dark:border-red-900/80 text-rose-900 dark:text-red-200',
          indicatorColor: '#EF4444',
          icon: (
            <svg className="w-5 h-5 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )
        };
      case 'UNCERTAIN':
        return {
          title: 'UNCERTAIN',
          subLabel: 'AMBIGUOUS ACOUSTIC PATTERNS',
          badgeBg: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700',
          scoreColor: 'text-[#F59E0B]',
          barColor: 'bg-[#F59E0B]',
          bannerBg: 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-900/80 text-amber-900 dark:text-amber-200',
          indicatorColor: '#F59E0B',
          icon: (
            <svg className="w-5 h-5 text-[#F59E0B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'REAL':
        return {
          title: 'REAL',
          subLabel: 'VERIFIED AUTHENTIC HUMAN SPEECH',
          badgeBg: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700',
          scoreColor: 'text-[#10B981]',
          barColor: 'bg-[#10B981]',
          bannerBg: 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-900/80 text-emerald-900 dark:text-emerald-200',
          indicatorColor: '#10B981',
          icon: (
            <svg className="w-5 h-5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          )
        };
      case 'SAMPLING':
      case 'INSUFFICIENT AUDIO':
      default:
        // During active call sampling (never say INSUFFICIENT AUDIO while live)
        return {
          title: 'ANALYZING VOICE...',
          subLabel: 'ACCUMULATING TARGET SPEECH • FILTERING SILENCE',
          badgeBg: 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-200 border-sky-300 dark:border-sky-700',
          scoreColor: 'text-[#008BB8] dark:text-[#00C2FF]',
          barColor: 'bg-[#00C2FF]',
          bannerBg: 'bg-sky-50 dark:bg-sky-950/50 border-sky-200 dark:border-sky-900/80 text-sky-900 dark:text-sky-200',
          indicatorColor: '#00C2FF',
          icon: (
            <svg className="w-5 h-5 text-[#00C2FF] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          )
        };
    }
  };

  const config = getStatusConfig();
  const minRequiredSpeech = 20.0;
  const speechProgress = Math.min(100, Math.round((targetSpeechAnalyzed / minRequiredSpeech) * 100));

  return (
    <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl p-6 shadow-sm text-[#0F172A] dark:text-[#F1F5F9] transition-colors">
      
      {/* Header Bar */}
      <div className="flex items-start justify-between pb-4 border-b border-[#F1F5F9] dark:border-[#1E3A5F] mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00C2FF] animate-pulse" />
            <h3 className="text-base font-bold text-[#0B1F3A] dark:text-white uppercase tracking-wider">
              Live Voice Integrity & Audit
            </h3>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            Target: <span className="font-semibold text-[#0B1F3A] dark:text-[#00C2FF]">{callerInfo.name || callerInfo.caller_name || 'Active Remote Caller'}</span> • VAD Isolated
          </p>
        </div>

        <span className={`px-3 py-1.5 text-xs font-bold tracking-wider rounded-full border flex items-center gap-1.5 shadow-2xs ${config.badgeBg}`}>
          {config.icon}
          {config.title}
        </span>
      </div>

      {/* Primary Voice Classification Banner */}
      <div className="bg-slate-50 dark:bg-[#0B1524] border border-slate-200 dark:border-[#1E3A5F] rounded-xl p-5 text-center mb-5 transition-colors">
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8] mb-1">
          Primary Voice Classification
        </div>

        <div className="flex items-baseline justify-center gap-2 my-1">
          <span className={`font-mono text-4xl sm:text-5xl font-extrabold tracking-tight ${config.scoreColor}`}>
            {config.title}
          </span>
        </div>

        <div className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8] tracking-wide mt-1 uppercase font-mono">
          {config.subLabel}
        </div>

        {/* Progress Track */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 mt-4 overflow-hidden">
          <div
            className={`h-full ${config.barColor} transition-all duration-500 rounded-full`}
            style={{ width: `${windowsAnalyzed === 0 ? speechProgress : Math.min(riskScore, 100)}%` }}
          />
        </div>
        
        {windowsAnalyzed === 0 && (
          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-2 font-mono">
            {isCallEnded && Number(targetSpeechAnalyzed || 0) < 10.0
              ? `Call ended: collected ${Number(targetSpeechAnalyzed || 0).toFixed(1)}s speech (<10.0s threshold required for ML evaluation)`
              : `Accumulated ${Number(targetSpeechAnalyzed || 0).toFixed(1)}s / ${minRequiredSpeech}s usable speech (silence excluded)`}
          </p>
        )}
      </div>

      {/* Telemetry Grid: Confidence, Language, Windows */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-white dark:bg-[#0B1524] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-3 text-center shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1">
            Model Confidence
          </div>
          <div className="font-mono text-lg font-bold text-[#0B1F3A] dark:text-white">
            {confidence > 0 ? `${confidence}%` : '—'}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B1524] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-3 text-center shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1">
            Language Model
          </div>
          <div className="font-mono text-xs font-bold text-[#008BB8] dark:text-[#00C2FF] truncate mt-1">
            {detectedLanguage || 'Detecting...'}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B1524] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-3 text-center shadow-2xs">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1">
            Windows Sliced
          </div>
          <div className="font-mono text-lg font-bold text-[#0B1F3A] dark:text-white">
            {windowsAnalyzed}
          </div>
        </div>
      </div>

      {/* Tamper-Evident Blockchain Audit Proof Box */}
      <div className="bg-slate-900 border border-[#1E3A5F] rounded-xl p-4 mb-5 text-slate-100 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#00C2FF]">
              Blockchain Audit Ledger
            </span>
          </div>
          <span className="text-[10px] font-mono bg-[#1E3A5F] text-[#38BDF8] px-2 py-0.5 rounded-full">
            {blockchainAudit ? `Block #${blockchainAudit.block_number}` : 'Ledger Synced'}
          </span>
        </div>

        <div className="space-y-1.5 text-xs font-mono">
          <div className="flex justify-between items-center text-slate-400">
            <span>TX Hash:</span>
            <span className="text-white truncate max-w-[200px]" title={blockchainAudit?.tx_hash || 'Pending'}>
              {blockchainAudit?.tx_hash ? `${blockchainAudit.tx_hash.slice(0, 18)}...` : 'Pending On-Chain Commit...'}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400">
            <span>Audit Proof:</span>
            <span className="text-[#10B981] truncate max-w-[200px]" title={blockchainAudit?.audit_hash || 'SHA-256'}>
              {blockchainAudit?.audit_hash ? `SHA256:${blockchainAudit.audit_hash.slice(0, 14)}...` : 'Deterministic Hashing'}
            </span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Tamper-Evident Off-Chain/On-Chain Linked
          </span>
          <span>Zero Media Retention</span>
        </div>
      </div>

      {/* Security Recommendation Banner */}
      <div className={`rounded-xl p-4 mb-5 border ${config.bannerBg} transition-colors`}>
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider mb-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Security Recommendation
        </div>
        <p className="text-xs sm:text-sm font-medium leading-relaxed">
          {recommendation}
        </p>
      </div>

      {/* Acoustic & Prosody Breakdown (Forensics) */}
      {indicators?.acoustic && (
        <div className="mb-4 pt-4 border-t border-[#F1F5F9] dark:border-[#1E3A5F]">
          <h4 className="text-xs font-bold text-[#0B1F3A] dark:text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#00C2FF] rounded-full" />
            Acoustic Signal Breakdown
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(indicators.acoustic).map(([key, value]) => (
              <div key={key} className="bg-slate-50 dark:bg-[#0B1524] border border-slate-100 dark:border-[#1E3A5F] rounded-lg p-2 flex justify-between items-center">
                <span className="text-[#64748B] dark:text-[#94A3B8] capitalize truncate mr-1">{key.replace(/_/g, ' ')}</span>
                <span className="font-mono font-semibold text-[#0B1F3A] dark:text-white">
                  {typeof value === 'number' ? value.toFixed(2) : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-time Risk History Timeline */}
      {riskHistory.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#F1F5F9] dark:border-[#1E3A5F]">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] dark:text-white">
              Sliding Window Timeline ({riskHistory.length} Telemetries)
            </span>
            <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
              {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : ''}
            </span>
          </div>
          
          <div className="flex items-end gap-1 h-12 bg-slate-50 dark:bg-[#0B1524] border border-slate-200 dark:border-[#1E3A5F] rounded-lg p-1.5 transition-colors">
            {riskHistory.map((entry, index) => {
              const height = Math.max(15, Math.min(100, (entry.riskScore / 100) * 100));
              const color = entry.voiceStatus === 'CLONED VOICE' ? 'bg-[#EF4444]' :
                            entry.voiceStatus === 'UNCERTAIN' ? 'bg-[#F59E0B]' :
                            entry.voiceStatus === 'REAL' ? 'bg-[#10B981]' :
                            'bg-[#00C2FF]';
              
              return (
                <div
                  key={index}
                  className={`flex-1 ${color} rounded-t-[1px] transition-all duration-300`}
                  style={{ height: `${height}%` }}
                  title={`${entry.voiceStatus}: ${entry.riskScore}%`}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Meta Footer */}
      <div className="mt-5 pt-4 border-t border-[#F1F5F9] dark:border-[#1E3A5F] flex items-center justify-between text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">
        <span className="truncate max-w-[180px]">Session: {callId || externalData?.filename || 'Offline File'}</span>
        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-sans font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
          Immutable Audit Enforced
        </span>
      </div>
    </div>
  );
}
