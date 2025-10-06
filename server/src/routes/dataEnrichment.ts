import express from 'express';
import multer from 'multer';
// Optional import for xlsx - will be handled gracefully if not available
let XLSX: any = null;
try {
  XLSX = require('xlsx');
} catch (error) {
  console.warn('xlsx not found - Excel file processing features will be disabled');
}
import { ApolloService } from '../services/apollo.service';
import logger from '../utils/logger';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only Excel (.xlsx, .xls) and CSV files are allowed.'));
    }
  }
});

/**
 * POST /api/data-enrichment/validate-key
 * Validate Apollo API key
 */
router.post('/validate-key', async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'API key is required'
      });
    }

    // Temporarily set the API key for validation
    const originalKey = process.env.APOLLO_API_KEY;
    process.env.APOLLO_API_KEY = apiKey;
    
    const apolloService = new ApolloService();
    const isValid = await apolloService.validateApiKey();
    
    // Restore original key
    process.env.APOLLO_API_KEY = originalKey;
    
    res.json({
      success: true,
      valid: isValid
    });
  } catch (error: any) {
    logger.error('Apollo API key validation error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate API key'
    });
  }
});

/**
 * POST /api/data-enrichment/upload-and-enrich
 * Upload Excel file and enrich contacts using Apollo
 */
