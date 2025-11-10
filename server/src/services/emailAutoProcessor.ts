// @ts-nocheck
import { GmailService } from './gmail';
import { MicrosoftAuthService } from './microsoftAuth';
import { EmailsFirestoreService } from './emails.firestore.service';
import { IntegrationsFirestoreService } from './integrations.firestore.service';
import { OpenAIService } from './openai.service';
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
      
      // 1. Get Gmail emails with integration ID
      const { emails: gmailEmails, integrationId: gmailIntegrationId } = await this.getGmailEmails(userId);
      
      // 2. Get Outlook emails with integration ID
      const { emails: outlookEmails, integrationId: outlookIntegrationId } = await this.getOutlookEmails(userId);
      
      // 3. Process Gmail emails
      for (const email of gmailEmails) {
        await this.processEmail(email, userId, gmailIntegrationId);
      }
      
      // 4. Process Outlook emails
      for (const email of outlookEmails) {
        await this.processEmail(email, userId, outlookIntegrationId);
      }
      
      logger.info(`Processed ${gmailEmails.length + outlookEmails.length} emails for user ${userId}`);
    } catch (error) {
      logger.error('Error processing emails:', error);
    }
  }

  // Process a single email
  private static async processEmail(email: any, userId: string, integrationId: string) {
    try {
      // 1. Analyze content with AI
      const analysis = await this.analyzeEmailContent(email);
      
      // 2. Check if email is relevant - skip if not
      if (!analysis.isRelevant) {
        logger.info(`Skipping irrelevant email: ${email.subject} (confidence: ${analysis.confidence})`, {
          from: email.sender,
          category: analysis.category || 'none'
        });
        return; // Don't store irrelevant emails
      }
      
      // 3. Check if confidence is too low - skip low-confidence emails
      if (analysis.confidence < 0.3) {
        logger.info(`Skipping low-confidence email: ${email.subject} (confidence: ${analysis.confidence})`);
        return; // Don't store low-confidence emails
      }
      
      // 4. Determine where to store it
      const firebasePath = this.determineFirebasePath(analysis);
      
      // 5. Store in Firebase using existing email service with integration ID
      await this.storeInFirebase(email, analysis, firebasePath, userId, integrationId);
      
      logger.info(`✅ Stored email: ${email.subject} -> ${analysis.category}/${analysis.subCategory} (confidence: ${analysis.confidence})`);
    } catch (error) {
      logger.error(`Error processing email ${email.id}:`, error);
    }
  }

  // AI analysis of email content with keyword fallback
  private static async analyzeEmailContent(email: any): Promise<{
    category: 'deal' | 'investor' | 'broker';
    subCategory: string;
    confidence: number;
    isRelevant: boolean;
    extractedData: any;
  }> {
    // DISABLED: AI analysis (uses too many OpenAI API calls)
    // Using keyword-based analysis only to save costs
    logger.info('Using keyword-based analysis for email', { subject: email.subject });
    return this.analyzeWithKeywords(email);

    /* DISABLED AI ANALYSIS - Uncomment to re-enable:
    try {
      logger.info('Attempting AI analysis for email', { subject: email.subject });
      const aiResult = await this.analyzeWithAI(email);
      logger.info('AI analysis successful', { category: aiResult.category, confidence: aiResult.confidence });
      return aiResult;
    } catch (error) {
      logger.warn('AI analysis failed, falling back to keyword matching', { error: error instanceof Error ? error.message : 'Unknown error' });
      return this.analyzeWithKeywords(email);
    }
    */
  }

  // AI-powered analysis using OpenAI
  private static async analyzeWithAI(email: any): Promise<{
    category: 'deal' | 'investor' | 'broker';
    subCategory: string;
    confidence: number;
    isRelevant: boolean;
    extractedData: any;
  }> {
    const openaiService = new OpenAIService();
    
    const emailContent = `
Subject: ${email.subject}
From: ${email.sender}
Content: ${email.content.substring(0, 2000)}
`;

    const prompt = `Analyze this business email and categorize it. Respond ONLY with valid JSON matching this exact structure:

{
  "category": "deal" | "investor" | "broker",
  "subCategory": string (e.g., "response-received", "due-diligence", "closing" for deals; "response-received", "closing" for investors/brokers),
  "confidence": number (0.0 to 1.0),
  "isRelevant": boolean (true if business-related, false for spam/personal/marketing/security notifications),
  "extractedData": {
    "companyName": string or null,
    "dealValue": number or null,
    "investorName": string or null,
    "brokerName": string or null,
    "sentiment": "positive" | "neutral" | "negative"
  },
  "reasoning": string (brief explanation)
}

Categories:
- "deal": Investment opportunities, fundraising, acquisitions, M&A discussions
- "investor": LP communications, fund updates, investor relations, capital calls
- "broker": Introductions from intermediaries, deal referrals, placement agents

**IMPORTANT**: Set isRelevant to FALSE for:
- Account security notifications (password resets, login alerts, 2FA, etc.)
- Marketing emails, newsletters, promotions
- System notifications (welcome emails, app notifications, etc.)
- Personal emails unrelated to business
- Spam or automated messages

Only set isRelevant to TRUE for emails directly related to deals, investors, or brokers in private equity/venture capital.

Email to analyze:
${emailContent}`;

    const completion = await openaiService['client'].chat.completions.create({
      model: 'gpt-4',
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        { role: 'system', content: 'You are an expert at analyzing private equity and venture capital emails. Always respond with valid JSON only.' },
        { role: 'user', content: prompt }
      ]
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const result = JSON.parse(response);
    
    // Map sentiment to legacy format
    const sentiment = result.extractedData.sentiment === 'positive' ? 'GREEN' 
                    : result.extractedData.sentiment === 'negative' ? 'RED' 
                    : 'YELLOW';
    
    return {
      category: result.category,
      subCategory: result.subCategory,
      confidence: result.confidence,
      isRelevant: result.isRelevant ?? true, // Default to true if not provided
      extractedData: {
        ...result.extractedData,
        sentiment
      }
    };
  }

  // Fallback keyword-based analysis
  private static analyzeWithKeywords(email: any): {
    category: 'deal' | 'investor' | 'broker';
    subCategory: string;
    confidence: number;
    isRelevant: boolean;
    extractedData: any;
  } {
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
      isRelevant: confidence > 0.2, // Consider relevant if has some confidence
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
    userId: string,
    integrationId: string
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
      integrationId: integrationId, // Track which integration this email came from
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
  private static async getGmailEmails(userId: string): Promise<{ emails: any[], integrationId: string }> {
    try {
      logger.info(`Fetching Gmail emails for user ${userId}`);
      
      // Get user's Gmail integration from Firebase
      const gmailIntegration = await IntegrationsFirestoreService.findFirst({
        userId,
        provider: 'google',
        type: 'gmail',
        isActive: true
      });
      
      if (!gmailIntegration?.accessToken || !gmailIntegration.id) {
        logger.info(`No active Gmail integration found for user ${userId}`);
        return { emails: [], integrationId: '' };
      }

      // Use existing Gmail service to fetch emails
      // Fetch all inbox emails first
      const response = await GmailService.listMessages(gmailIntegration.accessToken, {
        maxResults: 100, // Fetch more to ensure we get enough primary emails after filtering
        labelIds: ['INBOX'] // Get inbox emails
      });

      // Transform Gmail format to our format and filter out non-primary emails
      // Gmail category labels: CATEGORY_PROMOTIONS, CATEGORY_SOCIAL, CATEGORY_UPDATES, CATEGORY_FORUMS
      logger.info(`Filtering ${response.messages.length} emails for Primary inbox only`);

      const emails = response.messages
        .filter((email: any) => {
          const labels = email.labelIds || [];
          const subject = email.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '';

          // Exclude emails with category labels (promotions, social, updates, forums)
          const hasPromotions = labels.includes('CATEGORY_PROMOTIONS');
          const hasSocial = labels.includes('CATEGORY_SOCIAL');
          const hasUpdates = labels.includes('CATEGORY_UPDATES');
          const hasForums = labels.includes('CATEGORY_FORUMS');

          const isNonPrimary = hasPromotions || hasSocial || hasUpdates || hasForums;

          // Log filtered emails
          if (isNonPrimary) {
            const category = hasPromotions ? 'PROMOTIONS' : hasSocial ? 'SOCIAL' : hasUpdates ? 'UPDATES' : 'FORUMS';
            logger.info(`Filtering out ${category} email: ${subject}`);
          }

          // Only include if it doesn't have any category labels (i.e., it's in Primary)
          return !isNonPrimary;
        })
        .slice(0, 50) // Limit to 50 after filtering
        .map((email: any) => ({
          id: email.id,
          source: 'gmail',
          sender: email.payload?.headers?.find((h: any) => h.name === 'From')?.value || '',
          recipient: email.payload?.headers?.find((h: any) => h.name === 'To')?.value || '',
          subject: email.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '',
          content: email.payload?.body?.data || '',
          timestamp: new Date(parseInt(email.internalDate)),
          threadId: email.threadId,
          labelIds: email.labelIds || [] // Include labels for debugging
        }));

      logger.info(`Fetched ${emails.length} Gmail emails for user ${userId}`);
      return { emails, integrationId: gmailIntegration.id };
    } catch (error) {
      logger.error('Error fetching Gmail emails:', error);
      return { emails: [], integrationId: '' };
    }
  }

  // Get Outlook emails
  private static async getOutlookEmails(userId: string): Promise<{ emails: any[], integrationId: string }> {
    try {
      logger.info(`Fetching Outlook emails for user ${userId}`);
      
      // Get user's Microsoft integration from Firebase
      const microsoftIntegration = await IntegrationsFirestoreService.findFirst({
        userId,
        provider: 'microsoft',
        type: 'profile',
        isActive: true
      });
      
      if (!microsoftIntegration?.accessToken || !microsoftIntegration.id) {
        logger.info(`No active Microsoft integration found for user ${userId}`);
        return { emails: [], integrationId: '' };
      }

      // Check if Outlook service is enabled
      if (!(microsoftIntegration as any).services || !(microsoftIntegration as any).services.includes('outlook')) {
        logger.info(`Microsoft integration does not have Outlook service for user ${userId}`);
        return { emails: [], integrationId: '' };
      }

      // Use Microsoft Graph API to fetch emails (both read and unread)
      const response = await axios.get('https://graph.microsoft.com/v1.0/me/messages', {
        headers: {
          'Authorization': `Bearer ${microsoftIntegration.accessToken}`,
          'Content-Type': 'application/json'
        },
        params: {
          $top: 50,
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
      return { emails, integrationId: microsoftIntegration.id };
    } catch (error) {
      logger.error('Error fetching Outlook emails:', error);
      return { emails: [], integrationId: '' };
    }
  }
}