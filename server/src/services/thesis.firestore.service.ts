import { db } from '../lib/firebase';
import logger from '../utils/logger';

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

export class ThesisFirestoreService {
  private static getCollection(userId: string) {
    return db.collection('users').doc(userId).collection('investmentTheses');
  }

  static async createThesis(userId: string, thesisData: Omit<InvestmentThesis, 'id' | 'createdAt' | 'updatedAt'>): Promise<InvestmentThesis> {
    try {
      const now = new Date();
      const docRef = await this.getCollection(userId).add({
        ...thesisData,
        createdAt: now,
        updatedAt: now,
      });
      logger.info(`Investment thesis created for user ${userId} with ID: ${docRef.id}`);
      return { id: docRef.id, ...thesisData, createdAt: now, updatedAt: now };
    } catch (error) {
      logger.error(`Error creating investment thesis for user ${userId}:`, error);
      throw error;
    }
  }

  static async getThesis(userId: string, thesisId: string): Promise<InvestmentThesis | null> {
    try {
      const doc = await this.getCollection(userId).doc(thesisId).get();
      if (!doc.exists) {
        return null;
      }
      const data = doc.data() as InvestmentThesis;
      return { ...data, id: doc.id };
    } catch (error) {
      logger.error(`Error getting investment thesis ${thesisId} for user ${userId}:`, error);
      throw error;
    }
  }

  static async getTheses(userId: string): Promise<InvestmentThesis[]> {
    try {
      const snapshot = await this.getCollection(userId).orderBy('createdAt', 'asc').get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InvestmentThesis));
    } catch (error) {
      logger.error(`Error getting all investment theses for user ${userId}:`, error);
      throw error;
    }
  }

  static async updateThesis(userId: string, thesisId: string, updateData: Partial<Omit<InvestmentThesis, 'id' | 'createdAt'>>): Promise<InvestmentThesis> {
    try {
      const now = new Date();
      await this.getCollection(userId).doc(thesisId).update({
        ...updateData,
        updatedAt: now,
      });
      logger.info(`Investment thesis ${thesisId} updated for user ${userId}`);
      const updatedDoc = await this.getCollection(userId).doc(thesisId).get();
      return { id: updatedDoc.id, ...updatedDoc.data() } as InvestmentThesis;
    } catch (error) {
      logger.error(`Error updating investment thesis ${thesisId} for user ${userId}:`, error);
      throw error;
    }
  }

  static async deleteThesis(userId: string, thesisId: string): Promise<void> {
    try {
      await this.getCollection(userId).doc(thesisId).delete();
      logger.info(`Investment thesis ${thesisId} deleted for user ${userId}`);
    } catch (error) {
      logger.error(`Error deleting investment thesis ${thesisId} for user ${userId}:`, error);
      throw error;
    }
  }
}
