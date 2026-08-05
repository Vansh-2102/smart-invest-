import { useState, useEffect, useCallback } from 'react';
import { marketApi } from '../api/marketApi';

export function useMarket(type = 'indices') {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let res;
      switch (type) {
        case 'indices':     res = await marketApi.getIndices();       break;
        case 'stocks':      res = await marketApi.getTopStocks();     break;
        case 'mutualFunds': res = await marketApi.getMutualFunds();   break;
        case 'gold':        res = await marketApi.getGoldPrice();     break;
        case 'crypto':      res = await marketApi.getCryptoMarket();  break;
        case 'news':        res = await marketApi.getNewsSentiment(); break;
        case 'banking':     res = await marketApi.getBankingRates();  break;
        default:            res = await marketApi.getIndices();
      }
      setData(res.data);
    } catch {
      setError('Failed to load market data');
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}
