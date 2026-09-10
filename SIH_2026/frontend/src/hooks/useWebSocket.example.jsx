/**
 * useWebSocket Integration Example
 * 
 * This example demonstrates how to use the useWebSocket hook
 * for WebRTC signaling in a React component.
 * 
 * Requirements: 1.1, 1.5, 9.4
 */

import React, { useEffect, useState } from 'react';
import { useWebSocket } from './useWebSocket';

/**
 * Example 1: Basic WebSocket Connection Status Display
 */
export function ConnectionStatusExample() {
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
  const token = localStorage.getItem('token'); // Get JWT token from storage
  
  const {
    isConnected,
    connectionState,
    sendMessage,
    onMessage,
    connect
  } = useWebSocket(`${WS_URL}/ws/signaling`, token);
  
  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-2">WebSocket Connection</h3>
      <div className="space-y-2">
        <p>
          <span className="font-medium">State:</span>{' '}
          <span className={`px-2 py-1 rounded ${
            connectionState === 'connected' ? 'bg-green-100 text-green-800' :
            connectionState === 'connecting' || connectionState === 'reconnecting' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {connectionState}
          </span>
        </p>
        <p>
          <span className="font-medium">Connected:</span>{' '}
          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? '✅ Yes' : '❌ No'}
          </span>
        </p>
        {connectionState === 'failed' && (
          <button
            onClick={connect}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry Connection
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Example 2: Simple Call Initiator
 */
export function CallInitiatorExample() {
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
  const token = localStorage.getItem('token');
  const [contactId, setContactId] = useState('');
  const [callId, setCallId] = useState('');
  
  const { isConnected, sendMessage } = useWebSocket(`${WS_URL}/ws/signaling`, token);
  
  const initiateCall = () => {
    if (!isConnected) {
      alert('WebSocket not connected');
      return;
    }
    
    if (!contactId) {
      alert('Please enter a contact ID');
      return;
    }
    
    const newCallId = `call_${Date.now()}`;
    setCallId(newCallId);
    
    sendMessage({
      type: 'call_initiate',
      to: contactId,
      call_id: newCallId
    });
    
    console.log(`Call initiated: ${newCallId} to ${contactId}`);
  };
  
  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-2">Call Initiator</h3>
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Contact ID"
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        <button
          onClick={initiateCall}
          disabled={!isConnected}
          className={`w-full px-4 py-2 rounded ${
            isConnected
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isConnected ? '📞 Initiate Call' : '⏸️ Waiting for connection...'}
        </button>
        {callId && (
          <p className="text-sm text-gray-600">Call ID: {callId}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Example 3: Incoming Call Handler
 */
export function IncomingCallHandlerExample() {
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
  const token = localStorage.getItem('token');
  const [incomingCalls, setIncomingCalls] = useState([]);
  
  const { onMessage, sendMessage } = useWebSocket(`${WS_URL}/ws/signaling`, token);
  
  useEffect(() => {
    // Register handler for incoming call initiations
    const cleanup = onMessage('call_initiate', (message) => {
      console.log('Incoming call:', message);
      setIncomingCalls(prev => [...prev, message]);
    });
    
    // Cleanup handler on unmount
    return cleanup;
  }, [onMessage]);
  
  const acceptCall = (callId, callerId) => {
    sendMessage({
      type: 'call_accept',
      call_id: callId,
      to: callerId
    });
    
    // Remove from incoming calls
    setIncomingCalls(prev => prev.filter(call => call.call_id !== callId));
  };
  
  const rejectCall = (callId, callerId) => {
    sendMessage({
      type: 'call_reject',
      call_id: callId,
      to: callerId
    });
    
    // Remove from incoming calls
    setIncomingCalls(prev => prev.filter(call => call.call_id !== callId));
  };
  
  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-2">Incoming Calls</h3>
      {incomingCalls.length === 0 ? (
        <p className="text-gray-500">No incoming calls</p>
      ) : (
        <div className="space-y-2">
          {incomingCalls.map((call, index) => (
            <div key={index} className="p-3 bg-blue-50 rounded border border-blue-200">
              <p className="font-medium">Call from: {call.from || 'Unknown'}</p>
              <p className="text-sm text-gray-600">Call ID: {call.call_id}</p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => acceptCall(call.call_id, call.from)}
                  className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  ✅ Accept
                </button>
                <button
                  onClick={() => rejectCall(call.call_id, call.from)}
                  className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example 4: Complete WebRTC Signaling Handler
 */
export function WebRTCSignalingExample() {
  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
  const token = localStorage.getItem('token');
  const [messages, setMessages] = useState([]);
  
  const { isConnected, onMessage } = useWebSocket(`${WS_URL}/ws/signaling`, token);
  
  useEffect(() => {
    // Register handlers for all signaling message types
    const cleanupOffer = onMessage('offer', (msg) => {
      console.log('Received offer:', msg);
      setMessages(prev => [...prev, { type: 'offer', data: msg, timestamp: Date.now() }]);
    });
    
    const cleanupAnswer = onMessage('answer', (msg) => {
      console.log('Received answer:', msg);
      setMessages(prev => [...prev, { type: 'answer', data: msg, timestamp: Date.now() }]);
    });
    
    const cleanupIce = onMessage('ice_candidate', (msg) => {
      console.log('Received ICE candidate:', msg);
      setMessages(prev => [...prev, { type: 'ice_candidate', data: msg, timestamp: Date.now() }]);
    });
    
    const cleanupHangup = onMessage('hangup', (msg) => {
      console.log('Call ended:', msg);
      setMessages(prev => [...prev, { type: 'hangup', data: msg, timestamp: Date.now() }]);
    });
    
    const cleanupError = onMessage('error', (msg) => {
      console.error('Signaling error:', msg);
      setMessages(prev => [...prev, { type: 'error', data: msg, timestamp: Date.now() }]);
    });
    
    // Cleanup all handlers
    return () => {
      cleanupOffer();
      cleanupAnswer();
      cleanupIce();
      cleanupHangup();
      cleanupError();
    };
  }, [onMessage]);
  
  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-2">Signaling Messages</h3>
      <p className="text-sm mb-2">
        Connection: {isConnected ? '🟢 Active' : '🔴 Inactive'}
      </p>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-sm">No messages yet</p>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className="text-xs p-2 bg-gray-100 rounded">
              <span className="font-medium">{msg.type}</span>
              <span className="text-gray-500 ml-2">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/**
 * Example 5: Combined Demo Component
 */
export function WebSocketDemoPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">useWebSocket Hook Examples</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ConnectionStatusExample />
        <CallInitiatorExample />
        <IncomingCallHandlerExample />
        <WebRTCSignalingExample />
      </div>
    </div>
  );
}

export default WebSocketDemoPage;
