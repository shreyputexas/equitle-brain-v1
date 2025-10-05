import { GmailService } from './gmail';
import { MicrosoftAuthService } from './microsoftAuth';
import { EmailsFirestoreService } from './emails.firestore.service';
import { IntegrationsFirestoreService } from './integrations.firestore.service';
import { db, FirestoreHelpers } from '../lib/firebase';
import logger from '../utils/logger';
import axios from 'axios';

export interface ProcessedEmail {
  id: string;
  source: 'gmail' | 'outlook';
  sender: string;
  recipient: string;
  subject: string;
  content: string;
  timestamp: Date;
  category: 'deal' | 'investor' | 'broker';
  subCategory: string;
  confidence: number;
  extractedData: {
    companyName?: string;
    dealValue?: number;
    dealStage?: string;
    investorName?: string;
    brokerName?: string;
    sentiment?: 'RED' | 'YELLOW' | 'GREEN';
  };
  firebasePath: string;
}

export class EmailAutoProcessor {
  // Main method to process all emails for a user
  static async processAllEmails(userId: string) {
    try {
      logger.info(`Starting email processing for user ${userId}`);
      
      // 1. Get Gmail emails
      const gmailEmails = await this.getGmailEmails(userId);
      
      // 2. Get Outlook emails  
      const outlookEmails = await this.getOutlookEmails(userId);
      
      // 3. Process each email
      const allEmails = [...gmailEmails, ...outlookEmails];
      
      for (const email of allEmails) {
        await this.processEmail(email, userId);
      }
      
      logger.info(`Processed ${allEmails.length} emails for user ${userId}`);
    } catch (error) {
      logger.error('Error processing emails:', error);
    }
  }

  // Process a single email
  private static async processEmail(email: any, userId: string) {
    try {
      // 1. Analyze content with AI
      const analysis = await this.analyzeEmailContent(email);
      
      // 2. Determine where to store it
      const firebasePath = this.determineFirebasePath(analysis);
      
      // 3. Store in Firebase using existing email service
      await this.storeInFirebase(email, analysis, firebasePath, userId);
      
      logger.info(`Processed email: ${email.subject} -> ${analysis.category}/${analysis.subCategory}`);
    } catch (error) {
      logger.error(`Error processing email ${email.id}:`, error);
    }
  }

  // AI analysis of email content
  private static async analyzeEmailContent(email: any): Promise<{
    category: 'deal' | 'investor' | 'broker';
    subCategory: string;
    confidence: number;
    extractedData: any;
  }> {
    const content = `${email.subject} ${email.content}`.toLowerCase();
    
    // Updated keyword lists for 3-tier classification
    const dealKeywords = ['deal', 'investment', 'due diligence', 'term sheet', 'closing', 'acquisition', 'merger', 'ioi', 'loi', 'letter of intent', 'funding', 'series a', 'series b', 'valuation'];
    const investorKeywords = ['investor', 'lp', 'limited partner', 'fund', 'commitment', 'portfolio', 'returns', 'irr', 'distribution', 'capital call', 'allocation', 'commitment'];
    const brokerKeywords = ['broker', 'intermediary', 'placement agent', 'advisor', 'consultant', 'facilitator', 'matchmaker', 'introduction', 'referral'];
    
    const dealScore = dealKeywords.filter(keyword => 
      content.includes(keyword)
    ).length;
    
    const investorScore = investorKeywords.filter(keyword => 
      content.includes(keyword)
    ).length;
    
    const brokerScore = brokerKeywords.filter(keyword => 
      content.includes(keyword)
    ).length;
    
    // Determine sentiment
    const sentiment = this.determineSentiment(content);
    
    // Determine main category
    let category: 'deal' | 'investor' | 'broker';
    let confidence: number;
    
    if (brokerScore > investorScore && brokerScore > dealScore && brokerScore > 0) {
      category = 'broker';
      confidence = brokerScore / brokerKeywords.length;
    } else if (investorScore > dealScore && investorScore > 0) {
      category = 'investor';
      confidence = investorScore / investorKeywords.length;
    } else if (dealScore > 0) {
      category = 'deal';
      confidence = dealScore / dealKeywords.length;
    } else {
      category = 'deal'; // Default to deal if no clear category
      confidence = 0.3;
    }
    
    // Determine sub-category
    const subCategory = this.determineSubCategory(email, category);
    
    // Extract relevant data based on category
    let extractedData: any = { sentiment };
    
    switch (category) {
      case 'deal':
        extractedData = {
          companyName: this.extractCompanyName(email.content),
          dealValue: this.extractDealValue(email.content),
          dealStage: subCategory,
          sentiment
        };
        break;
      case 'investor':
        extractedData = {
          investorName: this.extractName(email.sender),
          sentiment
        };
        break;
      case 'broker':
        extractedData = {
          brokerName: this.extractName(email.sender),
          sentiment
        };
        break;
    }
    
    return {
      category,
      subCategory,
      confidence,
      extractedData
    };
  }

  // Determine sub-category based on main category
  private static determineSubCategory(email: any, mainCategory: string): string {
    const content = `${email.subject} ${email.content}`.toLowerCase();
    
    if (mainCategory === 'deal') {
      if (content.includes('response') || content.includes('interested') || content.includes('yes') || content.includes('reply')) {
        return 'response-received';
      }
      if (content.includes('due diligence') || content.includes('diligence') || content.includes('review') || content.includes('analysis')) {
        return 'due-diligence';
      }
      if (content.includes('ioi') || content.includes('loi') || content.includes('letter of intent') || content.includes('letter of interest')) {
        return 'ioi-loi';
      }
      return 'all';
    }
    
    if (mainCategory === 'investor' || mainCategory === 'broker') {
      if (content.includes('response') || content.includes('interested') || content.includes('yes') || content.includes('reply')) {
        return 'response-received';
      }
      if (content.includes('closing') || content.includes('commit') || content.includes('final') || content.includes('execute')) {
        return 'closing';
      }
      return 'all';
    }
    
    return 'all';
  }

