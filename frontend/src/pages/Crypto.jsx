import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Bitcoin } from 'lucide-react';
import { useMarket } from '../hooks/useMarket';
import { marketApi } from '../api/marketApi';
import Card, { CardHeader } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';
import PerformanceChart from '../components/charts/PerformanceChart';
import { getChangeColor, formatPercent } from '../utils/formatters';

export default function Crypto() {
  const { data: cryptos, loading } = useMarket('crypto');
  const [selected, setSelected]    = useState(null);
  const [chartData, setChartData]  = useState(null);

  useEffect(() => {
    if (!cryptos?.length) return;
    setSelected(cryptos[0]);
    marketApi.getCryptoChart(cryptos[0].symbol).then((r) => setChartData(r.data));
  }, [cryptos]);

  const handleSelect = async (coin) => {
    setSelected(coin);
    setChartData(null);
    const r = await marketApi.getCryptoChart(coin.symbol);
    setChartData(r.data);
  };

  if (loading) return <PageLoader />;

  const totalMcap = (cryptos || []).reduce((s, c) => s + parseFloat(c.mcap.replace(/[₹TBMK]/g, '')) * (
    c.mcap.includes('T') ? 1e12 : c.mcap.includes('B') ? 1e9 : 1
  ), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Crypto</h2>
        <p className="text-gray-400 text-sm mt-1">Real-time cryptocurrency prices and market data</p>
      </div>

      {/* Market overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cryptos Tracked',  value: cryptos?.length,  color: 'text-white' },
          { label: 'BTC Dominance',    value: '52.3%',           color: 'text-yellow-400' },
          { label: 'Top Gainer (24h)', value: formatPercent(Math.max(...(cryptos || []).map(c => c.change24h))), color: 'text-emerald-400' },
          { label: 'Top Loser (24h)',  value: formatPercent(Math.min(...(cryptos || []).map(c => c.change24h))), color: 'text-red-400' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Coin list */}
        <div>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {(cryptos || []).map((coin) => (
              <div
                key={coin.symbol}
                onClick={() => handleSelect(coin)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                  selected?.symbol === coin.symbol
                    ? 'border-purple-500/30 bg-purple-500/5'
                    : 'border-gray-800/50 hover:border-gray-700'
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
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <>
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-2xl font-bold text-white">{selected.name}</h3>
                      <span className="text-gray-500">{selected.symbol}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-white">₹{selected.price.toLocaleString('en-IN')}</span>
                      <span className={`text-sm font-semibold ${getChangeColor(selected.change24h)}`}>
                        {formatPercent(selected.change24h)} (24h)
                      </span>
                    </div>
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
                    Loading chart...
                  </div>
                )}
              </Card>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: 'Market Cap',  value: selected.mcap },
                  { label: '24h Volume',  value: selected.volume },
                  { label: '24h High',    value: `₹${selected.high24h.toLocaleString('en-IN')}` },
                  { label: '24h Low',     value: `₹${selected.low24h.toLocaleString('en-IN')}` },
                  { label: '24h Change',  value: formatPercent(selected.change24h) },
                ].map((s) => (
                  <div key={s.label} className="glass-card p-4">
                    <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                    <p className="text-white font-semibold">{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Disclaimer */}
              <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-xl">
                <p className="text-xs text-red-400">
                  ⚠️ Cryptocurrency investments are highly volatile and speculative. Only invest what you can afford to lose. Past performance does not guarantee future results.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
