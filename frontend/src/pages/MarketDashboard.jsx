import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMarket } from '../hooks/useMarket';
import Card, { CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { PageLoader } from '../components/ui/Spinner';
import {
  TrendingUp, TrendingDown, Sparkles, Info, CheckCircle2, Shield,
  ArrowUpRight, Activity, Layers, Zap, Globe
} from 'lucide-react';
import { formatPercent, getChangeColor } from '../utils/formatters';
import PerformanceChart from '../components/charts/PerformanceChart';

const INDEX_DETAILS = {
  'NIFTY 50': {
    fullName: 'NIFTY 50 (NSE Benchmark)',
    exchange: 'National Stock Exchange (NSE)',
    region: 'India',
    flag: '🇮🇳',
    type: 'Premier Large-Cap Benchmark',
    constituentsCount: '50 Blue-Chip Stocks',
    topConstituents: ['Reliance Industries', 'HDFC Bank', 'ICICI Bank', 'Infosys', 'TCS', 'Bharti Airtel', 'L&T', 'ITC'],
    description: 'The flagship index on the National Stock Exchange of India, tracking the 50 largest and most liquid Indian equities across 13 major sectors.',
    howItWorks: 'Calculated using a free-float market capitalization weighted methodology. It serves as the primary barometer of the Indian economy and is one of the world\'s most actively traded derivative indices.',
    keyDrivers: 'Foreign Institutional (FII) & Domestic (DII) flows, quarterly corporate earnings, RBI monetary policy decisions, inflation trajectory, and global equity sentiment.',
  },
  'SENSEX': {
    fullName: 'BSE SENSEX (30 Blue-Chips)',
    exchange: 'Bombay Stock Exchange (BSE)',
    region: 'India',
    flag: '🇮🇳',
    type: 'Historic Market Bellwether',
    constituentsCount: '30 Elite Blue-Chip Companies',
    topConstituents: ['Reliance Industries', 'HDFC Bank', 'ICICI Bank', 'Infosys', 'TCS', 'Larsen & Toubro', 'State Bank of India', 'ITC'],
    description: 'India\'s oldest and most prestigious stock index, tracking 30 financially robust, established leaders listed on the Bombay Stock Exchange.',
    howItWorks: 'Weighted by free-float market capitalization. Reflects the corporate pulse of Dalal Street and has documented India\'s economic growth story since 1986.',
    keyDrivers: 'GDP growth forecasts, corporate balance sheet strength, domestic SIP liquidity, INR/USD exchange rates, and geopolitical stability.',
  },
  'NIFTY Bank': {
    fullName: 'NIFTY Bank Index',
    exchange: 'National Stock Exchange (NSE)',
    region: 'India',
    flag: '🇮🇳',
    type: 'Financial Sector Bellwether',
    constituentsCount: '12 Leading Banking Stocks',
    topConstituents: ['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Kotak Mahindra Bank', 'Axis Bank', 'IndusInd Bank', 'Bank of Baroda', 'Federal Bank'],
    description: 'The definitive benchmark for the performance of India\'s banking ecosystem, tracking 12 major public and private commercial banking institutions.',
    howItWorks: 'Free-float market cap weighted. Represents the backbone of the Indian financial sector, commanding over 35% of total NIFTY 50 weight.',
    keyDrivers: 'Credit loan growth, Net Interest Margins (NIMs), RBI repo rate decisions, Gross/Net NPA asset quality, and banking system liquidity.',
  },
  'NIFTY Mid': {
    fullName: 'NIFTY Midcap 100 Index',
    exchange: 'National Stock Exchange (NSE)',
    region: 'India',
    flag: '🇮🇳',
    type: 'High-Alpha Midcap Benchmark',
    constituentsCount: '100 Emerging Market Leaders',
    topConstituents: ['Trent', 'Federal Bank', 'Indian Hotels', 'Persistent Systems', 'Ashok Leyland', 'Cummins India', 'Polycab', 'Lupin'],
    description: 'Captures the performance of medium-sized enterprises with high compounding potential, dynamic market positions, and expanding market share.',
    howItWorks: 'Reflects companies ranked 101 to 200 by market capitalization. Offers higher potential growth alongside elevated volatility compared to large-cap indices.',
    keyDrivers: 'Domestic consumption growth, corporate capex expansions, retail mutual fund inflows, and domestic macroeconomic revival.',
  },
  'S&P 500': {
    fullName: 'Standard & Poor\'s 500',
    exchange: 'NYSE / NASDAQ',
    region: 'United States',
    flag: '🇺🇸',
    type: 'Global Equities Standard',
    constituentsCount: '500 Top US Corporations',
    topConstituents: ['Microsoft', 'Apple', 'NVIDIA', 'Amazon', 'Alphabet', 'Meta', 'Berkshire Hathaway', 'Tesla'],
    description: 'Widely regarded as the single best gauge of large-cap US equities and the core indicator of global financial stability and investor confidence.',
    howItWorks: 'Market-cap weighted index covering roughly 80% of total available US equity market capitalization across 11 GICS sectors.',
    keyDrivers: 'Federal Reserve interest rate decisions, US CPI inflation, tech mega-cap quarterly earnings, and global liquidity trends.',
  },
  'NASDAQ': {
    fullName: 'NASDAQ Composite Index',
    exchange: 'NASDAQ Stock Market',
    region: 'United States',
    flag: '🇺🇸',
    type: 'Technology & Innovation Engine',
    constituentsCount: '3,000+ Growth & Tech Equities',
    topConstituents: ['Apple', 'Microsoft', 'NVIDIA', 'Amazon', 'Meta Platforms', 'Broadcom', 'Alphabet', 'Tesla'],
    description: 'The global benchmark for technology, artificial intelligence, biotechnology, and forward-looking growth enterprises.',
    howItWorks: 'Market capitalization-weighted composite of all common equities listed exclusively on the Nasdaq exchange.',
    keyDrivers: 'AI infrastructure capex, semiconductor demand cycles, 10-year US Treasury bond yields, and enterprise digital spending.',
  },
  'DOW JONES': {
    fullName: 'Dow Jones Industrial Average (DJIA)',
    exchange: 'NYSE / NASDAQ',
    region: 'United States',
    flag: '🇺🇸',
    type: 'Historic Industrial & Blue-Chip Average',
    constituentsCount: '30 Elite US Corporate Titans',
    topConstituents: ['UnitedHealth Group', 'Goldman Sachs', 'Microsoft', 'Home Depot', 'Caterpillar', 'Boeing', 'Amgen', 'Visa'],
    description: 'One of the oldest stock market indices in the world, founded in 1896 to represent iconic American corporate stalwarts.',
    howItWorks: 'A price-weighted average of 30 significant publicly traded US corporations, where higher-priced stocks exert greater index weight.',
    keyDrivers: 'US industrial and manufacturing output, consumer spending indexes, corporate dividend consistency, and global trade dynamics.',
  },
};

const SECTOR_DETAILS = {
  'IT': {
    name: 'Information Technology',
    topPicks: ['TCS', 'Infosys', 'HCLTech', 'Wipro', 'Tech Mahindra'],
    description: 'Export-oriented technological powerhouse delivering global IT transformation, cloud computing, and enterprise AI engineering.',
    drivers: 'US/EU tech budget allocations, IT services deal wins, INR/USD currency valuation, and client discretionary spending cycles.',
  },
  'Banking': {
    name: 'Banking & Financial Services',
    topPicks: ['HDFC Bank', 'ICICI Bank', 'SBI', 'Kotak Mahindra', 'Axis Bank'],
    description: 'The credit and capital allocation heartbeat of the economy, encompassing private and public sector commercial lenders.',
    drivers: 'Credit growth trajectory, RBI repo rate trajectory, deposit mobilization rates, and retail vs corporate loan asset quality.',
  },
  'FMCG': {
    name: 'Fast Moving Consumer Goods',
    topPicks: ['ITC', 'Hindustan Unilever', 'Nestle India', 'Britannia', 'Dabur'],
    description: 'Defensive, recession-resilient consumer staples sector supported by essential daily consumption, strong branding, and pricing power.',
    drivers: 'Rural disposable income, monsoon rainfall distribution, raw material commodity costs (palm oil, wheat, packaging), and volume growth.',
  },
  'Auto': {
    name: 'Automobiles & Auto Ancillaries',
    topPicks: ['Tata Motors', 'Mahindra & Mahindra', 'Maruti Suzuki', 'Bajaj Auto', 'Eicher Motors'],
    description: 'Cyclical growth driver spanning passenger vehicles, commercial vehicles, electric vehicle (EV) ecosystems, and two-wheelers.',
    drivers: 'Festive season vehicle demand, steel and aluminum input pricing, consumer financing interest rates, and EV adoption trends.',
  },
  'Pharma': {
    name: 'Pharmaceuticals & Healthcare',
    topPicks: ['Sun Pharma', 'Dr. Reddy\'s Laboratories', 'Cipla', 'Divi\'s Laboratories', 'Lupin'],
    description: 'Global generic drug exporter and domestic formulations leader known for steady cash flows and high defensive portfolio utility.',
    drivers: 'US FDA regulatory inspection outcomes, generic drug pricing pressure in the US, domestic chronics growth, and R&D pipelines.',
  },
  'Energy': {
    name: 'Energy, Oil & Power',
    topPicks: ['Reliance Industries', 'ONGC', 'NTPC', 'Power Grid Corp', 'Tata Power'],
    description: 'Vital infrastructure sector covering petroleum refining, upstream exploration, green hydrogen, and power transmission.',
    drivers: 'Brent crude oil prices, gross refining margins (GRM), government green energy policies, and surging industrial electricity demand.',
  },
  'Metal': {
    name: 'Metals & Mining',
    topPicks: ['Tata Steel', 'JSW Steel', 'Hindalco Industries', 'Vedanta', 'Coal India'],
    description: 'Cyclical commodity-linked sector essential for domestic construction, manufacturing, capital goods, and exports.',
    drivers: 'China economic stimulus announcements, London Metal Exchange (LME) base metal prices, coking coal costs, and domestic infrastructure demand.',
  },
  'Realty': {
    name: 'Real Estate & Construction',
    topPicks: ['DLF Ltd', 'Godrej Properties', 'Macrotech Developers (Lodha)', 'Oberoi Realty', 'Prestige Estates'],
    description: 'High-growth cyclical sector reflecting luxury and residential home sales, commercial office leasing, and land parcel monetization.',
    drivers: 'Home loan interest rates, inventory liquidation speed, urban housing demand, and regulatory approvals via RERA.',
  },
  'Media': {
    name: 'Media & Entertainment',
    topPicks: ['Sun TV Network', 'Zee Entertainment', 'PVR INOX', 'Nazara Technologies'],
    description: 'Consumer discretionary segment spanning television broadcasting, theatrical exhibitions, OTT streaming, and digital gaming.',
    drivers: 'Corporate advertising expenditure (AdEx), subscription video-on-demand trends, cinema box office occupancy, and digital content monetization.',
  },
  'Infra': {
    name: 'Infrastructure & Capital Goods',
    topPicks: ['Larsen & Toubro', 'Adani Ports & SEZ', 'UltraTech Cement', 'IRB Infrastructure', 'Siemens India'],
    description: 'National development backbone delivering highways, ports, metro railways, airports, power grids, and industrial manufacturing.',
    drivers: 'Government Union Budget capex allocations, National Infrastructure Pipeline execution speed, order book expansion, and private capex.',
  },
  'Consumer': {
    name: 'Consumer Discretionary & Retail',
    topPicks: ['Titan Company', 'Trent (Zudio/Westside)', 'Asian Paints', 'Havells India', 'Page Industries'],
    description: 'Aspirational consumer segment capturing luxury jewelry, modern fashion retail, home improvement, and electrical goods.',
    drivers: 'Urban salary growth, wedding season demand surges, store network expansion, and shift from unorganized to organized retail.',
  },
  'Utilities': {
    name: 'Public Utilities & Renewables',
    topPicks: ['NTPC', 'Adani Green Energy', 'NHPC', 'JSW Energy', 'Torrent Power'],
    description: 'Regulated utility operations delivering essential electricity generation, renewable solar/wind installations, and water distribution.',
    drivers: 'Regulated return on equity (RoE) tariff structures, peak summer power deficits, government green energy tender awards, and long-term PPAs.',
  },
};

const SECTORS = [
  { name: 'IT',         change: 2.15,  color: '#10B981' },
  { name: 'Banking',    change: -0.45, color: '#EF4444' },
  { name: 'FMCG',       change: 0.78,  color: '#10B981' },
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

function IndexCard({ index, onOpenModal, onAskAI }) {
  const isUp = index.change >= 0;
  return (
    <div className={`glass-card p-4 border transition-all flex flex-col justify-between group hover:border-emerald-500/30 ${
      isUp ? 'border-emerald-500/10' : 'border-red-500/10'
    }`}>
      <div>
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm font-semibold text-gray-200 group-hover:text-emerald-400 transition-colors">
            {index.name}
          </p>
          <div className={`flex items-center gap-1 text-xs font-medium ${getChangeColor(index.change)}`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {formatPercent(index.change)}
          </div>
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">{index.value.toLocaleString('en-IN')}</p>
        <p className={`text-xs mt-1 ${getChangeColor(index.change)} font-medium`}>
          {isUp ? '+' : ''}{index.changeAmt.toLocaleString('en-IN')}
        </p>
      </div>

      {/* Action Buttons (Details & Ask AI) */}
      <div className="flex items-center justify-between border-t border-gray-800/80 mt-3 pt-2.5">
        <button
          onClick={() => onOpenModal(index)}
          className="text-[11px] font-semibold text-gray-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
          title="Learn more about this index"
        >
          <Info className="w-3 h-3" /> Details
        </button>

        <button
          onClick={() => onAskAI(index)}
          className="text-[11px] font-semibold py-1 px-2.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 flex items-center gap-1 transition-all"
          title="Ask AI Market Analyst about this index"
        >
          <Sparkles className="w-3 h-3" /> Ask AI
        </button>
      </div>
    </div>
  );
}

export default function MarketDashboard() {
  const navigate = useNavigate();
  const { data: indices, loading } = useMarket('indices');
  const [activeModalItem, setActiveModalItem] = useState(null);

  if (loading) return <PageLoader />;

  const indian = indices?.filter((i) => ['NIFTY 50', 'SENSEX', 'NIFTY Bank', 'NIFTY IT', 'NIFTY Mid'].includes(i.name)) || [];
  const global = indices?.filter((i) => ['S&P 500', 'NASDAQ', 'DOW JONES'].includes(i.name)) || [];

  const niftyData = Array.from({ length: 12 }, (_, i) => 23800 + i * 50 + (Math.random() - 0.4) * 200);
  const sensexData = niftyData.map(v => v * 3.29);

  // Ask AI about a specific Index
  const handleAskAIIndex = (index) => {
    const isUp = (index.change ?? 0) >= 0;
    const meta = INDEX_DETAILS[index.name] || {};
    const region = ['S&P 500', 'NASDAQ', 'DOW JONES'].includes(index.name) ? 'Global / US Equities' : 'Indian Equities (NSE/BSE)';

    const initialQuery = `Here is the live market data for ${index.name} that I am reviewing on the Market Dashboard:

[MARKET BENCHMARK DATA]
• Benchmark Index: ${index.name} (${meta.fullName || index.name})
• Region & Exchange: ${meta.region || region} · ${meta.exchange || 'Stock Exchange'}
• Current Level: ${index.value?.toLocaleString('en-IN') || 'N/A'}
• Today's Point Move: ${isUp ? '+' : ''}${index.changeAmt?.toLocaleString('en-IN') || '0'}
• Today's Percent Move: ${isUp ? '+' : ''}${index.change || 0}%
• Key Constituents: ${meta.topConstituents ? meta.topConstituents.join(', ') : 'Major sector heavyweights'}

Please provide:
1. Executive Market Analysis: What does ${index.name} represent, and what does today's move of ${isUp ? '+' : ''}${index.change}% indicate about current market sentiment?
2. Key Catalysts & Drivers: What specific domestic or international macroeconomic trends, institutional activity (FII/DII), or sectoral moves are influencing this price action?
3. Actionable Investor Guidance: For long-term investors, swing traders, and SIP contributors, what is the recommended stance given current market valuations?
4. Risk Factors & Downside Alerts: What upcoming economic data, central bank announcements, or volatility events should investors monitor closely?`;

    navigate('/chatbot', {
      state: {
        initialQuery,
        clearChat: true,
        marketContext: {
          name: index.name,
          value: index.value,
          change: index.change,
        }
      }
    });
  };

  // Ask AI about a specific Sector
  const handleAskAISector = (sector) => {
    const isUp = (sector.change ?? 0) >= 0;
    const meta = SECTOR_DETAILS[sector.name] || {};

    const initialQuery = `Here is the live sector performance data for the ${sector.name} sector that I am reviewing on the Market Dashboard:

[SECTOR PERFORMANCE DATA]
• Sector Name: ${meta.name || sector.name}
• Today's Price Change: ${isUp ? '+' : ''}${sector.change}%
• Performance Sentiment: ${isUp ? 'Leading Sector / Bullish Momentum' : 'Lagging Sector / Pullback / Consolidation'}
• Top Sector Heavyweights: ${meta.topPicks ? meta.topPicks.join(', ') : 'Industry sector leaders'}
• Core Sector Nature: ${meta.description || 'Major economic sector in India'}

Please provide:
1. Sector Deep Dive: What is the current operational and earnings outlook for India's ${sector.name} sector?
2. Movement Catalysts: What macroeconomic, regulatory, or global factors are driving today's ${isUp ? '+' : ''}${sector.change}% move?
3. Portfolio Strategy: Should an investor overweight, hold, or rebalance exposure to ${sector.name} stocks right now?
4. Top Stocks & Pick Opportunities: Key market leaders and resilient performers within this sector worth tracking.`;

    navigate('/chatbot', {
      state: {
        initialQuery,
        clearChat: true,
        marketContext: {
          sector: sector.name,
          change: sector.change,
        }
      }
    });
  };

  // Ask AI General Market Summary / Prompt Pills
  const handleAskAIMarketOverview = (customPrompt) => {
    const defaultPrompt = `Here is a real-time summary of today's market session across Indian and Global benchmarks:

[LIVE BENCHMARK INDICES]
${(indices || []).map(i => `• ${i.name}: ${i.value?.toLocaleString('en-IN')} (${i.change >= 0 ? '+' : ''}${i.change}%)`).join('\n')}

[SECTOR ROTATION SUMMARY]
${SECTORS.map(s => `• ${s.name}: ${s.change >= 0 ? '+' : ''}${s.change}%`).join(', ')}

Please provide:
1. Comprehensive Market Wrap: A clear executive assessment of overall market breadth, liquidity, and investor risk appetite.
2. Intermarket Transmission: How global developments (US indices, yields, crude oil) are impacting Indian markets today.
3. Top Sector Opportunities: Which sectors present the best risk-adjusted upside and which require defensive caution?
4. Tactical Investment Advice: How retail and portfolio investors should allocate fresh capital under current conditions.`;

    navigate('/chatbot', {
      state: {
        initialQuery: customPrompt || defaultPrompt,
        clearChat: true,
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Title and Live Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white tracking-tight">Market Dashboard</h2>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-emerald-400 font-medium">Live</span>
          </div>
        </div>

        {/* Global Ask AI Action */}
        <Button
          size="sm"
          onClick={() => handleAskAIMarketOverview()}
          className="self-start sm:self-auto py-2 px-4 shadow-lg shadow-emerald-500/10"
          icon={<Sparkles className="w-4 h-4 text-emerald-400" />}
        >
          Ask AI Market Analyst
        </Button>
      </div>

      {/* AI Market Copilot Quick Questions Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-gray-900/60 to-cyan-950/30 border border-emerald-500/20 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">AI Market Intelligence</p>
              <p className="text-xs text-gray-300">Click any prompt below for instant real-time market insights powered by AI</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleAskAIMarketOverview("Analyze why Indian benchmark indices (NIFTY 50 and SENSEX) are moving today and what is driving current market sentiment.")}
              className="text-xs py-1.5 px-3 rounded-lg bg-gray-800/80 hover:bg-gray-800 text-gray-200 hover:text-emerald-400 border border-gray-700/60 hover:border-emerald-500/40 transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-yellow-400" /> Why are markets moving today?
            </button>
            <button
              onClick={() => handleAskAIMarketOverview("Perform a sector rotation analysis based on today's sector heatmap. Which sectors are gaining momentum and which are seeing profit booking?")}
              className="text-xs py-1.5 px-3 rounded-lg bg-gray-800/80 hover:bg-gray-800 text-gray-200 hover:text-emerald-400 border border-gray-700/60 hover:border-emerald-500/40 transition-all flex items-center gap-1.5"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" /> Sector Rotation Analysis
            </button>
            <button
              onClick={() => handleAskAIMarketOverview("Compare Indian equity indices (NIFTY/SENSEX) performance with US/Global markets (S&P 500, NASDAQ, DOW). Are Indian markets outperforming or decoupling?")}
              className="text-xs py-1.5 px-3 rounded-lg bg-gray-800/80 hover:bg-gray-800 text-gray-200 hover:text-emerald-400 border border-gray-700/60 hover:border-emerald-500/40 transition-all flex items-center gap-1.5"
            >
              <Globe className="w-3.5 h-3.5 text-blue-400" /> India vs Global Markets
            </button>
          </div>
        </div>
      </div>

      {/* Indian indices */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
            <span>🇮🇳</span> Indian Markets
          </h3>
          <span className="text-xs text-gray-500">Click any index for deep AI analysis</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {indian.map((index) => (
            <IndexCard
              key={index.name}
              index={index}
              onOpenModal={(item) => setActiveModalItem({ type: 'index', data: item })}
              onAskAI={handleAskAIIndex}
            />
          ))}
        </div>
      </div>

      {/* Global indices */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-2">
            <span>🌍</span> Global Markets
          </h3>
          <span className="text-xs text-gray-500">Real-time international benchmarks</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {global.map((index) => (
            <IndexCard
              key={index.name}
              index={index}
              onOpenModal={(item) => setActiveModalItem({ type: 'index', data: item })}
              onAskAI={handleAskAIIndex}
            />
          ))}
        </div>
      </div>

      {/* Charts & Sector Heatmap */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <CardHeader title="NIFTY 50 & SENSEX" subtitle="Last 12 trading sessions" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAskAIMarketOverview("Provide a technical chart analysis of the NIFTY 50 and SENSEX trends over the last 12 sessions, key support and resistance levels.")}
              className="text-xs py-1 px-2.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              icon={<Sparkles className="w-3 h-3 text-emerald-400" />}
            >
              Analyze Chart
            </Button>
          </div>
          <div className="px-6 pb-6">
            <PerformanceChart
              labels={LABELS}
              datasets={[
                { label: 'NIFTY 50', data: niftyData,   color: '#10B981', fill: false },
                { label: 'SENSEX',   data: sensexData.map(v => v / 3.29), color: '#3B82F6', fill: false },
              ]}
              height={200}
            />
          </div>
        </Card>

        {/* Sector heatmap */}
        <Card>
          <div className="flex items-center justify-between px-6 pt-6 pb-2">
            <CardHeader title="Sector Performance" subtitle="Today's change (%) — Click to analyze" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAskAIMarketOverview("Summarize which sectors are leading the market today and which sectors are dragging the index down.")}
              className="text-xs py-1 px-2.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              icon={<Sparkles className="w-3 h-3 text-emerald-400" />}
            >
              Analyze Sectors
            </Button>
          </div>

          <div className="p-6 pt-0">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {SECTORS.map((s) => {
                const intensity = Math.min(Math.abs(s.change) / 3, 1);
                const bgColor = s.change >= 0
                  ? `rgba(16, 185, 129, ${0.1 + intensity * 0.3})`
                  : `rgba(239, 68, 68, ${0.1 + intensity * 0.3})`;
                const border = s.change >= 0 ? 'border-emerald-500/20 hover:border-emerald-500/50' : 'border-red-500/20 hover:border-red-500/50';

                return (
                  <button
                    key={s.name}
                    onClick={() => setActiveModalItem({ type: 'sector', data: s })}
                    style={{ backgroundColor: bgColor }}
                    className={`p-3 rounded-xl border ${border} text-center transition-all hover:scale-105 group cursor-pointer relative`}
                    title={`Click for ${s.name} Sector details & AI chat`}
                  >
                    <p className="text-xs text-gray-300 font-medium group-hover:text-white transition-colors">{s.name}</p>
                    <p className={`text-sm font-bold mt-1 ${s.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatPercent(s.change)}
                    </p>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-1 right-1">
                      <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      {/* Market Breadth */}
      <Card>
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <CardHeader title="Market Breadth" subtitle="Today's market participation statistics" />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleAskAIMarketOverview("Interpret today's market breadth metrics: advances (1,234) vs declines (987), A/D ratio of 1.25, and delivery % of 42.3%. What does this signal for institutional buying?")}
            className="text-xs py-1 px-2.5 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            icon={<Sparkles className="w-3 h-3 text-emerald-400" />}
          >
            Breadth Insights
          </Button>
        </div>

        <div className="p-6 pt-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Advances',      value: '1,234',     color: 'text-emerald-400' },
              { label: 'Declines',      value: '987',       color: 'text-red-400' },
              { label: 'Unchanged',     value: '124',       color: 'text-gray-400' },
              { label: 'A/D Ratio',     value: '1.25',      color: 'text-yellow-400' },
              { label: '52W Highs',     value: '89',        color: 'text-emerald-400' },
              { label: '52W Lows',      value: '23',        color: 'text-red-400' },
              { label: 'Total Volume',  value: '₹98,234Cr', color: 'text-blue-400' },
              { label: 'Delivery %',    value: '42.3%',     color: 'text-gray-300' },
            ].map((s) => (
              <div key={s.label} className="text-center bg-gray-800/30 rounded-xl p-4 border border-gray-700/20 hover:border-gray-700/50 transition-colors">
                <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Interactive Detail Modal (Like Recommendation Page) */}
      {activeModalItem && (
        <Modal
          isOpen={Boolean(activeModalItem)}
          onClose={() => setActiveModalItem(null)}
          title={
            activeModalItem.type === 'index'
              ? `${activeModalItem.data.name} Benchmark Analysis`
              : `${activeModalItem.data.name} Sector Performance & Insights`
          }
          size="lg"
        >
          {activeModalItem.type === 'index' ? (
            (() => {
              const idx = activeModalItem.data;
              const meta = INDEX_DETAILS[idx.name] || {};
              const isUp = (idx.change ?? 0) >= 0;

              return (
                <div className="space-y-5">
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium flex items-center gap-1.5">
                      <span>{meta.flag || '📈'}</span>
                      <span>{meta.type || 'Market Benchmark'}</span>
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-gray-800 text-gray-300 border border-gray-700">
                      {meta.exchange || 'Equities Exchange'}
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-md font-bold ${
                      isUp ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}>
                      {isUp ? '+' : ''}{idx.change}% Today
                    </span>
                  </div>

                  {/* Financial Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
                    <div>
                      <p className="text-xs text-gray-400">Current Value</p>
                      <p className="text-lg font-bold text-white tracking-tight">
                        {idx.value?.toLocaleString('en-IN') || 'N/A'}
                      </p>
                      <p className="text-[11px] text-gray-500">Live Index Level</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Day Change</p>
                      <p className={`text-lg font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isUp ? '+' : ''}{idx.changeAmt?.toLocaleString('en-IN') || '0'}
                      </p>
                      <p className="text-[11px] text-gray-500">Points Movement</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Percent Change</p>
                      <p className={`text-lg font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatPercent(idx.change)}
                      </p>
                      <p className="text-[11px] text-gray-500">Daily Return</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Constituents</p>
                      <p className="text-lg font-bold text-white">
                        {meta.constituentsCount || 'Liquid Equities'}
                      </p>
                      <p className="text-[11px] text-gray-500">Market Coverage</p>
                    </div>
                  </div>

                  {/* In-depth descriptions */}
                  <div className="space-y-3.5 text-sm leading-relaxed">
                    <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-1.5">
                        <Info className="w-4 h-4" /> What is this index?
                      </h4>
                      <p className="text-gray-300">
                        {meta.description || 'A major equity market benchmark measuring the performance and capitalization of leading corporations.'}
                      </p>
                    </div>

                    <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> How does it work & Top Constituents?
                      </h4>
                      <p className="text-gray-300 mb-2">
                        {meta.howItWorks || 'Calculated using free-float market capitalization weighting methodology.'}
                      </p>
                      {meta.topConstituents && (
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-xs text-gray-400 font-semibold mr-1">Major holdings:</span>
                          {meta.topConstituents.map((c) => (
                            <span key={c} className="text-[11px] px-2 py-0.5 rounded-md bg-gray-900 text-gray-200 border border-gray-700 font-medium">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-1 flex items-center gap-1.5">
                        <Shield className="w-4 h-4" /> Market Drivers & Outlook
                      </h4>
                      <p className="text-gray-300">
                        {meta.keyDrivers || 'Driven by economic expansion, monetary policy, institutional inflows, and quarterly earnings.'}
                      </p>
                    </div>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveModalItem(null)}
                    >
                      Close
                    </Button>

                    <Button
                      size="sm"
                      icon={<Sparkles className="w-4 h-4" />}
                      onClick={() => {
                        const target = idx;
                        setActiveModalItem(null);
                        handleAskAIIndex(target);
                      }}
                    >
                      Discuss with AI Market Analyst
                    </Button>
                  </div>
                </div>
              );
            })()
          ) : (
            (() => {
              const sec = activeModalItem.data;
              const meta = SECTOR_DETAILS[sec.name] || {};
              const isUp = (sec.change ?? 0) >= 0;

              return (
                <div className="space-y-5">
                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>{meta.name || `${sec.name} Sector`}</span>
                    </span>
                    <span className={`text-xs px-2.5 py-1 rounded-md font-bold ${
                      isUp ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}>
                      {isUp ? '+' : ''}{sec.change}% Today
                    </span>
                  </div>

                  {/* Sector Summary Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-900/60 p-3.5 rounded-xl border border-gray-800">
                    <div>
                      <p className="text-xs text-gray-400">Sector Name</p>
                      <p className="text-base font-bold text-white">{sec.name}</p>
                      <p className="text-[11px] text-gray-500">Key Economic Sector</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Today's Move</p>
                      <p className={`text-base font-bold ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatPercent(sec.change)}
                      </p>
                      <p className="text-[11px] text-gray-500">Day Change</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">Momentum Status</p>
                      <p className={`text-base font-bold ${isUp ? 'text-emerald-400' : 'text-yellow-400'}`}>
                        {isUp ? 'Bullish / Expanding' : 'Consolidating / Pullback'}
                      </p>
                      <p className="text-[11px] text-gray-500">Short-Term Trend</p>
                    </div>
                  </div>

                  {/* Sector Content */}
                  <div className="space-y-3.5 text-sm leading-relaxed">
                    <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-1 flex items-center gap-1.5">
                        <Info className="w-4 h-4" /> Sector Overview
                      </h4>
                      <p className="text-gray-300">
                        {meta.description || 'A critical sectoral constituent driving domestic industrial and equity growth.'}
                      </p>
                    </div>

                    <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4" /> Top Leaders & Stock Picks
                      </h4>
                      <p className="text-gray-300 mb-2">Key heavyweight companies driving this sector's capitalization:</p>
                      {meta.topPicks && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {meta.topPicks.map((stock) => (
                            <span key={stock} className="text-xs px-2.5 py-1 rounded-md bg-gray-900 text-gray-200 border border-gray-700 font-mono">
                              {stock}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-gray-800/40 p-4 rounded-xl border border-gray-700/40">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-yellow-400 mb-1 flex items-center gap-1.5">
                        <Shield className="w-4 h-4" /> Primary Sector Drivers
                      </h4>
                      <p className="text-gray-300">
                        {meta.drivers || 'Earnings cycles, regulatory policy, raw material input prices, and institutional demand.'}
                      </p>
                    </div>
                  </div>

                  {/* Modal Footer Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-800">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setActiveModalItem(null)}
                    >
                      Close
                    </Button>

                    <Button
                      size="sm"
                      icon={<Sparkles className="w-4 h-4" />}
                      onClick={() => {
                        const target = sec;
                        setActiveModalItem(null);
                        handleAskAISector(target);
                      }}
                    >
                      Discuss with AI Market Analyst
                    </Button>
                  </div>
                </div>
              );
            })()
          )}
        </Modal>
      )}
    </div>
  );
}
