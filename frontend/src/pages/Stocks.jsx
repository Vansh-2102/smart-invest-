import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TrendingUp, TrendingDown, Sparkles, Loader2, Globe, AlertCircle } from 'lucide-react';
import { useMarket } from '../hooks/useMarket';
import { marketApi } from '../api/marketApi';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import PerformanceChart from '../components/charts/PerformanceChart';
import { getChangeColor, formatPercent } from '../utils/formatters';

const SECTORS = ['All', 'IT', 'Banking', 'Energy', 'Finance', 'Infra', 'Auto', 'Technology'];

const POPULAR_SEARCHES = [
  { label: 'Apple', symbol: 'AAPL' },
  { label: 'Tesla', symbol: 'TSLA' },
  { label: 'Nvidia', symbol: 'NVDA' },
  { label: 'Microsoft', symbol: 'MSFT' },
  { label: 'SBI', symbol: 'SBIN' },
  { label: 'ITC', symbol: 'ITC' },
  { label: 'Zomato', symbol: 'ZOMATO' },
];

export default function Stocks() {
  const navigate = useNavigate();
  const { data: initialStocks, loading } = useMarket('stocks');
  const [stocksList, setStocksList] = useState([]);
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All');
  const [sort, setSort] = useState('mcap');
  const [selected, setSelected] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState('');
  const searchTimeoutRef = useRef(null);

  // Sync initial stocks from hook
  useEffect(() => {
    if (initialStocks?.length) {
      setStocksList((prev) => {
        const existingSymbols = new Set(prev.map((s) => s.symbol));
        const merged = [...prev];
        initialStocks.forEach((s) => {
          if (!existingSymbols.has(s.symbol)) {
            merged.push(s);
          }
        });
        return merged;
      });

      if (!selected) {
        const first = initialStocks[0];
        setSelected(first);
        marketApi.getStockChart(first.symbol).then((r) => setChartData(r.data));
      }
    }
  }, [initialStocks]);

  const handleSelect = async (stock) => {
    setSelected(stock);
    setChartData(null);
    try {
      const r = await marketApi.getStockChart(stock.symbol);
      setChartData(r.data);
    } catch (err) {
      console.error('Error fetching stock chart:', err);
    }
  };

  // Perform dynamic search on the backend for ANY stock (e.g. apple, tesla, sbin, etc.)
  const executeSearch = async (term) => {
    const trimmed = (term || '').trim();
    if (!trimmed) return;

    setSearching(true);
    setSearchMessage('');

    try {
      const res = await marketApi.searchStocks(trimmed);
      const results = res.data || [];

      if (results.length > 0) {
        // Add newly found stocks to the active list without duplicates
        setStocksList((prev) => {
          const prevMap = new Map(prev.map((item) => [item.symbol, item]));
          results.forEach((item) => prevMap.set(item.symbol, item));
          return Array.from(prevMap.values());
        });

        // Automatically select the first match
        const topMatch = results[0];
        setSelected(topMatch);
        setChartData(null);
        marketApi.getStockChart(topMatch.symbol).then((r) => setChartData(r.data));
        setSearchMessage('');
      } else {
        setSearchMessage(`No stock found for "${trimmed}". Try searching by ticker (e.g., AAPL, TSLA, NVDA, SBIN, ITC).`);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchMessage(`Could not retrieve data for "${trimmed}". Please verify the symbol.`);
    } finally {
      setSearching(false);
    }
  };

  // Handle typing with debounced auto-search if not found locally
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearch(val);
    setSearchMessage('');

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const trimmed = val.trim();
    if (trimmed.length >= 2) {
      // Check if local matches exist
      const localMatches = stocksList.filter(
        (s) =>
          s.name.toLowerCase().includes(trimmed.toLowerCase()) ||
          s.symbol.toLowerCase().includes(trimmed.toLowerCase())
      );

      // If no local matches, auto-trigger live market search after 600ms
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

  const handlePopularClick = (symbol) => {
    setSearch(symbol);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    executeSearch(symbol);
  };

  const handleAskAIStock = (stock) => {
    const curr = stock.currency === 'USD' ? '$' : '₹';
    const initialQuery = `Here is the stock I am analyzing on the Stocks page:

[STOCK FINANCIAL DATA]
• Stock Name: ${stock.name} (${stock.symbol})
• Current Price: ${curr}${stock.price?.toLocaleString()} (${stock.change >= 0 ? '+' : ''}${stock.change}% today)
• Sector: ${stock.sector || 'General'}
• Market Cap: ${stock.mcap || 'N/A'}
• Valuation (P/E Ratio): ${stock.pe || 'N/A'}
• Currency / Exchange: ${stock.currency || 'INR'}

Please provide:
1. Executive Company Breakdown: What does ${stock.name} do, its core revenue drivers, and primary market competitors?
2. Technical & Valuation Assessment: Is the current valuation (P/E of ${stock.pe}) fair, undervalued, or stretched relative to its historical multiples and sector peers?
3. Growth Catalysts & Headwinds: Key technological, operational, or macroeconomic factors that could propel or hinder this stock over the next 1-3 years.
4. Strategic Investment Takeaway: Actionable guidance on whether this stock fits into a long-term compounding portfolio, value portfolio, or momentum strategy.`;

    navigate('/chatbot', {
      state: {
        initialQuery,
        clearChat: true,
        marketContext: {
          stockName: stock.name,
          symbol: stock.symbol,
          price: stock.price,
          change: stock.change,
        }
      }
    });
  };

  if (loading) return <PageLoader />;

  // Filter stocks by sector and search query
  const filtered = stocksList
    .filter((s) => {
      const matchSector = sector === 'All' || s.sector === sector || (sector === 'IT' && s.sector === 'Technology');
      const matchSearch =
        !search.trim() ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.symbol.toLowerCase().includes(search.toLowerCase());
      return matchSector && matchSearch;
    })
    .sort((a, b) => {
      if (sort === 'change') return b.change - a.change;
      return 0;
    });

  const currencySymbol = (selected?.currency === 'USD' || selected?.symbol === 'AAPL' || selected?.symbol === 'TSLA' || selected?.symbol === 'NVDA' || selected?.symbol === 'MSFT') ? '$' : '₹';

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Stocks</h2>
          <p className="text-gray-400 text-sm mt-1">Real-time equities & technical charting across Indian and Global markets</p>
        </div>

        {selected && (
          <Button
            size="sm"
            onClick={() => handleAskAIStock(selected)}
            className="self-start sm:self-auto py-2 px-4 shadow-lg shadow-emerald-500/10"
            icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
          >
            Ask AI about {selected.symbol}
          </Button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Stock Search & List */}
        <div className="space-y-4">
          {/* Search bar with instant Search button */}
          <div className="relative flex items-center">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              className="form-input pl-9 pr-24 text-sm w-full"
              placeholder="Search any stock (e.g. apple, tesla, sbin, itc)..."
              value={search}
              onChange={handleSearchChange}
              onKeyDown={handleSearchKeyDown}
            />
            <button
              onClick={() => executeSearch(search)}
              disabled={searching || !search.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-800 disabled:text-gray-500 text-white transition-all flex items-center gap-1"
            >
              {searching ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Search'}
            </button>
          </div>

          {/* Quick popular stocks */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-gray-500 font-medium mr-1">Popular:</span>
            {POPULAR_SEARCHES.map((item) => (
              <button
                key={item.symbol}
                onClick={() => handlePopularClick(item.symbol)}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-all ${
                  selected?.symbol === item.symbol
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold'
                    : 'bg-gray-800/60 text-gray-400 border-gray-700/60 hover:text-white hover:border-gray-600'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Sector filters */}
          <div className="flex gap-1.5 flex-wrap">
            {SECTORS.map((s) => (
              <button
                key={s}
                onClick={() => setSector(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  sector === s ? 'bg-emerald-500 text-white font-semibold' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Search feedback & loader */}
          {searching && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-900/60 border border-emerald-500/30 text-xs text-emerald-400">
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
              <span>Fetching live quote and chart for "{search}"...</span>
            </div>
          )}

          {searchMessage && !searching && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{searchMessage}</span>
            </div>
          )}

          {/* Stock list items */}
          <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
            {filtered.length > 0 ? (
              filtered.map((stock) => {
                const isUsd = stock.currency === 'USD' || ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN', 'META'].includes(stock.symbol);
                const curr = isUsd ? '$' : '₹';
                const isSelected = selected?.symbol === stock.symbol;

                return (
                  <div
                    key={stock.symbol}
                    onClick={() => handleSelect(stock)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                      isSelected
                        ? 'border-emerald-500/40 bg-emerald-500/10 shadow-md shadow-emerald-500/5'
                        : 'border-gray-800/60 bg-gray-900/40 hover:border-gray-700 hover:bg-gray-800/40'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                      isSelected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-300'
                    }`}>
                      {stock.symbol.slice(0, 4)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-200 truncate">{stock.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <span>{stock.sector || 'General'}</span>
                        {isUsd && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-400 border border-blue-500/25">
                            US Market
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white tracking-tight">
                        {curr}{stock.price?.toLocaleString('en-IN') || '0.00'}
                      </p>
                      <div className={`flex items-center justify-end gap-0.5 text-xs font-medium ${getChangeColor(stock.change)}`}>
                        {stock.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {formatPercent(stock.change)}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : !searching ? (
              <div className="p-6 text-center rounded-xl bg-gray-900/30 border border-gray-800 text-gray-500 text-xs space-y-2">
                <p>No loaded stocks match "{search}".</p>
                <button
                  onClick={() => executeSearch(search)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all text-xs font-semibold"
                >
                  Search Market for "{search}"
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Column: Chart & Stock In-Depth Analytics */}
        <div className="lg:col-span-2 space-y-4">
          {selected ? (
            <>
              <Card>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-xl font-bold text-white tracking-tight">{selected.name}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 border border-gray-700 font-mono">
                        {selected.symbol}
                      </span>
                      {selected.currency === 'USD' && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 border border-blue-500/30 font-medium">
                          Global Equities (USD)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-2xl font-bold text-white tracking-tight">
                        {currencySymbol}{selected.price?.toLocaleString('en-IN') || '0.00'}
                      </span>
                      <span className={`text-sm font-semibold flex items-center gap-1 ${getChangeColor(selected.change)}`}>
                        {selected.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                        {formatPercent(selected.change)} today
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1 rounded-lg bg-gray-800 text-gray-300 border border-gray-700 font-medium">
                      {selected.sector || 'General'}
                    </span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAskAIStock(selected)}
                      className="text-xs py-1 px-3 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      icon={<Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                    >
                      Ask AI
                    </Button>
                  </div>
                </div>

                {chartData && chartData.labels?.length > 0 ? (
                  <PerformanceChart
                    labels={chartData.labels}
                    datasets={[{ data: chartData.prices, color: '#10B981', fill: true }]}
                    height={220}
                  />
                ) : (
                  <div className="h-[220px] flex flex-col items-center justify-center text-gray-500 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                    <span className="text-xs">Loading performance chart for {selected.symbol}...</span>
                  </div>
                )}
              </Card>

              {/* Fundamental Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Market Cap',  value: selected.mcap || 'N/A' },
                  { label: 'P/E Ratio',   value: selected.pe || 'N/A' },
                  { label: 'Currency',    value: selected.currency || 'INR' },
                  { label: 'Sector',      value: selected.sector || 'General' },
                ].map((s) => (
                  <div key={s.label} className="glass-card p-4 border border-gray-800/80">
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className="text-white font-bold text-base">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Quick AI Summary Card */}
              <div className="p-4 rounded-xl bg-gray-900/40 border border-gray-800 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-gray-300">Need in-depth financial advisory on {selected.name}?</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">Ask our AI Financial Copilot for valuation, earnings drivers, and risk factors.</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleAskAIStock(selected)}
                  className="text-xs py-1.5 px-3 flex-shrink-0"
                  icon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Analyze with AI
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2">
                <Search className="w-8 h-8 text-gray-700" />
                <p className="text-sm">Select or search any stock to view live metrics & technical chart</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
