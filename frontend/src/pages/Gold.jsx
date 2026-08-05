import { useMarket } from '../hooks/useMarket';
import Card, { CardHeader } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';
import PerformanceChart from '../components/charts/PerformanceChart';
import { formatCurrency, getChangeColor, formatPercent } from '../utils/formatters';
import { TrendingUp, TrendingDown, Gem } from 'lucide-react';

export default function Gold() {
  const { data, loading } = useMarket('gold');

  if (loading) return <PageLoader />;
  if (!data)   return null;

  const isUp = data.change >= 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Gold</h2>
        <p className="text-gray-400 text-sm mt-1">Gold prices, ETFs, and sovereign bonds</p>
      </div>

      {/* Price hero */}
      <div className="glass-card p-6 border border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 border border-yellow-500/30">
            <Gem className="w-8 h-8 text-yellow-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Gold Spot Price (per 10g)</p>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-bold text-white">₹{data.spot.toLocaleString('en-IN')}</span>
              <div className={`flex items-center gap-1 text-sm font-medium mb-1 ${getChangeColor(data.change)}`}>
                {isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {formatPercent(data.change)} (₹{data.changeAmt.toLocaleString('en-IN')})
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">SGB Rate</p>
              <p className="text-lg font-bold text-yellow-400">₹{data.sgbRate.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">SGB Interest</p>
              <p className="text-lg font-bold text-emerald-400">{data.sgbInterest}% p.a.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Price chart */}
      <Card>
        <CardHeader title="Gold Price History (30 Days)" subtitle="10g spot price in INR" />
        <PerformanceChart
          labels={data.labels}
          datasets={[{ data: data.prices, color: '#F59E0B', fill: true }]}
          height={220}
        />
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Comparison table */}
        <Card>
          <CardHeader title="Ways to Invest in Gold" />
          <div className="space-y-3">
            {[
              { method: 'Physical Gold',      pro: 'Tangible asset',         con: 'Storage cost & purity risk',    liquidity: 'Low',    returns: 'Market price' },
              { method: 'Gold ETF',           pro: 'Easy to buy/sell',       con: 'Demat account required',        liquidity: 'High',   returns: 'Market price' },
              { method: 'Sovereign Gold Bond',pro: '2.5% extra interest',    con: '5-year lock-in',                liquidity: 'Medium', returns: 'Market + 2.5%' },
              { method: 'Digital Gold',       pro: 'Buy from ₹1',            con: 'Platform risk',                 liquidity: 'High',   returns: 'Market price' },
              { method: 'Gold Mutual Fund',   pro: 'No demat required',      con: 'Expense ratio',                 liquidity: 'High',   returns: '~Market price' },
            ].map((item) => (
              <div key={item.method} className="p-3 bg-gray-800/30 rounded-xl border border-gray-700/30">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-200">{item.method}</p>
                    <p className="text-xs text-emerald-400 mt-0.5">✓ {item.pro}</p>
                    <p className="text-xs text-red-400">✗ {item.con}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500">Liquidity</p>
                    <p className="text-sm font-medium text-gray-300">{item.liquidity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Gold ETF options */}
        <Card>
          <CardHeader title="Gold ETFs" subtitle="Available on NSE/BSE" />
          <div className="space-y-3">
            {data.etfOptions.map((etf) => (
              <div key={etf.name} className="flex items-center justify-between p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                <div>
                  <p className="text-sm font-medium text-gray-200">{etf.name}</p>
                  <p className="text-xs text-gray-500">Expense: {etf.expense}%</p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">₹{etf.nav.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">NAV per unit</p>
                </div>
              </div>
            ))}
          </div>

          {/* SGB info */}
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-sm font-semibold text-yellow-400 mb-1">💡 SGB Advantage</p>
            <p className="text-xs text-gray-400">
              Sovereign Gold Bonds offer capital appreciation + {data.sgbInterest}% annual interest. Tax-free on maturity if held to term (8 years).
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
