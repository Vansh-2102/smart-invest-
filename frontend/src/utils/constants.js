export const APP_NAME = 'InvestIQ';

export const RISK_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];

export const INVESTMENT_GOALS = [
  'WEALTH_GROWTH',
  'RETIREMENT',
  'EDUCATION',
  'HOME_PURCHASE',
  'EMERGENCY_FUND',
  'TAX_SAVING',
];

export const INVESTMENT_EXPERIENCES = [
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'EXPERT',
];

export const RISK_TOLERANCE = ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'];

export const ASSET_COLORS = {
  stocks:      '#10B981',
  mutualFunds: '#3B82F6',
  bonds:       '#6366F1',
  banking:     '#06B6D4',
  gold:        '#F59E0B',
  crypto:      '#EC4899',
  cash:        '#6B7280',
  realEstate:  '#8B5CF6',
};

export const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: '#9CA3AF',
        font: { family: 'Inter', size: 12 },
      },
    },
    tooltip: {
      backgroundColor: '#1F2937',
      borderColor: '#374151',
      borderWidth: 1,
      titleColor: '#F9FAFB',
      bodyColor: '#D1D5DB',
      padding: 12,
    },
  },
};

export const NAV_ITEMS = [
  { path: '/dashboard',          label: 'Dashboard',          icon: 'LayoutDashboard' },
  { path: '/profile',            label: 'User Profile',       icon: 'User' },
  { path: '/financial-profile',  label: 'Financial Profile',  icon: 'ClipboardList' },
  { path: '/risk-assessment',    label: 'Risk Assessment',    icon: 'Shield' },
  { path: '/recommendations',    label: 'Recommendations',    icon: 'Star' },
  { path: '/banking',            label: 'Banking',            icon: 'Landmark' },
  { path: '/mutual-funds',       label: 'Mutual Funds',       icon: 'TrendingUp' },
  { path: '/stocks',             label: 'Stocks',             icon: 'BarChart2' },
  { path: '/gold',               label: 'Gold',               icon: 'Gem' },
  { path: '/crypto',             label: 'Crypto',             icon: 'Bitcoin' },
  { path: '/market',             label: 'Market Dashboard',   icon: 'Globe' },
  { path: '/chatbot',            label: 'AI Chatbot',         icon: 'MessageSquare' },
  { path: '/news',               label: 'News Sentiment',     icon: 'Newspaper' },
  { path: '/settings',           label: 'Settings',           icon: 'Settings' },
];
