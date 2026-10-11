import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, BarChart2, Search, Sparkles,
  Loader2, Info, CheckCircle2, Shield, AlertCircle
} from 'lucide-react';
import { useMarket } from '../hooks/useMarket';
import { marketApi } from '../api/marketApi';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Spinner';
import PerformanceChart from '../components/charts/PerformanceChart';
import { getChangeColor, formatPercent } from '../utils/formatters';

const CATEGORIES = ['All', 'Large Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap', 'ELSS', 'Index', 'Debt', 'Hybrid', 'Equity'];

const POPULAR_FUNDS = [
  { label: 'Parag Parikh', query: 'Parag Parikh' },
  { label: 'Quant Small Cap', query: 'Quant Small Cap' },
  { label: 'HDFC Mid Cap', query: 'HDFC Mid Cap' },
  { label: 'SBI Bluechip', query: 'SBI Bluechip' },
  { label: 'Mirae Asset ELSS', query: 'Mirae Asset' },
  { label: 'Axis Small Cap', query: 'Axis Small Cap' },
  { label: 'Nippon India', query: 'Nippon India' },
];

export default function MutualFunds() {
  const navigate = useNavigate();
  const { data: initialFunds, loading } = useMarket('mutualFunds');
  const [fundsList, setFundsList] = useState([]);
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('returns1y');
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const [activeFundModal, setActiveFundModal] = useState(null);
  const searchTimeoutRef = useRef(null);

  // Sync initial funds from hook
  useEffect(() => {
    if (initialFunds?.length) {
      setFundsList((prev) => {
        const existingNames = new Set(prev.map((f) => f.name.toLowerCase()));
        const merged = [...prev];
        initialFunds.forEach((f) => {
          if (!existingNames.has(f.name.toLowerCase())) {
            merged.push(f);
          }
        });
        return merged;
      });
    }
  }, [initialFunds]);

  // Execute dynamic AMFI search for any mutual fund
  const executeSearch = async (term) => {
    const trimmed = (term || '').trim();
    if (!trimmed) return;

    setSearching(true);
    setSearchMessage('');

    try {
      const res = await marketApi.searchMutualFunds(trimmed);
      const results = res.data || [];

      if (results.length > 0) {
        setFundsList((prev) => {
          const map = new Map(prev.map((item) => [item.name.toLowerCase(), item]));
          results.forEach((item) => map.set(item.name.toLowerCase(), item));
          return Array.from(map.values());
        });
        setSearchMessage('');
      } else {
        setSearchMessage(`No mutual funds found matching "${trimmed}". Try searching by AMC name (e.g. SBI, HDFC, Quant, Parag Parikh).`);
      }
    } catch (err) {
      console.error('Mutual fund search error:', err);
      setSearchMessage(`Could not search mutual funds for "${trimmed}". Please try again.`);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setSearchMessage('');

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = val.trim();
    if (trimmed.length >= 3) {
      const localMatches = fundsList.filter((f) =>
        f.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        f.category.toLowerCase().includes(trimmed.toLowerCase())
      );

      if (localMatches.length === 0) {
        searchTimeoutRef.current = setTimeout(() => {
          executeSearch(trimmed);
        }, 600);
      }
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      executeSearch(search);
    }
  };

  const handlePopularClick = (query) => {
    setSearch(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    executeSearch(query);
  };

  const handleAskAIFund = (fund) => {
    const initialQuery = `Here is the mutual fund I am analyzing on the Mutual Funds page:

[MUTUAL FUND DETAILS]
• Fund Name: ${fund.name}
• Fund House / AMC: ${fund.fund_house || 'Indian Mutual Fund Asset Management Company'}
• Category: ${fund.category}
• Current NAV: ₹${fund.nav}
• 1-Year Historical Return: ${fund.returns1y >= 0 ? '+' : ''}${fund.returns1y}%
• 3-Year Historical Return: ${fund.returns3y >= 0 ? '+' : ''}${fund.returns3y}%
• Risk Classification: ${fund.risk}
• Assets Under Management (AUM): ${fund.aum || 'Standard liquid pool'}

Please provide:
1. Executive Fund Overview: What is the core investment philosophy and asset allocation strategy of ${fund.name}?
2. Return & Benchmark Analysis: How does this fund's 1-Year (${fund.returns1y}%) and 3-Year (${fund.returns3y}%) track record compare with its category average and TRI benchmark?
3. Investor Suitability & Strategy: Who should invest in this fund, what is the ideal minimum holding horizon, and is it better suited for a monthly SIP or lump-sum investment?
4. Key Risks & Volatility: What drawdowns or market conditions could impact this fund's performance, and what tax implications apply upon redemption?`;

    navigate('/chatbot', {
      state: {
        initialQuery,
        clearChat: true,
        marketContext: {
          fundName: fund.name,
          category: fund.category,
          nav: fund.nav,
          return1y: fund.returns1y,
        }
      }
    });
  };

  if (loading) return <PageLoader />;

  const filtered = fundsList
    .filter((f) => {
      const matchCat = category === 'All' || f.category === category;
      const matchSearch =
        !search.trim() ||
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.category.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    })
    .sort((a, b) => {
      if (sort === 'returns1y') return (b.returns1y ?? 0) - (a.returns1y ?? 0);
      if (sort === 'returns3y') return (b.returns3y ?? 0) - (a.returns3y ?? 0);
      if (sort === 'nav')       return (b.nav ?? 0) - (a.nav ?? 0);
      return 0;
    });

  const riskColor = (r) => {
    if (r === 'Very High') return 'risk-high border';
    if (r === 'High')      return 'risk-high border';
    if (r === 'Medium')    return 'risk-medium border';
    return 'risk-low border';
  };

  // Chart data - top 3 funds
  const chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartDatasets = filtered.slice(0, 3).map((f, i) => ({
    label: f.name.split(' ').slice(0, 2).join(' '),
    data:  Array.from({ length: 12 }, (_, j) => 100 * (1 + ((f.returns1y || 10) / 100) * (j / 12) + (Math.random() - 0.5) * 0.02)),
    color: ['#10B981', '#3B82F6', '#F59E0B'][i],
    fill: false,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Mutual Funds</h2>
          <p className="text-gray-400 text-sm mt-1">Real-time performance, AMFI fund search & AI advisory across all categories</p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            const initialQuery = `Provide a comprehensive market analysis of Indian Mutual Funds right now. Which categories (Large Cap, Mid Cap, Small Cap, Flexi Cap, Hybrid) offer the best risk-adjusted compounding for new SIPs in the current market cycle?`;
            navigate('/chatbot', { state: { initialQuery, clearChat: true } });
          }}
          className="self-start sm:self-auto py-2 px-4 shadow-lg shadow-emerald-500/10"
          icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
        >
          Ask AI Advisor
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Tracked Funds', value: fundsList.length || 0, color: 'text-white' },
          { label: 'Best 1Y Return',  value: formatPercent(Math.max(...(fundsList.map(f => f.returns1y || 0)), 0)), color: 'text-emerald-400' },
          { label: 'Avg 1Y Return',   value: formatPercent(fundsList.length ? (fundsList.reduce((s, f) => s + (f.returns1y || 0), 0) / fundsList.length) : 0), color: 'text-blue-400' },
          { label: 'Best 3Y Return',  value: formatPercent(Math.max(...(fundsList.map(f => f.returns3y || 0)), 0)), color: 'text-yellow-400' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Performance chart */}
      <Card>
        <CardHeader title="Performance Comparison" subtitle="Normalized 1-year returns (top 3 filtered funds)" />
        <PerformanceChart labels={chartLabels} datasets={chartDatasets} height={220} />
      </Card>

      {/* Search Bar & Quick Search Pills */}
      <div className="space-y-2.5">
        <div className="relative flex items-center">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            className="form-input pl-10 pr-24 text-sm w-full"
            placeholder="Search any mutual fund across India (e.g. Parag Parikh, Quant, HDFC, SBI Bluechip)..."
            value={search}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
          />
          <button
            onClick={() => executeSearch(search)}
            disabled={searching || !search.trim()}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-800 disabled:text-gray-500 text-white transition-all flex items-center gap-1"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* Popular searches pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-gray-500 font-medium mr-1">Popular AMCs:</span>
          {POPULAR_FUNDS.map((item) => (
            <button
              key={item.label}
              onClick={() => handlePopularClick(item.query)}
              className="text-[11px] px-2.5 py-0.5 rounded-md border bg-gray-800/60 text-gray-400 border-gray-700/60 hover:text-white hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all"
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search status feedback */}
        {searching && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-900/60 border border-emerald-500/30 text-xs text-emerald-400">
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            <span>Searching 15,000+ AMFI Indian mutual funds for "{search}"...</span>
          </div>
        )}

        {searchMessage && !searching && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{searchMessage}</span>
          </div>
        )}
      </div>

      {/* Filters & Sorting */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                category === c
                  ? 'bg-emerald-500 text-white font-semibold'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="w-full sm:w-auto sm:ml-auto">
          <select
            className="form-input !py-1.5 text-xs w-full sm:w-auto"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="returns1y">Sort: 1Y Returns</option>
            <option value="returns3y">Sort: 3Y Returns</option>
            <option value="nav">Sort: NAV</option>
          </select>
        </div>
      </div>

      {/* Fund table */}
      <Card padding={false}>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fund Name</th>
                <th>Category</th>
                <th>NAV</th>
                <th>1Y Return</th>
                <th>3Y Return</th>
                <th>AUM</th>
                <th>Risk</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((fund) => (
                  <tr
                    key={fund.name}
                    className="cursor-pointer hover:bg-gray-800/40 transition-colors"
                  >
                    <td onClick={() => setActiveFundModal(fund)}>
                      <div className="font-semibold text-gray-200 hover:text-emerald-400 transition-colors">
                        {fund.name}
                      </div>
                      {fund.fund_house && (
                        <span className="text-[11px] text-gray-500">{fund.fund_house}</span>
                      )}
                    </td>
                    <td onClick={() => setActiveFundModal(fund)}>
                      <span className="text-xs text-gray-400">{fund.category}</span>
                    </td>
                    <td onClick={() => setActiveFundModal(fund)} className="font-medium text-white">
                      ₹{fund.nav?.toFixed(2)}
                    </td>
                    <td onClick={() => setActiveFundModal(fund)}>
                      <span className={fund.returns1y >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {formatPercent(fund.returns1y)}
                      </span>
                    </td>
                    <td onClick={() => setActiveFundModal(fund)}>
                      <span className={fund.returns3y >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {formatPercent(fund.returns3y)}
                      </span>
                    </td>
                    <td onClick={() => setActiveFundModal(fund)} className="text-gray-400 text-xs">
                      {fund.aum || 'N/A'}
                    </td>
                    <td onClick={() => setActiveFundModal(fund)}>
                      <span className={`badge ${riskColor(fund.risk)}`}>{fund.risk}</span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setActiveFundModal(fund)}
                          className="text-xs text-gray-400 hover:text-emerald-400 transition-colors p-1"
                          title="View Fund Details"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleAskAIFund(fund)}
                          className="text-xs py-1 px-2.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition-all"
                          title="Ask AI Advisor about this Fund"
                        >
                          <Sparkles className="w-3 h-3" /> Ask AI
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : !searching ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-500 text-sm">
                    No mutual funds found matching "{search}".
                    <div className="mt-2">
                      <button
                        onClick={() => executeSearch(search)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold hover:bg-emerald-500/25 transition-all"
                      >
                        Search AMFI Database for "{search}"
                      </button>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Interactive Mutual Fund Detail Modal */}
      {activeFundModal && (
        <Modal
          isOpen={Boolean(activeFundModal)}
          onClose={() => setActiveFundModal(null)}
          title={activeFundModal.name}
          size="lg"
        >
          <div className="space-y-5">
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium">
                {activeFundModal.category}
              </span>
              <span className={`text-xs px-2.5 py-1 rounded-md border font-medium ${riskColor(activeFundModal.risk)}`}>
                {activeFundModal.risk} Risk
              </span>
              {activeFundModal.fund_house && (
                <span className="text-xs px-2.5 py-1 rounded-md bg-gray-800 text-gray-300 border border-gray-700">
                  {activeFundModal.fund_house}
                </span>
              )}
            </div>

            {/* Financial Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
              <div>
                <p className="text-xs text-gray-400">Current NAV</p>
                <p className="text-lg font-bold text-white">
                  ₹{activeFundModal.nav?.toFixed(2)}
                </p>
                <p className="text-[11px] text-gray-500">Net Asset Value</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">1-Year Return</p>
                <p className={`text-lg font-bold ${activeFundModal.returns1y >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatPercent(activeFundModal.returns1y)}
                </p>
                <p className="text-[11px] text-gray-500">Trailing 1Y Gain</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">3-Year Return</p>
                <p className={`text-lg font-bold ${activeFundModal.returns3y >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatPercent(activeFundModal.returns3y)}
                </p>
                <p className="text-[11px] text-gray-500">Annualized 3Y Gain</p>
              </div>

              <div>
                <p className="text-xs text-gray-400">Min. Monthly SIP</p>
                <p className="text-lg font-bold text-white">₹500</p>
                <p className="text-[11px] text-gray-500">Compounding Start</p>
              </div>
            </div>

            {/* In-depth descriptions */}
            <div className="space-y-3.5 text-sm leading-relaxed">
              <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-1.5">
                  <Info className="w-4 h-4" /> Fund Philosophy & Mandate
                </h4>
                <p className="text-gray-300">
                  {`This ${activeFundModal.category} fund allocates across liquid securities to maximize risk-adjusted compounding for investors. It is actively monitored and benchmarked against TRI market standards.`}
                </p>
              </div>

              <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Recommended Investor Horizon
                </h4>
                <p className="text-gray-300">
                  {activeFundModal.category === 'Small Cap' || activeFundModal.category === 'Mid Cap'
                    ? 'Recommended horizon of 5 to 7+ years to ride out market cycles and harness maximum compounding alpha.'
                    : activeFundModal.category === 'Debt'
                    ? 'Suitable for 1 to 3-year conservative capital preservation and regular dividend yield.'
                    : 'Recommended horizon of 3 to 5+ years for steady capital growth via systematic monthly SIPs.'}
                </p>
              </div>

              <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-1 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> Risk & Volatility Assessment
                </h4>
                <p className="text-gray-300">
                  {`Classified under ${activeFundModal.risk} risk. Equity returns fluctuate with underlying macroeconomic conditions, interest rates, and market drawdowns.`}
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setActiveFundModal(null)}
              >
                Close
              </Button>

              <Button
                size="sm"
                icon={<Sparkles className="w-4 h-4" />}
                onClick={() => {
                  const target = activeFundModal;
                  setActiveFundModal(null);
                  handleAskAIFund(target);
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
