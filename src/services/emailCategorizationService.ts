import integrationService from './integrationService';
import axios from '../lib/axios';

export interface EmailCategory {
  category: 'deal' | 'investor' | 'broker' | 'general';
  confidence: number;
  extractedData: {
    companyName?: string;
    dealValue?: number;
    dealStage?: string;
    investorName?: string;
    sentiment?: 'positive' | 'negative' | 'neutral';
    priority?: 'high' | 'medium' | 'low';
  };
}

export interface CategorizedEmail {
  id: string;
  subject: string;
  from: {
    emailAddress: {
      address: string;
      name: string;
    };
  };
  receivedDateTime: string;
  isRead: boolean;
  hasAttachments: boolean;
  body: {
    content: string;
    contentType: string;
  };
  importance?: 'low' | 'normal' | 'high';
  categories?: string[];
  categorization: EmailCategory;
}

class EmailCategorizationService {
  // Keywords for deal-related emails
  private dealKeywords = [
    'investment', 'funding', 'capital', 'equity', 'valuation', 'term sheet',
    'due diligence', 'closing', 'acquisition', 'merger', 'ipo', 'exit',
    'portfolio', 'investor', 'venture', 'private equity', 'growth capital',
    'series a', 'series b', 'series c', 'pre-seed', 'seed', 'round',
    'pitch', 'pitch deck', 'presentation', 'meeting', 'call',
    'partnership', 'strategic', 'opportunity', 'deal', 'transaction'
  ];

  // Keywords for investor-related emails
  private investorKeywords = [
    'investor', 'lp', 'limited partner', 'gp', 'general partner',
    'fund', 'capital', 'allocation', 'commitment', 'subscription',
    'distribution', 'return', 'irr', 'multiple', 'performance',
    'quarterly', 'annual', 'report', 'update', 'newsletter'
  ];

  // Keywords for broker-related emails
  private brokerKeywords = [
    'broker', 'intermediary', 'advisor', 'advisory', 'm&a',
    'sell-side', 'buy-side', 'mandate', 'process', 'auction',
    'teaser', 'cim', 'confidential information memorandum',
    'data room', 'management presentation', 'management meeting'
  ];

  // Keywords for sentiment analysis
  private positiveKeywords = [
    'excited', 'interested', 'positive', 'great', 'excellent',
    'opportunity', 'potential', 'promising', 'strong', 'impressive',
    'looking forward', 'enthusiastic', 'optimistic', 'confident'
  ];

  private negativeKeywords = [
    'concerned', 'worried', 'negative', 'disappointed', 'unfortunately',
    'not interested', 'decline', 'pass', 'not a fit', 'not suitable',
    'too early', 'too late', 'not aligned', 'not the right time'
  ];

  // Keywords for priority levels
  private highPriorityKeywords = [
    'urgent', 'asap', 'immediately', 'deadline', 'closing',
    'final', 'last chance', 'time sensitive', 'critical'
  ];

  private mediumPriorityKeywords = [
    'important', 'priority', 'soon', 'next week', 'schedule',
    'meeting', 'call', 'discussion', 'review'
  ];

  /**
   * Categorize an email based on its content
   */
  categorizeEmail(email: any): EmailCategory {
    const subject = (email.subject || '').toLowerCase();
    const body = this.extractTextContent(email.body?.content || '');
    const fromName = (email.from?.emailAddress?.name || '').toLowerCase();
    const fromEmail = (email.from?.emailAddress?.address || '').toLowerCase();

    const allText = `${subject} ${body} ${fromName} ${fromEmail}`.toLowerCase();

    // Check for deal-related content
    const dealScore = this.calculateKeywordScore(allText, this.dealKeywords);
    const investorScore = this.calculateKeywordScore(allText, this.investorKeywords);
    const brokerScore = this.calculateKeywordScore(allText, this.brokerKeywords);


    // Determine category
    let category: 'deal' | 'investor' | 'broker' | 'general' = 'general';
    let confidence = 0;

    if (dealScore > investorScore && dealScore > brokerScore && dealScore > 0.1) {
      category = 'deal';
      confidence = Math.min(dealScore, 1);
    } else if (investorScore > brokerScore && investorScore > 0.1) {
      category = 'investor';
      confidence = Math.min(investorScore, 1);
    } else if (brokerScore > 0.1) {
      category = 'broker';
      confidence = Math.min(brokerScore, 1);
    }

    // Extract additional data
    const extractedData = this.extractDealData(allText, subject, body);

    return {
      category,
      confidence,
      extractedData
    };
  }

