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
      'text/csv', // .csv
      'text/plain', // .csv (sometimes detected as plain text)
      'application/csv' // .csv (alternative MIME type)
    ];
    
    // Also check file extension as fallback
    const allowedExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
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

    // Log the validation attempt (without exposing the full key)
    logger.info('Apollo API key validation attempt', {
      apiKeyPrefix: apiKey.substring(0, 8) + '...',
      keyLength: apiKey.length
    });

    // Create Apollo service with the provided API key
    const apolloService = new ApolloService(apiKey);
    const isValid = await apolloService.validateApiKey();

    if (isValid) {
      logger.info('Apollo API key validation successful');
      res.json({
        success: true,
        valid: true,
        message: 'API key is valid and active'
      });
    } else {
      logger.warn('Apollo API key validation failed');
      res.json({
        success: true,
        valid: false,
        message: 'API key is invalid, inactive, or lacks required permissions'
      });
    }
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

    // Enhanced data extraction and analysis
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

      // Analyze the data structure to determine what we're dealing with
      const rowValues = Object.values(row).filter(val => val && val.toString().trim());
      const hasEmail = Object.values(row).some(val => val && val.toString().includes('@'));
      const hasPhone = Object.values(row).some(val => val && /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(val.toString()));
      const hasWebsite = Object.values(row).some(val => val && (val.toString().includes('http') || val.toString().includes('www')));
      
      // Smart detection: if we have email/phone/website, this is likely a person
      // If we only have company-like data, this might be a company list
      const isLikelyPerson = hasEmail || hasPhone || hasWebsite;
      const isLikelyCompany = !isLikelyPerson && rowValues.length > 0;

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

      // Intelligent data extraction based on content analysis
      Object.keys(row).forEach(key => {
        const value = row[key] && row[key].toString().trim();
        if (!value) return;
        
        const normalizedKey = key.toLowerCase().trim().replace(/[_\-\s]/g, '_');
        const mappedField = columnMapping[normalizedKey];
        
        if (mappedField && value) {
          person[mappedField] = value;
        }
      });

      // Smart content-based extraction
      Object.keys(row).forEach(key => {
        const value = row[key] && row[key].toString().trim();
        if (!value) return;
        
        const lowerKey = key.toLowerCase();
        const lowerValue = value.toLowerCase();
        
        // Email detection
        if (!person.email && value.includes('@')) {
          person.email = value;
        }
        
        // Phone detection
        if (!person.phone && /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(value)) {
          person.phone = value;
        }
        
        // Website detection
        if (!person.domain && (value.includes('http') || value.includes('www'))) {
          person.domain = value.replace(/^https?:\/\//, '').replace(/^www\./, '');
        }
        
        // Name vs Company detection
        if (isLikelyPerson) {
          // For person data, look for name patterns
          if (!person.first_name && (lowerKey.includes('name') || lowerKey.includes('contact') || lowerKey.includes('person'))) {
            const nameParts = value.split(/\s+/);
            if (nameParts.length >= 1) {
              person.first_name = nameParts[0];
              if (nameParts.length > 1) {
                person.last_name = nameParts.slice(1).join(' ');
              }
            }
          }
        } else if (isLikelyCompany) {
          // For company data, treat the main field as company name
          if (!person.organization_name && value.length > 2) {
            person.organization_name = value;
          }
        }
        
        // Fallback: if we still don't have organization_name, use any non-empty field
        if (!person.organization_name && value.length > 2 && !person.first_name) {
          person.organization_name = value;
        }
      });

      // Additional fuzzy matching for common variations
      Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase().trim();
        
        // Name detection
        if (!person.first_name && (lowerKey.includes('name') || lowerKey.includes('contact') || lowerKey.includes('person'))) {
          person.first_name = row[key].toString().trim();
        }
        
        // Company detection
        if (!person.organization_name && (lowerKey.includes('company') || lowerKey.includes('org') || lowerKey.includes('business') || lowerKey.includes('firm'))) {
          person.organization_name = row[key].toString().trim();
        }
        
        // Email detection
        if (!person.email && (lowerKey.includes('email') || lowerKey.includes('mail') || lowerKey.includes('@'))) {
          person.email = row[key].toString().trim();
        }
        
        // Phone detection
        if (!person.phone && (lowerKey.includes('phone') || lowerKey.includes('tel') || lowerKey.includes('mobile') || lowerKey.includes('cell'))) {
          person.phone = row[key].toString().trim();
        }
        
        // Website detection
        if (!person.domain && (lowerKey.includes('website') || lowerKey.includes('web') || lowerKey.includes('url') || lowerKey.includes('site'))) {
          person.domain = row[key].toString().trim();
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
        isHeader: false,
        isLikelyPerson,
        isLikelyCompany,
        hasEmail,
        hasPhone,
        hasWebsite
      };
    });

    logger.info('Mapped people data', {
      sampleMapped: peopleData.slice(0, 3),
      totalRows: peopleData.length,
      nonHeaderRows: peopleData.filter(p => !p.isHeader).length,
      dataTypes: {
        likelyPersons: peopleData.filter(p => !p.isHeader && p.isLikelyPerson).length,
        likelyCompanies: peopleData.filter(p => !p.isHeader && p.isLikelyCompany).length,
        withEmail: peopleData.filter(p => !p.isHeader && p.hasEmail).length,
        withPhone: peopleData.filter(p => !p.isHeader && p.hasPhone).length,
        withWebsite: peopleData.filter(p => !p.isHeader && p.hasWebsite).length
      }
    });

    // Intelligent filtering for Apollo enrichment
    const peopleToEnrich = peopleData.filter(person => {
      if (person.isHeader) return false;
      
      // Must have some identifying information
      const hasName = person.first_name || person.last_name;
      const hasCompany = person.organization_name || person.domain;
      const hasContact = person.email || person.phone;
      
      // For Apollo enrichment, we need at least:
      // 1. A name AND (company OR contact info), OR
      // 2. A company AND contact info, OR
      // 3. Just a company (we'll search for people at that company)
      return (hasName && (hasCompany || hasContact)) || 
             (hasCompany && hasContact) || 
             (hasCompany && !hasName); // Allow company-only searches
    });

    logger.info('People to enrich', {
      total: peopleData.length,
      toEnrich: peopleToEnrich.length,
      sample: peopleToEnrich.slice(0, 3),
      filterDetails: {
        hasName: peopleData.filter(p => !p.isHeader && (p.first_name || p.last_name)).length,
        hasCompany: peopleData.filter(p => !p.isHeader && (p.organization_name || p.domain)).length,
        hasContact: peopleData.filter(p => !p.isHeader && (p.email || p.phone)).length
      }
    });

    // Create CSV export for review
    const csvData = peopleToEnrich.map(person => ({
      'First Name': person.first_name || '',
      'Last Name': person.last_name || '',
      'Company': person.organization_name || '',
      'Email': person.email || '',
      'Phone': person.phone || '',
      'Website': person.domain || '',
      'Title': person.title || '',
      'Original Row': JSON.stringify(person.originalRow)
    }));

    logger.info('CSV export data prepared', {
      csvRows: csvData.length,
      sampleCsv: csvData.slice(0, 2)
    });

    // Enrich contacts with Apollo
    const enrichedResults = [];
    let successCount = 0;
    let failureCount = 0;

    for (const person of peopleToEnrich) {
      try {
        // Build comprehensive Apollo search parameters
        // Prepare enrichment parameters

        logger.info('Apollo enrichment attempt', {
          person: person.first_name || person.organization_name,
          hasEmail: !!person.email,
          hasPhone: !!person.phone,
          hasCompany: !!person.organization_name
        });

        // Use proper Apollo enrichment instead of search
        const enrichedPerson = await apolloService.enrichPerson({
          first_name: person.first_name,
          last_name: person.last_name,
          organization_name: person.organization_name,
          email: person.email,
          phone: person.phone,
          domain: person.domain
        });
        
        if (enrichedPerson) {
          // Use the enriched person data directly
          const bestMatch = enrichedPerson;
          
          // Merge Apollo data with original data
          const enrichedPersonData = {
            ...person,
            // Only update if we don't already have the data
            email: person.email || (bestMatch.email && bestMatch.email !== 'email_not_unlocked' ? bestMatch.email : ''),
            phone: person.phone || bestMatch.phone_numbers?.[0]?.sanitized_number || '',
            title: person.title || bestMatch.title || '',
            linkedin_url: bestMatch.linkedin_url || '',
            organization_name: person.organization_name || bestMatch.organization?.name || '',
            organization_domain: bestMatch.organization?.primary_domain || person.domain || '',
            city: bestMatch.city || '',
            state: bestMatch.state || '',
            country: bestMatch.country || '',
            apollo_id: bestMatch.id,
            apollo_confidence: bestMatch.extrapolated_email_confidence || 0,
            match_quality: 'enriched',
            total_matches: 1,
            email_status: bestMatch.email === 'email_not_unlocked' ? 'not_unlocked' : 'available',
            email_unlocked: bestMatch.email !== 'email_not_unlocked'
          };

          // Only count as successful if we got useful data (not just email_not_unlocked)
          const hasUsefulData = enrichedPersonData.email || 
                                enrichedPersonData.phone || 
                                enrichedPersonData.title || 
                                enrichedPersonData.linkedin_url ||
                                enrichedPersonData.organization_name ||
                                enrichedPersonData.city;
          
          enrichedResults.push({
            original: person,
            enriched: enrichedPersonData,
            success: hasUsefulData,
            error: hasUsefulData ? null : 'No useful data found (email not unlocked)'
          });
          
          if (hasUsefulData) {
            successCount++;
          } else {
            failureCount++;
          }
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
      csvData: csvData, // Include CSV data for frontend
      originalData: jsonData, // Include original data for download
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
    const headers = Object.keys(enrichedData[0]);
    const csvContent = [
      headers.join(','),
      ...enrichedData.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape CSV values
          return `"${value.toString().replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="enriched-contacts.csv"');
    res.send(csvContent);

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

// Export processed data as CSV
router.post('/export-csv', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || !Array.isArray(data)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid data format'
      });
    }

    // Convert to CSV format
    if (data.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No data to export'
      });
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape CSV values
          return `"${value.toString().replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=enriched-contacts.csv');
    res.send(csvContent);

  } catch (error: any) {
    logger.error('CSV export error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export CSV'
    });
  }
});

