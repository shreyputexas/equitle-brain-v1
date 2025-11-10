// @ts-nocheck
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
import { OptimizedEnrichmentService } from '../services/optimizedEnrichment.service';
import IntegrationsFirestoreService from '../services/integrations.firestore.service';
import ApolloAuthService from '../services/apolloAuth';
import { firebaseAuthMiddleware as auth, FirebaseAuthRequest } from '../middleware/firebaseAuth';
import logger from '../utils/logger';

const router = express.Router();

// Helper function to get Apollo integration for a user and return a configured ApolloService
async function getApolloServiceForUser(userId: string, apiKey?: string): Promise<{ service: ApolloService; integration: any | null }> {
  // If API key is provided, use it directly (skip OAuth integration)
  if (apiKey) {
    logger.info('Using provided Apollo API key for user', { userId, hasApiKey: !!apiKey });
    const apolloService = new ApolloService(apiKey);
    return { service: apolloService, integration: null };
  }

  // Otherwise, try to get user's Apollo OAuth integration
  const apolloIntegration = await IntegrationsFirestoreService.findFirst({
    userId,
    provider: 'apollo',
    isActive: true
  });

  if (!apolloIntegration) {
    throw new Error('Apollo integration not found and no API key provided. Please connect Apollo from Settings or provide an API key.');
  }

  // Ensure access token is valid (refreshes if needed)
  const ensureValidApolloAccessToken = async (integration: { expiresAt?: Date | null; refreshToken?: string; accessToken: string; id: string }) => {
    if (!integration.accessToken) {
      throw new Error('No access token available');
    }

    if (!integration.expiresAt || !integration.refreshToken) {
      return integration.accessToken;
    }

    // If token expires within 5 minutes, refresh it
    if (ApolloAuthService.isTokenExpiringSoon(integration.expiresAt)) {
      try {
        logger.info(`Refreshing Apollo access token for integration ${integration.id}`);
        const refreshedTokens = await ApolloAuthService.refreshAccessToken(integration.refreshToken);

        // Update the integration with new tokens
        await IntegrationsFirestoreService.refreshToken(integration.id, {
          access_token: refreshedTokens.access_token,
          refresh_token: refreshedTokens.refresh_token,
          expires_in: refreshedTokens.expires_in,
          token_type: refreshedTokens.token_type,
          scope: refreshedTokens.scope
        });

        return refreshedTokens.access_token;
      } catch (error) {
        logger.error('Failed to refresh Apollo access token:', error);
        throw new Error('Failed to refresh Apollo access token');
      }
    }

    return integration.accessToken;
  };

  const accessToken = await ensureValidApolloAccessToken(apolloIntegration);

  // Create ApolloService with OAuth token
  const apolloService = new ApolloService(accessToken, true); // useOAuth = true

  return {
    service: apolloService,
    integration: apolloIntegration
  };
}

