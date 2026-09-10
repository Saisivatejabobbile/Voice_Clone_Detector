/**
 * WebRTC Utility Functions
 * Helper functions for microphone access and peer connection management
 */

// STUN server configuration
export const RTC_CONFIGURATION = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

/**
 * Request microphone access
 * 
 * Requirements: 2.2, 2.3, 5.1, 9.1
 */
export async function requestMicrophoneAccess() {
  try {
    console.log('Requesting microphone access...');
    
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });
    
    console.log('Microphone access granted', stream.getTracks());
    return { stream, error: null };
    
  } catch (error) {
    console.error('Microphone access error:', error);
    
    let errorMessage = 'Failed to access microphone';
    
    if (error.name === 'NotAllowedError') {
      errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
    } else if (error.name === 'NotFoundError') {
      errorMessage = 'No microphone found. Please connect a microphone and try again.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Microphone is already in use by another application.';
    } else if (error.name === 'OverconstrainedError') {
      errorMessage = 'Microphone does not meet the required constraints.';
    }
    
    return { stream: null, error: errorMessage };
  }
}

/**
 * Stop media stream and release microphone
 */
export function stopMediaStream(stream) {
  if (!stream) return;
  
  stream.getTracks().forEach(track => {
    track.stop();
    console.log(`Stopped ${track.kind} track`);
  });
}

/**
 * Create RTCPeerConnection with event handlers
 * 
 * Requirements: 2.4, 4.1, 4.6, 4.7, 5.2, 5.3, 10.1, 10.2, 10.3, 10.4, 10.5
 */
export function createPeerConnection({
  localStream,
  onRemoteStream,
  onICECandidate,
  onConnectionStateChange,
}) {
  console.log('Creating peer connection...');
  
  const peerConnection = new RTCPeerConnection(RTC_CONFIGURATION);
  
  // Add local stream tracks to peer connection
  if (localStream) {
    localStream.getTracks().forEach(track => {
      peerConnection.addTrack(track, localStream);
      console.log(`Added ${track.kind} track to peer connection`);
    });
  }
  
  // Handle remote stream
  peerConnection.ontrack = (event) => {
    console.log('Received remote track:', event.track.kind);
    const [remoteStream] = event.streams;
    if (onRemoteStream) {
      onRemoteStream(remoteStream);
    }
  };
  
  // Handle ICE candidates
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      console.log('New ICE candidate:', event.candidate.candidate.substring(0, 50) + '...');
      if (onICECandidate) {
        onICECandidate(event.candidate);
      }
    } else {
      console.log('ICE candidate gathering complete');
    }
  };
  
  // Handle ICE connection state changes
  peerConnection.oniceconnectionstatechange = () => {
    console.log('ICE connection state:', peerConnection.iceConnectionState);
    if (onConnectionStateChange) {
      onConnectionStateChange(peerConnection.iceConnectionState);
    }
  };
  
  // Handle connection state changes
  peerConnection.onconnectionstatechange = () => {
    console.log('Connection state:', peerConnection.connectionState);
  };
  
  // Handle ICE gathering state changes
  peerConnection.onicegatheringstatechange = () => {
    console.log('ICE gathering state:', peerConnection.iceGatheringState);
  };
  
  // Handle signaling state changes
  peerConnection.onsignalingstatechange = () => {
    console.log('Signaling state:', peerConnection.signalingState);
  };
  
  console.log('Peer connection created successfully');
  return peerConnection;
}

/**
 * Create WebRTC offer
 */
export async function createOffer(peerConnection) {
  try {
    console.log('Creating WebRTC offer...');
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    console.log('Local description (offer) set');
    return { offer, error: null };
  } catch (error) {
    console.error('Failed to create offer:', error);
    return { offer: null, error: error.message };
  }
}

/**
 * Create WebRTC answer
 */
export async function createAnswer(peerConnection) {
  try {
    console.log('Creating WebRTC answer...');
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    console.log('Local description (answer) set');
    return { answer, error: null };
  } catch (error) {
    console.error('Failed to create answer:', error);
    return { answer: null, error: error.message };
  }
}

/**
 * Set remote description (offer or answer)
 */
export async function setRemoteDescription(peerConnection, description) {
  try {
    console.log('Setting remote description:', description.type);
    await peerConnection.setRemoteDescription(new RTCSessionDescription(description));
    console.log('Remote description set successfully');
    return { success: true, error: null };
  } catch (error) {
    console.error('Failed to set remote description:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Add ICE candidate to peer connection
 */
export async function addICECandidate(peerConnection, candidate) {
  try {
    if (candidate) {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('ICE candidate added');
    }
    return { success: true, error: null };
  } catch (error) {
    console.error('Failed to add ICE candidate:', error);
    return { success: false, error: error.message };
  }
}
