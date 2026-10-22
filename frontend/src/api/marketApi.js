import axios from 'axios';

const ML_API_BASE = import.meta.env.VITE_ML_API_URL 
  ? import.meta.env.VITE_ML_API_URL.replace(/\/$/, '')
  : 'http://localhost:8000';

const mlApiClient = axios.create({
  baseURL: ML_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const marketApi = {
  // Market Indices - REAL DATA
  getIndices: async () => {
    const response = await mlApiClient.get('/api/market/indices');
    return response.data;
  },

  // Stocks - REAL DATA from ML service
  getTopStocks: async () => {
    const response = await mlApiClient.get('/api/market/stocks');
    return response.data;
  },

  getStockChart: async (symbol) => {
    const response = await mlApiClient.get(`/api/market/stocks/${symbol}/chart`);
    return response.data;
  },

  searchStocks: async (query) => {
    const response = await mlApiClient.get('/api/market/stocks/search', {
      params: { q: query },
    });
    return response.data;
  },

  // Mutual Funds - REAL DATA
  getMutualFunds: async () => {
    const response = await mlApiClient.get('/api/market/mutual-funds');
    return response.data;
  },

  searchMutualFunds: async (query) => {
    const response = await mlApiClient.get('/api/market/mutual-funds/search', {
      params: { q: query },
    });
    return response.data;
  },

  // Gold - REAL DATA
  getGoldPrice: async () => {
    const response = await mlApiClient.get('/api/market/gold');
    return response.data;
  },

  // Crypto - REAL DATA
  getCryptoMarket: async () => {
    const response = await mlApiClient.get('/api/market/crypto');
    return response.data;
  },

  getCryptoChart: async (symbol) => {
    const response = await mlApiClient.get(`/api/market/crypto/${symbol}/chart`);
    return response.data;
  },

  // News Sentiment (simulated)
  getNewsSentiment: async () => {
    await new Promise(res => setTimeout(res, 200));
    const generateDates = (count, intervalDays = 1) => {
      const dates = [];
      const now = new Date();
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i * intervalDays);
        dates.push(d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }));
      }
      return dates;
    };
    return {
      data: {
        overall: 'Bullish',
        score: 0.68,
        articles: [
          { title: 'RBI maintains repo rate, signals easing cycle ahead',     sentiment: 'Bullish', score: 0.82, source: 'Economic Times', time: '2h', category: 'Macro' },
          { title: 'IT sector Q4 results beat expectations, TCS leads gains', sentiment: 'Bullish', score: 0.76, source: 'Moneycontrol',   time: '4h', category: 'IT' },
          { title: 'FII outflows continue for third consecutive week',         sentiment: 'Bearish', score: -0.55,source: 'Business Today',  time: '5h', category: 'Markets' },
          { title: 'Gold prices touch all-time high on global uncertainty',    sentiment: 'Neutral', score: 0.12, source: 'LiveMint',        time: '6h', category: 'Gold' },
          { title: 'Crypto market rallies as Bitcoin crosses 60k USD',        sentiment: 'Bullish', score: 0.71, source: 'CoinDesk',        time: '7h', category: 'Crypto' },
          { title: 'HDFC Bank announces 20% dividend; stock surges 3%',        sentiment: 'Bullish', score: 0.79, source: 'NDTV Profit',     time: '8h', category: 'Banking' },
          { title: 'Inflation data higher than expected, markets cautious',    sentiment: 'Bearish', score: -0.62,source: 'Reuters',          time: '9h', category: 'Macro' },
          { title: 'Auto sector sales rise 15% YoY in June 2026',             sentiment: 'Bullish', score: 0.65, source: 'Business Standard','time': '10h', category: 'Auto' },
          { title: 'SEBI tightens F&O regulations amid retail investor concerns',sentiment:'Neutral', score: -0.10, source: 'Mint',           time: '12h', category: 'Regulation' },
          { title: 'Pharma stocks decline amid drug approval delays',          sentiment: 'Bearish', score: -0.48,source: 'Moneycontrol',   time: '14h', category: 'Pharma' },
        ],
        trendData: {
          labels: generateDates(14),
          bullish: Array.from({ length: 14 }, () => Math.floor(Math.random() * 40 + 30)),
          bearish: Array.from({ length: 14 }, () => Math.floor(Math.random() * 30 + 10)),
          neutral: Array.from({ length: 14 }, () => Math.floor(Math.random() * 20 + 10)),
        },
      },
    };
  },

  // Banking / FD Rates (simulated)
  getBankingRates: async () => {
    await new Promise(res => setTimeout(res, 200));
    return {
      data: {
        fdRates: [
          { bank: 'SBI',               type: 'Public Sector (PSU)',     '1y': 6.80, '2y': 7.00, '3y': 6.90, '5y': 6.50, seniorBonus: 0.50, safety: 'RBI Domestic Systemically Important Bank (D-SIB)' },
          { bank: 'HDFC Bank',         type: 'Premier Private Bank',    '1y': 7.10, '2y': 7.25, '3y': 7.00, '5y': 7.00, seniorBonus: 0.50, safety: 'RBI Domestic Systemically Important Bank (D-SIB)' },
          { bank: 'ICICI Bank',        type: 'Premier Private Bank',    '1y': 7.00, '2y': 7.20, '3y': 7.00, '5y': 7.00, seniorBonus: 0.50, safety: 'RBI Domestic Systemically Important Bank (D-SIB)' },
          { bank: 'Axis Bank',         type: 'Leading Private Bank',    '1y': 7.10, '2y': 7.25, '3y': 7.10, '5y': 6.75, seniorBonus: 0.50, safety: 'High Credit Rating / DICGC Insured' },
          { bank: 'Kotak Bank',        type: 'Leading Private Bank',    '1y': 7.10, '2y': 7.25, '3y': 7.00, '5y': 6.70, seniorBonus: 0.50, safety: 'High Capital Adequacy / DICGC Insured' },
          { bank: 'Bank of Baroda',    type: 'Public Sector (PSU)',     '1y': 6.85, '2y': 7.15, '3y': 7.05, '5y': 6.50, seniorBonus: 0.50, safety: 'Sovereign PSU Backing / DICGC Insured' },
          { bank: 'Punjab National Bank (PNB)', type: 'Public Sector (PSU)', '1y': 6.80, '2y': 7.10, '3y': 7.00, '5y': 6.50, seniorBonus: 0.50, safety: 'Sovereign PSU Backing / DICGC Insured' },
          { bank: 'Canara Bank',       type: 'Public Sector (PSU)',     '1y': 6.85, '2y': 7.00, '3y': 6.90, '5y': 6.70, seniorBonus: 0.50, safety: 'Sovereign PSU Backing / DICGC Insured' },
          { bank: 'Post Office',       type: 'Government of India',     '1y': 6.90, '2y': 7.00, '3y': 7.10, '5y': 7.50, seniorBonus: 0.00, safety: '100% Sovereign Government Guarantee' },
          { bank: 'IDFC First',        type: 'Growth Private Bank',     '1y': 7.50, '2y': 7.75, '3y': 7.50, '5y': 7.25, seniorBonus: 0.50, safety: 'High Growth / DICGC Insured up to ₹5L' },
          { bank: 'IndusInd Bank',     type: 'Private Bank',            '1y': 7.50, '2y': 7.75, '3y': 7.25, '5y': 7.25, seniorBonus: 0.50, safety: 'Private Commercial / DICGC Insured' },
          { bank: 'Federal Bank',      type: 'Private Bank',            '1y': 7.05, '2y': 7.20, '3y': 7.10, '5y': 6.75, seniorBonus: 0.50, safety: 'Commercial Bank / DICGC Insured' },
          { bank: 'AU Small Finance',  type: 'Small Finance Bank',      '1y': 7.75, '2y': 8.00, '3y': 7.75, '5y': 7.25, seniorBonus: 0.50, safety: 'RBI Scheduled Bank / DICGC Insured' },
          { bank: 'Unity Small Finance', type: 'Small Finance Bank',    '1y': 9.00, '2y': 9.00, '3y': 8.75, '5y': 8.50, seniorBonus: 0.50, safety: 'High Yield SFB / DICGC Insured up to ₹5L' },
          { bank: 'Equitas Small Finance', type: 'Small Finance Bank',  '1y': 8.20, '2y': 8.25, '3y': 8.00, '5y': 7.25, seniorBonus: 0.50, safety: 'RBI Scheduled Bank / DICGC Insured' },
        ],
        savingsRates: [
          { bank: 'SBI',       rate: 3.00, type: 'PSU' },
          { bank: 'HDFC Bank', rate: 3.50, type: 'Private' },
          { bank: 'ICICI',     rate: 3.50, type: 'Private' },
          { bank: 'Kotak',     rate: 4.00, type: 'Private' },
          { bank: 'IDFC First',rate: 7.00, type: 'Private' },
          { bank: 'AU Small',  rate: 7.25, type: 'Small Finance' },
          { bank: 'Equitas SFB', rate: 7.00, type: 'Small Finance' },
          { bank: 'RBL Bank',  rate: 6.50, type: 'Private' },
        ],
      },
    };
  },
};
