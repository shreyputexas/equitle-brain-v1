import React, { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';

interface BrainQuery {
  id: string;
  query: string;
  response: string;
  context: any[];
  timestamp: Date;
  userId: string;
}

interface KnowledgeItem {
  id: string;
  type: 'deal' | 'company' | 'contact' | 'document' | 'email' | 'meeting';
  title: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
  createdAt: Date;
  updatedAt: Date;
}

interface BrainContextType {
  queries: BrainQuery[];
  isProcessing: boolean;
  askBrain: (query: string) => Promise<BrainQuery>;
  searchKnowledge: (query: string, filters?: any) => Promise<KnowledgeItem[]>;
  addKnowledge: (item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  getSuggestions: (context: string) => Promise<string[]>;
  getInsights: (entityType: string, entityId: string) => Promise<any>;
  clearHistory: () => void;
}

const BrainContext = createContext<BrainContextType | undefined>(undefined);

export const useBrain = () => {
  const context = useContext(BrainContext);
  if (!context) {
    throw new Error('useBrain must be used within a BrainProvider');
  }
  return context;
};

export const BrainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queries, setQueries] = useState<BrainQuery[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const askBrain = useCallback(async (query: string): Promise<BrainQuery> => {
    setIsProcessing(true);
    try {
      const response = await axios.post('/api/brain/ask', { query });
      const data = response.data as any;
      const brainQuery: BrainQuery = {
        id: data.id,
        query,
        response: data.response,
        context: data.context,
        timestamp: new Date(data.timestamp),
        userId: data.userId
      };
      
      setQueries(prev => [brainQuery, ...prev]);
      return brainQuery;
    } catch (error) {
      console.error('Brain query failed:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const searchKnowledge = useCallback(async (query: string, filters?: any): Promise<KnowledgeItem[]> => {
    try {
      const response = await axios.post('/api/brain/search', { query, filters });
      return (response.data as any).results;
    } catch (error) {
      console.error('Knowledge search failed:', error);
      throw error;
    }
  }, []);

  const addKnowledge = useCallback(async (item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await axios.post('/api/brain/knowledge', item);
    } catch (error) {
      console.error('Failed to add knowledge:', error);
      throw error;
    }
  }, []);

  const getSuggestions = useCallback(async (context: string): Promise<string[]> => {
    try {
      const response = await axios.post('/api/brain/suggestions', { context });
      return (response.data as any).suggestions;
    } catch (error) {
      console.error('Failed to get suggestions:', error);
      return [];
    }
  }, []);

  const getInsights = useCallback(async (entityType: string, entityId: string): Promise<any> => {
    try {
      const response = await axios.get(`/api/brain/insights/${entityType}/${entityId}`);
      return (response.data as any).insights;
    } catch (error) {
      console.error('Failed to get insights:', error);
      throw error;
    }
  }, []);

  const clearHistory = useCallback(() => {
    setQueries([]);
  }, []);

  return (
    <BrainContext.Provider value={{
      queries,
      isProcessing,
      askBrain,
      searchKnowledge,
      addKnowledge,
      getSuggestions,
      getInsights,
      clearHistory
    }}>
      {children}
    </BrainContext.Provider>
  );
};