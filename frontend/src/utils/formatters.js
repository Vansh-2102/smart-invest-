// Currency formatter
export const formatCurrency = (value, currency = 'INR') => {
  if (value === null || value === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
};

// Compact number (1.2T, 45.6K, etc.)
export const formatCompact = (value) => {
  if (value === null || value === undefined) return '—';
  if (value >= 1e12) return `₹${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9)  return `₹${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e7)  return `₹${(value / 1e7).toFixed(2)}Cr`;
  if (value >= 1e5)  return `₹${(value / 1e5).toFixed(2)}L`;
  if (value >= 1e3)  return `₹${(value / 1e3).toFixed(2)}K`;
  return `₹${value}`;
};

// Percentage
export const formatPercent = (value, decimals = 2) => {
  if (value === null || value === undefined) return '—';
  return `${value >= 0 ? '+' : ''}${parseFloat(value).toFixed(decimals)}%`;
};

// Date
export const formatDate = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Risk level color
export const getRiskColor = (level) => {
  const l = level?.toUpperCase();
  if (l === 'LOW')         return 'text-emerald-400';
  if (l === 'MEDIUM')      return 'text-yellow-400';
  if (l === 'HIGH')        return 'text-orange-400';
  if (l === 'VERY_HIGH')   return 'text-red-400';
  return 'text-gray-400';
};

export const getRiskBadgeClass = (level) => {
  const l = level?.toUpperCase();
  if (l === 'LOW')         return 'badge risk-low border';
  if (l === 'MEDIUM')      return 'badge risk-medium border';
  if (l === 'HIGH' || l === 'VERY_HIGH') return 'badge risk-high border';
  return 'badge border border-gray-600 text-gray-400';
};

// Sentiment color
export const getSentimentColor = (sentiment) => {
  if (sentiment === 'Bullish') return 'text-emerald-400';
  if (sentiment === 'Bearish') return 'text-red-400';
  return 'text-yellow-400';
};

export const getSentimentBg = (sentiment) => {
  if (sentiment === 'Bullish') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  if (sentiment === 'Bearish') return 'bg-red-500/10 text-red-400 border border-red-500/20';
  return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20';
};

// Change color
export const getChangeColor = (change) => {
  if (change > 0) return 'text-emerald-400';
  if (change < 0) return 'text-red-400';
  return 'text-gray-400';
};

// Truncate text
export const truncate = (str, max = 80) => {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
};
