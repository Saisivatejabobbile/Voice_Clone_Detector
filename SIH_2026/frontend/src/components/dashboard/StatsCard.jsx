// Enterprise Stats Card Component for Dashboard - Fully Responsive
export default function StatsCard({ icon, label, value, color = 'primary', trend }) {
  const iconColors = {
    primary: 'bg-[#0B1F3A]/5 text-[#0B1F3A] border-[#0B1F3A]/15 dark:bg-[#00C2FF]/10 dark:text-[#00C2FF] dark:border-[#00C2FF]/30',
    success: 'bg-[#10B981]/10 text-[#065F46] border-[#10B981]/25 dark:bg-[#10B981]/20 dark:text-[#34D399] dark:border-[#10B981]/40',
    warning: 'bg-[#F59E0B]/10 text-[#92400E] border-[#F59E0B]/25 dark:bg-[#F59E0B]/20 dark:text-[#FBBF24] dark:border-[#F59E0B]/40',
    danger: 'bg-[#EF4444]/10 text-[#991B1B] border-[#EF4444]/25 dark:bg-[#EF4444]/20 dark:text-[#F87171] dark:border-[#EF4444]/40',
    info: 'bg-[#00C2FF]/10 text-[#00779E] border-[#00C2FF]/25 dark:bg-[#00C2FF]/20 dark:text-[#38BDF8] dark:border-[#00C2FF]/40',
  };

  return (
    <div className="bg-white dark:bg-[#0F1D32] border border-[#E2E8F0] dark:border-[#1E3A5F] rounded-xl p-4 sm:p-5 lg:p-6 shadow-sm hover:border-[#CBD5E1] dark:hover:border-[#00C2FF]/60 transition-all min-w-0 overflow-hidden">
      <div className="flex items-start justify-between gap-2.5 sm:gap-4 min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-1.5 leading-snug break-words" title={label}>
            {label}
          </p>
          <p className="font-mono text-2xl sm:text-3xl font-bold text-[#0B1F3A] dark:text-white tracking-tight leading-none mt-1">
            {value}
          </p>
          {trend && (
            <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${trend.positive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              <span>{trend.positive ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
              <span className="text-[#64748B] dark:text-[#94A3B8] font-normal truncate">{trend.label}</span>
            </p>
          )}
        </div>
        
        <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center shadow-xs flex-shrink-0 self-start mt-0.5 ${iconColors[color] || iconColors.primary}`}>
          {typeof icon === 'string' ? (
            <span className="text-base sm:text-xl">{icon}</span>
          ) : (
            icon
          )}
        </div>
      </div>
    </div>
  );
}
