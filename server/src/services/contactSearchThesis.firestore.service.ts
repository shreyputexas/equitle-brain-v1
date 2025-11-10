import { db } from '../lib/firebase';
import logger from '../utils/logger';

export interface PeopleCriteria {
  industries: string;
  location: string;
  companySizeRange: string;
  fundingStage: string;
  technologies: string;
  jobDepartments: string;
}

export interface BrokerCriteria {
  industries: string;
  subindustries: string;
  location: string;
  experience: string;
  dealSize: string;
  keywords: string;
}

export interface InvestorCriteria {
  industries: string;
  subindustries: string;
  location: string;
  investmentStage: string;
  checkSize: string;
  keywords: string;
}

export interface ContactSearchThesis {
  id?: string;
  name: string;
  contactType: 'people' | 'brokers' | 'investors';
  peopleCriteria?: PeopleCriteria;
  brokerCriteria?: BrokerCriteria;
  investorCriteria?: InvestorCriteria;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ContactSearchThesisFirestoreService {
  private static getCollection(userId: string) {
    return db.collection('users').doc(userId).collection('contactSearchTheses');
  }

  static async createThesis(userId: string, thesisData: Omit<ContactSearchThesis, 'id' | 'createdAt' | 'updatedAt'>): Promise<ContactSearchThesis> {
    try {
      const now = new Date();
      const docRef = await this.getCollection(userId).add({
        ...thesisData,
        createdAt: now,
        updatedAt: now,
      });
      logger.info(`Contact search thesis created for user ${userId} with ID: ${docRef.id}`);
      return { id: docRef.id, ...thesisData, createdAt: now, updatedAt: now };
    } catch (error) {
      logger.error(`Error creating contact search thesis for user ${userId}:`, error);
      throw error;
    }
  }

  static async getThesis(userId: string, thesisId: string): Promise<ContactSearchThesis | null> {
    try {
      const doc = await this.getCollection(userId).doc(thesisId).get();
      if (!doc.exists) {
        return null;
      }
      const data = doc.data() as ContactSearchThesis;
      return { ...data, id: doc.id };
    } catch (error) {
      logger.error(`Error getting contact search thesis ${thesisId} for user ${userId}:`, error);
      throw error;
    }
  }

  static async getTheses(userId: string, contactType?: 'people' | 'brokers' | 'investors'): Promise<ContactSearchThesis[]> {
    try {
      let query = this.getCollection(userId).orderBy('createdAt', 'desc');

      // Filter by contact type if provided
      if (contactType) {
        query = query.where('contactType', '==', contactType) as any;
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactSearchThesis));
    } catch (error) {
      logger.error(`Error getting all contact search theses for user ${userId}:`, error);
      throw error;
    }
  }

  static async updateThesis(userId: string, thesisId: string, updateData: Partial<Omit<ContactSearchThesis, 'id' | 'createdAt'>>): Promise<ContactSearchThesis> {
    try {
      const now = new Date();
      await this.getCollection(userId).doc(thesisId).update({
        ...updateData,
        updatedAt: now,
      });
      logger.info(`Contact search thesis ${thesisId} updated for user ${userId}`);
      const updatedDoc = await this.getCollection(userId).doc(thesisId).get();
      return { id: updatedDoc.id, ...updatedDoc.data() } as ContactSearchThesis;
    } catch (error) {
      logger.error(`Error updating contact search thesis ${thesisId} for user ${userId}:`, error);
      throw error;
    }
  }

  static async deleteThesis(userId: string, thesisId: string): Promise<void> {
    try {
      await this.getCollection(userId).doc(thesisId).delete();
      logger.info(`Contact search thesis ${thesisId} deleted for user ${userId}`);
    } catch (error) {
      logger.error(`Error deleting contact search thesis ${thesisId} for user ${userId}:`, error);
      throw error;
    }
  }
}
