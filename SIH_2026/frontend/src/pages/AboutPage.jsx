import { useNavigate } from 'react-router-dom';
import { SimpleLayout } from '../components/layout/Layout';
import Logo from '../components/layout/Logo';
import Button from '../components/common/Button';
import ThemeToggle from '../components/common/ThemeToggle';
import { ROUTES } from '../constants';
import { 
  ShieldIcon, 
  LockIcon, 
  MaskIcon, 
  BrainIcon,
  CheckCircleIcon,
  InfoIcon,
  PhoneIcon
} from '../utils/icons';

// Enterprise About & System Architecture Page
export default function AboutPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: <BrainIcon className="w-6 h-6 text-[#0B1F3A] dark:text-[#00C2FF]" />,
      title: 'Real-Time Neural Detection',
      description: 'Advanced machine learning models analyze voice acoustic anomalies in real time during active WebRTC calls.',
    },
    {
      icon: <LockIcon className="w-6 h-6 text-[#0B1F3A] dark:text-[#00C2FF]" />,
      title: 'Zero-Retention Architecture',
      description: 'Zero audio persistence. Transient in-memory processing guarantees complete privacy and institutional regulatory compliance.',
    },
    {
      icon: <ShieldIcon className="w-6 h-6 text-[#0B1F3A] dark:text-[#00C2FF]" />,
      title: 'Real-Time Risk Scoring',
      description: 'Live 0–100% Impersonation Risk index with instant recommendations (Safe, Suspicious, High Risk, Critical).',
    },
    {
      icon: <MaskIcon className="w-6 h-6 text-[#0B1F3A] dark:text-[#00C2FF]" />,
      title: 'Multi-Modal Forensic Breakdown',
      description: 'Inspect acoustic jitter, prosodic variation, and spectral consistency metrics directly in your operational console.',
    },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Signal Ingestion',
      description: 'WebRTC establishes an end-to-end encrypted voice session with authorized contacts.',
      icon: <PhoneIcon className="w-5 h-5 text-[#0B1F3A] dark:text-[#00C2FF]" />,
    },
    {
      step: '02',
      title: 'AudioWorklet Framing',
      description: 'AudioWorklet captures 16kHz raw PCM buffers in ephemeral memory on the receiver client.',
      icon: <BrainIcon className="w-5 h-5 text-[#00C2FF]" />,
    },
    {
      step: '03',
      title: 'Neural Inference',
      description: 'WebSocket streams feed acoustic and prosodic models to detect synthetic synthesis artifacts.',
      icon: <ShieldIcon className="w-5 h-5 text-[#0B1F3A] dark:text-[#00C2FF]" />,
    },
    {
      step: '04',
      title: 'Live Risk Scoring',
      description: 'Actionable impersonation telemetry is broadcast back to the operator console with sub-100ms latency.',
      icon: <CheckCircleIcon className="w-5 h-5 text-[#10B981]" />,
    },
  ];

  const faq = [
    {
      question: 'What is VoiceShield?',
      answer: 'VoiceShield is an institutional-grade, real-time voice integrity security layer designed to detect AI-generated and cloned voice impersonation attacks during live voice communications.',
    },
    {
      question: 'How does real-time voice analysis work?',
      answer: 'VoiceShield captures transient audio chunks via an AudioWorklet pipeline on the receiver side. These frames are analyzed using neural network feature extractors that evaluate acoustic micro-tremors, prosodic pitch flow, and synthetic synthesis boundaries.',
    },
    {
      question: 'Is raw audio or voice data ever stored?',
      answer: 'No. VoiceShield enforces a strict Zero-Retention policy. Audio processing occurs strictly in transient memory buffers and is wiped immediately after inference. No audio recordings, transcripts, or biometric fingerprints are ever saved to disk or cloud databases.',
    },
    {
      question: 'What do the risk score thresholds mean?',
      answer: '0–30% (SAFE): Human speech verified. 31–60% (SUSPICIOUS): Elevated synthetic acoustic variance; proceed with caution. 61–80% (HIGH RISK): High confidence of synthetic speech. 81–100% (CRITICAL): Strong automated synthesis indicators; recommend secondary out-of-band verification.',
    },
    {
      question: 'Why does only the receiver analyze audio?',
      answer: 'To protect operational privacy and prevent self-analysis feedback loops, analysis is conducted strictly on the incoming remote speech stream of the party you are communicating with.',
    },
  ];

  return (
    <SimpleLayout>
      {/* Hero Header */}
      <div className="bg-[#0B1F3A] dark:bg-[#0A1628] border-b border-[#123C69] dark:border-[#1E3A5F] text-white py-16 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex justify-center mb-2">
            <Logo size="lg" className="[&_span.text-\[\#0B1F3A\]]:text-white [&_span.text-\[\#123C69\]]:text-[#00C2FF]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            System Architecture & Documentation
          </h1>
          <p className="text-sm text-slate-300 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Enterprise defense framework for detecting synthetic voice cloning and audio impersonation in high-stakes voice communication.
          </p>
          <div className="pt-2">
            <Button
              variant="ai"
              size="sm"
              onClick={() => navigate(ROUTES.DASHBOARD)}
              className="px-5 py-2 text-xs"
            >
              ← Return to Security Console
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Mission Statement */}
        <div className="max-w-3xl mx-auto text-center space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#123C69] dark:text-[#38BDF8]">Core Objective</h2>
          <h3 className="text-2xl font-bold text-[#0B1F3A] dark:text-[#F1F5F9] tracking-tight">
            Safeguarding Critical Voice Channels
          </h3>
          <p className="text-sm text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            As generative voice synthesis algorithms grow more deceptive, VoiceShield provides an automated, objective defense layer ensuring financial institutions, enterprises, and telecom operators can verify voice authenticity in real time.
          </p>
        </div>

        {/* Key Features Grid */}
        <div>
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-[#0B1F3A] dark:text-[#F1F5F9]">Platform Capabilities</h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">Multi-layered defensive architecture for real-time inspection</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-6 shadow-sm hover:border-[#CBD5E1] dark:hover:border-[#00C2FF]/60 transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-slate-50 dark:bg-[#0B1524] border border-slate-200 dark:border-[#1E3A5F] rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-[#0B1F3A] dark:text-[#F1F5F9] mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works - 4 Stage Pipeline */}
        <div>
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-[#0B1F3A] dark:text-[#F1F5F9]">Execution Pipeline</h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">From raw encrypted packet to live risk telemetry</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {howItWorks.map((item, index) => (
              <div key={index} className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-5 shadow-sm text-left">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-[#00C2FF] bg-[#00C2FF]/10 px-2 py-0.5 rounded border border-[#00C2FF]/20">
                    {item.step}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-[#0B1524] flex items-center justify-center">
                    {item.icon}
                  </div>
                </div>
                <h4 className="text-sm font-bold text-[#0B1F3A] dark:text-[#F1F5F9] mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Commitment Banner */}
        <div className="bg-white dark:bg-[#0F1D32] border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center justify-center text-[#10B981] flex-shrink-0 shadow-xs">
              <LockIcon className="w-7 h-7" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-[#0B1F3A] dark:text-[#F1F5F9]">
                Zero-Retention Privacy Guarantee
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                VoiceShield strictly adheres to transient data processing rules. We maintain zero recordings, zero transcripts, and zero cloud voice biometric storage.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                <div className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-300">
                  <span className="text-[#10B981] font-bold">✓</span> No Raw Audio Storage
                </div>
                <div className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-300">
                  <span className="text-[#10B981] font-bold">✓</span> Memory-Only Transient Inference
                </div>
                <div className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-300">
                  <span className="text-[#10B981] font-bold">✓</span> End-to-End Encrypted WebRTC
                </div>
                <div className="flex items-center gap-2 font-medium text-emerald-800 dark:text-emerald-300">
                  <span className="text-[#10B981] font-bold">✓</span> Receiver-Side Audio Isolation
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div>
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-[#0B1F3A] dark:text-[#F1F5F9]">Frequently Asked Questions</h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">Everything you need to know about VoiceShield</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faq.map((item, index) => (
              <div key={index} className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-5 shadow-xs text-left">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-md bg-[#0B1F3A]/5 dark:bg-[#00C2FF]/10 flex items-center justify-center text-[#0B1F3A] dark:text-[#00C2FF] flex-shrink-0 mt-0.5">
                    <InfoIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0B1F3A] dark:text-[#F1F5F9] mb-1">
                      {item.question}
                    </h4>
                    <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">{item.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Version Footer */}
        <div className="text-center pt-8 border-t border-[#E2E8F0] dark:border-[#1E3A5F]">
          <p className="text-xs font-mono text-[#64748B] dark:text-[#94A3B8]">VoiceShield Platform • Enterprise Build v2.4.0</p>
          <p className="text-[11px] text-[#94A3B8] dark:text-[#64748B] mt-1">Smart India Hackathon 2026 Innovation Track</p>
        </div>
      </div>
    </SimpleLayout>
  );
}
