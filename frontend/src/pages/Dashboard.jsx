import { useNavigate } from 'react-router-dom';
import { TrendingUp, Shield, Star, ArrowRight, BarChart2, Zap, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useFinancialProfile } from '../hooks/useFinancialProfile';
import { useRecommendations } from '../hooks/useRecommendations';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import AllocationChart from '../components/charts/AllocationChart';
import RiskGauge from '../components/charts/RiskGauge';
import { formatCurrency, formatDate, formatPercent, getRiskBadgeClass } from '../utils/formatters';

function StatCard({ label, value, sub, icon: Icon, color = 'emerald', trend }) {
  const colors = {
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
    gold:    { bg: 'bg-yellow-500/10',  text: 'text-yellow-400',  border: 'border-yellow-500/20' },
    blue:    { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20' },
    purple:  { bg: 'bg-purple-500/10',  text: 'text-purple-400',  border: 'border-purple-500/20' },
  };
  const c = colors[color];

  return (
    <div className={`glass-card p-5 border ${c.border}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${c.text}`} />
        </div>
        {trend !== undefined && (
          <span className={trend >= 0 ? 'text-emerald-400 text-sm font-medium' : 'text-red-400 text-sm font-medium'}>
            {formatPercent(trend)}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-sm text-gray-400">{label}</p>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useFinancialProfile();
  const { recommendations, current, loading: recLoading } = useRecommendations();
  const navigate = useNavigate();

  const loading = profileLoading || recLoading;

  if (loading) return <PageLoader />;

  const hasProfile = !!profile;
  const hasRec     = !!current;

  const allocation = current?.assetAllocations || {};
  const assetRecs  = current?.assetRecommendations || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {greeting}, {user?.name?.split(' ')[0] || 'Investor'} 👋
          </h2>
          <p className="text-gray-400 text-sm mt-1">Here's your investment overview</p>
        </div>
        <Button onClick={() => navigate('/recommendations')} icon={<RefreshCw className="w-4 h-4" />} size="sm">
          Get New Recommendation
        </Button>
      </div>

      {/* Onboarding prompt if no profile */}
      {!hasProfile && (
        <div className="glass-card p-6 border border-emerald-500/20 bg-emerald-500/5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-semibold mb-1">Complete your financial profile</h3>
              <p className="text-gray-400 text-sm">Set up your profile to get personalized AI-powered investment recommendations.</p>
            </div>
            <Button onClick={() => navigate('/financial-profile')} size="sm">
              Get Started <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Risk Level"
          value={profile?.predictedRiskLevel?.replace('_', ' ') || '—'}
          sub={profile ? `${((profile.currentRiskConfidence || 0) * 100).toFixed(0)}% confidence` : 'Profile not set'}
          icon={Shield}
          color="emerald"
        />
        <StatCard
          label="Annual Income"
          value={profile ? formatCurrency(profile.annualIncome) : '—'}
          sub={profile ? `${profile.investmentGoal?.replace('_', ' ')}` : 'Not set'}
          icon={TrendingUp}
          color="gold"
        />
        <StatCard
          label="Recommendations"
          value={recommendations.length || '0'}
          sub={recommendations.length ? `Latest: ${formatDate(recommendations[0]?.createdAt)}` : 'No history yet'}
          icon={Star}
          color="blue"
        />
        <StatCard
          label="Time Horizon"
          value={profile?.timeHorizonYears ? `${profile.timeHorizonYears}Y` : '—'}
          sub={profile?.investmentExperience?.replace('_', ' ') || 'Not specified'}
          icon={BarChart2}
          color="purple"
        />
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Allocation chart */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Asset Allocation"
            subtitle={hasRec ? `Based on ${current.riskLevel?.replace('_', ' ')} risk profile` : 'No recommendations yet'}
            action={
              hasRec && (
                <button
                  onClick={() => navigate('/recommendations')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              )
            }
          />
          {hasRec ? (
            <AllocationChart allocations={allocation} height={240} />
          ) : (
            <div className="flex flex-col items-center justify-center h-60 gap-4">
              <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center">
                <BarChart2 className="w-8 h-8 text-gray-600" />
              </div>
              <div className="text-center">
                <p className="text-gray-400 text-sm">No allocation data</p>
                <p className="text-gray-600 text-xs mt-1">Generate a recommendation to see your portfolio allocation</p>
              </div>
              <Button size="sm" onClick={() => navigate('/recommendations')}>
                Generate Recommendation
              </Button>
            </div>
          )}
        </Card>

        {/* Risk gauge */}
        <Card>
          <CardHeader title="Risk Profile" subtitle="Your predicted risk level" />
          {hasProfile ? (
            <div className="flex flex-col items-center">
              <RiskGauge
                level={profile.predictedRiskLevel}
                confidence={profile.currentRiskConfidence}
              />
              <div className="mt-4 w-full space-y-2">
                {[
                  { label: 'Experience',    value: profile.investmentExperience?.replace('_', ' ') },
                  { label: 'Goal',          value: profile.investmentGoal?.replace('_', ' ') },
                  { label: 'Debt Ratio',    value: profile.debtToIncomeRatio ? `${parseFloat(profile.debtToIncomeRatio).toFixed(1)}%` : '—' },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="text-gray-200 capitalize">{item.value || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Shield className="w-12 h-12 text-gray-700" />
              <p className="text-gray-500 text-sm text-center">Complete your financial profile to see risk assessment</p>
            </div>
          )}
        </Card>
      </div>

      {/* Recent recommendations */}
      {assetRecs.length > 0 && (
        <Card>
          <CardHeader
            title="Latest Recommendations"
            subtitle="AI-generated investment suggestions"
            action={
              <button
                onClick={() => navigate('/recommendations')}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </button>
            }
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assetRecs.slice(0, 6).map((rec, i) => (
              <div key={i} className="bg-gray-800/40 rounded-xl p-4 border border-gray-700/30 hover:border-emerald-500/20 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <p className="text-white font-medium text-sm">{rec.name || rec.assetType}</p>
                  <span className={`badge text-xs ${rec.risk === 'Low' ? 'risk-low border' : rec.risk === 'High' ? 'risk-high border' : 'risk-medium border'}`}>
                    {rec.risk || 'Medium'}
                  </span>
                </div>
                <p className="text-emerald-400 font-bold">{formatPercent(rec.expectedReturn || rec.expectedReturns)}</p>
                <p className="text-gray-500 text-xs mt-0.5">Expected return</p>
                {rec.allocation && (
                  <p className="text-gray-400 text-xs mt-2">Allocation: {rec.allocation}%</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'View Stocks',     path: '/stocks',       icon: BarChart2, color: 'text-blue-400' },
          { label: 'Mutual Funds',    path: '/mutual-funds', icon: TrendingUp, color: 'text-emerald-400' },
          { label: 'AI Chatbot',      path: '/chatbot',      icon: Zap,       color: 'text-purple-400' },
          { label: 'News & Sentiment',path: '/news',         icon: Star,      color: 'text-gold-400' },
        ].map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className="glass-card p-4 text-left hover:border-gray-600 transition-all group"
          >
            <action.icon className={`w-5 h-5 ${action.color} mb-2 group-hover:scale-110 transition-transform`} />
            <p className="text-sm text-gray-300 font-medium">{action.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
