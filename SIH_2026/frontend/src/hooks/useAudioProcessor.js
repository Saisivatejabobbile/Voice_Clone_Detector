import { useEffect, useRef, useState } from 'react';

/**
 * useAudioProcessor Hook
 * 
 * Manages AudioWorklet for real-time audio processing.
 * Processes remote audio stream, extracts PCM data, and sends to analysis WebSocket.
 * 
 * IMPORTANT: This hook processes the REMOTE STREAM:
 * - On RECEIVER side: remoteStream = CALLER's audio (what we want to analyze)
 * - On CALLER side: this hook should NOT be activated (no analysis)
 * 
 * The caller's voice is analyzed by the receiver to detect synthetic voice.
 * 
 * Task 7.3: Integrated with WebRTC hook, terminates on call end
 * Requirements: 11.1, 11.2, 11.5, 11.7, 11.8
 * 
 * @param {MediaStream} remoteStream - Remote audio stream from WebRTC (caller's audio on receiver side)
 * @param {string} callId - Unique call identifier
 * @param {Function} sendAudioChunk - Callback to send PCM chunks to analysis WebSocket
 * 
 * Browser compatibility: Gracefully degrades if AudioWorklet not supported
 */
export const useAudioProcessor = (remoteStream, callId, sendAudioChunk) => {
  const audioContextRef = useRef(null);
  const workletNodeRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const isInitializing = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    // Guard against multiple simultaneous initializations
    if (isInitializing.current) {
      console.log('[AudioProcessor] Already initializing, skipping');
      return;
    }
    
    if (!remoteStream || !callId) {
      console.log('[AudioProcessor] Missing remoteStream or callId, skipping initialization');
      return;
    }
    
    // Set initialization guard
    isInitializing.current = true;
    
    const initializeAudioProcessor = async () => {
      // Check for AudioWorklet support (Requirement 11.8)
      if (!window.AudioWorklet) {
        console.warn('[AudioProcessor] AudioWorklet not supported in this browser. Audio analysis disabled.');
        isInitializing.current = false;
        return;
      }
      
      try {
        console.log('[AudioProcessor] Initializing for REMOTE STREAM (analyzing caller audio on receiver side)...');
        
        // Create AudioContext with native 16kHz resampler for pristine ML voice detection
        let audioContext;
        try {
          audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        } catch (e) {
          audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        audioContextRef.current = audioContext;
        
        // Resume context if suspended (required for module loading)
        if (audioContext.state === 'suspended') {
          console.log('[AudioProcessor] Resuming suspended AudioContext');
          await audioContext.resume();
        }
        
        // Load AudioWorklet module
        console.log('[AudioProcessor] Loading AudioWorklet module...');
        await audioContext.audioWorklet.addModule('/audioProcessor.js');
        console.log('[AudioProcessor] AudioWorklet module loaded successfully');
        
        // Create MediaStreamSource from remote stream
        const source = audioContext.createMediaStreamSource(remoteStream);
        sourceNodeRef.current = source;
        
        // Create AudioWorkletNode
        const workletNode = new AudioWorkletNode(
          audioContext,
          'voiceshield-audio-processor'
        );
        workletNodeRef.current = workletNode;
        
        // Handle messages from AudioWorklet (PCM chunks)
        workletNode.port.onmessage = (event) => {
          const { type, data, hasSpeech } = event.data;
          
          if (type === 'pcm_chunk') {
            // Forward PCM chunks to backend WebSocket so server-side VAD isolates target speech from silence
            if (sendAudioChunk && data && data.length > 0) {
              sendAudioChunk(callId, Array.from(data), 16000);
            }
          }
        };
        
        // Connect audio pipeline: source → worklet → destination
        source.connect(workletNode);
        workletNode.connect(audioContext.destination);
        
        setIsProcessing(true);
        console.log('[AudioProcessor] Pipeline connected successfully - analyzing REMOTE STREAM');
        
      } catch (error) {
        console.error('[AudioProcessor] Initialization failed:', error);
        console.error('[AudioProcessor] Error details:', error.message);
        console.warn('[AudioProcessor] Audio analysis will be disabled for this call');
      } finally {
        isInitializing.current = false;
      }
    };
    
    initializeAudioProcessor();
    
    // Cleanup function
    return () => {
      console.log('[AudioProcessor] Cleanup starting...');
      
      // Disconnect worklet node
      if (workletNodeRef.current) {
        try {
          workletNodeRef.current.disconnect();
          workletNodeRef.current = null;
          console.log('[AudioProcessor] Worklet node disconnected');
        } catch (error) {
          console.error('[AudioProcessor] Error disconnecting worklet node:', error);
        }
      }
      
      // Disconnect source node
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.disconnect();
          sourceNodeRef.current = null;
          console.log('[AudioProcessor] Source node disconnected');
        } catch (error) {
          console.error('[AudioProcessor] Error disconnecting source node:', error);
        }
      }
      
      // Close AudioContext
      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
          audioContextRef.current = null;
          console.log('[AudioProcessor] AudioContext closed');
        } catch (error) {
          console.error('[AudioProcessor] Error closing AudioContext:', error);
        }
      }
      
      setIsProcessing(false);
      isInitializing.current = false;
      console.log('[AudioProcessor] Cleanup complete');
    };
  }, [remoteStream, callId, sendAudioChunk]);
  
  return {
    isProcessing,
  };
};

export default useAudioProcessor;
