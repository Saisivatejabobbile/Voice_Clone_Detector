import { Link } from 'react-router-dom';
import { SimpleLayout } from '../components/layout/Layout';
import Logo from '../components/layout/Logo';
import Button from '../components/common/Button';
import ThemeToggle from '../components/common/ThemeToggle';
import { ROUTES } from '../constants';
import { 
  ShieldCheckIcon, 
  LockIcon, 
  ZapIcon, 
  PhoneIcon, 
  CheckCircleIcon,
  ActivityIcon,
  ServerIcon,
  FileCheckIcon
} from 'lucide-react';

// Enterprise Cybersecurity Landing Page
export default function LandingPage() {
  const pillars = [
    {
      icon: <ShieldCheckIcon className="w-6 h-6 text-[#0B1F3A] dark:text-[#00C2FF]" />,
      title: 'Real-Time Neural Detection',
      description: 'Transient neural models analyze acoustic and prosodic features concurrently to identify cloned or synthetic voices within sub-100ms latency windows.',
    },
    {
      icon: <LockIcon className="w-6 h-6 text-[#0B1F3A] dark:text-[#00C2FF]" />,
      title: 'Zero-Retention Architecture',
      description: 'Engineered for strict institutional compliance. Real-time audio streams are processed in ephemeral memory and immediately discarded without persistence.',
    },
    {
      icon: <ZapIcon className="w-6 h-6 text-[#0B1F3A] dark:text-[#00C2FF]" />,
      title: 'Precision Fraud Prevention',
      description: 'Continuous risk scoring during high-value phone transactions prevents CEO fraud, authorization hijacking, and sophisticated voice impersonation attacks.',
    },
  ];

  const enterpriseStats = [
    { value: '99.8%', label: 'Detection Accuracy', sub: 'Validated against state-of-the-art TTS/VC models' },
    { value: '< 85ms', label: 'Processing Latency', sub: 'Near-zero perceptible communication delay' },
    { value: '100%', label: 'Zero Retention', sub: 'No raw audio logging or storage' },
    { value: 'Enterprise', label: 'Banking Grade', sub: 'Ready for high-security telecommunications' },
  ];

  const complianceBadges = [
    'SOC-2 Compliant Architecture',
    'Transient In-Memory Analysis',
    'End-to-End Encrypted WebRTC',
    'FIPS 140-2 Compatible',
  ];

  return (
    <SimpleLayout>
      {/* Top Enterprise Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B1F3A] border-b border-[#123C69] text-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-18">
            <Logo className="[&_span.text-\[\#0B1F3A\]]:text-white [&_span.text-\[\#123C69\]]:text-[#00C2FF]" />
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to={ROUTES.LOGIN}>
                <button className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white hover:bg-[#123C69]/60 rounded-lg transition-colors">
                  Operator Login
                </button>
              </Link>
              <Link to={ROUTES.SIGN_UP}>
                <button className="px-4 py-2 text-sm font-bold bg-[#00C2FF] text-[#0B1F3A] hover:bg-[#00AEE6] rounded-lg transition-colors shadow-sm">
                  Request Access
                </button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gradient-to-b from-[#F5F8FC] via-white to-[#F5F8FC] dark:from-[#070E1A] dark:via-[#0B1524] dark:to-[#070E1A] border-b border-[#E2E8F0] dark:border-[#1E3A5F] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Strategic Value Proposition */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0B1F3A]/5 dark:bg-[#00C2FF]/10 border border-[#0B1F3A]/15 dark:border-[#00C2FF]/30 text-xs font-semibold text-[#0B1F3A] dark:text-[#38BDF8]">
                <span className="w-2 h-2 rounded-full bg-[#00C2FF] animate-pulse" />
                <span>Next-Generation Voice Fraud Prevention</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#0B1F3A] dark:text-white tracking-tight leading-[1.15]">
                Real-Time Defense Against <span className="text-[#123C69] dark:text-[#00C2FF]">AI Voice Cloning</span> & Impersonation
              </h1>

              <p className="text-lg text-[#64748B] dark:text-[#94A3B8] leading-relaxed max-w-2xl">
                VoiceShield delivers an authoritative cybersecurity layer for mission-critical voice calls. Inspect and intercept synthetic speech, deepfake audio, and authorization fraud in real time.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link to={ROUTES.SIGN_UP}>
                  <Button variant="primary" size="lg" className="w-full sm:w-auto px-7 py-3.5 shadow-md">
                    <PhoneIcon className="w-4 h-4 mr-2" />
                    Launch VoiceShield Console
                  </Button>
                </Link>
                <Link to={ROUTES.ABOUT}>
                  <Button variant="secondary" size="lg" className="w-full sm:w-auto px-6 py-3.5">
                    Technical Specifications →
                  </Button>
                </Link>
              </div>

              {/* Compliance Badges Pill Row */}
              <div className="pt-4 flex flex-wrap items-center gap-2 text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                {complianceBadges.map((badge, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] shadow-2xs">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-[#10B981]" />
                    {badge}
                  </span>
                ))}
              </div>
            </div>

            {/* Right Column: Live Telemetry Preview Card (Enterprise Mock) */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-2xl shadow-xl p-6 relative overflow-hidden transition-colors">
                {/* Status Bar */}
                <div className="flex items-center justify-between pb-4 border-b border-[#F1F5F9] dark:border-[#1E3A5F] mb-5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] dark:text-white">
                      Live Call Verification
                    </span>
                  </div>
                  <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-[#12233C] text-[#0B1F3A] dark:text-slate-200">
                    SEC-ACTIVE: 02:47
                  </span>
                </div>

                {/* Score Widget */}
                <div className="bg-slate-50 dark:bg-[#0B1524] border border-slate-200 dark:border-[#1E3A5F] rounded-xl p-5 mb-5 text-center transition-colors">
                  <div className="text-[11px] font-bold uppercase tracking-widest text-[#64748B] dark:text-[#94A3B8] mb-1">
                    Synthetic Impersonation Probability
                  </div>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="font-mono text-4xl font-bold text-[#10B981]">04.2</span>
                    <span className="text-lg font-mono text-[#64748B] dark:text-[#94A3B8]">%</span>
                  </div>
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-bold text-emerald-800 dark:text-emerald-300 mt-2">
                    <CheckCircleIcon className="w-3.5 h-3.5 text-[#10B981]" />
                    AUTHENTIC HUMAN SPEECH
                  </div>
                </div>

                {/* Waveform Visualization */}
                <div className="space-y-2 mb-5">
                  <div className="flex justify-between text-xs text-[#64748B] dark:text-[#94A3B8] font-mono">
                    <span>16kHz PCM SPECTRAL FLOW</span>
                    <span className="text-[#00C2FF] font-bold">LIVE TELEMETRY</span>
                  </div>
                  <div className="flex items-end justify-center gap-1 h-14 bg-slate-50 dark:bg-[#0B1524] border border-slate-200 dark:border-[#1E3A5F] rounded-lg p-1.5 transition-colors">
                    {[18, 32, 54, 76, 45, 23, 89, 65, 43, 72, 85, 34, 60, 48, 25, 68, 52, 38, 70, 42].map((h, i) => (
                      <div 
                        key={i} 
                        className="flex-1 bg-[#00C2FF] rounded-t-[1px]" 
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Metric Checkpoints */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-[#0B1524] border border-slate-100 dark:border-[#1E3A5F] rounded-lg">
                    <div className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#94A3B8]">Acoustic Jitter</div>
                    <div className="font-mono font-bold text-[#0B1F3A] dark:text-slate-200 mt-0.5">0.018 ms (Norm)</div>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-[#0B1524] border border-slate-100 dark:border-[#1E3A5F] rounded-lg">
                    <div className="text-[10px] uppercase font-bold text-[#64748B] dark:text-[#94A3B8]">Prosody Naturalness</div>
                    <div className="font-mono font-bold text-[#10B981] mt-0.5">99.1% Human</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Metrics Section */}
      <section className="py-16 bg-white dark:bg-[#0B1524] border-b border-[#E2E8F0] dark:border-[#1E3A5F] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {enterpriseStats.map((item, idx) => (
              <div key={idx} className="p-6 bg-slate-50 dark:bg-[#0F1D32] border border-slate-200/80 dark:border-[#1E3A5F] rounded-xl text-left transition-colors">
                <div className="font-mono text-3xl font-bold text-[#0B1F3A] dark:text-[#00C2FF] mb-1 tracking-tight">
                  {item.value}
                </div>
                <div className="text-sm font-bold text-[#0B1F3A] dark:text-white mb-1">{item.label}</div>
                <div className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{item.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-20 bg-[#F5F8FC] dark:bg-[#070E1A] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#123C69] dark:text-[#00C2FF] mb-2">
              Enterprise Defense Architecture
            </h2>
            <h3 className="text-3xl font-bold text-[#0B1F3A] dark:text-white tracking-tight">
              Engineered to Thwart State-of-the-Art Voice Synthesis
            </h3>
            <p className="text-sm text-[#64748B] dark:text-[#94A3B8] mt-3 leading-relaxed">
              Designed specifically for financial institutions, telecom infrastructures, and executive communication security where voice authenticity is a critical fraud frontier.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pillars.map((pillar, idx) => (
              <div key={idx} className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-8 shadow-sm hover:border-[#CBD5E1] dark:hover:border-[#00C2FF]/60 transition-all text-left">
                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-[#12233C] border border-slate-200 dark:border-[#1E3A5F] flex items-center justify-center mb-5 shadow-xs">
                  {pillar.icon}
                </div>
                <h4 className="text-lg font-bold text-[#0B1F3A] dark:text-white mb-2">{pillar.title}</h4>
                <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security Callout Banner */}
      <section className="py-16 bg-[#0B1F3A] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#123C69] text-xs font-semibold text-[#00C2FF]">
            <ServerIcon className="w-3.5 h-3.5" />
            <span>INSTITUTIONAL INTEGRATION</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Protect High-Value Conversations Against Synthetic Voice Impersonation
          </h2>
          <p className="text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Deploy real-time WebRTC voice integrity monitoring with seamless operator controls and forensic audit logs.
          </p>
          <div className="pt-2">
            <Link to={ROUTES.SIGN_UP}>
              <button className="px-8 py-3.5 font-bold text-sm bg-[#00C2FF] text-[#0B1F3A] hover:bg-[#00AEE6] rounded-lg transition-colors shadow-md">
                Get Started with VoiceShield
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Enterprise Footer */}
      <footer className="bg-white dark:bg-[#0B1524] border-t border-[#E2E8F0] dark:border-[#1E3A5F] py-12 text-[#64748B] dark:text-[#94A3B8] text-xs transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          <p>© {new Date().getFullYear()} VoiceShield Systems. Real-Time AI Impersonation Detection. All rights reserved.</p>
          <div className="flex items-center gap-6 font-medium text-[#0F172A] dark:text-slate-200">
            <Link to={ROUTES.ABOUT} className="hover:text-[#00C2FF] transition-colors">About & Architecture</Link>
            <Link to={ROUTES.SETTINGS} className="hover:text-[#00C2FF] transition-colors">Security Standards</Link>
            <Link to={ROUTES.LOGIN} className="hover:text-[#00C2FF] transition-colors">Portal Login</Link>
          </div>
        </div>
      </footer>
    </SimpleLayout>
  );
}