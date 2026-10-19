import { useNavigate } from 'react-router-dom';
import { Shield, RefreshCw, ArrowRight, Info, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import { useFinancialProfile } from '../hooks/useFinancialProfile';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import RiskGauge from '../components/charts/RiskGauge';
import { RiskBadge } from '../components/ui/Badge';
import { formatCurrency, formatDate } from '../utils/formatters';

const RISK_DESCRIPTIONS = {
  LOW: {
    title: 'Conservative Investor',
    desc:  'You prefer capital preservation over growth. You are comfortable with lower returns in exchange for minimal risk and volatility.',
    color: 'emerald',
    recommendations: ['Fixed Deposits', 'Government Bonds', 'Debt Mutual Funds', 'Gold ETFs'],
  },
  CONSERVATIVE: {
    title: 'Conservative Investor',
    desc:  'You prefer capital preservation over growth. You are comfortable with lower returns in exchange for minimal risk and volatility.',
    color: 'emerald',
    recommendations: ['Fixed Deposits', 'Government Bonds', 'Debt Mutual Funds', 'Gold ETFs'],
  },
  MEDIUM: {
    title: 'Balanced Investor',
    desc:  'You seek a balance between growth and stability. You can tolerate moderate market fluctuations to achieve reasonable returns over time.',
    color: 'yellow',
    recommendations: ['Large Cap Funds', 'Balanced Advantage Funds', 'Corporate Bonds', 'Blue-Chip Stocks'],
  },
  MODERATE: {
    title: 'Balanced Investor',
    desc:  'You seek a balance between growth and stability. You can tolerate moderate market fluctuations to achieve reasonable returns over time.',
    color: 'yellow',
    recommendations: ['Large Cap Funds', 'Balanced Advantage Funds', 'Corporate Bonds', 'Blue-Chip Stocks'],
  },
  HIGH: {
    title: 'Growth Investor',
    desc:  'You prioritize long-term capital appreciation. You are comfortable with significant short-term volatility in pursuit of higher returns.',
    color: 'orange',
    recommendations: ['Mid & Small Cap Funds', 'Sectoral Funds', 'Direct Equity', 'REITs'],
  },
  AGGRESSIVE: {
    title: 'Aggressive Investor',
    desc:  'You seek maximum returns and can withstand extreme market volatility. Your long time horizon allows for high-risk investments.',
    color: 'red',
    recommendations: ['Small Cap Stocks', 'Crypto Assets', 'Options Trading', 'International Funds'],
  },
  VERY_HIGH: {
    title: 'Aggressive Investor',
    desc:  'You seek maximum returns and can withstand extreme market volatility. Your long time horizon allows for high-risk investments.',
    color: 'red',
    recommendations: ['Small Cap Stocks', 'Crypto Assets', 'Options Trading', 'International Funds'],
  },
};

const FACTOR_WEIGHTS = {
  age:                  { label: 'Age Factor',            weight: 25 },
  investmentExperience: { label: 'Experience Level',       weight: 20 },
  riskTolerance:        { label: 'Stated Risk Tolerance',  weight: 20 },
  timeHorizonYears:     { label: 'Investment Horizon',     weight: 20 },
  debtToIncomeRatio:    { label: 'Debt-to-Income Ratio',   weight: 15 },
};

function getFactorScore(profile, key) {
  if (!profile) return 50;
  if (key === 'age') {
    const age = profile.age;
    if (age < 30) return 80;
    if (age < 45) return 60;
    if (age < 60) return 40;
    return 20;
  }
  if (key === 'investmentExperience') {
    const m = { BEGINNER: 20, INTERMEDIATE: 50, ADVANCED: 75, EXPERT: 90 };
    return m[profile.investmentExperience] || 50;
  }
  if (key === 'riskTolerance') {
    const m = { CONSERVATIVE: 20, MODERATE: 55, AGGRESSIVE: 90 };
    return m[profile.riskTolerance] || 50;
  }
  if (key === 'timeHorizonYears') {
    const y = profile.timeHorizonYears;
    if (y <= 3)  return 20;
    if (y <= 7)  return 50;
    if (y <= 15) return 75;
    return 90;
  }
  if (key === 'debtToIncomeRatio') {
    const d = parseFloat(profile.debtToIncomeRatio);
    if (d <= 20) return 80;
    if (d <= 40) return 55;
    if (d <= 60) return 30;
    return 15;
  }
  return 50;
}

export default function RiskAssessment() {
  const { profile, loading } = useFinancialProfile();
  const navigate = useNavigate();

  if (loading) return <PageLoader />;

  const level    = profile?.predictedRiskLevel?.toUpperCase() || 'MODERATE';
  const config   = RISK_DESCRIPTIONS[level] || RISK_DESCRIPTIONS.MODERATE;
  const confidence = profile?.currentRiskConfidence || 0;
  const topRiskDrivers = profile?.topRiskDrivers || profile?.top_risk_drivers;

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Risk Assessment</h2>
          <p className="text-gray-400 text-sm mt-1">AI-powered analysis of your risk profile</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/financial-profile')}
          icon={<RefreshCw className="w-4 h-4" />}
        >
          Update Profile
        </Button>
      </div>

      {!profile ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Shield className="w-16 h-16 text-gray-700" />
            <h3 className="text-lg font-semibold text-gray-300">No Profile Found</h3>
            <p className="text-gray-500 text-sm text-center max-w-sm">
              Complete your financial profile to get your personalized risk assessment.
            </p>
            <Button onClick={() => navigate('/financial-profile')}>
              Complete Financial Profile
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Main risk card */}
          <div className="grid lg:grid-cols-2 gap-6">
            <Card gradient>
              <CardHeader title="Your Risk Profile" subtitle={`Last updated: ${formatDate(profile.updatedAt)}`} />
              <div className="flex flex-col items-center">
                <RiskGauge level={level} confidence={confidence} />
                {config && (
                  <div className="mt-4 text-center">
                    <h3 className="text-xl font-bold text-white">{config.title}</h3>
                    <RiskBadge level={level} />
                    <p className="text-sm text-gray-400 mt-3 leading-relaxed">{config.desc}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Factor breakdown */}
            <Card>
              <CardHeader title="Risk Factors" subtitle="How your profile is scored" />
              <div className="space-y-4">
                {Object.entries(FACTOR_WEIGHTS).map(([key, info]) => {
                  const score = getFactorScore(profile, key);
                  const color = score > 65 ? 'bg-emerald-500' : score > 35 ? 'bg-yellow-500' : 'bg-red-500';
                  return (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-gray-400">{info.label}</span>
                        <span className="text-gray-300">{score}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full">
                        <div
                          className={`h-1.5 ${color} rounded-full transition-all duration-500`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <p className="text-xs text-gray-600">
                      Scores above 65% indicate higher risk capacity. The ML model weighs these factors to predict your optimal risk level.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Financial summary */}
          <Card>
            <CardHeader title="Financial Profile Summary" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Annual Income',  value: formatCurrency(profile.annualIncome) },
                { label: 'Age',            value: `${profile.age} years` },
                { label: 'Time Horizon',   value: `${profile.timeHorizonYears} years` },
                { label: 'Debt Ratio',     value: profile.debtToIncomeRatio ? `${parseFloat(profile.debtToIncomeRatio).toFixed(1)}%` : '—' },
              ].map((s) => (
                <div key={s.label} className="bg-gray-800/30 rounded-xl p-4 text-center">
                  <p className="text-lg font-bold text-white">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* SHAP Feature Importance & Non-Causal Risk Drivers (Gap 4) */}
          {topRiskDrivers && topRiskDrivers.length > 0 && (
            <Card className="border-emerald-500/30 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
              <CardHeader
                title="Model Explainability & Key Risk Drivers (SHAP)"
                subtitle="Local statistical feature attribution from TreeExplainer with suitability guardrails"
              />
              <div className="space-y-3">
                {topRiskDrivers.map((driver, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-gray-800/40 border border-gray-700/60 flex items-start gap-3"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      driver.impact === 'positive'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {driver.impact === 'positive' ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm text-white capitalize">
                          {driver.feature?.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                          driver.impact === 'positive'
                            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                        }`}>
                          SHAP: {driver.shap_value > 0 ? `+${driver.shap_value?.toFixed(2)}` : driver.shap_value?.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                        {driver.reason}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recommendations */}
          {config && (
            <Card>
              <CardHeader
                title="Recommended Asset Classes"
                subtitle="Based on your risk profile"
                action={
                  <Button size="sm" onClick={() => navigate('/recommendations')}>
                    Get Full Plan <ArrowRight className="w-4 h-4" />
                  </Button>
                }
              />
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {config.recommendations.map((rec) => (
                  <div
                    key={rec}
                    className="bg-gray-800/30 border border-gray-700/50 rounded-xl p-4 hover:border-emerald-500/30 transition-colors"
                  >
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mb-3" />
                    <p className="text-sm font-medium text-gray-200">{rec}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
