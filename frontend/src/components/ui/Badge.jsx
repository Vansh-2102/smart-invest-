const variants = {
  emerald: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
  gold:    'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  red:     'bg-red-500/15 text-red-400 border border-red-500/30',
  blue:    'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  purple:  'bg-purple-500/15 text-purple-400 border border-purple-500/30',
  gray:    'bg-gray-500/15 text-gray-400 border border-gray-500/30',
};

const sizes = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1',
};

export default function Badge({ children, variant = 'emerald', size = 'md', className = '' }) {
  return (
    <span className={`badge ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}

export function RiskBadge({ level }) {
  const map = {
    LOW:       { variant: 'emerald', label: 'Low Risk' },
    MEDIUM:    { variant: 'gold',    label: 'Medium Risk' },
    HIGH:      { variant: 'red',     label: 'High Risk' },
    VERY_HIGH: { variant: 'red',     label: 'Very High Risk' },
    CONSERVATIVE: { variant: 'emerald', label: 'Conservative' },
    MODERATE:     { variant: 'gold',    label: 'Moderate' },
    AGGRESSIVE:   { variant: 'red',     label: 'Aggressive' },
  };
  const config = map[level?.toUpperCase()] || { variant: 'gray', label: level || 'Unknown' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
