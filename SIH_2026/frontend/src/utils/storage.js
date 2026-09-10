// Local Storage Utilities
// IMPORTANT: Never store audio data in localStorage!

export const storage = {
  // Get item from localStorage
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      
      // Try to parse as JSON, if it fails, return as string
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },

  // Set item in localStorage
  set: (key, value) => {
    try {
      // If value is a string and looks like a token (starts with ey), store it directly
      if (typeof value === 'string' && (value.startsWith('eyJ') || value.startsWith('ey'))) {
        localStorage.setItem(key, value);
      } else {
        // Otherwise, JSON stringify it
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },

  // Remove item from localStorage
  remove: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },

  // Clear all localStorage
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};
