import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { SimpleLayout } from '../components/layout/Layout';
import Logo from '../components/layout/Logo';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import ThemeToggle from '../components/common/ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../constants';
import { validators } from '../utils/validators';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

// Enterprise Authentication Login Page
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

  const successMessage = location.state?.message;

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

    if (!validators.required(formData.email)) {
      newErrors.email = 'Corporate email address is required';
    } else if (!validators.email(formData.email)) {
      newErrors.email = 'Invalid corporate email address';
    }

    if (!validators.required(formData.password)) {
      newErrors.password = 'Authentication password is required';
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
        navigate(ROUTES.DASHBOARD);
      } else {
        setErrors({ submit: result.error || 'Authentication rejected. Please check credentials.' });
      }
    } catch (error) {
      setErrors({ submit: error.message || 'An unexpected authentication error occurred.' });
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

        {/* Brand Header */}
        <div className="mb-8">
          <Logo size="lg" />
        </div>

        {/* Enterprise Login Card */}
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl shadow-sm p-8 text-[#0F172A] dark:text-[#F1F5F9]">
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-[#0B1F3A] dark:text-[#F1F5F9] tracking-tight">
                Operator Sign In
              </h1>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                Access the VoiceShield real-time voice integrity security console
              </p>
            </div>

            {/* Success Notice */}
            {successMessage && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                {successMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Corporate Email"
                type="email"
                name="email"
                placeholder="operator@enterprise.corp"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
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
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  }
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

              {/* Remember & Assistance */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#64748B] dark:text-[#94A3B8]">
                  <input
                    type="checkbox"
                    name="rememberMe"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B1524] text-[#0B1F3A] dark:text-[#00C2FF] focus:ring-[#00C2FF]"
                  />
                  <span>Persist session token</span>
                </label>
                <Link to="/forgot-password" className="text-[#008BB8] dark:text-[#00C2FF] hover:underline font-semibold">
                  Forgot Password?
                </Link>
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
                {isLoading ? 'Authenticating...' : 'Sign In to Console'}
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-[#F1F5F9] dark:border-[#1E3A5F] text-center text-xs text-[#64748B] dark:text-[#94A3B8]">
              Need operator credentials?{' '}
              <Link to={ROUTES.SIGN_UP} className="text-[#008BB8] dark:text-[#00C2FF] hover:underline font-bold">
                Register New Account
              </Link>
            </div>
          </div>

          {/* Back Link */}
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