import { db, FirestoreHelpers } from '../lib/firebase';
import logger from '../utils/logger';

export interface Fund {
  id?: string;
  name: string;
  type: string; // 'venture', 'growth', 'buyout', etc.
  strategy?: string;
  targetSize: number;
  minimumCommitment?: number;
  managementFee?: number;
  carriedInterest?: number;
  currency: string;
  vintage?: number;
  investmentPeriod?: number; // Years
  fundTerm?: number; // Years
  geoFocus?: string;
  sectorFocus?: string;
  description?: string;
  status: string; // 'Pre-Launch', 'Fundraising', 'Investing', 'Harvesting', 'Closed'
  raisedAmount: number;
  investorCount: number;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class FundsFirestoreService {
  // Get all funds for a user
  static async getAllFunds(userId: string) {
    try {
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'funds')
        .orderBy('createdAt', 'desc')
        .get();

      const funds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      logger.info('Retrieved funds', { userId, count: funds.length });
      return { funds };
    } catch (error: any) {
      logger.error('Error getting funds:', error);
      throw new Error('Failed to retrieve funds');
    }
  }

  // Get single fund by ID
  static async getFundById(userId: string, fundId: string) {
    try {
      const fundDoc = await FirestoreHelpers.getUserDocInCollection(userId, 'funds', fundId).get();

      if (!fundDoc.exists) {
        throw new Error('Fund not found');
      }

      const fund = { id: fundDoc.id, ...fundDoc.data() };

      logger.info('Retrieved fund details', { userId, fundId });
      return { fund };
    } catch (error: any) {
      logger.error('Error getting fund:', error);
      if (error.message === 'Fund not found') {
        throw error;
      }
      throw new Error('Failed to retrieve fund');
    }
  }

  // Create new fund
  static async createFund(userId: string, fundData: Omit<Fund, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = FirestoreHelpers.serverTimestamp();
      const newFund = {
        ...fundData,
        currency: fundData.currency || 'USD',
        status: fundData.status || 'Pre-Launch',
        raisedAmount: fundData.raisedAmount || 0,
        investorCount: fundData.investorCount || 0,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await FirestoreHelpers.getUserCollection(userId, 'funds').add(newFund);
      const createdFund = await docRef.get();

      logger.info('Fund created', { userId, fundId: docRef.id, name: fundData.name });

      return {
        fund: {
          id: docRef.id,
          ...createdFund.data()
        }
      };
    } catch (error: any) {
      logger.error('Error creating fund:', error);
      throw new Error('Failed to create fund');
    }
  }

  // Update fund
  static async updateFund(userId: string, fundId: string, updates: Partial<Fund>) {
    try {
      // Check if fund exists and belongs to user
      const fundRef = FirestoreHelpers.getUserDocInCollection(userId, 'funds', fundId);
      const fundDoc = await fundRef.get();

      if (!fundDoc.exists) {
        throw new Error('Fund not found');
      }

      const updateData = {
        ...updates,
        updatedAt: FirestoreHelpers.serverTimestamp(),
      };

      await fundRef.update(updateData);

      // Get updated fund
      const updatedFund = await fundRef.get();

      logger.info('Fund updated', { userId, fundId, updatedFields: Object.keys(updates) });

      return {
        fund: {
          id: fundId,
          ...updatedFund.data()
        }
      };
    } catch (error: any) {
      logger.error('Error updating fund:', error);
      if (error.message === 'Fund not found') {
        throw error;
      }
      throw new Error('Failed to update fund');
    }
  }

  // Delete fund
  static async deleteFund(userId: string, fundId: string) {
    try {
      // Check if fund exists and belongs to user
      const fundRef = FirestoreHelpers.getUserDocInCollection(userId, 'funds', fundId);
      const fundDoc = await fundRef.get();

      if (!fundDoc.exists) {
        throw new Error('Fund not found');
      }

      // Delete the fund document
      await fundRef.delete();

      const fundData = fundDoc.data();
      logger.info('Fund deleted', { userId, fundId, name: fundData?.name });

      return { message: 'Fund deleted successfully' };
    } catch (error: any) {
      logger.error('Error deleting fund:', error);
      if (error.message === 'Fund not found') {
        throw error;
      }
      throw new Error('Failed to delete fund');
    }
  }

