import prisma from '../lib/database';
import logger from '../utils/logger';
import GmailService from './gmail';
import MicrosoftTeamsService from './microsoftTeams';
import SlackChannelsService from './slackChannels';
import ZoomMeetingsService from './zoomMeetings';
import SalesforceApiService from './salesforceApi';
import GoogleDriveService from './googleDrive';

export interface SyncOptions {
  userId: string;
  integrationType: string;
  fullSync?: boolean;
  limit?: number;
}

export class DataSyncService {
  static async syncUserData(options: SyncOptions): Promise<{ success: boolean; message: string; itemsProcessed?: number }> {
    const { userId, integrationType, fullSync = false, limit = 100 } = options;

    try {
      const syncJob = await prisma.syncJob.create({
        data: {
          userId,
          type: integrationType,
          status: 'running',
          startedAt: new Date(),
          metadata: { fullSync, limit }
        }
      });

      let itemsProcessed = 0;

      switch (integrationType) {
        case 'gmail':
          itemsProcessed = await this.syncGmailData(userId, fullSync, limit);
          break;
        case 'teams':
          itemsProcessed = await this.syncTeamsData(userId, fullSync, limit);
          break;
        case 'slack':
          itemsProcessed = await this.syncSlackData(userId, fullSync, limit);
          break;
        case 'zoom':
          itemsProcessed = await this.syncZoomData(userId, fullSync, limit);
          break;
        case 'salesforce':
          itemsProcessed = await this.syncSalesforceData(userId, fullSync, limit);
          break;
        case 'drive':
          itemsProcessed = await this.syncDriveData(userId, fullSync, limit);
          break;
        default:
          throw new Error(`Unsupported integration type: ${integrationType}`);
      }

      await prisma.syncJob.update({
        where: { id: syncJob.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          itemsProcessed
        }
      });

      return { success: true, message: `Successfully synced ${itemsProcessed} items`, itemsProcessed };
    } catch (error: any) {
      logger.error(`Sync error for ${integrationType}:`, error);
      return { success: false, message: error.message };
    }
  }

  private static async syncGmailData(userId: string, fullSync: boolean, limit: number): Promise<number> {
    const integration = await prisma.integration.findFirst({
      where: { userId, type: 'gmail', isActive: true }
    });

    if (!integration?.accessToken) {
      throw new Error('Gmail integration not found or access token missing');
    }

    try {
      const messages = await GmailService.listMessages(integration.accessToken, {
        maxResults: limit,
        q: fullSync ? undefined : 'newer_than:7d'
      });

      let processed = 0;
      for (const message of messages.messages) {
        const headers = message.payload?.headers || [];
        const subjectHeader = headers.find(h => h.name.toLowerCase() === 'subject');
        const fromHeader = headers.find(h => h.name.toLowerCase() === 'from');
        const toHeader = headers.find(h => h.name.toLowerCase() === 'to');
        const ccHeader = headers.find(h => h.name.toLowerCase() === 'cc');
        const bccHeader = headers.find(h => h.name.toLowerCase() === 'bcc');

        const fromEmail = fromHeader?.value || '';
        const toEmails = this.parseEmailAddresses(toHeader?.value || '');
        const ccEmails = this.parseEmailAddresses(ccHeader?.value || '');
        const bccEmails = this.parseEmailAddresses(bccHeader?.value || '');

        const isOutbound = fromEmail.includes('@');

        await prisma.communication.upsert({
          where: { messageId: message.id },
          update: {
            subject: subjectHeader?.value || '',
            content: message.snippet,
            fromEmail,
            toEmails,
            ccEmails,
            bccEmails,
            threadId: message.threadId,
            direction: isOutbound ? 'outbound' : 'inbound',
            labels: message.labelIds || [],
            receivedAt: new Date(parseInt(message.internalDate)),
            metadata: {
              historyId: message.historyId,
              sizeEstimate: message.sizeEstimate
            }
          },
          create: {
            userId,
            type: 'email',
            subject: subjectHeader?.value || '',
            content: message.snippet,
            fromEmail,
            toEmails,
            ccEmails,
            bccEmails,
            threadId: message.threadId,
            messageId: message.id,
            direction: isOutbound ? 'outbound' : 'inbound',
            labels: message.labelIds || [],
            receivedAt: new Date(parseInt(message.internalDate)),
            metadata: {
              historyId: message.historyId,
              sizeEstimate: message.sizeEstimate
            }
          }
        });

        processed++;
      }

      await prisma.integration.update({
        where: { id: integration.id },
        data: { lastSync: new Date() }
      });

      return processed;
    } catch (error: any) {
      logger.error('Gmail sync error:', error);
      throw error;
    }
  }

