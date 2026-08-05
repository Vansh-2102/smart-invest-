import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import { useMarket } from '../hooks/useMarket';
import { marketApi } from '../api/marketApi';
import Card, { CardHeader } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';
import PerformanceChart from '../components/charts/PerformanceChart';
import { getChangeColor, formatPercent } from '../utils/formatters';

const SECTORS = ['All', 'IT', 'Banking', 'Energy', 'Finance', 'Infra', 'Auto'];

export default function Stocks() {
  const { data: stocks, loading } = useMarket('stocks');
  const [search, setSearch]       = useState('');
  const [sector, setSector]       = useState('All');
  const [sort, setSort]           = useState('mcap');
  const [selected, setSelected]   = useState(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    if (!stocks?.length) return;
    const first = stocks[0];
    setSelected(first);
    marketApi.getStockChart(first.symbol).then((r) => setChartData(r.data));
  }, [stocks]);

  const handleSelect = async (stock) => {
    setSelected(stock);
    setChartData(null);
    const r = await marketApi.getStockChart(stock.symbol);
    setChartData(r.data);
  };

  if (loading) return <PageLoader />;

  const filtered = (stocks || [])
    .filter((s) =>
      (sector === 'All' || s.sector === sector) &&
      (s.name.toLowerCase().includes(search.toLowerCase()) || s.symbol.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sort === 'change') return b.change - a.change;
      return 0;
    });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Stocks</h2>
        <p className="text-gray-400 text-sm mt-1">Top Indian equities – prices and performance</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Stock list */}
        <div className="space-y-4">
          {/* Search & filters */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              className="form-input pl-9 text-sm"
              placeholder="Search stocks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {SECTORS.map((s) => (
              <button
                key={s}
                onClick={() => setSector(s)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  sector === s ? 'bg-emerald-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Stock cards */}
          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {filtered.map((stock) => (
              <div
                key={stock.symbol}
                onClick={() => handleSelect(stock)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                  selected?.symbol === stock.symbol
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-gray-800/50 bg-gray-900/30 hover:border-gray-700'
                }`}
              >
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">
                  {stock.symbol.slice(0, 3)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{stock.name}</p>
                  <p className="text-xs text-gray-500">{stock.sector}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">₹{stock.price.toLocaleString('en-IN')}</p>
                  <div className={`flex items-center justify-end gap-0.5 text-xs ${getChangeColor(stock.change)}`}>
                    {stock.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {formatPercent(stock.change)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart & details */}
        <div className="lg:col-span-2 space-y-4">
          {selected ? (
            <>
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-white">{selected.name}</h3>
                      <span className="text-sm text-gray-500">{selected.symbol}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-2xl font-bold text-white">₹{selected.price.toLocaleString('en-IN')}</span>
                      <span className={`text-sm font-medium ${getChangeColor(selected.change)}`}>
                        {formatPercent(selected.change)} today
                      </span>
                    </div>
                  </div>
                  <span className="badge bg-gray-800 text-gray-400 border border-gray-700">{selected.sector}</span>
                </div>

                {chartData ? (
                  <PerformanceChart
                    labels={chartData.labels}
                    datasets={[{ data: chartData.prices, color: '#10B981', fill: true }]}
                    height={200}
                  />
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-gray-600">Loading chart...</div>
                )}
              </Card>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Market Cap',  value: selected.mcap },
                  { label: 'P/E Ratio',   value: selected.pe },
                  { label: 'Sector',      value: selected.sector },
                ].map((s) => (
                  <div key={s.label} className="glass-card p-4">
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className="text-white font-semibold">{s.value}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Card>
              <div className="flex items-center justify-center h-40 text-gray-500">
                Select a stock to view details
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
