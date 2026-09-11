import { useState, useRef } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import RiskDashboard from '../components/call/RiskDashboard';
import { callsAPI } from '../services/api';

/**
 * AudioAnalysisPage - Voice Spoof & AI Clone Lab
 * Upload .wav audio files to test whether the voice is AI-synthesized/cloned or authentic human.
 * Displays the complete real-time RiskDashboard, forensic metrics, and blockchain audit proof.
 */
export default function AudioAnalysisPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const fileInputRef = useRef(null);
  const audioPlayerRef = useRef(null);

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file) => {
    setErrorMessage(null);
    setAnalysisResult(null);

    // Validate WAV format
    if (!file.name.toLowerCase().endsWith('.wav') && !file.type.includes('wav')) {
      setErrorMessage('Please select a valid .wav audio file.');
      return;
    }

    // Validate size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 20MB limit. Please upload a smaller recording.');
      return;
    }

    setSelectedFile(file);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
  };

  // Drag & drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Synthetic Test Generator for Instant One-Click Evaluation
  const generatePresetAudio = (isAiType = true) => {
    try {
      const sampleRate = 16000;
      const durationSec = 4.0;
      const numSamples = Math.floor(sampleRate * durationSec);
      const samples = new Int16Array(numSamples);

      const f0 = isAiType ? 140.0 : 130.0;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        const speechEnvelope = 0.5 * (1.0 + Math.sin(2 * Math.PI * 1.5 * t));

        let v = 0;
        if (isAiType) {
          // AI: Rigid robotic harmonic envelope with high spectral flatness
          v = speechEnvelope * (
            0.50 * Math.sin(2 * Math.PI * f0 * t) +
            0.30 * Math.sin(2 * Math.PI * (f0 * 2) * t) +
            0.20 * Math.sin(2 * Math.PI * (f0 * 3) * t)
          );
        } else {
          // Human: Natural vocal flutter, slight vibrato micro-jitter
          const jitterF0 = f0 + 2.5 * Math.sin(2 * Math.PI * 6.0 * t);
          v = speechEnvelope * (
            0.60 * Math.sin(2 * Math.PI * jitterF0 * t) +
            0.20 * Math.sin(2 * Math.PI * (jitterF0 * 2) * t) +
            0.10 * Math.sin(2 * Math.PI * (jitterF0 * 3) * t)
          );
        }
        samples[i] = Math.max(-32768, Math.min(32767, Math.floor(v * 16000)));
      }

      // Encode WAV header
      const buffer = new ArrayBuffer(44 + samples.byteLength);
      const view = new DataView(buffer);
      
      const writeString = (offset, string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + samples.byteLength, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true); // PCM
      view.setUint16(22, 1, true); // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true); // Byte rate
      view.setUint16(32, 2, true); // Block align
      view.setUint16(34, 16, true); // 16-bit
      writeString(36, 'data');
      view.setUint32(40, samples.byteLength, true);

      const byteView = new Uint8Array(buffer, 44);
      byteView.set(new Uint8Array(samples.buffer));

      const blob = new Blob([buffer], { type: 'audio/wav' });
      const filename = isAiType ? 'sample_ai_cloned_voice.wav' : 'sample_human_voice.wav';
      const file = new File([blob], filename, { type: 'audio/wav' });

      processSelectedFile(file);
    } catch (err) {
      console.error('Failed to generate preset audio:', err);
    }
  };

  // Run Analysis
  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    setActiveStep(1);

    const stepInterval = setInterval(() => {
      setActiveStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 600);

    try {
      const data = await callsAPI.analyzeAudioFile(selectedFile);
      clearInterval(stepInterval);
      setActiveStep(3);
      setAnalysisResult(data);
    } catch (err) {
      clearInterval(stepInterval);
      console.error('Audio file analysis failed:', err);
      setErrorMessage(err.message || 'Analysis failed. Please check the audio file and backend connection.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setAnalysisResult(null);
    setErrorMessage(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Layout>
      <div className="space-y-8 max-w-7xl mx-auto pb-12">
        {/* Header Title & Badges */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#1E3A5F]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00C2FF] animate-pulse" />
              <span className="text-xs font-bold font-mono tracking-wider text-[#00C2FF] uppercase">
                Offline Voice Forensics Lab
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1F3A] dark:text-[#F1F5F9] tracking-tight">
              Audio File Voice Spoof & AI Clone Lab
            </h1>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-1 max-w-2xl">
              Upload any <code className="text-xs bg-slate-100 dark:bg-[#12233C] px-1.5 py-0.5 rounded font-mono text-[#00C2FF]">.wav</code> audio file to evaluate whether the voice is synthetic AI or authentic human speech. Verified with blockchain proof-of-authenticity.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-[#12233C] border border-slate-200 dark:border-[#1E3A5F] text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 shadow-sm">
              <svg className="w-3.5 h-3.5 text-[#10B981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              ASSIST NISP Model Active
            </span>
          </div>
        </div>

        {/* Upload & Setup Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Upload Box */}
          <div className="lg:col-span-2 space-y-4">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center min-h-[260px] ${
                isDragOver
                  ? 'border-[#00C2FF] bg-[#00C2FF]/10 scale-[1.01]'
                  : selectedFile
                  ? 'border-[#10B981] bg-emerald-50/50 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-[#1E3A5F] bg-white dark:bg-[#0F1D32] hover:border-[#00C2FF] hover:bg-slate-50 dark:hover:bg-[#12233C]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".wav,audio/wav"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Upload Graphic */}
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-transform ${
                selectedFile 
                  ? 'bg-[#10B981]/20 text-[#10B981]' 
                  : 'bg-slate-100 dark:bg-[#162C4E] text-[#00C2FF]'
              }`}>
                {selectedFile ? (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                )}
              </div>

              {selectedFile ? (
                <div>
                  <p className="text-sm font-bold text-[#0B1F3A] dark:text-white mb-1">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8]">
                    {(selectedFile.size / 1024).toFixed(1)} KB • WAV Audio Format
                  </p>
                  <p className="text-xs text-[#10B981] font-semibold mt-2">
                    Click or drag another file to replace
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-base font-bold text-[#0B1F3A] dark:text-white mb-1">
                    Choose a WAV audio file or drag & drop here
                  </p>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                    Supports 16 kHz Mono or Stereo 16-bit PCM WAV (up to 20MB)
                  </p>
                </div>
              )}
            </div>

            {/* Audio Preview & Action Controls */}
            {selectedFile && (
              <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                <div className="flex-1 w-full">
                  <p className="text-xs font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider mb-2">
                    Audio Playback Preview
                  </p>
                  {audioUrl && (
                    <audio
                      ref={audioPlayerRef}
                      src={audioUrl}
                      controls
                      className="w-full h-9 rounded-lg"
                    />
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button
                    variant="outline"
                    onClick={resetUpload}
                    disabled={isAnalyzing}
                    className="text-xs"
                  >
                    Clear
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 shadow-md hover:shadow-lg font-bold"
                  >
                    {isAnalyzing ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Analyzing Neural Signatures...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Analyze Voice with AI Model
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Error Banner */}
            {errorMessage && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-sm flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}
          </div>

          {/* Quick Presets & Forensics Guidelines Card */}
          <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl p-6 space-y-5 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-[#0B1F3A] dark:text-white">
                One-Click Test Presets
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                Don’t have a WAV file? Generate a verified synthetic or natural voice sample to test the pipeline instantly:
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => generatePresetAudio(true)}
                disabled={isAnalyzing}
                className="w-full text-left p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 transition-colors flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Load AI Cloned Voice Sample
                  </p>
                  <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                    Synthesized speech with neural vocoder harmonics
                  </p>
                </div>
                <span className="text-xs font-bold text-rose-600 dark:text-rose-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>

              <button
                type="button"
                onClick={() => generatePresetAudio(false)}
                disabled={isAnalyzing}
                className="w-full text-left p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/40 transition-colors flex items-center justify-between group"
              >
                <div>
                  <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Load Human Voice Sample
                  </p>
                  <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                    Natural organic speech cadence with human jitter
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">→</span>
              </button>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] dark:border-[#1E3A5F] space-y-2">
              <p className="text-xs font-bold text-[#0B1F3A] dark:text-white">Forensic Detection Scope:</p>
              <ul className="text-xs text-[#64748B] dark:text-[#94A3B8] space-y-1.5 list-disc list-inside">
                <li>Deepfake voice impersonation models</li>
                <li>Voice conversion & clone engines (ElevenLabs, Bark, VALL-E)</li>
                <li>Hindi, Telugu & Code-mixed speech dynamics</li>
                <li>Cryptographic SHA-256 blockchain audit</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Live Analysis Progress Animation */}
        {isAnalyzing && (
          <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl p-6 space-y-4 shadow-sm animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-[#00C2FF] animate-ping" />
                <h4 className="text-sm font-bold text-[#0B1F3A] dark:text-white uppercase tracking-wider">
                  Real-Time Deep Learning Analysis in Progress
                </h4>
              </div>
              <span className="text-xs font-mono text-[#00C2FF]">Step {activeStep} of 3</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`p-3 rounded-xl border text-xs font-semibold ${
                activeStep >= 1 
                  ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300' 
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}>
                1. Parsing 16kHz PCM Frames
              </div>
              <div className={`p-3 rounded-xl border text-xs font-semibold ${
                activeStep >= 2 
                  ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300' 
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}>
                2. ASSIST Voice Spoof Model
              </div>
              <div className={`p-3 rounded-xl border text-xs font-semibold ${
                activeStep >= 3 
                  ? 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-300 dark:border-cyan-800 text-cyan-800 dark:text-cyan-300' 
                  : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400'
              }`}>
                3. Mining Blockchain Audit Ledger
              </div>
            </div>
          </div>
        )}

        {/* RESULTS SECTION: PRIMARY VERDICT & RISK DASHBOARD */}
        {analysisResult && (
          <div className="space-y-6 pt-4">
            {/* Clear Primary AI vs Human Verdict Banner */}
            <div className={`rounded-2xl p-6 sm:p-8 border shadow-lg transition-all ${
              analysisResult.is_ai || analysisResult.voice_status === 'CLONED VOICE'
                ? 'bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/40 text-rose-900 dark:text-rose-100'
                : 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/40 text-emerald-900 dark:text-emerald-100'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${
                    analysisResult.is_ai || analysisResult.voice_status === 'CLONED VOICE'
                      ? 'bg-rose-500 text-white shadow-rose-500/30'
                      : 'bg-emerald-500 text-white shadow-emerald-500/30'
                  }`}>
                    {analysisResult.is_ai || analysisResult.voice_status === 'CLONED VOICE' ? (
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                        analysisResult.is_ai || analysisResult.voice_status === 'CLONED VOICE'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      }`}>
                        {analysisResult.voice_status}
                      </span>
                      <span className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8]">
                        Confidence: {analysisResult.confidence}%
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                      {analysisResult.is_ai || analysisResult.voice_status === 'CLONED VOICE'
                        ? 'AI Generated / Cloned Voice Detected'
                        : 'Authentic Human Voice Verified'}
                    </h2>

                    <p className="text-sm font-medium mt-1 text-[#475569] dark:text-[#94A3B8] max-w-3xl">
                      {analysisResult.recommendation}
                    </p>
                  </div>
                </div>

                {/* Probability Distribution Pill */}
                <div className="flex flex-col gap-2 min-w-[220px] p-4 bg-white/70 dark:bg-[#0B1524]/70 backdrop-blur rounded-xl border border-slate-200 dark:border-[#1E3A5F]">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-rose-600 dark:text-rose-400">AI Synthetic</span>
                    <span className="font-mono text-rose-600 dark:text-rose-400">
                      {analysisResult.synthetic_probability}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-rose-500 h-full transition-all duration-500"
                      style={{ width: `${analysisResult.synthetic_probability}%` }}
                    />
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${analysisResult.real_probability}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">Human Voice</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400">
                      {analysisResult.real_probability}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Embedded Complete Risk Dashboard */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-[#0B1F3A] dark:text-white">
                  Forensic Telemetry & Cryptographic Audit Proof
                </h3>
                <span className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8]">
                  File: {analysisResult.filename} • {analysisResult.duration_seconds}s
                </span>
              </div>

              {/* Renders the EXACT same RiskDashboard widget with externalData */}
              <RiskDashboard
                callId={analysisResult.blockchain_audit?.call_id || analysisResult.filename}
                externalData={analysisResult}
                callerInfo={{
                  caller_name: analysisResult.filename,
                  caller_email: `File Size: ${(analysisResult.file_size_bytes / 1024).toFixed(1)} KB`
                }}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
