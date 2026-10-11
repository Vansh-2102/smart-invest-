import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Bitcoin, Sparkles, Search,
  ShieldAlert, Info, AlertTriangle, ArrowUpRight, CheckCircle2,
  Percent, ExternalLink
} from 'lucide-react';
import { useMarket } from '../hooks/useMarket';
import { marketApi } from '../api/marketApi';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Spinner';
import PerformanceChart from '../components/charts/PerformanceChart';
import { getChangeColor, formatPercent } from '../utils/formatters';

const QUICK_PROMPTS = [
  { label: '🇮🇳 Indian Crypto Tax (Flat 30% + 1% TDS)', query: 'Explain Indian taxation on Virtual Digital Assets (VDAs) under Section 115BBH and Section 194S: flat 30% tax (+ 4% cess) on gross gains, strict prohibition on setting off losses against other crypto or income, 1% TDS on every transfer, and ITR reporting requirements.' },
  { label: '₿ Bitcoin Macro & Halving Cycle', query: 'Provide a macroeconomic analysis of Bitcoin (BTC): post-halving supply reduction, spot Bitcoin ETF net institutional inflows, mining hash rate security, and cyclical multi-year price trajectory.' },
  { label: '🛡️ Cold Wallet vs Exchange Custody', query: 'Compare self-custody cold hardware wallets (Ledger, Trezor, BitBox) versus keeping crypto on FIU-IND registered Indian exchanges (CoinDCX, WazirX) and international exchanges (Binance). What are the key counterparty, regulatory, and recovery risks?' },
  { label: '📊 Safe Allocation (< 5% Rule)', query: 'Why do financial advisors recommend limiting cryptocurrency exposure to strictly under 5% of net liquid wealth? How should an Indian investor balance Bitcoin (BTC), Ethereum (ETH), and high-beta altcoins while managing extreme drawdown risk?' },
];