router.post('/upload-and-enrich', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const { apiKey } = req.body;
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Apollo API key is required'
      });
    }

    // Set API key for this request
    process.env.APOLLO_API_KEY = apiKey;
    const apolloService = new ApolloService();

    // Parse Excel file
    if (!XLSX) {
      return res.status(400).json({
        success: false,
        error: 'Excel file processing not available - xlsx module not installed'
      });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    if (jsonData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data found in the uploaded file'
      });
    }

    logger.info('Processing Excel file', {
      rowCount: jsonData.length,
      sampleData: jsonData.slice(0, 3)
    });

    // Enhanced column mapping for any CSV format
    const peopleData = jsonData.map((row: any, index: number) => {
      const person: any = {};
      
      // Skip header row
      if (index === 0) {
        return {
          ...person,
          originalRow: row,
          rowIndex: index,
          isHeader: true
        };
      }

      // Comprehensive column mapping for any format
      const columnMapping: Record<string, string> = {
        // Name variations
        'given': 'first_name',
        'first_name': 'first_name',
        'firstname': 'first_name',
        'first name': 'first_name',
        'name': 'first_name',
        'full_name': 'first_name',
        'fullname': 'first_name',
        'full name': 'first_name',
        'contact_name': 'first_name',
        'contact name': 'first_name',
        'person': 'first_name',
        'contact': 'first_name',
        
        // Last name variations
        'last_name': 'last_name',
        'lastname': 'last_name',
        'last name': 'last_name',
        'surname': 'last_name',
        'family_name': 'last_name',
        'family name': 'last_name',
        
        // Company variations
        'company': 'organization_name',
        'company_name': 'organization_name',
        'organization': 'organization_name',
        'organization_name': 'organization_name',
        'org': 'organization_name',
        'firm': 'organization_name',
        'business': 'organization_name',
        'employer': 'organization_name',
        'workplace': 'organization_name',
        'corp': 'organization_name',
        'corporation': 'organization_name',
        'inc': 'organization_name',
        'llc': 'organization_name',
        'ltd': 'organization_name',
        'limited': 'organization_name',
        
        // Email variations
        'email': 'email',
        'email_address': 'email',
        'email address': 'email',
        'e_mail': 'email',
        'e-mail': 'email',
        'mail': 'email',
        'contact_email': 'email',
        'contact email': 'email',
        
        // Phone variations
        'phone': 'phone',
        'phone_number': 'phone',
        'phone number': 'phone',
        'telephone': 'phone',
        'tel': 'phone',
        'mobile': 'phone',
        'cell': 'phone',
        'contact_phone': 'phone',
        'contact phone': 'phone',
        'number': 'phone',
        
        // Website/Domain variations
        'website': 'domain',
        'websites': 'domain',
        'domain': 'domain',
        'url': 'domain',
        'web': 'domain',
        'site': 'domain',
        'homepage': 'domain',
        'web_address': 'domain',
        'web address': 'domain',
        'company_website': 'domain',
        'company website': 'domain',
        'org_website': 'domain',
        'org website': 'domain',
        
        // Title variations
        'title': 'title',
        'job_title': 'title',
        'job title': 'title',
        'position': 'title',
        'role': 'title',
        'designation': 'title',
        'occupation': 'title',
        'job': 'title',
        'work_title': 'title',
        'work title': 'title'
      };

      // Try to map columns automatically with fuzzy matching
      Object.keys(row).forEach(key => {
        const normalizedKey = key.toLowerCase().trim().replace(/[_\-\s]/g, '_');
        const mappedField = columnMapping[normalizedKey];
        if (mappedField && row[key] && row[key].toString().trim()) {
          person[mappedField] = row[key].toString().trim();
        }
      });

      // Smart name extraction from any name field
      if (!person.first_name) {
        const nameFields = ['name', 'full_name', 'fullname', 'full name', 'contact_name', 'contact name', 'person', 'contact', 'given'];
        for (const field of nameFields) {
          if (row[field] && row[field].toString().trim()) {
            const fullName = row[field].toString().trim();
            const nameParts = fullName.split(/\s+/);
            if (nameParts.length >= 1) {
              person.first_name = nameParts[0];
              if (nameParts.length > 1) {
                person.last_name = nameParts.slice(1).join(' ');
              }
              break;
            }
          }
        }
      }

      // Smart company extraction
      if (!person.organization_name) {
        const companyFields = ['company', 'organization', 'org', 'firm', 'business', 'employer', 'workplace', 'corp', 'corporation'];
        for (const field of companyFields) {
          if (row[field] && row[field].toString().trim()) {
            person.organization_name = row[field].toString().trim();
            break;
          }
        }
      }

      // Smart email extraction
      if (!person.email) {
        const emailFields = ['email', 'email_address', 'e_mail', 'e-mail', 'mail', 'contact_email', 'contact email'];
        for (const field of emailFields) {
          if (row[field] && row[field].toString().trim()) {
            person.email = row[field].toString().trim();
            break;
          }
        }
      }

      // Smart phone extraction
      if (!person.phone) {
        const phoneFields = ['phone', 'phone_number', 'telephone', 'tel', 'mobile', 'cell', 'contact_phone', 'contact phone', 'number'];
        for (const field of phoneFields) {
          if (row[field] && row[field].toString().trim()) {
            person.phone = row[field].toString().trim();
            break;
          }
        }
      }

      // Smart domain extraction
      if (!person.domain) {
        const domainFields = ['website', 'websites', 'domain', 'url', 'web', 'site', 'homepage', 'web_address', 'web address'];
        for (const field of domainFields) {
          if (row[field] && row[field].toString().trim()) {
            let domain = row[field].toString().trim();
            // Clean up domain if it's a full URL
            if (domain.startsWith('http://') || domain.startsWith('https://')) {
              try {
                domain = new URL(domain).hostname;
              } catch (e) {
                // Keep original if URL parsing fails
              }
            }
            person.domain = domain;
            break;
          }
        }
      }

      return {
        ...person,
        originalRow: row,
        rowIndex: index,
        isHeader: false
      };
    });

    logger.info('Mapped people data', {
      sampleMapped: peopleData.slice(0, 3)
    });

    // Filter out people with sufficient data for Apollo search (skip header row)
    const peopleToEnrich = peopleData.filter(person => 
      !person.isHeader &&
      person.first_name && 
      (person.organization_name || person.domain) &&
      !person.email // Only enrich if email is missing
    );

    logger.info('People to enrich', {
      total: peopleData.length,
      toEnrich: peopleToEnrich.length,
      sample: peopleToEnrich.slice(0, 3)
    });

    // Enrich contacts with Apollo
    const enrichedResults = [];
    let successCount = 0;
    let failureCount = 0;

    for (const person of peopleToEnrich) {
      try {
        // Search for the person using Apollo
        const searchParams: any = {
          first_name: person.first_name,
          per_page: 1
        };

        if (person.last_name) {
          searchParams.last_name = person.last_name;
        }

        if (person.organization_name) {
          searchParams.organization_name = person.organization_name;
        }

        if (person.domain) {
          searchParams.organization_domains = person.domain;
        }

        const apolloResponse = await apolloService.searchPeople(searchParams);
        
        if (apolloResponse.people && apolloResponse.people.length > 0) {
          const apolloPerson = apolloResponse.people[0];
          
          // Merge Apollo data with original data
          const enrichedPerson = {
            ...person,
            // Only update if we don't already have the data
            email: person.email || apolloPerson.email || '',
            phone: person.phone || apolloPerson.phone_numbers?.[0]?.sanitized_number || '',
            title: person.title || apolloPerson.title || '',
            linkedin_url: apolloPerson.linkedin_url || '',
            organization_name: person.organization_name || apolloPerson.organization?.name || '',
            organization_domain: apolloPerson.organization?.primary_domain || person.domain || '',
            city: apolloPerson.city || '',
            state: apolloPerson.state || '',
            country: apolloPerson.country || '',
            apollo_id: apolloPerson.id,
            apollo_confidence: apolloPerson.extrapolated_email_confidence || 0
          };

          enrichedResults.push({
            original: person,
            enriched: enrichedPerson,
            success: true,
            error: null
          });
          successCount++;
        } else {
          // No Apollo results, keep original data
          enrichedResults.push({
            original: person,
            enriched: person,
            success: false,
            error: 'No matching person found'
          });
          failureCount++;
        }

        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error: any) {
        logger.error('Apollo enrichment failed for person', {
          person: person.first_name,
          error: error.message
        });
        enrichedResults.push({
          original: person,
          enriched: person,
          success: false,
          error: error.message
        });
        failureCount++;
      }
    }

    // Transform results for frontend
    const processedResults = enrichedResults.map((result, index) => {
      const enriched = result.enriched;
      const originalRow = result.original.originalRow;
      
      if (enriched && result.success) {
        return {
          id: `enriched_${index}`,
          original: {
            given: originalRow['Given'] || originalRow['given'] || '',
            company: originalRow['Company'] || originalRow['company'] || '',
            website: originalRow['To be populated'] || originalRow['website'] || '',
            phone: originalRow['To be populated_1'] || originalRow['phone'] || '',
            email: originalRow['To be populated_2'] || originalRow['email'] || ''
          },
          enriched: {
            name: `${enriched.first_name || ''} ${enriched.last_name || ''}`.trim(),
            email: enriched.email,
            phone: enriched.phone,
            title: enriched.title,
            company: enriched.organization_name,
            linkedin: enriched.linkedin_url,
            location: enriched.city && enriched.state ? `${enriched.city}, ${enriched.state}` : undefined,
            photo: enriched.photo_url,
            organization: enriched.organization_name,
            website: enriched.organization_domain
          },
          success: true,
          error: null
        };
      } else {
        return {
          id: `failed_${index}`,
          original: {
            given: originalRow['Given'] || originalRow['given'] || '',
            company: originalRow['Company'] || originalRow['company'] || '',
            website: originalRow['To be populated'] || originalRow['website'] || '',
            phone: originalRow['To be populated_1'] || originalRow['phone'] || '',
            email: originalRow['To be populated_2'] || originalRow['email'] || ''
          },
          enriched: null,
          success: false,
          error: result.error || 'No matching person found'
        };
      }
    });

    logger.info('Apollo enrichment completed', {
      total: processedResults.length,
      success: successCount,
      failures: failureCount
    });

    res.json({
      success: true,
      results: processedResults,
      summary: {
        total: processedResults.length,
        successful: successCount,
        failed: failureCount,
        successRate: Math.round((successCount / processedResults.length) * 100)
      }
    });

  } catch (error: any) {
    logger.error('Apollo enrichment error', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process file and enrich contacts'
    });
  }
});

