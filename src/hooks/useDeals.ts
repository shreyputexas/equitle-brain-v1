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
      console.log('useDeals: Fetching deals with filters:', filters);
      const response = await dealsApi.getDeals(filters);
      console.log('useDeals: Full response received:', response);
      console.log('useDeals: response.deals:', response.deals);
      console.log('useDeals: response.deals length:', response.deals?.length);
      console.log('useDeals: response.total:', response.total);
      
      if (!response || !response.deals) {
        console.error('useDeals: Invalid response structure:', response);
        throw new Error('Invalid response structure: missing deals array');
      }
      
      // Ensure we have a valid array
      const dealsArray = Array.isArray(response.deals) ? response.deals : [];
      console.log('useDeals: Setting deals array:', dealsArray);
      console.log('useDeals: Deals array length:', dealsArray.length);
      console.log('useDeals: First deal:', dealsArray[0]);
      
      setDeals(dealsArray);
      setTotal(response.total || dealsArray.length);
      console.log('useDeals: Set deals state:', dealsArray.length, 'deals');
    } catch (err: any) {
      console.error('useDeals: Error fetching deals:', err);
      console.error('useDeals: Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.message || 'Failed to fetch deals');
      setDeals([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useDeals: useEffect triggered, calling fetchDeals');
    fetchDeals();
  }, [JSON.stringify(filters)]); // Re-fetch when filters change
  
  // Also log when deals state changes
  useEffect(() => {
    console.log('useDeals: deals state changed:', deals);
    console.log('useDeals: deals state length:', deals.length);
  }, [deals]);

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