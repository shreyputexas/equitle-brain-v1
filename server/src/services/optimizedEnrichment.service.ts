import { ApolloService, ApolloPerson } from './apollo.service';
import { ApolloWebhookService } from './apolloWebhook.service';
import logger from '../utils/logger';

/**
 * Optimized Enrichment Service
 * 
 * Strategy:
 * 1. Use /people/match endpoint (correct endpoint for phone/email reveal)
 * 2. Extract emails from multiple sources (email field, personal_emails array)
 * 3. Return immediately with available data (work phones, emails)
 * 4. Track enrichment requests for webhook matching
 * 5. Process webhooks asynchronously to update contacts
 */
export interface EnrichmentRequest {
  personId: string;
  personName: string;
  userId: string;
  contactId?: string; // Firestore contact ID if already saved
  timestamp: number;
  status: 'pending' | 'completed' | 'failed';
}

/**
 * In-memory store for tracking enrichment requests
 * In production, consider using Redis or database
 */
const enrichmentRequests = new Map<string, EnrichmentRequest>();

/**
 * Clean up old requests (older than 1 hour)
 */
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [personId, request] of enrichmentRequests.entries()) {
    if (request.timestamp < oneHourAgo) {
      enrichmentRequests.delete(personId);
    }
  }
}, 30 * 60 * 1000); // Every 30 minutes

export class OptimizedEnrichmentService {
  /**
   * Extract email from Apollo person response
   * Checks multiple sources: email field, personal_emails array
   */
  private static extractEmail(person: any): string | null {
    // Check primary email field
    let email = person.email;
    
    // Skip placeholder emails
    if (!email || email === 'email_not_unlocked' || email.includes('email_not_unlocked')) {
      email = null;
    }
    
    // Check personal_emails array (Apollo returns personal emails here when reveal_personal_emails=true)
    if (!email && person.personal_emails && Array.isArray(person.personal_emails) && person.personal_emails.length > 0) {
      // Find first valid email (not placeholder)
      const validEmail = person.personal_emails.find((e: string) => 
        e && e !== 'email_not_unlocked' && !e.includes('email_not_unlocked')
      );
      if (validEmail) {
        email = validEmail;
        logger.info('Found email in personal_emails array', { email });
      }
    }
    
    return email || null;
  }

  /**
   * Extract phone numbers from Apollo person response
   * Returns all available phone numbers (work, mobile, etc.)
   */
  private static extractPhoneNumbers(person: any): Array<{
    raw_number: string;
    sanitized_number: string;
    type: string;
  }> {
    // Check API response first
    let phoneNumbers = person.phone_numbers || [];
    
    // Transform if needed (handle different response formats)
    if (phoneNumbers.length > 0) {
      phoneNumbers = phoneNumbers.map((p: any) => ({
        raw_number: p.raw_number || p.rawNumber || '',
        sanitized_number: p.sanitized_number || p.sanitizedNumber || '',
        type: p.type_cd || p.type || 'unknown'
      }));
    }
    
    return phoneNumbers;
  }

  /**
   * Get best phone number (prefer mobile, then work, then any)
   */
  private static getBestPhoneNumber(phoneNumbers: Array<{
    raw_number: string;
    sanitized_number: string;
    type: string;
  }>): string | null {
    if (!phoneNumbers || phoneNumbers.length === 0) return null;
    
    // Prefer mobile, then work, then any
    const mobile = phoneNumbers.find(p => 
      p.type?.toLowerCase().includes('mobile') || 
      p.type?.toLowerCase().includes('cell')
    );
    if (mobile) return mobile.sanitized_number;
    
    const work = phoneNumbers.find(p => 
      p.type?.toLowerCase().includes('work') || 
      p.type?.toLowerCase().includes('office')
    );
    if (work) return work.sanitized_number;
    
    // Return first available
    return phoneNumbers[0]?.sanitized_number || null;
  }

