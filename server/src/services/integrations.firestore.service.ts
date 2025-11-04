import { db, FirestoreHelpers } from '../lib/firebase';
import { Integration, GoogleTokens } from '../models/Integration';
import logger from '../utils/logger';

export interface FirestoreIntegration {
  id: string;
  userId: string;
  provider: 'google' | 'microsoft' | 'slack' | 'salesforce' | 'zoom';
  type: 'drive' | 'calendar' | 'profile' | 'gmail' | 'mail' | 'teams' | 'workspace' | 'crm' | 'video';
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scope: string[];
  profile: {
    email: string;
    name: string;
    picture?: string;
    id?: string;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class IntegrationsFirestoreService {
  private static COLLECTION = 'integrations';

  /**
   * Create a new integration for a user
   */
  static async create(data: Omit<FirestoreIntegration, 'id' | 'createdAt' | 'updatedAt'>): Promise<FirestoreIntegration> {
    try {
      const docRef = db.collection(this.COLLECTION).doc();

      const integration: FirestoreIntegration = {
        ...data,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await docRef.set({
        ...integration,
        createdAt: FirestoreHelpers.serverTimestamp(),
        updatedAt: FirestoreHelpers.serverTimestamp()
      });

      logger.info('Integration created successfully', {
        integrationId: integration.id,
        userId: integration.userId,
        provider: integration.provider,
        type: integration.type
      });

      return integration;
    } catch (error) {
      logger.error('Error creating integration:', error);
      throw new Error('Failed to create integration');
    }
  }

  /**
   * Find integrations for a user
   */
  static async findMany(filters: {
    userId: string;
    provider?: string;
    type?: string;
    isActive?: boolean;
  }): Promise<FirestoreIntegration[]> {
    try {
      let query = db.collection(this.COLLECTION)
        .where('userId', '==', filters.userId);

      if (filters.provider) {
        query = query.where('provider', '==', filters.provider);
      }
      if (filters.type) {
        query = query.where('type', '==', filters.type);
      }
      if (filters.isActive !== undefined) {
        query = query.where('isActive', '==', filters.isActive);
      }

      const snapshot = await query.get();
      const integrations: FirestoreIntegration[] = [];

      snapshot.forEach(doc => {
        const data = doc.data();
        integrations.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          expiresAt: data.expiresAt?.toDate()
        } as FirestoreIntegration);
      });

      logger.info('Integrations retrieved', {
        userId: filters.userId,
        count: integrations.length,
        filters
      });

      return integrations;
    } catch (error) {
      logger.error('Error finding integrations:', error);
      throw new Error('Failed to retrieve integrations');
    }
  }

  /**
   * Find a single integration
   */
  static async findFirst(filters: {
    userId: string;
    provider?: string;
    type?: string;
    isActive?: boolean;
  }): Promise<FirestoreIntegration | null> {
    try {
      const integrations = await this.findMany(filters);
      return integrations.length > 0 ? integrations[0] : null;
    } catch (error) {
      logger.error('Error finding integration:', error);
      throw new Error('Failed to find integration');
    }
  }

  /**
   * Update an integration
   */
  static async update(
    integrationId: string,
    data: Partial<Omit<FirestoreIntegration, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<FirestoreIntegration> {
    try {
      const docRef = db.collection(this.COLLECTION).doc(integrationId);

      const updateData = {
        ...data,
        updatedAt: FirestoreHelpers.serverTimestamp()
      };

      await docRef.update(updateData);

      // Get the updated document
      const doc = await docRef.get();
      if (!doc.exists) {
        throw new Error('Integration not found after update');
      }

      const updatedData = doc.data()!;
      const integration: FirestoreIntegration = {
        ...updatedData,
        id: doc.id,
        createdAt: updatedData.createdAt?.toDate() || new Date(),
        updatedAt: updatedData.updatedAt?.toDate() || new Date(),
        expiresAt: updatedData.expiresAt?.toDate()
      } as FirestoreIntegration;

      logger.info('Integration updated successfully', {
        integrationId,
        updatedFields: Object.keys(data)
      });

      return integration;
    } catch (error) {
      logger.error('Error updating integration:', error);
      throw new Error('Failed to update integration');
    }
  }

  /**
   * Delete integrations (supports multiple)
   */
  static async deleteMany(filters: {
    userId: string;
    provider?: string;
    type?: string;
  }): Promise<{ count: number }> {
    try {
      const integrations = await this.findMany(filters);

      if (integrations.length === 0) {
        return { count: 0 };
      }

      const batch = FirestoreHelpers.batch();
      integrations.forEach(integration => {
        const docRef = db.collection(this.COLLECTION).doc(integration.id);
        batch.delete(docRef);
      });

      await batch.commit();

      logger.info('Integrations deleted successfully', {
        count: integrations.length,
        filters
      });

      return { count: integrations.length };
    } catch (error) {
      logger.error('Error deleting integrations:', error);
      throw new Error('Failed to delete integrations');
    }
  }

  /**
   * Delete a single integration
   */
  static async delete(integrationId: string): Promise<void> {
    try {
      await db.collection(this.COLLECTION).doc(integrationId).delete();

      logger.info('Integration deleted successfully', { integrationId });
    } catch (error) {
      logger.error('Error deleting integration:', error);
      throw new Error('Failed to delete integration');
    }
  }

  /**
   * Check if a token is about to expire and needs refresh
   */
  static isTokenExpiringSoon(expiresAt: Date | null): boolean {
    if (!expiresAt) return false;

    const fiveMinutes = 5 * 60 * 1000;
    return (expiresAt.getTime() - Date.now()) <= fiveMinutes;
  }

  /**
   * Refresh access token for an integration
   */
  static async refreshToken(
    integrationId: string,
    refreshedTokens: GoogleTokens
  ): Promise<FirestoreIntegration> {
    try {
      const expiresAt = new Date(Date.now() + refreshedTokens.expires_in * 1000);

      return await this.update(integrationId, {
        accessToken: refreshedTokens.access_token,
        refreshToken: refreshedTokens.refresh_token,
        expiresAt
      });
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw new Error('Failed to refresh access token');
    }
  }

  /**
   * Get user's integrations by ID (for route compatibility)
   */
  static async findById(integrationId: string, userId: string): Promise<FirestoreIntegration | null> {
    try {
      const doc = await db.collection(this.COLLECTION).doc(integrationId).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data()!;

      // Verify the integration belongs to the user
      if (data.userId !== userId) {
        return null;
      }

      return {
        ...data,
        id: doc.id,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        expiresAt: data.expiresAt?.toDate()
      } as FirestoreIntegration;
    } catch (error) {
      logger.error('Error finding integration by ID:', error);
      throw new Error('Failed to find integration');
    }
  }
}

export default IntegrationsFirestoreService;