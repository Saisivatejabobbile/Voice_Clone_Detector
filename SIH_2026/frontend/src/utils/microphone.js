/**
 * Microphone Access Error Handler
 * 
 * Provides user-friendly error messages for microphone access issues
 * Requirements: 9.1
 */

export class MicrophoneError extends Error {
  constructor(name, message, guidance) {
    super(message);
    this.name = name;
    this.guidance = guidance;
    this.userFriendly = true;
  }
}

/**
 * Request microphone access with proper error handling
 * @param {MediaStreamConstraints} constraints - Audio constraints
 * @returns {Promise<MediaStream>} - Audio stream
 * @throws {MicrophoneError} - User-friendly error with guidance
 */
export async function requestMicrophoneAccess(constraints = { audio: true }) {
  // Check if getUserMedia is supported
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new MicrophoneError(
      'NotSupportedError',
      'Your browser does not support microphone access',
      'Please use a modern browser like Chrome, Firefox, or Edge.'
    );
  }

  try {
    console.log('[Microphone] Requesting access...');
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    console.log('[Microphone] Access granted');
    return stream;
  } catch (error) {
    console.error('[Microphone] Access error:', error.name, error.message);

    // Handle specific error types
    switch (error.name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        throw new MicrophoneError(
          'NotAllowedError',
          'Microphone permission denied',
          'Please allow microphone access in your browser settings and refresh the page. Click the lock icon in the address bar to manage permissions.'
        );

      case 'NotFoundError':
      case 'DevicesNotFoundError':
        throw new MicrophoneError(
          'NotFoundError',
          'No microphone found',
          'Please connect a microphone to your device and try again. Make sure your microphone is properly connected and recognized by your operating system.'
        );

      case 'NotReadableError':
      case 'TrackStartError':
        throw new MicrophoneError(
          'NotReadableError',
          'Microphone is already in use',
          'Your microphone is being used by another application. Please close other apps that might be using the microphone (Zoom, Skype, etc.) and try again.'
        );

      case 'OverconstrainedError':
      case 'ConstraintNotSatisfiedError':
        throw new MicrophoneError(
          'OverconstrainedError',
          'Microphone constraints not supported',
          'Your microphone does not support the required audio settings. Try using a different microphone or contact support.'
        );

      case 'TypeError':
        throw new MicrophoneError(
          'TypeError',
          'Invalid microphone settings',
          'There was an error with the microphone configuration. Please try again or contact support.'
        );

      case 'AbortError':
        throw new MicrophoneError(
          'AbortError',
          'Microphone access aborted',
          'The microphone access request was cancelled. Please try again.'
        );

      default:
        throw new MicrophoneError(
          'UnknownError',
          `Microphone error: ${error.message}`,
          'An unexpected error occurred. Please refresh the page and try again. If the problem persists, check your browser settings or try a different browser.'
        );
    }
  }
}

/**
 * Stop all tracks in a media stream
 * @param {MediaStream} stream - Stream to stop
 */
export function stopMediaStream(stream) {
  if (stream) {
    stream.getTracks().forEach(track => {
      track.stop();
      console.log('[Microphone] Track stopped:', track.kind);
    });
  }
}

/**
 * Check if microphone is available without requesting permission
 * @returns {Promise<boolean>} - True if microphone is available
 */
export async function checkMicrophoneAvailability() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const hasAudioInput = devices.some(device => device.kind === 'audioinput');
    console.log('[Microphone] Audio input devices found:', hasAudioInput);
    return hasAudioInput;
  } catch (error) {
    console.error('[Microphone] Could not enumerate devices:', error);
    return false;
  }
}
