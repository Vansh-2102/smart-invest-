import { useMarket } from '../hooks/useMarket';
import Card, { CardHeader } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';
import { TrendingUp, TrendingDown, Globe } from 'lucide-react';
import { formatPercent, getChangeColor } from '../utils/formatters';
import PerformanceChart from '../components/charts/PerformanceChart';

function IndexCard({ index }) {
  const isUp = index.change >= 0;
  return (
    <div className={`glass-card p-4 border transition-all ${isUp ? 'border-emerald-500/10' : 'border-red-500/10'}`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-sm font-semibold text-gray-200">{index.name}</p>
        <div className={`flex items-center gap-1 text-xs font-medium ${getChangeColor(index.change)}`}>
          {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {formatPercent(index.change)}
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{index.value.toLocaleString('en-IN')}</p>
      <p className={`text-xs mt-1 ${getChangeColor(index.change)}`}>
        {isUp ? '+' : ''}{index.changeAmt.toLocaleString('en-IN')}
      </p>
    </div>
  );
}

const SECTORS = [
  { name: 'IT',         change: 2.15,  color: '#10B981' },
  { name: 'Banking',    change: -0.45, color: '#EF4444' },
  { name: 'FMCG',      change: 0.78,  color: '#10B981' },
  { name: 'Auto',       change: 1.23,  color: '#10B981' },
  { name: 'Pharma',     change: -0.89, color: '#EF4444' },
  { name: 'Energy',     change: 1.89,  color: '#10B981' },
  { name: 'Metal',      change: -1.23, color: '#EF4444' },
  { name: 'Realty',     change: 0.45,  color: '#10B981' },
  { name: 'Media',      change: -0.32, color: '#EF4444' },
  { name: 'Infra',      change: 0.92,  color: '#10B981' },
  { name: 'Consumer',   change: 0.56,  color: '#10B981' },
  { name: 'Utilities',  change: -0.15, color: '#EF4444' },
];

const LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Mon', 'Tue'];

export default function MarketDashboard() {
  const { data: indices, loading } = useMarket('indices');

  if (loading) return <PageLoader />;

  const indian  = indices?.filter((i) => ['NIFTY 50', 'SENSEX', 'NIFTY Bank', 'NIFTY IT', 'NIFTY Mid'].includes(i.name)) || [];
  const global  = indices?.filter((i) => ['S&P 500', 'NASDAQ', 'DOW JONES'].includes(i.name)) || [];

  const niftyData = Array.from({ length: 12 }, (_, i) => 23800 + i * 50 + (Math.random() - 0.4) * 200);
  const sensexData = niftyData.map(v => v * 3.29);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-bold text-white">Market Dashboard</h2>
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium">Live</span>
        </div>
      </div>

      {/* Indian indices */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">🇮🇳 Indian Markets</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {indian.map((index) => <IndexCard key={index.name} index={index} />)}
        </div>
      </div>

      {/* Global indices */}
      <div>
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">🌍 Global Markets</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {global.map((index) => <IndexCard key={index.name} index={index} />)}
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader title="NIFTY 50 & SENSEX" subtitle="Last 12 trading sessions" />
          <PerformanceChart
            labels={LABELS}
            datasets={[
              { label: 'NIFTY 50', data: niftyData,   color: '#10B981', fill: false },
              { label: 'SENSEX',   data: sensexData.map(v => v / 3.29), color: '#3B82F6', fill: false },
            ]}
            height={200}
          />
        </Card>

        {/* Sector heatmap */}
        <Card>
          <CardHeader title="Sector Performance" subtitle="Today's change (%)" />
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {SECTORS.map((s) => {
              const intensity = Math.min(Math.abs(s.change) / 3, 1);
              const bgColor = s.change >= 0
                ? `rgba(16, 185, 129, ${0.1 + intensity * 0.3})`
                : `rgba(239, 68, 68, ${0.1 + intensity * 0.3})`;
              const border = s.change >= 0 ? 'border-emerald-500/20' : 'border-red-500/20';

              return (
                <div
                  key={s.name}
                  style={{ backgroundColor: bgColor }}
                  className={`p-3 rounded-xl border ${border} text-center`}
                >
                  <p className="text-xs text-gray-300 font-medium">{s.name}</p>
                  <p className={`text-sm font-bold mt-1 ${s.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {formatPercent(s.change)}
                  </p>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Market stats */}
      <Card>
        <CardHeader title="Market Breadth" subtitle="Today's market statistics" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Advances',      value: '1,234',  color: 'text-emerald-400' },
            { label: 'Declines',      value: '987',    color: 'text-red-400' },
            { label: 'Unchanged',     value: '124',    color: 'text-gray-400' },
            { label: 'A/D Ratio',     value: '1.25',   color: 'text-yellow-400' },
            { label: '52W Highs',     value: '89',     color: 'text-emerald-400' },
            { label: '52W Lows',      value: '23',     color: 'text-red-400' },
            { label: 'Total Volume',  value: '₹98,234Cr', color: 'text-blue-400' },
            { label: 'Delivery %',    value: '42.3%',  color: 'text-gray-300' },
          ].map((s) => (
            <div key={s.label} className="text-center bg-gray-800/30 rounded-xl p-4">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
