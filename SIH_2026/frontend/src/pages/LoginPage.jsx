import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { SimpleLayout } from '../components/layout/Layout';
import Logo from '../components/layout/Logo';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants';
import { validators } from '../utils/validators';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Success message from registration
  const successMessage = location.state?.message;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!validators.required(formData.email)) {
      newErrors.email = 'Email is required';
    } else if (!validators.email(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!validators.required(formData.password)) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Redirect to dashboard
        navigate(ROUTES.DASHBOARD);
      } else {
        setErrors({ submit: result.error || 'Login failed. Please try again.' });
      }
    } catch (error) {
      setErrors({ submit: error.message || 'An unexpected error occurred.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SimpleLayout>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Logo */}
        <div className="mb-8">
          <Logo size="lg" />
        </div>

        {/* Login Form */}
        <div className="w-full max-w-md">
          <div className="card p-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-400 mb-6">
              Login to your VoiceShield account
            </p>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-4 p-3 bg-success-dark/20 border border-success rounded-lg">
                <p className="text-sm text-success-light">{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  icon={
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-gray-400">
                    Remember me
                  </label>
                </div>
                <Link to="/forgot-password" className="text-sm text-primary-400 hover:text-primary-300">
                  Forgot Password?
                </Link>
              </div>

              {errors.submit && (
                <div className="p-3 bg-danger-dark/20 border border-danger rounded-lg">
                  <p className="text-sm text-danger">{errors.submit}</p>
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dark-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-dark-900 text-gray-400">Or continue with</span>
                </div>
              </div>

              <div className="mt-4">
                <Button variant="secondary" className="w-full" disabled>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Sign in with Google
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Don't have an account?{' '}
                <Link to={ROUTES.SIGN_UP} className="text-primary-400 hover:text-primary-300 font-medium">
                  Sign Up
                </Link>
              </p>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-4 text-center">
            <Link to={ROUTES.LANDING} className="text-gray-400 hover:text-white text-sm">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
}