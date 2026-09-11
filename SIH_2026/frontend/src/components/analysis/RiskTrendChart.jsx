// Enterprise Real-Time Risk Trend Line Chart
export default function RiskTrendChart({ riskHistory = [] }) {
  if (riskHistory.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8] mb-4">Risk Trend</h3>
        <div className="text-center py-8">
          <p className="text-xs text-[#94A3B8] dark:text-[#64748B]">Insufficient telemetry points recorded</p>
        </div>
      </div>
    );
  }

  const maxRisk = 100;
  const height = 110;
  const width = 100;

  const points = riskHistory.map((item, index) => {
    const score = item.risk_score ?? item.riskScore ?? 0;
    const x = (index / Math.max(riskHistory.length - 1, 1)) * width;
    const y = height - (score / maxRisk) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPath = `M 0,${height} L ${points} L ${width},${height} Z`;

  const latestItem = riskHistory[riskHistory.length - 1];
  const latestRisk = latestItem?.risk_score ?? latestItem?.riskScore ?? 0;

  const strokeColor =
    latestRisk >= 81 ? '#EF4444' :
    latestRisk >= 61 ? '#EF4444' :
    latestRisk >= 31 ? '#F59E0B' :
    '#10B981';

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#123C69] dark:bg-[#00C2FF]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0B1F3A] dark:text-[#F1F5F9]">
            Telemetry Trend History
          </h3>
        </div>
        <span className="text-[11px] font-mono text-[#64748B] dark:text-[#94A3B8] bg-slate-100 dark:bg-[#0B1524] px-2 py-0.5 rounded">
          {riskHistory.length} samples
        </span>
      </div>

      <div className="relative pt-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Subtle Grid lines */}
          {[0, 25, 50, 75, 100].map((value) => {
            const y = height - (value / 100) * height;
            return (
              <line
                key={value}
                x1="0"
                y1={y}
                x2={width}
                y2={y}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800"
                strokeWidth="1"
              />
            );
          })}

          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.18" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d={areaPath} fill="url(#areaGradient)" />

          <polyline
            points={points}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {riskHistory.map((item, index) => {
            const score = item.risk_score ?? item.riskScore ?? 0;
            const x = (index / Math.max(riskHistory.length - 1, 1)) * width;
            const y = height - (score / maxRisk) * height;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1.8"
                fill={strokeColor}
                stroke="#FFFFFF"
                strokeWidth="0.8"
              />
            );
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="flex justify-between text-[10px] font-mono text-[#94A3B8] dark:text-[#64748B] mt-2">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Latest value */}
      <div className="mt-4 pt-3 border-t border-[#F1F5F9] dark:border-[#1E3A5F] flex items-center justify-between">
        <span className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Latest Score</span>
        <span
          className="font-mono text-lg font-bold"
          style={{ color: strokeColor }}
        >
          {latestRisk}%
        </span>
      </div>
    </div>
  );
}
