import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  TrendingUp, Shield, BarChart2, Gem, Landmark, Sparkles, ArrowRight,
  ArrowLeft, Info, CheckCircle2, AlertTriangle, HelpCircle, Layers,
  Calculator, Zap, Clock, DollarSign, PieChart, RefreshCw, ChevronRight,
  Sliders, Calendar, Scale, Activity
} from 'lucide-react';
import { useRecommendations } from '../hooks/useRecommendations';
import { useFinancialProfile } from '../hooks/useFinancialProfile';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { PageLoader } from '../components/ui/Spinner';
import { RiskBadge } from '../components/ui/Badge';
import { formatCurrency, formatPercent } from '../utils/formatters';

// Comprehensive educational knowledge base for the 4 core asset classes
const ASSET_CLASSES_DATA = {
  equities: {
    id: 'equities',
    aliases: ['stocks', 'equities', 'high-growth equities', 'equities & stocks', 'high_growth_equities', 'direct stocks'],
    name: 'High-Growth Equities',
    categoryLabel: 'High-Growth Equities',
    tagline: 'Ownership in market-leading public corporations driving technological and economic expansion',
    icon: BarChart2,
    color: 'emerald',
    badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    riskLevel: 'HIGH',
    typicalReturn: 16.2,
    defaultAllocationPercent: 35.0,
    description:
      'High-Growth Equities represent direct fractional ownership in profitable blue-chip enterprises and high-beta market leaders. Over multi-year cycles, equities historically outperform all other asset classes by capturing corporate earnings growth, pricing power, and global technological compounding.',
    benefits: [
      'Maximum long-term wealth compounding (historically 12-16% annualized CAGR).',
      'Dividend cashflows and corporate share buybacks delivering direct shareholder yield.',
      'Ownership in secular market monopolies (cloud computing, AI hardware, consumer tech, private banking).',
      'High liquidity with instant electronic settlement on major stock exchanges (NSE, BSE, NYSE).'
    ],
    risks: [
      'Short-term price volatility; drawdowns of 15-30% are normal during economic recessions.',
      'Company-specific operational or management governance risks.',
      'Emotional vulnerability to panic-selling at market bottoms without a disciplined plan.'
    ],
    considerations: [
      'Recommended minimum investment time horizon: 5 to 7+ years.',
      'Indian Taxation: 20% Short-Term Capital Gains (STCG < 12m), 12.5% Long-Term Capital Gains (LTCG > 12m, with ₹1.25L annual exemption).',
      'Never allocate short-term emergency funds into direct equity.'
    ],
    lumpSumPros: 'Captures full equity exposure immediately. Historically, broad equities rise in ~73% of 1-year periods, making early full deployment statistically favorable in long horizons.',
    lumpSumCons: 'High regret risk if an unforeseen market correction occurs immediately after buying at a cyclical peak.',
    phasedPros: 'Deploys capital systematically across 3-12 months (Tranche SIP / STP), averaging down cost if prices dip while un-deployed cash earns interest in a liquid fund.',
    phasedCons: 'Cash drag: If the stock market rallies strongly without looking back, phased investing buys at progressively higher prices.'
  },
  funds: {
    id: 'funds',
    aliases: ['mutual_funds', 'mutualfunds', 'growth etfs & funds', 'index & mutual funds', 'growth_etfs_funds', 'funds', 'etf'],
    name: 'Growth ETFs & Funds',
    categoryLabel: 'Growth ETFs & Funds',
    tagline: 'Professionally diversified baskets of top corporate performers with low expense ratios',
    icon: TrendingUp,
    color: 'blue',
    badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    riskLevel: 'MEDIUM',
    typicalReturn: 14.5,
    defaultAllocationPercent: 25.0,
    description:
      'Growth ETFs and Mutual Funds pool your capital with thousands of investors to hold a diversified portfolio of 50 to 100+ vetted companies (such as NIFTY 50, S&P 500, or Nasdaq 100 index funds). This completely eliminates single-company bankruptcy risk while matching broader market wealth generation.',
    benefits: [
      'Instant diversification: A single investment unit gives you exposure across 10+ industries.',
      'Low expense ratios (0.05% to 0.40% for index ETFs) maximizing net compounding.',
      'Self-cleansing mechanism: Failing companies are automatically removed and replaced by top performers.',
      'Regulated by statutory financial authorities (SEBI / SEC) with strict fiduciary mandates.'
    ],
    risks: [
      'Systematic market beta: When the broader market declines, index funds decline with it.',
      'Tracking error between fund performance and underlying benchmark index.',
      'Exit loads if redeemed within specified minimum holding periods (e.g., 15-90 days).'
    ],
    considerations: [
      'Ideal core foundation for both beginners and sophisticated institutional portfolios.',
      'Taxation: 12.5% LTCG after 12 months holding; ELSS mutual funds offer Section 80C tax deductions up to ₹1.5L.',
      'Pair broad market index funds with selective sectoral thematic ETFs for optimal alpha.'
    ],
    lumpSumPros: 'Statistically optimal for broad index funds because market indices trend upward over time due to corporate earnings growth.',
    lumpSumCons: 'Drawdown shock if broad index enters a multi-month consolidation phase.',
    phasedPros: 'Eliminates timing anxiety. Ideal through Systematic Transfer Plans (STP) from a Liquid Fund into an Equity Fund.',
    phasedCons: 'Slightly lower total return during aggressive multi-month bull market breakouts.'
  },
  banking: {
    id: 'banking',
    aliases: ['banking', 'liquid cash & banking', 'fixed deposits & banking', 'liquid_cash_banking', 'fd', 'cash'],
    name: 'Liquid Cash & Banking',
    categoryLabel: 'Liquid Cash & Banking',
    tagline: 'High-safety fixed income, emergency reserves, and guaranteed capital preservation',
    icon: Landmark,
    color: 'cyan',
    badgeColor: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    riskLevel: 'LOW',
    typicalReturn: 7.25,
    defaultAllocationPercent: 20.0,
    description:
      'Liquid Cash & Banking investments encompass contracted bank fixed deposits, recurring deposits, and sovereign treasury bills. This capital acts as the defensive bedrock of your financial fortress, ensuring complete capital preservation, immunity from market crashes, and immediate liquidity for emergencies or opportunistic dip buying.',
    benefits: [
      '100% capital preservation with zero volatility and guaranteed contractual yield.',
      'Insured by RBI DICGC up to ₹5,00,000 per depositor per bank (principal + interest).',
      'Predictable quarterly or cumulative cashflow compounding.',
      'Dry powder buffer ready to deploy into equities during extreme market distress.'
    ],
    risks: [
      'Inflation risk: Post-tax returns often struggle to significantly beat real consumer price inflation.',
      'Opportunity cost: Generates lower long-term wealth compared to equity compounding.',
      'Premature withdrawal penalty (typically 0.5% - 1.0% deduction in interest rate).'
    ],
    considerations: [
      'Senior citizens receive an additional +0.50% to +0.75% preferential interest rate.',
      'Taxation: Interest is taxed as regular income under your applicable income tax slab.',
      'TDS applicable if annual bank interest exceeds ₹40,000 (₹50,000 for senior citizens under Sec 80TTB).'
    ],
    lumpSumPros: 'Locking in fixed deposits upfront is best when central bank repo rates are at cyclical peaks before rate cut cycles begin.',
    lumpSumCons: 'Locks liquidity if unexpected expenses arise or interest rates rise further.',
    phasedPros: 'Creating an FD Ladder (e.g. 1-year, 2-year, 3-year maturities) ensures rolling liquidity and continuous reinvestment flexibility.',
    phasedCons: 'Requires managing multiple deposit receipts and monitoring renewal dates.'
  },
  gold: {
    id: 'gold',
    aliases: ['gold', 'precious metals & gold', 'precious_metals_gold', 'commodities', 'sgb'],
    name: 'Precious Metals & Gold',
    categoryLabel: 'Precious Metals & Gold',
    tagline: 'Time-tested monetary store of value, inflation hedge, and geopolitical shock absorber',
    icon: Gem,
    color: 'amber',
    badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    riskLevel: 'LOW',
    typicalReturn: 9.8,
    defaultAllocationPercent: 10.0,
    description:
      'Gold and precious metals serve as a non-correlated monetary asset that preserves purchasing power across centuries. Gold has an inverse or low correlation to equities: when geopolitical tensions, currency debasement, or stock market crashes occur, gold prices typically rally as central banks and institutional investors flee to safety.',
    benefits: [
      'Proven 5,000-year track record as an unprintable monetary hedge against fiat currency inflation.',
      'Negative correlation with equity drawdowns, providing portfolio stabilization during market crashes.',
      'Sovereign Gold Bonds (SGB) pay a 2.50% annual coupon interest plus 100% tax-free capital gains at maturity.',
      'Gold ETFs offer instant exchange liquidity on NSE/BSE without physical storage or making charge losses.'
    ],
    risks: [
      'Gold produces no cash flows, dividends, or industrial earnings growth on its own.',
      'Can experience multi-year stagnant consolidation periods when real interest rates and economic growth are high.',
      'Physical jewelry carries 8-25% making charges and 3% GST that are permanently lost upon resale.'
    ],
    considerations: [
      'Optimal portfolio allocation: strictly 5% to 10% of total liquid net wealth.',
      'Sovereign Gold Bonds (SGB) offer the highest post-tax return due to the 2.5% annual coupon and capital gains tax exemption.',
      'Gold ETFs are best for tactical asset rebalancing and systemic SIP allocations.'
    ],
    lumpSumPros: 'Effective when acquiring Sovereign Gold Bonds during official RBI primary subscription tranches.',
    lumpSumCons: 'Gold spot prices can be volatile around central bank interest rate announcements and US dollar fluctuations.',
    phasedPros: 'Systematic monthly Gold ETF accumulation smooths entry prices and mitigates short-term commodity price spikes.',
    phasedCons: 'Small brokerage transaction fees on repeated micro-orders.'
  }
};

