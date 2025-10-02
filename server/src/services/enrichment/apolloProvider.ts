import axios, { AxiosInstance } from 'axios';
import { EnrichmentProvider, EnrichmentResult, CompanyData, ContactData } from './types';
import logger from '../../utils/logger';

export class ApolloProvider implements EnrichmentProvider {
  private client: AxiosInstance;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = axios.create({
      baseURL: 'https://api.apollo.io/v1',
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
      },
      timeout: 30000,
    });
  }

  async enrichCompany(domain: string): Promise<EnrichmentResult> {
    try {
      logger.info('Apollo: Enriching company', { domain });

      const response = await this.client.post('/organizations/enrich', {
        domain: domain,
      });

      if (response.data && response.data.organization) {
        const org = response.data.organization;

        const companyData: CompanyData = {
          name: org.name || '',
          domain: org.website_url || domain,
          website: org.website_url || '',
          industry: org.industry || '',
          employeeCount: org.estimated_num_employees || undefined,
          description: org.short_description || '',
          headquarters: org.headquarters_address_line_1 || '',
          phone: org.phone || '',
        };

        logger.info('Apollo: Company enrichment successful', {
          domain,
          foundData: Object.keys(companyData).filter(key => companyData[key as keyof CompanyData])
        });

        return {
          company: companyData,
          success: true,
          source: 'Apollo',
        };
      }

      return {
        success: false,
        error: 'No organization data found',
        source: 'Apollo',
      };
    } catch (error: any) {
      logger.error('Apollo: Company enrichment failed', { domain, error: error.message });

      return {
        success: false,
        error: error.message || 'Apollo API error',
        source: 'Apollo',
      };
    }
  }

  async enrichContact(name: string, company: string, domain?: string): Promise<EnrichmentResult> {
    try {
      logger.info('Apollo: Enriching contact', { name, company, domain });

      const searchParams: any = {
        q_keywords: name,
        person_titles: [],
        q_organization_domains: domain ? [domain] : [],
        page: 1,
        per_page: 10,
      };

      if (company && !domain) {
        searchParams.organization_names = [company];
      }

      const response = await this.client.post('/mixed_people/search', searchParams);

      if (response.data && response.data.people && response.data.people.length > 0) {
        const contacts: ContactData[] = response.data.people.map((person: any) => ({
          name: person.name || '',
          email: person.email || '',
          phone: person.sanitized_phone || person.phone || '',
          title: person.title || '',
          linkedinUrl: person.linkedin_url || '',
          company: person.organization?.name || company,
          companyDomain: person.organization?.website_url || domain || '',
        }));

        logger.info('Apollo: Contact enrichment successful', {
          name,
          company,
          foundContacts: contacts.length
        });

        return {
          contacts,
          success: true,
          source: 'Apollo',
        };
      }

      return {
        success: false,
        error: 'No contacts found',
        source: 'Apollo',
      };
    } catch (error: any) {
      logger.error('Apollo: Contact enrichment failed', { name, company, error: error.message });

      return {
        success: false,
        error: error.message || 'Apollo API error',
        source: 'Apollo',
      };
    }
  }

  async searchContacts(company: string, domain?: string, limit: number = 5): Promise<EnrichmentResult> {
    try {
      logger.info('Apollo: Searching contacts for company', { company, domain, limit });

      const searchParams: any = {
        page: 1,
        per_page: limit,
        person_titles: ['CEO', 'CTO', 'CFO', 'COO', 'President', 'Vice President', 'Director', 'Manager'],
        q_organization_domains: domain ? [domain] : [],
      };

      if (company && !domain) {
        searchParams.organization_names = [company];
      }

      const response = await this.client.post('/mixed_people/search', searchParams);

      if (response.data && response.data.people && response.data.people.length > 0) {
        const contacts: ContactData[] = response.data.people.map((person: any) => ({
          name: person.name || '',
          email: person.email || '',
          phone: person.sanitized_phone || person.phone || '',
          title: person.title || '',
          linkedinUrl: person.linkedin_url || '',
          company: person.organization?.name || company,
          companyDomain: person.organization?.website_url || domain || '',
        }));

        logger.info('Apollo: Contact search successful', {
          company,
          foundContacts: contacts.length
        });

        return {
          contacts,
          success: true,
          source: 'Apollo',
        };
      }

      return {
        success: false,
        error: 'No contacts found for company',
        source: 'Apollo',
      };
    } catch (error: any) {
      logger.error('Apollo: Contact search failed', { company, error: error.message });

      return {
        success: false,
        error: error.message || 'Apollo API error',
        source: 'Apollo',
      };
    }
  }
}