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
}

export interface ApolloSearchParams {
  first_name?: string;
  last_name?: string;
  organization_name?: string;
  email?: string;
  phone?: string;
  domain?: string;
  q_organization_domains?: string;
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
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.APOLLO_API_KEY || '';
    this.baseUrl = 'https://api.apollo.io/v1';

    if (!this.apiKey) {
      logger.warn('Apollo API key not found. Set APOLLO_API_KEY environment variable.');
    }
  }

  /**
   * Search for people using Apollo API
   */
  async searchPeople(params: ApolloSearchParams): Promise<ApolloSearchResponse> {
    try {
      if (!this.apiKey) {
        throw new Error('Apollo API key not configured');
      }

      const response: AxiosResponse<ApolloSearchResponse> = await axios.post(
        `${this.baseUrl}/mixed_people/search`,
        {
          ...params
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': this.apiKey,
            'Cache-Control': 'no-cache'
          }
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
      // First try the people/match endpoint for email reveals
      if (params.first_name && params.last_name) {
        const matchResult = await this.matchPersonWithEmailReveal(params);
        if (matchResult) {
          return matchResult;
        }
      }

      // Fallback to search if match fails
      const searchResults = await this.searchPeople({
        ...params,
        per_page: 1
      });

      if (searchResults.people.length > 0) {
        return searchResults.people[0];
      }

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
      if (!this.apiKey) {
        throw new Error('Apollo API key not configured');
      }

      const response: AxiosResponse = await axios.post(
        `${this.baseUrl}/people/match`,
        {
          first_name: params.first_name,
          last_name: params.last_name,
          organization_name: params.organization_name,
          email: params.email,
          reveal_personal_emails: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': this.apiKey,
            'Cache-Control': 'no-cache'
          }
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
      if (!this.apiKey) {
        throw new Error('Apollo API key not configured');
      }

      const response = await axios.get(`${this.baseUrl}/organizations`, {
        params: {
          q_organization_domains: domain
        },
        headers: {
          'X-Api-Key': this.apiKey,
          'Content-Type': 'application/json'
        }
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
   * Check API key validity
   */
  async validateApiKey(): Promise<boolean> {
    try {
      if (!this.apiKey) {
        logger.error('Apollo API key is not provided');
        return false;
      }

      // First try the /me endpoint which is most reliable for validation
      try {
        const meResponse = await axios.get(
          `${this.baseUrl}/me`,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': this.apiKey,
              'Cache-Control': 'no-cache'
            }
          }
        );

        if (meResponse.data && meResponse.status === 200) {
          logger.info('Apollo API key validation successful via /me endpoint', {
            user: meResponse.data.user?.email || 'Unknown',
            plan: meResponse.data.user?.plan || 'Unknown'
          });
          return true;
        }
      } catch (meError: any) {
        logger.warn('Apollo /me endpoint failed, trying fallback validation', {
          error: meError.message,
          status: meError.response?.status
        });

        // Fallback: Try a simple search with minimal parameters
        try {
          const searchResponse = await axios.post(
            `${this.baseUrl}/mixed_people/search`,
            {
              per_page: 1
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'X-Api-Key': this.apiKey,
                'Cache-Control': 'no-cache'
              }
            }
          );

          if (searchResponse.data && searchResponse.status === 200) {
            logger.info('Apollo API key validation successful via fallback search');
            return true;
          }
        } catch (searchError: any) {
          logger.error('Apollo fallback validation also failed', {
            searchError: searchError.message,
            searchStatus: searchError.response?.status
          });
        }
      }
      
      return false;
    } catch (error: any) {
      // Check for specific error types
      if (error.response?.status === 401) {
        logger.error('Apollo API key is invalid or not activated', {
          error: 'Invalid access credentials',
          status: 401,
          message: 'Please check your Apollo dashboard to activate the API key and verify permissions',
          apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'Not provided'
        });
      } else if (error.response?.status === 403) {
        logger.error('Apollo API key lacks permissions', {
          error: 'Forbidden',
          status: 403,
          message: 'API key does not have the required permissions for this operation',
          apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'Not provided'
        });
      } else if (error.response?.status === 422) {
        logger.error('Apollo API request parameters invalid', {
          error: 'Unprocessable Entity',
          status: 422,
          message: 'Request parameters are invalid or missing',
          apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'Not provided'
        });
      } else if (error.response?.status === 429) {
        logger.error('Apollo API rate limit exceeded', {
          error: 'Rate limit exceeded',
          status: 429,
          message: 'API rate limit has been exceeded. Please try again later.',
          apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'Not provided'
        });
      } else {
        logger.error('Apollo API key validation failed', { 
          error: error.message,
          status: error.response?.status,
          data: error.response?.data,
          apiKey: this.apiKey ? `${this.apiKey.substring(0, 8)}...` : 'Not provided'
        });
      }
      
      return false;
    }
  }

}

export default ApolloService;
