// @ts-nocheck
import { db, FirestoreHelpers } from '../lib/firebase';
import logger from '../utils/logger';

export interface Investor {
  id?: string;
  name: string;
  type: string; // 'institutional', 'family-office', 'fund-of-funds', 'individual'
  status: string;
  totalCommitment?: number;
  totalCalled?: number;
  description?: string;
  website?: string;
  location?: string;
  founded?: Date;
  aum?: number; // Assets under management
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
  // Additional fields from the original Prisma model
  entities?: InvestorEntity[];
  groupMemberships?: string[]; // Array of LP group IDs
}

export interface InvestorEntity {
  id?: string;
  name: string;
  type: string; // 'direct-investment', 'private-banking', 'family-llc', etc.
  investmentType: string; // 'corporation', 'llc', 'partnership', 'trust'
  commitment?: number;
  called?: number;
  status: string;
  documents?: Record<string, any>;
  fundInvestments?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}

export class InvestorsFirestoreService {
  // Get all investors for a user
  static async getAllInvestors(userId: string) {
    try {
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'investors')
        .orderBy('createdAt', 'desc')
        .get();

      const investors = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const investorData = { id: doc.id, ...doc.data() };

          // Get entities for this investor
          const entitiesSnapshot = await FirestoreHelpers.getUserCollection(userId, 'investorEntities')
            .where('investorId', '==', doc.id)
            .get();

          const entities = entitiesSnapshot.docs.map(entityDoc => ({
            id: entityDoc.id,
            ...entityDoc.data()
          }));

          return {
            ...investorData,
            entities
          };
        })
      );

      logger.info('Retrieved investors', { userId, count: investors.length });
      return { investors };
    } catch (error: any) {
      logger.error('Error getting investors:', error);
      throw new Error('Failed to retrieve investors');
    }
  }

  // Get single investor by ID
  static async getInvestorById(userId: string, investorId: string) {
    try {
      const investorDoc = await FirestoreHelpers.getUserDocInCollection(userId, 'investors', investorId).get();

      if (!investorDoc.exists) {
        throw new Error('Investor not found');
      }

      const investorData = { id: investorDoc.id, ...investorDoc.data() };

      // Get entities for this investor
      const entitiesSnapshot = await FirestoreHelpers.getUserCollection(userId, 'investorEntities')
        .where('investorId', '==', investorId)
        .get();

      const entities = entitiesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      logger.info('Retrieved investor details', { userId, investorId });
      return {
        investor: {
          ...investorData,
          entities
        }
      };
    } catch (error: any) {
      logger.error('Error getting investor:', error);
      if (error.message === 'Investor not found') {
        throw error;
      }
      throw new Error('Failed to retrieve investor');
    }
  }

  // Create new investor
  static async createInvestor(userId: string, investorData: Omit<Investor, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = FirestoreHelpers.serverTimestamp();
      
      // Filter out undefined values to prevent Firestore errors
      const cleanInvestorData = Object.fromEntries(
        Object.entries(investorData).filter(([_, value]) => value !== undefined)
      );
      
      const newInvestor = {
        ...cleanInvestorData,
        status: investorData.status || 'active',
        totalCalled: investorData.totalCalled || 0,
        tags: investorData.tags || [],
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await FirestoreHelpers.getUserCollection(userId, 'investors').add(newInvestor);
      const createdInvestor = await docRef.get();

      logger.info('Investor created', { userId, investorId: docRef.id, name: investorData.name });

      // Auto-assign to default "All Limited Partners" group
      await this.assignToDefaultGroup(userId, docRef.id);

      return {
        investor: {
          id: docRef.id,
          ...createdInvestor.data(),
          entities: []
        }
      };
    } catch (error: any) {
      logger.error('Error creating investor:', error);
      throw new Error('Failed to create investor');
    }
  }

  // Update investor
  static async updateInvestor(userId: string, investorId: string, updates: Partial<Investor>) {
    try {
      // Check if investor exists and belongs to user
      const investorRef = FirestoreHelpers.getUserDocInCollection(userId, 'investors', investorId);
      const investorDoc = await investorRef.get();

      if (!investorDoc.exists) {
        throw new Error('Investor not found');
      }

      const updateData = {
        ...updates,
        updatedAt: FirestoreHelpers.serverTimestamp(),
      };

      await investorRef.update(updateData);

      // Get updated investor
      const updatedInvestor = await investorRef.get();

      logger.info('Investor updated', { userId, investorId, updatedFields: Object.keys(updates) });

      return {
        investor: {
          id: investorId,
          ...updatedInvestor.data(),
          entities: [] // TODO: Include entities if needed
        }
      };
    } catch (error: any) {
      logger.error('Error updating investor:', error);
      if (error.message === 'Investor not found') {
        throw error;
      }
      throw new Error('Failed to update investor');
    }
  }

  // Delete investor
  static async deleteInvestor(userId: string, investorId: string) {
    try {
      // Check if investor exists and belongs to user
      const investorRef = FirestoreHelpers.getUserDocInCollection(userId, 'investors', investorId);
      const investorDoc = await investorRef.get();

      if (!investorDoc.exists) {
        throw new Error('Investor not found');
      }

      // Delete all entities for this investor
      const entitiesSnapshot = await FirestoreHelpers.getUserCollection(userId, 'investorEntities')
        .where('investorId', '==', investorId)
        .get();

      // Delete all group memberships for this investor
      const groupMembershipsSnapshot = await FirestoreHelpers.getUserCollection(userId, 'investorGroupMembers')
        .where('investorId', '==', investorId)
        .get();

      const batch = FirestoreHelpers.batch();

      // Delete entities
      entitiesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete group memberships
      groupMembershipsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete investor
      batch.delete(investorRef);

      await batch.commit();

      const investorData = investorDoc.data();
      logger.info('Investor deleted', { userId, investorId, name: investorData?.name });

      return { message: 'Investor deleted successfully' };
    } catch (error: any) {
      logger.error('Error deleting investor:', error);
      if (error.message === 'Investor not found') {
        throw error;
      }
      throw new Error('Failed to delete investor');
    }
  }

  // Helper function to assign investor to default group
  private static async assignToDefaultGroup(userId: string, investorId: string) {
    try {
      // Find or create the default "All Limited Partners" group
      const lpGroupsSnapshot = await FirestoreHelpers.getUserCollection(userId, 'lpGroups')
        .where('type', '==', 'system')
        .where('name', '==', 'All Limited Partners')
        .get();

      let defaultGroupId: string;

      if (lpGroupsSnapshot.empty) {
        // Create the default group
        const defaultGroup = {
          name: 'All Limited Partners',
          description: 'Default group containing all Limited Partners',
          type: 'system',
          autoAssign: true,
          emailPreferences: {
            enableNotifications: true,
            frequency: 'monthly',
            types: ['quarterly_reports', 'capital_calls', 'performance_updates']
          },
          createdAt: FirestoreHelpers.serverTimestamp(),
          updatedAt: FirestoreHelpers.serverTimestamp(),
        };

        const groupRef = await FirestoreHelpers.getUserCollection(userId, 'lpGroups').add(defaultGroup);
        defaultGroupId = groupRef.id;

        logger.info('Created default LP group', { userId, groupId: defaultGroupId });
      } else {
        defaultGroupId = lpGroupsSnapshot.docs[0].id;
      }

      // Add investor to the default group
      await FirestoreHelpers.getUserCollection(userId, 'investorGroupMembers').add({
        investorId,
        groupId: defaultGroupId,
        autoAssigned: true,
        assignedAt: FirestoreHelpers.serverTimestamp(),
      });

      logger.info('Auto-assigned investor to default group', { userId, investorId, groupId: defaultGroupId });
    } catch (error: any) {
      logger.error('Error assigning investor to default group:', error);
      // Don't throw error to avoid blocking investor creation
    }
  }

  // Get investors by type
  static async getInvestorsByType(userId: string, type: string) {
    try {
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'investors')
        .where('type', '==', type)
        .orderBy('createdAt', 'desc')
        .get();

      const investors = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      logger.info('Retrieved investors by type', { userId, type, count: investors.length });
      return investors;
    } catch (error: any) {
      logger.error('Error getting investors by type:', error);
      throw new Error('Failed to retrieve investors by type');
    }
  }

  // Get investor statistics
  static async getInvestorsStats(userId: string) {
    try {
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'investors').get();
      const investors = snapshot.docs.map(doc => doc.data());

      const stats = {
        total: investors.length,
        byType: {},
        byStatus: {},
        totalCommitment: 0,
        totalCalled: 0,
        averageCommitment: 0,
        activeInvestors: 0,
      };

      let totalCommitment = 0;
      let totalCalled = 0;

      investors.forEach((investor: any) => {
        // Count by type
        if (!stats.byType[investor.type]) {
          stats.byType[investor.type] = 0;
        }
        stats.byType[investor.type]++;

        // Count by status
        if (!stats.byStatus[investor.status]) {
          stats.byStatus[investor.status] = 0;
        }
        stats.byStatus[investor.status]++;

        // Sum totals
        if (investor.totalCommitment) {
          totalCommitment += investor.totalCommitment;
        }
        if (investor.totalCalled) {
          totalCalled += investor.totalCalled;
        }

        // Count active investors
        if (investor.status === 'active') {
          stats.activeInvestors++;
        }
      });

      stats.totalCommitment = totalCommitment;
      stats.totalCalled = totalCalled;

      if (investors.length > 0) {
        stats.averageCommitment = Math.round(totalCommitment / investors.length);
      }

      logger.info('Retrieved investor statistics', { userId, totalInvestors: stats.total });
      return stats;
    } catch (error: any) {
      logger.error('Error getting investor statistics:', error);
      throw new Error('Failed to retrieve investor statistics');
    }
  }

  // Search investors
  static async searchInvestors(userId: string, searchTerm: string) {
    try {
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'investors').get();
      const investors = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Client-side search since Firestore doesn't support full-text search
      const searchLower = searchTerm.toLowerCase();
      const filteredInvestors = investors.filter((investor: any) =>
        investor.name?.toLowerCase().includes(searchLower) ||
        investor.type?.toLowerCase().includes(searchLower) ||
        investor.description?.toLowerCase().includes(searchLower) ||
        investor.location?.toLowerCase().includes(searchLower) ||
        investor.tags?.some((tag: string) => tag.toLowerCase().includes(searchLower))
      );

      logger.info('Searched investors', { userId, searchTerm, results: filteredInvestors.length });
      return filteredInvestors;
    } catch (error: any) {
      logger.error('Error searching investors:', error);
      throw new Error('Failed to search investors');
    }
  }

  // Add entity to investor
  static async addEntityToInvestor(userId: string, investorId: string, entityData: Omit<InvestorEntity, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // Verify investor exists
      const investorDoc = await FirestoreHelpers.getUserDocInCollection(userId, 'investors', investorId).get();
      if (!investorDoc.exists) {
        throw new Error('Investor not found');
      }

      const now = FirestoreHelpers.serverTimestamp();
      const newEntity = {
        ...entityData,
        investorId,
        status: entityData.status || 'active',
        called: entityData.called || 0,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await FirestoreHelpers.getUserCollection(userId, 'investorEntities').add(newEntity);
      const createdEntity = await docRef.get();

      logger.info('Entity added to investor', { userId, investorId, entityId: docRef.id, name: entityData.name });

      return {
        entity: {
          id: docRef.id,
          ...createdEntity.data()
        }
      };
    } catch (error: any) {
      logger.error('Error adding entity to investor:', error);
      if (error.message === 'Investor not found') {
        throw error;
      }
      throw new Error('Failed to add entity to investor');
    }
  }
}