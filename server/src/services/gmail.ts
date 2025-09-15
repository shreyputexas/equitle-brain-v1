import { google } from 'googleapis';
import GoogleAuthService from './googleAuth';
import logger from '../utils/logger';

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet: string;
  historyId: string;
  internalDate: string;
  sizeEstimate: number;
  raw?: string;
  payload?: {
    partId?: string;
    mimeType: string;
    filename?: string;
    headers: Array<{
      name: string;
      value: string;
    }>;
    body?: {
      attachmentId?: string;
      size: number;
      data?: string;
    };
    parts?: any[];
  };
}

export interface SendEmailData {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
  replyTo?: string;
  threadId?: string;
}

export interface GmailThread {
  id: string;
  historyId: string;
  messages: GmailMessage[];
}

export interface GmailLabel {
  id: string;
  name: string;
  messageListVisibility?: string;
  labelListVisibility?: string;
  type: string;
  messagesTotal?: number;
  messagesUnread?: number;
  threadsTotal?: number;
  threadsUnread?: number;
  color?: {
    textColor: string;
    backgroundColor: string;
  };
}

export interface ListMessagesOptions {
  q?: string;
  labelIds?: string[];
  maxResults?: number;
  pageToken?: string;
  includeSpamTrash?: boolean;
}

export class GmailService {
  /**
   * List Gmail messages
   */
  static async listMessages(
    accessToken: string,
    options: ListMessagesOptions = {}
  ): Promise<{ messages: GmailMessage[]; nextPageToken?: string; resultSizeEstimate: number }> {
    try {
      const auth = GoogleAuthService.createAuthenticatedClient(accessToken);
      const gmail = google.gmail({ version: 'v1', auth });

      const {
        q,
        labelIds,
        maxResults = 50,
        pageToken,
        includeSpamTrash = false
      } = options;

      const response = await gmail.users.messages.list({
        userId: 'me',
        q,
        labelIds,
        maxResults,
        pageToken,
        includeSpamTrash
      });

      const messages = response.data.messages || [];
      const detailedMessages: GmailMessage[] = [];

      // Get detailed information for each message
      for (const message of messages.slice(0, Math.min(10, messages.length))) {
        try {
          const detailResponse = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!,
            format: 'full'
          });
          detailedMessages.push(detailResponse.data as GmailMessage);
        } catch (error) {
          logger.warn(`Failed to get details for message ${message.id}:`, error);
        }
      }

