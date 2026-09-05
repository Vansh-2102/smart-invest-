import {
  Menu, Sun, Moon, Bell, LogOut, User, ChevronDown, CheckCheck,
  Trash2, Star, Shield, TrendingUp, Landmark, Settings, Sparkles
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const DEFAULT_NOTIFICATIONS = [
  {
    id: 1,
    title: 'AI Portfolio Plan Ready',
    message: 'Your personalized portfolio recommendation with ₹10,00,000 capital has been calculated.',
    time: '10m ago',
    read: false,
    path: '/recommendations',
    icon: Star,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  },
  {
    id: 2,
    title: 'Risk Profile Verified',
    message: 'Your investor risk profile has been analyzed and confirmed with high model confidence.',
    time: '2h ago',
    read: false,
    path: '/risk-assessment',
    icon: Shield,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  },
  {
    id: 3,
    title: 'Market Rally Alert',
    message: 'S&P 500 and Nasdaq 100 ETFs up over +1.8% today following tech earnings.',
    time: '5h ago',
    read: false,
    path: '/market',
    icon: TrendingUp,
    color: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  },
  {
    id: 4,
    title: 'Banking Rates Update',
    message: 'HDFC Bank Fixed Deposit rates currently offer up to 7.25% p.a. guaranteed returns.',
    time: '1d ago',
    read: true,
    path: '/banking',
    icon: Landmark,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  },
];

export default function Navbar({ onMenuToggle, pageTitle }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('investiq_notifications');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((n) => ({
          ...n,
          icon: n.id === 1 ? Star : n.id === 2 ? Shield : n.id === 3 ? TrendingUp : Landmark,
        }));
      } catch {}
    }
    return DEFAULT_NOTIFICATIONS;
  });

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const saveNotifications = (newList) => {
    setNotifications(newList);
    localStorage.setItem(
      'investiq_notifications',
      JSON.stringify(newList.map(({ icon, ...rest }) => rest))
    );
  };

  const markAllAsRead = () => {
    saveNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    saveNotifications([]);
  };

  const handleNotificationClick = (notif) => {
    saveNotifications(
      notifications.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    setNotifOpen(false);
    if (notif.path) {
      navigate(notif.path);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="h-16 flex items-center gap-4 px-4 md:px-6 bg-gray-950/80 backdrop-blur-md border-b border-gray-800/50 flex-shrink-0 z-30">
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden text-gray-400 hover:text-gray-200 p-1"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <h1 className="text-base font-semibold text-gray-200 flex-1">{pageTitle}</h1>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 transition-all cursor-pointer"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-blue-500 transition-transform duration-200 hover:-rotate-12" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800/60 transition-all cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 glass-card bg-gray-900 border border-gray-700/60 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-gray-900/90">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-emerald-400 transition-colors"
                      title="Mark all as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Read all</span>
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="Clear all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-800/60">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-xs">
                    No new notifications
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const Icon = notif.icon || Bell;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-gray-800/50 ${
                          !notif.read ? 'bg-emerald-500/[0.03]' : ''
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border flex-shrink-0 mt-0.5 ${
                            notif.color || 'text-gray-400 bg-gray-800 border-gray-700'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4
                              className={`text-xs truncate ${
                                !notif.read ? 'font-bold text-white' : 'font-medium text-gray-300'
                              }`}
                            >
                              {notif.title}
                            </h4>
                            <span className="text-[10px] text-gray-500 whitespace-nowrap">
                              {notif.time}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-2 border-t border-gray-800 bg-gray-900/60">
                <button
                  onClick={() => {
                    setNotifOpen(false);
                    navigate('/settings');
                  }}
                  className="w-full py-1.5 text-center text-xs text-gray-400 hover:text-emerald-400 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Notification Settings</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-xl hover:bg-gray-800/60 transition-all cursor-pointer"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
              {initials}
            </div>
            <span className="text-sm text-gray-300 hidden sm:block max-w-[100px] truncate">
              {user?.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 glass-card bg-gray-900 border border-gray-700/60 py-1 z-50 rounded-xl shadow-2xl animate-fade-in">
              <button
                onClick={() => {
                  navigate('/profile');
                  setDropdownOpen(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 cursor-pointer"
              >
                <User className="w-4 h-4" /> Profile
              </button>
              <button
                onClick={() => {
                  navigate('/settings');
                  setDropdownOpen(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 cursor-pointer"
              >
                <Settings className="w-4 h-4" /> Settings
              </button>
              <div className="border-t border-gray-800 my-1" />
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

