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

      // Only add association fields if they exist
      if (associatedDeal?.id) {
        emailToStore.associatedDealId = associatedDeal.id;
      }
      if (associatedDeal?.company) {
        emailToStore.associatedDealCompany = associatedDeal.company;
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