const POPULAR_TOKENS = ['All', 'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'DOGE', 'ADA'];

export default function Crypto() {
  const navigate = useNavigate();
  const { data: cryptos, loading } = useMarket('crypto');
  const [selected, setSelected]    = useState(null);
  const [chartData, setChartData]  = useState(null);
  const [search, setSearch]        = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [activeCoinModal, setActiveCoinModal] = useState(null);

  useEffect(() => {
    if (!cryptos?.length) return;
    if (!selected) {
      setSelected(cryptos[0]);
      marketApi.getCryptoChart(cryptos[0].symbol).then((r) => setChartData(r.data));
    }
  }, [cryptos, selected]);

  const handleSelect = async (coin) => {
    setSelected(coin);
    setChartData(null);
    const r = await marketApi.getCryptoChart(coin.symbol);
    setChartData(r.data);
  };

  if (loading) return <PageLoader />;

  // Filter list
  const filteredCryptos = (cryptos || []).filter((c) => {
    const matchesSearch =
      !search.trim() ||
      c.symbol.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      activeFilter === 'All' || c.symbol.toUpperCase() === activeFilter.toUpperCase();
    return matchesSearch && matchesFilter;
  });

  // Ask AI Overview
  const handleAskAICryptoOverview = () => {
    const initialQuery = `Please provide an executive Cryptocurrency and Digital Assets advisory for Indian investors:
1. Current Market Regime: Analyze overall crypto sentiment, Bitcoin dominance (~52%), institutional adoption, and macro liquidity conditions.
2. Indian Regulatory & Tax Framework: Breakdown of Section 115BBH (30% flat tax + 4% cess on profits, NO deduction for expenses/losses) and Section 194S (1% TDS on sell/transfer).
3. Portfolio Sizing & Risk Management: Why retail investors must cap crypto to 1-5% of net worth to withstand 70-80% cyclical drawdowns.
4. Core vs Speculative Allocation: Recommended ratio between blue chips (BTC, ETH) versus speculative Layer 1 / altcoin tokens.`;

    navigate('/chatbot', { state: { initialQuery, clearChat: true } });
  };

  // Ask AI for specific coin
  const handleAskAICoin = (coin) => {
    const targetCoin = coin || selected;
    if (!targetCoin) return;

    const initialQuery = `Here is the cryptocurrency I am analyzing on the Crypto page:

[CRYPTOCURRENCY METRICS]
• Token Name: ${targetCoin.name} (${targetCoin.symbol})
• Current Price: ₹${targetCoin.price?.toLocaleString('en-IN')}
• 24h Price Change: ${targetCoin.change24h >= 0 ? '+' : ''}${targetCoin.change24h}%
• 24h High: ₹${targetCoin.high24h?.toLocaleString('en-IN')}
• 24h Low: ₹${targetCoin.low24h?.toLocaleString('en-IN')}
• Market Capitalization: ${targetCoin.mcap}
• 24h Trading Volume: ${targetCoin.volume}

Please provide:
1. Technical & Momentum Assessment: Analyze current price action, support/resistance zones, and 24h volatility.
2. Fundamental Utility & Tokenomics: What problem does ${targetCoin.name} solve, what is its consensus mechanism, and how is token supply managed?
3. Risk & Drawdown Warning: What are the primary risk factors (regulatory, technological, competition, liquidity)?
4. Indian Tax Calculation: If an Indian investor realizes a ₹1,00,000 gain on ${targetCoin.symbol}, calculate the exact 30% tax, 4% cess, and 1% TDS deductions.`;

    navigate('/chatbot', {
      state: {
        initialQuery,
        clearChat: true,
        marketContext: {
          coin: targetCoin.symbol,
          name: targetCoin.name,
          price: targetCoin.price,
        }
      }
    });
  };

  // Ask AI specifically for Tax Guide
  const handleAskAITaxGuide = () => {
    const initialQuery = `I need a complete practical guide to Indian Cryptocurrency and VDA Taxation for the current financial year:
1. Flat 30% Tax (Section 115BBH): How is it calculated on profits, and why is no deduction (except cost of acquisition) allowed?
2. No Set-Off Rule: Explain with examples why crypto losses on one coin cannot be set off against gains from another coin or salary/business income.
3. 1% TDS (Section 194S): How does TDS work on Indian exchanges vs foreign decentralized / P2P platforms?
4. Crypto Airdrops, Staking & Mining: How are staking rewards and airdropped tokens taxed in India?
5. Compliance & ITR Filing: Which specific ITR form (ITR-2 or ITR-3) and VDA reporting schedule must be filed to avoid tax notices?`;

    navigate('/chatbot', { state: { initialQuery, clearChat: true } });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30">
              <Bitcoin className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Cryptocurrency</h2>
              <p className="text-gray-400 text-sm">Real-time crypto prices, on-chain metrics, Indian taxation & AI advisory</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleAskAITaxGuide}
            className="py-2 px-3 text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
            icon={<Percent className="w-3.5 h-3.5 text-purple-400" />}
          >
            Ask AI 30% Tax Guide
          </Button>

          <Button
            size="sm"
            onClick={handleAskAICryptoOverview}
            className="py-2 px-4 shadow-lg shadow-purple-500/10 border-purple-500/30 text-purple-200 hover:bg-purple-500/20"
            icon={<Sparkles className="w-4 h-4 text-purple-400" />}
          >
            Ask AI Crypto Advisor
          </Button>
        </div>
      </div>

      {/* Quick Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
          <Sparkles className="w-3 h-3 text-purple-400" /> Suggested Prompts:
        </span>
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => navigate('/chatbot', { state: { initialQuery: p.query, clearChat: true } })}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-gray-800/80 hover:bg-purple-500/10 border border-gray-700 hover:border-purple-500/30 text-gray-300 hover:text-purple-300 transition-all cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Market Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cryptos Tracked',  value: cryptos?.length || 0, color: 'text-white' },
          { label: 'BTC Dominance',    value: '52.3%',              color: 'text-yellow-400' },
          { label: 'Top Gainer (24h)', value: cryptos?.length ? formatPercent(Math.max(...cryptos.map(c => c.change24h))) : '--', color: 'text-emerald-400' },
          { label: 'Top Loser (24h)',  value: cryptos?.length ? formatPercent(Math.min(...cryptos.map(c => c.change24h))) : '--', color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center border border-purple-500/10">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Indian Crypto Tax Callout Banner */}
      <div className="p-4 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent border border-purple-500/25 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 border border-purple-500/30">
            <Percent className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">Indian VDA Crypto Tax Notice (Sec 115BBH & 194S)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Statutory Rule
              </span>
            </div>
            <p className="text-xs text-gray-300 mt-1 max-w-3xl leading-relaxed">
              Crypto gains in India attract a <strong>flat 30% tax (+ 4% cess)</strong> without indexation. No deduction is permitted except the original acquisition cost. Losses from one token <strong>cannot</strong> be offset against profits from another. A <strong>1% TDS</strong> applies to all sell transfers exceeding ₹50,000 annually.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={handleAskAITaxGuide}
          className="flex-shrink-0 py-2 px-3 text-xs border-purple-500/30 text-purple-300 hover:bg-purple-500/15"
          icon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}
        >
          Ask AI Tax Analysis
        </Button>
      </div>

      {/* Main Grid: Search & Coin List (Left) + Detail Panel (Right) */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coin List & Search */}
        <div className="space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search crypto (BTC, ETH, Solana...)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input text-xs pl-9 pr-8 w-full py-2"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {POPULAR_TOKENS.map((token) => (
              <button
                key={token}
                onClick={() => {
                  setActiveFilter(token);
                  if (token !== 'All') {
                    const match = (cryptos || []).find(c => c.symbol.toUpperCase() === token.toUpperCase());
                    if (match) handleSelect(match);
                  }
                }}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all flex-shrink-0 cursor-pointer ${
                  activeFilter === token
                    ? 'bg-purple-600 text-white font-semibold'
                    : 'bg-gray-800/60 hover:bg-gray-700/60 text-gray-400 hover:text-gray-200'
                }`}
              >
                {token}
              </button>
            ))}
          </div>

          {/* List of Coins */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filteredCryptos.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-xs">
                No cryptocurrency matching "{search}"
              </div>
            ) : (
              filteredCryptos.map((coin) => (
                <div
                  key={coin.symbol}
                  onClick={() => handleSelect(coin)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                    selected?.symbol === coin.symbol
                      ? 'border-purple-500/40 bg-purple-500/10 shadow-md shadow-purple-500/5'
                      : 'border-gray-800/60 hover:border-gray-700 bg-gray-900/30'
                  }`}
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-full flex items-center justify-center text-xs font-bold text-purple-300 flex-shrink-0 border border-purple-500/20">
                    {coin.symbol.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-200">{coin.symbol}</p>
                    <p className="text-xs text-gray-500 truncate">{coin.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">₹{coin.price.toLocaleString('en-IN')}</p>
                    <div className={`flex items-center justify-end gap-0.5 text-xs ${getChangeColor(coin.change24h)}`}>
                      {coin.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {formatPercent(coin.change24h)}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAskAICoin(coin);
                    }}
                    title={`Ask AI about ${coin.name}`}
                    className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition-all flex-shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <>
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-3 mb-4 border-b border-gray-800 gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-2xl font-bold text-white">{selected.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30">
                        {selected.symbol}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-extrabold text-white">₹{selected.price.toLocaleString('en-IN')}</span>
                      <span className={`text-sm font-semibold ${getChangeColor(selected.change24h)}`}>
                        {formatPercent(selected.change24h)} (24h)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setActiveCoinModal(selected)}
                      className="text-xs py-1.5 px-3"
                    >
                      Tokenomics & Risk
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAskAICoin(selected)}
                      className="text-xs py-1.5 px-3 border-purple-500/30 text-purple-200 hover:bg-purple-500/20"
                      icon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}
                    >
                      Ask AI about {selected.symbol}
                    </Button>
                  </div>
                </div>

                {chartData ? (
                  <PerformanceChart
                    labels={chartData.labels}
                    datasets={[{ data: chartData.prices, color: '#8B5CF6', fill: true }]}
                    height={200}
                  />
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-gray-600 text-sm">
                    Loading live chart...
                  </div>
                )}
              </Card>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Market Cap',  value: selected.mcap },
                  { label: '24h Volume',  value: selected.volume },
                  { label: '24h High',    value: `₹${selected.high24h?.toLocaleString('en-IN')}` },
                  { label: '24h Low',     value: `₹${selected.low24h?.toLocaleString('en-IN')}` },
                  { label: '24h Volatility', value: formatPercent(selected.change24h) },
                  { label: 'Tax on Exit', value: 'Flat 30% + 1% TDS' },
                ].map((s) => (
                  <div key={s.label} className="glass-card p-3.5 border border-gray-800/80">
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className="text-white font-semibold text-sm">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Interactive AI Prompt Trigger Bar */}
              <div className="p-3.5 bg-gray-800/40 border border-gray-700/60 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <p className="text-xs text-gray-300">
                    Want to know if <strong>{selected.name}</strong> is in a bull cycle or overbought?
                  </p>
                </div>
                <button
                  onClick={() => handleAskAICoin(selected)}
                  className="text-xs font-semibold text-purple-300 hover:text-purple-200 hover:underline flex items-center gap-1 flex-shrink-0"
                >
                  Ask AI Now <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* High Risk Disclaimer */}
              <div className="p-3.5 bg-red-500/10 border border-red-500/25 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-300 leading-relaxed">
                  <strong>Risk Disclosure:</strong> Crypto assets are unbacked by sovereign guarantees, unregulated by SEBI or RBI, and subject to extreme market volatility. Never invest emergency funds or borrowed money into cryptocurrency.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Tokenomics & Risk Modal */}
      {activeCoinModal && (
        <Modal
          isOpen={!!activeCoinModal}
          onClose={() => setActiveCoinModal(null)}
          title={`${activeCoinModal.name} (${activeCoinModal.symbol}) - Risk & Metrics`}
          size="md"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
              <div>
                <p className="text-xs text-purple-300">Current Market Price</p>
                <p className="text-xl font-bold text-white">₹{activeCoinModal.price.toLocaleString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">24-Hour Range</p>
                <p className="text-xs text-gray-200">
                  ₹{activeCoinModal.low24h?.toLocaleString('en-IN')} - ₹{activeCoinModal.high24h?.toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <span className="text-gray-400 block mb-1">Market Capitalization:</span>
                <span className="text-white font-semibold">{activeCoinModal.mcap}</span>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <span className="text-gray-400 block mb-1">24h Trading Volume:</span>
                <span className="text-white font-semibold">{activeCoinModal.volume}</span>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <span className="text-gray-400 block mb-1">Indian Tax Classification:</span>
                <span className="text-purple-300 font-semibold">Virtual Digital Asset (VDA)</span>
              </div>
              <div className="p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                <span className="text-gray-400 block mb-1">Applicable Tax Rate:</span>
                <span className="text-red-400 font-semibold">Flat 30% + 4% Cess + 1% TDS</span>
              </div>
            </div>

            <div className="p-3 bg-gray-800/40 border border-gray-700/40 rounded-xl text-xs space-y-1">
              <span className="font-semibold text-gray-300">Custodial Best Practice:</span>
              <p className="text-gray-400">
                For holdings valued over ₹1,00,000, consider transferring tokens from centralized exchanges to non-custodial cold storage hardware wallets to prevent platform insolvency risk.
              </p>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setActiveCoinModal(null)}>
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const coin = activeCoinModal;
                  setActiveCoinModal(null);
                  handleAskAICoin(coin);
                }}
                className="border-purple-500/30 text-purple-200 hover:bg-purple-500/15"
                icon={<Sparkles className="w-3.5 h-3.5 text-purple-400" />}
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

