import { useState, useEffect } from 'react';
import { dealsApi, Deal, SearchFilters } from '../services/dealsApi';

export const useDeals = (filters: SearchFilters = {}) => {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await dealsApi.getDeals(filters);
      console.log('useDeals response:', response);
      setDeals(response.deals);
      setTotal(response.total);
    } catch (err: any) {
      console.error('Error fetching deals:', err);
      setError(err.message || 'Failed to fetch deals');
      setDeals([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, [JSON.stringify(filters)]); // Re-fetch when filters change

  const refreshDeals = () => {
    fetchDeals();
  };

  const createDeal = async (dealData: any) => {
    try {
      const response = await dealsApi.createDeal(dealData);
      await refreshDeals(); // Refresh the list
      return response.deal;
    } catch (err: any) {
      console.error('Error creating deal:', err);
      throw err;
    }
  };

  const updateDeal = async (id: string, dealData: any) => {
    try {
      const response = await dealsApi.updateDeal(id, dealData);
      await refreshDeals(); // Refresh the list
      return response.deal;
    } catch (err: any) {
      console.error('Error updating deal:', err);
      throw err;
    }
  };

  const deleteDeal = async (id: string) => {
    try {
      await dealsApi.deleteDeal(id);
      await refreshDeals(); // Refresh the list
    } catch (err: any) {
      console.error('Error deleting deal:', err);
      throw err;
    }
  };

  return {
    deals,
    loading,
    error,
    total,
    refreshDeals,
    createDeal,
    updateDeal,
    deleteDeal,
  };
};