      return {
        messages: detailedMessages,
        nextPageToken: response.data.nextPageToken || undefined,
        resultSizeEstimate: response.data.resultSizeEstimate || 0
      };
    } catch (error: any) {
      logger.error('Gmail list messages error:', error);
      throw new Error('Failed to fetch messages from Gmail');
    }
  }

  /**
   * Get a specific Gmail message
   */
  static async getMessage(accessToken: string, messageId: string): Promise<GmailMessage> {
    try {
      const auth = GoogleAuthService.createAuthenticatedClient(accessToken);
      const gmail = google.gmail({ version: 'v1', auth });

      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      return response.data as GmailMessage;
    } catch (error: any) {
      logger.error('Gmail get message error:', error);
      throw new Error('Failed to fetch message from Gmail');
    }
  }

  /**
   * Send an email through Gmail
   */
  static async sendEmail(accessToken: string, emailData: SendEmailData): Promise<GmailMessage> {
    try {
      const auth = GoogleAuthService.createAuthenticatedClient(accessToken);
      const gmail = google.gmail({ version: 'v1', auth });

      // Create email content
      const email = this.createEmailMessage(emailData);

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: email,
          threadId: emailData.threadId
        }
      });

      return response.data as GmailMessage;
    } catch (error: any) {
      logger.error('Gmail send email error:', error);
      throw new Error('Failed to send email through Gmail');
    }
  }

  /**
   * Reply to an email
   */
  static async replyToEmail(
    accessToken: string,
    messageId: string,
    replyData: Omit<SendEmailData, 'threadId'>
  ): Promise<GmailMessage> {
    try {
      // First get the original message to extract thread ID
      const originalMessage = await this.getMessage(accessToken, messageId);

      // Extract original recipient info for proper reply
      const originalHeaders = originalMessage.payload?.headers || [];
      const fromHeader = originalHeaders.find(h => h.name.toLowerCase() === 'from');
      const subjectHeader = originalHeaders.find(h => h.name.toLowerCase() === 'subject');

      const replyEmailData: SendEmailData = {
        ...replyData,
        to: replyData.to || (fromHeader ? fromHeader.value : ''),
        subject: replyData.subject || (subjectHeader ? `Re: ${subjectHeader.value}` : 'Re: '),
        threadId: originalMessage.threadId
      };

      return await this.sendEmail(accessToken, replyEmailData);
    } catch (error: any) {
      logger.error('Gmail reply email error:', error);
      throw new Error('Failed to reply to email through Gmail');
    }
  }

  /**
   * List Gmail threads
   */
  static async listThreads(
    accessToken: string,
    options: ListMessagesOptions = {}
  ): Promise<{ threads: GmailThread[]; nextPageToken?: string; resultSizeEstimate: number }> {
    try {
      const auth = GoogleAuthService.createAuthenticatedClient(accessToken);
      const gmail = google.gmail({ version: 'v1', auth });

      const {
        q,
        labelIds,
        maxResults = 20,
        pageToken,
        includeSpamTrash = false
      } = options;

      const response = await gmail.users.threads.list({
        userId: 'me',
        q,
        labelIds,
        maxResults,
        pageToken,
        includeSpamTrash
      });

      const threads = response.data.threads || [];
      const detailedThreads: GmailThread[] = [];

      // Get detailed information for each thread
      for (const thread of threads.slice(0, Math.min(5, threads.length))) {
        try {
          const detailResponse = await gmail.users.threads.get({
            userId: 'me',
            id: thread.id!,
            format: 'full'
          });
          detailedThreads.push(detailResponse.data as GmailThread);
        } catch (error) {
          logger.warn(`Failed to get details for thread ${thread.id}:`, error);
        }
      }

      return {
        threads: detailedThreads,
        nextPageToken: response.data.nextPageToken || undefined,
        resultSizeEstimate: response.data.resultSizeEstimate || 0
      };
    } catch (error: any) {
      logger.error('Gmail list threads error:', error);
      throw new Error('Failed to fetch threads from Gmail');
    }
  }

  /**
   * List Gmail labels
   */
  static async listLabels(accessToken: string): Promise<GmailLabel[]> {
    try {
      const auth = GoogleAuthService.createAuthenticatedClient(accessToken);
      const gmail = google.gmail({ version: 'v1', auth });

      const response = await gmail.users.labels.list({
        userId: 'me'
      });

      return (response.data.labels || []) as GmailLabel[];
    } catch (error: any) {
      logger.error('Gmail list labels error:', error);
      throw new Error('Failed to fetch labels from Gmail');
    }
  }

  /**
   * Create RFC 2822 compliant email message
   */
  private static createEmailMessage(emailData: SendEmailData): string {
    const { to, cc, bcc, subject, body, isHtml = false, attachments = [], replyTo } = emailData;

    // Convert arrays to comma-separated strings
    const toAddresses = Array.isArray(to) ? to.join(', ') : to;
    const ccAddresses = cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : '';
    const bccAddresses = bcc ? (Array.isArray(bcc) ? bcc.join(', ') : bcc) : '';

    let email = '';
    email += `To: ${toAddresses}\r\n`;
    if (ccAddresses) email += `Cc: ${ccAddresses}\r\n`;
    if (bccAddresses) email += `Bcc: ${bccAddresses}\r\n`;
    if (replyTo) email += `Reply-To: ${replyTo}\r\n`;
    email += `Subject: ${subject}\r\n`;
    email += `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=UTF-8\r\n`;
    email += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    email += body;

    // Handle attachments (basic implementation)
    if (attachments.length > 0) {
      const boundary = `boundary_${Date.now()}`;
      email = email.replace(
        `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=UTF-8`,
        `Content-Type: multipart/mixed; boundary="${boundary}"`
      );

      let multipartBody = `--${boundary}\r\n`;
      multipartBody += `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=UTF-8\r\n`;
      multipartBody += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
      multipartBody += body + '\r\n';

      for (const attachment of attachments) {
        multipartBody += `--${boundary}\r\n`;
        multipartBody += `Content-Type: ${attachment.contentType || 'application/octet-stream'}\r\n`;
        multipartBody += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
        multipartBody += `Content-Transfer-Encoding: base64\r\n\r\n`;

        const content = Buffer.isBuffer(attachment.content)
          ? attachment.content.toString('base64')
          : Buffer.from(attachment.content).toString('base64');

        multipartBody += content + '\r\n';
      }

      multipartBody += `--${boundary}--\r\n`;
      email = email.split('\r\n\r\n')[0] + '\r\n\r\n' + multipartBody;
    }

    // Encode to base64url
    return Buffer.from(email)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  /**
   * Mark message as read
   */
  static async markAsRead(accessToken: string, messageId: string): Promise<void> {
    try {
      const auth = GoogleAuthService.createAuthenticatedClient(accessToken);
      const gmail = google.gmail({ version: 'v1', auth });

      await gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });
    } catch (error: any) {
      logger.error('Gmail mark as read error:', error);
      throw new Error('Failed to mark message as read in Gmail');
    }
  }

  /**
   * Delete message
   */
  static async deleteMessage(accessToken: string, messageId: string): Promise<void> {
    try {
      const auth = GoogleAuthService.createAuthenticatedClient(accessToken);
      const gmail = google.gmail({ version: 'v1', auth });

      await gmail.users.messages.delete({
        userId: 'me',
        id: messageId
      });
    } catch (error: any) {
      logger.error('Gmail delete message error:', error);
      throw new Error('Failed to delete message from Gmail');
    }
  }
}

export default GmailService;