  // Get funds by status
  static async getFundsByStatus(userId: string, status: string) {
    try {
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'funds')
        .where('status', '==', status)
        .orderBy('createdAt', 'desc')
        .get();

      const funds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      logger.info('Retrieved funds by status', { userId, status, count: funds.length });
      return funds;
    } catch (error: any) {
      logger.error('Error getting funds by status:', error);
      throw new Error('Failed to retrieve funds by status');
    }
  }

  // Get funds by type
  static async getFundsByType(userId: string, type: string) {
    try {
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'funds')
        .where('type', '==', type)
        .orderBy('createdAt', 'desc')
        .get();

      const funds = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      logger.info('Retrieved funds by type', { userId, type, count: funds.length });
      return funds;
    } catch (error: any) {
      logger.error('Error getting funds by type:', error);
      throw new Error('Failed to retrieve funds by type');
    }
  }

  // Get fund statistics
  static async getFundsStats(userId: string) {
    try {
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'funds').get();
      const funds = snapshot.docs.map(doc => doc.data());

      const stats = {
        total: funds.length,
        byStatus: {},
        byType: {},
        totalTargetSize: 0,
        totalRaisedAmount: 0,
        totalInvestorCount: 0,
        averageTargetSize: 0,
        fundraisingProgress: 0,
      };

      let totalTargetSize = 0;
      let totalRaisedAmount = 0;
      let totalInvestorCount = 0;

      funds.forEach((fund: any) => {
        // Count by status
        if (!stats.byStatus[fund.status]) {
          stats.byStatus[fund.status] = 0;
        }
        stats.byStatus[fund.status]++;

        // Count by type
        if (!stats.byType[fund.type]) {
          stats.byType[fund.type] = 0;
        }
        stats.byType[fund.type]++;

        // Sum totals
        if (fund.targetSize) {
          totalTargetSize += fund.targetSize;
        }
        if (fund.raisedAmount) {
          totalRaisedAmount += fund.raisedAmount;
        }
        if (fund.investorCount) {
          totalInvestorCount += fund.investorCount;
        }
      });

      stats.totalTargetSize = totalTargetSize;
      stats.totalRaisedAmount = totalRaisedAmount;
      stats.totalInvestorCount = totalInvestorCount;

      if (funds.length > 0) {
        stats.averageTargetSize = Math.round(totalTargetSize / funds.length);
      }

      if (totalTargetSize > 0) {
        stats.fundraisingProgress = Math.round((totalRaisedAmount / totalTargetSize) * 100);
      }

      logger.info('Retrieved funds statistics', { userId, totalFunds: stats.total });
      return stats;
    } catch (error: any) {
      logger.error('Error getting funds statistics:', error);
      throw new Error('Failed to retrieve funds statistics');
    }
  }

  // Update fund raised amount and investor count
  static async updateFundProgress(userId: string, fundId: string, raisedAmount: number, investorCount: number) {
    try {
      const fundRef = FirestoreHelpers.getUserDocInCollection(userId, 'funds', fundId);
      const fundDoc = await fundRef.get();

      if (!fundDoc.exists) {
        throw new Error('Fund not found');
      }

      await fundRef.update({
        raisedAmount,
        investorCount,
        updatedAt: FirestoreHelpers.serverTimestamp(),
      });

      const updatedFund = await fundRef.get();

      logger.info('Fund progress updated', { userId, fundId, raisedAmount, investorCount });

      return {
        fund: {
          id: fundId,
          ...updatedFund.data()
        }
      };
    } catch (error: any) {
      logger.error('Error updating fund progress:', error);
      if (error.message === 'Fund not found') {
        throw error;
      }
      throw new Error('Failed to update fund progress');
    }
  }

  // Search funds
  static async searchFunds(userId: string, searchTerm: string) {
    try {
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'funds').get();
      const funds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Client-side search since Firestore doesn't support full-text search
      const searchLower = searchTerm.toLowerCase();
      const filteredFunds = funds.filter((fund: any) =>
        fund.name?.toLowerCase().includes(searchLower) ||
        fund.type?.toLowerCase().includes(searchLower) ||
        fund.strategy?.toLowerCase().includes(searchLower) ||
        fund.description?.toLowerCase().includes(searchLower) ||
        fund.geoFocus?.toLowerCase().includes(searchLower) ||
        fund.sectorFocus?.toLowerCase().includes(searchLower)
      );

      logger.info('Searched funds', { userId, searchTerm, results: filteredFunds.length });
      return filteredFunds;
    } catch (error: any) {
      logger.error('Error searching funds:', error);
      throw new Error('Failed to search funds');
    }
  }
}