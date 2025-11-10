import axios from 'axios';
import logger from '../utils/logger';
import { ApolloWebhookService } from './apolloWebhook.service';

export interface ApolloPerson {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  linkedin_url?: string;
  title?: string;
  email?: string;
  personal_emails?: string[]; // Personal emails array from Apollo when reveal_personal_emails is true
  phone_numbers?: Array<{
    raw_number: string;
    sanitized_number: string;
    type: string;
  }>;
  organization?: {
    id: string;
    name: string;
    website_url?: string;
    primary_domain?: string;
    industry?: string;
    annual_revenue?: number;
    employee_count?: number;
    short_description?: string;
    founded_year?: number;
    publicly_traded_symbol?: string;
    latest_funding_stage?: string;
    funding_total?: number;
    technologies?: string[];
    keywords?: string[];
    city?: string;
    state?: string;
    country?: string;
  };
  employment_history?: Array<{
    organization_name: string;
    title: string;
    start_date?: string;
    end_date?: string;
  }>;
  city?: string;
  state?: string;
  country?: string;
  photo_url?: string;
  twitter_url?: string;
  github_url?: string;
  facebook_url?: string;
  extrapolated_email_confidence?: number;

  // For internal scoring (added by our system, not Apollo)
  relevance_score?: number;
}

export interface ApolloSearchParams {
  first_name?: string;
  last_name?: string;
  organization_name?: string;
  email?: string;
  phone?: string;
  domain?: string;
  q_organization_domains?: string;
  q_organization_id?: string;
  person_titles?: string[];
  organization_locations?: string[];
  q_keywords?: string;
  page?: number;
  per_page?: number;

  // Advanced filters for better search accuracy
  technologies?: string[];
  organization_num_employees_ranges?: string[];
  funding_stage_list?: string[];
  revenue_range?: {
    min?: number;
    max?: number;
  };
  organization_industry_tag_ids?: string[];
  contact_email_status?: string[];
  prospected_by_current_team?: string[];
  organization_latest_funding_stage_cd?: string[];
  organization_publicly_traded_symbol?: null | string;
  currently_using_any_of_technology_uids?: string[];
  reveal_personal_emails?: boolean;
  reveal_phone_number?: boolean;
}

export interface ApolloSearchResponse {
  people: ApolloPerson[];
  pagination: {
    page: number;
    per_page: number;
    total_entries: number;
    total_pages: number;
  };
}

export class ApolloService {
  private apiKey?: string;
  private accessToken?: string;
  private baseUrl: string;
  private useOAuth: boolean;
  private webhookUrl?: string;

  constructor(apiKeyOrToken?: string, useOAuth: boolean = false, webhookUrl?: string) {
    this.baseUrl = 'https://api.apollo.io/api/v1';
    this.useOAuth = useOAuth;
    // Use provided webhook URL or generate default one
    this.webhookUrl = webhookUrl || process.env.APOLLO_WEBHOOK_URL || this.getDefaultWebhookUrl();

    if (useOAuth) {
      this.accessToken = apiKeyOrToken || undefined;
      if (!this.accessToken) {
        logger.warn('Apollo access token not provided. OAuth authentication required.');
      }
    } else {
      // Clean the API key of any whitespace
      this.apiKey = (apiKeyOrToken || process.env.APOLLO_API_KEY || '').trim();
      if (!this.apiKey) {
        logger.warn('Apollo API key not found. Set APOLLO_API_KEY environment variable.');
      }
    }
  }

  /**
   * Get default webhook URL for phone number reveals
   */
  private getDefaultWebhookUrl(): string {
    const baseUrl = process.env.BACKEND_URL || 
                   process.env.BASE_URL || 
                   `http://localhost:${process.env.PORT || 4001}`;
    
    // Remove trailing slash
    const cleanUrl = baseUrl.replace(/\/$/, '');
    
    return `${cleanUrl}/api/apollo/webhook/phone-numbers`;
  }