  /**
   * Enrich a single person with optimized strategy
   * Returns immediately with available data, tracks request for webhook updates
   */
  static async enrichPerson(
    apolloService: ApolloService,
    params: {
      id?: string;
      first_name?: string;
      last_name?: string;
      organization_name?: string;
      email?: string;
      domain?: string;
    },
    options: {
      userId?: string;
      contactId?: string; // Firestore contact ID for webhook updates
      waitForWebhook?: boolean; // Whether to wait for webhook (default: false for speed)
      webhookWaitTime?: number; // Max wait time in ms (default: 2000ms)
    } = {}
  ): Promise<{
    person: ApolloPerson | null;
    email: string | null;
    phone: string | null;
    phoneNumbers: Array<{ raw_number: string; sanitized_number: string; type: string }>;
    source: {
      email: 'api_response' | 'personal_emails' | 'webhook' | 'none';
      phone: 'api_response' | 'webhook' | 'none';
    };
    webhookPending: boolean;
  }> {
    const { waitForWebhook = false, webhookWaitTime = 2000, userId, contactId } = options;
    
    try {
      logger.info('🚀 [OPTIMIZED ENRICHMENT] Starting enrichment', {
        params,
        waitForWebhook,
        webhookWaitTime
      });

      // Use ApolloService.enrichPersonData() which already has all the correct logic
      // This method:
      // - Uses /people/match endpoint
      // - Sets reveal_personal_emails: true
      // - Sets reveal_phone_number: true with webhook_url
      // - Extracts emails from both email field and personal_emails array
      // - Waits for webhook phone numbers
      const person = await apolloService.enrichPersonData(params);

      if (!person) {
        logger.warn('⚠️ [OPTIMIZED ENRICHMENT] No person data in response');
        return {
          person: null,
          email: null,
          phone: null,
          phoneNumbers: [],
          source: { email: 'none', phone: 'none' },
          webhookPending: false
        };
      }

      const personId = person.id;
      const personName = person.name || `${person.first_name} ${person.last_name}`.trim();

      // Track enrichment request for webhook matching
      if (userId && personId) {
        enrichmentRequests.set(personId, {
          personId,
          personName,
          userId,
          contactId,
          timestamp: Date.now(),
          status: 'pending'
        });
        logger.info('📝 [OPTIMIZED ENRICHMENT] Tracked enrichment request', {
          personId,
          personName,
          userId,
          contactId
        });
      }

      // Extract email from person response using our smart extraction method
      // This checks both email field AND personal_emails array
      let email = this.extractEmail(person);
      let emailSource: 'api_response' | 'personal_emails' | 'webhook' | 'none' = 'none';

      if (email) {
        // Determine source
        if (person.personal_emails && Array.isArray(person.personal_emails) && person.personal_emails.includes(email)) {
          emailSource = 'personal_emails';
        } else if (person.email === email) {
          emailSource = 'api_response';
        } else {
          emailSource = 'api_response'; // Default
        }
      }

      logger.info('📧 [OPTIMIZED ENRICHMENT] Email extraction:', {
        personId,
        email: email || 'NONE',
        emailSource,
        rawEmailField: person.email || 'NONE',
        personalEmailsArray: person.personal_emails || [],
        hasPersonalEmails: !!(person.personal_emails && person.personal_emails.length > 0)
      });

      // Extract phone numbers
      let phoneNumbers = this.extractPhoneNumbers(person);
      let phoneSource: 'api_response' | 'webhook' | 'none' =
        phoneNumbers.length > 0 ? 'api_response' : 'none';

      // Get best phone number
      const phone = this.getBestPhoneNumber(phoneNumbers);

      logger.info('✅ [OPTIMIZED ENRICHMENT] Enrichment complete', {
        personId,
        personName,
        email: email || 'none',
        emailSource,
        phone: phone || 'none',
        phoneSource,
        phoneCount: phoneNumbers.length,
        rawEmailField: person.email || 'NONE',
        personalEmailsCount: person.personal_emails?.length || 0
      });

      return {
        person,
        email,
        phone,
        phoneNumbers,
        source: { email: emailSource, phone: phoneSource },
        webhookPending: phoneNumbers.length === 0
      };

    } catch (error: any) {
      logger.error('❌ [OPTIMIZED ENRICHMENT] Enrichment failed', {
        error: error.message,
        params
      });
      return {
        person: null,
        email: null,
        phone: null,
        phoneNumbers: [],
        source: { email: 'none', phone: 'none' },
        webhookPending: false
      };
    }
  }

  /**
   * Enrich multiple people in parallel
   * Returns immediately with available data
   */
  static async enrichPeopleParallel(
    apolloService: ApolloService,
    people: Array<{
      id?: string;
      first_name?: string;
      last_name?: string;
      organization_name?: string;
      email?: string;
      domain?: string;
    }>,
    options: {
      userId?: string;
      contactIds?: Map<string, string>; // Map personId -> contactId
      maxConcurrency?: number; // Max parallel requests (default: 5)
    } = {}
  ): Promise<Array<{
    original: any;
    enriched: {
      person: ApolloPerson | null;
      email: string | null;
      phone: string | null;
      phoneNumbers: Array<{ raw_number: string; sanitized_number: string; type: string }>;
      source: { email: 'api_response' | 'personal_emails' | 'webhook' | 'none'; phone: 'api_response' | 'webhook' | 'none' };
      webhookPending: boolean;
    };
  }>> {
    const { maxConcurrency = 5, userId, contactIds } = options;
    
    const results: Array<{
      original: any;
      enriched: any;
    }> = [];

    // Process in batches to respect rate limits
    for (let i = 0; i < people.length; i += maxConcurrency) {
      const batch = people.slice(i, i + maxConcurrency);
      
      const batchResults = await Promise.all(
        batch.map(async (person) => {
          const personId = person.id;
          const contactId = personId && contactIds ? contactIds.get(personId) : undefined;
          
          const enriched = await this.enrichPerson(
            apolloService,
            person,
            {
              userId,
              contactId,
              waitForWebhook: false // Don't wait for webhooks in parallel processing
            }
          );

          return {
            original: person,
            enriched
          };
        })
      );

      results.push(...batchResults);

      // Small delay between batches to respect rate limits
      if (i + maxConcurrency < people.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return results;
  }

  /**
   * Get enrichment request by person ID
   */
  static getEnrichmentRequest(personId: string): EnrichmentRequest | undefined {
    return enrichmentRequests.get(personId);
  }

  /**
   * Mark enrichment request as completed
   */
  static markEnrichmentCompleted(personId: string): void {
    const request = enrichmentRequests.get(personId);
    if (request) {
      request.status = 'completed';
      logger.info('✅ [OPTIMIZED ENRICHMENT] Marked enrichment as completed', { personId });
    }
  }
}

