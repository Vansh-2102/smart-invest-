import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarket } from '../hooks/useMarket';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { PageLoader } from '../components/ui/Spinner';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend
} from 'chart.js';
import { getSentimentBg } from '../utils/formatters';
import { CHART_DEFAULTS } from '../utils/constants';
import {
  Newspaper, Sparkles, TrendingUp, TrendingDown, ArrowUpRight,
  Info, CheckCircle2, AlertCircle, HelpCircle
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CATEGORIES = ['All', 'Macro', 'IT', 'Banking', 'Gold', 'Crypto', 'Auto', 'Pharma', 'Regulation', 'Markets'];

const SENTIMENT_EMOJI = { Bullish: '🟢', Bearish: '🔴', Neutral: '🟡' };

const QUICK_PROMPTS = [
  { label: '📈 What does current market mood mean for Nifty?', query: 'Based on the current financial news sentiment, what is the short-to-medium term outlook for Nifty 50 and Sensex? Are markets positioned for a rally or consolidation?' },
  { label: '🏦 RBI Monetary Policy Impact', query: 'Explain how the RBI\'s repo rate decisions and interest rate cycle affect banking stocks, home loan EMIs, and retail investor portfolios in simple terms.' },
  { label: '⚠️ Biggest Market Risks Right Now', query: 'What are the top 3 macroeconomic risks currently facing Indian stock markets (e.g. FII selling, retail inflation, geopolitical conflicts)? How can investors protect capital?' },
  { label: '💡 Should I continue SIP or wait for dip?', query: 'Given current news sentiment and market valuation, should a retail investor continue systematic SIPs normally or wait for a market dip to invest lumpsum cash?' },
];

export default function NewsSentiment() {
  const navigate = useNavigate();
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
      { label: 'Bullish (Positive)', data: data.trendData.bullish, backgroundColor: 'rgba(16, 185, 129, 0.75)', borderRadius: 4 },
      { label: 'Bearish (Caution)',  data: data.trendData.bearish, backgroundColor: 'rgba(239, 68, 68, 0.75)',   borderRadius: 4 },
      { label: 'Neutral (Balanced)', data: data.trendData.neutral, backgroundColor: 'rgba(245, 158, 11, 0.75)', borderRadius: 4 },
    ],
  };

  const barOptions = {
    ...CHART_DEFAULTS,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { stacked: true, grid: { color: '#1F2937' }, ticks: { color: '#9CA3AF', font: { size: 10 } } },
      y: { stacked: true, grid: { color: '#1F2937' }, ticks: { color: '#9CA3AF', font: { size: 10 } } },
    },
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: { position: 'top', labels: { color: '#D1D5DB', font: { size: 11 }, padding: 12 } },
    },
  };

  // Ask AI Overview
  const handleAskAIOverview = () => {
    const initialQuery = `Please provide a simple, beginner-friendly market mood update based on current financial news:
1. Overall Market Pulse: The overall news sentiment is currently "${data.overall}" with a ${(data.score * 100).toFixed(0)}% positive score. What is driving this mood?
2. Key Positive & Negative Catalysts: What are the main growth drivers (e.g. corporate earnings, rate easing) and headwinds (e.g. FII outflows, inflation)?
3. Practical Retail Advice: Should a retail investor keep their monthly equity SIPs active, invest lumpsum cash, or hold some money in safe liquid funds right now?`;

    navigate('/chatbot', { state: { initialQuery, clearChat: true } });
  };

  // Ask AI for specific article impact
  const handleAskAIArticle = (article) => {
    const initialQuery = `Here is a financial news article I am reviewing:
• Headline: "${article.title}"
• Source: ${article.source} (${article.time} ago)
• Sector/Category: ${article.category}
• AI Sentiment Classification: ${article.sentiment} (${Math.round(Math.abs(article.score) * 100)}% confidence score)

Please explain in simple terms for an everyday retail investor:
1. Plain English Summary: What does this news actually mean in simple words?
2. Market & Sector Impact: Which specific companies, sectors, or market indices (Nifty 50, Bank Nifty) will be positively or negatively affected?
3. Actionable Investor Takeaway: Should a long-term investor buy, sell, or take no action based on this headline?`;

    navigate('/chatbot', {
      state: {
        initialQuery,
        clearChat: true,
        marketContext: {
          headline: article.title,
          category: article.category,
          sentiment: article.sentiment,
        }
      }
    });
  };

  const isBullish = data.overall === 'Bullish';
  const isBearish = data.overall === 'Bearish';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <Newspaper className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">News Sentiment & Market Mood</h2>
              <p className="text-gray-400 text-sm">Real-time AI analysis of financial news headlines across Indian markets</p>
            </div>
          </div>
        </div>

        <Button
          size="sm"
          onClick={handleAskAIOverview}
          className="self-start sm:self-auto py-2 px-4 shadow-lg shadow-emerald-500/10 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20"
          icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
        >
          Ask AI Sentiment Advisor
        </Button>
      </div>

      {/* Suggested Prompt Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
          <Sparkles className="w-3 h-3 text-emerald-400" /> Quick Prompts:
        </span>
        {QUICK_PROMPTS.map((p) => (
          <button
            key={p.label}
            onClick={() => navigate('/chatbot', { state: { initialQuery: p.query, clearChat: true } })}
            className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-gray-800/80 hover:bg-emerald-500/10 border border-gray-700 hover:border-emerald-500/30 text-gray-300 hover:text-emerald-300 transition-all cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Simple Mood Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Main Mood Banner */}
        <div className="glass-card p-5 border border-emerald-500/25 bg-gradient-to-br from-emerald-500/10 to-transparent flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Overall Market Mood</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {(data.score * 100).toFixed(0)}% Score
              </span>
            </div>
            <div className="flex items-center gap-2.5 mt-2">
              <span className="text-3xl font-extrabold text-emerald-400">{data.overall}</span>
              {isBullish ? <TrendingUp className="w-6 h-6 text-emerald-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
            </div>
            <p className="text-xs text-gray-300 mt-2 leading-relaxed">
              Positive earnings and stable policy signals are keeping sentiment supportive.
            </p>
          </div>
          <button
            onClick={handleAskAIOverview}
            className="mt-3 text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" /> Ask AI what this means for you
          </button>
        </div>

        {/* Positive News Card */}
        <div className="glass-card p-5 border border-emerald-500/20 text-center flex flex-col justify-center">
          <p className="text-3xl font-extrabold text-emerald-400">{bullishCount}</p>
          <p className="text-xs font-semibold text-gray-200 mt-1">🟢 Positive News Articles</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Earnings beats, rate ease & demand</p>
        </div>

        {/* Caution News Card */}
        <div className="glass-card p-5 border border-red-500/20 text-center flex flex-col justify-center">
          <p className="text-3xl font-extrabold text-red-400">{bearishCount}</p>
          <p className="text-xs font-semibold text-gray-200 mt-1">🔴 Caution & Risk Articles</p>
          <p className="text-[11px] text-gray-400 mt-0.5">FII outflows, inflation & delays</p>
        </div>

        {/* Neutral News Card */}
        <div className="glass-card p-5 border border-yellow-500/20 text-center flex flex-col justify-center">
          <p className="text-3xl font-extrabold text-yellow-400">{neutralCount}</p>
          <p className="text-xs font-semibold text-gray-200 mt-1">🟡 Balanced Articles</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Regulatory updates & mixed data</p>
        </div>
      </div>

      {/* 14-Day Sentiment Trend */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-2 border-b border-gray-800 gap-2">
          <div>
            <CardHeader title="Sentiment Trend (Last 14 Days)" subtitle="Visual count of positive vs negative news over time" />
          </div>
          <span className="text-xs text-gray-500">Green = Optimism | Red = Caution</span>
        </div>
        <div style={{ height: 210 }}>
          <Bar data={barData} options={barOptions} />
        </div>
      </Card>

      {/* News Feed Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-base font-bold text-white">Live Analyzed News Feed</h3>
            <p className="text-xs text-gray-400">Click "Ask AI Impact" on any story to see how it affects your portfolio</p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex-shrink-0 cursor-pointer ${
                  category === c
                    ? 'bg-emerald-500 text-white font-semibold'
                    : 'bg-gray-800/80 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Articles List */}
        <div className="space-y-3">
          {filtered.map((article, i) => {
            const isArtBullish = article.sentiment === 'Bullish';
            const isArtBearish = article.sentiment === 'Bearish';
            const confidencePct = Math.round(Math.abs(article.score) * 100);

            return (
              <Card key={i} hover padding={false}>
                <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className={`badge ${getSentimentBg(article.sentiment)}`}>
                        {SENTIMENT_EMOJI[article.sentiment]} {article.sentiment}
                      </span>
                      <span className="badge bg-gray-800 text-gray-400 border border-gray-700">
                        {article.category}
                      </span>
                      <span className="text-[11px] text-gray-400">
                        {confidencePct}% AI confidence
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-gray-100 leading-snug">
                      {article.title}
                    </p>

                    <div className="flex items-center gap-2.5 mt-2 text-xs text-gray-500">
                      <span className="font-medium text-gray-400">{article.source}</span>
                      <span>•</span>
                      <span>{article.time} ago</span>
                    </div>
                  </div>

                  {/* Ask AI Impact Button */}
                  <div className="flex items-center gap-2.5 flex-shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-800">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAskAIArticle(article)}
                      className="py-1.5 px-3 text-xs border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 flex items-center gap-1.5"
                      icon={<Sparkles className="w-3.5 h-3.5 text-emerald-400" />}
                    >
                      Ask AI Impact
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