// Helper function to fetch all results with pagination
async function fetchAllResults(
  apolloService: ApolloService,
  searchParams: any,
  maxResults: number
): Promise<any[]> {
  const allResults: any[] = [];
  let page = 1;
  const perPage = Math.min(100, maxResults); // Apollo max per page is 100

  while (allResults.length < maxResults) {
    const params = {
      ...searchParams,
      page,
      per_page: Math.min(perPage, maxResults - allResults.length)
    };

    logger.info(`Fetching page ${page}`, { currentResults: allResults.length, maxResults });

    const response = await apolloService.searchPeople(params);
    const people = response.people || [];

    if (people.length === 0) {
      logger.info(`No more results found at page ${page}`);
      break; // No more results
    }

    allResults.push(...people);

    // Check if we've reached the last page
    if (people.length < perPage || allResults.length >= maxResults) {
      break;
    }

    page++;

    // Add small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  logger.info(`Pagination complete. Total results: ${allResults.length}`);
  return allResults.slice(0, maxResults); // Ensure we don't exceed maxResults
}

// Helper function to calculate relevance score for a contact based on thesis
function scoreContact(person: any, thesisCriteria: any): number {
  let score = 0;

  if (!person.organization) {
    return score;
  }

  // Title match (high weight = 10 points)
  if (thesisCriteria.jobTitles && person.title) {
    const requestedTitles = thesisCriteria.jobTitles.toLowerCase().split(',').map((t: string) => t.trim());
    const personTitle = person.title.toLowerCase();
    const titleMatch = requestedTitles.some((t: string) =>
      personTitle.includes(t) || t.includes(personTitle)
    );
    if (titleMatch) score += 10;
  }

  // Keywords match in company description (medium weight = 5 points per keyword)
  if (thesisCriteria.keywords && person.organization.short_description) {
    const keywords = thesisCriteria.keywords.toLowerCase().split(/[\s,]+/).filter((k: string) => k.length > 2);
    const description = person.organization.short_description.toLowerCase();
    const matchCount = keywords.filter((k: string) => description.includes(k)).length;
    score += matchCount * 5;
  }

  // Technology match (medium weight = 3 points per tech)
  if (thesisCriteria.technologies && person.organization.technologies) {
    const requestedTechs = thesisCriteria.technologies.toLowerCase().split(',').map((t: string) => t.trim());
    const orgTechs = person.organization.technologies.map((t: string) => t.toLowerCase());
    const techMatches = requestedTechs.filter((t: string) =>
      orgTechs.some((ot: string) => ot.includes(t) || t.includes(ot))
    ).length;
    score += techMatches * 3;
  }

  // Location match (low weight = 2 points)
  if (thesisCriteria.location) {
    const requestedLocation = thesisCriteria.location.toLowerCase();
    const orgLocation = `${person.organization.city || ''} ${person.organization.state || ''} ${person.organization.country || ''}`.toLowerCase();
    if (orgLocation.includes(requestedLocation)) {
      score += 2;
    }
  }

  // Company size match (low weight = 1 point)
  if (thesisCriteria.companySizeRange && person.organization.employee_count) {
    try {
      const sizeRange = thesisCriteria.companySizeRange.split(',').map((n: string) => parseInt(n.trim()));
      if (sizeRange.length === 2 && !isNaN(sizeRange[0]) && !isNaN(sizeRange[1])) {
        const [min, max] = sizeRange;
        if (person.organization.employee_count >= min && person.organization.employee_count <= max) {
          score += 1;
        }
      }
    } catch (e) {
      // Skip if parsing fails
    }
  }

  // Email confidence bonus
  if (person.email && person.email !== 'email_not_unlocked') {
    score += 2;
  }

  return score;
}

/**
 * Extract domain from organization object with fallback chain
 * Tries: primary_domain -> website_url extraction -> cleaned domain
 */
function extractDomainFromOrganization(organization?: any): string | undefined {
  if (!organization) return undefined;
  
  // First try primary_domain
  if (organization.primary_domain) {
    return cleanDomain(organization.primary_domain);
  }
  
  // Fallback to website_url
  if (organization.website_url) {
    try {
      const url = new URL(organization.website_url);
      return cleanDomain(url.hostname);
    } catch (e) {
      // If URL parsing fails, try cleaning the string directly
      return cleanDomain(organization.website_url);
    }
  }
  
  return undefined;
}

/**
 * Get best phone number from phone_numbers array
 * Prefers: mobile/direct > sanitized_number > raw_number
 */
function getBestPhoneNumber(phoneNumbers?: Array<{
  raw_number?: string;
  sanitized_number?: string;
  type?: string;
}>): string {
  if (!phoneNumbers || phoneNumbers.length === 0) return '';
  
  // Prefer mobile phones
  const mobile = phoneNumbers.find(p => 
    p.type?.toLowerCase().includes('mobile') && p.sanitized_number
  );
  if (mobile) return mobile.sanitized_number!;
  
  // Prefer direct lines
  const direct = phoneNumbers.find(p => 
    p.type?.toLowerCase().includes('direct') && p.sanitized_number
  );
  if (direct) return direct.sanitized_number!;
  
  // Return first available sanitized number
  const firstSanitized = phoneNumbers.find(p => p.sanitized_number);
  if (firstSanitized) return firstSanitized.sanitized_number!;
  
  // Last resort: raw number
  const firstRaw = phoneNumbers.find(p => p.raw_number);
  return firstRaw?.raw_number || '';
}

/**
 * Enrich contact with retry logic for transient failures
 */
async function enrichWithRetry(
  apolloService: ApolloService,
  enrichFn: () => Promise<any>,
  maxRetries: number = 2
): Promise<any> {
  let lastError: any = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[ENRICH RETRY] Attempt ${attempt + 1} of ${maxRetries + 1}`);
      const result = await enrichFn();
      console.log(`[ENRICH RETRY] Result:`, {
        hasResult: !!result,
        hasEmail: !!result?.email,
        email: result?.email || 'NONE',
        hasPhones: !!(result?.phone_numbers?.length),
        phoneCount: result?.phone_numbers?.length || 0
      });
      if (result) {
        if (attempt > 0) {
          logger.info(`Enrichment succeeded on retry attempt ${attempt + 1}`);
        }
        return result;
      }
    } catch (error: any) {
      lastError = error;
      
      console.error(`[ENRICH RETRY] Attempt ${attempt + 1} failed:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url
      });
      
      // Don't retry on client errors (400, 404)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        logger.warn('Enrichment failed with client error, not retrying', {
          status: error.response.status,
          error: error.message,
          responseData: error.response.data,
          url: error.config?.url
        });
        console.error('[ENRICH RETRY] Client error - stopping retries:', error.response.data);
        break;
      }
      
      // Retry on network/timeout/server errors
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 100; // Exponential backoff: 100ms, 200ms
        logger.warn(`Enrichment attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
          error: error.message,
          status: error.response?.status
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error('[ENRICH RETRY] All attempts failed:', {
    attempts: maxRetries + 1,
    lastError: lastError?.message,
    lastStatus: lastError?.response?.status,
    lastResponse: lastError?.response?.data
  });
  
  logger.error('Enrichment failed after all retries', {
    attempts: maxRetries + 1,
    error: lastError?.message,
    status: lastError?.response?.status,
    responseData: lastError?.response?.data
  });
  return null;
}

// Helper function for multi-tier fallback search strategy
async function multiTierSearch(
  apolloService: ApolloService,
  thesisCriteria: any,
  contactsToFind: number
): Promise<{ results: any[]; tier: string; tierDescription: string }> {
  let results: any[] = [];
  let tier = 'tier1';
  let tierDescription = 'Full criteria search';

  // Tier 1: Full criteria (strict)
  // NOTE: Search endpoint does NOT support reveal_personal_emails or reveal_phone_number
  // Those parameters only work on the enrichment endpoint (/people/match)
  // We'll enrich each search result separately to get emails and phone numbers
  const tier1Params: any = {
    per_page: Math.min(contactsToFind, 100),
    page: 1
    // Note: Advanced filters like contact_email_status and prospected_by_current_team
    // can be too restrictive - removed for broader search results
  };

  if (thesisCriteria.jobTitles && thesisCriteria.jobTitles.trim()) {
    tier1Params.person_titles = thesisCriteria.jobTitles.split(',').map((t: string) => t.trim()).filter((t: string) => t);
  }
  if (thesisCriteria.keywords && thesisCriteria.keywords.trim()) {
    tier1Params.q_keywords = thesisCriteria.keywords;
  }
  if (thesisCriteria.location && thesisCriteria.location.trim()) {
    tier1Params.organization_locations = [thesisCriteria.location];
  }
  if (thesisCriteria.companySizeRange && thesisCriteria.companySizeRange.trim()) {
    tier1Params.organization_num_employees_ranges = [thesisCriteria.companySizeRange];
  }
  if (thesisCriteria.technologies && thesisCriteria.technologies.trim()) {
    tier1Params.technologies = thesisCriteria.technologies.split(',').map((t: string) => t.trim()).filter((t: string) => t);
  }
  if (thesisCriteria.fundingStage) {
    const fundingStageMap: any = {
      'seed': ['seed'],
      'series-a': ['series_a'],
      'series-b': ['series_b'],
      'series-c': ['series_c', 'series_d', 'series_e'],
      'growth': ['growth'],
      'private-equity': ['private_equity'],
      'public': ['public'],
      'bootstrapped': ['bootstrapped']
    };
    if (fundingStageMap[thesisCriteria.fundingStage]) {
      tier1Params.funding_stage_list = fundingStageMap[thesisCriteria.fundingStage];
    }
  }

  // Add revenue range if provided
  if (thesisCriteria.revenue) {
    // Parse revenue range if it's in a recognizable format
    const revenueMatch = thesisCriteria.revenue.match(/(\d+)[MBK]?-(\d+)[MBK]?/i);
    if (revenueMatch) {
      tier1Params.revenue_range = {
        min: parseInt(revenueMatch[1]) * 1000000, // Assume millions
        max: parseInt(revenueMatch[2]) * 1000000
      };
    }
  }

  // Only search if we have at least one search criterion
  const hasSearchCriteria = tier1Params.person_titles || tier1Params.q_keywords || tier1Params.organization_locations;

  if (hasSearchCriteria) {
    logger.info('Tier 1: Searching with full criteria', tier1Params);
    const tier1Response = await apolloService.searchPeople(tier1Params);
    results = tier1Response.people || [];

    if (results.length >= 5) {
      return { results, tier, tierDescription };
    }
  } else {
    logger.warn('Tier 1: No search criteria provided, skipping to Tier 2');
  }

  // Tier 2: Remove numeric constraints, keep categorical (location, technologies, keywords, titles)
  tier = 'tier2';
  tierDescription = 'Relaxed search - removed size and funding filters';

  const tier2Params: any = {
    per_page: Math.min(contactsToFind, 100),
    page: 1
  };

  if (thesisCriteria.jobTitles && thesisCriteria.jobTitles.trim()) {
    tier2Params.person_titles = thesisCriteria.jobTitles.split(',').map((t: string) => t.trim()).filter((t: string) => t);
  }
  if (thesisCriteria.keywords && thesisCriteria.keywords.trim()) {
    tier2Params.q_keywords = thesisCriteria.keywords;
  }
  if (thesisCriteria.location && thesisCriteria.location.trim()) {
    tier2Params.organization_locations = [thesisCriteria.location];
  }
  if (thesisCriteria.technologies && thesisCriteria.technologies.trim()) {
    tier2Params.technologies = thesisCriteria.technologies.split(',').map((t: string) => t.trim()).filter((t: string) => t);
  }

  const hasTier2Criteria = tier2Params.person_titles || tier2Params.q_keywords || tier2Params.organization_locations;

  if (hasTier2Criteria) {
    logger.info('Tier 2: Searching without numeric filters', tier2Params);
    const tier2Response = await apolloService.searchPeople(tier2Params);
    results = tier2Response.people || [];

    if (results.length >= 5) {
      return { results, tier, tierDescription };
    }
  } else {
    logger.warn('Tier 2: No search criteria available, skipping to Tier 3');
  }

  // Tier 3: Core fields only (titles + keywords)
  tier = 'tier3';
  tierDescription = 'Broad search - only titles and keywords';

  const tier3Params: any = {
    per_page: Math.min(contactsToFind, 100),
    page: 1
  };

  if (thesisCriteria.jobTitles && thesisCriteria.jobTitles.trim()) {
    tier3Params.person_titles = thesisCriteria.jobTitles.split(',').map((t: string) => t.trim()).filter((t: string) => t);
  }
  if (thesisCriteria.keywords && thesisCriteria.keywords.trim()) {
    tier3Params.q_keywords = thesisCriteria.keywords;
  }

  const hasTier3Criteria = tier3Params.person_titles || tier3Params.q_keywords;

  if (hasTier3Criteria) {
    logger.info('Tier 3: Searching with core fields only', tier3Params);
    const tier3Response = await apolloService.searchPeople(tier3Params);
    results = tier3Response.people || [];
  } else {
    logger.error('No search criteria available in any tier - cannot perform search');
    throw new Error('Please provide at least one search criterion (job titles or keywords)');
  }

  return { results, tier, tierDescription };
}

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
 * Validate Apollo OAuth integration or API key
 */
router.post('/validate-key', auth, async (req, res) => {
  try {
    const userId = (req as any).userId || (req as any).user?.id || (req as any).user?.uid;
    const { provider, apiKey } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (provider === 'apollo') {
      // For Apollo, check OAuth integration OR validate provided API key
      try {
        const { service } = await getApolloServiceForUser(userId, apiKey);
        const isValid = await service.validateApiKey();

        if (isValid) {
          const message = apiKey ? 'Apollo API key is valid' : 'Apollo OAuth integration is valid and active';
          logger.info('Apollo validation successful', { userId, usingApiKey: !!apiKey });
          return res.json({
            success: true,
            valid: true,
            message
          });
        } else {
          const message = apiKey ? 'Apollo API key is invalid' : 'Apollo OAuth integration is invalid';
          logger.warn('Apollo validation failed - invalid key/token', { userId, usingApiKey: !!apiKey });
          return res.json({
            success: true,
            valid: false,
            message
          });
        }
      } catch (error: any) {
        logger.warn('Apollo validation error', { userId, usingApiKey: !!apiKey, error: error.message });

        let message;
        if (apiKey) {
          // Check for specific Apollo error messages
          const responseData = error.response?.data;
          if (responseData?.message?.includes('payment')) {
            message = 'Apollo API key is valid but there is a payment issue with your Apollo account. Please check your billing settings.';
          } else if (error.response?.status === 401 || error.response?.status === 403) {
            message = 'Apollo API key is invalid or lacks required permissions.';
          } else {
            message = 'Apollo API key validation failed. Please check your key and account status.';
          }
        } else {
          message = error.message;
        }

        return res.json({
          success: true,
          valid: false,
          message
        });
      }
    }

    // For other providers (existing logic)
    if (!provider || !apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Provider and API key are required for validation'
      });
    }

    // ... (existing validation logic for other providers would go here)

    return res.json({
      success: false,
      valid: false,
      message: `Validation not implemented for provider: ${provider}`
    });
  } catch (error: any) {
    logger.error('API key validation error', { error: error.message, stack: error.stack });
    res.status(500).json({
      success: false,
      valid: false,
      message: 'Internal server error during validation'
    });
  }
});

/**
 * POST /api/data-enrichment/upload-and-enrich
 * Upload Excel file and enrich contacts using Apollo OAuth integration
 */
router.post('/upload-and-enrich', auth, upload.single('file'), async (req, res) => {
  try {
    const userId = (req as any).userId || (req as any).user?.id || (req as any).user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    // Get Apollo service from user's OAuth integration or API key
    const apiKey = req.body.apiKey;
    const { service: apolloService } = await getApolloServiceForUser(userId, apiKey);

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
            organization_website: bestMatch.organization?.website_url || bestMatch.organization?.primary_domain || person.domain || '',
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
            website: enriched.organization_website || enriched.organization_domain
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
router.post('/enrich-single', auth, async (req, res) => {
  try {
    const userId = (req as any).userId || (req as any).user?.id || (req as any).user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { ...searchParams } = req.body;

    // Get Apollo service from user's OAuth integration or API key
    const apiKey = req.body.apiKey;
    const { service: apolloService } = await getApolloServiceForUser(userId, apiKey);

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
router.post('/search-contacts', auth, async (req, res) => {
  console.error('🔥🔥🔥🔥🔥 [SEARCH-CONTACTS] ROUTE HIT - Starting contact search 🔥🔥🔥🔥🔥');
  console.log('🔥🔥🔥🔥🔥 [SEARCH-CONTACTS] ROUTE HIT - Starting contact search 🔥🔥🔥🔥🔥');
  process.stdout.write('🔥🔥🔥 [SEARCH-CONTACTS] ROUTE HIT\n');
  try {
    const userId = (req as any).userId || (req as any).user?.id || (req as any).user?.uid;
    
    if (!userId) {
      console.error('❌ [SEARCH-CONTACTS] No userId found');
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    console.log('🔥 [SEARCH-CONTACTS] Endpoint called with body:', JSON.stringify(req.body, null, 2));
    const { contactType, thesisCriteria, brokerCriteria, investorCriteria, searchQuery, contactsToFind } = req.body;

    // Validate criteria based on contact type
    if (contactType === 'people') {
      if (!thesisCriteria) {
        return res.status(400).json({
          success: false,
          error: 'Search criteria must be provided for people search'
        });
      }
      // At least one search criterion should be provided
      const hasAnyCriteria = thesisCriteria.jobTitles || thesisCriteria.keywords ||
                             thesisCriteria.location || thesisCriteria.companySizeRange;
      if (!hasAnyCriteria) {
        return res.status(400).json({
          success: false,
          error: 'Please provide at least one search criterion (job titles, keywords, location, or company size)'
        });
      }
    } else if (contactType === 'brokers') {
      // Allow empty search query for brokers - we'll search for all brokers
      // if (!searchQuery || !searchQuery.trim()) {
      //   return res.status(400).json({
      //     success: false,
      //     error: 'Please describe what kind of brokers you are looking for'
      //   });
      // }
    } else if (contactType === 'investors') {
      // No validation needed for investors - structured form ensures valid data
    }

    // Get Apollo service from user's OAuth integration or API key
    const apiKey = req.body.apiKey;
    const { service: apolloService } = await getApolloServiceForUser(userId, apiKey);

    logger.info('Starting contact search', {
      userId,
      contactType,
      contactsToFind
    });

    // NOTE: Search endpoint does NOT support reveal_personal_emails or reveal_phone_number
    // We'll enrich each search result separately using /people/match endpoint
    let searchParams: any = {
      per_page: Math.min(contactsToFind || 10, 100), // Limit to 100
      page: 1
    };

    let searchResults: any[] = [];
    let searchTier = '';
    let searchTierDescription = '';

    // Handle different contact types
    if (contactType === 'people') {
      // DIRECT PEOPLE SEARCH using Apollo's mixed_people/search endpoint
      logger.info('Starting people search with multi-tier fallback', { thesisCriteria });

      // Use multi-tier search strategy for better results
      const { results, tier, tierDescription } = await multiTierSearch(
        apolloService,
        thesisCriteria,
        contactsToFind || 10
      );

      searchResults = results;
      searchTier = tier;
      searchTierDescription = tierDescription;

      logger.info(`Multi-tier search complete. Tier used: ${tier} (${tierDescription}). Found ${searchResults.length} contacts`);

      // If we need more results than what we got, use pagination
      if (searchResults.length < contactsToFind && searchResults.length > 0) {
        logger.info(`Fetching additional pages to reach ${contactsToFind} contacts...`);

        // Rebuild search params from the tier that succeeded
        const searchParams: any = {
          per_page: Math.min(contactsToFind || 10, 100),
          page: 1
        };

        if (thesisCriteria.jobTitles && thesisCriteria.jobTitles.trim()) {
          searchParams.person_titles = thesisCriteria.jobTitles.split(',').map((t: string) => t.trim()).filter((t: string) => t);
        }
        if (thesisCriteria.keywords && thesisCriteria.keywords.trim()) {
          searchParams.q_keywords = thesisCriteria.keywords;
        }

        // Add remaining filters based on tier
        if (tier === 'tier1') {
          // Full criteria
          if (thesisCriteria.location && thesisCriteria.location.trim()) {
            searchParams.organization_locations = [thesisCriteria.location];
          }
          if (thesisCriteria.companySizeRange && thesisCriteria.companySizeRange.trim()) {
            searchParams.organization_num_employees_ranges = [thesisCriteria.companySizeRange];
          }
          if (thesisCriteria.technologies && thesisCriteria.technologies.trim()) {
            searchParams.technologies = thesisCriteria.technologies.split(',').map((t: string) => t.trim()).filter((t: string) => t);
          }
          if (thesisCriteria.fundingStage) {
            const fundingStageMap: any = {
              'seed': ['seed'],
              'series-a': ['series_a'],
              'series-b': ['series_b'],
              'series-c': ['series_c', 'series_d', 'series_e'],
              'growth': ['growth'],
              'private-equity': ['private_equity'],
              'public': ['public'],
              'bootstrapped': ['bootstrapped']
            };
            if (fundingStageMap[thesisCriteria.fundingStage]) {
              searchParams.funding_stage_list = fundingStageMap[thesisCriteria.fundingStage];
            }
          }
        } else if (tier === 'tier2') {
          // No numeric filters
          if (thesisCriteria.location && thesisCriteria.location.trim()) {
            searchParams.organization_locations = [thesisCriteria.location];
          }
          if (thesisCriteria.technologies && thesisCriteria.technologies.trim()) {
            searchParams.technologies = thesisCriteria.technologies.split(',').map((t: string) => t.trim()).filter((t: string) => t);
          }
        }
        // tier3 already has minimal params

        // Fetch all results with pagination
        searchResults = await fetchAllResults(apolloService, searchParams, contactsToFind);
        logger.info(`Pagination complete. Total results: ${searchResults.length}`);
      }

      // Score and sort results by relevance
      searchResults.forEach((person: any) => {
        person.relevance_score = scoreContact(person, thesisCriteria);
      });

      searchResults.sort((a: any, b: any) => (b.relevance_score || 0) - (a.relevance_score || 0));

      logger.info(`Results scored and sorted. Top score: ${searchResults[0]?.relevance_score || 0}`);

    } else if (contactType === 'brokers') {
      // Validate brokerCriteria
      const validBrokerCriteria = brokerCriteria || {};

      // Brokers search - use structured criteria
      searchParams.person_titles = [
        'Investment Banker', 'M&A Advisor', 'Deal Maker', 'Transaction Advisor',
        'Investment Banking', 'Corporate Finance', 'Business Broker', 'Broker',
        'M&A', 'Mergers and Acquisitions'
      ];

      // Apply structured filters - combine keywords instead of overwriting
      const brokerKeywordParts: string[] = [];
      if (validBrokerCriteria.industries) {
        brokerKeywordParts.push(validBrokerCriteria.industries);
      }
      if (validBrokerCriteria.keywords) {
        brokerKeywordParts.push(validBrokerCriteria.keywords);
      }
      if (brokerKeywordParts.length > 0) {
        searchParams.q_keywords = brokerKeywordParts.join(', ');
      }

      if (validBrokerCriteria.location) {
        searchParams.organization_locations = [validBrokerCriteria.location];
      }
      if (validBrokerCriteria.dealSize) {
        // Map deal size to employee ranges
        const dealSizeMap: any = {
          '1M-10M': ['51,100', '101,200'],
          '10M-50M': ['201,500', '501,1000'],
          '50M-100M': ['501,1000', '1001,5000'],
          '100M-500M': ['1001,5000', '5001,10000'],
          '500M+': ['5001,10000', '10001,50000']
        };
        if (dealSizeMap[validBrokerCriteria.dealSize]) {
          searchParams.organization_num_employees_ranges = dealSizeMap[validBrokerCriteria.dealSize];
        }
      }

      logger.info('Broker search parameters', { searchParams, brokerCriteria: validBrokerCriteria });

      const results = await apolloService.searchPeople(searchParams);
      searchResults = results.people || [];

    } else if (contactType === 'investors') {
      // Validate investorCriteria
      const validInvestorCriteria = investorCriteria || {};

      // Investors search - use structured criteria
      searchParams.person_titles = [
        'Partner', 'Principal', 'Managing Director', 'Investment Partner',
        'Venture Partner', 'Angel Investor', 'Fund Manager', 'Investment Director',
        'Investor', 'VC', 'Venture Capital', 'Private Equity'
      ];

      // Apply structured filters - combine keywords instead of overwriting
      const investorKeywordParts: string[] = [];
      if (validInvestorCriteria.industries) {
        investorKeywordParts.push(validInvestorCriteria.industries);
      }
      if (validInvestorCriteria.keywords) {
        investorKeywordParts.push(validInvestorCriteria.keywords);
      }
      if (investorKeywordParts.length > 0) {
        searchParams.q_keywords = investorKeywordParts.join(', ');
      }

      if (validInvestorCriteria.location) {
        searchParams.organization_locations = [validInvestorCriteria.location];
      }

      logger.info('Investor search parameters', { searchParams, investorCriteria: validInvestorCriteria });

      const results = await apolloService.searchPeople(searchParams);
      searchResults = results.people || [];
    }

    if (!searchResults || searchResults.length === 0) {
      logger.warn('No contacts found matching criteria');
      return res.json({
        success: true,
        contacts: [],
        summary: {
          total: 0,
          found: 0,
          successRate: 0
        },
        message: `No ${contactType} found matching criteria`
      });
    }

    // Process and format the results, enriching each contact to get complete data including phone numbers
    const discoveredContacts = [];

    console.error('🚀🚀🚀 [ENRICHMENT LOOP] Starting enrichment for', searchResults.length, 'contacts');
    console.log('🚀🚀🚀 [ENRICHMENT LOOP] Starting enrichment for', searchResults.length, 'contacts');
    logger.info('Enriching search results to get complete contact data including phone numbers', {
      totalResults: searchResults.length
    });

    for (let i = 0; i < searchResults.length; i++) {
      const person = searchResults[i];
      
      console.error(`🔄🔄🔄 [ENRICHMENT LOOP] Processing contact ${i + 1}/${searchResults.length}:`, {
        name: `${person.first_name} ${person.last_name}`,
        id: person.id || 'NO_ID',
        hasEmail: !!person.email,
        email: person.email || 'NONE',
        hasPhone: !!(person.phone_numbers?.length),
        phoneCount: person.phone_numbers?.length || 0
      });
      console.log(`🔄 [ENRICHMENT LOOP] Processing contact ${i + 1}/${searchResults.length}:`, {
        name: `${person.first_name} ${person.last_name}`,
        id: person.id || 'NO_ID',
        hasEmail: !!person.email,
        email: person.email || 'NONE',
        hasPhone: !!(person.phone_numbers?.length),
        phoneCount: person.phone_numbers?.length || 0
      });

      // Extract domain with fallback chain
      const domain = extractDomainFromOrganization(person.organization);
      
      // Start with search result data as fallback - USE WHATEVER WE HAVE
      let enrichedData = {
        email: person.email || '',
        phone: getBestPhoneNumber(person.phone_numbers) || '',
        title: person.title || '',
        linkedin_url: person.linkedin_url || '',
        photo_url: person.photo_url || '',
        city: person.city || '',
        state: person.state || '',
        organization: person.organization
      };
      
      // Only filter out obvious placeholders, keep everything else
      if (enrichedData.email === 'email_not_unlocked' || enrichedData.email.includes('email_not_unlocked')) {
        enrichedData.email = '';
      }

      console.log('🔍 [ENRICHMENT] Initial search result data:', {
        name: `${person.first_name} ${person.last_name}`,
        hasEmail: !!enrichedData.email,
        email: enrichedData.email || 'NONE',
        hasPhone: !!enrichedData.phone,
        phone: enrichedData.phone || 'NONE',
        phoneNumbersFromSearch: person.phone_numbers || [],
        hasWebsite: !!(person.organization?.website_url || person.organization?.primary_domain),
        websiteUrl: person.organization?.website_url || 'none',
        primaryDomain: person.organization?.primary_domain || 'none',
        extractedDomain: domain || 'NONE'
      });

      logger.info('Initial search result data', {
        name: `${person.first_name} ${person.last_name}`,
        hasEmail: !!enrichedData.email,
        hasPhone: !!enrichedData.phone,
        phoneFromSearch: enrichedData.phone || 'none',
        hasWebsite: !!(person.organization?.website_url || person.organization?.primary_domain),
        websiteUrl: person.organization?.website_url || 'none',
        primaryDomain: person.organization?.primary_domain || 'none',
        extractedDomain: domain || 'none'
      });

      // Enrich each contact to get phone numbers and complete data
      let enrichmentResult = null;
      try {
        console.log('🚀 [ENRICHMENT] Starting enrichment for:', {
          name: `${person.first_name} ${person.last_name}`,
          company: person.organization?.name,
          domain: domain || 'NONE',
          hasApolloId: !!person.id,
          apolloId: person.id || 'NONE',
          index: i + 1,
          total: searchResults.length
        });

        logger.info('Enriching contact for complete data', {
          name: `${person.first_name} ${person.last_name}`,
          company: person.organization?.name,
          index: i + 1,
          total: searchResults.length,
          domain: domain || 'none',
          hasApolloId: !!person.id
        });

        // OPTIMIZED ENRICHMENT: Use OptimizedEnrichmentService for faster, smarter enrichment
        // This service:
        // 1. Uses /people/match endpoint (correct endpoint for phone/email reveal)
        // 2. Extracts emails from multiple sources (email field, personal_emails array)
        // 3. Returns immediately with available data (work phones, emails)
        // 4. Tracks requests for webhook matching (phone numbers arrive later via webhook)
        
        const cleanEmail = person.email &&
                          person.email !== 'email_not_unlocked' &&
                          !person.email.includes('email_not_unlocked') ? person.email : undefined;

        console.log('🚀 [OPTIMIZED ENRICHMENT] Starting optimized enrichment');
        
        // Try enrichment with Apollo ID first (highest success rate)
        const enrichmentParams: any = {
          domain: domain,
          organization_name: person.organization?.name,
          first_name: person.first_name,
          last_name: person.last_name
        };
        
        if (person.id) {
          enrichmentParams.id = person.id;
        }
        if (cleanEmail) {
          enrichmentParams.email = cleanEmail;
        }

        const optimizedResult = await OptimizedEnrichmentService.enrichPerson(
          apolloService,
          enrichmentParams,
          {
            userId: userId,
            waitForWebhook: false, // Don't wait - return immediately with available data
            webhookWaitTime: 0 // No wait time for speed
          }
        );

        if (optimizedResult.person) {
          enrichmentResult = optimizedResult.person;
          
          // Use optimized email extraction (checks multiple sources)
          if (optimizedResult.email) {
            enrichedData.email = optimizedResult.email;
          }
          
          // Use optimized phone extraction (prefers mobile, then work, then any)
          if (optimizedResult.phone) {
            enrichedData.phone = optimizedResult.phone;
          }
          
          // Update other fields from enrichment
          if (optimizedResult.person.title) enrichedData.title = optimizedResult.person.title;
          if (optimizedResult.person.linkedin_url) enrichedData.linkedin_url = optimizedResult.person.linkedin_url;
          if (optimizedResult.person.photo_url) enrichedData.photo_url = optimizedResult.person.photo_url;
          if (optimizedResult.person.city) enrichedData.city = optimizedResult.person.city;
          if (optimizedResult.person.state) enrichedData.state = optimizedResult.person.state;
          if (optimizedResult.person.organization) enrichedData.organization = optimizedResult.person.organization;
          
          console.log('✅ [OPTIMIZED ENRICHMENT] Enrichment complete:', {
            name: `${person.first_name} ${person.last_name}`,
            email: enrichedData.email || 'NONE',
            phone: enrichedData.phone || 'NONE',
            emailSource: optimizedResult.source.email,
            phoneSource: optimizedResult.source.phone,
            phoneCount: optimizedResult.phoneNumbers.length,
            webhookPending: optimizedResult.webhookPending
          });

          logger.info('Optimized enrichment successful', {
            name: `${person.first_name} ${person.last_name}`,
            hasEmail: !!enrichedData.email,
            hasPhone: !!enrichedData.phone,
            emailSource: optimizedResult.source.email,
            phoneSource: optimizedResult.source.phone,
            webhookPending: optimizedResult.webhookPending
          });
        }

        // STEP 4: If we still don't have an email, try Email Finder API directly
        if (!enrichedData.email || enrichedData.email === 'email_not_unlocked' || enrichedData.email.includes('email_not_unlocked')) {
          try {
            const emailDomain = domain || extractDomainFromOrganization(enrichedData.organization || person.organization);
            console.log('📧 [ENRICHMENT] Step 4: No valid email found, trying Email Finder API', {
              domain: emailDomain || 'NONE'
            });

            logger.info('No valid email found, trying Email Finder API', {
              name: `${person.first_name} ${person.last_name}`,
              company: person.organization?.name,
              domain: emailDomain
            });

            const emailFinderResult = await apolloService.findEmail({
              first_name: person.first_name,
              last_name: person.last_name,
              organization_name: person.organization?.name || enrichedData.organization?.name,
              domain: emailDomain
            });

            if (emailFinderResult?.email) {
              enrichedData.email = emailFinderResult.email;
              console.log('✅ [ENRICHMENT] Step 4 SUCCESS - Email Finder API found email:', emailFinderResult.email);
              logger.info('Email Finder API successful!', {
                name: `${person.first_name} ${person.last_name}`,
                email: emailFinderResult.email,
                confidence: emailFinderResult.confidence
              });
            } else {
              console.log('❌ [ENRICHMENT] Step 4 FAILED - Email Finder API returned no email');
              logger.warn('Email Finder API returned no email', {
                name: `${person.first_name} ${person.last_name}`
              });
            }
          } catch (emailError: any) {
            console.log('❌ [ENRICHMENT] Step 4 ERROR - Email Finder API error:', emailError.message);
            logger.error('Email Finder API error', {
              name: `${person.first_name} ${person.last_name}`,
              error: emailError.message
            });
          }
        }

        if (!enrichmentResult) {
          console.log('⚠️ [ENRICHMENT] No enrichment result, using search results');
          logger.warn('Contact enrichment returned no data, using search results', {
            name: `${person.first_name} ${person.last_name}`
          });
        }
      } catch (error: any) {
        console.error('❌ [ENRICHMENT] ERROR - Contact enrichment failed:', {
          message: error.message,
          stack: error.stack,
          response: error.response?.data,
          status: error.response?.status,
          name: `${person.first_name} ${person.last_name}`
        });
        logger.error('Contact enrichment failed, using search results', {
          name: `${person.first_name} ${person.last_name}`,
          error: error.message,
          status: error.response?.status,
          responseData: error.response?.data
        });
      }

      // Add small delay to respect rate limits (100ms between requests)
      await new Promise(resolve => setTimeout(resolve, 100));

      // Build final contact object with all fields computed from Apollo data
      // Extract email - use whatever we have, just filter out obvious placeholders
      let finalEmail = enrichedData.email || '';
      if (finalEmail === 'email_not_unlocked' || finalEmail.includes('email_not_unlocked')) {
        finalEmail = '';
      }
      
      // Extract phone - use whatever we have
      const finalPhone = enrichedData.phone || '';

      // Extract final domain with fallback
      const finalDomain = extractDomainFromOrganization(enrichedData.organization || person.organization);

      console.log('📝 [FINAL CONTACT BUILD] Before building:', {
        name: `${person.first_name} ${person.last_name}`,
        enrichedEmail: enrichedData.email || 'NONE',
        finalEmail: finalEmail || 'NONE',
        enrichedPhone: enrichedData.phone || 'NONE',
        finalPhone: finalPhone || 'NONE',
        hasEnrichmentResult: !!enrichmentResult
      });

      // Build complete contact object with all fields populated
      const finalContact = {
        id: person.id || enrichmentResult?.id,
        name: person.name || `${person.first_name} ${person.last_name}`.trim(),
        first_name: person.first_name || enrichmentResult?.first_name || '',
        last_name: person.last_name || enrichmentResult?.last_name || '',
        type: contactType, // Computed from search type
        title: enrichedData.title || '',
        email: finalEmail, // Use extracted email
        phone: finalPhone, // Use extracted phone
        linkedin_url: enrichedData.linkedin_url || '',
        company: enrichedData.organization?.name || person.organization?.name || '',
        website: enrichedData.organization?.website_url || enrichedData.organization?.primary_domain || person.organization?.website_url || '',
        company_domain: finalDomain || enrichedData.organization?.primary_domain || person.organization?.primary_domain || '',
        company_industry: enrichedData.organization?.industry || person.organization?.industry || '',
        company_size: enrichedData.organization?.employee_count || person.organization?.employee_count || '',
        location: `${enrichedData.city || ''}, ${enrichedData.state || ''}`.replace(/^,\s*|,\s*$/g, ''),
        photo_url: enrichedData.photo_url || person.photo_url || '',
        match_quality: 'thesis_match',
        apollo_confidence: enrichmentResult?.extrapolated_email_confidence || person.extrapolated_email_confidence || 0,
        email_status: finalEmail ? 'available' : 'not_unlocked',
        email_unlocked: !!finalEmail,
        phone_available: !!finalPhone,
        contactType: contactType, // Add contact type for identification
        relevance_score: person.relevance_score || 0 // Include relevance score
      };

      console.log('📋 [FINAL CONTACT] Built contact object:', {
        name: finalContact.name,
        email: finalContact.email || 'NONE',
        phone: finalContact.phone || 'NONE',
        title: finalContact.title || 'NONE',
        company: finalContact.company || 'NONE',
        website: finalContact.website || 'NONE',
        domain: finalContact.company_domain || 'NONE',
        linkedin: finalContact.linkedin_url || 'NONE',
        location: finalContact.location || 'NONE',
        hasPhoto: !!finalContact.photo_url,
        emailUnlocked: finalContact.email_unlocked,
        phoneAvailable: finalContact.phone_available
      });

      logger.info('Final contact object built', {
        name: finalContact.name,
        hasEmail: !!finalContact.email,
        email: finalContact.email || 'none',
        hasPhone: !!finalContact.phone,
        phone: finalContact.phone || 'none',
        hasTitle: !!finalContact.title,
        hasCompany: !!finalContact.company,
        hasWebsite: !!finalContact.website,
        website: finalContact.website || 'none',
        company_domain: finalContact.company_domain || 'none',
        hasLinkedIn: !!finalContact.linkedin_url,
        hasLocation: !!finalContact.location,
        hasPhoto: !!finalContact.photo_url
      });

      discoveredContacts.push(finalContact);
    }

    // Filter out contacts with locked emails if needed
    const usefulContacts = discoveredContacts.filter(contact => 
      contact.email || contact.phone || contact.linkedin_url || contact.company
    );

    // Calculate enrichment statistics
    const stats = {
      totalFound: searchResults.length,
      usefulContacts: usefulContacts.length,
      emailsUnlocked: usefulContacts.filter(c => c.email_unlocked).length,
      phonesFound: usefulContacts.filter(c => c.phone_available).length,
      websitesFound: usefulContacts.filter(c => c.website).length,
      linkedInFound: usefulContacts.filter(c => c.linkedin_url).length,
      titlesFound: usefulContacts.filter(c => c.title).length,
      companiesFound: usefulContacts.filter(c => c.company).length,
      domainsFound: usefulContacts.filter(c => c.company_domain).length,
      locationsFound: usefulContacts.filter(c => c.location).length,
      photosFound: usefulContacts.filter(c => c.photo_url).length,
      fullContactsWithAllFields: usefulContacts.filter(c => c.email && c.phone && c.website && c.linkedin_url).length
    };

    console.log('📊 [ENRICHMENT SUMMARY] Contact search and enrichment completed:', {
      contactType,
      ...stats,
      emailRate: stats.usefulContacts > 0 ? `${Math.round((stats.emailsUnlocked / stats.usefulContacts) * 100)}%` : '0%',
      phoneRate: stats.usefulContacts > 0 ? `${Math.round((stats.phonesFound / stats.usefulContacts) * 100)}%` : '0%',
      completeContacts: stats.fullContactsWithAllFields
    });

    logger.info('Contact search and enrichment completed', {
      contactType,
      ...stats,
      emailRate: stats.usefulContacts > 0 ? Math.round((stats.emailsUnlocked / stats.usefulContacts) * 100) : 0,
      phoneRate: stats.usefulContacts > 0 ? Math.round((stats.phonesFound / stats.usefulContacts) * 100) : 0
    });

    console.error('📤 [RESPONSE] Sending response with', usefulContacts.length, 'contacts');
    console.error('📤 [RESPONSE] First contact sample:', usefulContacts[0] ? {
      name: usefulContacts[0].name,
      email: usefulContacts[0].email || 'NO EMAIL',
      phone: usefulContacts[0].phone || 'NO PHONE'
    } : 'NO CONTACTS');
    
    res.json({
      success: true,
      contacts: usefulContacts,
      summary: {
        requested: contactsToFind || 10,
        found: usefulContacts.length,
        apolloResults: searchResults.length,
        fulfillmentRate: Math.round((usefulContacts.length / (contactsToFind || 10)) * 100),
        qualityRate: searchResults.length > 0
          ? Math.round((usefulContacts.length / searchResults.length) * 100)
          : 0,
        searchTier: searchTier,
        searchTierDescription: searchTierDescription,
        averageRelevanceScore: usefulContacts.length > 0
          ? Math.round(usefulContacts.reduce((sum, c) => sum + (c.relevance_score || 0), 0) / usefulContacts.length)
          : 0,
        enrichmentStats: {
          emailsFound: usefulContacts.filter(c => c.email_unlocked).length,
          phonesFound: usefulContacts.filter(c => c.phone_available).length,
          linkedInFound: usefulContacts.filter(c => c.linkedin_url).length,
          emailRate: usefulContacts.length > 0
            ? Math.round((usefulContacts.filter(c => c.email_unlocked).length / usefulContacts.length) * 100)
            : 0,
          phoneRate: usefulContacts.length > 0
            ? Math.round((usefulContacts.filter(c => c.phone_available).length / usefulContacts.length) * 100)
            : 0
        }
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
      'Website',
      'Company Domain',
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
      contact.website || '',
      contact.company_domain || '',
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

/**
 * POST /api/data-enrichment/organization-enrich
 * Enrich organization data from Excel file using Apollo Organization Enrichment API
 */
router.post('/organization-enrich', auth, upload.single('file'), async (req, res) => {
  try {
    const userId = (req as any).userId || (req as any).user?.id || (req as any).user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    logger.info('Starting organization enrichment process', {
      userId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    // Get Apollo service from user's OAuth integration or API key
    const apiKey = req.body.apiKey;
    const { service: apolloService } = await getApolloServiceForUser(userId, apiKey);

    // Parse Excel file to extract organization data
    const organizations = parseOrganizationExcelFile(req.file.buffer, req.file.originalname);
    
    if (organizations.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid organization data found in the uploaded file' 
      });
    }

    logger.info('Parsed organization data', { 
      totalOrganizations: organizations.length,
      sample: organizations.slice(0, 3)
    });

    // Enrich organizations using Apollo
    const enrichedResults = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < organizations.length; i++) {
      const org = organizations[i];
      logger.info(`Enriching organization ${i + 1}/${organizations.length}`, {
        company: org.company,
        domain: org.domain
      });

      try {
        const enrichedOrg = await enrichSingleOrganization(org, apolloService);
        enrichedResults.push(enrichedOrg);

        if (enrichedOrg.success) {
          successCount++;
        } else {
          failureCount++;
        }

        // Add delay between API calls to respect rate limits
        if (i < organizations.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        logger.error('Organization enrichment failed', {
          company: org.company,
          error: error.message
        });

        enrichedResults.push({
          id: `org_${i}`,
          original: {
            company: org.company,
            website: org.domain,
            industry: org.industry || '',
            location: org.location || ''
          },
          enriched: null,
          success: false,
          error: error.message
        });
        failureCount++;
      }
    }

    const successRate = Math.round((successCount / organizations.length) * 100);

    logger.info('Organization enrichment completed', {
      total: organizations.length,
      successful: successCount,
      failed: failureCount,
      successRate: `${successRate}%`
    });

    res.json({
      success: true,
      results: enrichedResults,
      summary: {
        total: organizations.length,
        successful: successCount,
        failed: failureCount,
        successRate
      }
    });

  } catch (error: any) {
    logger.error('Organization enrichment process failed', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process organization enrichment: ' + error.message 
    });
  }
});

/**
 * Parse Excel file to extract organization data
 */
function parseOrganizationExcelFile(buffer: Buffer, filename: string): any[] {
  if (!XLSX) {
    throw new Error('Excel processing not available - xlsx library not installed');
  }

  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error('File must contain at least a header row and one data row');
    }

    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1) as any[][];

    logger.info('Excel file headers', { headers });

    // Map headers to expected fields
    const fieldMapping = {
      company: ['company', 'organization', 'company_name', 'organization_name', 'name'],
      domain: ['domain', 'website', 'url', 'company_website', 'website_url'],
      industry: ['industry', 'sector', 'business_type'],
      location: ['location', 'city', 'address', 'headquarters']
    };

    const mappedHeaders: { [key: string]: number } = {};
    
    // Find matching columns
    Object.entries(fieldMapping).forEach(([field, possibleNames]) => {
      const headerIndex = headers.findIndex(header => 
        possibleNames.some(name => 
          header && header.toLowerCase().includes(name.toLowerCase())
        )
      );
      if (headerIndex !== -1) {
        mappedHeaders[field] = headerIndex;
      }
    });

    logger.info('Mapped headers', { mappedHeaders });

    // Extract organization data
    const organizations = dataRows
      .filter(row => row && row.length > 0 && row.some(cell => cell && cell.toString().trim()))
      .map((row, index) => {
        const org: any = {
          company: '',
          domain: '',
          industry: '',
          location: '',
          originalRow: row
        };

        Object.entries(mappedHeaders).forEach(([field, columnIndex]) => {
          if (columnIndex !== undefined && row[columnIndex]) {
            org[field] = row[columnIndex].toString().trim();
          }
        });

        return org;
      })
      .filter(org => org.company || org.domain); // Must have at least company name or domain

    return organizations;
  } catch (error: any) {
    logger.error('Failed to parse Excel file', { error: error.message, filename });
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

/**
 * Enrich a single organization using Apollo API
 */
async function enrichSingleOrganization(org: any, apolloService: ApolloService): Promise<any> {
  const result = {
    id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    original: {
      company: org.company,
      website: org.domain,
      industry: org.industry || '',
      location: org.location || ''
    },
    enriched: null as any,
    success: false,
    error: undefined as string | undefined
  };

  try {
    // Determine domain to use for enrichment
    let domain = org.domain || org.website;
    
    if (!domain && org.company) {
      // Try to extract domain from company name
      domain = extractDomainFromCompany(org.company);
    }

    if (!domain) {
      throw new Error('No domain or company name available for enrichment');
    }

    // Clean domain
    domain = cleanDomain(domain);

    logger.info('Enriching organization with domain', {
      originalCompany: org.company,
      domain: domain
    });

    // Use Apollo Organization Enrichment API
    const enrichmentResult = await apolloService.enrichOrganization(domain);

    if (enrichmentResult.success && enrichmentResult.organization) {
      const orgData = enrichmentResult.organization;

      // Try to get organization email, but if empty, fetch senior executive email
      let organizationEmail = orgData.email || '';

      // If no organization email (which is almost always the case with Apollo),
      // fetch the highest-ranking person's email
      if (!organizationEmail) {
        try {
          logger.info('Organization email empty, fetching senior executive email', {
            company: org.company,
            domain: domain
          });

          const seniorExecutive = await findSeniorExecutiveEmail(domain, apolloService);
          if (seniorExecutive) {
            organizationEmail = seniorExecutive.email;
            logger.info('Found senior executive email for organization', {
              company: org.company,
              executive: seniorExecutive.name,
              title: seniorExecutive.title,
              email: seniorExecutive.email
            });
          } else {
            logger.warn('No senior executive email found', {
              company: org.company,
              domain: domain
            });
          }
        } catch (error: any) {
          logger.error('Failed to fetch senior executive email', {
            company: org.company,
            domain: domain,
            error: error.message
          });
        }
      }

      result.enriched = {
        name: orgData.name || org.company,
        website: orgData.website || orgData.domain || domain,
        linkedin: orgData.linkedin_url || '',
        phone: orgData.phone || '',
        email: organizationEmail,
        industry: orgData.industry || org.industry || '',
        employeeCount: orgData.estimated_num_employees || undefined,
        description: orgData.short_description || '',
        headquarters: orgData.headquarters_address_line_1 || org.location || '',
        revenue: orgData.annual_revenue || undefined,
        foundedYear: orgData.founded_year || undefined,
        socialMedia: {
          linkedin: orgData.linkedin_url || '',
          twitter: orgData.twitter_url || '',
          facebook: orgData.facebook_url || ''
        },
        // Add metadata about the email source
        emailSource: organizationEmail ? (orgData.email ? 'organization' : 'senior_executive') : 'none'
      };

      result.success = true;

      logger.info('Organization enrichment successful', {
        company: org.company,
        domain: domain,
        foundData: Object.keys(result.enriched).filter(key => result.enriched[key])
      });
    } else {
      result.error = enrichmentResult.error || 'No organization data found';
      logger.warn('Organization enrichment failed', {
        company: org.company,
        domain: domain,
        error: result.error
      });
    }

    return result;
  } catch (error: any) {
    result.error = error.message;
    logger.error('Organization enrichment error', {
      company: org.company,
      error: error.message
    });
    return result;
  }
}

/**
 * Find the highest-ranking executive's email for an organization
 */
async function findSeniorExecutiveEmail(domain: string, apolloService: ApolloService): Promise<{ name: string; email: string; title: string } | null> {
  try {
    // Define executive titles in order of seniority (highest first)
    const executiveTitles = [
      'CEO', 'Chief Executive Officer',
      'President', 'Founder', 'Co-Founder',
      'Chairman', 'Chair', 'Owner',
      'Managing Director', 'General Manager',
      'Chief Operating Officer', 'COO',
      'Chief Technology Officer', 'CTO',
      'Chief Financial Officer', 'CFO',
      'Vice President', 'VP',
      'Senior Vice President', 'SVP'
    ];

    // Search for senior executives at this organization
    const searchResults = await apolloService.searchPeopleAtCompany({
      domain: domain,
      person_titles: executiveTitles,
      per_page: 20 // Get more results to find the best match
    });

    if (!searchResults || searchResults.length === 0) {
      logger.warn('No executives found for domain', { domain });
      return null;
    }

    // Calculate seniority score for each person and find the best email
    let bestExecutive: { name: string; email: string; title: string; score: number } | null = null;

    for (const person of searchResults) {
      // Calculate seniority score first
      const seniorityScore = calculateExecutiveSeniorityScore(person.title || '');

      let actualEmail = person.email;

      // If email is locked, try to unlock it using Apollo People Match API
      if (!person.email || person.email === 'email_not_unlocked' || person.email.includes('email_not_unlocked')) {
        try {
          logger.info('Attempting to unlock email using People Match API', {
            personId: person.id,
            name: person.name,
            title: person.title
          });

          const matchResult = await apolloService.matchPersonWithEmailReveal({
            first_name: person.first_name,
            last_name: person.last_name,
            organization_name: person.organization?.name,
            domain: domain
          });

          if (matchResult && matchResult.email && matchResult.email !== 'email_not_unlocked') {
            actualEmail = matchResult.email;
            logger.info('Successfully unlocked email via People Match API', {
              personId: person.id,
              name: person.name,
              email: actualEmail
            });
          } else {
            logger.warn('People Match API did not return unlocked email', {
              personId: person.id,
              name: person.name
            });
            continue; // Skip this person if we can't get their email
          }
        } catch (error: any) {
          logger.error('Failed to unlock email via People Match API', {
            personId: person.id,
            name: person.name,
            error: error.message
          });
          continue; // Skip this person if API call failed
        }
      }

      // Now we have either an originally unlocked email or one we just unlocked
      const candidate = {
        name: person.name || `${person.first_name} ${person.last_name}`,
        email: actualEmail,
        title: person.title || '',
        score: seniorityScore
      };

      // Keep the highest-ranking executive with a valid email
      if (!bestExecutive || candidate.score > bestExecutive.score) {
        bestExecutive = candidate;
      }
    }

    if (bestExecutive) {
      logger.info('Found senior executive with email', {
        domain,
        name: bestExecutive.name,
        title: bestExecutive.title,
        seniorityScore: bestExecutive.score
      });

      return {
        name: bestExecutive.name,
        email: bestExecutive.email,
        title: bestExecutive.title
      };
    } else {
      logger.warn('No executives with unlocked emails found', { domain });
      return null;
    }

  } catch (error: any) {
    logger.error('Failed to find senior executive email', {
      domain,
      error: error.message
    });
    return null;
  }
}

/**
 * Calculate seniority score for executive titles (higher = more senior)
 */
function calculateExecutiveSeniorityScore(title: string): number {
  if (!title) return 0;

  const titleLower = title.toLowerCase();

  // CEO, Founder, Owner - highest priority
  if (titleLower.includes('ceo') || titleLower.includes('chief executive') ||
      titleLower.includes('founder') || titleLower.includes('co-founder') ||
      titleLower.includes('owner') || titleLower.includes('chairman') ||
      titleLower.includes('chair')) {
    return 100;
  }

  // President, Managing Director
  if (titleLower.includes('president') || titleLower.includes('managing director')) {
    return 90;
  }

  // Other C-Suite executives
  if (titleLower.includes('chief operating') || titleLower.includes('coo') ||
      titleLower.includes('chief technology') || titleLower.includes('cto') ||
      titleLower.includes('chief financial') || titleLower.includes('cfo') ||
      titleLower.includes('chief') || titleLower.includes('general manager')) {
    return 85;
  }

  // Senior VPs
  if (titleLower.includes('senior vice president') || titleLower.includes('svp')) {
    return 75;
  }

  // VPs
  if (titleLower.includes('vice president') || titleLower.includes('vp')) {
    return 70;
  }

  // Directors
  if (titleLower.includes('director') && !titleLower.includes('assistant')) {
    return 60;
  }

  // Default for other titles
  return 25;
}

/**
 * Extract domain from company name (basic implementation)
 */
function extractDomainFromCompany(companyName: string): string {
  // Simple domain extraction - in practice, you might want to use a more sophisticated approach
  const cleanName = companyName.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .replace(/inc|llc|corp|corporation|ltd|limited|company|co$/g, '');
  
  return `${cleanName}.com`;
}

/**
 * Clean domain string
 */
function cleanDomain(domain: string): string {
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
 * POST /api/data-enrichment/contact-enrich
 * Enrich contact data from Excel file using Apollo OAuth integration
 */
router.post('/contact-enrich', auth, upload.single('file'), async (req, res) => {
  try {
    const userId = (req as any).userId || (req as any).user?.id || (req as any).user?.uid;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    logger.info('Starting contact enrichment process', {
      userId,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    // Get Apollo service from user's OAuth integration or API key
    const apiKey = req.body.apiKey;
    const { service: apolloService } = await getApolloServiceForUser(userId, apiKey);

    // Parse Excel file to extract contact data
    const contacts = parseContactExcelFile(req.file.buffer, req.file.originalname);
    
    if (contacts.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'No valid contact data found in the uploaded file' 
      });
    }

    logger.info('Parsed contact data', { 
      totalContacts: contacts.length,
      sample: contacts.slice(0, 3)
    });

    // Enrich contacts using Apollo
    const enrichedResults = [];
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      logger.info(`Enriching contact ${i + 1}/${contacts.length}`, {
        name: `${contact.firstName} ${contact.lastName}`,
        company: contact.company
      });

      try {
        const enrichedContact = await enrichSingleContact(contact, apolloService);
        enrichedResults.push(enrichedContact);

        if (enrichedContact.success) {
          successCount++;
        } else {
          failureCount++;
        }

        // Add delay between API calls to respect rate limits
        if (i < contacts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error: any) {
        logger.error('Contact enrichment failed', {
          name: `${contact.firstName} ${contact.lastName}`,
          error: error.message
        });

        enrichedResults.push({
          id: `contact_${i}`,
          original: {
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            company: contact.company,
            title: contact.title,
            phone: contact.phone
          },
          enriched: null,
          success: false,
          error: error.message
        });
        failureCount++;
      }
    }

    const successRate = Math.round((successCount / contacts.length) * 100);

    logger.info('Contact enrichment completed', {
      total: contacts.length,
      successful: successCount,
      failed: failureCount,
      successRate: `${successRate}%`
    });

    res.json({
      success: true,
      results: enrichedResults,
      summary: {
        total: contacts.length,
        successful: successCount,
        failed: failureCount,
        successRate
      }
    });

  } catch (error: any) {
    logger.error('Contact enrichment process failed', { error: error.message });
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process contact enrichment: ' + error.message 
    });
  }
});

/**
 * Parse Excel file to extract contact data
 */
function parseContactExcelFile(buffer: Buffer, filename: string): any[] {
  if (!XLSX) {
    throw new Error('Excel processing not available - xlsx library not installed');
  }

  try {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error('File must contain at least a header row and one data row');
    }

    const headers = jsonData[0] as string[];
    const dataRows = jsonData.slice(1) as any[][];

    logger.info('Excel file headers', { headers });

    // Map headers to expected fields
    const fieldMapping = {
      firstName: ['first_name', 'firstname', 'first name', 'given_name', 'given name'],
      lastName: ['last_name', 'lastname', 'last name', 'surname', 'family_name', 'family name'],
      email: ['email', 'email_address', 'email address', 'e_mail'],
      company: ['company', 'organization', 'company_name', 'organization_name', 'employer'],
      title: ['title', 'job_title', 'job title', 'position', 'role'],
      phone: ['phone', 'phone_number', 'phone number', 'telephone', 'mobile', 'cell']
    };

    const mappedHeaders: { [key: string]: number } = {};
    
    // Find matching columns
    Object.entries(fieldMapping).forEach(([field, possibleNames]) => {
      const headerIndex = headers.findIndex(header => 
        possibleNames.some(name => 
          header && header.toLowerCase().includes(name.toLowerCase())
        )
      );
      if (headerIndex !== -1) {
        mappedHeaders[field] = headerIndex;
      }
    });

    logger.info('Mapped headers', { mappedHeaders });

    // Extract contact data
    const contacts = dataRows
      .filter(row => row && row.length > 0 && row.some(cell => cell && cell.toString().trim()))
      .map((row, index) => {
        const contact: any = {
          firstName: '',
          lastName: '',
          email: '',
          company: '',
          title: '',
          phone: '',
          originalRow: row
        };

        Object.entries(mappedHeaders).forEach(([field, columnIndex]) => {
          if (columnIndex !== undefined && row[columnIndex]) {
            contact[field] = row[columnIndex].toString().trim();
          }
        });

        return contact;
      })
      .filter(contact => contact.firstName || contact.lastName || contact.email); // Must have at least name or email

    return contacts;
  } catch (error: any) {
    logger.error('Failed to parse Excel file', { error: error.message, filename });
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
}

/**
 * Enrich a single contact using Apollo People Enrichment API
 */
async function enrichSingleContact(contact: any, apolloService: ApolloService): Promise<any> {
  const result = {
    id: `contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    original: {
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      company: contact.company,
      title: contact.title,
      phone: contact.phone
    },
    enriched: null as any,
    success: false,
    error: undefined as string | undefined
  };

  try {
    // Use Apollo People Enrichment API
    const enrichmentResult = await apolloService.enrichPerson({
      first_name: contact.firstName,
      last_name: contact.lastName,
      email: contact.email,
      organization_name: contact.company,
      phone: contact.phone
    });

    if (enrichmentResult) {
      result.enriched = {
        name: enrichmentResult.name || `${contact.firstName} ${contact.lastName}`,
        email: enrichmentResult.email || contact.email,
        phone: enrichmentResult.phone_numbers?.[0]?.sanitized_number || contact.phone,
        title: enrichmentResult.title || contact.title,
        company: enrichmentResult.organization?.name || contact.company,
        linkedin: enrichmentResult.linkedin_url || '',
        location: enrichmentResult.city ? `${enrichmentResult.city}, ${enrichmentResult.state || ''}`.trim() : '',
        photo: enrichmentResult.photo_url || '',
        industry: enrichmentResult.organization?.industry || '',
        employeeCount: enrichmentResult.organization?.employee_count || undefined,
        companyDomain: enrichmentResult.organization?.website_url || enrichmentResult.organization?.primary_domain || '',
        twitter: enrichmentResult.twitter_url || '',
        github: enrichmentResult.github_url || '',
        facebook: enrichmentResult.facebook_url || ''
      };

      result.success = true;

      logger.info('Contact enrichment successful', {
        name: `${contact.firstName} ${contact.lastName}`,
        company: contact.company,
        foundEmail: !!result.enriched.email,
        foundPhone: !!result.enriched.phone,
        foundLinkedIn: !!result.enriched.linkedin
      });
    } else {
      result.error = 'No contact data found';
      logger.warn('Contact enrichment failed - no data found', {
        name: `${contact.firstName} ${contact.lastName}`,
        company: contact.company
      });
    }

    return result;
  } catch (error: any) {
    result.error = error.message;
    logger.error('Contact enrichment error', {
      name: `${contact.firstName} ${contact.lastName}`,
      error: error.message
    });
    return result;
  }
}