  private static async syncTeamsData(userId: string, fullSync: boolean, limit: number): Promise<number> {
    const integration = await prisma.integration.findFirst({
      where: { userId, type: 'teams', isActive: true }
    });

    if (!integration?.accessToken) {
      throw new Error('Teams integration not found or access token missing');
    }

    try {
      const chats = await MicrosoftTeamsService.listChats(integration.accessToken, { top: limit });
      let processed = 0;

      for (const chat of chats.chats) {
        const messages = await MicrosoftTeamsService.getChatMessages(integration.accessToken, chat.id, { top: 50 });

        for (const message of messages.messages) {
          await prisma.teamsMessage.upsert({
            where: { messageId: message.id },
            update: {
              content: message.body?.content || '',
              contentType: message.body?.contentType || 'text',
              importance: message.importance,
              sentAt: new Date(message.createdDateTime)
            },
            create: {
              userId,
              messageId: message.id,
              chatId: chat.id,
              fromEmail: message.from?.user?.mail || '',
              fromName: message.from?.user?.displayName || '',
              content: message.body?.content || '',
              contentType: message.body?.contentType || 'text',
              importance: message.importance,
              messageType: 'message',
              mentions: message.mentions?.map(m => m.mentioned?.user?.mail || '') || [],
              sentAt: new Date(message.createdDateTime)
            }
          });
          processed++;
        }
      }

      await prisma.integration.update({
        where: { id: integration.id },
        data: { lastSync: new Date() }
      });

      return processed;
    } catch (error: any) {
      logger.error('Teams sync error:', error);
      throw error;
    }
  }

  private static async syncSlackData(userId: string, fullSync: boolean, limit: number): Promise<number> {
    const integration = await prisma.integration.findFirst({
      where: { userId, type: 'slack', isActive: true }
    });

    if (!integration?.accessToken) {
      throw new Error('Slack integration not found or access token missing');
    }

    try {
      const channels = await SlackChannelsService.listChannels(integration.accessToken);
      let processed = 0;

      for (const channel of channels.channels.slice(0, 10)) {
        await prisma.slackChannel.upsert({
          where: { channelId: channel.id },
          update: {
            name: channel.name,
            purpose: channel.purpose?.value || '',
            topic: channel.topic?.value || '',
            isPrivate: channel.is_private,
            isArchived: channel.is_archived,
            memberCount: channel.num_members
          },
          create: {
            userId,
            channelId: channel.id,
            name: channel.name,
            purpose: channel.purpose?.value || '',
            topic: channel.topic?.value || '',
            isPrivate: channel.is_private,
            isArchived: channel.is_archived,
            memberCount: channel.num_members
          }
        });

        const messages = await SlackChannelsService.getChannelHistory(integration.accessToken, channel.id, { limit: 50 });

        for (const message of messages.messages) {
          if (message.user && message.text) {
            await prisma.slackMessage.upsert({
              where: { messageId: message.ts },
              update: {
                text: message.text,
                sentAt: new Date(parseFloat(message.ts) * 1000)
              },
              create: {
                userId,
                messageId: message.ts,
                channelId: channel.id,
                channelName: channel.name,
                fromUserId: message.user,
                fromName: message.username || 'Unknown',
                text: message.text,
                messageType: message.thread_ts ? 'reply' : 'message',
                threadTs: message.thread_ts,
                sentAt: new Date(parseFloat(message.ts) * 1000)
              }
            });
            processed++;
          }
        }
      }

      await prisma.integration.update({
        where: { id: integration.id },
        data: { lastSync: new Date() }
      });

      return processed;
    } catch (error: any) {
      logger.error('Slack sync error:', error);
      throw error;
    }
  }

  private static async syncZoomData(userId: string, fullSync: boolean, limit: number): Promise<number> {
    const integration = await prisma.integration.findFirst({
      where: { userId, type: 'zoom', isActive: true }
    });

    if (!integration?.accessToken) {
      throw new Error('Zoom integration not found or access token missing');
    }

    try {
      const meetings = await ZoomMeetingsService.listMeetings(integration.accessToken, 'me', {
        type: 'previous_meetings',
        page_size: limit
      });

      let processed = 0;
      for (const meeting of meetings.meetings) {
        await prisma.zoomMeeting.upsert({
          where: { meetingId: meeting.id.toString() },
          update: {
            topic: meeting.topic,
            agenda: meeting.agenda || '',
            startTime: new Date(meeting.start_time),
            duration: meeting.duration,
            timezone: meeting.timezone,
            status: meeting.status,
            hostEmail: meeting.host_email
          },
          create: {
            userId,
            meetingId: meeting.id.toString(),
            uuid: meeting.uuid,
            topic: meeting.topic,
            agenda: meeting.agenda || '',
            startTime: new Date(meeting.start_time),
            duration: meeting.duration,
            timezone: meeting.timezone,
            status: meeting.status,
            meetingType: meeting.type === 1 ? 'instant' : 'scheduled',
            joinUrl: meeting.join_url,
            startUrl: meeting.start_url,
            password: meeting.password,
            hostEmail: meeting.host_email
          }
        });
        processed++;
      }

      await prisma.integration.update({
        where: { id: integration.id },
        data: { lastSync: new Date() }
      });

      return processed;
    } catch (error: any) {
      logger.error('Zoom sync error:', error);
      throw error;
    }
  }