/**
 * POST /api/data-enrichment/generate-csv
 * Generate enriched CSV file in original format
 */
router.post('/generate-csv', async (req, res) => {
  try {
    const { results, originalHeaders } = req.body;
    
    if (!results || !Array.isArray(results)) {
      return res.status(400).json({
        success: false,
        error: 'Results data is required'
      });
    }

    // Create enriched data in original format
    const enrichedData = results.map((result: any) => {
      const original = result.original;
      const enriched = result.enriched;
      
      // Create row in original format
      const row: any = {};
      
      // Map back to original column names
      Object.keys(original).forEach(key => {
        if (key === 'given' || key === 'Given') {
          row[key] = enriched?.name || original[key];
        } else if (key === 'company' || key === 'Company') {
          row[key] = enriched?.company || original[key];
        } else if (key === 'website' || key === 'To be populated') {
          row[key] = enriched?.website || original[key];
        } else if (key === 'phone' || key === 'To be populated_1') {
          row[key] = enriched?.phone || original[key];
        } else if (key === 'email' || key === 'To be populated_2') {
          row[key] = enriched?.email || original[key];
        } else {
          row[key] = original[key];
        }
      });
      
      return row;
    });

    // Convert to CSV
    const csv = convertToCSV(enrichedData);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="enriched-contacts.csv"');
    res.send(csv);

  } catch (error: any) {
    logger.error('CSV generation error', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate CSV file'
    });
  }
});

