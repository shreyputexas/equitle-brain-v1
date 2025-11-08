// @ts-nocheck
import { db, FirestoreHelpers } from '../lib/firebase';
import logger from '../utils/logger';

export interface Deal {
  id?: string;
  company: string;
  description?: string;
  sector?: string;
  stage: 'prospect' | 'due-diligence' | 'term-sheet' | 'closing' | 'closed';
  status: 'active' | 'paused' | 'closed' | 'lost';
  value?: number;
  probability?: number;
  leadPartner?: string;
  team?: string[];
  tags?: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  targetClose?: Date;
  actualClose?: Date;
  nextStep?: string;
  lastActivity?: Date;
  source?: string;
  geography?: string;
  dealSize?: string;
  metrics?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
  // Relationships will be handled via references
  contactIds?: string[];
  documentIds?: string[];
  activityIds?: string[];
  communicationIds?: string[];
}

export class DealsFirestoreService {
  // Get all deals for a user
  static async getAllDeals(userId: string, options: {
    search?: string;
    sector?: string;
    stage?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const { search, sector, stage, status, limit = 50, offset = 0 } = options;

      let query = FirestoreHelpers.getUserCollection(userId, 'deals')
        .orderBy('updatedAt', 'desc');

      // Apply filters
      if (sector) {
        query = query.where('sector', '==', sector);
      }
      if (stage) {
        query = query.where('stage', '==', stage);
      }
      if (status) {
        query = query.where('status', '==', status);
      }

      // Apply pagination
      if (offset > 0) {
        const offsetSnapshot = await query.limit(offset).get();
        if (!offsetSnapshot.empty) {
          const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
          query = query.startAfter(lastDoc);
        }
      }

      const snapshot = await query.limit(limit).get();
      const deals = snapshot.docs.map(doc => {
        const data = doc.data();
        // Convert Firestore Timestamps to JavaScript Dates
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          lastActivity: data.lastActivity?.toDate ? data.lastActivity.toDate() : data.lastActivity,
          targetClose: data.targetClose?.toDate ? data.targetClose.toDate() : data.targetClose,
          actualClose: data.actualClose?.toDate ? data.actualClose.toDate() : data.actualClose,
        };
      });

      // Apply search filter (Firestore doesn't support full-text search natively)
      let filteredDeals = deals;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredDeals = deals.filter(deal =>
          deal.company?.toLowerCase().includes(searchLower) ||
          deal.description?.toLowerCase().includes(searchLower) ||
          deal.nextStep?.toLowerCase().includes(searchLower)
        );
      }

      // Get contact counts for each deal
      const dealsWithCounts = await Promise.all(
        filteredDeals.map(async (deal) => {
          const contactsSnapshot = await FirestoreHelpers.getUserCollection(userId, 'contacts')
            .where('dealId', '==', deal.id)
            .get();

          const activitiesSnapshot = await FirestoreHelpers.getUserCollection(userId, 'activities')
            .where('dealId', '==', deal.id)
            .get();

          const communicationsSnapshot = await FirestoreHelpers.getUserCollection(userId, 'communications')
            .where('dealId', '==', deal.id)
            .get();

          const documentsSnapshot = await FirestoreHelpers.getUserCollection(userId, 'documents')
            .where('dealId', '==', deal.id)
            .get();

          return {
            ...deal,
            _count: {
              contacts: contactsSnapshot.size,
              activities: activitiesSnapshot.size,
              communications: communicationsSnapshot.size,
              documents: documentsSnapshot.size,
            }
          };
        })
      );

