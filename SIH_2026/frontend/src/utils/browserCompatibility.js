/**
 * Browser Compatibility Checker
 * 
 * Checks browser support for WebRTC features
 * Requirements: 9.6
 */

export class BrowserCompatibilityError extends Error {
  constructor(feature, suggestions) {
    super(`Browser does not support ${feature}`);
    this.name = 'BrowserCompatibilityError';
    this.feature = feature;
    this.suggestions = suggestions;
  }
}

/**
 * Check if browser supports required WebRTC features
 * @returns {Object} - Compatibility result with details
 */
export function checkBrowserCompatibility() {
  const results = {
    isCompatible: true,
    missingFeatures: [],
    warnings: [],
    browser: detectBrowser(),
  };

  // Check for navigator.mediaDevices support
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    results.isCompatible = false;
    results.missingFeatures.push({
      name: 'getUserMedia',
      description: 'Microphone access is not supported',
      critical: true,
    });
  }

  // Check for RTCPeerConnection support
  if (!window.RTCPeerConnection) {
    results.isCompatible = false;
    results.missingFeatures.push({
      name: 'RTCPeerConnection',
      description: 'WebRTC peer connections are not supported',
      critical: true,
    });
  }

  // Check for AudioWorklet support (optional, fallback to ScriptProcessor)
  if (!window.AudioWorklet && !window.AudioContext) {
    results.warnings.push({
      name: 'AudioWorklet',
      description: 'Audio processing may have reduced performance',
      critical: false,
    });
  }

  // Check for WebSocket support
  if (!window.WebSocket) {
    results.isCompatible = false;
    results.missingFeatures.push({
      name: 'WebSocket',
      description: 'Real-time communication is not supported',
      critical: true,
    });
  }

  // Check for Promise support
  if (!window.Promise) {
    results.isCompatible = false;
    results.missingFeatures.push({
      name: 'Promise',
      description: 'Modern JavaScript features are not supported',
      critical: true,
    });
  }

  return results;
}

/**
 * Detect browser name and version
 * @returns {Object} - Browser info
 */
export function detectBrowser() {
  const ua = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = '';
  let isSupported = false;

  if (ua.includes('Chrome') && !ua.includes('Edg')) {
    browserName = 'Chrome';
    browserVersion = ua.match(/Chrome\/(\d+)/)?.[1] || '';
    isSupported = parseInt(browserVersion) >= 74; // Chrome 74+ recommended
  } else if (ua.includes('Edg')) {
    browserName = 'Edge';
    browserVersion = ua.match(/Edg\/(\d+)/)?.[1] || '';
    isSupported = parseInt(browserVersion) >= 79; // Edge 79+ (Chromium-based)
  } else if (ua.includes('Firefox')) {
    browserName = 'Firefox';
    browserVersion = ua.match(/Firefox\/(\d+)/)?.[1] || '';
    isSupported = parseInt(browserVersion) >= 76; // Firefox 76+ recommended
  } else if (ua.includes('Safari') && !ua.includes('Chrome')) {
    browserName = 'Safari';
    browserVersion = ua.match(/Version\/(\d+)/)?.[1] || '';
    isSupported = parseInt(browserVersion) >= 14; // Safari 14+ recommended
  } else if (ua.includes('Opera') || ua.includes('OPR')) {
    browserName = 'Opera';
    browserVersion = ua.match(/(?:Opera|OPR)\/(\d+)/)?.[1] || '';
    isSupported = parseInt(browserVersion) >= 60;
  }

  return {
    name: browserName,
    version: browserVersion,
    isSupported,
    userAgent: ua,
  };
}

/**
 * Get recommended browsers message
 * @returns {string} - Formatted message with browser recommendations
 */
export function getRecommendedBrowsersMessage() {
  return `For the best experience, please use one of these browsers:
  
• Google Chrome (version 74 or later)
• Microsoft Edge (version 79 or later)
• Mozilla Firefox (version 76 or later)
• Safari (version 14 or later)

These browsers provide full support for WebRTC voice calling and real-time analysis.`;
}

/**
 * Display compatibility error to user
 * @param {Object} compatibilityResults - Results from checkBrowserCompatibility
 * @returns {string} - Formatted error message
 */
export function formatCompatibilityError(compatibilityResults) {
  const { missingFeatures, browser } = compatibilityResults;
  
  let message = `Your browser (${browser.name}`;
  if (browser.version) {
    message += ` ${browser.version}`;
  }
  message += ') does not support all required features:\n\n';

  missingFeatures.forEach(feature => {
    message += `• ${feature.name}: ${feature.description}\n`;
  });

  message += '\n' + getRecommendedBrowsersMessage();

  return message;
}

/**
 * Check compatibility and throw error if unsupported
 * @throws {BrowserCompatibilityError} - If browser is not compatible
 */
export function ensureBrowserCompatibility() {
  const results = checkBrowserCompatibility();
  
  if (!results.isCompatible) {
    const message = formatCompatibilityError(results);
    throw new BrowserCompatibilityError(
      results.missingFeatures.map(f => f.name).join(', '),
      getRecommendedBrowsersMessage()
    );
  }

  // Log warnings for non-critical features
  if (results.warnings.length > 0) {
    console.warn('[Compatibility] Browser warnings:', results.warnings);
  }

  console.log('[Compatibility] Browser check passed:', results.browser);
  return results;
}

/**
 * Check if specific feature is supported
 * @param {string} feature - Feature name to check
 * @returns {boolean} - True if supported
 */
export function isFeatureSupported(feature) {
  switch (feature) {
    case 'getUserMedia':
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    case 'RTCPeerConnection':
      return !!window.RTCPeerConnection;
    case 'AudioWorklet':
      return !!window.AudioWorklet;
    case 'WebSocket':
      return !!window.WebSocket;
    case 'Promise':
      return !!window.Promise;
    default:
      return false;
  }
}
