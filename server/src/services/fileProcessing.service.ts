import * as XLSX from 'xlsx';
import { CompanyData, ContactData } from './enrichment/types';
import logger from '../utils/logger';

export interface InputCompany {
  company?: string;
  domain?: string;
  website?: string;
  email?: string;
  phone?: string;
  // Allow any additional fields from the uploaded Excel
  [key: string]: any;
}

export interface EnrichedCompany extends InputCompany {
  enrichedData?: {
    company?: CompanyData;
    contacts?: ContactData[];
    source?: string;
  };
  status: 'success' | 'error' | 'partial';
  errorMessage?: string;
}

export class FileProcessingService {
  /**
   * Parse Excel file buffer into company data
   */
  static parseExcelFile(buffer: Buffer): InputCompany[] {
    try {
      logger.info('Parsing Excel file');

      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
      }) as any[][];

      if (jsonData.length < 2) {
        throw new Error('Excel file must have at least a header row and one data row');
      }

      const headers = jsonData[0] as string[];
      const dataRows = jsonData.slice(1);

      logger.info('Excel parsing details', {
        totalRows: dataRows.length,
        headers: headers,
      });

      // Map data rows to objects using headers
      const companies: InputCompany[] = dataRows.map((row: any[], index: number) => {
        const company: InputCompany = {};

        headers.forEach((header: string, colIndex: number) => {
          const normalizedHeader = header.toLowerCase().trim();
          const value = row[colIndex] || '';

          // Map common column names to standard fields
          if (normalizedHeader.includes('company') || normalizedHeader.includes('name')) {
            company.company = value;
          } else if (normalizedHeader.includes('domain') || normalizedHeader.includes('website') || normalizedHeader.includes('url')) {
            company.domain = value;
            company.website = value;
          } else if (normalizedHeader.includes('email')) {
            company.email = value;
          } else if (normalizedHeader.includes('phone')) {
            company.phone = value;
          } else {
            // Keep original field name for any other columns
            company[header] = value;
          }
        });

        return company;
      }).filter(company => {
        // Filter out empty rows
        return company.company || company.domain || company.website;
      });

      logger.info('Excel parsing completed', {
        totalCompanies: companies.length,
        sampleCompany: companies[0],
      });

      return companies;
    } catch (error: any) {
      logger.error('Excel parsing failed', { error: error.message });
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
  }

  /**
   * Generate Excel file from enriched company data
   */
  static generateEnrichedExcel(enrichedCompanies: EnrichedCompany[]): Buffer {
    try {
      logger.info('Generating enriched Excel file', {
        totalCompanies: enrichedCompanies.length,
      });

      // Prepare data for Excel export with clean, organized structure
      const excelData: any[] = [];

      // Create clean, professional headers
      const headers = [
        // Input data
        'Company Name',
        'Website',

        // Core enriched data
        'Industry',
        'Employee Count',
        'Company Phone',
        'Headquarters',
        'Description',

        // Contact information
        'Key Contact Name',
        'Contact Email',
        'Contact Phone',
        'Contact Title',

        // Status and metadata
        'Enrichment Status',
        'Data Source',
        'Notes'
      ];

      excelData.push(headers);

      // Add data rows with clean formatting
      enrichedCompanies.forEach((company) => {
        const enrichedCompany = company.enrichedData?.company;
        const contacts = company.enrichedData?.contacts || [];
        const primaryContact = contacts[0]; // Get the best contact

        // Determine enrichment status
        let status = '❌ No Data Found';
        let notes = company.errorMessage || '';

        if (company.status === 'success') {
          status = '✅ Fully Enriched';
          notes = 'All data successfully enriched';
        } else if (company.status === 'partial') {
          status = '⚠️ Partially Enriched';
          notes = 'Company data found, contact search limited on free plan';
        }

        const row = [
          // Input data (clean)
          company.company || '',
          company.website || company.domain || '',

          // Core enriched data
          enrichedCompany?.industry || '',
          enrichedCompany?.employeeCount || '',
          enrichedCompany?.phone || '',
          enrichedCompany?.headquarters || '',
          this.truncateText(enrichedCompany?.description || '', 100),

          // Best contact information
          primaryContact?.name || '',
          primaryContact?.email || '',
          primaryContact?.phone || '',
          primaryContact?.title || '',

          // Status and metadata
          status,
          company.enrichedData?.source || 'Apollo',
          notes
        ];

        excelData.push(row);
      });

      // Create workbook and worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Enriched Data');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      logger.info('Excel generation completed', {
        totalRows: excelData.length - 1, // Exclude header
      });

      return buffer;
    } catch (error: any) {
      logger.error('Excel generation failed', { error: error.message });
      throw new Error(`Failed to generate Excel file: ${error.message}`);
    }
  }

  /**
   * Truncate text to specified length with ellipsis
   */
  static truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Extract domain from company name or website
   */
  static extractDomain(company: string, website?: string): string | null {
    try {
      // If website is provided, extract domain from it
      if (website) {
        const url = website.startsWith('http') ? website : `https://${website}`;
        const domain = new URL(url).hostname;
        return domain.replace('www.', '');
      }

      // Try to guess domain from company name
      if (company) {
        const cleanName = company
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '') // Remove special characters
          .replace(/\s+(inc|llc|corp|corporation|company|co|ltd|limited)\s*$/i, '') // Remove company suffixes
          .trim()
          .replace(/\s+/g, ''); // Remove spaces

        return `${cleanName}.com`;
      }

      return null;
    } catch (error) {
      logger.warn('Domain extraction failed', { company, website, error });
      return null;
    }
  }
}