import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SimpleLayout } from '../components/layout/Layout';
import Logo from '../components/layout/Logo';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants';
import { validators } from '../utils/validators';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    if (!validators.required(formData.fullName)) {
      newErrors.fullName = 'Full name is required';
    } else if (!validators.name(formData.fullName)) {
      newErrors.fullName = 'Name must be at least 2 characters';
    }

    if (!validators.required(formData.email)) {
      newErrors.email = 'Email is required';
    } else if (!validators.email(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    const passwordValidation = validators.password(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message;
    }

    if (!validators.passwordMatch(formData.password, formData.confirmPassword)) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and privacy policy';
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
      const result = await register(formData.email, formData.password, formData.fullName);
      
      if (result.success) {
        // Redirect to dashboard (user is auto-logged in after registration)
        navigate(ROUTES.DASHBOARD);
      } else {
        setErrors({ submit: result.error || 'Registration failed. Please try again.' });
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

        {/* Sign Up Form */}
        <div className="w-full max-w-md">
          <div className="card p-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              Create Your Account
            </h1>
            <p className="text-gray-400 mb-6">
              Join VoiceShield to secure your conversations
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                type="text"
                name="fullName"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
              />

              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="john@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
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
                  helper="At least 8 characters with uppercase, lowercase, and number"
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

              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-9 text-gray-400 hover:text-white transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="w-5 h-5" />
                  ) : (
                    <EyeIcon className="w-5 h-5" />
                  )}
                </button>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleChange}
                  className="mt-1 mr-2"
                />
                <label htmlFor="agreeToTerms" className="text-sm text-gray-400">
                  I agree to the{' '}
                  <Link to="/terms" className="text-primary-400 hover:text-primary-300">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary-400 hover:text-primary-300">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-danger">{errors.agreeToTerms}</p>
              )}

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
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <Link to={ROUTES.LOGIN} className="text-primary-400 hover:text-primary-300 font-medium">
                  Login
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