/**
 * POST /api/data-enrichment/enrich-single
 * Enrich a single contact
 */
router.post('/enrich-single', async (req, res) => {
  try {
    const { apiKey, ...searchParams } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Apollo API key is required'
      });
    }

    // Set API key for this request
    process.env.APOLLO_API_KEY = apiKey;
    const apolloService = new ApolloService();

    const enriched = await apolloService.enrichPerson(searchParams);

    if (enriched) {
    res.json({
      success: true,
      data: {
          name: enriched.name,
          email: enriched.email,
          phone: enriched.phone_numbers?.[0]?.sanitized_number,
          title: enriched.title,
          company: enriched.organization?.name,
          linkedin: enriched.linkedin_url,
          location: enriched.city && enriched.state ? `${enriched.city}, ${enriched.state}` : undefined,
          photo: enriched.photo_url,
          organization: enriched.organization
        }
      });
    } else {
      res.json({
        success: false,
        error: 'No matching person found'
      });
    }

  } catch (error: any) {
    logger.error('Single contact enrichment error', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to enrich contact'
    });
  }
});

/**
 * GET /api/data-enrichment/sample
 * Get sample data format
 */
router.get('/sample', (req, res) => {
    const sampleData = [
    {
      'Full Name': 'John Smith',
      'Business': 'Acme Corporation',
      'Email Address': '',
      'Phone Number': '',
      'Website': ''
    },
    {
      'Full Name': 'Jane Doe',
      'Business': 'Tech Solutions Inc',
      'Email Address': 'jane@techsolutions.com',
      'Phone Number': '',
      'Website': 'https://techsolutions.com'
    }
  ];

  res.json({
    success: true,
    sampleData,
    instructions: {
      flexibleColumns: [
        'Name variations: Full Name, Name, Contact, Person, Given',
        'Company variations: Business, Company, Organization, Firm, Corp',
        'Email variations: Email Address, E-mail, Mail, Contact Email',
        'Phone variations: Phone Number, Telephone, Mobile, Cell, Number',
        'Website variations: Website, Homepage, URL, Domain, Site'
      ],
      description: 'Upload any CSV file with flexible column names. We automatically detect and map the columns to Apollo for enrichment.'
    }
  });
});

export default router;