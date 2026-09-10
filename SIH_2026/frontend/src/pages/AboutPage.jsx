import { SimpleLayout } from '../components/layout/Layout';
import Logo from '../components/layout/Logo';
import { 
  ShieldIcon, 
  LockIcon, 
  MaskIcon, 
  BrainIcon,
  CheckCircleIcon,
  InfoIcon,
  PhoneIcon
} from '../utils/icons';

export default function AboutPage() {
  const features = [
    {
      icon: <BrainIcon className="w-8 h-8" />,
      title: 'Real-Time AI Detection',
      description: 'Advanced machine learning models analyze voice patterns in real-time to detect synthetic voices.',
    },
    {
      icon: <LockIcon className="w-8 h-8" />,
      title: 'Privacy-First Design',
      description: 'No audio recordings. All processing is transient and secure with zero data retention.',
    },
    {
      icon: <ShieldIcon className="w-8 h-8" />,
      title: 'Live Risk Assessment',
      description: 'Get instant risk scores during calls with clear recommendations for action.',
    },
    {
      icon: <MaskIcon className="w-8 h-8" />,
      title: 'Transparent Analysis',
      description: 'See detailed analysis metrics and understand how risk levels are determined.',
    },
  ];

  const howItWorks = [
    {
      step: '1',
      title: 'Start a Call',
      description: 'Make a voice call to any of your contacts using our secure WebRTC connection.',
      icon: <PhoneIcon className="w-6 h-6" />,
    },
    {
      step: '2',
      title: 'Automatic Analysis',
      description: 'Our AI analyzes the remote caller\'s voice in real-time, detecting synthetic characteristics.',
      icon: <BrainIcon className="w-6 h-6" />,
    },
    {
      step: '3',
      title: 'Risk Assessment',
      description: 'Receive live risk scores (LOW/MEDIUM/HIGH) with actionable recommendations.',
      icon: <ShieldIcon className="w-6 h-6" />,
    },
    {
      step: '4',
      title: 'Stay Protected',
      description: 'Make informed decisions about your conversations with real-time voice integrity verification.',
      icon: <CheckCircleIcon className="w-6 h-6" />,
    },
  ];

  const faq = [
    {
      question: 'What is VoiceShield?',
      answer: 'VoiceShield is a privacy-first real-time voice integrity security layer that detects AI-generated voices during calls, helping you stay protected from voice impersonation and fraud.',
    },
    {
      question: 'How does voice analysis work?',
      answer: 'VoiceShield uses advanced machine learning to analyze acoustic and prosodic characteristics of the remote caller\'s voice. Our models detect patterns typical of synthetic voice generation in real-time.',
    },
    {
      question: 'Is my audio data stored?',
      answer: 'No. VoiceShield operates with a strict no-storage policy. All audio processing is transient and happens in memory only. No recordings, transcripts, or voice data are ever saved.',
    },
    {
      question: 'What do the risk levels mean?',
      answer: 'LOW (0-30): Voice appears natural. MEDIUM (31-70): Moderate synthetic indicators detected, stay alert. HIGH (71-100): Strong synthetic indicators, perform independent verification.',
    },
    {
      question: 'Does this work with any phone system?',
      answer: 'Currently, VoiceShield works with browser-based WebRTC calls. Future versions will support integration with VoIP systems and traditional telephony.',
    },
    {
      question: 'Can I use this for group calls?',
      answer: 'The current version supports one-to-one calls. Multi-party call support is planned for future releases.',
    },
  ];

  return (
    <SimpleLayout>
      {/* Hero Section */}
      <div className="bg-dark-900 border-b border-dark-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Logo size="lg" />
            </div>
            <h1 className="text-5xl font-bold text-white mb-4">
              About VoiceShield
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Privacy-first real-time voice integrity security for safer conversations
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-3xl font-bold text-white mb-6">Our Mission</h2>
          <p className="text-lg text-gray-300 leading-relaxed mb-4">
            In an era where AI-generated voices are becoming increasingly sophisticated, 
            VoiceShield empowers users to verify voice authenticity in real-time.
          </p>
          <p className="text-lg text-gray-300 leading-relaxed">
            We believe everyone deserves to communicate with confidence, 
            knowing that the voice on the other end is genuine.
          </p>
        </div>

        {/* Key Features */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card p-6 hover:shadow-glow transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-primary-600/20 rounded-lg flex items-center justify-center text-primary-400 flex-shrink-0">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => (
              <div key={index} className="text-center">
                <div className="card p-6 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                    {item.icon}
                  </div>
                  <div className="text-3xl font-bold text-primary-400 mb-2">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-gray-400 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Commitment */}
        <div className="mb-16">
          <div className="card p-8 bg-gradient-to-br from-success-dark/10 to-dark-800 border-2 border-success-dark/30">
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-success-dark/20 rounded-lg flex items-center justify-center text-success-light flex-shrink-0">
                <LockIcon className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  Privacy Commitment
                </h2>
                <div className="space-y-3 text-gray-300">
                  <p>
                    <span className="font-semibold text-success-light">✓ Zero Audio Retention:</span>{' '}
                    No recordings, transcripts, or voice data are ever stored.
                  </p>
                  <p>
                    <span className="font-semibold text-success-light">✓ Transient Processing:</span>{' '}
                    All analysis happens in memory and is discarded immediately.
                  </p>
                  <p>
                    <span className="font-semibold text-success-light">✓ End-to-End Encryption:</span>{' '}
                    WebRTC ensures your calls remain private between participants.
                  </p>
                  <p>
                    <span className="font-semibold text-success-light">✓ Receiver-Side Analysis:</span>{' '}
                    Only the remote caller's voice is analyzed, never yours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-4xl mx-auto space-y-6">
            {faq.map((item, index) => (
              <div key={index} className="card p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-primary-600/20 rounded-lg flex items-center justify-center text-primary-400 flex-shrink-0 mt-1">
                    <InfoIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {item.question}
                    </h3>
                    <p className="text-gray-400">{item.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Version & Contact */}
        <div className="text-center">
          <div className="card p-8 inline-block">
            <p className="text-gray-400 mb-2">VoiceShield v1.0.0</p>
            <p className="text-gray-500 text-sm">
              Built for SIH 2026 • Privacy-First Voice Security
            </p>
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
}
