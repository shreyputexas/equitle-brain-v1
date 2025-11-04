import { db } from '../lib/firebase';
import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, getDoc, orderBy, query } from 'firebase/firestore';
import { getUserId } from '../utils/auth';

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


const getCollection = () => {
  const userId = getUserId();
  return collection(db, 'users', userId, 'investmentTheses');
};

export const thesisApi = {
  // Get all investment theses
  async getTheses(): Promise<InvestmentThesis[]> {
    try {
      const q = query(getCollection(), orderBy('createdAt', 'asc'));
      const snapshot = await getDocs(q);
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
      const docRef = await addDoc(getCollection(), {
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
      const docRef = doc(getCollection(), thesisId);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: now,
      });
      const updatedDoc = await getDoc(docRef);
      return { id: updatedDoc.id, ...updatedDoc.data() } as InvestmentThesis;
    } catch (error) {
      console.error('Error updating investment thesis:', error);
      throw error;
    }
  },

  // Delete an investment thesis
  async deleteThesis(thesisId: string): Promise<void> {
    try {
      await deleteDoc(doc(getCollection(), thesisId));
    } catch (error) {
      console.error('Error deleting investment thesis:', error);
      throw error;
    }
  },

  // Get a specific investment thesis
  async getThesis(thesisId: string): Promise<InvestmentThesis> {
    try {
      const docSnap = await getDoc(doc(getCollection(), thesisId));
      if (!docSnap.exists()) {
        throw new Error('Investment thesis not found');
      }
      return { id: docSnap.id, ...docSnap.data() } as InvestmentThesis;
    } catch (error) {
      console.error('Error getting investment thesis:', error);
      throw error;
    }
  }
};