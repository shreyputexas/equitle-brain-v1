import { ApolloProvider } from './enrichment/apolloProvider';
import { FileProcessingService, InputCompany, EnrichedCompany } from './fileProcessing.service';
import logger from '../utils/logger';

export class EnrichmentService {
  private apolloProvider: ApolloProvider;

  constructor(apolloApiKey: string) {
    this.apolloProvider = new ApolloProvider(apolloApiKey);
  }

  /**
   * Process uploaded Excel file and enrich company data
   */
  async processExcelFile(fileBuffer: Buffer): Promise<Buffer> {
    logger.info('Starting Excel file enrichment process');

    try {
      // Step 1: Parse Excel file
      const companies = FileProcessingService.parseExcelFile(fileBuffer);
      logger.info('Parsed Excel file', { totalCompanies: companies.length });

      if (companies.length === 0) {
        throw new Error('No valid company data found in Excel file');
      }

      // Step 2: Enrich each company
      const enrichedCompanies: EnrichedCompany[] = await this.enrichCompanies(companies);

      // Step 3: Generate enriched Excel file
      const enrichedExcelBuffer = FileProcessingService.generateEnrichedExcel(enrichedCompanies);

      logger.info('Excel enrichment process completed successfully', {
        totalProcessed: enrichedCompanies.length,
        successful: enrichedCompanies.filter(c => c.status === 'success').length,
        partial: enrichedCompanies.filter(c => c.status === 'partial').length,
        failed: enrichedCompanies.filter(c => c.status === 'error').length,
      });

      return enrichedExcelBuffer;
    } catch (error: any) {
      logger.error('Excel enrichment process failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Enrich array of companies with external data
   */
  private async enrichCompanies(companies: InputCompany[]): Promise<EnrichedCompany[]> {
    const enrichedCompanies: EnrichedCompany[] = [];

    logger.info('Starting company enrichment', { totalCompanies: companies.length });

    // TESTING: Only process first company
    const maxCompanies = Math.min(1, companies.length);
    logger.info('TESTING MODE: Processing only first company', { maxCompanies });

    for (let i = 0; i < maxCompanies; i++) {
      const company = companies[i];
      logger.info(`Enriching company ${i + 1}/${companies.length}`, {
        company: company.company,
        domain: company.domain,
      });

      try {
        const enrichedCompany = await this.enrichSingleCompany(company);
        enrichedCompanies.push(enrichedCompany);

        // Add delay between API calls to respect rate limits
        if (i < companies.length - 1) {
          await this.delay(1000); // 1 second delay between requests
        }
      } catch (error: any) {
        logger.error('Company enrichment failed', {
          company: company.company,
          error: error.message,
        });

        enrichedCompanies.push({
          ...company,
          status: 'error',
          errorMessage: error.message,
        });
      }
    }

    return enrichedCompanies;
  }

  /**
   * Enrich a single company
   */
  private async enrichSingleCompany(company: InputCompany): Promise<EnrichedCompany> {
    const enrichedCompany: EnrichedCompany = {
      ...company,
      status: 'error',
    };

    try {
      // Determine domain to use for enrichment
      let domain = company.domain || company.website;

      if (!domain && company.company) {
        domain = FileProcessingService.extractDomain(company.company);
      }

      if (!domain) {
        throw new Error('No domain or company name available for enrichment');
      }

      // Clean domain (remove protocol, www, etc.)
      domain = this.cleanDomain(domain);

      logger.info('Enriching company with domain', {
        originalCompany: company.company,
        domain: domain,
      });

      // First get basic company data to get the actual website
      const companyResult = await this.apolloProvider.enrichCompany(domain);

      // Focus on finding contacts - this is our main goal
      const contactsResult = await this.apolloProvider.searchContacts(
        company.company || '',
        domain,
        5 // Get top 5 to increase chances of finding good contacts
      );

      // Determine status based on contacts found (this is what matters)
      let status: 'success' | 'error' | 'partial' = 'error';
      let errorMessage = '';

      if (contactsResult.success && contactsResult.contacts && contactsResult.contacts.length > 0) {
        if (contactsResult.contacts.length >= 2) {
          status = 'success'; // Found multiple contacts
        } else {
          status = 'partial'; // Found at least one contact
        }

        enrichedCompany.enrichedData = {
          company: companyResult.company, // Include website info
          contacts: contactsResult.contacts || [],
          source: 'Apollo',
        };
      } else {
        status = 'error';
        errorMessage = contactsResult.error || 'No executive contacts found';
      }

      enrichedCompany.status = status;
      if (errorMessage) {
        enrichedCompany.errorMessage = errorMessage;
      }

      logger.info('Company enrichment completed', {
        company: company.company,
        domain: domain,
        status: status,
        foundCompanyData: !!companyResult.company,
        foundContacts: contactsResult.contacts?.length || 0,
      });

      return enrichedCompany;
    } catch (error: any) {
      logger.error('Single company enrichment failed', {
        company: company.company,
        error: error.message,
      });

      enrichedCompany.status = 'error';
      enrichedCompany.errorMessage = error.message;
      return enrichedCompany;
    }
  }

  /**
   * Clean domain string (remove protocol, www, paths, etc.)
   */
  private cleanDomain(domain: string): string {
    try {
      // Remove protocol
      let cleanDomain = domain.replace(/^https?:\/\//, '');

      // Remove www
      cleanDomain = cleanDomain.replace(/^www\./, '');

      // Remove path and query parameters
      cleanDomain = cleanDomain.split('/')[0].split('?')[0];

      // Remove port
      cleanDomain = cleanDomain.split(':')[0];

      return cleanDomain.toLowerCase().trim();
    } catch (error) {
      logger.warn('Domain cleaning failed, using original', { domain });
      return domain;
    }
  }

  /**
   * Add delay between API calls
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}