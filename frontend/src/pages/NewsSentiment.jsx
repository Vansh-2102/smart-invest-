import { useState } from 'react';
import { useMarket } from '../hooks/useMarket';
import Card, { CardHeader } from '../components/ui/Card';
import { PageLoader } from '../components/ui/Spinner';
import PerformanceChart from '../components/charts/PerformanceChart';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend
} from 'chart.js';
import { getSentimentBg, truncate } from '../utils/formatters';
import { CHART_DEFAULTS } from '../utils/constants';
import { Newspaper, Filter } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CATEGORIES = ['All', 'Macro', 'IT', 'Banking', 'Gold', 'Crypto', 'Auto', 'Pharma', 'Regulation', 'Markets'];

const SENTIMENT_EMOJI = { Bullish: '🟢', Bearish: '🔴', Neutral: '🟡' };

export default function NewsSentiment() {
  const { data, loading } = useMarket('news');
  const [category, setCategory] = useState('All');

  if (loading) return <PageLoader />;
  if (!data)   return null;

  const filtered = category === 'All'
    ? data.articles
    : data.articles.filter((a) => a.category === category);

  const bullishCount = data.articles.filter((a) => a.sentiment === 'Bullish').length;
  const bearishCount = data.articles.filter((a) => a.sentiment === 'Bearish').length;
  const neutralCount = data.articles.filter((a) => a.sentiment === 'Neutral').length;

  const barData = {
    labels: data.trendData.labels,
    datasets: [
      { label: 'Bullish', data: data.trendData.bullish, backgroundColor: 'rgba(16, 185, 129, 0.7)', borderRadius: 4 },
      { label: 'Bearish', data: data.trendData.bearish, backgroundColor: 'rgba(239, 68, 68, 0.7)',   borderRadius: 4 },
      { label: 'Neutral', data: data.trendData.neutral, backgroundColor: 'rgba(245, 158, 11, 0.7)', borderRadius: 4 },
    ],
  };

  const barOptions = {
    ...CHART_DEFAULTS,
    scales: {
      x: { stacked: true, grid: { color: '#1F2937' }, ticks: { color: '#6B7280', font: { size: 10 } } },
      y: { stacked: true, grid: { color: '#1F2937' }, ticks: { color: '#6B7280', font: { size: 10 } } },
    },
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: { position: 'top', labels: { color: '#9CA3AF', font: { size: 11 }, padding: 12 } },
    },
  };

  const overallColor = data.overall === 'Bullish' ? 'text-emerald-400' : data.overall === 'Bearish' ? 'text-red-400' : 'text-yellow-400';

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-white">News Sentiment</h2>
        <p className="text-gray-400 text-sm mt-1">AI-analyzed market sentiment from financial news</p>
      </div>

      {/* Sentiment overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 border border-emerald-500/20 lg:col-span-1">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Overall Market Mood</p>
          <p className={`text-3xl font-bold ${overallColor}`}>{data.overall}</p>
          <p className="text-xs text-gray-600 mt-1">Sentiment score: {(data.score * 100).toFixed(0)}%</p>
        </div>
        <div className="glass-card p-5 text-center border border-emerald-500/15">
          <p className="text-3xl font-bold text-emerald-400">{bullishCount}</p>
          <p className="text-xs text-gray-500 mt-1">🟢 Bullish articles</p>
        </div>
        <div className="glass-card p-5 text-center border border-red-500/15">
          <p className="text-3xl font-bold text-red-400">{bearishCount}</p>
          <p className="text-xs text-gray-500 mt-1">🔴 Bearish articles</p>
        </div>
        <div className="glass-card p-5 text-center border border-yellow-500/15">
          <p className="text-3xl font-bold text-yellow-400">{neutralCount}</p>
          <p className="text-xs text-gray-500 mt-1">🟡 Neutral articles</p>
        </div>
      </div>

      {/* Sentiment trend */}
      <Card>
        <CardHeader title="Sentiment Trend (14 Days)" subtitle="Distribution of bullish/bearish/neutral articles" />
        <div style={{ height: 220 }}>
          <Bar data={barData} options={barOptions} />
        </div>
      </Card>

      {/* News articles */}
      <div>
        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                category === c
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map((article, i) => (
            <Card key={i} hover padding={false}>
              <div className="p-4 flex flex-col sm:flex-row gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`badge ${getSentimentBg(article.sentiment)}`}>
                      {SENTIMENT_EMOJI[article.sentiment]} {article.sentiment}
                    </span>
                    <span className="badge bg-gray-800 text-gray-400 border border-gray-700">{article.category}</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-200 leading-snug">{article.title}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{article.source}</span>
                    <span>·</span>
                    <span>{article.time} ago</span>
                  </div>
                </div>

                {/* Sentiment score bar */}
                <div className="flex flex-col items-center justify-center w-20 flex-shrink-0">
                  <div className="relative w-16 h-16">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1F2937" strokeWidth="3" />
                      <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke={article.score >= 0 ? '#10B981' : '#EF4444'}
                        strokeWidth="3"
                        strokeDasharray={`${Math.abs(article.score) * 100} 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xs font-bold ${article.score >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {Math.round(Math.abs(article.score) * 100)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-600 mt-1">confidence</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