  private static async syncSalesforceData(userId: string, fullSync: boolean, limit: number): Promise<number> {
    const integration = await prisma.integration.findFirst({
      where: { userId, type: 'salesforce', isActive: true }
    });

    if (!integration?.accessToken || !integration.profile?.instance_url) {
      throw new Error('Salesforce integration not found or access token missing');
    }

    try {
      const instanceUrl = integration.profile.instance_url;
      let processed = 0;

      const accounts = await SalesforceApiService.getAccounts(instanceUrl, integration.accessToken, { limit });
      for (const account of accounts.records) {
        await prisma.salesforceAccount.upsert({
          where: { accountId: account.Id },
          update: {
            name: account.Name,
            type: account.Type,
            industry: account.Industry,
            website: account.Website,
            phone: account.Phone,
            description: account.Description,
            lastSync: new Date()
          },
          create: {
            userId,
            accountId: account.Id,
            name: account.Name,
            type: account.Type,
            industry: account.Industry,
            website: account.Website,
            phone: account.Phone,
            billingCity: account.BillingCity,
            billingState: account.BillingState,
            billingCountry: account.BillingCountry,
            description: account.Description,
            revenue: account.AnnualRevenue,
            employees: account.NumberOfEmployees,
            ownerId: account.OwnerId
          }
        });
        processed++;
      }

      const opportunities = await SalesforceApiService.getOpportunities(instanceUrl, integration.accessToken, { limit });
      for (const opportunity of opportunities.records) {
        await prisma.salesforceOpportunity.upsert({
          where: { opportunityId: opportunity.Id },
          update: {
            name: opportunity.Name,
            amount: opportunity.Amount,
            stage: opportunity.StageName,
            probability: opportunity.Probability,
            closeDate: opportunity.CloseDate ? new Date(opportunity.CloseDate) : null,
            lastSync: new Date()
          },
          create: {
            userId,
            opportunityId: opportunity.Id,
            name: opportunity.Name,
            amount: opportunity.Amount,
            stage: opportunity.StageName,
            probability: opportunity.Probability,
            closeDate: opportunity.CloseDate ? new Date(opportunity.CloseDate) : null,
            type: opportunity.Type,
            leadSource: opportunity.LeadSource,
            description: opportunity.Description,
            ownerId: opportunity.OwnerId
          }
        });
        processed++;
      }

      await prisma.integration.update({
        where: { id: integration.id },
        data: { lastSync: new Date() }
      });

      return processed;
    } catch (error: any) {
      logger.error('Salesforce sync error:', error);
      throw error;
    }
  }

  private static async syncDriveData(userId: string, fullSync: boolean, limit: number): Promise<number> {
    const integration = await prisma.integration.findFirst({
      where: { userId, type: 'drive', isActive: true }
    });

    if (!integration?.accessToken) {
      throw new Error('Drive integration not found or access token missing');
    }

    try {
      const files = await GoogleDriveService.listFiles(integration.accessToken, {
        pageSize: limit,
        query: fullSync ? "trashed = false" : "modifiedTime >= '2024-09-01T00:00:00Z' and trashed = false"
      });

      let processed = 0;
      for (const file of files) {
        await prisma.document.upsert({
          where: { googleDriveId: file.id },
          update: {
            name: file.name,
            type: this.getFileTypeFromMimeType(file.mimeType),
            size: file.size ? parseInt(file.size) : null,
            url: file.webViewLink || undefined,
            metadata: {
              mimeType: file.mimeType,
              modifiedTime: file.modifiedTime,
              thumbnailLink: file.thumbnailLink
            }
          },
          create: {
            userId,
            name: file.name,
            type: this.getFileTypeFromMimeType(file.mimeType),
            size: file.size ? parseInt(file.size) : null,
            url: file.webViewLink || undefined,
            googleDriveId: file.id,
            metadata: {
              mimeType: file.mimeType,
              modifiedTime: file.modifiedTime,
              thumbnailLink: file.thumbnailLink,
              parents: file.parents
            }
          }
        });
        processed++;
      }

      await prisma.integration.update({
        where: { id: integration.id },
        data: { lastSync: new Date() }
      });

      return processed;
    } catch (error: any) {
      logger.error('Drive sync error:', error);
      throw error;
    }
  }

  static async syncAllUserIntegrations(userId: string): Promise<{ success: boolean; results: any[] }> {
    const integrations = await prisma.integration.findMany({
      where: { userId, isActive: true }
    });

    const results = [];
    for (const integration of integrations) {
      try {
        const result = await this.syncUserData({
          userId,
          integrationType: integration.type,
          limit: 50
        });
        results.push({ type: integration.type, ...result });
      } catch (error: any) {
        results.push({ type: integration.type, success: false, message: error.message });
      }
    }

    return { success: true, results };
  }

  private static parseEmailAddresses(emailString: string): string[] {
    if (!emailString) return [];
    return emailString
      .split(',')
      .map(email => email.trim().replace(/.*<(.+)>.*/, '$1'))
      .filter(email => email.includes('@'));
  }

  private static getFileTypeFromMimeType(mimeType: string): string {
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'doc';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'xls';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'ppt';
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('video')) return 'video';
    if (mimeType.includes('audio')) return 'audio';
    return 'other';
  }
}

export default DataSyncService;