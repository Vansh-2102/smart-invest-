import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarket } from '../hooks/useMarket';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Spinner';
import PerformanceChart from '../components/charts/PerformanceChart';
import { formatCurrency, getChangeColor, formatPercent } from '../utils/formatters';
import {
  TrendingUp, TrendingDown, Gem, Sparkles, Shield, Info,
  ArrowUpRight, CheckCircle2, Calculator, AlertCircle, Percent
} from 'lucide-react';

const QUICK_PROMPTS = [
  { label: '🪙 Is Gold at an all-time high?', query: 'Are gold prices currently near historic highs? What are the key macroeconomic drivers (central bank buying, US dollar index, inflation, geopolitical tensions) and what is the outlook for the next 12-24 months?' },
  { label: '📜 SGB vs Gold ETF Tax Comparison', query: 'Compare Sovereign Gold Bonds (SGB) vs Gold ETFs in India from a taxation standpoint: explain the 2.5% annual sovereign interest, capital gains tax rules after the 2024 budget (12.5% for ETFs vs 100% tax exemption for SGB at 8-year maturity), and secondary market trading.' },
  { label: '⚖️ How much gold should I hold?', query: 'What is the recommended portfolio allocation for gold in an Indian retail investor\'s portfolio? How does gold act as an inflation hedge and hedge against equity market drawdowns during market crashes?' },
  { label: '💰 Digital Gold vs Physical Gold', query: 'What are the counterparty risks, spread fees (3% GST + platform margins), holding limits, and regulatory safeguards between Digital Gold (MMTC-PAMP, Augmont) versus Physical Hallmarked 24K Gold?' },
];

const WAYS_TO_INVEST = [
  {
    method: 'Physical Gold',
    pro: 'Tangible asset, zero platform counterparty risk',
    con: 'Storage cost, making charges (8-25%), purity risk',
    liquidity: 'Low to Medium',
    returns: 'Market price - making charges',
    tax: 'Short-term slab rate (<24m) or 12.5% LTCG (>24m)',
    description: 'Gold coins, bars, and traditional jewelry. Best for cultural gifting and long-term tangible holding, but incurs 3% GST and high making charges upon resale.',
    bestFor: 'Long-term family heirloom and tangible security'
  },
  {
    method: 'Gold ETF',
    pro: 'Demat convenience, low tracking error, instant liquidity',
    con: 'Demat account needed, 0.4-0.8% annual expense ratio',
    liquidity: 'Very High (NSE/BSE)',
    returns: 'Tracks domestic 24K spot price',
    tax: '12.5% LTCG if held > 12 months (Post-Budget 2024)',
    description: 'Mutual fund units traded on stock exchanges backed by 99.5% pure physical gold deposited with approved custodians. Highest liquidity and zero storage hassle.',
    bestFor: 'Tactical investors and systematic SIP asset allocators'
  },
  {
    method: 'Sovereign Gold Bond (SGB)',
    pro: '2.5% extra annual interest + 100% TAX-FREE on maturity',
    con: '8-year maturity (exit windows start from year 5)',
    liquidity: 'Medium (Traded on NSE/BSE)',
    returns: 'Spot Gold Appreciation + 2.50% annual interest',
    tax: 'Completely exempt from capital gains tax at 8-year maturity',
    description: 'Government securities issued by RBI denominated in grams of gold. Offers capital appreciation of 24K gold plus 2.50% guaranteed simple interest paid semi-annually directly to bank accounts.',
    bestFor: 'Long-term conservative investors wanting maximum post-tax return'
  },
  {
    method: 'Digital Gold',
    pro: 'Buy from ₹1 anytime via UPI/fintech apps',
    con: 'Unregulated by SEBI/RBI, 3% GST on buy, 3-5% spread',
    liquidity: 'High on platform',
    returns: 'Market price - high buy/sell spread',
    tax: 'Normal capital gains based on holding period',
    description: 'Purchased through payment apps (GPay, PhonePe, Paytm) backed by vault storage partners. Convenient for micro-savings but suffers from high bid-ask spread and lacks statutory SEBI regulation.',
    bestFor: 'Casual micro-investors starting with pocket change'
  },
  {
    method: 'Gold Mutual Fund',
    pro: 'No demat account required, easy automated SIPs',
    con: 'Slightly higher expense ratio (fund of funds layer)',
    liquidity: 'High (T+1/T+2 redemption)',
    returns: '~Market price (invests in underlying Gold ETF)',
    tax: 'Taxed as debt mutual fund / capital gains rules',
    description: 'Fund-of-funds (FoF) that invests units into an underlying Gold ETF. Allows ordinary investors to start a ₹500/month recurring SIP without opening a brokerage demat account.',
    bestFor: 'Mutual fund SIP investors seeking automated asset allocation'
  },
];

