import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star, Zap, Clock, ChevronRight, TrendingUp, Shield, Sparkles,
  MessageSquare, Info, Landmark, BarChart2, Layers, Gem, CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { useRecommendations } from '../hooks/useRecommendations';
import { useFinancialProfile } from '../hooks/useFinancialProfile';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input, { Select } from '../components/ui/Input';
import { PageLoader } from '../components/ui/Spinner';
import ErrorAlert from '../components/ui/ErrorAlert';
import AllocationChart from '../components/charts/AllocationChart';
import { RiskBadge } from '../components/ui/Badge';
import Modal from '../components/ui/Modal';
import { formatCurrency, formatDate, formatPercent } from '../utils/formatters';
import { RISK_LEVELS } from '../utils/constants';

const CATEGORY_ICONS = {
  banking: Landmark,
  stocks: BarChart2,
  mutual_funds: Layers,
  mutualFunds: Layers,
  bonds: Shield,
  gold: Gem,
};

export default function Recommendations() {
  const navigate = useNavigate();
  const { profile } = useFinancialProfile();
  const { recommendations, current, loading, generating, error, generate } = useRecommendations();

  const [form, setForm] = useState({
    riskLevel:        profile?.predictedRiskLevel || '',
    investmentAmount: '1000000',
  });
  const [formError, setFormError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeAssetModal, setActiveAssetModal] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!form.investmentAmount || parseFloat(form.investmentAmount) <= 0) {
      setFormError('Please enter a valid investment amount');
      return;
    }
    setFormError('');
    try {
      await generate(form.riskLevel || undefined, parseFloat(form.investmentAmount));
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleAskAI = (asset) => {
    const totalAmt = current?.totalInvestmentAmount || parseFloat(form.investmentAmount) || 100000;
    const assetAmt = asset.allocation_amount ?? asset.amount ?? 0;
    const allocPct = asset.allocation_percent ?? asset.allocation ?? 0;
    const expRet = asset.expected_return_percent ?? asset.expectedReturn ?? asset['1y_return_percent'] ?? 10;
    const riskLvl = current?.riskLevel || form.riskLevel || profile?.predictedRiskLevel || 'Moderate';
    const annualIncome = profile?.annualIncome ? formatCurrency(profile.annualIncome) : 'Not disclosed';
    const age = profile?.age ? `${profile.age} years` : 'Not disclosed';
    const horizon = profile?.timeHorizonYears ? `${profile.timeHorizonYears} years` : '5-10 years';
    const goal = profile?.investmentGoal ? profile.investmentGoal.replace(/_/g, ' ') : 'Capital Growth & Compounding';
    const experience = profile?.investmentExperience ? profile.investmentExperience.replace(/_/g, ' ') : 'Intermediate';
    const debtRatio = profile?.debtToIncomeRatio ? `${parseFloat(profile.debtToIncomeRatio).toFixed(1)}%` : 'Low';
    const projectedProfit = asset.projected_annual_profit ? formatCurrency(asset.projected_annual_profit) : formatCurrency(assetAmt * (expRet / 100));

    const initialQuery = `Here is my complete investor financial profile and the specific asset recommendation I am reviewing:

[INVESTOR FINANCIAL PROFILE]
• Risk Tolerance Tier: ${riskLvl}
• Total Planned Investment: ${formatCurrency(totalAmt)}
• Annual Income: ${annualIncome}
• Age: ${age}
• Primary Investment Goal: ${goal}
• Investment Time Horizon: ${horizon}
• Investment Experience: ${experience}
• Debt-to-Income Ratio: ${debtRatio}

[SELECTED ASSET TO ANALYZE]
• Asset Name: ${asset.name} (${asset.ticker})
• Asset Class: ${asset.category_label || asset.category}
• Risk Category: ${asset.risk_tier || 'Medium Risk'}
• Portfolio Allocation: ${allocPct}% (${formatCurrency(assetAmt)} out of ${formatCurrency(totalAmt)})
• Expected 1-Year Return: +${expRet}% p.a.
• Projected 1-Year Profit: +${projectedProfit}
• Key Characteristic: ${asset.description || 'Core compounding growth asset'}

Please provide:
1. An executive summary of my investor profile and an assessment of whether this portfolio allocation matches my risk level and financial goals.
2. A clear breakdown of what ${asset.name} is, how it operates, and how it generates wealth.
3. Why this asset was allocated to my portfolio at ${allocPct}%.
4. Growth potential, compounding outlook, and key risks or market downside factors to keep in mind.`;

    navigate('/chatbot', {
      state: {
        initialQuery,
        clearChat: true,
        assetContext: {
          assetName: asset.name,
          ticker: asset.ticker,
          riskLvl
        }
      }
    });
  };

  if (loading) return <PageLoader />;

  const allocations = current?.assetAllocations || current?.asset_class_allocations || {};
  const assetRecs = current?.assetRecommendations || current?.recommendations || [];

  // Calculate profit and scenario metrics
  const totalInvestment = current?.totalInvestmentAmount || 0;
  const projectedProfit = current?.projectedAnnualProfit ?? assetRecs.reduce((sum, r) => {
    const amt = r.allocation_amount ?? r.amount ?? 0;
    const ret = r.expected_return_percent ?? r.expectedReturn ?? r['1y_return_percent'] ?? 10;
    return sum + (r.projected_annual_profit ?? (amt * (ret / 100)));
  }, 0);

  const expectedReturnPct = current?.expectedReturnPercent ?? (totalInvestment > 0 ? ((projectedProfit / totalInvestment) * 100) : 0);

  // Group by categories
  const categoriesMap = {};
  assetRecs.forEach((asset) => {
    const cat = asset.category || asset.type || 'other';
    if (!categoriesMap[cat]) {
      categoriesMap[cat] = {
        key: cat,
        label: asset.category_label || cat.replace('_', ' ').toUpperCase(),
        totalAmount: 0,
        totalPercent: 0,
        totalProfit: 0,
        assets: []
      };
    }
    const amt = asset.allocation_amount ?? asset.amount ?? 0;
    const pct = asset.allocation_percent ?? asset.allocation ?? 0;
    const prof = asset.projected_annual_profit ?? (amt * ((asset.expected_return_percent ?? 10) / 100));

    categoriesMap[cat].totalAmount += amt;
    categoriesMap[cat].totalPercent += pct;
    categoriesMap[cat].totalProfit += prof;
    categoriesMap[cat].assets.push(asset);
  });

  const categoriesList = Object.values(categoriesMap);

  // Filtered assets
  const filteredAssets = selectedCategory === 'ALL'
    ? assetRecs
    : assetRecs.filter((a) => (a.category || a.type) === selectedCategory);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Investment Recommendations</h2>
        <p className="text-gray-400 text-sm mt-1">
          AI-calculated asset scenarios, projected profits, and portfolio diversification
        </p>
      </div>

      {error && <ErrorAlert message={error} />}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Generate Form & History */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader title="Generate Plan" subtitle="Tailor portfolio to budget & risk" />
            <form onSubmit={handleGenerate} className="space-y-4">
              {formError && <ErrorAlert message={formError} onDismiss={() => setFormError('')} />}

              <Select
                label="Risk Tolerance"
                value={form.riskLevel}
                onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}
              >
                <option value="">Auto (from profile: {profile?.predictedRiskLevel || 'Moderate'})</option>
                {RISK_LEVELS.map((r) => (
                  <option key={r} value={r}>{r.replace('_', ' ')}</option>
                ))}
              </Select>

              <Input
                label="Total Investment Amount (₹)"
                type="number"
                placeholder="1000000"
                min="1000"
                value={form.investmentAmount}
                onChange={(e) => setForm({ ...form, investmentAmount: e.target.value })}
                suffix="₹"
              />

              <Button type="submit" fullWidth loading={generating} icon={<Zap className="w-4 h-4" />}>
                {generating ? 'Calculating Scenarios...' : 'Generate Plan'}
              </Button>
            </form>
          </Card>

          {/* History */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader title="Plan History" subtitle={`${recommendations.length} saved portfolios`} />
              <div className="space-y-2">
                {recommendations.slice(0, 5).map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => {}}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      current?.id === rec.id
                        ? 'bg-emerald-500/10 border border-emerald-500/20'
                        : 'hover:bg-gray-800/50 border border-transparent'
                    }`}
                  >
                    <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Star className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate capitalize">
                        {rec.riskLevel?.replace('_', ' ') || 'Auto'}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(rec.createdAt)}
                      </p>
                    </div>
                    <span className="text-xs text-emerald-400 font-semibold">
                      {formatCurrency(rec.totalInvestmentAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Recommendations Results */}
        <div className="lg:col-span-2 space-y-6">
          {current ? (
            <>
              {/* Top Projected Scenario Metrics */}
              <div className="grid sm:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-gray-800">
                  <p className="text-xs text-gray-400 font-medium">Total Capital</p>
                  <p className="text-2xl font-bold text-white mt-1">
                    {formatCurrency(totalInvestment)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <RiskBadge level={current.riskLevel} />
                    <span className="text-xs text-gray-500">Portfolio</span>
                  </div>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-950/40 via-gray-900 to-gray-800 border-emerald-500/20">
                  <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> Projected Annual Profit
                  </p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    +{formatCurrency(projectedProfit)}
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Expected 1-year financial earnings
                  </p>
                </Card>

                <Card className="bg-gradient-to-br from-cyan-950/40 via-gray-900 to-gray-800 border-cyan-500/20">
                  <p className="text-xs text-cyan-400 font-medium flex items-center gap-1">
                    <ArrowUpRight className="w-3.5 h-3.5" /> Expected Annual Return
                  </p>
                  <p className="text-2xl font-bold text-cyan-400 mt-1">
                    +{expectedReturnPct.toFixed(2)}% p.a.
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    Weighted portfolio return
                  </p>
                </Card>
              </div>

              {/* Asset Allocation & Category Performance */}
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Asset Class Distribution</h3>
                    <p className="text-xs text-gray-400">
                      Diversification across Fixed Deposits, Stocks, Mutual Funds, and Gold
                    </p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <AllocationChart allocations={allocations} height={250} />

                  <div className="space-y-2.5">
                    {categoriesList.map((cat) => {
                      const Icon = CATEGORY_ICONS[cat.key] || CATEGORY_ICONS[cat.key.toLowerCase()] || Landmark;
                      const isSelected = selectedCategory === cat.key;
                      const avgReturn = cat.totalAmount > 0 ? ((cat.totalProfit / cat.totalAmount) * 100) : 0;

                      return (
                        <div
                          key={cat.key}
                          onClick={() => setSelectedCategory(isSelected ? 'ALL' : cat.key)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-emerald-500/15 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                              : 'bg-gray-800/40 border-gray-700/40 hover:bg-gray-800/80 hover:border-gray-600'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center text-emerald-400">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-white">{cat.label}</p>
                              <p className="text-xs text-gray-400">
                                {formatCurrency(cat.totalAmount)} ({cat.totalPercent.toFixed(1)}%)
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-emerald-400">
                              +{formatCurrency(cat.totalProfit)}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              +{avgReturn.toFixed(1)}% p.a.
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              {/* Recommended Investments List */}
              <Card>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Recommended Instruments</h3>
                    <p className="text-xs text-gray-400">
                      Click any investment to learn what it is, how it works, or discuss with AI
                    </p>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex flex-wrap gap-1.5 bg-gray-900/60 p-1 rounded-xl border border-gray-800">
                    <button
                      onClick={() => setSelectedCategory('ALL')}
                      className={`px-3 py-1 text-xs rounded-lg transition-all ${
                        selectedCategory === 'ALL'
                          ? 'bg-emerald-500 text-white font-semibold shadow'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      All ({assetRecs.length})
                    </button>
                    {categoriesList.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => setSelectedCategory(c.key)}
                        className={`px-3 py-1 text-xs rounded-lg transition-all ${
                          selectedCategory === c.key
                            ? 'bg-emerald-500 text-white font-semibold shadow'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {c.label.split(' ')[0]} ({c.assets.length})
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredAssets.map((rec, i) => {
                    const risk = rec.risk?.toUpperCase?.() || 'MEDIUM';
                    const allocation = rec.allocation_percent ?? rec.allocation ?? 0;
                    const expectedReturn = rec.expected_return_percent ?? rec.expectedReturn ?? rec['1y_return_percent'] ?? 10;
                    const amount = rec.allocation_amount ?? rec.amount ?? 0;
                    const profit = rec.projected_annual_profit ?? (amount * (expectedReturn / 100));
                    const Icon = CATEGORY_ICONS[rec.category] || CATEGORY_ICONS[rec.type] || Landmark;

                    return (
                      <div
                        key={rec.ticker || rec.name || i}
                        className="p-4 bg-gray-800/40 rounded-xl border border-gray-700/40 hover:border-emerald-500/40 transition-all group"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          {/* Asset Info */}
                          <div className="flex items-start gap-3.5 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center flex-shrink-0 text-emerald-400 group-hover:scale-105 transition-transform">
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-bold text-white text-base truncate">{rec.name || rec.ticker}</p>
                                <span className="text-xs px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 border border-gray-700 font-mono">
                                  {rec.ticker}
                                </span>
                                <RiskBadge level={risk} />
                              </div>
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                                {rec.description || `${rec.category_label || rec.type} providing steady compounding.`}
                              </p>
                            </div>
                          </div>

                          {/* Numbers */}
                          <div className="grid grid-cols-3 gap-4 text-center md:text-right border-t md:border-t-0 pt-3 md:pt-0 border-gray-800">
                            <div>
                              <p className="text-[11px] text-gray-400">Allocation</p>
                              <p className="text-sm font-bold text-white">{allocation}%</p>
                              <p className="text-[11px] text-gray-400">{formatCurrency(amount)}</p>
                            </div>

                            <div>
                              <p className="text-[11px] text-gray-400">Return Rate</p>
                              <p className="text-sm font-bold text-emerald-400">+{expectedReturn}%</p>
                              <p className="text-[11px] text-gray-400">per annum</p>
                            </div>

                            <div>
                              <p className="text-[11px] text-gray-400">Projected Profit</p>
                              <p className="text-sm font-bold text-emerald-400">+{formatCurrency(profit)}</p>
                              <p className="text-[11px] text-gray-400">1-Year Gain</p>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between border-t border-gray-800/60 mt-3 pt-3">
                          <button
                            onClick={() => setActiveAssetModal(rec)}
                            className="text-xs font-semibold text-gray-300 hover:text-emerald-400 flex items-center gap-1 transition-colors"
                          >
                            <Info className="w-3.5 h-3.5" /> What is this & How it works
                          </button>

                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleAskAI(rec)}
                              className="text-xs py-1 px-3 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                              icon={<Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                            >
                              Ask AI
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center">
                  <Star className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-300">No Recommendations Yet</h3>
                <p className="text-gray-500 text-sm text-center max-w-sm">
                  Enter your investment amount and click "Generate Plan" to get personalized AI recommendations.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Interactive Asset Detail Modal */}
      {activeAssetModal && (
        <Modal
          isOpen={Boolean(activeAssetModal)}
          onClose={() => setActiveAssetModal(null)}
          title={`${activeAssetModal.name} (${activeAssetModal.ticker})`}
          size="lg"
        >
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                {activeAssetModal.category_label || activeAssetModal.category || 'Investment'}
              </span>
              <RiskBadge level={activeAssetModal.risk} />
            </div>

            {/* Financial Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
              <div>
                <p className="text-xs text-gray-400">Allocated Amount</p>
                <p className="text-base font-bold text-white">
                  {formatCurrency(activeAssetModal.allocation_amount ?? activeAssetModal.amount ?? 0)}
                </p>
                <p className="text-[11px] text-gray-500">
                  {activeAssetModal.allocation_percent ?? activeAssetModal.allocation}% of portfolio
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Expected Annual Return</p>
                <p className="text-base font-bold text-emerald-400">
                  +{activeAssetModal.expected_return_percent ?? activeAssetModal.expectedReturn ?? 10}%
                </p>
                <p className="text-[11px] text-gray-500">Compounding rate</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Projected 1Y Profit</p>
                <p className="text-base font-bold text-emerald-400">
                  +{formatCurrency(activeAssetModal.projected_annual_profit ?? ((activeAssetModal.allocation_amount ?? 0) * 0.1))}
                </p>
                <p className="text-[11px] text-gray-500">Annual net return</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Market Price / NAV</p>
                <p className="text-base font-bold text-white">
                  ₹{activeAssetModal.current_price?.toFixed(2) || '1,000.00'}
                </p>
                {activeAssetModal.estimated_shares && (
                  <p className="text-[11px] text-gray-500">~{activeAssetModal.estimated_shares} units</p>
                )}
              </div>
            </div>

            {/* In-depth descriptions */}
            <div className="space-y-4 text-sm leading-relaxed">
              <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Info className="w-4 h-4" /> What is this asset?
                </h4>
                <p className="text-gray-300">
                  {activeAssetModal.description || 'A key pillar in your diversified investment portfolio.'}
                </p>
              </div>

              <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> How does it work?
                </h4>
                <p className="text-gray-300">
                  {activeAssetModal.how_it_works || 'Generates periodic income and long-term capital appreciation based on market participation and contractual interest.'}
                </p>
              </div>

              <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-1 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Why was it recommended for you?
                </h4>
                <p className="text-gray-300">
                  {activeAssetModal.why_recommended || 'Selected to optimize risk-adjusted returns while adhering to your specified risk profile.'}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveAssetModal(null)}
              >
                Close
              </Button>

              <Button
                size="sm"
                icon={<Sparkles className="w-4 h-4" />}
                onClick={() => {
                  const asset = activeAssetModal;
                  setActiveAssetModal(null);
                  handleAskAI(asset);
                }}
              >
                Discuss with AI Advisor
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
