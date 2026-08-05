import { useState } from 'react';
import { User, Mail, Calendar, Shield, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { useFinancialProfile } from '../hooks/useFinancialProfile';
import { formatDate, formatCurrency } from '../utils/formatters';
import { RiskBadge } from '../components/ui/Badge';

export default function UserProfile() {
  const { user }   = useAuth();
  const { profile } = useFinancialProfile();
  const [editing, setEditing] = useState(false);

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* Profile header */}
      <Card>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-emerald-500/20">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-2 border-gray-900 flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-white">{user?.name}</h2>
            <p className="text-gray-400">{user?.email}</p>
            {profile?.predictedRiskLevel && (
              <div className="mt-2">
                <RiskBadge level={profile.predictedRiskLevel} />
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setEditing(!editing)}
            icon={editing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Account information */}
        <Card>
          <CardHeader title="Account Information" subtitle="Your personal details" />
          <div className="space-y-4">
            {[
              { label: 'Full Name',    value: user?.name,  icon: User },
              { label: 'Email',        value: user?.email, icon: Mail },
              { label: 'Role',         value: user?.role || 'INVESTOR', icon: Shield },
              { label: 'Member Since', value: formatDate(user?.createdAt), icon: Calendar },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 py-3 border-b border-gray-800/50 last:border-0">
                <div className="w-9 h-9 bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</p>
                  <p className="text-sm text-gray-200 mt-0.5">{item.value || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Financial snapshot */}
        <Card>
          <CardHeader title="Financial Snapshot" subtitle="From your financial profile" />
          {profile ? (
            <div className="space-y-4">
              {[
                { label: 'Annual Income',    value: formatCurrency(profile.annualIncome) },
                { label: 'Age',              value: `${profile.age} years` },
                { label: 'Investment Goal',  value: profile.investmentGoal?.replace(/_/g, ' ') },
                { label: 'Time Horizon',     value: `${profile.timeHorizonYears} years` },
                { label: 'Experience Level', value: profile.investmentExperience?.replace(/_/g, ' ') },
                { label: 'Debt-to-Income',   value: profile.debtToIncomeRatio ? `${parseFloat(profile.debtToIncomeRatio).toFixed(1)}%` : '—' },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center py-2.5 border-b border-gray-800/50 last:border-0">
                  <span className="text-sm text-gray-400">{item.label}</span>
                  <span className="text-sm font-medium text-gray-200 capitalize">{item.value || '—'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <Shield className="w-10 h-10 text-gray-700" />
              <p className="text-gray-500 text-sm text-center">
                No financial profile yet.{' '}
                <a href="/financial-profile" className="text-emerald-400 hover:underline">Set it up →</a>
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Activity stats */}
      <Card>
        <CardHeader title="Account Stats" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Profile Completeness', value: profile ? '100%' : '50%', color: 'text-emerald-400' },
            { label: 'Risk Profile',         value: profile?.predictedRiskLevel?.replace('_', ' ') || 'Pending', color: 'text-yellow-400' },
            { label: 'AI Confidence',        value: profile ? `${((profile.currentRiskConfidence || 0) * 100).toFixed(0)}%` : '—', color: 'text-blue-400' },
            { label: 'Last Updated',         value: formatDate(profile?.updatedAt) || '—', color: 'text-gray-400' },
          ].map((s) => (
            <div key={s.label} className="text-center bg-gray-800/30 rounded-xl p-4">
              <p className={`text-xl font-bold ${s.color} capitalize`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