export default function InvestmentPlanning() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { current, recommendations, loading: recLoading } = useRecommendations();
  const { profile } = useFinancialProfile();

  // Determine active asset from navigation state, query params, or default
  const incomingAsset = location.state?.asset || null;
  const initialAssetParam = searchParams.get('asset') || searchParams.get('category') || 'equities';

  const resolveAssetKey = (identifier) => {
    if (!identifier) return 'equities';
    const clean = identifier.toString().toLowerCase().trim();
    for (const [key, data] of Object.entries(ASSET_CLASSES_DATA)) {
      if (key === clean || data.aliases.some((a) => a === clean || clean.includes(a))) {
        return key;
      }
    }
    return 'equities';
  };

  const [activeAssetKey, setActiveAssetKey] = useState(() => {
    if (incomingAsset?.category) return resolveAssetKey(incomingAsset.category);
    if (incomingAsset?.category_label) return resolveAssetKey(incomingAsset.category_label);
    if (incomingAsset?.name) return resolveAssetKey(incomingAsset.name);
    return resolveAssetKey(initialAssetParam);
  });

  const activeAsset = ASSET_CLASSES_DATA[activeAssetKey] || ASSET_CLASSES_DATA.equities;

  // Sync state if URL param changes
  useEffect(() => {
    const p = searchParams.get('asset') || searchParams.get('category');
    if (p) {
      const resolved = resolveAssetKey(p);
      if (resolved !== activeAssetKey) setActiveAssetKey(resolved);
    }
  }, [searchParams]);

  // Handle switching asset class tabs
  const handleSelectAsset = (key) => {
    setActiveAssetKey(key);
    setSearchParams({ asset: key });
  };

  // Derive dynamic recommended allocation amount & percentage from current portfolio recommendation
  const totalPortfolioCapital = current?.totalInvestmentAmount || 1000000;
  const currentRisk = current?.riskLevel || profile?.predictedRiskLevel || 'MODERATE';

  const { dynamicAllocationAmount, dynamicAllocationPercent } = useMemo(() => {
    // 1. If passed directly via router state
    if (incomingAsset && (incomingAsset.allocation_amount || incomingAsset.amount)) {
      return {
        dynamicAllocationAmount: incomingAsset.allocation_amount || incomingAsset.amount,
        dynamicAllocationPercent: incomingAsset.allocation_percent || incomingAsset.allocation || activeAsset.defaultAllocationPercent
      };
    }

    // 2. Look up in current active recommendation's category_summaries or assetRecommendations
    const assetRecs = current?.assetRecommendations || current?.recommendations || [];
    const matchedRecs = assetRecs.filter((r) => {
      const cat = (r.category || r.type || '').toLowerCase();
      const catLabel = (r.category_label || '').toLowerCase();
      return activeAsset.aliases.some((a) => a === cat || a === catLabel || cat.includes(a));
    });

    if (matchedRecs.length > 0) {
      const totalAmt = matchedRecs.reduce((sum, r) => sum + (r.allocation_amount ?? r.amount ?? 0), 0);
      const totalPct = matchedRecs.reduce((sum, r) => sum + (r.allocation_percent ?? r.allocation ?? 0), 0);
      if (totalAmt > 0) {
        return {
          dynamicAllocationAmount: totalAmt,
          dynamicAllocationPercent: totalPct || activeAsset.defaultAllocationPercent
        };
      }
    }

    // 3. Fallback to asset_class_allocations in current
    const allocations = current?.assetAllocations || current?.asset_class_allocations || {};
    let pct = activeAsset.defaultAllocationPercent;
    if (activeAssetKey === 'equities' && allocations.stocks) pct = allocations.stocks;
    else if (activeAssetKey === 'funds' && allocations.mutualFunds) pct = allocations.mutualFunds;
    else if (activeAssetKey === 'banking' && allocations.banking) pct = allocations.banking;
    else if (activeAssetKey === 'gold' && allocations.gold) pct = allocations.gold;

    const amt = Math.round((totalPortfolioCapital * pct) / 100);
    return {
      dynamicAllocationAmount: amt,
      dynamicAllocationPercent: pct
    };
  }, [incomingAsset, current, activeAsset, activeAssetKey, totalPortfolioCapital]);

  // Interactive Calculator State
  const [customCapital, setCustomCapital] = useState('');
  const [phasedMonths, setPhasedMonths] = useState(6); // 3, 6, 12 months
  const [marketScenario, setMarketScenario] = useState('moderate'); // 'bull', 'moderate', 'volatile'
  const [selectedApproachTab, setSelectedApproachTab] = useState('overview'); // 'overview', 'lumpsum', 'phased', 'simulator'

  // Update calculator capital when active asset allocation changes
  useEffect(() => {
    setCustomCapital(dynamicAllocationAmount.toString());
  }, [dynamicAllocationAmount, activeAssetKey]);

  const capitalToInvest = parseFloat(customCapital) || dynamicAllocationAmount || 100000;

  // Scenario Annual Growth Multipliers for the simulator
  const SCENARIOS = {
    bull: {
      label: 'Bull Market Expansion',
      badge: 'Aggressive Rally',
      color: 'emerald',
      growthRate: activeAsset.typicalReturn * 1.35, // e.g. 16.2% * 1.35 = 21.8%
      liquidRate: 6.5,
      description: 'Markets experience steady upward momentum driven by strong corporate earnings and liquidity inflows.'
    },
    moderate: {
      label: 'Moderate / Baseline Trend',
      badge: 'Realistic Baseline',
      color: 'blue',
      growthRate: activeAsset.typicalReturn, // e.g. 16.2%
      liquidRate: 6.5,
      description: 'Historical average market compounding with standard macroeconomic cyclicality.'
    },
    volatile: {
      label: 'Volatile / Pullback Scenario',
      badge: 'Dip & Rebound',
      color: 'amber',
      growthRate: activeAsset.typicalReturn * 0.45, // lower initial growth with dip
      liquidRate: 6.5,
      description: 'Markets experience sharp initial volatility (-8% to -15% correction) followed by consolidation and recovery.'
    }
  };

  const activeScenarioConfig = SCENARIOS[marketScenario];

  // Mathematical Simulator: Compare Lump-Sum vs. Phased
  const simulationResults = useMemo(() => {
    const P = capitalToInvest;
    const r = activeScenarioConfig.growthRate / 100;
    const rLiquid = activeScenarioConfig.liquidRate / 100;
    const n = phasedMonths;

    // 1. Lump-Sum Outcome: 100% invested from Day 1 for 1 full year
    let lumpSumFinalValue = 0;
    if (marketScenario === 'volatile') {
      // In a volatile dip, lump-sum suffers the early drawdown before recovering
      lumpSumFinalValue = P * (1 + r * 0.7);
    } else {
      lumpSumFinalValue = P * (1 + r);
    }
    const lumpSumProfit = lumpSumFinalValue - P;
    const lumpSumReturnPct = ((lumpSumFinalValue - P) / P) * 100;

    // 2. Phased Deployment (Dollar-Cost Averaging over 'n' months)
    // Monthly tranche = P / n
    // Un-deployed cash sits in a liquid instrument earning rLiquid (6.5% p.a.)
    // During deployment, each tranche gets invested for (12 - month + 1) / 12 of a year
    const monthlyTranche = P / n;
    let phasedAssetEndValue = 0;
    let liquidInterestEarned = 0;
    const schedule = [];

    let remainingCash = P;

    for (let m = 1; m <= n; m++) {
      remainingCash -= monthlyTranche;
      // Monthly interest earned on un-deployed cash
      const monthInterest = remainingCash > 0 ? (remainingCash * (rLiquid / 12)) : 0;
      liquidInterestEarned += monthInterest;

      // Effective holding period for this tranche until end of year
      const holdingMonths = 12 - m + 1;
      const holdingYears = holdingMonths / 12;

      // Price discount factor in volatile scenario: tranches in months 2-4 buy at a discount!
      let effectiveAssetGrowth = r;
      if (marketScenario === 'volatile') {
        if (m === 2 || m === 3 || m === 4) {
          effectiveAssetGrowth = r * 1.5; // Bought the dip! Averaging benefit
        } else {
          effectiveAssetGrowth = r * 0.9;
        }
      }

      const trancheEndValue = monthlyTranche * (1 + effectiveAssetGrowth * holdingYears);
      phasedAssetEndValue += trancheEndValue;

      schedule.push({
        month: m,
        deployed: monthlyTranche,
        totalDeployed: monthlyTranche * m,
        remainingCash: Math.max(0, remainingCash),
        interestEarned: monthInterest,
        trancheGrowth: trancheEndValue - monthlyTranche
      });
    }

    const phasedFinalValue = phasedAssetEndValue + liquidInterestEarned;
    const phasedProfit = phasedFinalValue - P;
    const phasedReturnPct = ((phasedFinalValue - P) / P) * 100;

    const difference = phasedFinalValue - lumpSumFinalValue;
    const winner = difference > 0 ? 'phased' : 'lumpSum';

    return {
      lumpSumFinalValue: Math.round(lumpSumFinalValue),
      lumpSumProfit: Math.round(lumpSumProfit),
      lumpSumReturnPct: lumpSumReturnPct.toFixed(2),
      phasedFinalValue: Math.round(phasedFinalValue),
      phasedProfit: Math.round(phasedProfit),
      phasedReturnPct: phasedReturnPct.toFixed(2),
      liquidInterestEarned: Math.round(liquidInterestEarned),
      difference: Math.round(Math.abs(difference)),
      winner,
      schedule
    };
  }, [capitalToInvest, activeScenarioConfig, phasedMonths, marketScenario]);

  // Ask AI handler with pre-populated educational prompt
  const handleAskAI = (approach) => {
    const prompt = `[INVESTMENT PLANNING & STRATEGY INQUIRY]
Asset Class: ${activeAsset.name}
Recommended Allocation: ${formatCurrency(capitalToInvest)} (${dynamicAllocationPercent.toFixed(1)}% of portfolio)
Investor Risk Tier: ${currentRisk}

Topic: Comparative analysis of Lump-Sum Investment vs. Phased Investment (${phasedMonths}-Month STP / DCA) for ${activeAsset.name}.

Please provide:
1. When is Lump-Sum financially and mathematically superior for ${activeAsset.name}?
2. What are the specific risk-dampening advantages of Phased Investment over ${phasedMonths} months?
3. How does Rupee-Cost Averaging protect me if this asset class experiences an unexpected market correction?
4. What is your final strategic recommendation for my ${currentRisk} risk appetite?`;

    navigate('/chatbot', {
      state: {
        initialQuery: prompt,
        clearChat: true
      }
    });
  };

  if (recLoading) return <PageLoader />;

  const IconComponent = activeAsset.icon;

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xs text-gray-400 hover:text-emerald-400 flex items-center gap-1.5 transition-colors mb-2 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Portfolio Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <IconComponent className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Investment Learning & Planning
              </h1>
              <p className="text-gray-400 text-xs mt-0.5">
                Educational execution strategies, allocation mechanics, and Lump-Sum vs. Phased simulator
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate('/recommendations')}
            icon={<PieChart className="w-3.5 h-3.5" />}
          >
            View Recommendations
          </Button>
          <Button
            size="sm"
            onClick={() => handleAskAI('general')}
            icon={<Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
            className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          >
            Ask AI Advisor
          </Button>
        </div>
      </div>

      {/* Asset Class Selector Switcher */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(ASSET_CLASSES_DATA).map(([key, item]) => {
          const isSelected = activeAssetKey === key;
          const ItemIcon = item.icon;
          return (
            <button
              key={key}
              onClick={() => handleSelectAsset(key)}
              className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between group ${
                isSelected
                  ? 'bg-emerald-500/15 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-800/40'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${
                    isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  <ItemIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                    {item.name}
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    ~{item.typicalReturn}% p.a.
                  </p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-gray-600'}`} />
            </button>
          );
        })}
      </div>

      {/* SECTION A: Asset Overview & Recommended Allocation Header */}
      <Card className="border-emerald-500/20 bg-gradient-to-br from-gray-900 via-gray-900 to-emerald-950/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-gray-800">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${activeAsset.badgeColor}`}>
                {activeAsset.categoryLabel}
              </span>
              <RiskBadge level={activeAsset.riskLevel} />
              <span className="text-xs text-gray-400 font-mono">
                Historical Benchmark: ~{activeAsset.typicalReturn}% CAGR
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">{activeAsset.name}</h2>
            <p className="text-sm text-gray-300 leading-relaxed max-w-3xl">
              {activeAsset.description}
            </p>
          </div>

          {/* Allocation Metric Highlight Box */}
          <div className="bg-gray-900/90 border border-gray-800 rounded-2xl p-4 lg:p-5 flex-shrink-0 min-w-[260px] shadow-xl">
            <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Your Recommended Allocation
            </p>
            <p className="text-3xl font-extrabold text-white mt-1.5">
              {formatCurrency(dynamicAllocationAmount)}
            </p>
            <div className="flex items-center justify-between text-xs text-gray-400 mt-2 pt-2 border-t border-gray-800">
              <span>Portfolio Share:</span>
              <span className="font-bold text-emerald-400">{dynamicAllocationPercent.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
              <span>Target Risk Profile:</span>
              <span className="font-bold text-white uppercase">{currentRisk}</span>
            </div>
          </div>
        </div>

        {/* Benefits, Risks, Considerations Grid */}
        <div className="grid md:grid-cols-3 gap-6 pt-6">
          {/* Benefits */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Potential Benefits
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              {activeAsset.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Risks */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-red-400" /> Major Risks
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              {activeAsset.risks.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                  <span className="leading-relaxed">{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Considerations */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" /> Key Considerations
            </h4>
            <ul className="space-y-2 text-xs text-gray-300">
              {activeAsset.considerations.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                  <span className="leading-relaxed">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      {/* SECTION B: Two Investment Approaches (Lump-Sum vs. Phased) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-400" />
              Two Ways to Deploy Your {formatCurrency(dynamicAllocationAmount)}
            </h3>
            <p className="text-xs text-gray-400">
              Explore how upfront Lump-Sum allocation compares with systematic Phased deployment
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* APPROACH 1: Lump-Sum */}
          <Card className="border-gray-800 hover:border-emerald-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
                    Approach 1
                  </div>
                  <h4 className="text-xl font-bold text-white">Lump-Sum Investment</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    100% upfront allocation deployed immediately on Day 1
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Zap className="w-5 h-5" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800 text-xs text-gray-300 leading-relaxed">
                Deploying <span className="font-bold text-white">{formatCurrency(capitalToInvest)}</span> in a single transaction. This strategy is anchored in academic finance: <span className="italic">"Time in the market beats timing the market."</span>
              </div>

              {/* Pros & Cons */}
              <div className="space-y-3 pt-1">
                <div>
                  <p className="text-xs font-bold text-emerald-400 flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Best Suited When:
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {activeAsset.lumpSumPros}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-amber-400 flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Key Trade-off / Risk:
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {activeAsset.lumpSumCons}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-gray-800/80 flex items-center justify-between">
              <span className="text-xs text-gray-500">Execution Speed: Instant</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleAskAI('lumpSum')}
                className="text-xs py-1 px-3 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                icon={<Sparkles className="w-3 h-3 text-emerald-400" />}
              >
                Discuss Lump-Sum
              </Button>
            </div>
          </Card>

          {/* APPROACH 2: Phased Investment */}
          <Card className="border-gray-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-2">
                    Approach 2
                  </div>
                  <h4 className="text-xl font-bold text-white">Phased Investment (DCA / STP)</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Systematic deployment across 3, 6, or 12 monthly installments
                  </p>
                </div>
                <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Clock className="w-5 h-5" />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-900/80 border border-gray-800 text-xs text-gray-300 leading-relaxed">
                Dividing <span className="font-bold text-white">{formatCurrency(capitalToInvest)}</span> into equal monthly installments of <span className="font-bold text-cyan-400">{formatCurrency(capitalToInvest / phasedMonths)}/month</span>. Un-deployed cash earns interest in a high-yield liquid fund.
              </div>

              {/* Pros & Cons */}
              <div className="space-y-3 pt-1">
                <div>
                  <p className="text-xs font-bold text-cyan-400 flex items-center gap-1 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Best Suited When:
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {activeAsset.phasedPros}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-amber-400 flex items-center gap-1 mb-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Key Trade-off / Risk:
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {activeAsset.phasedCons}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-5 mt-5 border-t border-gray-800/80 flex items-center justify-between">
              <span className="text-xs text-gray-500">Execution Speed: {phasedMonths} Months</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleAskAI('phased')}
                className="text-xs py-1 px-3 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10"
                icon={<Sparkles className="w-3 h-3 text-cyan-400" />}
              >
                Discuss Phased Plan
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* SECTION C: Educational Simulator & Side-by-Side Comparison */}
      <Card className="border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-800">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1.5">
              <Calculator className="w-3 h-3" /> Interactive Planning Simulator
            </div>
            <h3 className="text-lg font-bold text-white">
              Simulate 1-Year Projected Outcomes: Lump-Sum vs. Phased
            </h3>
            <p className="text-xs text-gray-400">
              Adjust investment capital, tranche duration, and market trajectory scenarios to evaluate mathematical outcomes
            </p>
          </div>
        </div>

        {/* Simulator Controls */}
        <div className="grid md:grid-cols-3 gap-4 pt-5 pb-6">
          {/* Capital Input */}
          <div>
            <Input
              label="Investment Capital (₹)"
              type="number"
              min="1000"
              value={customCapital}
              onChange={(e) => setCustomCapital(e.target.value)}
              suffix="₹"
              placeholder="100000"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Defaults to your recommended {formatCurrency(dynamicAllocationAmount)} allocation
            </p>
          </div>

          {/* Phased Tenure Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Phased Duration (Tranches)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setPhasedMonths(m)}
                  className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                    phasedMonths === m
                      ? 'bg-cyan-500 text-white border-cyan-400 shadow-sm'
                      : 'bg-gray-800/80 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {m} Months
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-500 mt-1">
              Deploy {formatCurrency(capitalToInvest / phasedMonths)}/month
            </p>
          </div>

          {/* Market Scenario Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">
              Market Scenario Trajectory
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(SCENARIOS).map(([sKey, sVal]) => (
                <button
                  key={sKey}
                  onClick={() => setMarketScenario(sKey)}
                  className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all text-center truncate ${
                    marketScenario === sKey
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm'
                      : 'bg-gray-800/80 border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'
                  }`}
                >
                  {sKey === 'bull' ? '🐂 Bull' : sKey === 'moderate' ? '⚖️ Neutral' : '🐻 Volatile'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-gray-400 mt-1 truncate">
              {activeScenarioConfig.description}
            </p>
          </div>
        </div>

        {/* Results Comparison Grid */}
        <div className="grid md:grid-cols-2 gap-6 p-5 rounded-2xl bg-gray-900/90 border border-gray-800">
          {/* Lump-Sum Result Box */}
          <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Lump-Sum 1-Year Outcome
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono">
                +{simulationResults.lumpSumReturnPct}%
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500">Projected Portfolio Value</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(simulationResults.lumpSumFinalValue)}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-800/80">
              <span className="text-gray-400">Net Estimated Profit:</span>
              <span className="font-bold text-emerald-400">
                +{formatCurrency(simulationResults.lumpSumProfit)}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Assumes 100% of capital exposed to market growth rate of ~{activeScenarioConfig.growthRate.toFixed(1)}% p.a.
            </p>
          </div>

          {/* Phased Result Box */}
          <div className="p-4 rounded-xl bg-gray-950/60 border border-gray-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                Phased ({phasedMonths}M) 1-Year Outcome
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-mono">
                +{simulationResults.phasedReturnPct}%
              </span>
            </div>
            <div>
              <p className="text-xs text-gray-500">Projected Portfolio Value</p>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(simulationResults.phasedFinalValue)}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-800/80">
              <span className="text-gray-400">Net Estimated Profit:</span>
              <span className="font-bold text-cyan-400">
                +{formatCurrency(simulationResults.phasedProfit)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span>Liquid Interest on Idle Cash:</span>
              <span className="text-gray-300 font-mono">+{formatCurrency(simulationResults.liquidInterestEarned)}</span>
            </div>
          </div>
        </div>

        {/* Verdict & Takeaway Banner */}
        <div className="mt-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Simulation Insight for {activeAsset.name} ({activeScenarioConfig.label}):
              </p>
              <p className="text-xs text-gray-300 mt-0.5">
                {marketScenario === 'bull' && (
                  <span>
                    In a strong bull rally, <strong>Lump-Sum investing</strong> captures full compounding early and leads by <strong>+{formatCurrency(simulationResults.difference)}</strong>.
                  </span>
                )}
                {marketScenario === 'moderate' && (
                  <span>
                    In a steady baseline market, both strategies perform closely. Lump-Sum leads by <strong>+{formatCurrency(simulationResults.difference)}</strong>, while Phased investing cushions emotional volatility.
                  </span>
                )}
                {marketScenario === 'volatile' && (
                  <span>
                    During market dips and volatile swings, <strong>Phased investing</strong> shines by averaging down purchase cost in months 2–4 while generating liquid interest on un-deployed cash!
                  </span>
                )}
              </p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => handleAskAI('verdict')}
            className="text-xs whitespace-nowrap self-start sm:self-auto"
          >
            Ask AI To Analyze This <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Phased Tranche Deployment Schedule Table */}
        <div className="mt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            {phasedMonths}-Month Systematic Tranche Deployment Schedule
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400">
                  <th className="py-2.5 px-3 font-semibold">Tranche Month</th>
                  <th className="py-2.5 px-3 font-semibold">Installment Deployed</th>
                  <th className="py-2.5 px-3 font-semibold">Cumulative Invested</th>
                  <th className="py-2.5 px-3 font-semibold">Un-deployed Liquid Balance</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Liquid Yield Earned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 font-mono">
                {simulationResults.schedule.map((row) => (
                  <tr key={row.month} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-sans text-gray-300 font-medium">Month {row.month}</td>
                    <td className="py-2.5 px-3 text-cyan-400 font-semibold">{formatCurrency(row.deployed)}</td>
                    <td className="py-2.5 px-3 text-white">{formatCurrency(row.totalDeployed)}</td>
                    <td className="py-2.5 px-3 text-gray-400">{formatCurrency(row.remainingCash)}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-400">+{formatCurrency(row.interestEarned)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Assumptions & Educational Disclaimer */}
      <div className="p-4 rounded-xl bg-gray-900/60 border border-gray-800 text-xs text-gray-400 space-y-2">
        <p className="font-semibold text-gray-300 flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-gray-400" /> Educational Assumptions & Risk Disclaimers
        </p>
        <p className="leading-relaxed">
          1. <strong>Simulation Assumptions:</strong> Calculations model historical benchmark asset class CAGRs and assume idle cash yields 6.5% p.a. in a high-yield liquid/arbitrage fund compounded monthly.
        </p>
        <p className="leading-relaxed">
          2. <strong>Non-Transactional Educational Tool:</strong> InvestIQ is an educational intelligence platform. This learning & planning module simulates mathematical allocation models and does not execute real-money trades or provide guaranteed returns. Real market investments are subject to market volatility.
        </p>
      </div>
    </div>
  );
}