  /**
   * Calculate keyword score based on text content
   */
  private calculateKeywordScore(text: string, keywords: string[]): number {
    const matches = keywords.filter(keyword => text.includes(keyword));
    return matches.length / keywords.length;
  }

  /**
   * Extract text content from HTML or plain text
   */
  private extractTextContent(content: string): string {
    if (!content) return '';
    
    // Remove HTML tags if present
    const textContent = content.replace(/<[^>]*>/g, ' ');
    // Clean up extra whitespace
    return textContent.replace(/\s+/g, ' ').trim();
  }

  /**
   * Extract deal-related data from email content
   */
  private extractDealData(allText: string, subject: string, body: string): any {
    const extractedData: any = {};

    // Extract company name (look for patterns like "Company Name" or "ABC Corp")
    const companyPatterns = [
      /(?:from|about|regarding)\s+([A-Z][a-zA-Z\s&]+(?:Inc|Corp|LLC|Ltd|Company|Co\.))/gi,
      /([A-Z][a-zA-Z\s&]+(?:Inc|Corp|LLC|Ltd|Company|Co\.))/gi
    ];

    for (const pattern of companyPatterns) {
      const match = pattern.exec(allText);
      if (match) {
        extractedData.companyName = match[1].trim();
        break;
      }
    }

    // Extract deal value (look for dollar amounts)
    const valuePatterns = [
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:million|m|billion|b|k|thousand)/gi,
      /\$(\d+(?:,\d{3})*(?:\.\d{2})?)/gi
    ];

    for (const pattern of valuePatterns) {
      const match = pattern.exec(allText);
      if (match) {
        let value = parseFloat(match[1].replace(/,/g, ''));
        const unit = match[0].toLowerCase();
        if (unit.includes('million') || unit.includes('m')) {
          value *= 1000000;
        } else if (unit.includes('billion') || unit.includes('b')) {
          value *= 1000000000;
        } else if (unit.includes('thousand') || unit.includes('k')) {
          value *= 1000;
        }
        extractedData.dealValue = value;
        break;
      }
    }

    // Extract deal stage
    const stageKeywords = {
      'prospect': ['initial', 'first', 'intro', 'introduction', 'outreach'],
      'response': ['response', 'reply', 'interested', 'feedback'],
      'diligence': ['due diligence', 'dd', 'review', 'analysis', 'evaluation'],
      'term-sheet': ['term sheet', 'terms', 'proposal', 'offer'],
      'closing': ['closing', 'final', 'signature', 'execution', 'complete']
    };

    for (const [stage, keywords] of Object.entries(stageKeywords)) {
      if (keywords.some(keyword => allText.includes(keyword))) {
        extractedData.dealStage = stage;
        break;
      }
    }

    // Extract investor name
    const investorPatterns = [
      /(?:investor|lp|limited partner|gp|general partner):\s*([A-Z][a-zA-Z\s&]+)/gi,
      /([A-Z][a-zA-Z\s&]+)\s*(?:fund|capital|partners|investments)/gi
    ];

    for (const pattern of investorPatterns) {
      const match = pattern.exec(allText);
      if (match) {
        extractedData.investorName = match[1].trim();
        break;
      }
    }

    // Analyze sentiment
    const positiveScore = this.calculateKeywordScore(allText, this.positiveKeywords);
    const negativeScore = this.calculateKeywordScore(allText, this.negativeKeywords);

    if (positiveScore > negativeScore && positiveScore > 0.1) {
      extractedData.sentiment = 'positive';
    } else if (negativeScore > positiveScore && negativeScore > 0.1) {
      extractedData.sentiment = 'negative';
    } else {
      extractedData.sentiment = 'neutral';
    }

    // Determine priority
    const highPriorityScore = this.calculateKeywordScore(allText, this.highPriorityKeywords);
    const mediumPriorityScore = this.calculateKeywordScore(allText, this.mediumPriorityKeywords);

    if (highPriorityScore > 0.1) {
      extractedData.priority = 'high';
    } else if (mediumPriorityScore > 0.1) {
      extractedData.priority = 'medium';
    } else {
      extractedData.priority = 'low';
    }