  // Determine Firebase storage path
  private static determineFirebasePath(analysis: any): string {
    switch (analysis.category) {
      case 'deal':
        return 'deals';
      case 'investor':
        return 'investors';
      case 'broker':
        return 'brokers';
      default:
        return 'communications';
    }
  }

  // Store in Firebase using existing services
  private static async storeInFirebase(
    email: any, 
    analysis: any, 
    firebasePath: string, 
    userId: string
  ) {
    // Use existing email service
    const emailData = {
      sentiment: analysis.extractedData.sentiment,
      prospect_email: email.sender,
      prospect_name: this.extractName(email.sender),
      email_subject: email.subject,
      email_body: email.content,
      received_date: email.timestamp.toISOString(),
      message_id: email.id,
      thread_id: email.threadId,
      status: 'processed',
      source: email.source,
      category: analysis.category,
      subCategory: analysis.subCategory,
      confidence: analysis.confidence
    };

    await EmailsFirestoreService.storeEmail(userId, emailData);
  }

  // Helper methods
  private static determineSentiment(content: string): 'RED' | 'YELLOW' | 'GREEN' {
    const positiveWords = ['interested', 'excited', 'great', 'excellent', 'yes', 'sounds good', 'definitely', 'absolutely', 'perfect'];
    const negativeWords = ['not interested', 'no', 'decline', 'reject', 'unfortunately', 'pass', 'not now', 'maybe later'];
    
    const positiveCount = positiveWords.filter(word => content.includes(word)).length;
    const negativeCount = negativeWords.filter(word => content.includes(word)).length;
    
    if (negativeCount > positiveCount) return 'RED';
    if (positiveCount > negativeCount) return 'GREEN';
    return 'YELLOW';
  }

  private static extractName(email: string): string {
    return email.split('@')[0];
  }

  private static extractCompanyName(content: string): string {
    const matches = content.match(/([A-Z][a-z]+ [A-Z][a-z]+)/g);
    return matches ? matches[0] : '';
  }

  private static extractDealValue(content: string): number | undefined {
    const valueMatch = content.match(/\$(\d+(?:\.\d+)?)[mMbB]/);
    if (valueMatch) {
      const value = parseFloat(valueMatch[1]);
      return valueMatch[0].toLowerCase().includes('m') ? value * 1000000 : value * 1000000000;
    }
    return undefined;
  }

  // Get Gmail emails
  private static async getGmailEmails(userId: string): Promise<any[]> {
    try {
      logger.info(`Fetching Gmail emails for user ${userId}`);
      
      // Get user's Gmail integration from Firebase
      const gmailIntegration = await IntegrationsFirestoreService.findFirst({
        userId,
        provider: 'google',
        type: 'gmail',
        isActive: true
      });
      
      if (!gmailIntegration?.accessToken) {
        logger.info(`No active Gmail integration found for user ${userId}`);
        return [];
      }

      // Use existing Gmail service to fetch emails
      const response = await GmailService.listMessages(gmailIntegration.accessToken, {
        maxResults: 50, // Limit to recent emails
        q: 'is:unread OR in:inbox' // Get unread or inbox emails
      });

      // Transform Gmail format to our format
      const emails = response.messages.map((email: any) => ({
        id: email.id,
        source: 'gmail',
        sender: email.payload?.headers?.find((h: any) => h.name === 'From')?.value || '',
        recipient: email.payload?.headers?.find((h: any) => h.name === 'To')?.value || '',
        subject: email.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '',
        content: email.payload?.body?.data || '',
        timestamp: new Date(parseInt(email.internalDate)),
        threadId: email.threadId
      }));

      logger.info(`Fetched ${emails.length} Gmail emails for user ${userId}`);
      return emails;
    } catch (error) {
      logger.error('Error fetching Gmail emails:', error);
      return [];
    }
  }

  // Get Outlook emails
  private static async getOutlookEmails(userId: string): Promise<any[]> {
    try {
      logger.info(`Fetching Outlook emails for user ${userId}`);
      
      // Get user's Microsoft integration from Firebase
      const microsoftIntegration = await IntegrationsFirestoreService.findFirst({
        userId,
        provider: 'microsoft',
        type: 'mail',
        isActive: true
      });
      
      if (!microsoftIntegration?.accessToken) {
        logger.info(`No active Microsoft integration found for user ${userId}`);
        return [];
      }

      // Use Microsoft Graph API to fetch emails
      const response = await axios.get('https://graph.microsoft.com/v1.0/me/messages', {
        headers: {
          'Authorization': `Bearer ${microsoftIntegration.accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          $top: 50,
          $filter: "isRead eq false",
          $orderby: "receivedDateTime desc"
        }
      });

      // Transform Outlook format to our format
      const emails = response.data.value.map((email: any) => ({
        id: email.id,
        source: 'outlook',
        sender: email.from?.emailAddress?.address || '',
        recipient: email.toRecipients?.[0]?.emailAddress?.address || '',
        subject: email.subject || '',
        content: email.body?.content || '',
        timestamp: new Date(email.receivedDateTime),
        threadId: email.conversationId
      }));

      logger.info(`Fetched ${emails.length} Outlook emails for user ${userId}`);
      return emails;
    } catch (error) {
      logger.error('Error fetching Outlook emails:', error);
      return [];
    }
  }
}