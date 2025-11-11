// @ts-nocheck
import { db, FirestoreHelpers } from '../lib/firebase';
import logger from '../utils/logger';

export interface Broker {
  id?: string;
  name: string;
  type?: string;
  dealSize?: string;
  specialization?: string;
  status: 'active' | 'paused' | 'closed' | 'not-interested';
  stage: 'all' | 'response-received' | 'closing';
  notes?: string;
  website?: string;
  location?: string;
  aum?: string;
  firmName?: string;
  brokerType?: 'firm' | 'individual';
  priority?: 'low' | 'medium' | 'high';
  nextStep?: string;
  lastActivity?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  // Relationships
  contactIds?: string[];
  communicationIds?: string[];
}

export class BrokersFirestoreService {
  // Get all brokers for a user
  static async getAllBrokers(userId: string, options: {
    search?: string;
    stage?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    try {
      const { search, stage, status, limit = 50, offset = 0 } = options;

      let query = FirestoreHelpers.getUserCollection(userId, 'brokers')
        .orderBy('updatedAt', 'desc');

      // Apply filters
      if (stage && stage !== 'all') {
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
      const brokers = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : data.updatedAt,
          lastActivity: data.lastActivity?.toDate ? data.lastActivity.toDate() : data.lastActivity,
        };
      });

      // Apply search filter
      let filteredBrokers = brokers;
      if (search) {
        const searchLower = search.toLowerCase();
        filteredBrokers = brokers.filter(broker =>
          broker.name?.toLowerCase().includes(searchLower) ||
          broker.firmName?.toLowerCase().includes(searchLower) ||
          broker.specialization?.toLowerCase().includes(searchLower) ||
          broker.nextStep?.toLowerCase().includes(searchLower)
        );
      }

      // Get contact counts and communications for each broker
      const brokersWithCounts = await Promise.all(
        filteredBrokers.map(async (broker) => {
          const contactsSnapshot = await FirestoreHelpers.getUserCollection(userId, 'contacts')
            .where('metadata.brokerId', '==', broker.id)
            .get();

          const communicationsSnapshot = await FirestoreHelpers.getUserCollection(userId, 'communications')
            .where('metadata.brokerId', '==', broker.id)
            .get();

          // Map communications to array and sort by createdAt
          const communications = communicationsSnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
              updatedAt: doc.data().updatedAt?.toDate ? doc.data().updatedAt.toDate() : doc.data().updatedAt,
            }))
            .sort((a, b) => {
              const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return dateB - dateA; // Descending order (newest first)
            });

          return {
            ...broker,
            contactCount: contactsSnapshot.size,
            communicationCount: communicationsSnapshot.size,
            communications: communications,
          };
        })
      );

      return {
        brokers: brokersWithCounts,
        total: brokersWithCounts.length
      };
    } catch (error: any) {
      logger.error('Error getting all brokers:', error);
      throw new Error('Failed to retrieve brokers');
    }
  }

  // Get single broker by ID with related data
  static async getBrokerById(userId: string, brokerId: string, options: { include?: string } = {}) {
    try {
      const brokerRef = FirestoreHelpers.getUserDocInCollection(userId, 'brokers', brokerId);
      const brokerDoc = await brokerRef.get();

      if (!brokerDoc.exists) {
        throw new Error('Broker not found');
      }

      const brokerData = brokerDoc.data();
      const broker = {
        id: brokerDoc.id,
        ...brokerData,
        createdAt: brokerData.createdAt?.toDate ? brokerData.createdAt.toDate() : brokerData.createdAt,
        updatedAt: brokerData.updatedAt?.toDate ? brokerData.updatedAt.toDate() : brokerData.updatedAt,
        lastActivity: brokerData.lastActivity?.toDate ? brokerData.lastActivity.toDate() : brokerData.lastActivity,
      };

      // Optionally include related data
      const includes = options.include?.split(',') || [];
      const relatedData: any = {};

      if (includes.includes('contacts')) {
        const contactsSnapshot = await FirestoreHelpers.getUserCollection(userId, 'contacts')
          .where('metadata.brokerId', '==', brokerId)
          .get();
        relatedData.contacts = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      if (includes.includes('communications')) {
        const communicationsSnapshot = await FirestoreHelpers.getUserCollection(userId, 'communications')
          .where('metadata.brokerId', '==', brokerId)
          .get();
        relatedData.communications = communicationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      return {
        broker: {
          ...broker,
          ...relatedData
        }
      };
    } catch (error: any) {
      logger.error('Error getting broker:', error);
      if (error.message === 'Broker not found') {
        throw error;
      }
      throw new Error('Failed to retrieve broker');
    }
  }

  // Create new broker
  static async createBroker(userId: string, brokerData: Omit<Broker, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const now = FirestoreHelpers.serverTimestamp();
      const newBroker = {
        ...brokerData,
        status: brokerData.status || 'active',
        stage: brokerData.stage || 'all',
        priority: brokerData.priority || 'medium',
        createdAt: now,
        updatedAt: now,
        lastActivity: now,
      };

      const docRef = await FirestoreHelpers.getUserCollection(userId, 'brokers').add(newBroker);
      const createdBroker = await docRef.get();

      logger.info('Broker created', { userId, brokerId: docRef.id, name: brokerData.name });

      return {
        broker: {
          id: docRef.id,
          ...createdBroker.data()
        }
      };
    } catch (error: any) {
      logger.error('Error creating broker:', error);
      throw new Error('Failed to create broker');
    }
  }

  // Update broker
  static async updateBroker(userId: string, brokerId: string, updates: Partial<Broker>) {
    try {
      const brokerRef = FirestoreHelpers.getUserDocInCollection(userId, 'brokers', brokerId);
      const brokerDoc = await brokerRef.get();

      if (!brokerDoc.exists) {
        throw new Error('Broker not found');
      }

      const updateData = {
        ...updates,
        updatedAt: FirestoreHelpers.serverTimestamp(),
        lastActivity: FirestoreHelpers.serverTimestamp(),
      };

      await brokerRef.update(updateData);
      const updatedBroker = await brokerRef.get();

      logger.info('Broker updated', { userId, brokerId, updatedFields: Object.keys(updates) });

      return {
        broker: {
          id: brokerId,
          ...updatedBroker.data()
        }
      };
    } catch (error: any) {
      logger.error('Error updating broker:', error);
      if (error.message === 'Broker not found') {
        throw error;
      }
      throw new Error('Failed to update broker');
    }
  }

  // Delete broker
  static async deleteBroker(userId: string, brokerId: string) {
    try {
      const brokerRef = FirestoreHelpers.getUserDocInCollection(userId, 'brokers', brokerId);
      const brokerDoc = await brokerRef.get();

      if (!brokerDoc.exists) {
        throw new Error('Broker not found');
      }

      await brokerRef.delete();

      const brokerData = brokerDoc.data();
      logger.info('Broker deleted', { userId, brokerId, name: brokerData?.name });

      return { message: 'Broker deleted successfully' };
    } catch (error: any) {
      logger.error('Error deleting broker:', error);
      if (error.message === 'Broker not found') {
        throw error;
      }
      throw new Error('Failed to delete broker');
    }
  }

  // Associate contact with broker
  static async associateContact(userId: string, brokerId: string, contactId: string) {
    try {
      // Verify broker exists
      const brokerRef = FirestoreHelpers.getUserDocInCollection(userId, 'brokers', brokerId);
      const brokerDoc = await brokerRef.get();

      if (!brokerDoc.exists) {
        throw new Error('Broker not found');
      }

      // Verify contact exists
      const contactRef = FirestoreHelpers.getUserDocInCollection(userId, 'contacts', contactId);
      const contactDoc = await contactRef.get();

      if (!contactDoc.exists) {
        throw new Error('Contact not found');
      }

      // Update contact with broker reference
      await contactRef.update({
        metadata: {
          ...(contactDoc.data()?.metadata || {}),
          brokerId: brokerId,
        },
        updatedAt: FirestoreHelpers.serverTimestamp(),
      });

      logger.info('Contact associated with broker', { userId, brokerId, contactId });

      return { message: 'Contact associated with broker successfully' };
    } catch (error: any) {
      logger.error('Error associating contact with broker:', error);
      if (error.message === 'Broker not found' || error.message === 'Contact not found') {
        throw error;
      }
      throw new Error('Failed to associate contact with broker');
    }
  }

  // Associate communication with broker
  static async associateCommunication(userId: string, brokerId: string, communicationId: string) {
    try {
      // Verify broker exists
      const brokerRef = FirestoreHelpers.getUserDocInCollection(userId, 'brokers', brokerId);
      const brokerDoc = await brokerRef.get();

      if (!brokerDoc.exists) {
        throw new Error('Broker not found');
      }

      // Verify communication exists
      const commRef = FirestoreHelpers.getUserDocInCollection(userId, 'communications', communicationId);
      const commDoc = await commRef.get();

      if (!commDoc.exists) {
        throw new Error('Communication not found');
      }

      // Update communication with broker reference
      await commRef.update({
        metadata: {
          ...(commDoc.data()?.metadata || {}),
          brokerId: brokerId,
        },
        updatedAt: FirestoreHelpers.serverTimestamp(),
      });

      logger.info('Communication associated with broker', { userId, brokerId, communicationId });

      return { message: 'Communication associated with broker successfully' };
    } catch (error: any) {
      logger.error('Error associating communication with broker:', error);
      if (error.message === 'Broker not found' || error.message === 'Communication not found') {
        throw error;
      }
      throw new Error('Failed to associate communication with broker');
    }
  }

  // Associate email thread with broker
  static async associateEmailThread(userId: string, brokerId: string, threadId: string, subject: string) {
    try {
      // Verify broker exists
      const brokerRef = FirestoreHelpers.getUserDocInCollection(userId, 'brokers', brokerId);
      const brokerDoc = await brokerRef.get();

      if (!brokerDoc.exists) {
        throw new Error('Broker not found');
      }

      // Try to fetch thread details from Gmail to get messageId and snippet
      let messageId: string | undefined;
      let snippet: string | undefined;
      let fromEmail: string | undefined;
      let toEmails: string[] | undefined;

      try {
        // Get Gmail access token
        const integrationsSnapshot = await db.collection('integrations')
          .where('userId', '==', userId)
          .where('provider', '==', 'google')
          .where('type', '==', 'gmail')
          .where('isActive', '==', true)
          .limit(1)
          .get();

        if (!integrationsSnapshot.empty) {
          const integrationData = integrationsSnapshot.docs[0].data();
          const accessToken = integrationData.accessToken;

          if (accessToken) {
            // Fetch thread details using Gmail API
            const { google } = await import('googleapis');
            const auth = (await import('./googleAuth')).default.createAuthenticatedClient(accessToken);
            const gmail = google.gmail({ version: 'v1', auth });

            const threadResponse = await gmail.users.threads.get({
              userId: 'me',
              id: threadId,
            });

            const thread = threadResponse.data;
            if (thread.messages && thread.messages.length > 0) {
              const latestMessage = thread.messages[thread.messages.length - 1];
              messageId = latestMessage.id;
              snippet = latestMessage.snippet;

              // Extract from/to emails from headers
              const headers = latestMessage.payload?.headers || [];
              const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from');
              const toHeader = headers.find((h: any) => h.name.toLowerCase() === 'to');

              if (fromHeader) {
                fromEmail = fromHeader.value;
              }
              if (toHeader) {
                toEmails = toHeader.value.split(',').map((e: string) => e.trim());
              }
            }
          }
        }
      } catch (gmailError) {
        logger.warn('Could not fetch Gmail thread details, creating minimal communication record', { gmailError });
      }

      // Create communication record
      const communicationData = {
        type: 'email',
        threadId,
        messageId,
        subject: subject || '(No Subject)',
        snippet,
        fromEmail,
        toEmails,
        direction: 'inbound', // Default to inbound
        status: 'received',
        metadata: {
          brokerId,
        },
        createdAt: FirestoreHelpers.serverTimestamp(),
        updatedAt: FirestoreHelpers.serverTimestamp(),
      };

      const communicationsCollection = FirestoreHelpers.getUserCollection(userId, 'communications');
      const commDocRef = await communicationsCollection.add(communicationData);

      logger.info('Email thread associated with broker', {
        userId,
        brokerId,
        threadId,
        communicationId: commDocRef.id
      });

      return {
        message: 'Email thread associated with broker successfully',
        communication: {
          id: commDocRef.id,
          ...communicationData
        }
      };
    } catch (error: any) {
      logger.error('Error associating email thread with broker:', error);
      if (error.message === 'Broker not found') {
        throw error;
      }
      throw new Error('Failed to associate email thread with broker');
    }
  }

  // Disassociate (delete) email thread from broker
  static async disassociateEmailThread(userId: string, brokerId: string, threadId: string) {
    try {
      // Verify broker exists
      const brokerRef = FirestoreHelpers.getUserDocInCollection(userId, 'brokers', brokerId);
      const brokerDoc = await brokerRef.get();

      if (!brokerDoc.exists) {
        throw new Error('Broker not found');
      }

      // Find and delete the communication with this threadId and brokerId
      const communicationsCollection = FirestoreHelpers.getUserCollection(userId, 'communications');
      const commSnapshot = await communicationsCollection
        .where('threadId', '==', threadId)
        .where('metadata.brokerId', '==', brokerId)
        .limit(1)
        .get();

      if (commSnapshot.empty) {
        logger.warn('Communication not found for deletion', { userId, brokerId, threadId });
        // Don't throw error, just return - thread might have been already deleted
        return { message: 'Email thread not found or already removed' };
      }

      // Delete the communication document
      await commSnapshot.docs[0].ref.delete();

      logger.info('Email thread disassociated from broker', {
        userId,
        brokerId,
        threadId,
        communicationId: commSnapshot.docs[0].id
      });

      return {
        message: 'Email thread disassociated from broker successfully',
        deletedCommunicationId: commSnapshot.docs[0].id
      };
    } catch (error: any) {
      logger.error('Error disassociating email thread from broker:', error);
      if (error.message === 'Broker not found') {
        throw error;
      }
      throw new Error('Failed to disassociate email thread from broker');
    }
  }
}
