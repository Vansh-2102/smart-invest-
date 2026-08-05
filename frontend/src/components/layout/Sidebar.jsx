import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, ClipboardList, Shield, Star, Landmark,
  TrendingUp, BarChart2, Gem, Bitcoin, Globe, MessageSquare,
  Newspaper, Settings, ChevronLeft, ChevronRight, LogOut, Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ICON_MAP = {
  LayoutDashboard, User, ClipboardList, Shield, Star, Landmark,
  TrendingUp, BarChart2, Gem, Bitcoin, Globe, MessageSquare,
  Newspaper, Settings,
};

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { path: '/dashboard',         label: 'Dashboard',         icon: 'LayoutDashboard' },
      { path: '/profile',           label: 'User Profile',      icon: 'User' },
      { path: '/financial-profile', label: 'Financial Profile', icon: 'ClipboardList' },
      { path: '/risk-assessment',   label: 'Risk Assessment',   icon: 'Shield' },
      { path: '/recommendations',   label: 'Recommendations',   icon: 'Star' },
    ],
  },
  {
    label: 'Investments',
    items: [
      { path: '/banking',       label: 'Banking',         icon: 'Landmark' },
      { path: '/mutual-funds',  label: 'Mutual Funds',    icon: 'TrendingUp' },
      { path: '/stocks',        label: 'Stocks',          icon: 'BarChart2' },
      { path: '/gold',          label: 'Gold',            icon: 'Gem' },
      { path: '/crypto',        label: 'Crypto',          icon: 'Bitcoin' },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { path: '/market',   label: 'Market Dashboard', icon: 'Globe' },
      { path: '/chatbot',  label: 'AI Chatbot',       icon: 'MessageSquare' },
      { path: '/news',     label: 'News Sentiment',   icon: 'Newspaper' },
      { path: '/settings', label: 'Settings',         icon: 'Settings' },
    ],
  },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <aside
      className={[
        'flex flex-col h-full bg-gray-950/95 border-r border-gray-800/50 transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      ].join(' ')}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-gray-800/50 flex-shrink-0">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold gradient-text">InvestIQ</span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto text-gray-600 hover:text-gray-300 transition-colors p-1 rounded"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600 px-3 mb-2">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = ICON_MAP[item.icon];
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      ['nav-item', isActive && 'nav-item-active'].filter(Boolean).join(' ')
                    }
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-gray-800/50 p-3 flex-shrink-0">
        <div className={['flex items-center gap-3', collapsed && 'justify-center'].join(' ')}>
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="text-gray-600 hover:text-red-400 transition-colors p-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={handleLogout}
            className="mt-2 w-full flex justify-center text-gray-600 hover:text-red-400 transition-colors p-1"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