// Parse thesis criteria from uploaded file
router.post('/parse-thesis', async (req, res) => {
  try {
    if (!XLSX) {
      return res.status(500).json({
        success: false,
        error: 'Excel processing not available. Please install xlsx package.'
      });
    }

    const { file } = req;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    logger.info('Parsing thesis criteria from file', {
      filename: file.originalname,
      size: file.size
    });

    // Parse the Excel file
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Find thesis sections
    const theses = [];
    let currentThesis = null;

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue;

      const firstCell = row[0]?.toString().toLowerCase().trim();
      
      if (firstCell?.includes('thesis')) {
        // Save previous thesis if exists
        if (currentThesis) {
          theses.push(currentThesis);
        }
        
        // Start new thesis
        currentThesis = {
          id: firstCell.includes('1') ? 1 : 2,
          name: firstCell,
          criteria: {}
        };
      } else if (currentThesis && firstCell) {
        // Parse criteria
        const key = firstCell.toLowerCase().replace(':', '').trim();
        const value = row[1]?.toString().trim() || '';
        
        if (value) {
          currentThesis.criteria[key] = value;
        }
      }
    }

    // Add the last thesis
    if (currentThesis) {
      theses.push(currentThesis);
    }

    logger.info('Parsed thesis criteria', {
      thesesFound: theses.length,
      theses: theses.map(t => ({ id: t.id, criteriaCount: Object.keys(t.criteria).length }))
    });

    res.json({
      success: true,
      theses,
      summary: {
        total: theses.length,
        parsed: theses.length
      }
    });

  } catch (error: any) {
    logger.error('Thesis parsing failed', error);
    res.status(500).json({
      success: false,
      error: 'Failed to parse thesis criteria from file'
    });
  }
});