    return extractedData;
  }

  /**
   * Get AI-categorized emails from Firebase (already processed by backend)
   */
  async getCategorizedEmails(maxResults: number = 50): Promise<CategorizedEmail[]> {
    try {
      console.log('🤖 Fetching AI-categorized emails from Firebase...');
      
      // Fetch from Firebase API (emails already processed with AI by backend)
      const response = await axios.get<{ success: boolean; data: any[] }>(`/api/firebase-emails?limit=${maxResults}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.data.success || !response.data.data) {
        throw new Error('Failed to fetch emails from Firebase');
      }

      const firebaseEmails = response.data.data;
      console.log(`✅ Fetched ${firebaseEmails.length} AI-categorized emails from Firebase`);

      // Convert Firebase format to CategorizedEmail format
      const categorizedEmails: CategorizedEmail[] = firebaseEmails.map((email: any) => ({
        id: email.message_id || email.id,
        subject: email.email_subject || '(No Subject)',
        from: {
          emailAddress: {
            address: email.prospect_email || '',
            name: email.prospect_name || ''
          }
        },
        receivedDateTime: email.received_date || email.createdAt,
        isRead: true,
        hasAttachments: false,
        body: {
          content: email.email_body || '',
          contentType: 'text/plain'
        },
        importance: 'normal' as const,
        categories: [],
        categorization: {
          category: email.category || 'general',
          confidence: email.confidence || 0,
          extractedData: {
            sentiment: email.sentiment || 'neutral',
            companyName: email.associatedDealCompany,
            ...email.extractedData
          }
        }
      }));

      console.log('📊 Email categorization breakdown from Firebase:', 
        categorizedEmails.reduce((acc, email) => {
          const cat = email.categorization.category;
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      );

      return categorizedEmails;
    } catch (error: any) {
      console.error('Error fetching Firebase emails:', error);
      throw new Error('Failed to fetch AI-categorized emails. Please ensure your email integration is connected and the backend is processing emails.');
    }
  }
  
  /**
   * Convert Gmail message format to common email format
   */
  private convertGmailToCommonFormat(gmailMsg: any): any {
    const headers = gmailMsg.payload?.headers || [];
    const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
    
    const fromHeader = getHeader('From');
    const fromMatch = fromHeader.match(/^(.*?)\s*<(.+)>$/) || fromHeader.match(/^(.+)$/);
    const fromName = fromMatch?.[1]?.trim() || fromMatch?.[2] || '';
    const fromEmail = fromMatch?.[2] || fromMatch?.[1] || '';
    
    return {
      id: gmailMsg.id,
      subject: getHeader('Subject') || '(No Subject)',
      from: {
        emailAddress: {
          address: fromEmail,
          name: fromName
        }
      },
      receivedDateTime: new Date(parseInt(gmailMsg.internalDate)).toISOString(),
      isRead: !gmailMsg.labelIds?.includes('UNREAD'),
      hasAttachments: false, // Can be enhanced later
      body: {
        content: gmailMsg.snippet || '',
        contentType: 'text/plain'
      },
      importance: 'normal' as const,
      categories: gmailMsg.labelIds || []
    };
  }

  /**
   * Get deal-related emails only
   */
  async getDealRelatedEmails(maxResults: number = 50): Promise<CategorizedEmail[]> {
    try {
      const categorizedEmails = await this.getCategorizedEmails(maxResults);
      
      return categorizedEmails.filter(email => 
        email.categorization.category === 'deal' && 
        email.categorization.confidence > 0.3
      );
    } catch (error) {
      console.error('Error fetching deal-related emails:', error);
      throw error;
    }
  }

  /**
   * Get emails by category
   */
  async getEmailsByCategory(
    category: 'deal' | 'investor' | 'broker' | 'general',
    maxResults: number = 50
  ): Promise<CategorizedEmail[]> {
    try {
      const categorizedEmails = await this.getCategorizedEmails(maxResults);
      
      // Log categorization breakdown for debugging
      const breakdown = categorizedEmails.reduce((acc, email) => {
        const cat = email.categorization.category;
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('📊 Email categorization breakdown:', breakdown);
      console.log(`Looking for "${category}" emails:`, categorizedEmails.filter(e => e.categorization.category === category).length, 'found');
      
      const filtered = categorizedEmails.filter(email => 
        email.categorization.category === category
      );
      
      // If no emails found, log some examples to help debug
      if (filtered.length === 0 && categorizedEmails.length > 0) {
        console.log('⚠️ No emails matched category "' + category + '". Here are the first 3 email subjects:');
        categorizedEmails.slice(0, 3).forEach((email, idx) => {
          console.log(`  ${idx + 1}. "${email.subject}" - categorized as: ${email.categorization.category} (confidence: ${email.categorization.confidence.toFixed(2)})`);
        });
      }
      
      return filtered;
    } catch (error) {
      console.error('Error fetching emails by category:', error);
      throw error;
    }
  }
}

export default new EmailCategorizationService();
