import { VoiceAgentService } from './voiceAgent.service';
import { db } from '../lib/firebase';
import logger from '../utils/logger';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

export interface CampaignContact {
  id?: string;
  name: string;
  phoneNumber: string;
  companyName?: string;
  email?: string;
  customData?: Record<string, string>;
  status: 'pending' | 'calling' | 'completed' | 'failed';
  callId?: string;
  callResult?: string;
  attemptedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface Campaign {
  id?: string;
  userId: string;
  name: string;
  description?: string;
  messageTemplate: string;
  voiceId?: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
  totalContacts: number;
  completedContacts: number;
  failedContacts: number;
  callDelay: number; // seconds between calls
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  contacts: CampaignContact[];
  settings: {
    dealType?: string;
    investmentRange?: string;
    industryFocus?: string;
    customInstructions?: string;
  };
}

export interface CampaignStats {
  total: number;
  pending: number;
  calling: number;
  completed: number;
  failed: number;
  successRate: number;
}

export class CampaignService {
  private voiceAgentService: VoiceAgentService;
  private runningCampaigns: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.voiceAgentService = new VoiceAgentService();
  }

  /**
   * Parse CSV data into campaign contacts
   */
  async parseCsvContacts(csvBuffer: Buffer): Promise<CampaignContact[]> {
    return new Promise((resolve, reject) => {
      const contacts: CampaignContact[] = [];
      const stream = Readable.from(csvBuffer.toString());

      stream
        .pipe(csv())
        .on('data', (row) => {
          try {
            // Flexible CSV parsing - try common column names
            const name = row.name || row.Name || row.contact_name || row['Contact Name'] || 'Unknown';
            const phone = row.phone || row.Phone || row.phoneNumber || row['Phone Number'] || row.number;
            const company = row.company || row.Company || row.companyName || row['Company Name'] || '';
            const email = row.email || row.Email || '';

            if (!phone) {
              logger.warn('Skipping CSV row with missing phone number', { row });
              return;
            }

            // Clean phone number
            const cleanPhone = this.cleanPhoneNumber(phone);
            if (!this.isValidPhoneNumber(cleanPhone)) {
              logger.warn('Skipping CSV row with invalid phone number', { phone, cleanPhone });
              return;
            }

            const contact: CampaignContact = {
              name: name.trim(),
              phoneNumber: cleanPhone,
              companyName: company.trim(),
              email: email.trim(),
              status: 'pending',
              customData: {}
            };

            // Add any additional columns as custom data
            Object.keys(row).forEach(key => {
              if (!['name', 'phone', 'company', 'email'].includes(key.toLowerCase())) {
                contact.customData![key] = row[key];
              }
            });

            contacts.push(contact);
          } catch (error) {
            logger.error('Error parsing CSV row', { error, row });
          }
        })
        .on('end', () => {
          logger.info('CSV parsing completed', { contactCount: contacts.length });
          resolve(contacts);
        })
        .on('error', (error) => {
          logger.error('CSV parsing failed', error);
          reject(error);
        });
    });
  }

  /**
   * Create a new campaign
   */
  async createCampaign(
    userId: string,
    name: string,
    description: string,
    messageTemplate: string,
    contacts: CampaignContact[],
    settings: Campaign['settings'],
    voiceId?: string,
    callDelay: number = 30
  ): Promise<Campaign> {
    try {
      const campaign: Omit<Campaign, 'id'> = {
        userId,
        name: name.trim(),
        description: description?.trim(),
        messageTemplate: messageTemplate.trim(),
        voiceId,
        status: 'draft',
        totalContacts: contacts.length,
        completedContacts: 0,
        failedContacts: 0,
        callDelay,
        maxRetries: 2,
        createdAt: new Date(),
        contacts: contacts,
        settings
      };

      const docRef = await db.collection('campaigns').add(campaign);

      logger.info('Campaign created successfully', {
        campaignId: docRef.id,
        userId,
        contactCount: contacts.length
      });

      return { id: docRef.id, ...campaign };
    } catch (error) {
      logger.error('Failed to create campaign', error);
      throw new Error(`Failed to create campaign: ${(error as Error).message}`);
    }
  }

