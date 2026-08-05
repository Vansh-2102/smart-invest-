import { useState } from 'react';
import { Sun, Moon, Bell, Lock, Trash2, Save, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import ErrorAlert from '../components/ui/ErrorAlert';

function ToggleSwitch({ enabled, onChange, label, description }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-800/50 last:border-0">
      <div>
        <p className="text-sm font-medium text-gray-200">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0 ${
          enabled ? 'bg-emerald-500' : 'bg-gray-700'
        }`}
      >
        <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const [notifications, setNotifications] = useState({
    emailAlerts:       true,
    marketUpdates:     true,
    recommendationNew: true,
    priceAlerts:       false,
    newsDigest:        true,
  });

  const [pwForm, setPwForm]   = useState({ current: '', newPwd: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState({});
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.current)             errs.current = 'Current password required';
    if (!pwForm.newPwd)              errs.newPwd  = 'New password required';
    else if (pwForm.newPwd.length < 6) errs.newPwd = 'Min 6 characters';
    if (pwForm.newPwd !== pwForm.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) { setPwErrors(errs); return; }

    setPwLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setPwLoading(false);
    setPwSuccess(true);
    setPwForm({ current: '', newPwd: '', confirm: '' });
    setTimeout(() => setPwSuccess(false), 3000);
  };

  const setNotif = (key) => (val) => setNotifications({ ...notifications, [key]: val });

  return (
    <div className="space-y-6 max-w-3xl animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-gray-400 text-sm mt-1">Manage your account preferences and security</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader title="Appearance" subtitle="Customize how InvestIQ looks" />
        <div className="flex items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-navy-800' : 'bg-yellow-500/20'}`}>
              {isDark ? <Moon className="w-5 h-5 text-blue-400" /> : <Sun className="w-5 h-5 text-yellow-400" />}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-200">{isDark ? 'Dark Mode' : 'Light Mode'}</p>
              <p className="text-xs text-gray-500">Toggle between dark and light theme</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`relative w-11 h-6 rounded-full transition-all ${isDark ? 'bg-emerald-500' : 'bg-gray-700'}`}
          >
            <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader
          title="Notifications"
          subtitle="Choose what alerts you receive"
          action={<Bell className="w-5 h-5 text-gray-500" />}
        />
        <div>
          <ToggleSwitch enabled={notifications.emailAlerts}       onChange={setNotif('emailAlerts')}
            label="Email Alerts"         description="Receive important account updates via email" />
          <ToggleSwitch enabled={notifications.marketUpdates}     onChange={setNotif('marketUpdates')}
            label="Market Updates"       description="Get daily market summary and key movements" />
          <ToggleSwitch enabled={notifications.recommendationNew} onChange={setNotif('recommendationNew')}
            label="New Recommendations"  description="Alert when AI generates new recommendations" />
          <ToggleSwitch enabled={notifications.priceAlerts}       onChange={setNotif('priceAlerts')}
            label="Price Alerts"         description="Notifications for significant price changes" />
          <ToggleSwitch enabled={notifications.newsDigest}        onChange={setNotif('newsDigest')}
            label="News Digest"          description="Weekly news sentiment summary" />
        </div>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader title="Security" subtitle="Update your password" action={<Lock className="w-5 h-5 text-gray-500" />} />

        {pwSuccess && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="text-sm text-emerald-300">Password changed successfully!</p>
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div className="relative">
            <Input
              label="Current Password"
              type={showPwd ? 'text' : 'password'}
              value={pwForm.current}
              onChange={(e) => setPwForm({ ...pwForm, current: e.target.value })}
              error={pwErrors.current}
              placeholder="Enter current password"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="New Password"
              type={showPwd ? 'text' : 'password'}
              value={pwForm.newPwd}
              onChange={(e) => setPwForm({ ...pwForm, newPwd: e.target.value })}
              error={pwErrors.newPwd}
              placeholder="Min 6 characters"
            />
            <Input
              label="Confirm New Password"
              type={showPwd ? 'text' : 'password'}
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              error={pwErrors.confirm}
              placeholder="Repeat new password"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300"
            >
              {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPwd ? 'Hide' : 'Show'} passwords
            </button>
          </div>

          <Button type="submit" loading={pwLoading} icon={<Save className="w-4 h-4" />}>
            Update Password
          </Button>
        </form>
      </Card>

      {/* Danger zone */}
      <Card className="border border-red-500/20">
        <CardHeader title="Danger Zone" subtitle="Irreversible account actions" />
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
            <div>
              <p className="text-sm font-medium text-red-300">Delete Account</p>
              <p className="text-xs text-gray-500 mt-0.5">Permanently delete your account and all data. This cannot be undone.</p>
            </div>
            {!deleteConfirm ? (
              <Button variant="danger" size="sm" onClick={() => setDeleteConfirm(true)}>
                <Trash2 className="w-4 h-4" /> Delete
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="danger" size="sm" onClick={() => { logout(); navigate('/login'); }}>
                  Confirm Delete
                </Button>
                <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-800/30 border border-gray-700/30 rounded-xl">
            <div>
              <p className="text-sm font-medium text-gray-300">Sign Out All Devices</p>
              <p className="text-xs text-gray-500 mt-0.5">Log out from all active sessions across devices.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => { logout(); navigate('/login'); }}>
              Sign Out
            </Button>
          </div>
        </div>
      </Card>

      {/* App info */}
      <div className="text-center text-xs text-gray-700 py-2">
        InvestIQ v1.0.0 · Built with ❤️ · AI-Powered Investment Platform
      </div>
    </div>
  );
}