// Save thesis criteria endpoint
router.post('/save-thesis', async (req, res) => {
  try {
    const { thesisCriteria, userId } = req.body;

    if (!thesisCriteria) {
      return res.status(400).json({
        success: false,
        error: 'Thesis criteria is required'
      });
    }

    logger.info('Saving thesis criteria', {
      userId,
      criteriaCount: Object.keys(thesisCriteria).length,
      criteria: thesisCriteria
    });

    // For now, just return success - you can implement database storage later
    // In a real implementation, you'd save this to a database
    res.json({
      success: true,
      message: 'Thesis criteria saved successfully',
      savedAt: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('Save thesis criteria failed', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save thesis criteria'
    });
  }
});

// Load thesis criteria endpoint
router.get('/load-thesis/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    logger.info('Loading thesis criteria', { userId });

    // For now, return empty - you can implement database retrieval later
    // In a real implementation, you'd load from a database
    res.json({
      success: true,
      thesisCriteria: null,
      message: 'No saved thesis criteria found'
    });

  } catch (error: any) {
    logger.error('Load thesis criteria failed', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load thesis criteria'
    });
  }
});

// Contact search endpoint
router.post('/search-contacts', async (req, res) => {
  try {
    const { thesisCriteria, apolloApiKey, contactsToFind = 10 } = req.body;

    if (!thesisCriteria) {
      return res.status(400).json({
        success: false,
        error: 'Thesis criteria is required'
      });
    }

    if (!apolloApiKey) {
      return res.status(400).json({
        success: false,
        error: 'Apollo API key is required'
      });
    }

    // Create Apollo service with provided API key
    const apolloService = new ApolloService(apolloApiKey);

    // Validate API key first
    const isKeyValid = await apolloService.validateApiKey();
    if (!isKeyValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid Apollo API key'
      });
    }

    logger.info('Starting contact search', {
      thesisCriteria,
      criteriaCount: Object.keys(thesisCriteria).length,
      contactsToFind
    });

    // Build simple search parameters - just search for contacts in the specified industry
    const searchParams: any = {
      per_page: Math.min(contactsToFind, 50),
      reveal_personal_emails: true
    };

    // Simple industry-based search
    if (thesisCriteria.industries) {
      // Search for people with titles related to the industry
      searchParams.person_titles = [
        'CEO', 'CTO', 'VP', 'Director', 'Manager', 'Founder', 'President'
      ];
      
      // Add industry-specific titles
      if (thesisCriteria.industries.toLowerCase().includes('healthcare')) {
        searchParams.person_titles.push('Chief Medical Officer', 'Medical Director', 'Healthcare Director');
      }
      if (thesisCriteria.industries.toLowerCase().includes('tech')) {
        searchParams.person_titles.push('Chief Technology Officer', 'VP Engineering', 'Head of Engineering');
      }
    }

    // Add location if specified
    if (thesisCriteria.location) {
      searchParams.organization_locations = [thesisCriteria.location];
    }

    // Add company size based on revenue/EBITDA
    if (thesisCriteria.revenue || thesisCriteria.ebitda) {
      searchParams.organization_num_employees_ranges = ['51,100', '101,200', '201,500', '501,1000'];
    }

    logger.info('Apollo search parameters for thesis', {
      searchParams,
      thesisCriteria
    });

    // Search for contacts using Apollo
    const searchResults = await apolloService.searchPeople(searchParams);

    if (!searchResults.people || searchResults.people.length === 0) {
      return res.json({
        success: true,
        contacts: [],
        summary: {
          total: 0,
          found: 0,
          successRate: 0
        },
        message: 'No contacts found matching thesis criteria'
      });
    }

    // Process and format the results
    const discoveredContacts = searchResults.people.map((person, index) => ({
      id: person.id,
      name: person.name,
      first_name: person.first_name,
      last_name: person.last_name,
      title: person.title,
      email: person.email && person.email !== 'email_not_unlocked' ? person.email : '',
      phone: person.phone_numbers?.[0]?.sanitized_number || '',
      linkedin_url: person.linkedin_url || '',
      company: person.organization?.name || '',
      company_domain: person.organization?.primary_domain || '',
      company_industry: person.organization?.industry || '',
      company_size: person.organization?.employee_count || '',
      location: `${person.city || ''}, ${person.state || ''}`.replace(/^,\s*|,\s*$/g, ''),
      match_quality: 'thesis_match',
      apollo_confidence: person.extrapolated_email_confidence || 0,
      email_status: person.email === 'email_not_unlocked' ? 'not_unlocked' : 'available',
      email_unlocked: person.email !== 'email_not_unlocked'
    }));

    // Filter out contacts with locked emails if needed
    const usefulContacts = discoveredContacts.filter(contact => 
      contact.email || contact.phone || contact.linkedin_url || contact.company
    );

    logger.info('Contact search completed', {
      totalFound: searchResults.people.length,
      usefulContacts: usefulContacts.length,
      emailsUnlocked: usefulContacts.filter(c => c.email_unlocked).length
    });

    res.json({
      success: true,
      contacts: usefulContacts,
      summary: {
        total: searchResults.people.length,
        found: usefulContacts.length,
        successRate: Math.round((usefulContacts.length / searchResults.people.length) * 100)
      },
      thesisCriteria,
      searchParams
    });

  } catch (error: any) {
    logger.error('Contact search failed', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search for contacts based on criteria'
    });
  }
});

