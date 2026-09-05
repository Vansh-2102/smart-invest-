// Semi-circular risk gauge using SVG

const RISK_CONFIG = {
  LOW:          { label: 'Low',          color: '#10B981', angle: 30,  score: 25 },
  CONSERVATIVE: { label: 'Conservative', color: '#10B981', angle: 30,  score: 25 },
  MEDIUM:       { label: 'Medium',       color: '#F59E0B', angle: 90,  score: 50 },
  MODERATE:     { label: 'Moderate',     color: '#F59E0B', angle: 90,  score: 50 },
  HIGH:         { label: 'High',         color: '#F97316', angle: 150, score: 75 },
  AGGRESSIVE:   { label: 'Aggressive',   color: '#EF4444', angle: 170, score: 95 },
  VERY_HIGH:    { label: 'Very High',    color: '#EF4444', angle: 170, score: 95 },
};

function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 180) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end   = polarToCartesian(cx, cy, r, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`;
}

export default function RiskGauge({ level = 'MEDIUM', confidence = 0 }) {
  const config   = RISK_CONFIG[level?.toUpperCase()] || RISK_CONFIG.MEDIUM;
  const cx       = 120;
  const cy       = 120;
  const r        = 90;
  const needleAng = config.angle;

  const needle = polarToCartesian(cx, cy, r - 10, needleAng);

  return (
    <div className="flex flex-col items-center">
      <svg width="240" height="150" viewBox="0 0 240 150">
        {/* Background track */}
        <path
          d={describeArc(cx, cy, r, 0, 180)}
          fill="none"
          stroke="#1F2937"
          strokeWidth="16"
          strokeLinecap="round"
        />
        {/* Low segment */}
        <path
          d={describeArc(cx, cy, r, 0, 60)}
          fill="none"
          stroke="#10B981"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Medium segment */}
        <path
          d={describeArc(cx, cy, r, 60, 120)}
          fill="none"
          stroke="#F59E0B"
          strokeWidth="14"
          opacity="0.6"
        />
        {/* High segment */}
        <path
          d={describeArc(cx, cy, r, 120, 180)}
          fill="none"
          stroke="#EF4444"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* Needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needle.x}
          y2={needle.y}
          stroke={config.color}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r="6" fill={config.color} />
        <circle cx={cx} cy={cy} r="3" fill="#0F172A" />

        {/* Labels */}
        <text x="16" y="130" fill="#10B981" fontSize="10" fontFamily="Inter">Low</text>
        <text x="108" y="28"  fill="#F59E0B" fontSize="10" fontFamily="Inter" textAnchor="middle">Medium</text>
        <text x="200" y="130" fill="#EF4444" fontSize="10" fontFamily="Inter" textAnchor="end">High</text>
      </svg>

      <div className="text-center -mt-2">
        <p className="text-2xl font-bold" style={{ color: config.color }}>
          {config.label}
        </p>
        {confidence > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            {(confidence * 100).toFixed(1)}% confidence
          </p>
        )}
      </div>
    </div>
  );
}