      logger.info('Retrieved deals', { userId, count: dealsWithCounts.length });
      return { deals: dealsWithCounts, total: dealsWithCounts.length };
    } catch (error: any) {
      logger.error('Error getting deals:', error);
      throw new Error('Failed to retrieve deals');
    }
  }

  // Get single deal by ID
  static async getDealById(userId: string, dealId: string) {
    try {
      const dealDoc = await FirestoreHelpers.getUserDocInCollection(userId, 'deals', dealId).get();

      if (!dealDoc.exists) {
        throw new Error('Deal not found');
      }

      const rawDealData = dealDoc.data();
      // Convert Firestore Timestamps to JavaScript Dates
      const dealData = {
        id: dealDoc.id,
        ...rawDealData,
        createdAt: rawDealData.createdAt?.toDate ? rawDealData.createdAt.toDate() : rawDealData.createdAt,
        updatedAt: rawDealData.updatedAt?.toDate ? rawDealData.updatedAt.toDate() : rawDealData.updatedAt,
        lastActivity: rawDealData.lastActivity?.toDate ? rawDealData.lastActivity.toDate() : rawDealData.lastActivity,
        targetClose: rawDealData.targetClose?.toDate ? rawDealData.targetClose.toDate() : rawDealData.targetClose,
        actualClose: rawDealData.actualClose?.toDate ? rawDealData.actualClose.toDate() : rawDealData.actualClose,
      };

      // Get related data
      const [contactsSnapshot, activitiesSnapshot, communicationsSnapshot, documentsSnapshot] = await Promise.all([
        FirestoreHelpers.getUserCollection(userId, 'contacts').where('dealId', '==', dealId).get(),
        FirestoreHelpers.getUserCollection(userId, 'activities').where('dealId', '==', dealId).orderBy('date', 'desc').get(),
        FirestoreHelpers.getUserCollection(userId, 'communications').where('dealId', '==', dealId).orderBy('sentAt', 'desc').get(),
        FirestoreHelpers.getUserCollection(userId, 'documents').where('dealId', '==', dealId).orderBy('createdAt', 'desc').get(),
      ]);

      const contacts = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const activities = activitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const communications = communicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const documents = documentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      logger.info('Retrieved deal details', { userId, dealId });
      return {
        deal: {
          ...dealData,
          contacts,
          activities,
          communications,
          documents
        }
      };
    } catch (error: any) {
      logger.error('Error getting deal:', error);
      if (error.message === 'Deal not found') {
        throw error;
      }
      throw new Error('Failed to retrieve deal');
    }
  }

  // Create new deal
  static async createDeal(userId: string, dealData: Omit<Deal, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = FirestoreHelpers.serverTimestamp();
      const newDeal = {
        ...dealData,
        lastActivity: now,
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await FirestoreHelpers.getUserCollection(userId, 'deals').add(newDeal);
      const createdDeal = await docRef.get();

      logger.info('Deal created', { userId, dealId: docRef.id, company: dealData.company });

      const createdDealData = createdDeal.data();
      // Convert Firestore Timestamps to JavaScript Dates
      const convertedDeal = {
        id: docRef.id,
        ...createdDealData,
        createdAt: createdDealData.createdAt?.toDate ? createdDealData.createdAt.toDate() : createdDealData.createdAt,
        updatedAt: createdDealData.updatedAt?.toDate ? createdDealData.updatedAt.toDate() : createdDealData.updatedAt,
        lastActivity: createdDealData.lastActivity?.toDate ? createdDealData.lastActivity.toDate() : createdDealData.lastActivity,
        targetClose: createdDealData.targetClose?.toDate ? createdDealData.targetClose.toDate() : createdDealData.targetClose,
        actualClose: createdDealData.actualClose?.toDate ? createdDealData.actualClose.toDate() : createdDealData.actualClose,
        _count: {
          contacts: 0,
          activities: 0,
          communications: 0,
          documents: 0,
        }
      };

      return {
        deal: convertedDeal
      };
    } catch (error: any) {
      logger.error('Error creating deal:', error);
      throw new Error('Failed to create deal');
    }
  }

  // Update deal
  static async updateDeal(userId: string, dealId: string, updates: Partial<Deal>) {
    try {
      // Check if deal exists and belongs to user
      const dealRef = FirestoreHelpers.getUserDocInCollection(userId, 'deals', dealId);
      const dealDoc = await dealRef.get();

      if (!dealDoc.exists) {
        throw new Error('Deal not found');
      }

      const updateData = {
        ...updates,
        lastActivity: FirestoreHelpers.serverTimestamp(),
        updatedAt: FirestoreHelpers.serverTimestamp(),
      };

      await dealRef.update(updateData);

      // Get updated deal
      const updatedDeal = await dealRef.get();

      logger.info('Deal updated', { userId, dealId, updatedFields: Object.keys(updates) });

      return {
        deal: {
          id: dealId,
          ...updatedDeal.data(),
          _count: {
            contacts: 0, // TODO: Get actual counts
            activities: 0,
            communications: 0,
            documents: 0,
          }
        }
      };
    } catch (error: any) {
      logger.error('Error updating deal:', error);
      if (error.message === 'Deal not found') {
        throw error;
      }
      throw new Error('Failed to update deal');
    }
  }

  // Delete (archive) deal
  static async deleteDeal(userId: string, dealId: string) {
    try {
      // Check if deal exists and belongs to user
      const dealRef = FirestoreHelpers.getUserDocInCollection(userId, 'deals', dealId);
      const dealDoc = await dealRef.get();

      if (!dealDoc.exists) {
        throw new Error('Deal not found');
      }

      // Soft delete by updating status
      await dealRef.update({
        status: 'closed',
        updatedAt: FirestoreHelpers.serverTimestamp(),
      });

      const dealData = dealDoc.data();
      logger.info('Deal archived', { userId, dealId, company: dealData?.company });

      return { message: 'Deal archived successfully' };
    } catch (error: any) {
      logger.error('Error archiving deal:', error);
      if (error.message === 'Deal not found') {
        throw error;
      }
      throw new Error('Failed to archive deal');
    }
  }

  // Add contact to deal
  static async addContactToDeal(userId: string, dealId: string, contactId: string) {
    try {
      // Verify deal exists
      const dealRef = FirestoreHelpers.getUserDocInCollection(userId, 'deals', dealId);
      const dealDoc = await dealRef.get();

      if (!dealDoc.exists) {
        throw new Error('Deal not found');
      }

      // Verify contact exists
      const contactRef = FirestoreHelpers.getUserDocInCollection(userId, 'contacts', contactId);
      const contactDoc = await contactRef.get();

      if (!contactDoc.exists) {
        throw new Error('Contact not found');
      }

      const contactData = contactDoc.data();

      // Make this idempotent - if contact is already associated with this deal, just return success
      if (contactData?.dealId === dealId) {
        logger.info('Contact already associated with deal', {
          userId,
          dealId,
          contactId,
          contactName: contactData?.name
        });
        return { message: 'Contact already associated with deal' };
      }

      // Update contact to associate with deal
      await contactRef.update({
        dealId,
        updatedAt: FirestoreHelpers.serverTimestamp(),
      });

      const dealData = dealDoc.data();

      logger.info('Contact added to deal', {
        userId,
        dealId,
        contactId,
        dealCompany: dealData?.company,
        contactName: contactData?.name
      });

      return { message: 'Contact added to deal successfully' };
    } catch (error: any) {
      logger.error('Error adding contact to deal:', error);
      logger.error('Error stack:', error.stack);
      if (error.message === 'Deal not found' || error.message === 'Contact not found') {
        throw error;
      }
      throw new Error('Failed to add contact to deal');
    }
  }

  // Remove contact from deal
  static async removeContactFromDeal(userId: string, dealId: string, contactId: string) {
    try {
      // Verify deal exists
      const dealRef = FirestoreHelpers.getUserDocInCollection(userId, 'deals', dealId);
      const dealDoc = await dealRef.get();

      if (!dealDoc.exists) {
        throw new Error('Deal not found');
      }

      // Verify contact exists
      const contactRef = FirestoreHelpers.getUserDocInCollection(userId, 'contacts', contactId);
      const contactDoc = await contactRef.get();

      if (!contactDoc.exists) {
        throw new Error('Contact not found');
      }

      const contactData = contactDoc.data();
      const dealData = dealDoc.data();

      // Make this idempotent - if contact is not associated with this deal (or has no dealId), just return success
      if (!contactData?.dealId || contactData?.dealId !== dealId) {
        logger.info('Contact not associated with deal (already removed or never added)', {
          userId,
          dealId,
          contactId,
          contactDealId: contactData?.dealId,
          contactName: contactData?.name
        });
        return { message: 'Contact not associated with deal' };
      }

      // Remove contact from deal by clearing dealId
      await contactRef.update({
        dealId: FirestoreHelpers.deleteField(),
        updatedAt: FirestoreHelpers.serverTimestamp(),
      });

      logger.info('Contact removed from deal', {
        userId,
        dealId,
        contactId,
        dealCompany: dealData?.company,
        contactName: contactData?.name
      });

      return { message: 'Contact removed from deal successfully' };
    } catch (error: any) {
      logger.error('Error removing contact from deal:', error);
      logger.error('Error stack:', error.stack);
      if (error.message === 'Deal not found' || error.message === 'Contact not found') {
        throw error;
      }
      throw new Error('Failed to remove contact from deal');
    }
  }

  // Get deals by stage
  static async getDealsByStage(userId: string, stage: string) {
    try {
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'deals')
        .where('stage', '==', stage)
        .orderBy('updatedAt', 'desc')
        .get();

      const deals = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      logger.info('Retrieved deals by stage', { userId, stage, count: deals.length });
      return deals;
    } catch (error: any) {
      logger.error('Error getting deals by stage:', error);
      throw new Error('Failed to retrieve deals by stage');
    }
  }

  // Get deals statistics
  static async getDealsStats(userId: string) {
    try {
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'deals').get();
      const deals = snapshot.docs.map(doc => doc.data());

      const stats = {
        total: deals.length,
        byStage: {},
        byStatus: {},
        totalValue: 0,
        averageProbability: 0,
      };

      let totalProbability = 0;
      let dealsWithProbability = 0;

      deals.forEach((deal: any) => {
        // Count by stage
        if (!stats.byStage[deal.stage]) {
          stats.byStage[deal.stage] = 0;
        }
        stats.byStage[deal.stage]++;

        // Count by status
        if (!stats.byStatus[deal.status]) {
          stats.byStatus[deal.status] = 0;
        }
        stats.byStatus[deal.status]++;

        // Sum total value
        if (deal.value) {
          stats.totalValue += deal.value;
        }

        // Calculate average probability
        if (deal.probability !== undefined && deal.probability !== null) {
          totalProbability += deal.probability;
          dealsWithProbability++;
        }
      });

      if (dealsWithProbability > 0) {
        stats.averageProbability = Math.round(totalProbability / dealsWithProbability);
      }

      logger.info('Retrieved deals statistics', { userId, totalDeals: stats.total });
      return stats;
    } catch (error: any) {
      logger.error('Error getting deals statistics:', error);
      throw new Error('Failed to retrieve deals statistics');
    }
  }
}