// Simple contact search endpoint (bypasses Apollo for testing)
router.post('/simple-search', async (req, res) => {
  try {
    const { thesisCriteria, contactsToFind = 10 } = req.body;

    if (!thesisCriteria) {
      return res.status(400).json({
        success: false,
        error: 'Thesis criteria is required'
      });
    }

    logger.info('Simple contact search', {
      thesisCriteria,
      contactsToFind
    });

    // Return mock data based on criteria
    const mockContacts = [
      {
        id: '1',
        name: 'John Smith',
        first_name: 'John',
        last_name: 'Smith',
        title: 'CEO',
        company: 'HealthTech Solutions',
        email: 'john.smith@healthtech.com',
        phone: '+1-555-0123',
        linkedin_url: 'https://linkedin.com/in/johnsmith',
        email_unlocked: true,
        city: 'San Francisco',
        state: 'CA',
        industry: 'Healthcare Technology'
      },
      {
        id: '2', 
        name: 'Sarah Johnson',
        first_name: 'Sarah',
        last_name: 'Johnson',
        title: 'VP of Operations',
        company: 'MediCare Plus',
        email: 'sarah.johnson@medicareplus.com',
        phone: '+1-555-0456',
        linkedin_url: 'https://linkedin.com/in/sarahjohnson',
        email_unlocked: true,
        city: 'Boston',
        state: 'MA',
        industry: 'Healthcare Services'
      },
      {
        id: '3',
        name: 'Michael Chen',
        first_name: 'Michael', 
        last_name: 'Chen',
        title: 'Director of Technology',
        company: 'Digital Health Corp',
        email: 'michael.chen@digitalhealth.com',
        phone: '+1-555-0789',
        linkedin_url: 'https://linkedin.com/in/michaelchen',
        email_unlocked: false,
        city: 'Austin',
        state: 'TX',
        industry: 'Healthcare Technology'
      },
      {
        id: '4',
        name: 'Dr. Emily Rodriguez',
        first_name: 'Emily',
        last_name: 'Rodriguez',
        title: 'Chief Medical Officer',
        company: 'Advanced Medical Systems',
        email: 'emily.rodriguez@advancedmedical.com',
        phone: '+1-555-0321',
        linkedin_url: 'https://linkedin.com/in/emilyrodriguez',
        email_unlocked: true,
        city: 'Chicago',
        state: 'IL',
        industry: 'Healthcare Technology'
      },
      {
        id: '5',
        name: 'David Kim',
        first_name: 'David',
        last_name: 'Kim',
        title: 'VP of Sales',
        company: 'HealthData Analytics',
        email: 'david.kim@healthdata.com',
        phone: '+1-555-0654',
        linkedin_url: 'https://linkedin.com/in/davidkim',
        email_unlocked: true,
        city: 'Seattle',
        state: 'WA',
        industry: 'Healthcare Analytics'
      }
    ];

    // Limit results based on contactsToFind
    const limitedContacts = mockContacts.slice(0, Math.min(contactsToFind, mockContacts.length));

    res.json({
      success: true,
      contacts: limitedContacts,
      summary: {
        total: limitedContacts.length,
        found: limitedContacts.length,
        successRate: 100
      },
      thesisCriteria,
      message: `Found ${limitedContacts.length} contacts matching your criteria`
    });

  } catch (error: any) {
    logger.error('Simple search failed', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search for contacts'
    });
  }
});

