import { EmailAutoProcessor } from './emailAutoProcessor';
import { db, FirestoreHelpers } from '../lib/firebase';
import logger from '../utils/logger';

export class EmailSyncService {
  public static isRunning = false;
  private static intervalId: NodeJS.Timeout | null = null;

  static async startEmailSync() {
    if (this.isRunning) {
      logger.info('Email sync is already running');
      return;
    }
    
    this.isRunning = true;
    logger.info('Starting email sync service');
    
    // Run immediately
    await this.processAllUsers();
    
    // Then run every 5 minutes
    this.intervalId = setInterval(async () => {
      try {
        await this.processAllUsers();
      } catch (error) {
        logger.error('Email sync error:', error);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  static stopEmailSync() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    logger.info('Email sync service stopped');
  }

  private static async processAllUsers() {
    try {
      // Get all users who have email integrations
      const users = await this.getUsersWithEmailIntegration();
      
      logger.info(`Processing emails for ${users.length} users`);
      
      for (const user of users) {
        try {
          await EmailAutoProcessor.processAllEmails(user.id);
        } catch (error) {
          logger.error(`Error processing emails for user ${user.id}:`, error);
        }
      }
    } catch (error) {
      logger.error('Error in processAllUsers:', error);
    }
  }

  private static async getUsersWithEmailIntegration() {
    try {
      // Get users who have connected Gmail or Outlook
      const usersSnapshot = await db.collection('users').get();
      const users: any[] = [];
      
      for (const doc of usersSnapshot.docs) {
        const userData = doc.data();
        // Check if user has email integrations
        if (userData.hasGmailIntegration || userData.hasOutlookIntegration) {
          users.push({ id: doc.id, ...userData });
        }
      }
      
      return users;
    } catch (error) {
      logger.error('Error getting users with email integration:', error);
      return [];
    }
  }
}