/**
 * Calculate seniority score based on title
 */
function calculateSeniorityScore(title: string): number {
  if (!title) return 0;

  const titleLower = title.toLowerCase();

  // CEO, Founder, Owner - highest priority
  if (titleLower.includes('ceo') || titleLower.includes('chief executive') ||
      titleLower.includes('founder') || titleLower.includes('owner') ||
      titleLower.includes('chairman')) {
    return 100;
  }

  // President, Managing Director
  if (titleLower.includes('president') || titleLower.includes('managing director')) {
    return 90;
  }

  // C-Suite executives
  if (titleLower.includes('chief') || titleLower.includes('cto') ||
      titleLower.includes('cfo') || titleLower.includes('coo')) {
    return 85;
  }

  // VPs and SVPs
  if (titleLower.includes('vice president') || titleLower.includes('vp') ||
      titleLower.includes('senior vice president') || titleLower.includes('svp')) {
    return 75;
  }

  // Directors
  if (titleLower.includes('director') && !titleLower.includes('assistant')) {
    return 65;
  }

  // Senior managers
  if (titleLower.includes('senior manager') || titleLower.includes('head of')) {
    return 55;
  }

  // Managers
  if (titleLower.includes('manager')) {
    return 45;
  }

  // Default for other titles
  return 25;
}

