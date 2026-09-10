/**
 * Tests for useWebSocket hook
 * Requirements: 1.1, 1.5, 9.4
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useWebSocket } from './useWebSocket';

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    MockWebSocket.instances.push(this);
    
    // Simulate async connection
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 10);
  }
  
  send(data) {
    this.lastSentMessage = data;
  }
  
  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) this.onclose();
  }
  
  static instances = [];
  static clearInstances() {
    MockWebSocket.instances = [];
  }
}

// Setup WebSocket mock
global.WebSocket = MockWebSocket;
MockWebSocket.CONNECTING = 0;
MockWebSocket.OPEN = 1;
MockWebSocket.CLOSING = 2;
MockWebSocket.CLOSED = 3;

describe('useWebSocket', () => {
  beforeEach(() => {
    MockWebSocket.clearInstances();
  });
  
  afterEach(() => {
    jest.clearAllTimers();
  });
  
  test('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8000/ws/test', 'test-token'));
    
    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionState).toBe('connecting');
  });
  
  test('should connect to WebSocket with token in query string', async () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8000/ws/test', 'test-token'));
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
    
    expect(result.current.connectionState).toBe('connected');
    expect(MockWebSocket.instances.length).toBe(1);
    expect(MockWebSocket.instances[0].url).toBe('ws://localhost:8000/ws/test?token=test-token');
  });
  
  test('should update connection state to connected on open', async () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8000/ws/test', 'test-token'));
    
    expect(result.current.connectionState).toBe('connecting');
    
    await waitFor(() => {
      expect(result.current.connectionState).toBe('connected');
    });
    
    expect(result.current.isConnected).toBe(true);
  });
  
  test('should send JSON messages through WebSocket', async () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8000/ws/test', 'test-token'));
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
    
    const testMessage = { type: 'test', data: 'hello' };
    
    act(() => {
      result.current.sendMessage(testMessage);
    });
    
    expect(MockWebSocket.instances[0].lastSentMessage).toBe(JSON.stringify(testMessage));
  });
  
  test('should handle incoming messages', async () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8000/ws/test', 'test-token'));
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
    
    const messageHandler = jest.fn();
    
    act(() => {
      result.current.onMessage('test_message', messageHandler);
    });
    
    const testMessage = { type: 'test_message', data: 'hello' };
    
    act(() => {
      const messageEvent = { data: JSON.stringify(testMessage) };
      MockWebSocket.instances[0].onmessage(messageEvent);
    });
    
    expect(messageHandler).toHaveBeenCalledWith(testMessage);
  });
  
  test('should handle onclose and trigger reconnection', async () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useWebSocket('ws://localhost:8000/ws/test', 'test-token'));
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
    
    expect(MockWebSocket.instances.length).toBe(1);
    
    // Simulate close
    act(() => {
      MockWebSocket.instances[0].close();
    });
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(false);
    });
    
    expect(result.current.connectionState).toBe('reconnecting');
    
    // Fast-forward time to trigger reconnection
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(2);
    });
    
    jest.useRealTimers();
  });
  
  test('should implement exponential backoff for reconnections', async () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useWebSocket('ws://localhost:8000/ws/test', 'test-token'));
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
    
    // First disconnect and reconnect
    act(() => {
      MockWebSocket.instances[0].close();
    });
    
    await waitFor(() => {
      expect(result.current.connectionState).toBe('reconnecting');
    });
    
    // First reconnect attempt after 2000ms
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(2);
    });
    
    // Second disconnect
    act(() => {
      MockWebSocket.instances[1].close();
    });
    
    // Second reconnect attempt after 4000ms (exponential backoff)
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    
    await waitFor(() => {
      expect(MockWebSocket.instances.length).toBe(3);
    });
    
    jest.useRealTimers();
  });
  
  test('should stop reconnecting after max attempts', async () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useWebSocket('ws://localhost:8000/ws/test', 'test-token'));
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
    
    // Simulate 5 disconnections
    for (let i = 0; i < 5; i++) {
      const currentInstance = MockWebSocket.instances[MockWebSocket.instances.length - 1];
      
      act(() => {
        currentInstance.close();
      });
      
      await waitFor(() => {
        expect(result.current.isConnected).toBe(false);
      });
      
      // Advance time for reconnection
      act(() => {
        jest.advanceTimersByTime((i + 1) * 2000 + 100);
      });
      
      await waitFor(() => {
        expect(MockWebSocket.instances.length).toBe(i + 2);
      });
    }
    
    // 6th disconnect - should not reconnect
    const lastInstance = MockWebSocket.instances[MockWebSocket.instances.length - 1];
    
    act(() => {
      lastInstance.close();
    });
    
    await waitFor(() => {
      expect(result.current.connectionState).toBe('failed');
    });
    
    const instanceCount = MockWebSocket.instances.length;
    
    // Advance time - should not create new instance
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    
    expect(MockWebSocket.instances.length).toBe(instanceCount);
    
    jest.useRealTimers();
  });
  
  test('should log errors on onerror', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { result } = renderHook(() => useWebSocket('ws://localhost:8000/ws/test', 'test-token'));
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
    
    const testError = new Error('WebSocket error');
    
    act(() => {
      MockWebSocket.instances[0].onerror(testError);
    });
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('WebSocket error:', testError);
    
    consoleErrorSpy.mockRestore();
  });
  
  test('should cleanup on unmount', async () => {
    const { result, unmount } = renderHook(() => useWebSocket('ws://localhost:8000/ws/test', 'test-token'));
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
    
    const ws = MockWebSocket.instances[0];
    const closeSpy = jest.spyOn(ws, 'close');
    
    unmount();
    
    expect(closeSpy).toHaveBeenCalled();
  });
  
  test('should not send message when not connected', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { result } = renderHook(() => useWebSocket('ws://localhost:8000/ws/test', 'test-token'));
    
    // Try to send message before connection
    act(() => {
      result.current.sendMessage({ type: 'test' });
    });
    
    expect(consoleErrorSpy).toHaveBeenCalledWith('WebSocket not connected, cannot send message');
    
    consoleErrorSpy.mockRestore();
  });
  
  test('should allow message handler registration and cleanup', async () => {
    const { result } = renderHook(() => useWebSocket('ws://localhost:8000/ws/test', 'test-token'));
    
    await waitFor(() => {
      expect(result.current.isConnected).toBe(true);
    });
    
    const messageHandler = jest.fn();
    let cleanup;
    
    act(() => {
      cleanup = result.current.onMessage('test_message', messageHandler);
    });
    
    // Send message - handler should be called
    act(() => {
      const messageEvent = { data: JSON.stringify({ type: 'test_message', data: 'hello' }) };
      MockWebSocket.instances[0].onmessage(messageEvent);
    });
    
    expect(messageHandler).toHaveBeenCalledTimes(1);
    
    // Cleanup handler
    act(() => {
      cleanup();
    });
    
    // Send message again - handler should not be called
    act(() => {
      const messageEvent = { data: JSON.stringify({ type: 'test_message', data: 'hello' }) };
      MockWebSocket.instances[0].onmessage(messageEvent);
    });
    
    expect(messageHandler).toHaveBeenCalledTimes(1);
  });
});
