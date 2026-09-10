/**
 * AudioWorklet Processor for Real-time Audio Processing
 * 
 * Processes audio in 128-sample quantums, accumulates to buffer,
 * converts to Int16 PCM, detects voice activity, and sends to main thread.
 * 
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

class VoiceShieldAudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Configuration
    this.bufferSize = 4096;  // Accumulate 4096 samples before sending
    this.targetSampleRate = 16000;  // Target sample rate (16kHz)
    this.vadThreshold = 0.01;  // Voice activity detection threshold
    
    // State
    this.buffer = [];
    this.currentSampleRate = sampleRate;  // Global sampleRate from AudioContext
    
    console.log(
      `AudioProcessor initialized: ${this.currentSampleRate}Hz → ${this.targetSampleRate}Hz, ` +
      `buffer=${this.bufferSize}, VAD=${this.vadThreshold}`
    );
  }
  
  /**
   * Process audio (called for each 128-sample quantum)
   */
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    // No input channels - skip processing
    if (!input || input.length === 0) {
      return true;
    }
    
    // Get first channel (mono)
    const inputChannel = input[0];
    
    // Convert to mono if stereo
    let monoSamples;
    if (input.length > 1) {
      monoSamples = this.convertToMono(input);
    } else {
      monoSamples = inputChannel;
    }
    
    // Resample to target rate if needed
    let processedSamples;
    if (this.currentSampleRate !== this.targetSampleRate) {
      processedSamples = this.resample(monoSamples, this.currentSampleRate, this.targetSampleRate);
    } else {
      processedSamples = monoSamples;
    }
    
    // Accumulate samples
    for (let i = 0; i < processedSamples.length; i++) {
      this.buffer.push(processedSamples[i]);
    }
    
    // Send when buffer is full
    if (this.buffer.length >= this.bufferSize) {
      this.sendBuffer();
    }
    
    // Return true to keep processor alive
    return true;
  }
  
  /**
   * Convert stereo to mono (average of channels)
   */
  convertToMono(channels) {
    const length = channels[0].length;
    const mono = new Float32Array(length);
    
    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (let c = 0; c < channels.length; c++) {
        sum += channels[c][i];
      }
      mono[i] = sum / channels.length;
    }
    
    return mono;
  }
  
  /**
   * Simple linear interpolation resampling
   */
  resample(samples, fromRate, toRate) {
    if (fromRate === toRate) {
      return samples;
    }
    
    const ratio = toRate / fromRate;
    const newLength = Math.floor(samples.length * ratio);
    const resampled = new Float32Array(newLength);
    
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i / ratio;
      const srcIndexFloor = Math.floor(srcIndex);
      const srcIndexCeil = Math.min(srcIndexFloor + 1, samples.length - 1);
      const fraction = srcIndex - srcIndexFloor;
      
      // Linear interpolation
      resampled[i] = samples[srcIndexFloor] * (1 - fraction) +
                     samples[srcIndexCeil] * fraction;
    }
    
    return resampled;
  }
  
  /**
   * Detect voice activity using energy-based VAD
   */
  detectVoiceActivity(samples) {
    // Calculate RMS (Root Mean Square) energy
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    const rms = Math.sqrt(sum / samples.length);
    
    // Voice detected if energy exceeds threshold
    return rms > this.vadThreshold;
  }
  
  /**
   * Convert Float32 samples to Int16 PCM
   */
  floatToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    
    for (let i = 0; i < float32Array.length; i++) {
      // Clamp to [-1, 1] and scale to Int16 range
      const clamped = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = Math.round(clamped * 32767);
    }
    
    return int16Array;
  }
  
  /**
   * Send accumulated buffer to main thread
   */
  sendBuffer() {
    const samples = new Float32Array(this.buffer);
    
    // Detect voice activity
    const hasSpeech = this.detectVoiceActivity(samples);
    
    // Convert to Int16 PCM
    const pcmData = this.floatToInt16(samples);
    
    // Send to main thread
    this.port.postMessage({
      type: 'pcm_chunk',
      data: pcmData,
      timestamp: currentTime,
      hasSpeech: hasSpeech,
    });
    
    // Clear buffer
    this.buffer = [];
  }
}

// Register processor
registerProcessor('voiceshield-audio-processor', VoiceShieldAudioProcessor);
