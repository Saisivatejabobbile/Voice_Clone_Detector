import Badge from '../common/Badge';
import { ShieldIcon, AlertIcon, ExclamationIcon } from '../../utils/icons';

// Security Status Card Component - Enterprise Cybersecurity Audit Panel
export default function SecurityStatusCard({ status = 'protected' }) {
  const statusConfig = {
    protected: {
      icon: <ShieldIcon className="w-4 h-4 text-[#10B981]" />,
      title: 'Shield Armed',
      variant: 'success',
      message: 'Neural speech analysis active. Zero voice anomalies detected.',
    },
    warning: {
      icon: <AlertIcon className="w-4 h-4 text-[#F59E0B]" />,
      title: 'Caution Required',
      variant: 'warning',
      message: 'Recent call exhibited elevated synthetic speech probability.',
    },
    danger: {
      icon: <ExclamationIcon className="w-4 h-4 text-[#EF4444]" />,
      title: 'Threat Detected',
      variant: 'danger',
      message: 'Active impersonation attempt neutralized in recent session.',
    },
  };

  const config = statusConfig[status] || statusConfig.protected;

  const securityChecks = [
    {
      id: 1,
      label: 'Real-Time AudioWorklet Signal Pipeline',
      status: 'active',
      value: 'Operational',
      time: 'Live',
      variant: 'success',
    },
    {
      id: 2,
      label: 'Transient Processing & No-Storage Vault',
      status: 'active',
      value: 'Enforced',
      time: 'Strict',
      variant: 'success',
    },
    {
      id: 3,
      label: 'Multi-lingual Neural Impersonation Model',
      status: 'active',
      value: 'Armed v2.4',
      time: '99.8% Conf.',
      variant: 'ai',
    },
  ];

  return (
    <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-4 sm:p-6 shadow-sm transition-colors min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F1F5F9] dark:border-[#1E3A5F] mb-4">
        <div>
          <h2 className="text-base font-bold text-[#0B1F3A] dark:text-white">Active Protection State</h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">{config.message}</p>
        </div>
        <div className="self-start sm:self-auto shrink-0">
          <Badge variant={config.variant} className="flex items-center gap-1.5">
            {config.icon}
            {config.title}
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        {securityChecks.map((check) => (
          <div 
            key={check.id}
            className="flex items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-[#0B1524] border border-slate-100 dark:border-[#1E3A5F] rounded-lg hover:border-slate-200 dark:hover:border-[#00C2FF]/40 transition-colors min-w-0"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_6px_#10B981] shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#0B1F3A] dark:text-slate-200 truncate">{check.label}</p>
                <p className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8]">{check.time}</p>
              </div>
            </div>
            
            <Badge variant={check.variant} size="sm" className="shrink-0">
              {check.value}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
