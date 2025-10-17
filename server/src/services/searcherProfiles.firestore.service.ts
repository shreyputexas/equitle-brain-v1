import { db } from '../lib/firebase';
import logger from '../utils/logger';

export interface SearcherProfile {
  id: string;
  name: string;
  title: string;
  bio: string;
  why: string;
  education: Array<{
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description?: string;
  }>;
  experience: Array<{
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
    achievements?: string;
  }>;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class SearcherProfilesFirestoreService {
  private static readonly COLLECTION = 'searcherProfiles';

  static async createSearcherProfile(userId: string, searcherData: Omit<SearcherProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<SearcherProfile> {
    try {
      const now = new Date();
      const searcherProfile: Omit<SearcherProfile, 'id'> = {
        ...searcherData,
        createdAt: now,
        updatedAt: now
      };

      const docRef = await db.collection('users').doc(userId).collection(this.COLLECTION).add(searcherProfile);
      
      const createdProfile: SearcherProfile = {
        id: docRef.id,
        ...searcherProfile
      };

      logger.info(`Created searcher profile for user ${userId}:`, createdProfile);
      return createdProfile;
    } catch (error) {
      logger.error('Error creating searcher profile:', error);
      throw new Error('Failed to create searcher profile');
    }
  }

  static async getSearcherProfiles(userId: string): Promise<SearcherProfile[]> {
    try {
      const snapshot = await db.collection('users').doc(userId).collection(this.COLLECTION).get();
      
      const searcherProfiles: SearcherProfile[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        searcherProfiles.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as SearcherProfile);
      });

      logger.info(`Retrieved ${searcherProfiles.length} searcher profiles for user ${userId}`);
      return searcherProfiles;
    } catch (error) {
      logger.error('Error getting searcher profiles:', error);
      throw new Error('Failed to get searcher profiles');
    }
  }

  static async getSearcherProfile(userId: string, searcherId: string): Promise<SearcherProfile | null> {
    try {
      const doc = await db.collection('users').doc(userId).collection(this.COLLECTION).doc(searcherId).get();
      
      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      const searcherProfile: SearcherProfile = {
        id: doc.id,
        ...data,
        createdAt: data?.createdAt?.toDate() || new Date(),
        updatedAt: data?.updatedAt?.toDate() || new Date()
      } as SearcherProfile;

      logger.info(`Retrieved searcher profile ${searcherId} for user ${userId}`);
      return searcherProfile;
    } catch (error) {
      logger.error('Error getting searcher profile:', error);
      throw new Error('Failed to get searcher profile');
    }
  }

  static async updateSearcherProfile(userId: string, searcherId: string, updateData: Partial<Omit<SearcherProfile, 'id' | 'createdAt' | 'updatedAt'>>): Promise<SearcherProfile> {
    try {
      const now = new Date();
      const updatePayload = {
        ...updateData,
        updatedAt: now
      };

      await db.collection('users').doc(userId).collection(this.COLLECTION).doc(searcherId).update(updatePayload);
      
      const updatedProfile = await this.getSearcherProfile(userId, searcherId);
      if (!updatedProfile) {
        throw new Error('Searcher profile not found after update');
      }

      logger.info(`Updated searcher profile ${searcherId} for user ${userId}`);
      return updatedProfile;
    } catch (error) {
      logger.error('Error updating searcher profile:', error);
      throw new Error('Failed to update searcher profile');
    }
  }

  static async deleteSearcherProfile(userId: string, searcherId: string): Promise<void> {
    try {
      await db.collection('users').doc(userId).collection(this.COLLECTION).doc(searcherId).delete();
      
      logger.info(`Deleted searcher profile ${searcherId} for user ${userId}`);
    } catch (error) {
      logger.error('Error deleting searcher profile:', error);
      throw new Error('Failed to delete searcher profile');
    }
  }
}