  /**
   * Get authentication headers for Apollo API requests
   */
  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    };

    if (this.useOAuth) {
      if (!this.accessToken) {
        throw new Error('Apollo access token not configured. OAuth authentication required.');
      }
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    } else {
      if (!this.apiKey) {
        throw new Error('Apollo API key not configured');
      }
      headers['X-Api-Key'] = this.apiKey;
    }

    return headers;
  }

  /**
   * Search for people using Apollo API
   * Note: Search endpoint does not return emails/phones directly - use enrichment API for that
   */
  async searchPeople(params: ApolloSearchParams): Promise<ApolloSearchResponse> {
    try {
      // Build search request
      const searchRequest: any = {
        ...params,
        reveal_personal_emails: true  // Enable email reveal for search (may return placeholder)
      };

      // If reveal_phone_number is requested, include webhook_url
      // Note: Search endpoint may not fully support phone reveals - enrichment is needed
      if (params.reveal_phone_number) {
        const webhookUrl = this.webhookUrl || this.getDefaultWebhookUrl();
        searchRequest.reveal_phone_number = true;
        searchRequest.webhook_url = webhookUrl;
        logger.info('Including webhook_url in search request for phone number reveal', {
          webhookUrl
        });
      }

      const response = await axios.post<ApolloSearchResponse>(
        `${this.baseUrl}/mixed_people/search`,
        searchRequest,
        {
          headers: this.getAuthHeaders()
        }
      );

      logger.info('Apollo search completed', {
        resultsCount: response.data.people.length,
        page: response.data.pagination.page,
        hasWebhookUrl: !!searchRequest.webhook_url
      });

      return response.data;
    } catch (error: any) {
      logger.error('Apollo search failed', {
        error: error.message,
        params
      });
      throw new Error(`Apollo search failed: ${error.message}`);
    }
  }

  /**
   * Search for people at a specific company using Apollo API
   * Use this when you only have company information (no person names)
   */
  async searchPeopleAtCompany(params: {
    organization_name?: string;
    domain?: string;
    person_titles?: string[];
    per_page?: number;
    reveal_phone_number?: boolean;
  }): Promise<ApolloPerson[]> {
    try {

      const searchParams: any = {
        reveal_personal_emails: true,
        per_page: params.per_page || 10
      };

      // If reveal_phone_number is requested, include webhook_url
      if (params.reveal_phone_number) {
        const webhookUrl = this.webhookUrl || this.getDefaultWebhookUrl();
        searchParams.reveal_phone_number = true;
        searchParams.webhook_url = webhookUrl;
        logger.info('Including webhook_url in company search for phone number reveal', {
          webhookUrl
        });
      }

      // Add organization filters
      if (params.organization_name) {
        searchParams.organization_names = [params.organization_name];
      }

      if (params.domain) {
        searchParams.q_organization_domains = params.domain;
      }

      if (params.person_titles && params.person_titles.length > 0) {
        searchParams.person_titles = params.person_titles;
      }

      logger.info('Searching for people at company', {
        organization: params.organization_name,
        domain: params.domain,
        searchParams
      });

      const response = await axios.post<ApolloSearchResponse>(
        `${this.baseUrl}/mixed_people/search`,
        searchParams,
        {
          headers: this.getAuthHeaders()
        }
      );

      logger.info('Apollo company search completed', {
        resultsCount: response.data.people.length,
        organization: params.organization_name,
        emailsFound: response.data.people.filter(p => p.email && p.email !== 'email_not_unlocked').length
      });

      return response.data.people || [];
    } catch (error: any) {
      logger.error('Apollo company search failed', {
        error: error.message,
        params
      });
      throw new Error(`Apollo company search failed: ${error.message}`);
    }
  }

  /**
   * Use Apollo Email Finder API to find/reveal emails
   */
  async findEmail(params: {
    first_name?: string;
    last_name?: string;
    organization_name?: string;
    domain?: string;
  }): Promise<{ email?: string; confidence?: number } | null> {
    try {
      logger.info('Using Apollo Email Finder API', params);

      const response = await axios.post<any>(
        `${this.baseUrl}/email_finder`,
        {
          first_name: params.first_name,
          last_name: params.last_name,
          domain: params.domain,
          organization_name: params.organization_name
        },
        {
          headers: this.getAuthHeaders()
        }
      );

      if (response.data && response.data.email) {
        logger.info('Apollo Email Finder successful', {
          email: response.data.email,
          confidence: response.data.confidence
        });

        return {
          email: response.data.email,
          confidence: response.data.confidence
        };
      }

      return null;
    } catch (error: any) {
      logger.error('Apollo Email Finder failed', {
        error: error.message,
        params,
        status: error.response?.status
      });
      return null;
    }
  }

  /**
   * Enrich a single person's data with email and phone number reveal
   */
  async enrichPerson(params: {
    first_name?: string;
    last_name?: string;
    organization_name?: string;
    email?: string;
    phone?: string;
    domain?: string;
  }): Promise<ApolloPerson | null> {
    try {
      const hasPersonData = params.first_name || params.last_name || params.email;
      const hasCompanyData = params.organization_name || params.domain;

      // STEP 1: Try the dedicated enrichment endpoint first (best for phone numbers)
      if (hasPersonData) {
        logger.info('STEP 1: Using people/enrich endpoint - has person data', {
          first_name: params.first_name,
          last_name: params.last_name,
          email: params.email
        });

        const enrichResult = await this.enrichPersonData({
          first_name: params.first_name,
          last_name: params.last_name,
          organization_name: params.organization_name,
          email: params.email,
          domain: params.domain
        });

        if (enrichResult) {
          logger.info('Apollo enrichment successful via people/enrich', {
            name: enrichResult.name,
            email: enrichResult.email,
            phoneCount: enrichResult.phone_numbers?.length || 0,
            website: enrichResult.organization?.website_url || 'none'
          });
          return enrichResult;
        } else {
          logger.info('Enrichment endpoint returned no data, trying fallback to match');
        }
      }

      // STEP 2: Fallback to people/match if enrichment didn't work
      if (hasPersonData) {
        logger.info('STEP 2: Using people/match endpoint as fallback', {
          first_name: params.first_name,
          last_name: params.last_name,
          email: params.email
        });

        const matchResult = await this.matchPersonWithEmailReveal(params);
        if (matchResult) {
          // Try to enrich the matched person to get phone numbers
          if (matchResult.id) {
            logger.info('Got match, now enriching with ID to get phone numbers');
            const enrichedMatch = await this.enrichPersonData({
              id: matchResult.id,
              first_name: matchResult.first_name,
              last_name: matchResult.last_name,
              organization_name: params.organization_name,
              domain: params.domain
            });

            if (enrichedMatch && (enrichedMatch.phone_numbers?.length || 0) > 0) {
              logger.info('Successfully enriched match with phone numbers');
              return enrichedMatch;
            }
          }

          // If we got a placeholder email, try the Email Finder API
          if (matchResult.email?.includes('email_not_unlocked') && params.first_name && params.last_name) {
            logger.info('Trying Email Finder API for email reveal');
            const emailResult = await this.findEmail({
              first_name: params.first_name,
              last_name: params.last_name,
              organization_name: params.organization_name,
              domain: params.domain
            });

            if (emailResult?.email) {
              matchResult.email = emailResult.email;
              logger.info('Email Finder API successful, updated email');
            }
          }

          logger.info('Apollo enrichment successful via people/match', {
            name: matchResult.name,
            email: matchResult.email,
            phoneCount: matchResult.phone_numbers?.length || 0,
            website: matchResult.organization?.website_url || 'none'
          });
          return matchResult;
        }
      }

      // STEP 3: We only have company data (no person identifiers) - use search then enrich
      if (!hasPersonData && hasCompanyData) {
        logger.info('STEP 3: Using search endpoint - company-only data', {
          organization_name: params.organization_name,
          domain: params.domain
        });

        const searchResults = await this.searchPeopleAtCompany({
          organization_name: params.organization_name,
          domain: params.domain,
          per_page: 1  // Just get the first contact
        });

        if (searchResults && searchResults.length > 0) {
          const firstContact = searchResults[0];

          // Now enrich this contact to get phone numbers
          if (firstContact.id || (firstContact.first_name && firstContact.last_name)) {
            logger.info('Found contact via search, now enriching to get phone numbers');
            const enrichedContact = await this.enrichPersonData({
              id: firstContact.id,
              first_name: firstContact.first_name,
              last_name: firstContact.last_name,
              organization_name: params.organization_name || firstContact.organization?.name,
              domain: params.domain || firstContact.organization?.primary_domain
            });

            if (enrichedContact) {
              logger.info('Successfully enriched search result with phone numbers');
              return enrichedContact;
            }
          }

          // If we got a placeholder email, try the Email Finder API
          if (firstContact.email?.includes('email_not_unlocked') && firstContact.first_name && firstContact.last_name) {
            logger.info('Trying Email Finder API for search result email reveal');
            const emailResult = await this.findEmail({
              first_name: firstContact.first_name,
              last_name: firstContact.last_name,
              organization_name: params.organization_name,
              domain: params.domain
            });

            if (emailResult?.email) {
              firstContact.email = emailResult.email;
              logger.info('Email Finder API successful for search result, updated email');
            }
          }

          logger.info('Apollo enrichment successful via search', {
            name: firstContact.name,
            email: firstContact.email,
            phoneCount: firstContact.phone_numbers?.length || 0,
            website: firstContact.organization?.website_url || 'none'
          });
          return firstContact;
        }
      }

      // If no match found anywhere
      logger.warn('Apollo enrichment failed - no match found', {
        params,
        hasPersonData,
        hasCompanyData
      });
      return null;
    } catch (error: any) {
      logger.error('Apollo person enrichment failed', {
        error: error.message,
        params
      });
      return null;
    }
  }

  /**
   * Enrich person data using Apollo's dedicated enrichment endpoint
   * This is the CORRECT endpoint for getting phone numbers and emails
   */
  async enrichPersonData(params: {
    first_name?: string;
    last_name?: string;
    organization_name?: string;
    email?: string;
    domain?: string;
    id?: string;
  }): Promise<ApolloPerson | null> {
    try {
      logger.info('🔍 Using Apollo People Enrichment endpoint for phone/email data', params);

      // Build enrichment request with available data
      const enrichRequest: any = {
        reveal_personal_emails: true
      };

      // Always use reveal_phone_number with webhook URL
      // If no webhook URL provided, use default one
      const webhookUrl = this.webhookUrl || this.getDefaultWebhookUrl();
      enrichRequest.reveal_phone_number = true;
      enrichRequest.webhook_url = webhookUrl;
      
      logger.info('Using webhook URL for phone number reveal', { 
        webhookUrl: webhookUrl,
        personId: params.id,
        personName: `${params.first_name} ${params.last_name}`
      });

      // Add available parameters
      if (params.id) enrichRequest.id = params.id;
      if (params.first_name) enrichRequest.first_name = params.first_name;
      if (params.last_name) enrichRequest.last_name = params.last_name;
      if (params.organization_name) enrichRequest.organization_name = params.organization_name;
      if (params.email) enrichRequest.email = params.email;
      if (params.domain) enrichRequest.domain = params.domain;

      const requestUrl = `${this.baseUrl}/people/match`;
      const requestHeaders = this.getAuthHeaders();
      
      console.log('📤 [APOLLO API] Making enrichment request:', {
        url: requestUrl,
        method: 'POST',
        headers: { ...requestHeaders, 'X-Api-Key': requestHeaders['X-Api-Key'] ? '[REDACTED]' : undefined, 'Authorization': requestHeaders['Authorization'] ? '[REDACTED]' : undefined },
        body: enrichRequest,
        person: `${params.first_name} ${params.last_name}`,
        company: params.organization_name,
        HAS_REVEAL_PERSONAL_EMAILS: !!enrichRequest.reveal_personal_emails,
        REVEAL_PERSONAL_EMAILS_VALUE: enrichRequest.reveal_personal_emails,
        HAS_REVEAL_PHONE_NUMBER: !!enrichRequest.reveal_phone_number,
        REVEAL_PHONE_NUMBER_VALUE: enrichRequest.reveal_phone_number,
        HAS_WEBHOOK_URL: !!enrichRequest.webhook_url,
        WEBHOOK_URL_VALUE: enrichRequest.webhook_url
      });

      console.log('🔍 [APOLLO API] FULL REQUEST BODY:', JSON.stringify(enrichRequest, null, 2));

      logger.info('📤 Enrichment API Request:', {
        endpoint: requestUrl,
        reveal_personal_emails: enrichRequest.reveal_personal_emails,
        reveal_phone_number: enrichRequest.reveal_phone_number,
        webhook_url: enrichRequest.webhook_url,
        person: `${params.first_name} ${params.last_name}`,
        company: params.organization_name
      });

      const response = await axios.post<any>(
        requestUrl,
        enrichRequest,
        {
          headers: requestHeaders
        }
      );

      console.log('📥 [APOLLO API] Response received:', {
        status: response.status,
        hasPerson: !!response.data?.person,
        personEmail: response.data?.person?.email || 'NONE',
        personPersonalEmails: response.data?.person?.personal_emails || [],
        phoneNumbers: response.data?.person?.phone_numbers || [],
        FULL_PERSON_OBJECT: JSON.stringify(response.data?.person, null, 2)
      });

      console.log('🔍 [APOLLO API] RAW RESPONSE DATA:', JSON.stringify(response.data, null, 2));

      logger.info('📥 Enrichment API Raw Response:', {
        status: response.status,
        hasPerson: !!response.data?.person,
        rawPhoneNumbers: response.data?.person?.phone_numbers,
        phoneNumbersLength: response.data?.person?.phone_numbers?.length || 0,
        fullResponse: JSON.stringify(response.data, null, 2)
      });

      if (response.data && response.data.person) {
        const person = response.data.person;
        const personId = person.id;

        // Extract email from person.email or personal_emails array
        // Apollo may return emails in personal_emails array when reveal_personal_emails is true
        console.log('📧 [EMAIL EXTRACTION] Starting email extraction:', {
          personEmailField: person.email || 'NONE',
          hasPersonalEmailsArray: !!(person.personal_emails && Array.isArray(person.personal_emails)),
          personalEmailsArrayLength: person.personal_emails?.length || 0,
          personalEmailsArray: person.personal_emails || []
        });

        let email = person.email;

        console.log('📧 [EMAIL EXTRACTION] Initial email from person.email field:', email || 'NONE');

        if (!email || email === 'email_not_unlocked' || email.includes('email_not_unlocked')) {
          console.log('📧 [EMAIL EXTRACTION] Email field is empty or placeholder, checking personal_emails array');

          // Try to get email from personal_emails array
          if (person.personal_emails && Array.isArray(person.personal_emails) && person.personal_emails.length > 0) {
            email = person.personal_emails[0];
            console.log('✅ [EMAIL EXTRACTION] Found email in personal_emails array:', {
              email,
              personalEmailsCount: person.personal_emails.length,
              allPersonalEmails: person.personal_emails
            });
            logger.info('Found email in personal_emails array', {
              email,
              personalEmailsCount: person.personal_emails.length
            });
          } else {
            console.log('❌ [EMAIL EXTRACTION] No emails found in personal_emails array');
          }
        } else {
          console.log('✅ [EMAIL EXTRACTION] Using email from person.email field:', email);
        }

        console.log('📧 [EMAIL EXTRACTION] Final extracted email:', email || 'NONE');

        // Check webhook store for phone numbers (Apollo sends them asynchronously via webhook)
        let phoneNumbers = person.phone_numbers || [];
        
        // Wait a bit for webhook to arrive (Apollo webhooks are usually fast)
        if (enrichRequest.reveal_phone_number && personId) {
          logger.info('Checking webhook store for phone numbers', { personId });
          
          // Try multiple times with delays (webhook might arrive after API response)
          // Apollo webhooks can take 1-5 seconds to arrive
          for (let attempt = 0; attempt < 10; attempt++) {
            const webhookPhones = ApolloWebhookService.getPhoneNumbersByPersonId(personId);
            if (webhookPhones && webhookPhones.length > 0) {
              phoneNumbers = webhookPhones;
              logger.info('✅ Found phone numbers from webhook!', {
                personId,
                phoneCount: webhookPhones.length,
                attempt: attempt + 1,
                waitTime: `${attempt * 500}ms`
              });
              break;
            }
            
            // Wait 500ms between attempts (total max wait: 4.5 seconds)
            if (attempt < 9) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          if (phoneNumbers.length === 0) {
            logger.info('No phone numbers found in webhook store yet (may arrive later)', {
              personId,
              webhookUrl: enrichRequest.webhook_url
            });
          }
        }

        // Transform the response to match our ApolloPerson interface
        console.log('🏗️ [BUILD PERSON] Building enrichedPerson object with email:', email || 'NONE');

        const enrichedPerson: ApolloPerson = {
          id: person.id,
          first_name: person.first_name,
          last_name: person.last_name,
          name: person.name,
          linkedin_url: person.linkedin_url,
          title: person.title,
          email: email, // Use extracted email (from email field or personal_emails array)
          phone_numbers: phoneNumbers,
          organization: person.organization,
          employment_history: person.employment_history || [],
          city: person.city,
          state: person.state,
          country: person.country,
          photo_url: person.photo_url,
          twitter_url: person.twitter_url,
          github_url: person.github_url,
          facebook_url: person.facebook_url
        };

        console.log('🏗️ [BUILD PERSON] enrichedPerson object built:', {
          id: enrichedPerson.id,
          name: enrichedPerson.name,
          email: enrichedPerson.email || 'NONE',
          title: enrichedPerson.title || 'none',
          phoneCount: enrichedPerson.phone_numbers?.length || 0
        });

        logger.info('✅ Apollo enrichment endpoint successful', {
          name: person.name,
          email: email || 'NONE',
          emailSource: person.email ? 'email_field' : (person.personal_emails ? 'personal_emails_array' : 'none'),
          personalEmails: person.personal_emails || [],
          phoneCount: phoneNumbers.length,
          firstPhone: phoneNumbers[0]?.sanitized_number || 'NONE RETURNED',
          allPhoneNumbers: phoneNumbers,
          website: person.organization?.website_url || 'none',
          phonesFromWebhook: phoneNumbers.length > 0 && !person.phone_numbers?.length
        });

        if (phoneNumbers.length === 0) {
          logger.warn('⚠️ Enrichment succeeded but NO PHONE NUMBERS found (checked webhook store)', {
            name: person.name,
            company: person.organization?.name,
            personId,
            webhookUrl: enrichRequest.webhook_url
          });
        }

        return enrichedPerson;
      }

      logger.warn('⚠️ Enrichment API returned no person data', {
        responseData: response.data,
        params
      });
      return null;
    } catch (error: any) {
      logger.error('❌ Apollo people enrichment failed', {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        requestUrl: `${this.baseUrl}/people/match`,
        requestParams: params,
        stack: error.stack
      });
      
      // Log the full error for debugging
      console.error('Apollo enrichment error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: `${this.baseUrl}/people/match`
      });
      
      return null;
    }
  }

  /**
   * Match person with email reveal using /people/match endpoint
   */
  async matchPersonWithEmailReveal(params: {
    first_name?: string;
    last_name?: string;
    organization_name?: string;
    email?: string;
    phone?: string;
    domain?: string;
  }): Promise<ApolloPerson | null> {
    try {

      // Build match request with available data
      const matchRequest: any = {
        reveal_personal_emails: true
      };

      // Add webhook URL for phone number reveal
      const webhookUrl = this.webhookUrl || this.getDefaultWebhookUrl();
      matchRequest.reveal_phone_number = true;
      matchRequest.webhook_url = webhookUrl;
      
      logger.info('Using webhook URL for phone number reveal in match', { 
        webhookUrl: webhookUrl
      });

      // Add available parameters
      if (params.first_name) matchRequest.first_name = params.first_name;
      if (params.last_name) matchRequest.last_name = params.last_name;
      if (params.organization_name) matchRequest.organization_name = params.organization_name;
      if (params.email) matchRequest.email = params.email;
      if (params.phone) matchRequest.phone = params.phone;
      if (params.domain) matchRequest.domain = params.domain;

      // If we don't have first_name/last_name but have organization, try to find someone at that org
      if (!params.first_name && !params.last_name && params.organization_name) {
        matchRequest.organization_name = params.organization_name;
        matchRequest.q_organization_domains = params.domain;
      }

      const response = await axios.post<any>(
        `${this.baseUrl}/people/match`,
        matchRequest,
        {
          headers: this.getAuthHeaders()
        }
      );

      if (response.data && response.data.person) {
        const person = response.data.person;
        const personId = person.id;

        // Extract email from person.email or personal_emails array
        let email = person.email;
        if (!email || email === 'email_not_unlocked' || email.includes('email_not_unlocked')) {
          // Try to get email from personal_emails array
          if (person.personal_emails && Array.isArray(person.personal_emails) && person.personal_emails.length > 0) {
            email = person.personal_emails[0];
            logger.info('Found email in personal_emails array (match)', {
              email,
              personalEmailsCount: person.personal_emails.length
            });
          }
        }

        // Check webhook store for phone numbers
        let phoneNumbers = person.phone_numbers || [];
        
        if (matchRequest.reveal_phone_number && personId) {
          logger.info('Checking webhook store for phone numbers in match', { personId });
          
          // Try multiple times with delays (Apollo webhooks can take 1-5 seconds)
          for (let attempt = 0; attempt < 10; attempt++) {
            const webhookPhones = ApolloWebhookService.getPhoneNumbersByPersonId(personId);
            if (webhookPhones && webhookPhones.length > 0) {
              phoneNumbers = webhookPhones;
              logger.info('✅ Found phone numbers from webhook in match!', {
                personId,
                phoneCount: webhookPhones.length,
                attempt: attempt + 1,
                waitTime: `${attempt * 500}ms`
              });
              break;
            }
            
            if (attempt < 9) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
          
          if (phoneNumbers.length === 0) {
            logger.info('No phone numbers found in webhook store yet (may arrive later)', {
              personId,
              webhookUrl: matchRequest.webhook_url
            });
          }
        }

        // Transform the response to match our ApolloPerson interface
        const enrichedPerson: ApolloPerson = {
          id: person.id,
          first_name: person.first_name,
          last_name: person.last_name,
          name: person.name,
          linkedin_url: person.linkedin_url,
          title: person.title,
          email: email, // Use extracted email (from email field or personal_emails array)
          phone_numbers: phoneNumbers,
          organization: person.organization,
          employment_history: person.employment_history || [],
          city: person.city,
          state: person.state,
          country: person.country,
          photo_url: person.photo_url,
          twitter_url: person.twitter_url,
          github_url: person.github_url,
          facebook_url: person.facebook_url
        };

        logger.info('Apollo person match successful with email reveal', {
          name: person.name,
          email: email || 'NONE',
          emailSource: person.email ? 'email_field' : (person.personal_emails ? 'personal_emails_array' : 'none'),
          personalEmails: person.personal_emails || [],
          phoneNumbers: phoneNumbers,
          phoneCount: phoneNumbers.length,
          phonesFromWebhook: phoneNumbers.length > 0 && !person.phone_numbers?.length
        });

        return enrichedPerson;
      }

      return null;
    } catch (error: any) {
      logger.error('Apollo person match failed', {
        error: error.message,
        params
      });
      return null;
    }
  }

  /**
   * Bulk enrich multiple people using Apollo's Bulk Enrichment endpoint
   * More efficient than individual enrichment calls for multiple people
   */
  async bulkEnrichPeople(peopleData: Array<{
    first_name?: string;
    last_name?: string;
    organization_name?: string;
    email?: string;
    domain?: string;
    id?: string;
  }>): Promise<Array<{
    original: any;
    enriched: ApolloPerson | null;
    error?: string;
  }>> {
    try {
      logger.info('Using Apollo Bulk People Enrichment endpoint', { count: peopleData.length });

      // Prepare bulk enrichment request
      const webhookUrl = this.webhookUrl || this.getDefaultWebhookUrl();
      const details = peopleData.map(person => {
        const detail: any = {
          reveal_personal_emails: true,
          reveal_phone_number: true,
          webhook_url: webhookUrl
        };

        if (person.id) detail.id = person.id;
        if (person.first_name) detail.first_name = person.first_name;
        if (person.last_name) detail.last_name = person.last_name;
        if (person.organization_name) detail.organization_name = person.organization_name;
        if (person.email) detail.email = person.email;
        if (person.domain) detail.domain = person.domain;

        return detail;
      });

      logger.info('Bulk enrichment request prepared', {
        count: details.length,
        webhookUrl
      });

      const response = await axios.post<any>(
        `${this.baseUrl}/people/bulk_match`,
        { details },
        {
          headers: this.getAuthHeaders()
        }
      );

      const matches = response.data?.matches || [];

      // Map results back to original format
      const results = await Promise.all(peopleData.map(async (original, index) => {
        const match = matches[index];

        if (match && match.person) {
          const person = match.person;
          const personId = person.id;

          // Extract email from person.email or personal_emails array
          let email = person.email;
          if (!email || email === 'email_not_unlocked' || email.includes('email_not_unlocked')) {
            // Try to get email from personal_emails array
            if (person.personal_emails && Array.isArray(person.personal_emails) && person.personal_emails.length > 0) {
              email = person.personal_emails[0];
              logger.info('Found email in personal_emails array (bulk)', {
                email,
                personalEmailsCount: person.personal_emails.length
              });
            }
          }

          // Check webhook store for phone numbers (Apollo sends them asynchronously via webhook)
          let phoneNumbers = person.phone_numbers || [];
          
          if (personId) {
            logger.info('Checking webhook store for phone numbers in bulk enrichment', { personId });
            
            // Try multiple times with delays (webhook might arrive after API response)
            for (let attempt = 0; attempt < 10; attempt++) {
              const webhookPhones = ApolloWebhookService.getPhoneNumbersByPersonId(personId);
              if (webhookPhones && webhookPhones.length > 0) {
                phoneNumbers = webhookPhones;
                logger.info('✅ Found phone numbers from webhook in bulk enrichment!', {
                  personId,
                  phoneCount: webhookPhones.length,
                  attempt: attempt + 1
                });
                break;
              }
              
              // Wait 500ms between attempts (total max wait: 4.5 seconds)
              if (attempt < 9) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }
          }

          const enrichedPerson: ApolloPerson = {
            id: person.id,
            first_name: person.first_name,
            last_name: person.last_name,
            name: person.name,
            linkedin_url: person.linkedin_url,
            title: person.title,
            email: email, // Use extracted email (from email field or personal_emails array)
            phone_numbers: phoneNumbers,
            organization: person.organization,
            employment_history: person.employment_history || [],
            city: person.city,
            state: person.state,
            country: person.country,
            photo_url: person.photo_url,
            twitter_url: person.twitter_url,
            github_url: person.github_url,
            facebook_url: person.facebook_url
          };

          return {
            original,
            enriched: enrichedPerson,
            error: undefined
          };
        }

        return {
          original,
          enriched: null,
          error: 'No matching person found'
        };
      }));

      logger.info('Bulk enrichment completed', {
        total: peopleData.length,
        successful: results.filter(r => r.enriched).length,
        withPhones: results.filter(r => r.enriched?.phone_numbers && r.enriched.phone_numbers.length > 0).length
      });

      return results;
    } catch (error: any) {
      logger.error('Bulk enrichment failed, falling back to individual enrichment', {
        error: error.message,
        status: error.response?.status
      });

      // Fallback to individual enrichment if bulk fails
      return this.batchEnrichPeople(peopleData);
    }
  }

  /**
   * Batch enrich multiple people (individual calls)
   * Use bulkEnrichPeople for better performance with multiple people
   */
  async batchEnrichPeople(peopleData: Array<{
    first_name?: string;
    last_name?: string;
    organization_name?: string;
    email?: string;
    phone?: string;
    domain?: string;
  }>): Promise<Array<{
    original: any;
    enriched: ApolloPerson | null;
    error?: string;
  }>> {
    const results: any[] = [];

    for (const person of peopleData) {
      try {
        const enriched = await this.enrichPerson(person);
        results.push({
          original: person,
          enriched,
          error: enriched ? undefined : 'No matching person found'
        });

        // Add delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        results.push({
          original: person,
          enriched: null,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Get organization information
   */
  async getOrganization(domain: string): Promise<any> {
    try {
      const response = await axios.get<any>(`${this.baseUrl}/organizations`, {
        params: {
          q_organization_domains: domain
        },
        headers: this.getAuthHeaders()
      });

      return response.data;
    } catch (error: any) {
      logger.error('Apollo organization lookup failed', {
        error: error.message,
        domain
      });
      throw new Error(`Organization lookup failed: ${error.message}`);
    }
  }

  /**
   * Enrich organization data using Apollo Organization Enrichment API
   */
  async enrichOrganization(domain: string): Promise<{
    success: boolean;
    organization?: any;
    error?: string;
  }> {
    try {
      logger.info('Apollo: Enriching organization', { domain });

      const response = await axios.post<any>(
        `${this.baseUrl}/organizations/enrich`,
        {
          domain: domain
        },
        {
          headers: this.getAuthHeaders()
        }
      );

      if (response.data && response.data.organization) {
        const org = response.data.organization;
        
        logger.info('Apollo: Organization enrichment successful', {
          domain,
          name: org.name,
          website: org.website_url,
          industry: org.industry,
          employeeCount: org.estimated_num_employees
        });

        return {
          success: true,
          organization: {
            name: org.name,
            domain: org.website_url || domain,
            website: org.website_url,
            industry: org.industry,
            estimated_num_employees: org.estimated_num_employees,
            short_description: org.short_description,
            headquarters_address_line_1: org.headquarters_address_line_1,
            phone: org.phone,
            email: org.email,
            linkedin_url: org.linkedin_url,
            twitter_url: org.twitter_url,
            facebook_url: org.facebook_url,
            annual_revenue: org.annual_revenue,
            founded_year: org.founded_year,
            technologies: org.technologies,
            keywords: org.keywords,
            account_id: org.account_id,
            account: org.account
          }
        };
      }

      return {
        success: false,
        error: 'No organization data found'
      };
    } catch (error: any) {
      logger.error('Apollo: Organization enrichment failed', {
        domain,
        error: error.message,
        status: error.response?.status
      });

      return {
        success: false,
        error: error.message || 'Apollo API error'
      };
    }
  }

  /**
   * Check API key validity - Simple validation
   */
  async validateApiKey(): Promise<boolean> {
    try {
      if (this.useOAuth) {
        if (!this.accessToken) {
          logger.error('Apollo access token is not provided');
          return false;
        }
        logger.info('Validating Apollo access token');
      } else {
        if (!this.apiKey) {
          logger.error('Apollo API key is not provided');
          return false;
        }
        logger.info('Validating Apollo API key', {
          keyLength: this.apiKey.length,
          keyPrefix: this.apiKey.substring(0, 8) + '...'
        });
      }

      const authHeaders = this.getAuthHeaders();
      logger.info('Making validation request to Apollo', {
        url: `${this.baseUrl}/mixed_people/search`,
        headers: { ...authHeaders, 'X-Api-Key': authHeaders['X-Api-Key'] ? '[API_KEY]' : undefined },
        useOAuth: this.useOAuth
      });

      // Try multiple validation endpoints
      let response;
      try {
        // First try with organizations search (simpler endpoint)
        response = await axios.post<any>(
          `${this.baseUrl}/organizations/search`,
          { per_page: 1 },
          {
            headers: authHeaders,
            timeout: 15000
          }
        );
      } catch (firstError: any) {
        logger.info('Organizations search failed, trying mixed_people/search', {
          status: firstError.response?.status,
          error: firstError.message
        });

        // Fallback to original endpoint
        response = await axios.post<any>(
          `${this.baseUrl}/mixed_people/search`,
          { per_page: 1 },
          {
            headers: authHeaders,
            timeout: 15000
          }
        );
      }

      logger.info('Apollo validation response received', {
        status: response.status,
        dataLength: JSON.stringify(response.data).length
      });

      // If we get a 200 response, the key/token is valid
      if (response.status === 200) {
        logger.info(this.useOAuth ? 'Apollo access token validation successful' : 'Apollo API key validation successful');

        // Test if enrichment endpoint is accessible (this checks phone number permissions)
        try {
          logger.info('Testing enrichment endpoint access for phone number permissions...');
          const testEnrichment = await axios.post<any>(
            `${this.baseUrl}/people/match`,
            {
              id: 'test',
              reveal_personal_emails: true,
              reveal_phone_number: true
            },
            {
              headers: authHeaders,
              timeout: 10000,
              validateStatus: (status) => status < 500 // Accept 400s as valid response
            }
          );

          logger.info('Enrichment endpoint test result:', {
            status: testEnrichment.status,
            hasPhoneAccess: testEnrichment.status !== 403 && testEnrichment.status !== 402,
            message: testEnrichment.data?.message || 'OK'
          });

          if (testEnrichment.status === 402 || testEnrichment.status === 403) {
            logger.warn('⚠️ PHONE NUMBER ACCESS MAY BE RESTRICTED', {
              status: testEnrichment.status,
              message: testEnrichment.data?.message,
              note: 'Your Apollo plan may not include phone number access. Phone numbers will not be available.'
            });
          }
        } catch (enrichError: any) {
          logger.warn('Could not test enrichment endpoint', {
            error: enrichError.message,
            note: 'Phone number access status unknown'
          });
        }

        return true;
      }

      logger.warn(this.useOAuth ? 'Apollo access token validation failed - unexpected response' : 'Apollo API key validation failed - unexpected response', {
        status: response.status,
        statusText: response.statusText
      });
      return false;
    } catch (error: any) {
      const responseData = error.response?.data;

      // Check for specific Apollo error messages
      if (responseData?.message?.includes('payment')) {
        logger.error('Apollo API key validation failed - Payment issue', {
          error: error.message,
          status: error.response?.status,
          apolloMessage: responseData.message
        });
      } else {
        logger.error(this.useOAuth ? 'Apollo access token validation failed' : 'Apollo API key validation failed', {
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: responseData
        });
      }

      return false;
    }
  }

  /**
   * Search for organizations using Apollo Organization Search API
   */
  async searchOrganizations(params: any): Promise<any[]> {
    try {
      logger.info('Searching organizations with Apollo', { params });

      const response = await axios.post<any>(`${this.baseUrl}/organizations/search`, {
        ...params
      }, {
        headers: this.getAuthHeaders(),
        timeout: 30000
      });

      if (response.data && response.data.organizations) {
        logger.info('Organization search successful', {
          totalFound: response.data.organizations.length,
          pagination: response.data.pagination
        });
        return response.data.organizations;
      }

      return [];
    } catch (error: any) {
      logger.error('Organization search failed', {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw error;
    }
  }

  /**
   * Get detailed organization information
   */
  async getOrganizationDetails(organizationId: string): Promise<any> {
    try {
      logger.info('Getting organization details', { organizationId });

      const response = await axios.get<any>(`${this.baseUrl}/organizations/${organizationId}`, {
        headers: this.getAuthHeaders(),
        timeout: 15000
      });

      if (response.data && response.data.organization) {
        logger.info('Organization details retrieved', {
          orgId: organizationId,
          orgName: response.data.organization.name
        });
        return response.data.organization;
      }

      return null;
    } catch (error: any) {
      logger.error('Failed to get organization details', {
        organizationId,
        error: error.message,
        status: error.response?.status
      });
      return null;
    }
  }

}

export default ApolloService;
