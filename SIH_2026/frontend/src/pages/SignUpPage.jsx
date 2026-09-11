import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SimpleLayout } from '../components/layout/Layout';
import Logo from '../components/layout/Logo';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ThemeToggle from '../components/common/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants';
import { validators } from '../utils/validators';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

// Enterprise Registration Sign Up Page
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
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!validators.required(formData.fullName)) {
      newErrors.fullName = 'Full legal name is required';
    }

    if (!validators.required(formData.email)) {
      newErrors.email = 'Corporate email address is required';
    } else if (!validators.email(formData.email)) {
      newErrors.email = 'Invalid corporate email address';
    }

    if (!validators.required(formData.password)) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Password confirmation does not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the institutional security guidelines';
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
      <div className="min-h-screen bg-[#F5F8FC] dark:bg-[#070E1A] flex flex-col items-center justify-center px-4 py-12 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle />
        </div>

        <div className="mb-8">
          <Logo size="lg" />
        </div>

        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl shadow-sm p-8 text-[#0F172A] dark:text-[#F1F5F9]">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-[#0B1F3A] dark:text-[#F1F5F9] tracking-tight">
                Create Operator Account
              </h1>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                Register authorized credentials to access voice integrity monitoring
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Legal Name"
                type="text"
                name="fullName"
                placeholder="Dr. Jordan Hayes"
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
              />

              <Input
                label="Corporate Email"
                type="email"
                name="email"
                placeholder="hayes@enterprise.corp"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />

              <div className="relative">
                <Input
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  helper="Minimum 8 characters with letters, numbers, and symbols"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-8 text-[#94A3B8] hover:text-[#0B1F3A] dark:hover:text-[#00C2FF] transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirm Password"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-8 text-[#94A3B8] hover:text-[#0B1F3A] dark:hover:text-[#00C2FF] transition-colors cursor-pointer"
                >
                  {showConfirmPassword ? (
                    <EyeOffIcon className="w-4 h-4" />
                  ) : (
                    <EyeIcon className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Compliance Agreement */}
              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-[#64748B] dark:text-[#94A3B8]">
                  <input
                    type="checkbox"
                    name="agreeToTerms"
                    checked={formData.agreeToTerms}
                    onChange={handleChange}
                    className="mt-0.5 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1524] text-[#0B1F3A] dark:text-[#00C2FF] focus:ring-[#00C2FF]"
                  />
                  <span>
                    I accept the{' '}
                    <Link to="/terms" className="text-[#008BB8] dark:text-[#00C2FF] hover:underline font-semibold">
                      Enterprise Terms of Service
                    </Link>{' '}
                    and zero-retention privacy protocols.
                  </span>
                </label>
                {errors.agreeToTerms && (
                  <p className="mt-1 text-xs text-[#EF4444] font-medium">{errors.agreeToTerms}</p>
                )}
              </div>

              {errors.submit && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-lg text-rose-800 dark:text-rose-300 text-xs font-semibold">
                  {errors.submit}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full py-2.5 mt-2"
                disabled={isLoading}
              >
                {isLoading ? 'Registering...' : 'Complete Registration'}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-[#F1F5F9] dark:border-[#1E3A5F] text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
              Already registered?{' '}
              <Link to={ROUTES.LOGIN} className="text-[#008BB8] dark:text-[#00C2FF] hover:underline font-bold">
                Operator Sign In
              </Link>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Link to={ROUTES.LANDING} className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hover:text-[#0B1F3A] dark:hover:text-[#00C2FF] transition-colors">
              ← Return to Main Portal
            </Link>
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
}