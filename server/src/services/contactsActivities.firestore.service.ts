import { db, FirestoreHelpers } from '../lib/firebase';
import logger from '../utils/logger';

export interface Contact {
  id?: string;
  dealId?: string;
  googleContactId?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  title?: string;
  role?: string;
  linkedinUrl?: string;
  avatar?: string;
  notes?: string;
  tags?: string[];
  relationshipScore?: number; // 0-100
  lastContact?: Date;
  status: string; // 'hot', 'warm', 'cold', 'inactive'
  isKeyContact: boolean;
  source?: string; // 'google', 'manual', 'imported', etc.
  metadata?: Record<string, any>;
  website?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Activity {
  id?: string;
  dealId?: string;
  contactId?: string;
  type: string; // 'email', 'meeting', 'call', 'document', 'note', 'task'
  title: string;
  description?: string;
  content?: string; // Full content for notes, email body, etc.
  date: Date;
  duration?: number; // Duration in minutes
  location?: string;
  attendees?: string[]; // Array of attendee emails/names
  status: string; // 'scheduled', 'completed', 'cancelled'
  priority: string;
  outcome?: string;
  nextSteps?: string;
  metadata?: Record<string, any>; // Store provider-specific data
  externalId?: string; // ID from external system
  syncedFrom?: string; // Source: gmail, calendar, manual, etc.
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Communication {
  id?: string;
  dealId?: string;
  contactId?: string;
  type: string; // 'email', 'sms', 'call', 'meeting'
  subject?: string;
  content?: string;
  htmlContent?: string;
  fromEmail?: string;
  toEmails?: string[];
  ccEmails?: string[];
  bccEmails?: string[];
  threadId?: string; // Gmail thread ID
  messageId?: string; // Gmail message ID
  status: string; // 'draft', 'sent', 'received', 'failed'
  direction: string; // 'inbound', 'outbound'
  isRead: boolean;
  isImportant: boolean;
  labels?: string[]; // Gmail labels
  attachments?: Record<string, any>; // Store attachment info
  metadata?: Record<string, any>;
  sentAt?: Date;
  receivedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ContactsActivitiesFirestoreService {
  // === CONTACTS ===

  // Get all contacts for a user
  static async getAllContacts(userId: string, options: {
    dealId?: string;
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const { dealId, search, status, limit = 50, offset = 0 } = options;

      // Start with base collection
      let query: any = FirestoreHelpers.getUserCollection(userId, 'contacts');

      // Apply filters first
      if (dealId) {
        query = query.where('dealId', '==', dealId);
      }
      if (status) {
        query = query.where('status', '==', status);
      }

      // Only add orderBy if no dealId filter (to avoid requiring composite index)
      // When dealId is provided, we'll sort client-side
      if (!dealId) {
        query = query.orderBy('updatedAt', 'desc');
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
      let contacts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort client-side if we filtered by dealId
      if (dealId) {
        contacts.sort((a: any, b: any) => {
          const aTime = a.updatedAt?.toDate?.() || a.updatedAt || new Date(0);
          const bTime = b.updatedAt?.toDate?.() || b.updatedAt || new Date(0);
          return bTime - aTime;
        });
      }

      // Apply search filter (client-side)
      let filteredContacts = contacts;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredContacts = contacts.filter((contact: any) =>
          contact.name?.toLowerCase().includes(searchLower) ||
          contact.email?.toLowerCase().includes(searchLower) ||
          contact.company?.toLowerCase().includes(searchLower) ||
          contact.title?.toLowerCase().includes(searchLower)
        );
      }

      logger.info('Retrieved contacts', { userId, count: filteredContacts.length });
      return { contacts: filteredContacts, total: filteredContacts.length };
    } catch (error: any) {
      logger.error('Error getting contacts:', error);
      throw new Error('Failed to retrieve contacts');
    }
  }

  // Get single contact by ID
  static async getContactById(userId: string, contactId: string) {
    try {
      const contactDoc = await FirestoreHelpers.getUserDocInCollection(userId, 'contacts', contactId).get();

      if (!contactDoc.exists) {
        throw new Error('Contact not found');
      }

      const contactData = { id: contactDoc.id, ...contactDoc.data() };

      // Get related activities and communications
      const [activitiesSnapshot, communicationsSnapshot] = await Promise.all([
        FirestoreHelpers.getUserCollection(userId, 'activities')
          .where('contactId', '==', contactId)
          .orderBy('date', 'desc')
          .limit(10)
          .get(),
        FirestoreHelpers.getUserCollection(userId, 'communications')
          .where('contactId', '==', contactId)
          .orderBy('sentAt', 'desc')
          .limit(10)
          .get(),
      ]);

      const activities = activitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const communications = communicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      logger.info('Retrieved contact details', { userId, contactId });
      return {
        contact: {
          ...contactData,
          activities,
          communications
        }
      };
    } catch (error: any) {
      logger.error('Error getting contact:', error);
      if (error.message === 'Contact not found') {
        throw error;
      }
      throw new Error('Failed to retrieve contact');
    }
  }

  // Create new contact
  static async createContact(userId: string, contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = FirestoreHelpers.serverTimestamp();
      const newContact = {
        ...contactData,
        status: contactData.status || 'warm',
        isKeyContact: contactData.isKeyContact || false,
        tags: contactData.tags || [],
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await FirestoreHelpers.getUserCollection(userId, 'contacts').add(newContact);
      const createdContact = await docRef.get();

      logger.info('Contact created', { userId, contactId: docRef.id, name: contactData.name });

      return {
        contact: {
          id: docRef.id,
          ...createdContact.data()
        }
      };
    } catch (error: any) {
      logger.error('Error creating contact:', error);
      throw new Error('Failed to create contact');
    }
  }

  // Update contact
  static async updateContact(userId: string, contactId: string, updates: Partial<Contact>) {
    try {
      const contactRef = FirestoreHelpers.getUserDocInCollection(userId, 'contacts', contactId);
      const contactDoc = await contactRef.get();

      if (!contactDoc.exists) {
        throw new Error('Contact not found');
      }

      const updateData = {
        ...updates,
        updatedAt: FirestoreHelpers.serverTimestamp(),
      };

      await contactRef.update(updateData);
      const updatedContact = await contactRef.get();

      logger.info('Contact updated', { userId, contactId, updatedFields: Object.keys(updates) });

      return {
        contact: {
          id: contactId,
          ...updatedContact.data()
        }
      };
    } catch (error: any) {
      logger.error('Error updating contact:', error);
      if (error.message === 'Contact not found') {
        throw error;
      }
      throw new Error('Failed to update contact');
    }
  }

  // Delete contact
  static async deleteContact(userId: string, contactId: string) {
    try {
      const contactRef = FirestoreHelpers.getUserDocInCollection(userId, 'contacts', contactId);
      const contactDoc = await contactRef.get();

      if (!contactDoc.exists) {
        throw new Error('Contact not found');
      }

      await contactRef.delete();

      const contactData = contactDoc.data();
      logger.info('Contact deleted', { userId, contactId, name: contactData?.name });

      return { message: 'Contact deleted successfully' };
    } catch (error: any) {
      logger.error('Error deleting contact:', error);
      if (error.message === 'Contact not found') {
        throw error;
      }
      throw new Error('Failed to delete contact');
    }
  }

  // === ACTIVITIES ===

  // Get all activities for a user
  static async getAllActivities(userId: string, options: {
    dealId?: string;
    contactId?: string;
    type?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const { dealId, contactId, type, limit = 50, offset = 0 } = options;

      let query = FirestoreHelpers.getUserCollection(userId, 'activities')
        .orderBy('date', 'desc');

      // Apply filters
      if (dealId) {
        query = query.where('dealId', '==', dealId);
      }
      if (contactId) {
        query = query.where('contactId', '==', contactId);
      }
      if (type) {
        query = query.where('type', '==', type);
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
      const activities = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      logger.info('Retrieved activities', { userId, count: activities.length });
      return { activities, total: activities.length };
    } catch (error: any) {
      logger.error('Error getting activities:', error);
      throw new Error('Failed to retrieve activities');
    }
  }

  // Create new activity
  static async createActivity(userId: string, activityData: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = FirestoreHelpers.serverTimestamp();
      const newActivity = {
        ...activityData,
        status: activityData.status || 'completed',
        priority: activityData.priority || 'medium',
        attendees: activityData.attendees || [],
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await FirestoreHelpers.getUserCollection(userId, 'activities').add(newActivity);
      const createdActivity = await docRef.get();

      logger.info('Activity created', { userId, activityId: docRef.id, type: activityData.type });

      return {
        activity: {
          id: docRef.id,
          ...createdActivity.data()
        }
      };
    } catch (error: any) {
      logger.error('Error creating activity:', error);
      throw new Error('Failed to create activity');
    }
  }

  // === COMMUNICATIONS ===

  // Get all communications for a user
  static async getAllCommunications(userId: string, options: {
    dealId?: string;
    contactId?: string;
    type?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const { dealId, contactId, type, limit = 50, offset = 0 } = options;

      let query = FirestoreHelpers.getUserCollection(userId, 'communications')
        .orderBy('sentAt', 'desc');

      // Apply filters
      if (dealId) {
        query = query.where('dealId', '==', dealId);
      }
      if (contactId) {
        query = query.where('contactId', '==', contactId);
      }
      if (type) {
        query = query.where('type', '==', type);
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
      const communications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      logger.info('Retrieved communications', { userId, count: communications.length });
      return { communications, total: communications.length };
    } catch (error: any) {
      logger.error('Error getting communications:', error);
      throw new Error('Failed to retrieve communications');
    }
  }

  // Create new communication
  static async createCommunication(userId: string, communicationData: Omit<Communication, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = FirestoreHelpers.serverTimestamp();
      const newCommunication = {
        ...communicationData,
        status: communicationData.status || 'sent',
        isRead: communicationData.isRead || false,
        isImportant: communicationData.isImportant || false,
        labels: communicationData.labels || [],
        toEmails: communicationData.toEmails || [],
        ccEmails: communicationData.ccEmails || [],
        bccEmails: communicationData.bccEmails || [],
        createdAt: now,
        updatedAt: now,
      };

      const docRef = await FirestoreHelpers.getUserCollection(userId, 'communications').add(newCommunication);
      const createdCommunication = await docRef.get();

      logger.info('Communication created', { userId, communicationId: docRef.id, type: communicationData.type });

      return {
        communication: {
          id: docRef.id,
          ...createdCommunication.data()
        }
      };
    } catch (error: any) {
      logger.error('Error creating communication:', error);
      throw new Error('Failed to create communication');
    }
  }
}