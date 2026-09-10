// Form validation utilities

export const validators = {
  // Email validation
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Password validation (min 8 chars, 1 uppercase, 1 lowercase, 1 number)
  password: (password) => {
    if (password.length < 8) {
      return { valid: false, message: 'Password must be at least 8 characters' };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, message: 'Password must contain an uppercase letter' };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, message: 'Password must contain a lowercase letter' };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, message: 'Password must contain a number' };
    }
    return { valid: true, message: '' };
  },

  // Check if passwords match
  passwordMatch: (password, confirmPassword) => {
    return password === confirmPassword;
  },

  // Required field validation
  required: (value) => {
    return value && value.trim() !== '';
  },

  // Name validation (min 2 chars)
  name: (name) => {
    return name && name.trim().length >= 2;
  },
};
