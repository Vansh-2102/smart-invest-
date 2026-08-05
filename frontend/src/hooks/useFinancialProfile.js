import { useState, useEffect, useCallback } from 'react';
import { profileApi } from '../api/profileApi';

export function useFinancialProfile() {
  const [profile, setProfile]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await profileApi.getProfile();
      setProfile(res.data);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError(err.response?.data?.message || 'Failed to load financial profile');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await profileApi.createOrUpdate(data);
      setProfile(res.data);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to save financial profile';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { profile, loading, error, fetchProfile, updateProfile };
}
