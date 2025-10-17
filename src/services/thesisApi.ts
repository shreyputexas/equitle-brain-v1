import { db } from '../lib/firebase';

export interface InvestmentCriteria {
  id: string;
  category: string;
  field: string;
  value: string | number;
  operator: string;
  weight: number;
  valuationType?: 'enterprise' | 'equity';
}

export interface InvestmentThesis {
  id?: string;
  name: string;
  criteria: InvestmentCriteria[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateThesisRequest {
  name: string;
  criteria: InvestmentCriteria[];
}

export interface UpdateThesisRequest {
  name?: string;
  criteria?: InvestmentCriteria[];
}

const getUserId = () => {
  // Get user ID from localStorage or use a default for development
  return localStorage.getItem('userId') || 'dev-user-123';
};

const getCollection = () => {
  const userId = getUserId();
  return db.collection('users').doc(userId).collection('investmentTheses');
};

export const thesisApi = {
  // Get all investment theses
  async getTheses(): Promise<InvestmentThesis[]> {
    try {
      const snapshot = await getCollection().orderBy('createdAt', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvestmentThesis));
    } catch (error) {
      console.error('Error fetching investment theses:', error);
      throw error;
    }
  },

  // Create a new investment thesis
  async createThesis(thesisData: CreateThesisRequest): Promise<InvestmentThesis> {
    try {
      const now = new Date();
      const docRef = await getCollection().add({
        ...thesisData,
        createdAt: now,
        updatedAt: now,
      });
      return { id: docRef.id, ...thesisData, createdAt: now, updatedAt: now };
    } catch (error) {
      console.error('Error creating investment thesis:', error);
      throw error;
    }
  },

  // Update an investment thesis
  async updateThesis(thesisId: string, updateData: UpdateThesisRequest): Promise<InvestmentThesis> {
    try {
      const now = new Date();
      await getCollection().doc(thesisId).update({
        ...updateData,
        updatedAt: now,
      });
      const updatedDoc = await getCollection().doc(thesisId).get();
      return { id: updatedDoc.id, ...updatedDoc.data() } as InvestmentThesis;
    } catch (error) {
      console.error('Error updating investment thesis:', error);
      throw error;
    }
  },

  // Delete an investment thesis
  async deleteThesis(thesisId: string): Promise<void> {
    try {
      await getCollection().doc(thesisId).delete();
    } catch (error) {
      console.error('Error deleting investment thesis:', error);
      throw error;
    }
  },

  // Get a specific investment thesis
  async getThesis(thesisId: string): Promise<InvestmentThesis> {
    try {
      const doc = await getCollection().doc(thesisId).get();
      if (!doc.exists) {
        throw new Error('Investment thesis not found');
      }
      return { id: doc.id, ...doc.data() } as InvestmentThesis;
    } catch (error) {
      console.error('Error getting investment thesis:', error);
      throw error;
    }
  }
};