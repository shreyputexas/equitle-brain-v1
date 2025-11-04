import { GmailMessage, GmailThread } from './gmail';
import logger from '../utils/logger';

// Normalized data interfaces for LLM processing
export interface NormalizedEmail {
  id: string;
  threadId: string;
  subject: string;
  from: {
    name: string;
    email: string;
  };
  to: Array<{
    name: string;
    email: string;
  }>;
  cc?: Array<{
    name: string;
    email: string;
  }>;
  bcc?: Array<{
    name: string;
    email: string;
  }>;
  date: Date;
  body: {
    text: string;
    html?: string;
  };
  attachments: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
  labels: string[];
  importance: 'high' | 'medium' | 'low';
  sentiment?: 'positive' | 'neutral' | 'negative';
  keywords: string[];
  entities: {
    people: string[];
    companies: string[];
    dates: string[];
    amounts: string[];
    locations: string[];
  };
  crmRelevant: boolean;
  dealRelated: boolean;
  metadata: {
    source: 'gmail';
    userId: string;
    processedAt: Date;
    version: string;
  };
}

export interface NormalizedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  createdDate: Date;
  modifiedDate: Date;
  owner: {
    name: string;
    email: string;
  };
  sharedWith: Array<{
    name: string;
    email: string;
    role: string;
  }>;
  content?: {
    text?: string;
    summary?: string;
  };
  tags: string[];
  category: 'document' | 'spreadsheet' | 'presentation' | 'image' | 'video' | 'other';
  crmRelevant: boolean;
  dealRelated: boolean;
  metadata: {
    source: 'google-drive';
    userId: string;
    processedAt: Date;
    version: string;
    mimeType: string;
    webViewLink?: string;
    downloadLink?: string;
  };
}

export interface NormalizedContact {
  name: string;
  email: string;
  company?: string;
  title?: string;
  phone?: string;
  lastInteraction: Date;
  interactionCount: number;
  interactionTypes: ('email' | 'meeting' | 'call' | 'document')[];
  sentiment: 'positive' | 'neutral' | 'negative';
  importance: 'high' | 'medium' | 'low';
  dealPotential: 'high' | 'medium' | 'low';
  tags: string[];
  metadata: {
    sources: string[];
    userId: string;
    processedAt: Date;
  };
}

export class DataNormalizationService {
  private static readonly VERSION = '1.0.0';

  /**
   * Normalize Gmail messages for LLM processing
   */
  static normalizeEmails(messages: GmailMessage[], userId: string): NormalizedEmail[] {
    try {
      const normalizedEmails: NormalizedEmail[] = [];

      for (const message of messages) {
        try {
          const normalized = this.normalizeGmailMessage(message, userId);
          if (normalized) {
            normalizedEmails.push(normalized);
          }
        } catch (error) {
          logger.warn(`Failed to normalize message ${message.id}:`, error);
        }
      }

      logger.info(`Normalized ${normalizedEmails.length} out of ${messages.length} emails`);
      return normalizedEmails;
    } catch (error) {
      logger.error('Error normalizing emails:', error);
      throw new Error('Failed to normalize email data');
    }
  }