// Download search results as CSV
router.post('/download-search-results', (req, res) => {
  try {
    const { contacts, thesisCriteria } = req.body;

    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({
        success: false,
        error: 'No contacts data provided'
      });
    }

    logger.info('Generating CSV for search results', {
      contactCount: contacts.length,
      criteria: thesisCriteria
    });

    // Create CSV headers
    const headers = [
      'Name',
      'First Name', 
      'Last Name',
      'Title',
      'Company',
      'Email',
      'Phone',
      'LinkedIn',
      'Email Status',
      'Location',
      'Industry'
    ];

    // Convert contacts to CSV rows
    const csvRows = contacts.map(contact => [
      contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim(),
      contact.first_name || '',
      contact.last_name || '',
      contact.title || '',
      contact.company || contact.organization_name || '',
      contact.email || '',
      contact.phone || '',
      contact.linkedin_url || '',
      contact.email_unlocked ? 'Unlocked' : 'Locked',
      contact.city && contact.state ? `${contact.city}, ${contact.state}` : contact.location || '',
      contact.industry || ''
    ]);

    // Combine headers and rows
    const csvData = [headers, ...csvRows];

    // Convert to CSV string
    const csvContent = csvData.map(row => 
      row.map(field => `"${String(field || '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="apollo-contacts-${new Date().toISOString().split('T')[0]}.csv"`);
    
    logger.info('CSV generated successfully', {
      rowCount: csvData.length,
      contactCount: contacts.length
    });

    res.send(csvContent);

  } catch (error: any) {
    logger.error('CSV generation error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate CSV file'
    });
  }
});