export default function Gold() {
  const navigate = useNavigate();
  const { data, loading } = useMarket('gold');
  const [activeModalItem, setActiveModalItem] = useState(null);

  // Simple SGB Simulator State
  const [investGrams, setInvestGrams] = useState('10');
  const [expectedGrowthRate, setExpectedGrowthRate] = useState('8');

  if (loading) return <PageLoader />;
  if (!data)   return null;

  const isUp = data.change >= 0;
  const spotRatePerGram = Math.round(data.spot / 10);
  const gramsNum = parseFloat(investGrams) || 1;
  const growthNum = parseFloat(expectedGrowthRate) || 8;
  const principalAmt = gramsNum * (data.sgbRate ? Math.round(data.sgbRate / 10) : spotRatePerGram);
  const annualInterest = principalAmt * 0.025;
  const totalInterest8Yrs = annualInterest * 8;
  const maturityCapital = principalAmt * Math.pow(1 + growthNum / 100, 8);
  const totalMaturityPayout = maturityCapital + totalInterest8Yrs;

  // Ask AI Handlers
  const handleAskAIGoldOverview = () => {
    const initialQuery = `Please provide an executive Precious Metals and Gold advisory for Indian investors:
1. Macro Drivers: Analyze current Gold spot pricing (₹${data.spot?.toLocaleString('en-IN')} per 10g), COMEX gold trends, and US Dollar Index (DXY) correlation.
2. Central Bank Accumulation: How are RBI and global central bank gold reserves impacting long-term gold demand?
3. SGB vs Gold ETF: Comparative recommendation for Indian tax residents between Sovereign Gold Bonds and listed Gold ETFs post 2024 budget.
4. Portfolio Allocation: What percentage of an overall investment portfolio should be preserved in gold as an inflation hedge and crisis buffer?`;

    navigate('/chatbot', { state: { initialQuery, clearChat: true } });
  };

  const handleAskAISpotPrice = () => {
    const initialQuery = `Here is the current Gold Spot Price data in India:
• Spot Price (per 10g 24K): ₹${data.spot?.toLocaleString('en-IN')}
• 24h Price Change: ${data.change >= 0 ? '+' : ''}${data.change}% (₹${data.changeAmt?.toLocaleString('en-IN')})
• SGB Reference Rate: ₹${data.sgbRate?.toLocaleString('en-IN')} (Interest: ${data.sgbInterest}% p.a.)

Please provide:
1. Technical and Fundamental Valuation: Is domestic gold currently overbought, fair-valued, or in an attractive accumulation range?
2. Currency Factor: How does USD/INR rupee depreciation compound international gold returns for Indian domestic buyers?
3. Short vs Long-term Strategy: Should I accumulate gold in lumpsum or start a weekly/monthly Gold ETF SIP at these levels?`;

    navigate('/chatbot', { state: { initialQuery, clearChat: true } });
  };

  const handleAskAIMethod = (item) => {
    const initialQuery = `I am evaluating the "${item.method}" route for investing in gold:
• Advantages: ${item.pro}
• Disadvantages: ${item.con}
• Liquidity Profile: ${item.liquidity}
• Expected Return Structure: ${item.returns}
• Tax Status: ${item.tax}

Please provide:
1. Deep-dive into how ${item.method} works for Indian investors and hidden fees/costs (GST, expense ratio, spreads, making charges).
2. Complete tax treatment upon redemption/sale and comparison with other gold options.
3. Realistic scenario: Under what specific financial goals is ${item.method} the single best choice?`;

    navigate('/chatbot', { state: { initialQuery, clearChat: true } });
  };

  const handleAskAIETF = (etf) => {
    const initialQuery = `I am evaluating the ${etf.name} on the Indian stock exchange:
• Current NAV: ₹${etf.nav?.toFixed(2)}
• Expense Ratio: ${etf.expense}%
• Underlying Asset: 99.5% Pure Physical Gold Bullion

Please provide:
1. Liquidity & Tracking Error: How closely does ${etf.name} track domestic 24K spot gold prices, and how is its trading volume on NSE/BSE?
2. Comparative Analysis: How does ${etf.name} compare to competing ETFs from Nippon, SBI, HDFC, and ICICI?
3. Tax Rules: What are the holding period and LTCG taxation rules for this Gold ETF after the 2024 Budget amendments?`;

    navigate('/chatbot', { state: { initialQuery, clearChat: true } });
  };

  const handleAskAICalculator = () => {
    const initialQuery = `I ran a Sovereign Gold Bond (SGB) investment simulation with these parameters:
• Investment Quantity: ${gramsNum} grams of 24K Gold
• Initial Principal Investment: ₹${Math.round(principalAmt).toLocaleString('en-IN')}
• Expected Annual Gold Price Appreciation: ${growthNum}% p.a.
• Sovereign Extra Interest: 2.50% p.a. (Total 8-Year Interest: ₹${Math.round(totalInterest8Yrs).toLocaleString('en-IN')})
• Projected Total 8-Year Payout: ₹${Math.round(totalMaturityPayout).toLocaleString('en-IN')}

Please provide:
1. Post-Tax Advantage: Why is this SGB payout 100% tax-free at 8-year maturity compared to equity/debt instruments?
2. Real Return vs Inflation: Will this projected ${growthNum + 2.5}% gross CAGR beat Indian retail inflation over 8 years?
3. Secondary Market Strategy: Should an investor wait for fresh RBI tranches or buy existing SGB series trading at discounts on NSE/BSE?`;

    navigate('/chatbot', { state: { initialQuery, clearChat: true } });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-yellow-500/20 rounded-xl flex items-center justify-center border border-yellow-500/30">
              <Gem className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Gold & Precious Metals</h2>
              <p className="text-gray-400 text-sm">Spot prices, ETFs, Sovereign Gold Bonds & AI Bullion Advisory</p>
            </div>
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleAskAIGoldOverview}
          className="self-start sm:self-auto py-2 px-4 shadow-lg shadow-yellow-500/10 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/20"
          icon={<Sparkles className="w-4 h-4 text-yellow-400" />}
        >
          Ask AI Gold Advisor
        </Button>
      </div>

      {/* Quick Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
          <Sparkles className="w-3 h-3 text-yellow-400" /> Suggested Prompts:
        </span>
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => navigate('/chatbot', { state: { initialQuery: p.query, clearChat: true } })}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-gray-800/80 hover:bg-yellow-500/10 border border-gray-700 hover:border-yellow-500/30 text-gray-300 hover:text-yellow-300 transition-all cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Price Hero */}
      <div className="glass-card p-6 border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 via-yellow-500/5 to-transparent relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-yellow-500/30 shadow-lg shadow-yellow-500/10">
              <Gem className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-yellow-400 uppercase tracking-wider">Domestic 24 Karat Spot</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
                  99.9% Pure
                </span>
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-white">
                  ₹{data.spot.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-gray-400">per 10 grams</span>
                <div className={`flex items-center gap-1 text-sm font-semibold ${getChangeColor(data.change)}`}>
                  {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {formatPercent(data.change)} (₹{data.changeAmt.toLocaleString('en-IN')})
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Per Gram Rate: <strong className="text-white">₹{spotRatePerGram.toLocaleString('en-IN')}</strong> | 8g Sovereign: <strong className="text-white">₹{(spotRatePerGram * 8).toLocaleString('en-IN')}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 lg:pt-0 border-t lg:border-t-0 border-yellow-500/20">
            <div className="bg-gray-900/60 border border-yellow-500/20 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-gray-400">SGB Issue / Ref Rate</p>
              <p className="text-lg font-bold text-yellow-400">₹{data.sgbRate.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-gray-500">per 10g approx</p>
            </div>
            <div className="bg-gray-900/60 border border-emerald-500/20 rounded-xl px-4 py-3 text-center">
              <p className="text-xs text-gray-400">Govt Extra Yield</p>
              <p className="text-lg font-bold text-emerald-400">+{data.sgbInterest}% p.a.</p>
              <p className="text-[10px] text-emerald-500/80">Semi-annual credit</p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleAskAISpotPrice}
              className="py-2.5 px-4 text-xs font-semibold border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/15"
              icon={<Sparkles className="w-3.5 h-3.5 text-yellow-400" />}
            >
              Analyze Gold Price with AI
            </Button>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-2 border-b border-gray-800 gap-2">
          <CardHeader title="Gold Price Trend (30 Days)" subtitle="10g spot price trajectory in INR" />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAskAISpotPrice}
            className="text-xs text-yellow-400 hover:text-yellow-300"
            icon={<Sparkles className="w-3 h-3 text-yellow-400" />}
          >
            Ask AI Momentum Analysis
          </Button>
        </div>
        <PerformanceChart
          labels={data.labels}
          datasets={[{ data: data.prices, color: '#F59E0B', fill: true }]}
          height={220}
        />
      </Card>

      {/* SGB Calculator & Simulator */}
      <div className="glass-card p-5 border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-yellow-400" />
            <div>
              <h3 className="text-base font-bold text-white">Sovereign Gold Bond (SGB) 8-Year Simulator</h3>
              <p className="text-xs text-gray-400">Simulate gold appreciation + guaranteed 2.5% RBI annual interest</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAskAICalculator}
            className="text-xs py-1.5 px-3 border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
            icon={<Sparkles className="w-3 h-3 text-yellow-400" />}
          >
            Ask AI Tax & Return Review
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Gold Quantity to Buy (Grams)</label>
            <input
              type="number"
              min="1"
              value={investGrams}
              onChange={(e) => setInvestGrams(e.target.value)}
              className="form-input text-sm w-full py-2 px-3"
              placeholder="e.g. 10"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Expected Gold Appreciation (% p.a.)</label>
            <input
              type="number"
              step="0.5"
              value={expectedGrowthRate}
              onChange={(e) => setExpectedGrowthRate(e.target.value)}
              className="form-input text-sm w-full py-2 px-3"
              placeholder="e.g. 8"
            />
          </div>
          <div className="md:col-span-2 grid grid-cols-3 gap-2 bg-gray-900/60 border border-gray-800 rounded-xl p-3 text-center">
            <div>
              <p className="text-[11px] text-gray-400">Investment</p>
              <p className="text-sm font-bold text-white">₹{Math.round(principalAmt).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[11px] text-emerald-400">+2.5% Interest (8Y)</p>
              <p className="text-sm font-bold text-emerald-400">+₹{Math.round(totalInterest8Yrs).toLocaleString('en-IN')}</p>
            </div>
            <div>
              <p className="text-[11px] text-yellow-400">Maturity (Tax-Free)</p>
              <p className="text-sm font-bold text-yellow-400">₹{Math.round(totalMaturityPayout).toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ways to invest */}
        <Card>
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-800">
            <CardHeader title="Ways to Invest in Gold" subtitle="Comparison of 5 major instruments in India" />
            <Button
              size="sm"
              variant="ghost"
              onClick={handleAskAIGoldOverview}
              className="text-xs text-yellow-400 hover:text-yellow-300"
              icon={<Sparkles className="w-3 h-3 text-yellow-400" />}
            >
              Ask AI Recommendation
            </Button>
          </div>

          <div className="space-y-3">
            {WAYS_TO_INVEST.map((item) => (
              <div
                key={item.method}
                className="p-3.5 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl border border-gray-700/30 hover:border-yellow-500/30 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-100">{item.method}</p>
                      {item.method === 'Sovereign Gold Bond (SGB)' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                          Highest Post-Tax
                        </span>
                      )}
                      {item.method === 'Gold ETF' && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-medium">
                          Most Liquid
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-400 mt-1">✓ {item.pro}</p>
                    <p className="text-xs text-red-400 mt-0.5">✗ {item.con}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      <strong>Tax:</strong> {item.tax}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-[10px] text-gray-500">Liquidity</p>
                      <p className="text-xs font-semibold text-gray-300">{item.liquidity}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setActiveModalItem(item)}
                        className="p-1 px-2 text-xs rounded bg-gray-700/50 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleAskAIMethod(item)}
                        className="p-1 px-2 text-xs rounded bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 flex items-center gap-1 transition-all"
                      >
                        <Sparkles className="w-3 h-3 text-yellow-400" /> Ask AI
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Gold ETFs & SGB Advantage */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-800">
              <CardHeader title="Gold ETFs" subtitle="Traded on NSE/BSE backed by 99.5% bullion" />
              <span className="text-xs text-gray-500">Real-time NAV</span>
            </div>

            <div className="space-y-3">
              {(data.etfOptions || []).map((etf) => (
                <div
                  key={etf.name}
                  className="flex items-center justify-between p-3.5 bg-gray-800/30 hover:bg-gray-800/50 rounded-xl border border-gray-700/30 hover:border-yellow-500/30 transition-all"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-200">{etf.name}</p>
                    <p className="text-xs text-gray-500">Annual Expense: <strong className="text-gray-400">{etf.expense}%</strong></p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">₹{etf.nav.toFixed(2)}</p>
                      <p className="text-[10px] text-gray-500">NAV per unit</p>
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAskAIETF(etf)}
                      className="py-1 px-2.5 text-xs border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/15"
                      icon={<Sparkles className="w-3 h-3 text-yellow-400" />}
                    >
                      Ask AI
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* SGB Info Alert */}
            <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-yellow-400 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-yellow-400" /> SGB Sovereign Advantage
                </p>
                <button
                  onClick={() => handleAskAIMethod(WAYS_TO_INVEST[2])}
                  className="text-xs text-yellow-300 hover:underline flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Ask AI SGB Details
                </button>
              </div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Sovereign Gold Bonds offer domestic gold price appreciation PLUS a guaranteed {data.sgbInterest}% annual interest paid directly to your bank account. If held until the 8-year maturity, the entire capital gain is <strong>100% tax-free</strong> under Section 47(viic) of the Income Tax Act.
              </p>
            </div>
          </Card>

          {/* Allocation Guideline */}
          <div className="p-4 bg-gray-800/40 border border-gray-700/50 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-yellow-400" /> Gold Portfolio Rule of Thumb
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              Financial advisors generally recommend keeping <strong className="text-white">5% to 15%</strong> of your total net liquid wealth in gold. This serves as insurance against hyperinflation, currency devaluation, and major stock market crashes without dragging down long-term equity growth.
            </p>
          </div>
        </div>
      </div>

      {/* Detail Modal for Gold Investment Method */}
      {activeModalItem && (
        <Modal
          isOpen={!!activeModalItem}
          onClose={() => setActiveModalItem(null)}
          title={`Gold Investment: ${activeModalItem.method}`}
          size="md"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-300 leading-relaxed">{activeModalItem.description}</p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <span className="text-gray-400 block mb-1">Key Advantage:</span>
                <span className="text-emerald-400 font-semibold">{activeModalItem.pro}</span>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <span className="text-gray-400 block mb-1">Drawback:</span>
                <span className="text-red-400 font-semibold">{activeModalItem.con}</span>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <span className="text-gray-400 block mb-1">Liquidity:</span>
                <span className="text-white font-semibold">{activeModalItem.liquidity}</span>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <span className="text-gray-400 block mb-1">Best Suited For:</span>
                <span className="text-yellow-400 font-semibold">{activeModalItem.bestFor}</span>
              </div>
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs space-y-1">
              <span className="font-semibold text-yellow-300">Tax Treatment:</span>
              <p className="text-gray-300">{activeModalItem.tax}</p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setActiveModalItem(null)}>
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const item = activeModalItem;
                  setActiveModalItem(null);
                  handleAskAIMethod(item);
                }}
                className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/15"
                icon={<Sparkles className="w-3.5 h-3.5 text-yellow-400" />}
              >
                Ask AI Deep Dive
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

