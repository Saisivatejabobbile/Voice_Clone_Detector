/**
 * Tests for useAudioProcessor Hook
 * 
 * These tests verify that the AudioWorklet-based audio processing
 * pipeline works correctly for real-time voice analysis.
 * 
 * Requirements: 11.1, 11.2, 11.5, 11.7
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useAudioProcessor } from './useAudioProcessor';

describe('useAudioProcessor', () => {
  let mockAudioContext;
  let mockWorkletNode;
  let mockSourceNode;
  let mockRemoteStream;
  
  beforeEach(() => {
    // Mock AudioContext
    mockWorkletNode = {
      connect: jest.fn(),
      disconnect: jest.fn(),
      port: {
        onmessage: null,
      },
    };
    
    mockSourceNode = {
      connect: jest.fn(),
      disconnect: jest.fn(),
    };
    
    mockAudioContext = {
      audioWorklet: {
        addModule: jest.fn().mockResolvedValue(undefined),
      },
      createMediaStreamSource: jest.fn().mockReturnValue(mockSourceNode),
      destination: {},
      close: jest.fn().mockResolvedValue(undefined),
    };
    
    // Mock AudioWorkletNode constructor
    global.AudioWorkletNode = jest.fn().mockImplementation(() => mockWorkletNode);
    
    // Mock AudioContext constructor
    global.AudioContext = jest.fn().mockImplementation(() => mockAudioContext);
    global.webkitAudioContext = global.AudioContext;
    
    // Mock MediaStream
    mockRemoteStream = {
      getTracks: jest.fn().mockReturnValue([]),
    };
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should initialize AudioWorklet when remoteStream and callId are provided', async () => {
    const callId = 'test-call-123';
    const sendAudioChunk = jest.fn();
    
    const { result } = renderHook(() =>
      useAudioProcessor(mockRemoteStream, callId, sendAudioChunk)
    );
    
    await waitFor(() => {
      expect(mockAudioContext.audioWorklet.addModule).toHaveBeenCalledWith('/audioProcessor.js');
    });
    
    expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockRemoteStream);
    expect(AudioWorkletNode).toHaveBeenCalledWith(
      mockAudioContext,
      'voiceshield-audio-processor'
    );
    expect(mockSourceNode.connect).toHaveBeenCalledWith(mockWorkletNode);
    expect(mockWorkletNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
  });
  
  test('should send audio chunks when speech is detected', async () => {
    const callId = 'test-call-123';
    const sendAudioChunk = jest.fn();
    
    renderHook(() =>
      useAudioProcessor(mockRemoteStream, callId, sendAudioChunk)
    );
    
    await waitFor(() => {
      expect(mockWorkletNode.port.onmessage).toBeDefined();
    });
    
    // Simulate PCM chunk message from AudioWorklet
    const mockPCMData = new Int16Array([100, 200, 300, 400]);
    const mockMessage = {
      data: {
        type: 'pcm_chunk',
        data: mockPCMData,
        timestamp: 1.5,
        hasSpeech: true,
      },
    };
    
    mockWorkletNode.port.onmessage(mockMessage);
    
    expect(sendAudioChunk).toHaveBeenCalledWith(
      callId,
      Array.from(mockPCMData),
      16000
    );
  });
  
  test('should not send audio chunks when no speech is detected', async () => {
    const callId = 'test-call-123';
    const sendAudioChunk = jest.fn();
    
    renderHook(() =>
      useAudioProcessor(mockRemoteStream, callId, sendAudioChunk)
    );
    
    await waitFor(() => {
      expect(mockWorkletNode.port.onmessage).toBeDefined();
    });
    
    // Simulate PCM chunk message with no speech
    const mockMessage = {
      data: {
        type: 'pcm_chunk',
        data: new Int16Array([10, 20, 30]),
        timestamp: 1.5,
        hasSpeech: false,
      },
    };
    
    mockWorkletNode.port.onmessage(mockMessage);
    
    expect(sendAudioChunk).not.toHaveBeenCalled();
  });
  
  test('should cleanup AudioWorklet on unmount', async () => {
    const callId = 'test-call-123';
    const sendAudioChunk = jest.fn();
    
    const { unmount } = renderHook(() =>
      useAudioProcessor(mockRemoteStream, callId, sendAudioChunk)
    );
    
    await waitFor(() => {
      expect(mockAudioContext.audioWorklet.addModule).toHaveBeenCalled();
    });
    
    unmount();
    
    await waitFor(() => {
      expect(mockWorkletNode.disconnect).toHaveBeenCalled();
      expect(mockSourceNode.disconnect).toHaveBeenCalled();
      expect(mockAudioContext.close).toHaveBeenCalled();
    });
  });
  
  test('should not initialize if remoteStream is null', () => {
    const callId = 'test-call-123';
    const sendAudioChunk = jest.fn();
    
    renderHook(() =>
      useAudioProcessor(null, callId, sendAudioChunk)
    );
    
    expect(mockAudioContext.audioWorklet.addModule).not.toHaveBeenCalled();
  });
  
  test('should not initialize if callId is null', () => {
    const sendAudioChunk = jest.fn();
    
    renderHook(() =>
      useAudioProcessor(mockRemoteStream, null, sendAudioChunk)
    );
    
    expect(mockAudioContext.audioWorklet.addModule).not.toHaveBeenCalled();
  });
  
  test('should handle AudioWorklet initialization errors gracefully', async () => {
    const callId = 'test-call-123';
    const sendAudioChunk = jest.fn();
    
    // Mock an error during AudioWorklet module loading
    mockAudioContext.audioWorklet.addModule.mockRejectedValue(
      new Error('Failed to load AudioWorklet module')
    );
    
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    renderHook(() =>
      useAudioProcessor(mockRemoteStream, callId, sendAudioChunk)
    );
    
    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize AudioWorklet:',
        expect.any(Error)
      );
    });
    
    consoleErrorSpy.mockRestore();
  });
  
  test('should return isProcessing status', async () => {
    const callId = 'test-call-123';
    const sendAudioChunk = jest.fn();
    
    const { result } = renderHook(() =>
      useAudioProcessor(mockRemoteStream, callId, sendAudioChunk)
    );
    
    await waitFor(() => {
      expect(result.current.isProcessing).toBe(true);
    });
  });
});