  /**
   * Get campaigns for user
   */
  async getUserCampaigns(userId: string, limit: number = 50): Promise<Campaign[]> {
    try {
      const snapshot = await db.collection('campaigns')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Campaign));
    } catch (error) {
      logger.error('Failed to get user campaigns', error);
      return [];
    }
  }

  /**
   * Get campaign by ID
   */
  async getCampaign(campaignId: string, userId: string): Promise<Campaign | null> {
    try {
      const doc = await db.collection('campaigns').doc(campaignId).get();

      if (!doc.exists) {
        return null;
      }

      const campaign = { id: doc.id, ...doc.data() } as Campaign;

      // Verify user owns this campaign
      if (campaign.userId !== userId) {
        throw new Error('Access denied');
      }

      return campaign;
    } catch (error) {
      logger.error('Failed to get campaign', error);
      return null;
    }
  }

  /**
   * Start campaign execution
   */
  async startCampaign(campaignId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const campaign = await this.getCampaign(campaignId, userId);

      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      if (campaign.status === 'running') {
        return { success: false, error: 'Campaign is already running' };
      }

      if (campaign.status === 'completed') {
        return { success: false, error: 'Campaign is already completed' };
      }

      // Update campaign status
      await db.collection('campaigns').doc(campaignId).update({
        status: 'running',
        startedAt: new Date()
      });

      // Start processing contacts
      this.processCampaignContacts(campaignId, campaign);

      logger.info('Campaign started successfully', { campaignId, userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to start campaign', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Pause campaign execution
   */
  async pauseCampaign(campaignId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const campaign = await this.getCampaign(campaignId, userId);

      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      if (campaign.status !== 'running') {
        return { success: false, error: 'Campaign is not running' };
      }

      // Clear the processing timeout
      if (this.runningCampaigns.has(campaignId)) {
        clearTimeout(this.runningCampaigns.get(campaignId)!);
        this.runningCampaigns.delete(campaignId);
      }

      // Update campaign status
      await db.collection('campaigns').doc(campaignId).update({
        status: 'paused'
      });

      logger.info('Campaign paused successfully', { campaignId, userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to pause campaign', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Delete campaign
   */
  async deleteCampaign(campaignId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const campaign = await this.getCampaign(campaignId, userId);

      if (!campaign) {
        return { success: false, error: 'Campaign not found' };
      }

      // Stop campaign if running
      if (campaign.status === 'running') {
        await this.pauseCampaign(campaignId, userId);
      }

      // Delete campaign
      await db.collection('campaigns').doc(campaignId).delete();

      logger.info('Campaign deleted successfully', { campaignId, userId });

      return { success: true };
    } catch (error) {
      logger.error('Failed to delete campaign', error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: string, userId: string): Promise<CampaignStats | null> {
    try {
      const campaign = await this.getCampaign(campaignId, userId);

      if (!campaign) {
        return null;
      }

      const pending = campaign.contacts.filter(c => c.status === 'pending').length;
      const calling = campaign.contacts.filter(c => c.status === 'calling').length;
      const completed = campaign.contacts.filter(c => c.status === 'completed').length;
      const failed = campaign.contacts.filter(c => c.status === 'failed').length;
      const total = campaign.contacts.length;

      const successRate = total > 0 ? (completed / total) * 100 : 0;

      return {
        total,
        pending,
        calling,
        completed,
        failed,
        successRate: Math.round(successRate * 100) / 100
      };
    } catch (error) {
      logger.error('Failed to get campaign stats', error);
      return null;
    }
  }

  /**
   * Process campaign contacts with rate limiting
   */
  private async processCampaignContacts(campaignId: string, campaign: Campaign): Promise<void> {
    const pendingContacts = campaign.contacts.filter(c => c.status === 'pending');

    if (pendingContacts.length === 0) {
      await this.completeCampaign(campaignId);
      return;
    }

    const contact = pendingContacts[0];

    try {
      // Update contact status to calling
      await this.updateContactStatus(campaignId, contact, 'calling');

      // Create dynamic variables for personalization
      const dynamicVariables = {
        contact_name: contact.name,
        company_name: contact.companyName || '',
        deal_type: campaign.settings.dealType || '',
        investment_range: campaign.settings.investmentRange || '',
        industry_focus: campaign.settings.industryFocus || '',
        custom_instructions: this.personalizeMessage(campaign.messageTemplate, contact)
      };

      // Initiate the voicemail call
      const result = await this.voiceAgentService.initiateCall(
        campaign.userId,
        contact.phoneNumber,
        'voicemail',
        dynamicVariables,
        campaign.voiceId
      );

      if (result.success) {
        await this.updateContactStatus(campaignId, contact, 'completed', result.callId);
        logger.info('Campaign voicemail sent successfully', {
          campaignId,
          contactName: contact.name,
          callId: result.callId
        });
      } else {
        await this.updateContactStatus(campaignId, contact, 'failed', undefined, result.error);
        logger.error('Campaign voicemail failed', {
          campaignId,
          contactName: contact.name,
          error: result.error
        });
      }

    } catch (error) {
      await this.updateContactStatus(campaignId, contact, 'failed', undefined, (error as Error).message);
      logger.error('Error processing campaign contact', { campaignId, contact, error });
    }

    // Schedule next contact processing
    const timeout = setTimeout(() => {
      this.processCampaignContacts(campaignId, campaign);
    }, campaign.callDelay * 1000);

    this.runningCampaigns.set(campaignId, timeout);
  }

  /**
   * Update contact status in campaign
   */
  private async updateContactStatus(
    campaignId: string,
    contact: CampaignContact,
    status: CampaignContact['status'],
    callId?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const doc = await db.collection('campaigns').doc(campaignId).get();
      const campaign = doc.data() as Campaign;

      // Find and update the contact
      const contactIndex = campaign.contacts.findIndex(c => c.phoneNumber === contact.phoneNumber);
      if (contactIndex !== -1) {
        campaign.contacts[contactIndex].status = status;
        campaign.contacts[contactIndex].attemptedAt = new Date();

        if (callId) {
          campaign.contacts[contactIndex].callId = callId;
        }

        if (status === 'completed') {
          campaign.contacts[contactIndex].completedAt = new Date();
          campaign.completedContacts = (campaign.completedContacts || 0) + 1;
        } else if (status === 'failed') {
          campaign.contacts[contactIndex].errorMessage = errorMessage;
          campaign.failedContacts = (campaign.failedContacts || 0) + 1;
        }

        await db.collection('campaigns').doc(campaignId).update({
          contacts: campaign.contacts,
          completedContacts: campaign.completedContacts,
          failedContacts: campaign.failedContacts
        });
      }
    } catch (error) {
      logger.error('Failed to update contact status', error);
    }
  }

  /**
   * Complete campaign
   */
  private async completeCampaign(campaignId: string): Promise<void> {
    try {
      await db.collection('campaigns').doc(campaignId).update({
        status: 'completed',
        completedAt: new Date()
      });

      // Clean up running campaign tracking
      if (this.runningCampaigns.has(campaignId)) {
        clearTimeout(this.runningCampaigns.get(campaignId)!);
        this.runningCampaigns.delete(campaignId);
      }

      logger.info('Campaign completed', { campaignId });
    } catch (error) {
      logger.error('Failed to complete campaign', error);
    }
  }

  /**
   * Personalize message template with contact data
   */
  private personalizeMessage(template: string, contact: CampaignContact): string {
    let message = template;

    // Replace placeholders with contact data
    message = message.replace(/\{\{contact_name\}\}/g, contact.name);
    message = message.replace(/\{\{company_name\}\}/g, contact.companyName || 'your company');
    message = message.replace(/\{\{first_name\}\}/g, contact.name.split(' ')[0]);

    // Replace custom data placeholders
    if (contact.customData) {
      Object.keys(contact.customData).forEach(key => {
        const placeholder = `{{${key}}}`;
        message = message.replace(new RegExp(placeholder, 'g'), contact.customData![key]);
      });
    }

    return message;
  }

  /**
   * Clean and format phone number
   */
  private cleanPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // If no country code, assume US (+1)
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = '+1' + cleaned;
      } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
        cleaned = '+' + cleaned;
      }
    }

    return cleaned;
  }

  /**
   * Validate phone number format
   */
  private isValidPhoneNumber(phone: string): boolean {
    // Basic validation for international phone numbers
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phone);
  }
}