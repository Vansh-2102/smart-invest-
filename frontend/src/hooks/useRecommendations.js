import { useState, useEffect, useCallback } from 'react';
import { recommendationApi } from '../api/recommendationApi';

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [current, setCurrent]                 = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [generating, setGenerating]           = useState(false);
  const [error, setError]                     = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await recommendationApi.getHistory();
      setRecommendations(res.data);
      if (res.data.length > 0) setCurrent(res.data[0]);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const generate = useCallback(async (riskLevel, investmentAmount) => {
    setGenerating(true);
    setError(null);
    try {
      const res = await recommendationApi.generate(riskLevel, investmentAmount);
      setCurrent(res.data);
      setRecommendations((prev) => [res.data, ...prev]);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to generate recommendation';
      setError(msg);
      throw new Error(msg);
    } finally {
      setGenerating(false);
    }
  }, []);

  const selectRecommendation = useCallback(async (id) => {
    try {
      const res = await recommendationApi.getById(id);
      setCurrent(res.data);
    } catch {
      // Fallback: find in list
      const found = recommendations.find((r) => r.id === id);
      if (found) setCurrent(found);
    }
  }, [recommendations]);

  return { recommendations, current, loading, generating, error, generate, fetchHistory, selectRecommendation };
}
