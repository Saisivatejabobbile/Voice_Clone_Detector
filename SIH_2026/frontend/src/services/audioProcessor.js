// Audio Processor Service for Remote Stream Analysis
// Extracts PCM data from remote audio for backend analysis

import { AUDIO_CONFIG } from '../constants';

class AudioProcessor {
  constructor() {
    this.audioContext = null;
    this.analyserNode = null;
    this.scriptProcessor = null;
    this.source = null;
    this.isProcessing = false;
    this.onAudioDataHandler = null;
  }

  /**
   * Initialize audio processing for remote stream
   */
  async initialize(remoteStream) {
    try {
      // Create AudioContext
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        sampleRate: AUDIO_CONFIG.sampleRate,
      });

      // Create source from remote stream
      this.source = this.audioContext.createMediaStreamSource(remoteStream);

      // Create analyser for visualization
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;

      // Create script processor for PCM extraction
      // Note: ScriptProcessorNode is deprecated but still widely supported
      // AudioWorklet is the modern alternative but requires more setup
      const bufferSize = AUDIO_CONFIG.bufferSize;
      this.scriptProcessor = this.audioContext.createScriptProcessor(
        bufferSize,
        1, // mono input
        1  // mono output
      );

      // Process audio data
      this.scriptProcessor.onaudioprocess = (event) => {
        if (!this.isProcessing) return;

        const inputData = event.inputBuffer.getChannelData(0);
        
        // Convert Float32 to Int16 PCM
        const pcmData = this.float32ToInt16(inputData);

        // Send to handler (for WebSocket transmission)
        if (this.onAudioDataHandler) {
          this.onAudioDataHandler(pcmData);
        }
      };

      // Connect nodes
      this.source.connect(this.analyserNode);
      this.analyserNode.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      this.isProcessing = true;
      console.log('Audio processor initialized');
    } catch (error) {
      console.error('Failed to initialize audio processor:', error);
      throw error;
    }
  }

  /**
   * Convert Float32Array to Int16Array (PCM format)
   */
  float32ToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    
    for (let i = 0; i < float32Array.length; i++) {
      // Clamp to [-1, 1] range
      const clamped = Math.max(-1, Math.min(1, float32Array[i]));
      // Convert to 16-bit integer
      int16Array[i] = clamped < 0 ? clamped * 32768 : clamped * 32767;
    }
    
    return int16Array;
  }

  /**
   * Get audio frequency data for visualization
   */
  getFrequencyData() {
    if (!this.analyserNode) return null;

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteFrequencyData(dataArray);
    
    return dataArray;
  }

  /**
   * Get audio time domain data for waveform
   */
  getTimeDomainData() {
    if (!this.analyserNode) return null;

    const bufferLength = this.analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    this.analyserNode.getByteTimeDomainData(dataArray);
    
    return dataArray;
  }

  /**
   * Calculate audio volume level (0-100)
   */
  getVolumeLevel() {
    if (!this.analyserNode) return 0;

    const dataArray = this.getTimeDomainData();
    if (!dataArray) return 0;

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }

    const rms = Math.sqrt(sum / dataArray.length);
    return Math.min(100, Math.floor(rms * 200));
  }

  /**
   * Detect voice activity (simple threshold-based)
   */
  hasVoiceActivity(threshold = 10) {
    const volume = this.getVolumeLevel();
    return volume > threshold;
  }

  /**
   * Set audio data handler
   */
  onAudioData(handler) {
    this.onAudioDataHandler = handler;
  }

  /**
   * Start processing
   */
  start() {
    this.isProcessing = true;
    console.log('Audio processing started');
  }

  /**
   * Stop processing
   */
  stop() {
    this.isProcessing = false;
    console.log('Audio processing stopped');
  }

  /**
   * Cleanup and release resources
   */
  cleanup() {
    console.log('Cleaning up audio processor...');

    this.isProcessing = false;

    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.analyserNode) {
      this.analyserNode.disconnect();
      this.analyserNode = null;
    }

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.onAudioDataHandler = null;

    console.log('Audio processor cleaned up');
  }

  /**
   * Check if audio processing is supported
   */
  static isSupported() {
    return !!(
      window.AudioContext ||
      window.webkitAudioContext
    );
  }
}

export default AudioProcessor;
