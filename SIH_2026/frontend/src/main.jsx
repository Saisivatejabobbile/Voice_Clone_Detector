import { Buffer } from 'buffer';

// Ensure global, Buffer, and process are available globally for simple-peer and WebRTC
window.global = window;
window.Buffer = window.Buffer || Buffer;
if (!window.process) {
  window.process = { env: { DEBUG: undefined } };
}
if (!window.process.nextTick) {
  window.process.nextTick = (fn, ...args) => queueMicrotask(() => fn(...args));
}

import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <App />
);