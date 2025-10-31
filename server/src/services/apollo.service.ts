import axios, { AxiosResponse } from 'axios';
import logger from '../utils/logger';

export interface ApolloPerson {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  linkedin_url?: string;
  title?: string;
  email?: string;
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
  page?: number;
  per_page?: number;
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

  constructor(apiKeyOrToken?: string, useOAuth: boolean = false) {
    this.baseUrl = 'https://api.apollo.io/v1';
    this.useOAuth = useOAuth;

    if (useOAuth) {
      this.accessToken = apiKeyOrToken || undefined;
      if (!this.accessToken) {
        logger.warn('Apollo access token not provided. OAuth authentication required.');
      }
    } else {
      this.apiKey = apiKeyOrToken || process.env.APOLLO_API_KEY || '';
      if (!this.apiKey) {
        logger.warn('Apollo API key not found. Set APOLLO_API_KEY environment variable.');
      }
    }
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
   */
  async searchPeople(params: ApolloSearchParams): Promise<ApolloSearchResponse> {
    try {
      const response: AxiosResponse<ApolloSearchResponse> = await axios.post(
        `${this.baseUrl}/mixed_people/search`,
        {
          ...params,
          reveal_personal_emails: true  // Enable email reveal for search
        },
        {
          headers: this.getAuthHeaders()
        }
      );

      logger.info('Apollo search completed', {
        resultsCount: response.data.people.length,
        page: response.data.pagination.page
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
  }): Promise<ApolloPerson[]> {
    try {

      const searchParams: any = {
        reveal_personal_emails: true,
        per_page: params.per_page || 10
      };

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

      const response: AxiosResponse<ApolloSearchResponse> = await axios.post(
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

      const response = await axios.post(
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
   * Enrich a single person's data with email reveal
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

      // CASE 1: We have person identifiers (name or email) - use people/match
      if (hasPersonData) {
        logger.info('Using people/match endpoint - has person data', {
          first_name: params.first_name,
          last_name: params.last_name,
          email: params.email
        });

        const matchResult = await this.matchPersonWithEmailReveal(params);
        if (matchResult) {
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
            hasEmail: !!matchResult.email,
            emailUnlocked: matchResult.email !== 'email_not_unlocked'
          });
          return matchResult;
        }
      }

      // CASE 2: We only have company data (no person identifiers) - use search
      if (!hasPersonData && hasCompanyData) {
        logger.info('Using search endpoint - company-only data', {
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
            hasEmail: !!firstContact.email,
            emailUnlocked: firstContact.email !== 'email_not_unlocked',
            company: params.organization_name
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

      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/people/match`,
        matchRequest,
        {
          headers: this.getAuthHeaders()
        }
      );

      if (response.data && response.data.person) {
        const person = response.data.person;

        // Transform the response to match our ApolloPerson interface
        const enrichedPerson: ApolloPerson = {
          id: person.id,
          first_name: person.first_name,
          last_name: person.last_name,
          name: person.name,
          linkedin_url: person.linkedin_url,
          title: person.title,
          email: person.email, // This should now be the real email
          phone_numbers: person.phone_numbers || [],
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
          email: person.email,
          personalEmails: person.personal_emails
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
   * Batch enrich multiple people
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
    const results = [];
    
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
      const response = await axios.get(`${this.baseUrl}/organizations`, {
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

      const response = await axios.post(
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

        logger.info('Validating Apollo API key');
      }

      // Make a minimal test request
      const response = await axios.post(
        `${this.baseUrl}/mixed_people/search`,
        { per_page: 1 },
        {
          headers: this.getAuthHeaders(),
          timeout: 10000
        }
      );

      // If we get a 200 response, the key/token is valid
      if (response.status === 200) {
        logger.info(this.useOAuth ? 'Apollo access token validation successful' : 'Apollo API key validation successful');
        return true;
      }

      logger.warn(this.useOAuth ? 'Apollo access token validation failed - unexpected response' : 'Apollo API key validation failed - unexpected response');
      return false;
    } catch (error: any) {
      logger.error(this.useOAuth ? 'Apollo access token validation failed' : 'Apollo API key validation failed', {
        error: error.message,
        status: error.response?.status
      });
      return false;
    }
  }

  /**
   * Search for organizations using Apollo Organization Search API
   */
  async searchOrganizations(params: any): Promise<any[]> {
    try {
      logger.info('Searching organizations with Apollo', { params });

      const response = await axios.post(`${this.baseUrl}/organizations/search`, {
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

      const response = await axios.get(`${this.baseUrl}/organizations/${organizationId}`, {
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
