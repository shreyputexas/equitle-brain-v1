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
import { ApolloWebhookService } from '../services/apolloWebhook.service';
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

const apolloService = new ApolloService();

/**
 * POST /api/apollo/validate-key
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
    logger.error('Apollo API key validation error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Failed to validate API key',
      message: error.message
    });
  }
});

/**
 * POST /api/apollo/upload-and-enrich
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

    // Create Apollo service with the provided API key
    const apolloService = new ApolloService(apiKey);

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

    // Map Excel columns to Apollo search parameters
    const peopleData = jsonData.map((row: any) => {
      const person: any = {};
      
      // Map common column names to Apollo fields
      const columnMapping: Record<string, string> = {
        'first_name': 'first_name',
        'firstname': 'first_name',
        'first name': 'first_name',
        'last_name': 'last_name',
        'lastname': 'last_name',
        'last name': 'last_name',
        'company': 'organization_name',
        'company_name': 'organization_name',
        'organization': 'organization_name',
        'organization_name': 'organization_name',
        'email': 'email',
        'phone': 'phone',
        'phone_number': 'phone',
        'domain': 'domain',
        'website': 'domain'
      };

      // Try to map columns automatically
      Object.keys(row).forEach(key => {
        const normalizedKey = key.toLowerCase().trim();
        const mappedField = columnMapping[normalizedKey];
        if (mappedField && row[key]) {
          person[mappedField] = row[key];
        }
      });

      return person;
    });

    logger.info('Processing Excel file', {
      rowCount: peopleData.length,
      sampleData: peopleData.slice(0, 3)
    });

    // Enrich contacts using Apollo
    const enrichedResults = await apolloService.batchEnrichPeople(peopleData);

    // Transform results for frontend
    const processedResults = enrichedResults.map((result, index) => {
      const enriched = result.enriched;
      
      if (enriched) {
        return {
          id: `enriched_${index}`,
          original: result.original,
          enriched: {
            name: enriched.name,
            email: enriched.email,
            phone: enriched.phone_numbers?.[0]?.sanitized_number,
            title: enriched.title,
            company: enriched.organization?.name,
            linkedin: enriched.linkedin_url,
            location: enriched.city && enriched.state ? `${enriched.city}, ${enriched.state}` : undefined,
            photo: enriched.photo_url,
            organization: enriched.organization
          },
          success: true,
          error: null
        };
      } else {
        return {
          id: `failed_${index}`,
          original: result.original,
          enriched: null,
          success: false,
          error: result.error || 'No matching person found'
        };
      }
    });

    const successCount = processedResults.filter(r => r.success).length;
    const failureCount = processedResults.filter(r => !r.success).length;

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
 * POST /api/apollo/find-email
 * Find email using Apollo Email Finder API
 */
router.post('/find-email', async (req, res) => {
  try {
    const { apiKey, first_name, last_name, organization_name, domain } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Apollo API key is required'
      });
    }

    if (!first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: 'First name and last name are required for email finding'
      });
    }

    // Create Apollo service with the provided API key
    const apolloService = new ApolloService(apiKey);

    const emailResult = await apolloService.findEmail({
      first_name,
      last_name,
      organization_name,
      domain
    });

    if (emailResult?.email) {
      res.json({
        success: true,
        data: emailResult
      });
    } else {
      res.json({
        success: false,
        error: 'No email found with Email Finder API'
      });
    }

  } catch (error: any) {
    logger.error('Email finding error', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to find email'
    });
  }
});

/**
 * POST /api/apollo/enrich-single
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

    // Create Apollo service with the provided API key
    const apolloService = new ApolloService(apiKey);

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
 * GET /api/apollo/organization/:domain
 * Get organization information by domain
 */
router.get('/organization/:domain', async (req, res) => {
  try {
    const { domain } = req.params;
    const { apiKey } = req.query;

    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: 'Apollo API key is required'
      });
    }

    // Create Apollo service with the provided API key
    const apolloService = new ApolloService(apiKey as string);

    const organization = await apolloService.getOrganization(domain);

    res.json({
      success: true,
      data: organization
    });

  } catch (error: any) {
    logger.error('Organization lookup error', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to lookup organization'
    });
  }
});

