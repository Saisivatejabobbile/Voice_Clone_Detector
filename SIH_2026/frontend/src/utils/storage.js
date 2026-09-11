// Local Storage Utilities with SessionStorage Tab Isolation
// Allows two tabs to log in as different users for testing without clobbering each other
// IMPORTANT: Never store audio data in localStorage!

export const storage = {
  // Get item from sessionStorage first (tab-isolated), fallback to localStorage
  get: (key) => {
    try {
      const item = sessionStorage.getItem(key) || localStorage.getItem(key);
      if (!item) return null;
      
      // Try to parse as JSON, if it fails, return as string
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  },

  // Set item in both sessionStorage (tab-isolated) and localStorage (global)
  set: (key, value) => {
    try {
      const valStr = typeof value === 'string' && (value.startsWith('eyJ') || value.startsWith('ey'))
        ? value
        : JSON.stringify(value);
      sessionStorage.setItem(key, valStr);
      localStorage.setItem(key, valStr);
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  },

  // Remove item from both storages
  remove: (key) => {
    try {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from storage:', error);
    }
  },

  // Clear storage
  clear: () => {
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};
