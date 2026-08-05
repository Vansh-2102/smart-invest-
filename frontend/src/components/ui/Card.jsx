export default function Card({ children, className = '', gradient = false, hover = false, padding = true }) {
  return (
    <div
      className={[
        'glass-card',
        padding && 'p-6',
        gradient && 'bg-gradient-to-br from-gray-900/80 to-gray-800/40',
        hover && 'hover:border-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300 cursor-pointer',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