  /**
   * Normalize a single Gmail message
   */
  private static normalizeGmailMessage(message: GmailMessage, userId: string): NormalizedEmail | null {
    try {
      const headers = message.payload?.headers || [];

      // Extract headers
      const getHeader = (name: string) =>
        headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const subject = getHeader('subject');
      const fromHeader = getHeader('from');
      const toHeader = getHeader('to');
      const ccHeader = getHeader('cc');
      const bccHeader = getHeader('bcc');
      const dateHeader = getHeader('date');

      // Parse email addresses
      const parseEmailList = (emailString: string) => {
        if (!emailString) return [];
        return emailString.split(',').map(email => {
          const match = email.trim().match(/^(.+?)\s*<(.+?)>$|^(.+)$/);
          if (match) {
            const name = match[1]?.trim() || match[3]?.trim() || '';
            const emailAddr = match[2] || match[3]?.trim() || '';
            return { name: name.replace(/['"]/g, ''), email: emailAddr };
          }
          return { name: '', email: email.trim() };
        });
      };

      const from = parseEmailList(fromHeader)[0] || { name: '', email: '' };
      const to = parseEmailList(toHeader);
      const cc = parseEmailList(ccHeader);
      const bcc = parseEmailList(bccHeader);

      // Extract body content
      const body = this.extractEmailBody(message.payload);

      // Extract attachments
      const attachments = this.extractAttachments(message.payload);

      // Extract keywords and entities
      const keywords = this.extractKeywords(subject + ' ' + body.text);
      const entities = this.extractEntities(subject + ' ' + body.text);

      // Determine importance and CRM relevance
      const importance = this.determineImportance(message);
      const crmRelevant = this.isCrmRelevant(subject, body.text, from, to);
      const dealRelated = this.isDealRelated(subject, body.text);

      return {
        id: message.id,
        threadId: message.threadId,
        subject,
        from,
        to,
        cc: cc.length > 0 ? cc : undefined,
        bcc: bcc.length > 0 ? bcc : undefined,
        date: new Date(dateHeader || message.internalDate),
        body,
        attachments,
        labels: message.labelIds || [],
        importance,
        keywords,
        entities,
        crmRelevant,
        dealRelated,
        metadata: {
          source: 'gmail',
          userId,
          processedAt: new Date(),
          version: this.VERSION
        }
      };
    } catch (error) {
      logger.error(`Error normalizing message ${message.id}:`, error);
      return null;
    }
  }

  /**
   * Extract email body content
   */
  private static extractEmailBody(payload: any): { text: string; html?: string } {
    let text = '';
    let html = '';

    const extractFromPart = (part: any): void => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        text += Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.mimeType === 'text/html' && part.body?.data) {
        html += Buffer.from(part.body.data, 'base64').toString('utf-8');
      } else if (part.parts) {
        part.parts.forEach(extractFromPart);
      }
    };

    if (payload) {
      extractFromPart(payload);
    }

    return {
      text: text.trim(),
      html: html.trim() || undefined
    };
  }

  /**
   * Extract attachment information
   */
  private static extractAttachments(payload: any): Array<{ filename: string; contentType: string; size: number }> {
    const attachments: Array<{ filename: string; contentType: string; size: number }> = [];

    const extractFromPart = (part: any): void => {
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          contentType: part.mimeType || 'application/octet-stream',
          size: part.body.size || 0
        });
      } else if (part.parts) {
        part.parts.forEach(extractFromPart);
      }
    };

    if (payload) {
      extractFromPart(payload);
    }

    return attachments;
  }

  /**
   * Extract keywords from text
   */
  private static extractKeywords(text: string): string[] {
    // Simple keyword extraction - can be enhanced with NLP
    const keywords = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'from', 'they', 'been', 'have', 'will', 'would', 'could', 'should'].includes(word));

    // Get unique keywords with frequency > 1
    const frequency: { [key: string]: number } = {};
    keywords.forEach(word => frequency[word] = (frequency[word] || 0) + 1);

    return Object.keys(frequency)
      .filter(word => frequency[word] > 1 || ['deal', 'contract', 'meeting', 'proposal', 'investment', 'funding'].includes(word))
      .slice(0, 10);
  }

  /**
   * Extract entities from text
   */
  private static extractEntities(text: string): NormalizedEmail['entities'] {
    // Simple entity extraction - can be enhanced with NLP libraries
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    const amountRegex = /\$[\d,]+(?:\.\d{2})?/g;
    const dateRegex = /\b\d{1,2}\/\d{1,2}\/\d{4}\b|\b\d{4}-\d{2}-\d{2}\b/g;

    return {
      people: [],
      companies: [],
      dates: (text.match(dateRegex) || []).slice(0, 5),
      amounts: (text.match(amountRegex) || []).slice(0, 5),
      locations: []
    };
  }

  /**
   * Determine email importance
   */
  private static determineImportance(message: GmailMessage): 'high' | 'medium' | 'low' {
    const labels = message.labelIds || [];
    const subject = message.payload?.headers?.find(h => h.name.toLowerCase() === 'subject')?.value?.toLowerCase() || '';

    if (labels.includes('IMPORTANT') ||
        subject.includes('urgent') ||
        subject.includes('asap') ||
        subject.includes('meeting')) {
      return 'high';
    }

    if (subject.includes('proposal') ||
        subject.includes('contract') ||
        subject.includes('deal')) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Determine if email is CRM relevant
   */
  private static isCrmRelevant(subject: string, body: string, from: any, to: any[]): boolean {
    const text = (subject + ' ' + body).toLowerCase();
    const crmKeywords = [
      'meeting', 'call', 'proposal', 'contract', 'deal', 'investment',
      'funding', 'partnership', 'collaboration', 'opportunity',
      'client', 'customer', 'prospect', 'lead', 'sales'
    ];

    return crmKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Determine if email is deal related
   */
  private static isDealRelated(subject: string, body: string): boolean {
    const text = (subject + ' ' + body).toLowerCase();
    const dealKeywords = [
      'deal', 'investment', 'funding', 'valuation', 'term sheet',
      'due diligence', 'acquisition', 'merger', 'equity', 'venture'
    ];

    return dealKeywords.some(keyword => text.includes(keyword));
  }

  /**
   * Extract contacts from normalized emails
   */
  static extractContacts(emails: NormalizedEmail[]): NormalizedContact[] {
    const contactMap = new Map<string, NormalizedContact>();

    emails.forEach(email => {
      // Process all email participants
      const participants = [
        email.from,
        ...(email.to || []),
        ...(email.cc || []),
        ...(email.bcc || [])
      ].filter(p => p.email);

      participants.forEach(participant => {
        const existing = contactMap.get(participant.email);

        if (existing) {
          existing.lastInteraction = new Date(Math.max(existing.lastInteraction.getTime(), email.date.getTime()));
          existing.interactionCount += 1;
          if (!existing.interactionTypes.includes('email')) {
            existing.interactionTypes.push('email');
          }
        } else {
          contactMap.set(participant.email, {
            name: participant.name || participant.email.split('@')[0],
            email: participant.email,
            company: this.extractCompanyFromEmail(participant.email),
            lastInteraction: email.date,
            interactionCount: 1,
            interactionTypes: ['email'],
            sentiment: 'neutral',
            importance: email.crmRelevant ? 'medium' : 'low',
            dealPotential: email.dealRelated ? 'medium' : 'low',
            tags: [],
            metadata: {
              sources: ['gmail'],
              userId: email.metadata.userId,
              processedAt: new Date()
            }
          });
        }
      });
    });

    return Array.from(contactMap.values());
  }

  /**
   * Extract company from email domain
   */
  private static extractCompanyFromEmail(email: string): string | undefined {
    const domain = email.split('@')[1];
    if (!domain) return undefined;

    // Skip common email providers
    const commonProviders = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    if (commonProviders.includes(domain.toLowerCase())) {
      return undefined;
    }

    // Extract company name from domain
    return domain.split('.')[0].replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
}

export default DataNormalizationService;