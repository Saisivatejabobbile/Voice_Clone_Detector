// Real-time Risk Trend Chart (Simple Line Chart)
export default function RiskTrendChart({ riskHistory = [] }) {
  if (riskHistory.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">Risk Trend</h3>
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm">No data yet</p>
        </div>
      </div>
    );
  }

  // Get max value for scaling
  const maxRisk = Math.max(...riskHistory.map((r) => r.risk_score), 100);
  const height = 120;
  const width = 100;

  // Calculate points for line
  const points = riskHistory.map((item, index) => {
    const x = (index / Math.max(riskHistory.length - 1, 1)) * width;
    const y = height - (item.risk_score / maxRisk) * height;
    return `${x},${y}`;
  }).join(' ');

  // Calculate area path for gradient fill
  const areaPath = `M 0,${height} L ${points} L ${width},${height} Z`;

  // Get latest risk level for color
  const latestRisk = riskHistory[riskHistory.length - 1]?.risk_score || 0;
  const strokeColor =
    latestRisk >= 70
      ? '#ef4444' // danger
      : latestRisk >= 40
      ? '#f59e0b' // warning
      : '#10b981'; // success

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">Risk Trend</h3>
        <span className="text-xs text-gray-400">
          {riskHistory.length} samples
        </span>
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((value) => {
            const y = height - (value / 100) * height;
            return (
              <line
                key={value}
                x1="0"
                y1={y}
                x2={width}
                y2={y}
                stroke="rgba(255,255,255,0.05)"
                strokeWidth="0.5"
              />
            );
          })}

          {/* Area gradient */}
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.3" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={areaPath}
            fill="url(#areaGradient)"
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {riskHistory.map((item, index) => {
            const x = (index / Math.max(riskHistory.length - 1, 1)) * width;
            const y = height - (item.risk_score / maxRisk) * height;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1.5"
                fill={strokeColor}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 -ml-8">
          <span>100</span>
          <span>75</span>
          <span>50</span>
          <span>25</span>
          <span>0</span>
        </div>
      </div>

      {/* Latest value */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-xs text-gray-400">Current Risk</span>
        <span
          className="text-lg font-bold"
          style={{ color: strokeColor }}
        >
          {latestRisk}
        </span>
      </div>
    </div>
  );
}
