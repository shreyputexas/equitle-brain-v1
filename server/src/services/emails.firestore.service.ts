import { db, FirestoreHelpers } from '../lib/firebase';
import { DealsFirestoreService } from './deals.firestore.service';
import logger from '../utils/logger';

export interface EmailData {
  id?: string;
  sentiment: 'RED' | 'YELLOW' | 'GREEN';
  prospect_email: string;
  prospect_name?: string;
  email_subject?: string;
  email_body?: string;
  received_date?: string;
  message_id?: string;
  thread_id?: string;
  status?: string;
  source?: string;
  integrationId?: string; // Track which integration this email came from
  category?: string; // AI category: 'deal', 'investor', 'broker'
  subCategory?: string; // AI sub-category
  confidence?: number; // AI confidence score
  // Auto-generated fields
  createdAt?: Date;
  updatedAt?: Date;
  // Smart matching
  associatedDealId?: string | null;
  associatedDealCompany?: string | null;
}

export class EmailsFirestoreService {
  // Store email from Zapier webhook
  static async storeEmail(userId: string, emailData: EmailData) {
    try {
      logger.info('Storing email from Zapier', { userId, prospect_email: emailData.prospect_email, sentiment: emailData.sentiment });

      // Try to associate with existing deals based on email domain
      const associatedDeal = await this.findAssociatedDeal(userId, emailData.prospect_email);

      const emailToStore: any = {
        ...emailData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Only add association fields if they exist (don't store undefined values)
      if (associatedDeal?.id) {
        emailToStore.associatedDealId = associatedDeal.id;
      } else {
        emailToStore.associatedDealId = null;
      }
      if (associatedDeal?.company) {
        emailToStore.associatedDealCompany = associatedDeal.company;
      } else {
        emailToStore.associatedDealCompany = null;
      }

      // Store in Firebase
      const emailRef = await FirestoreHelpers.getUserCollection(userId, 'emails').add(emailToStore);

      logger.info('Email stored successfully', { emailId: emailRef.id, associatedDeal: associatedDeal?.company });

      return {
        id: emailRef.id,
        ...emailToStore
      };
    } catch (error) {
      logger.error('Error storing email:', error);
      throw error;
    }
  }

  // Get all emails for a user
  static async getEmails(userId: string, limit: number = 20) {
    try {
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'emails')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      const emails = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as EmailData[];

      return emails;
    } catch (error) {
      logger.error('Error fetching emails:', error);
      throw error;
    }
  }

  // Get emails filtered by active integrations
  static async getEmailsByIntegrations(
    userId: string, 
    integrationIds: string[], 
    limit: number = 20
  ) {
    try {
      // If no integrations are connected, return empty array
      if (integrationIds.length === 0) {
        logger.info('No active integrations, returning empty email list', { userId });
        return [];
      }

      // Fetch more emails than needed to account for filtering
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'emails')
        .orderBy('createdAt', 'desc')
        .limit(limit * 3) // Fetch 3x to ensure we get enough after filtering
        .get();

      // Filter to only include emails with matching integrationId
      const emails = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter((email: any) => {
          // Only include emails that have an integrationId AND it matches one of the active ones
          return email.integrationId && integrationIds.includes(email.integrationId);
        })
        .slice(0, limit) as EmailData[]; // Limit to requested amount

      logger.info('Filtered emails by integrations', { 
        userId, 
        integrationIds, 
        totalFetched: snapshot.docs.length,
        afterFilter: emails.length,
        emailCount: emails.length 
      });

      return emails;
    } catch (error) {
      logger.error('Error fetching emails by integrations:', error);
      throw error;
    }
  }

  // Delete emails for a specific integration
  static async deleteEmailsByIntegration(userId: string, integrationId: string): Promise<number> {
    try {
      logger.info('Deleting emails for integration', { userId, integrationId });
      
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'emails')
        .where('integrationId', '==', integrationId)
        .get();

      if (snapshot.empty) {
        logger.info('No emails found for integration', { userId, integrationId });
        return 0;
      }

      logger.info('Found emails to delete', { userId, integrationId, count: snapshot.docs.length });

      // Delete in batches (Firestore limit is 500 per batch)
      const batchSize = 500;
      let deletedCount = 0;

      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = db.batch();
        const docsToDelete = snapshot.docs.slice(i, i + batchSize);
        
        docsToDelete.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        deletedCount += docsToDelete.length;
      }

      logger.info('Successfully deleted emails', { userId, integrationId, deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Error deleting emails by integration:', error);
      throw error;
    }
  }

  // Delete ALL emails for a user (nuclear option)
  static async deleteAllEmails(userId: string): Promise<number> {
    try {
      logger.info('Deleting ALL emails for user', { userId });
      
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'emails')
        .get();

      if (snapshot.empty) {
        logger.info('No emails found', { userId });
        return 0;
      }

      logger.info('Found emails to delete', { userId, count: snapshot.docs.length });

      // Delete in batches (Firestore limit is 500 per batch)
      const batchSize = 500;
      let deletedCount = 0;

      for (let i = 0; i < snapshot.docs.length; i += batchSize) {
        const batch = db.batch();
        const docsToDelete = snapshot.docs.slice(i, i + batchSize);
        
        docsToDelete.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        deletedCount += docsToDelete.length;
      }

      logger.info('Successfully deleted ALL emails', { userId, deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Error deleting all emails:', error);
      throw error;
    }
  }

  // Delete emails without integrationId (cleanup utility)
  static async cleanupOrphanedEmails(userId: string): Promise<number> {
    try {
      logger.info('Starting cleanup of orphaned emails', { userId });
      
      const snapshot = await FirestoreHelpers.getUserCollection(userId, 'emails')
        .get();

      const orphanedEmails = snapshot.docs.filter(doc => {
        const data = doc.data();
        return !data.integrationId; // No integrationId means it's from an old integration
      });

      logger.info('Found orphaned emails', { userId, count: orphanedEmails.length });

      // Delete in batches (Firestore limit is 500 per batch)
      const batchSize = 500;
      let deletedCount = 0;

      for (let i = 0; i < orphanedEmails.length; i += batchSize) {
        const batch = db.batch();
        const docsToDelete = orphanedEmails.slice(i, i + batchSize);
        
        docsToDelete.forEach(doc => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        deletedCount += docsToDelete.length;
      }

      logger.info('Cleanup complete', { userId, deletedCount });
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up orphaned emails:', error);
      throw error;
    }
  }

  // Smart matching with existing deals
  private static async findAssociatedDeal(userId: string, prospectEmail: string) {
    try {
      if (!prospectEmail) return null;

      // Extract domain from email
      const emailDomain = prospectEmail.split('@')[1]?.toLowerCase();
      if (!emailDomain) return null;

      // Get all deals for user
      const dealsResult = await DealsFirestoreService.getAllDeals(userId);
      const deals = dealsResult.deals;

      // Try to match by company name in email domain
      for (const deal of deals) {
        if (deal.company) {
          const companyName = deal.company.toLowerCase();

          // Simple domain matching (could be enhanced)
          if (emailDomain.includes(companyName.replace(/\s+/g, '')) ||
              companyName.replace(/\s+/g, '').includes(emailDomain.replace(/\./g, ''))) {
            logger.info('Found deal association', {
              dealCompany: deal.company,
              emailDomain,
              dealId: deal.id
            });
            return deal;
          }
        }
      }

      logger.info('No deal association found', { emailDomain });
      return null;
    } catch (error) {
      logger.error('Error finding associated deal:', error);
      return null;
    }
  }
}