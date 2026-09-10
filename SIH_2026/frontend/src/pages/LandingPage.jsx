import { Link } from 'react-router-dom';
import { SimpleLayout } from '../components/layout/Layout';
import Logo from '../components/layout/Logo';
import Button from '../components/common/Button';
import { ROUTES } from '../constants';
import { ShieldCheckIcon, LockIcon, ZapIcon, PhoneIcon, AlertTriangleIcon, CheckCircleIcon } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: <ShieldCheckIcon className="w-12 h-12" />,
      title: 'Real-Time Detection',
      description: 'Advanced AI analyzes voice patterns instantly, detecting synthetic voices during live calls',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <LockIcon className="w-12 h-12" />,
      title: 'Privacy Protected',
      description: 'Zero audio retention. All processing happens in real-time with no data storage',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <ZapIcon className="w-12 h-12" />,
      title: 'Lightning Fast',
      description: 'Get instant risk assessments without any noticeable latency in your calls',
      color: 'from-amber-500 to-orange-500',
    },
  ];

  const stats = [
    { value: '99.8%', label: 'Detection Accuracy' },
    { value: '<100ms', label: 'Response Time' },
    { value: '100%', label: 'Privacy Guaranteed' },
  ];

  return (
    <SimpleLayout>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/80 backdrop-blur-xl border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              <Logo />
            </div>
            
            <div className="flex items-center gap-4">
              <Link to={ROUTES.LOGIN}>
                <Button variant="ghost" size="sm" className="hover:bg-dark-800">
                  Login
                </Button>
              </Link>
              <Link to={ROUTES.SIGN_UP}>
                <Button variant="primary" size="sm" className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-lg shadow-primary-600/50">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="relative overflow-hidden pt-32 pb-20">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-purple-900/10 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-600/20 via-transparent to-transparent" />
        
        {/* Floating orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600/10 border border-primary-600/20 rounded-full mb-8 backdrop-blur-sm">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
              <span className="text-primary-400 text-sm font-medium">AI-Powered Voice Security</span>
            </div>
            
            {/* Hero Title */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold mb-6 leading-tight">
              <span className="text-white">Safer </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 via-purple-400 to-pink-400 animate-gradient">
                Calls
              </span>
              <br />
              <span className="text-white">Smarter </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-primary-400 animate-gradient">
                Protection
              </span>
            </h1>
            
            {/* Hero Description */}
            <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              Detect AI-generated voices in real-time with cutting-edge machine learning.
              <br />
              <span className="text-primary-400">Stay protected from voice impersonation and fraud.</span>
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link to={ROUTES.SIGN_UP}>
                <Button 
                  variant="primary" 
                  size="lg" 
                  className="px-8 py-4 text-lg bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 shadow-2xl shadow-primary-600/50 transform hover:scale-105 transition-all duration-200"
                >
                  <PhoneIcon className="w-5 h-5 mr-2" />
                  Start Securing Calls
                </Button>
              </Link>
              <Link to={ROUTES.ABOUT}>
                <Button 
                  variant="secondary" 
                  size="lg" 
                  className="px-8 py-4 text-lg border-2 border-dark-700 hover:border-primary-600/50 backdrop-blur-sm"
                >
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-600/20 to-purple-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
                  <div className="relative bg-dark-800/50 backdrop-blur-sm border border-dark-700 rounded-2xl p-6 hover:border-primary-600/50 transition-all duration-300">
                    <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
                    <div className="text-gray-400">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Why Choose VoiceShield?
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Industry-leading voice security technology at your fingertips
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative"
            >
              {/* Glow effect */}
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-20 blur-xl transition-all duration-500 rounded-3xl`} />
              
              {/* Card */}
              <div className="relative bg-dark-800/50 backdrop-blur-sm border border-dark-700 group-hover:border-primary-600/50 rounded-3xl p-8 transition-all duration-300 hover:transform hover:scale-105">
                <div className={`inline-flex p-4 bg-gradient-to-r ${feature.color} rounded-2xl mb-6`}>
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Simple, secure, and seamless protection
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
          {/* Connection lines */}
          <div className="hidden md:block absolute top-12 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600" />
          
          {[
            {
              step: '01',
              title: 'Make a Call',
              description: 'Start a voice call through VoiceShield like you normally would',
              icon: <PhoneIcon className="w-8 h-8" />,
            },
            {
              step: '02',
              title: 'Real-Time Analysis',
              description: 'Our AI analyzes voice patterns instantly in the background',
              icon: <AlertTriangleIcon className="w-8 h-8" />,
            },
            {
              step: '03',
              title: 'Stay Protected',
              description: 'Get instant alerts if synthetic voice patterns are detected',
              icon: <CheckCircleIcon className="w-8 h-8" />,
            },
          ].map((step, index) => (
            <div key={index} className="relative text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-primary-600 to-purple-600 rounded-full mb-6 relative z-10 shadow-2xl shadow-primary-600/50">
                <div className="text-white">
                  {step.icon}
                </div>
              </div>
              <div className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600 mb-4">
                {step.step}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                {step.title}
              </h3>
              <p className="text-gray-400">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="relative bg-gradient-to-r from-primary-600 to-purple-600 rounded-3xl p-12 text-center overflow-hidden">
          {/* Pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_transparent_40%,_rgba(255,255,255,0.1)_100%)]" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Secure Your Calls?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Join thousands of users who trust VoiceShield to protect their conversations
            </p>
            <Link to={ROUTES.SIGN_UP}>
              <Button 
                variant="secondary" 
                size="lg" 
                className="px-12 py-4 text-lg bg-white text-primary-600 hover:bg-gray-100 shadow-2xl transform hover:scale-105 transition-all duration-200"
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-dark-800 mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start gap-4">
              <Logo />
              <span className="text-gray-400 text-sm">
                © 2026 VoiceShield. All rights reserved.
              </span>
            </div>
            <div className="flex gap-8">
              <Link to="/privacy" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                Terms of Service
              </Link>
              <Link to={ROUTES.ABOUT} className="text-gray-400 hover:text-primary-400 text-sm transition-colors">
                About Us
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </SimpleLayout>
  );
}