/**
 * POST /api/apollo/webhook/phone-numbers
 * Webhook endpoint to receive phone numbers from Apollo
 * This endpoint is called by Apollo when phone numbers are revealed via reveal_phone_number parameter
 * NOTE: This endpoint should NOT require authentication as Apollo calls it directly
 */
router.post('/webhook/phone-numbers', async (req, res) => {
  try {
    logger.info('Apollo webhook received for phone numbers', {
      body: req.body,
      headers: req.headers
    });

    // Apollo webhook payload structure (based on Apollo docs):
    // {
    //   "status": "success",
    //   "people": [
    //     {
    //       "id": "person_id",
    //       "phone_numbers": [...]
    //     }
    //   ]
    // }
    
    const { people, status } = req.body;

    // Handle Apollo's actual webhook structure
    if (people && Array.isArray(people) && people.length > 0) {
      let totalPhonesStored = 0;
      
      // Process each person in the webhook payload
      for (const person of people) {
        const personId = person.id;
        const phoneNumbers = person.phone_numbers || [];
        
        if (phoneNumbers.length > 0 && personId) {
          const personName = person.name || 
            (person.first_name && person.last_name ? `${person.first_name} ${person.last_name}` : undefined);
          
          // Store phone numbers using person ID as identifier
          ApolloWebhookService.storePhoneNumbers(
            personId,
            phoneNumbers,
            personId,
            personName
          );
          
          totalPhonesStored += phoneNumbers.length;
          
          console.log('✅ [WEBHOOK] Stored phone numbers for person:', {
            personId,
            personName,
            phoneCount: phoneNumbers.length,
            phones: phoneNumbers.map(p => ({
              sanitized: p.sanitized_number || p.sanitizedNumber,
              raw: p.raw_number || p.rawNumber,
              type: p.type_cd || p.type
            }))
          });
          
          logger.info('Phone numbers stored from webhook for person', {
            personId,
            personName,
            phoneCount: phoneNumbers.length
          });
        }
      }
      
      // Update Firestore contacts if enrichment requests exist
      for (const person of people) {
        const personId = person.id;
        if (personId && person.phone_numbers && person.phone_numbers.length > 0) {
          const { OptimizedEnrichmentService } = require('../services/optimizedEnrichment.service');
          const { ContactsActivitiesFirestoreService } = require('../services/contactsActivities.firestore.service');
          const enrichmentRequest = OptimizedEnrichmentService.getEnrichmentRequest(personId);
          
          logger.info('🔍 [WEBHOOK] Processing webhook for person', {
            personId,
            hasEnrichmentRequest: !!enrichmentRequest,
            hasContactId: !!(enrichmentRequest?.contactId),
            hasUserId: !!(enrichmentRequest?.userId),
            phoneCount: person.phone_numbers.length
          });

          let contactUpdated = false;
          
          // Try enrichment request first (preferred method)
          if (enrichmentRequest && enrichmentRequest.contactId && enrichmentRequest.userId) {
            try {
              const bestPhone = person.phone_numbers[0]?.sanitized_number || person.phone_numbers[0]?.sanitizedNumber;

              const updateData: any = {};

              if (bestPhone) {
                updateData.phone = bestPhone;
                updateData.phoneNumberStatus = 'available';
              }

              // Also update LinkedIn URL if available
              if (person.linkedin_url) {
                updateData.linkedinUrl = person.linkedin_url;
                logger.info('✅ [WEBHOOK] Found LinkedIn URL in webhook', {
                  contactId: enrichmentRequest.contactId,
                  linkedinUrl: person.linkedin_url
                });
              }

              if (Object.keys(updateData).length > 0) {
                await ContactsActivitiesFirestoreService.updateContact(
                  enrichmentRequest.userId,
                  enrichmentRequest.contactId,
                  updateData
                );

                logger.info('✅ [WEBHOOK] Updated Firestore contact via enrichment request', {
                  contactId: enrichmentRequest.contactId,
                  personId,
                  userId: enrichmentRequest.userId,
                  updates: updateData
                });
                contactUpdated = true;
              }
            } catch (updateError: any) {
              logger.error('Failed to update Firestore contact from webhook (enrichment request method)', {
                error: updateError.message,
                contactId: enrichmentRequest.contactId,
                personId,
                userId: enrichmentRequest.userId
              });
            }
          }
          
          // Fallback: Try to find contact by Apollo person ID if enrichment request not found or missing contactId
          if (!contactUpdated && enrichmentRequest?.userId) {
            try {
              const contactResult = await ContactsActivitiesFirestoreService.findContactByApolloPersonId(
                enrichmentRequest.userId,
                personId
              );

              if (contactResult?.contact) {
                const bestPhone = person.phone_numbers[0]?.sanitized_number || person.phone_numbers[0]?.sanitizedNumber;
                const updateData: any = {};

                if (bestPhone) {
                  updateData.phone = bestPhone;
                  updateData.phoneNumberStatus = 'available';
                }

                if (person.linkedin_url) {
                  updateData.linkedinUrl = person.linkedin_url;
                }

                if (Object.keys(updateData).length > 0) {
                  await ContactsActivitiesFirestoreService.updateContact(
                    enrichmentRequest.userId,
                    contactResult.contact.id!,
                    updateData
                  );

                  logger.info('✅ [WEBHOOK] Updated Firestore contact via Apollo person ID lookup (fallback)', {
                    contactId: contactResult.contact.id,
                    personId,
                    userId: enrichmentRequest.userId,
                    updates: updateData
                  });
                  contactUpdated = true;
                }
              } else {
                logger.warn('⚠️ [WEBHOOK] Could not find contact by Apollo person ID', {
                  personId,
                  userId: enrichmentRequest.userId
                });
              }
            } catch (fallbackError: any) {
              logger.error('Failed to update Firestore contact from webhook (fallback method)', {
                error: fallbackError.message,
                personId,
                userId: enrichmentRequest?.userId
              });
            }
          }
          
          // Log if we couldn't update the contact
          if (!contactUpdated) {
            logger.warn('⚠️ [WEBHOOK] Could not update contact - no enrichment request or contact not found', {
              personId,
              hasEnrichmentRequest: !!enrichmentRequest,
              hasContactId: !!(enrichmentRequest?.contactId),
              hasUserId: !!(enrichmentRequest?.userId)
            });
          }
          
          // Mark enrichment as completed
          if (enrichmentRequest) {
            OptimizedEnrichmentService.markEnrichmentCompleted(personId);
          }
        }
      }

      // Return success response
      res.json({
        success: true,
        message: 'Phone numbers received and stored',
        people_processed: people.length,
        total_phone_numbers: totalPhonesStored
      });
      
    } else {
      // Fallback: Try to handle legacy format or direct phone_numbers at root
      const { person_id, person, phone_numbers, enrichment_request_id } = req.body;
      
      if (phone_numbers && Array.isArray(phone_numbers)) {
        const identifier = person_id || enrichment_request_id || `webhook_${Date.now()}`;
        const personName = person?.name || (person?.first_name && person?.last_name 
          ? `${person.first_name} ${person.last_name}` 
          : undefined);
        
        ApolloWebhookService.storePhoneNumbers(
          identifier,
          phone_numbers,
          person_id,
          personName
        );
        
        console.log('✅ [WEBHOOK] Received phone numbers (legacy format):', {
          identifier,
          personId: person_id,
          personName,
          phoneCount: phone_numbers.length
        });
        
        res.json({
          success: true,
          message: 'Phone numbers received and stored (legacy format)',
          phone_count: phone_numbers.length
        });
      } else {
        logger.warn('Apollo webhook missing expected structure', { 
          body: req.body,
          hasPeople: !!people,
          hasPhoneNumbers: !!phone_numbers
        });
        // Still return 200 to prevent Apollo from retrying invalid payloads
        res.json({
          success: false,
          error: 'Invalid webhook payload structure',
          received: Object.keys(req.body)
        });
      }
    }

  } catch (error: any) {
    logger.error('Error processing Apollo webhook', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process webhook'
    });
  }
});

/**
 * GET /api/apollo/webhook/phone-numbers/:identifier
 * Get phone numbers for a person (for testing/debugging)
 */
router.get('/webhook/phone-numbers/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    const phoneNumbers = ApolloWebhookService.getPhoneNumbers(identifier);

    if (phoneNumbers) {
      res.json({
        success: true,
        identifier,
        phone_numbers: phoneNumbers
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Phone numbers not found for this identifier'
      });
    }
  } catch (error: any) {
    logger.error('Error retrieving phone numbers', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve phone numbers'
    });
  }
});

export default router;