/**
 * POST /api/data-enrichment/search-organizations
 * Search for organizations using Apollo - simple industry + location search
 */
router.post('/search-organizations', auth, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).userId;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const { searchCriteria, orgsToFind } = req.body;

    if (!searchCriteria.industries || !searchCriteria.industries.trim()) {
      return res.status(400).json({ success: false, error: 'Industries is required' });
    }

    logger.info('Organization search request', { userId, searchCriteria, orgsToFind });

    // Get Apollo service from user's OAuth integration or API key
    const apiKey = req.body.apiKey;
    const { service: apolloService } = await getApolloServiceForUser(userId, apiKey);

    // Use Apollo's actual working parameters for organization search
    const searchParams: any = {
      per_page: Math.min(orgsToFind || 10, 100),
      page: 1
    };

    // Use q_keywords for general keyword search that includes industry
    // This actually searches company descriptions, industries, and keywords
    searchParams.q_keywords = searchCriteria.industries.trim();

    if (searchCriteria.location && searchCriteria.location.trim()) {
      searchParams.organization_locations = [searchCriteria.location.trim()];
    }

    logger.info('Searching Apollo with params:', searchParams);

    const organizations = await apolloService.searchOrganizations(searchParams);

    logger.info(`Found ${organizations.length} organizations`);

    res.json({
      success: true,
      organizations: organizations.map((org: any) => ({
        id: org.id,
        name: org.name,
        website: org.website_url || org.primary_domain,
        industry: org.industry,
        location: org.city ? `${org.city}, ${org.state || ''}` : org.state,
        employeeCount: org.estimated_num_employees,
        revenue: org.annual_revenue,
        ceo: org.ceo_name,
        foundedYear: org.founded_year
      })),
      summary: {
        total: organizations.length,
        averageRevenue: 'N/A',
        averageEmployeeCount: 'N/A',
        topIndustries: []
      }
    });

  } catch (error: any) {
    logger.error('Organization search failed', { error: error.message });
    res.status(500).json({ success: false, error: 'Failed to search organizations: ' + error.message });
  }
});

export default router;