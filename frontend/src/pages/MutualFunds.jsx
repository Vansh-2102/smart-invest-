import { useState } from 'react';
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { useMarket } from '../hooks/useMarket';
import Card, { CardHeader } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';
import PerformanceChart from '../components/charts/PerformanceChart';
import { getChangeColor, formatPercent } from '../utils/formatters';

const CATEGORIES = ['All', 'Large Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap', 'ELSS', 'Index', 'Debt', 'Hybrid'];

export default function MutualFunds() {
  const { data: funds, loading } = useMarket('mutualFunds');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('returns1y');

  if (loading) return <PageLoader />;

  const filtered = (funds || [])
    .filter((f) => category === 'All' || f.category === category)
    .sort((a, b) => {
      if (sort === 'returns1y') return b.returns1y - a.returns1y;
      if (sort === 'returns3y') return b.returns3y - a.returns3y;
      if (sort === 'nav')       return b.nav - a.nav;
      return 0;
    });

  const riskColor = (r) => {
    if (r === 'Very High') return 'risk-high border';
    if (r === 'High')      return 'risk-high border';
    if (r === 'Medium')    return 'risk-medium border';
    return 'risk-low border';
  };

  // Chart data - top funds performance
  const chartLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const chartDatasets = filtered.slice(0, 3).map((f, i) => ({
    label: f.name.split(' ').slice(0, 2).join(' '),
    data:  Array.from({ length: 12 }, (_, j) => 100 * (1 + (f.returns1y / 100) * (j / 12) + (Math.random() - 0.5) * 0.02)),
    color: ['#10B981', '#3B82F6', '#F59E0B'][i],
    fill: false,
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">Mutual Funds</h2>
        <p className="text-gray-400 text-sm mt-1">Top performing mutual funds across categories</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Funds',     value: funds?.length || 0,  color: 'text-white' },
          { label: 'Best 1Y Return',  value: formatPercent(Math.max(...(funds || []).map(f => f.returns1y))), color: 'text-emerald-400' },
          { label: 'Avg 1Y Return',   value: formatPercent((funds || []).reduce((s, f) => s + f.returns1y, 0) / (funds?.length || 1)), color: 'text-blue-400' },
          { label: 'Best 3Y Return',  value: formatPercent(Math.max(...(funds || []).map(f => f.returns3y))), color: 'text-yellow-400' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Performance chart */}
      <Card>
        <CardHeader title="Performance Comparison" subtitle="Normalized 1-year returns (top 3 funds)" />
        <PerformanceChart labels={chartLabels} datasets={chartDatasets} height={220} />
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                category === c
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="sm:ml-auto">
          <select
            className="form-input !py-1.5 text-sm"
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
              </tr>
            </thead>
            <tbody>
              {filtered.map((fund) => (
                <tr key={fund.name} className="cursor-pointer">
                  <td>
                    <div className="font-medium text-gray-200">{fund.name}</div>
                  </td>
                  <td>
                    <span className="text-xs text-gray-400">{fund.category}</span>
                  </td>
                  <td className="font-medium">₹{fund.nav.toFixed(2)}</td>
                  <td>
                    <span className={fund.returns1y >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                      {formatPercent(fund.returns1y)}
                    </span>
                  </td>
                  <td>
                    <span className={fund.returns3y >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {formatPercent(fund.returns3y)}
                    </span>
                  </td>
                  <td className="text-gray-400">{fund.aum}</td>
                  <td>
                    <span className={`badge ${riskColor(fund.risk)}`}>{fund.risk}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