// Download enriched data in original format
router.post('/download-enriched', (req, res) => {
  try {
    const { results, originalData } = req.body;
    
    if (!results || !Array.isArray(results)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid results data'
      });
    }

    if (!originalData || !Array.isArray(originalData)) {
      return res.status(400).json({
        success: false,
        error: 'Original data required'
      });
    }

    // Create enriched data in the same format as input
    const enrichedData = originalData.map((originalRow, index) => {
      // Find matching result by index
      const result = results[index];
      const enriched = result?.enriched || {};
      
      // Start with original row structure
      const enrichedRow = { ...originalRow };
      
      // Add enriched fields as new columns (don't overwrite existing data)
      if (enriched.email && enriched.email !== 'email_not_unlocked' && enriched.email !== '') {
        enrichedRow.enriched_email = enriched.email;
      }
      if (enriched.phone) {
        enrichedRow.enriched_phone = enriched.phone;
      }
      if (enriched.title) {
        enrichedRow.enriched_title = enriched.title;
      }
      if (enriched.linkedin) {
        enrichedRow.enriched_linkedin = enriched.linkedin;
      }
      if (enriched.website) {
        enrichedRow.enriched_website = enriched.website;
      }
      if (enriched.location) {
        enrichedRow.enriched_location = enriched.location;
      }
      
      // Add email status information
      if (enriched.email_status) {
        enrichedRow.email_status = enriched.email_status;
      }
      if (enriched.email_unlocked !== undefined) {
        enrichedRow.email_unlocked = enriched.email_unlocked;
      }
      
      // Add Apollo metadata as new columns
      if (enriched.apollo_id) {
        enrichedRow.apollo_id = enriched.apollo_id;
      }
      if (enriched.apollo_confidence) {
        enrichedRow.apollo_confidence = enriched.apollo_confidence;
      }
      if (enriched.match_quality) {
        enrichedRow.match_quality = enriched.match_quality;
      }
      
      return enrichedRow;
    });

    // Convert to CSV format
    if (enrichedData.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No enriched data to export'
      });
    }

    const headers = Object.keys(enrichedData[0]);
    const csvContent = [
      headers.join(','),
      ...enrichedData.map(row => 
        headers.map(header => {
          const value = row[header] || '';
          // Escape CSV values
          return `"${value.toString().replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=enriched-data.csv');
    res.send(csvContent);

  } catch (error: any) {
    logger.error('Download enriched data error', error);
    res.status(500).json({
      success: false,
      error: 'Failed to download enriched data'
    });
  }
});

export default router;