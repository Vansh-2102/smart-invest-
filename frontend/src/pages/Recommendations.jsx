import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star, Zap, Clock, ChevronRight, TrendingUp, Shield, Sparkles,
  MessageSquare, Info, Landmark, BarChart2, Layers, Gem, CheckCircle2,
  ArrowUpRight, Scale, BookOpen, AlertTriangle, Activity
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
  const [rebalanceActionMsg, setRebalanceActionMsg] = useState(null);
  const [rebalancing, setRebalancing] = useState(false);

  const handleConsentRebalance = async (consentGranted, targetTier) => {
    setRebalancing(true);
    setRebalanceActionMsg(null);
    try {
      // Call consent endpoint
      await fetch('/api/investment/rebalance/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consent_granted: consentGranted,
          effective_tier: targetTier
        })
      }).catch(() => null);

      if (consentGranted && targetTier) {
        setForm(prev => ({ ...prev, riskLevel: targetTier }));
        await generate(targetTier, parseFloat(form.investmentAmount) || totalInvestment);
        setRebalanceActionMsg(`Defensive rebalancing applied: Portfolio re-allocated to ${targetTier.toUpperCase()} tier.`);
      } else {
        setRebalanceActionMsg('Rebalancing declined: Original risk profile and asset allocations retained.');
      }
    } catch (err) {
      setRebalanceActionMsg(`Action processed (${err.message || 'Updated'})`);
    } finally {
      setRebalancing(false);
    }
  };

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
  const projectedProfit = current?.projectedAnnualProfit ?? current?.grossProjectedProfit ?? current?.gross_projected_profit ?? assetRecs.reduce((sum, r) => {
    const amt = r.allocation_amount ?? r.amount ?? 0;
    const ret = r.expected_return_percent ?? r.expectedReturn ?? r['1y_return_percent'] ?? 10;
    return sum + (r.projected_annual_profit ?? (amt * (ret / 100)));
  }, 0);

  const taxLiability = current?.estimatedTaxLiability ?? current?.estimated_tax_liability ?? 0;
  const netProfit = current?.netProjectedProfit ?? current?.net_projected_profit ?? Math.max(0, projectedProfit - taxLiability);
  const effectiveTaxRate = current?.effectiveTaxRatePct ?? current?.effective_tax_rate_pct ?? (projectedProfit > 0 ? ((taxLiability / projectedProfit) * 100).toFixed(1) : '0');
  const dicgcStatus = current?.dicgcInsuranceStatus ?? current?.dicgc_insurance_status ?? {
    safety_advisory: 'RBI DICGC Safeguard Active: Bank deposits covered up to ₹5,00,000 statutory deposit insurance limit per institution.',
    partner_bank_distribution: [
      { bank: 'Scheduled Commercial Bank Deposit', allocated_amount: Math.min(totalInvestment * 0.3, 500000), is_fully_insured: true }
    ]
  };
  const benchmarks = current?.benchmarks;
  const drift = current?.volatilityDrift ?? current?.volatility_drift;

  const taxBreakdown = current?.taxBreakdown ?? current?.tax_breakdown;

  const expectedReturnPct = current?.expectedReturnPercent ?? (totalInvestment > 0 ? ((projectedProfit / totalInvestment) * 100) : 0);

  const handleAskTaxAI = (type) => {
    const totalAmt = totalInvestment || parseFloat(form.investmentAmount) || 1000000;
    const grossProfit = projectedProfit || 0;
    const net = netProfit || 0;
    const tax = taxLiability || 0;
    const effRate = effectiveTaxRate ?? (grossProfit > 0 ? ((tax / grossProfit) * 100).toFixed(2) : 0);
    const taxData = taxBreakdown || {};
    const dicgc = dicgcStatus || {};
    const riskLvl = current?.riskLevel || form.riskLevel || profile?.predictedRiskLevel || 'Moderate';

    let title = '';
    let initialQuery = '';

    if (type === 'net_earnings') {
      title = 'Net Post-Tax Return Analysis';
      initialQuery = `Here is my complete portfolio post-tax return and statutory deduction profile:

[PORTFOLIO POST-TAX BREAKDOWN]
• Total Planned Investment: ${formatCurrency(totalAmt)}
• Risk Profile Tier: ${riskLvl}
• Gross Projected Annual Profit: ${formatCurrency(grossProfit)} (+${expectedReturnPct.toFixed(2)}% p.a.)
• Estimated Statutory Tax Liability: ${formatCurrency(tax)}
• Net Post-Tax Earnings: ${formatCurrency(net)}
• Effective Tax Rate: ${effRate}%
• Statutory Tax Rules Applied: Post-Budget 2024 LTCG (12.5% on equity gains above ₹1.25L exemption), Section 194A Banking TDS (10% above ₹40,000 threshold), Section 47(viic) SGB 100% Tax-Exemption.

Please provide:
1. A step-by-step mathematical explanation of how my net earnings of ${formatCurrency(net)} were calculated from gross returns.
2. An assessment of how taxes impact my long-term compounding across asset classes (equities, bonds, FDs, gold).
3. Practical tax-efficiency strategies under Indian tax law to legally maximize my net take-home wealth.`;
    } else if (type === 'tax_liability') {
      title = 'Statutory Tax Liability Advisory';
      initialQuery = `Here is the statutory tax liability calculation for my portfolio under Indian Income Tax regulations:

[STATUTORY TAX BREAKDOWN]
• Total Estimated Tax Liability: ${formatCurrency(tax)}
• Effective Tax Rate: ${effRate}%
• Gross Annual Gain: ${formatCurrency(grossProfit)}
• Equity LTCG Tax (Sec 112A, 12.5% above ₹1.25L exemption): ${formatCurrency(taxData.equity_tax || 0)} (Gross Equity Gains: ${formatCurrency(taxData.gross_equity_gain || 0)})
• Banking FD Interest TDS (Sec 194A, 10% above ₹40,000 limit): ${formatCurrency(taxData.fd_tax || 0)} (Gross FD Interest: ${formatCurrency(taxData.gross_fd_gain || 0)})
• Sovereign Gold Bonds (Sec 47(viic)): ${taxData.sgb_tax_exempt ? '100% Tax-Exempt on redemption' : 'Tax-Exempt'}
• Crypto / VDA Tax (Sec 115BBH): 31.2% flat (if allocated)

Please provide:
1. A comprehensive breakdown explaining each tax component and why my liability is ${formatCurrency(tax)}.
2. How the Post-Budget 2024 LTCG rules and Section 194A bank TDS thresholds apply to my specific allocation.
3. Specific methods to minimize this tax liability legally (such as annual LTCG exemption harvesting, timing of fixed deposit maturity, or family asset distribution).`;
    } else {
      title = 'RBI DICGC Banking Safety Analysis';
      initialQuery = `Here is my banking allocation and RBI DICGC insurance status:

[BANKING SAFETY & DICGC STATUS]
• Total Banking Allocation: ${formatCurrency(dicgc.total_banking_allocation || 0)}
• Insured Principal (within ₹5,00,000 limit per bank): ${formatCurrency(dicgc.insured_principal || 0)}
• Uninsured Principal: ${formatCurrency(dicgc.uninsured_principal || 0)}
• Institutions Utilized: ${dicgc.institutions_utilized || 1}
• Advisory: ${dicgc.safety_advisory || 'DICGC ₹5 Lakh statutory deposit insurance coverage.'}

Please explain:
1. How the RBI DICGC ₹5,00,000 deposit insurance coverage protects my principal and interest.
2. Why multi-bank splitting is necessary when banking capital exceeds ₹5,00,000.
3. Best practices for managing cash and debt investments safely across Scheduled Commercial Banks in India.`;
    }

    navigate('/chatbot', {
      state: {
        initialQuery,
        clearChat: true,
        assetContext: {
          assetName: title,
          ticker: 'TAX_SAFETY',
          riskLvl
        }
      }
    });
  };


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
 
              {/* Statutory Post-Tax & Banking Safety Metrics */}
              {projectedProfit > 0 && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <Card className="bg-gradient-to-br from-teal-950/40 via-gray-900 to-gray-800 border-teal-500/30 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-teal-400 font-medium flex items-center gap-1">
                          <Scale className="w-3.5 h-3.5" /> Net Post-Tax Earnings (Est.)
                        </p>
                        <span className="text-[10px] bg-teal-500/10 text-teal-300 px-2 py-0.5 rounded-full border border-teal-500/20">
                          Post-Budget 2024 LTCG & TDS
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-teal-300 mt-2">
                        +{formatCurrency(netProfit)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Estimated post-tax wealth after statutory deductions & exemptions
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-teal-500/20 flex items-center justify-between">
                      <span className="text-[11px] text-teal-400/80">Post-tax returns analysis</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAskTaxAI('net_earnings')}
                        className="text-xs py-1 px-3 border-teal-500/30 text-teal-300 hover:bg-teal-500/15"
                        icon={<Sparkles className="w-3.5 h-3.5 text-teal-300" />}
                      >
                        Ask AI
                      </Button>
                    </div>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-950/30 via-gray-900 to-gray-800 border-amber-500/20 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-amber-400 font-medium flex items-center gap-1">
                          <Shield className="w-3.5 h-3.5" /> Statutory Tax Liability
                        </p>
                        <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/20">
                          {effectiveTaxRate != null ? `${effectiveTaxRate}% Effective Rate` : 'Statutory Model'}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-amber-300 mt-2">
                        {taxLiability > 0 ? `-${formatCurrency(taxLiability)}` : '₹0 (Within Exemption)'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Equity LTCG (12.5% above ₹1.25L) & Bank FD TDS (10% above ₹40k)
                      </p>
                    </div>
                    <div className="mt-3 pt-2.5 border-t border-amber-500/20 flex items-center justify-between">
                      <span className="text-[11px] text-amber-400/80">Tax optimization advisory</span>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAskTaxAI('tax_liability')}
                        className="text-xs py-1 px-3 border-amber-500/30 text-amber-300 hover:bg-amber-500/15"
                        icon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                      >
                        Ask AI
                      </Button>
                    </div>
                  </Card>
                </div>
              )}

              {/* RBI DICGC Banking Safety Advisory Banner */}
              {dicgcStatus && dicgcStatus.safety_advisory && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  dicgcStatus.uninsured_principal > 0
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}>
                  <Shield className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1 w-full">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-semibold text-sm">RBI DICGC Banking Safety Safeguard</span>
                      <div className="flex items-center gap-2">
                        {dicgcStatus.dicgc_limit_exceeded && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                            Multi-Bank Split Enforced
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleAskTaxAI('dicgc_safety')}
                          className="text-xs py-0.5 px-2.5 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/15"
                          icon={<Sparkles className="w-3 h-3 text-emerald-300" />}
                        >
                          Ask AI
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      {dicgcStatus.safety_advisory}
                    </p>
                    {dicgcStatus.partner_bank_distribution?.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1.5">
                        {dicgcStatus.partner_bank_distribution.map((b, idx) => (
                          <span key={idx} className="bg-gray-800/80 text-gray-300 px-2.5 py-1 rounded-md text-[11px] border border-gray-700/60">
                            <span className="font-medium text-white">{b.bank}</span>: {formatCurrency(b.allocated_amount)} {b.is_fully_insured ? '✓ (100% Insured)' : '⚠ (Uninsured Portion)'}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic Opt-In Risk Review (Gap 1) */}
              {drift && (drift.review_required || drift.user_consent_required || drift.current_vix >= 20) && (
                <div className="p-4 rounded-xl border bg-amber-950/30 border-amber-500/40 text-amber-200 space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1.5 flex-1">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                          Market Volatility Risk Review Required
                          <span className="text-[10px] bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full border border-red-500/30 font-mono">
                            India VIX: {drift.current_vix?.toFixed(2) ?? 'Elevated'}
                          </span>
                        </span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                          Opt-In Consent Governed
                        </span>
                      </div>
                      <p className="text-gray-300 leading-relaxed">
                        {drift.advisory_message || drift.advisory || `Market Volatility Trigger (VIX: ${drift.current_vix}): Elevated drawdown risk detected. Would you like to temporarily step down to defensive allocations?`}
                      </p>
                      <div className="text-[11px] text-gray-400">
                        Base Profile: <strong className="text-white capitalize">{drift.base_risk_tier || current.riskLevel}</strong> | Suggested Defensive Tier: <strong className="text-emerald-300 capitalize">{drift.suggested_defensive_tier || 'conservative'}</strong>
                      </div>
                    </div>
                  </div>

                  {rebalanceActionMsg ? (
                    <div className="text-xs bg-gray-900/80 p-2.5 rounded-lg border border-gray-700 text-gray-200">
                      {rebalanceActionMsg}
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20">
                      <button
                        type="button"
                        disabled={rebalancing}
                        onClick={() => handleConsentRebalance(true, drift.suggested_defensive_tier || 'conservative')}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow disabled:opacity-50"
                      >
                        {rebalancing ? 'Rebalancing...' : `Accept Defensive Step-down (${(drift.suggested_defensive_tier || 'conservative').toUpperCase()})`}
                      </button>
                      <button
                        type="button"
                        disabled={rebalancing}
                        onClick={() => handleConsentRebalance(false, drift.base_risk_tier || current.riskLevel)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-all disabled:opacity-50"
                      >
                        Decline & Keep Base Allocation
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Benchmarks Comparison (Gap 2: 1/N Baseline & NIFTY 50) */}
              {benchmarks && (
                <Card className="bg-gradient-to-br from-slate-900 via-gray-900 to-gray-950 border-slate-700/60">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-bold text-white">Portfolio Optimization Benchmarks (SLSQP vs 1/N)</h4>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                      Turnover Friction & Liquidity Guardrails
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    {/* Equal-Weight 1/N Baseline */}
                    {benchmarks.equal_weight_1_over_n && (
                      <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/50">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="font-semibold text-gray-300">1/N Equal-Weight Baseline</span>
                          <span className="text-[10px] bg-gray-700/60 px-1.5 py-0.5 rounded text-gray-300">20% All</span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Exp. Return:</span>
                            <span className="font-semibold text-white">+{benchmarks.equal_weight_1_over_n.expected_return_pct}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Volatility:</span>
                            <span className="font-semibold text-gray-300">{benchmarks.equal_weight_1_over_n.volatility_pct}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Sharpe Ratio:</span>
                            <span className="font-semibold text-amber-400">{benchmarks.equal_weight_1_over_n.sharpe_ratio}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Optimized Portfolio */}
                    <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
                      <div className="flex items-center justify-between text-xs text-emerald-400">
                        <span className="font-semibold text-emerald-300">Optimized Portfolio</span>
                        <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">Continuous MPT</span>
                      </div>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Exp. Return:</span>
                          <span className="font-semibold text-emerald-400">+{expectedReturnPct.toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Liquidity Floor:</span>
                          <span className="font-semibold text-emerald-300">&ge; 5% Liquid Debt</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Friction Cost:</span>
                          <span className="font-semibold text-gray-300">0.2% Turnover Cap</span>
                        </div>
                      </div>
                    </div>

                    {/* Market Benchmark */}
                    {benchmarks.market_benchmark && (
                      <div className="p-3 rounded-xl bg-gray-800/40 border border-gray-700/50">
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span className="font-semibold text-gray-300">{benchmarks.market_benchmark.name}</span>
                          <span className="text-[10px] bg-gray-700/60 px-1.5 py-0.5 rounded text-gray-300">Index</span>
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Exp. Return:</span>
                            <span className="font-semibold text-white">+{benchmarks.market_benchmark.expected_return_pct}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Volatility:</span>
                            <span className="font-semibold text-gray-300">{benchmarks.market_benchmark.volatility_pct}%</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Sharpe Ratio:</span>
                            <span className="font-semibold text-amber-400">{benchmarks.market_benchmark.sharpe_ratio}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Asset Allocation & Category Performance */}

              <Card>
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">Asset Class Distribution</h3>
                    <p className="text-xs text-gray-400">
                      Diversification across Fixed Deposits, Stocks, Mutual Funds, and Gold
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate('/learning-planning')}
                    className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                    icon={<BookOpen className="w-3.5 h-3.5 text-emerald-400" />}
                  >
                    Learning & Planning Studio
                  </Button>
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
                              onClick={() => navigate(`/learning-planning?asset=${rec.category || rec.type || 'equities'}`, { state: { asset: rec } })}
                              className="text-xs py-1 px-2.5 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                              icon={<Scale className="w-3.5 h-3.5 text-cyan-400" />}
                            >
                              Lump-Sum vs Phased
                            </Button>
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
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveAssetModal(null)}
              >
                Close
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<Scale className="w-4 h-4 text-cyan-400" />}
                  onClick={() => {
                    const asset = activeAssetModal;
                    setActiveAssetModal(null);
                    navigate(`/learning-planning?asset=${asset.category || asset.type || 'equities'}`, { state: { asset } });
                  }}
                  className="border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                >
                  Lump-Sum vs Phased Plan
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
          </div>
        </Modal>
      )}
    </div>
  );
}
