import express from 'express';
import Joi from 'joi';
import { firebaseAuthMiddleware } from '../middleware/firebaseAuth';
import { ContactsActivitiesFirestoreService } from '../services/contactsActivities.firestore.service';
import logger from '../utils/logger';

const router = express.Router();

// Validation schemas for contacts
const createContactSchema = Joi.object({
  dealId: Joi.string().optional(),
  googleContactId: Joi.string().optional(),
  name: Joi.string().required(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  company: Joi.string().optional(),
  title: Joi.string().optional(),
  role: Joi.string().optional(),
  linkedinUrl: Joi.string().optional(),
  avatar: Joi.string().optional(),
  notes: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  relationshipScore: Joi.number().min(0).max(100).optional(),
  lastContact: Joi.date().optional(),
  status: Joi.string().valid('hot', 'warm', 'cold', 'inactive').default('warm'),
  isKeyContact: Joi.boolean().default(false),
  source: Joi.string().optional(),
  metadata: Joi.object().optional(),
  website: Joi.string().optional().allow('', null),
});

const updateContactSchema = Joi.object({
  dealId: Joi.string().optional(),
  name: Joi.string().optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().optional(),
  company: Joi.string().optional(),
  title: Joi.string().optional(),
  role: Joi.string().optional(),
  linkedinUrl: Joi.string().optional(),
  avatar: Joi.string().optional(),
  notes: Joi.string().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  relationshipScore: Joi.number().min(0).max(100).optional(),
  lastContact: Joi.date().optional(),
  status: Joi.string().valid('hot', 'warm', 'cold', 'inactive').optional(),
  isKeyContact: Joi.boolean().optional(),
  source: Joi.string().optional(),
  metadata: Joi.object().optional(),
  website: Joi.string().optional().allow('', null),
});

// Validation schemas for activities
const createActivitySchema = Joi.object({
  dealId: Joi.string().optional(),
  contactId: Joi.string().optional(),
  type: Joi.string().valid('email', 'meeting', 'call', 'document', 'note', 'task').required(),
  title: Joi.string().required(),
  description: Joi.string().optional(),
  content: Joi.string().optional(),
  date: Joi.date().required(),
  duration: Joi.number().optional(),
  location: Joi.string().optional(),
  attendees: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid('scheduled', 'completed', 'cancelled').default('completed'),
  priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
  outcome: Joi.string().optional(),
  nextSteps: Joi.string().optional(),
  metadata: Joi.object().optional(),
  externalId: Joi.string().optional(),
  syncedFrom: Joi.string().optional(),
});

// Validation schemas for communications
const createCommunicationSchema = Joi.object({
  dealId: Joi.string().optional(),
  contactId: Joi.string().optional(),
  type: Joi.string().valid('email', 'sms', 'call', 'meeting').required(),
  subject: Joi.string().optional(),
  content: Joi.string().optional(),
  htmlContent: Joi.string().optional(),
  fromEmail: Joi.string().email().optional(),
  toEmails: Joi.array().items(Joi.string().email()).optional(),
  ccEmails: Joi.array().items(Joi.string().email()).optional(),
  bccEmails: Joi.array().items(Joi.string().email()).optional(),
  threadId: Joi.string().optional(),
  messageId: Joi.string().optional(),
  status: Joi.string().valid('draft', 'sent', 'received', 'failed').default('sent'),
  direction: Joi.string().valid('inbound', 'outbound').required(),
  isRead: Joi.boolean().default(false),
  isImportant: Joi.boolean().default(false),
  labels: Joi.array().items(Joi.string()).optional(),
  attachments: Joi.object().optional(),
  metadata: Joi.object().optional(),
  sentAt: Joi.date().optional(),
  receivedAt: Joi.date().optional(),
});

// === CONTACT ROUTES ===

// @route   GET /api/firebase-contacts
// @desc    Get all contacts for the authenticated user
// @access  Private
router.get('/contacts', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { dealId, search, status, limit = 50, offset = 0 } = req.query;

    const result = await ContactsActivitiesFirestoreService.getAllContacts(userId, {
      dealId: dealId as string,
      search: search as string,
      status: status as string,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Get contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/firebase-contacts/:id
// @desc    Get single contact by ID
// @access  Private
router.get('/contacts/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await ContactsActivitiesFirestoreService.getContactById(userId, id);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Get contact error:', error);

    if (error.message === 'Contact not found') {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/firebase-contacts
// @desc    Create new contact
// @access  Private
router.post('/contacts', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;

    // Validate input
    const { error, value } = createContactSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const result = await ContactsActivitiesFirestoreService.createContact(userId, value);

    res.status(201).json({
      success: true,
      message: 'Contact created successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Create contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/firebase-contacts/:id
// @desc    Update contact
// @access  Private
router.put('/contacts/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    // Validate input
    const { error, value } = updateContactSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const result = await ContactsActivitiesFirestoreService.updateContact(userId, id, value);

    res.json({
      success: true,
      message: 'Contact updated successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Update contact error:', error);

    if (error.message === 'Contact not found') {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/firebase-contacts/:id
// @desc    Delete contact
// @access  Private
router.delete('/contacts/:id', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    logger.info(`Deleting contact ${id} for user ${userId}`);
    const result = await ContactsActivitiesFirestoreService.deleteContact(userId, id);
    logger.info(`Successfully deleted contact ${id}`);

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Delete contact error:', error);

    if (error.message === 'Contact not found') {
      return res.status(404).json({
        success: false,
        message: 'Contact not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// @route   POST /api/firebase/contacts/bulk-delete
// @desc    Bulk delete contacts
// @access  Private
router.post('/contacts/bulk-delete', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { contactIds } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'contactIds array is required'
      });
    }

    logger.info(`Bulk deleting ${contactIds.length} contacts for user ${userId}`, { contactIds });

    const results = {
      deleted: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Delete each contact
    for (const contactId of contactIds) {
      try {
        await ContactsActivitiesFirestoreService.deleteContact(userId, contactId);
        results.deleted++;
        logger.info(`Deleted contact ${contactId}`);
      } catch (error: any) {
        results.failed++;
        const errorMsg = `Failed to delete contact ${contactId}: ${error.message}`;
        results.errors.push(errorMsg);
        logger.error(errorMsg, error);
      }
    }

    logger.info(`Bulk delete complete: ${results.deleted} deleted, ${results.failed} failed`);

    res.json({
      success: true,
      message: `Successfully deleted ${results.deleted} contact(s)${results.failed > 0 ? `, ${results.failed} failed` : ''}`,
      deleted: results.deleted,
      failed: results.failed,
      errors: results.errors.length > 0 ? results.errors : undefined
    });
  } catch (error: any) {
    logger.error('Bulk delete contacts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete contacts: ' + error.message
    });
  }
});

// @route   POST /api/firebase/contacts/bulk-save
// @desc    Bulk save enriched contacts from Apollo
// @access  Private
router.post('/contacts/bulk-save', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { contacts: enrichedContacts, contactType } = req.body;

    if (!enrichedContacts || !Array.isArray(enrichedContacts)) {
      return res.status(400).json({ success: false, error: 'Invalid contacts data' });
    }

    logger.info(`Bulk saving ${enrichedContacts.length} ${contactType} contacts for user ${userId}`);

    const savedContacts: any[] = [];
    const skippedContacts: string[] = [];

    for (const enrichedContact of enrichedContacts) {
      try {
        logger.info(`Processing contact: ${enrichedContact.name}`, { enrichedContact });
        
        // Check if contact already exists by email
        let existingContacts: any[] = [];
        if (enrichedContact.email && 
            enrichedContact.email !== 'email_not_unlocked' && 
            !enrichedContact.email.includes('email_not_unlocked')) {
          const result = await ContactsActivitiesFirestoreService.getAllContacts(userId, {
            search: enrichedContact.email
          });
          existingContacts = Array.isArray(result) ? result : (result.contacts || []);
        }

        let savedContact;
        // Use contactType from the enrichedContact if available, otherwise use the default
        const finalContactType = enrichedContact.contactType || contactType;
        
        if (existingContacts.length > 0) {
          // Update existing contact
          const existingContact = existingContacts[0];
          savedContact = await ContactsActivitiesFirestoreService.updateContact(userId, existingContact.id, {
            email: enrichedContact.email || existingContact.email,
            phone: enrichedContact.phone || existingContact.phone,
            linkedinUrl: enrichedContact.linkedin_url || existingContact.linkedinUrl,
            title: enrichedContact.title || existingContact.title,
            company: enrichedContact.company || existingContact.company,
            website: enrichedContact.website || existingContact.website,
            notes: enrichedContact.notes || existingContact.notes,
            tags: [...new Set([...(existingContact.tags || []), finalContactType, ...(enrichedContact.tags || [])])],
          });
        } else {
          // Create new contact
          const contactData: any = {
            name: enrichedContact.name,
            tags: [finalContactType, ...(enrichedContact.tags || [])].filter(Boolean),
            status: 'warm',
            lastContact: new Date(),
            relationshipScore: 0,
            isKeyContact: false
          };
          
          // Only add fields that have values (not undefined)
          if (enrichedContact.email &&
              enrichedContact.email !== 'email_not_unlocked' &&
              !enrichedContact.email.includes('email_not_unlocked')) {
            contactData.email = enrichedContact.email;
          }

          // Handle phone number and its status
          if (enrichedContact.phone) {
            contactData.phone = enrichedContact.phone;
            contactData.phoneNumberStatus = 'available';
          } else {
            // If this contact was enriched (has email/linkedin/company) but no phone,
            // mark phone as fetching since Apollo may deliver it via webhook
            const wasEnriched = enrichedContact.email || enrichedContact.linkedin_url || enrichedContact.company;
            if (wasEnriched) {
              contactData.phoneNumberStatus = 'fetching';
            }
          }

          if (enrichedContact.linkedin_url) contactData.linkedinUrl = enrichedContact.linkedin_url;
          if (enrichedContact.title) contactData.title = enrichedContact.title;
          if (enrichedContact.company) contactData.company = enrichedContact.company;
          if (enrichedContact.website) contactData.website = enrichedContact.website;
          if (enrichedContact.notes) contactData.notes = enrichedContact.notes;
          
          logger.info(`Creating contact with data:`, contactData);
          savedContact = await ContactsActivitiesFirestoreService.createContact(userId, contactData);
        }
        savedContacts.push(savedContact);
        logger.info(`Successfully saved contact: ${enrichedContact.name}`);
      } catch (contactError: any) {
        logger.error(`Error saving contact ${enrichedContact.name}:`, contactError);
        skippedContacts.push(enrichedContact.name);
      }
    }

    logger.info(`Bulk save complete: ${savedContacts.length} saved, ${skippedContacts.length} skipped`);
    
    res.json({
      success: true,
      saved: savedContacts.length,
      skipped: skippedContacts.length,
      skippedNames: skippedContacts,
      contacts: savedContacts
    });
  } catch (error: any) {
    logger.error('Bulk save contacts error:', error);
    res.status(500).json({ success: false, error: 'Failed to save contacts: ' + error.message });
  }
});

// @route   POST /api/firebase/contacts/enrich-phone-numbers
// @desc    Trigger phone number enrichment for contacts without phones
// @access  Private
router.post('/contacts/enrich-phone-numbers', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { contactIds } = req.body;

    if (!contactIds || !Array.isArray(contactIds) || contactIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'contactIds array is required'
      });
    }

    logger.info(`Enriching phone numbers for ${contactIds.length} contacts`);

    const { getApolloServiceForUser } = require('../services/integrationService');
    const { OptimizedEnrichmentService } = require('../services/optimizedEnrichment.service');

    // Get Apollo service for this user
    const apolloService = await getApolloServiceForUser(userId);
    if (!apolloService) {
      return res.status(400).json({
        success: false,
        error: 'Apollo API not configured. Please configure Apollo integration first.'
      });
    }

    let enrichedCount = 0;
    const errors: string[] = [];

    // Process each contact
    for (const contactId of contactIds) {
      try {
        // Get contact details
        const contactResult = await ContactsActivitiesFirestoreService.getContactById(userId, contactId);
        const contactData = contactResult.contact as any;

        if (!contactData) {
          errors.push(`Contact ${contactId} not found`);
          continue;
        }

        // Skip if already has phone
        if (contactData.phone) {
          continue;
        }

        // Set status to fetching
        await ContactsActivitiesFirestoreService.updateContact(userId, contactId, {
          phoneNumberStatus: 'fetching'
        });

        // Trigger enrichment
        const enrichmentParams: any = {};
        if (contactData.email) enrichmentParams.email = contactData.email;
        if (contactData.name) {
          const nameParts = contactData.name.split(' ');
          enrichmentParams.first_name = nameParts[0];
          enrichmentParams.last_name = nameParts.slice(1).join(' ');
        }
        if (contactData.company) enrichmentParams.organization_name = contactData.company;

        // Set a timeout to mark as unavailable if enrichment takes too long (30 seconds)
        // Phone webhooks from Apollo typically arrive within 1-5 seconds if working properly
        const enrichmentTimeout = setTimeout(async () => {
          try {
            await ContactsActivitiesFirestoreService.updateContact(userId, contactId, {
              phoneNumberStatus: 'unavailable'
            });
            logger.warn(`Phone enrichment timeout for contact ${contactId} - marked as unavailable after 30 seconds`);
          } catch (err) {
            logger.error(`Failed to update timeout status for contact ${contactId}:`, err);
          }
        }, 30 * 1000); // 30 seconds

        // Call enrichment service and update contact with results
        OptimizedEnrichmentService.enrichPerson(
          apolloService,
          enrichmentParams,
          {
            userId,
            contactId,
            waitForWebhook: false
          }
        ).then(async (enrichmentResult: any) => {
          // Clear the timeout since enrichment completed
          clearTimeout(enrichmentTimeout);

          // Update contact with enriched data
          const updateData: any = {};

          // Update LinkedIn URL if found
          if (enrichmentResult.person?.linkedin_url) {
            updateData.linkedinUrl = enrichmentResult.person.linkedin_url;
            logger.info(`Found LinkedIn URL for contact ${contactId}: ${enrichmentResult.person.linkedin_url}`);
          }

          // Update phone if available immediately
          if (enrichmentResult.phone) {
            updateData.phone = enrichmentResult.phone;
            updateData.phoneNumberStatus = 'available';
            logger.info(`Found phone for contact ${contactId}: ${enrichmentResult.phone}`);
          } else if (!enrichmentResult.webhookPending) {
            // No phone found and no webhook pending
            updateData.phoneNumberStatus = 'unavailable';
          }

          // Update other fields if available
          if (enrichmentResult.person?.title && !contactData.title) {
            updateData.title = enrichmentResult.person.title;
          }
          if (enrichmentResult.person?.organization?.name && !contactData.company) {
            updateData.company = enrichmentResult.person.organization.name;
          }

          // Apply updates if we have any
          if (Object.keys(updateData).length > 0) {
            await ContactsActivitiesFirestoreService.updateContact(userId, contactId, updateData);
            logger.info(`Updated contact ${contactId} with enriched data`, { updateData });
          }
        }).catch(async (error: any) => {
          // Clear the timeout since enrichment failed
          clearTimeout(enrichmentTimeout);

          logger.error(`Background enrichment failed for contact ${contactId}:`, error);
          // Update status to unavailable if enrichment fails
          try {
            await ContactsActivitiesFirestoreService.updateContact(userId, contactId, {
              phoneNumberStatus: 'unavailable'
            });
            logger.info(`Set phoneNumberStatus to unavailable for contact ${contactId} after enrichment failure`);
          } catch (updateError) {
            logger.error(`Failed to update phoneNumberStatus for contact ${contactId}:`, updateError);
          }
        });

        enrichedCount++;
      } catch (contactError: any) {
        logger.error(`Error processing contact ${contactId}:`, contactError);
        errors.push(`Contact ${contactId}: ${contactError.message}`);
      }
    }

    res.json({
      success: true,
      message: `Triggered phone number enrichment for ${enrichedCount} contacts`,
      enrichedCount,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    logger.error('Enrich phone numbers error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to enrich phone numbers: ' + error.message
    });
  }
});

// @route   POST /api/firebase/contacts/reset-stuck-phone-status
// @desc    Reset contacts stuck in 'fetching' status to 'unavailable'
// @access  Private
router.post('/contacts/reset-stuck-phone-status', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;

    logger.info(`Resetting stuck phone statuses for user ${userId}`);

    // Get all contacts for this user
    const contactsResult = await ContactsActivitiesFirestoreService.getAllContacts(userId, {});
    const contacts = contactsResult.contacts || [];

    // Find contacts stuck in 'fetching' status
    const stuckContacts = contacts.filter((contact: any) =>
      contact.phoneNumberStatus === 'fetching'
    );

    logger.info(`Found ${stuckContacts.length} contacts stuck in 'fetching' status`);

    let resetCount = 0;
    const errors: string[] = [];

    // Reset each stuck contact
    for (const contact of stuckContacts) {
      try {
        await ContactsActivitiesFirestoreService.updateContact(userId, contact.id, {
          phoneNumberStatus: 'unavailable'
        });
        resetCount++;
        logger.info(`Reset phoneNumberStatus for contact ${contact.id} (${contact.name || 'Unknown'})`);
      } catch (error: any) {
        logger.error(`Failed to reset contact ${contact.id}:`, error);
        errors.push(`Contact ${contact.id}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `Reset ${resetCount} contacts that were stuck in 'fetching' status`,
      resetCount,
      totalStuck: stuckContacts.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    logger.error('Reset stuck phone status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset stuck phone statuses: ' + error.message
    });
  }
});

// === ACTIVITY ROUTES ===

// @route   GET /api/firebase-activities
// @desc    Get all activities for the authenticated user
// @access  Private
router.get('/activities', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { dealId, contactId, type, limit = 50, offset = 0 } = req.query;

    const result = await ContactsActivitiesFirestoreService.getAllActivities(userId, {
      dealId: dealId as string,
      contactId: contactId as string,
      type: type as string,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/firebase-activities
// @desc    Create new activity
// @access  Private
router.post('/activities', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;

    // Validate input
    const { error, value } = createActivitySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const result = await ContactsActivitiesFirestoreService.createActivity(userId, value);

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Create activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// === COMMUNICATION ROUTES ===

// @route   GET /api/firebase-communications
// @desc    Get all communications for the authenticated user
// @access  Private
router.get('/communications', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { dealId, contactId, type, limit = 50, offset = 0 } = req.query;

    const result = await ContactsActivitiesFirestoreService.getAllCommunications(userId, {
      dealId: dealId as string,
      contactId: contactId as string,
      type: type as string,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    logger.error('Get communications error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/firebase-communications
// @desc    Create new communication
// @access  Private
router.post('/communications', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;

    // Validate input
    const { error, value } = createCommunicationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        details: error.details.map(d => d.message)
      });
    }

    const result = await ContactsActivitiesFirestoreService.createCommunication(userId, value);

    res.status(201).json({
      success: true,
      message: 'Communication created successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Create communication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/firebase/contacts/:id/email-thread
// @desc    Associate email thread with contact (broker)
// @access  Private
router.post('/contacts/:id/email-thread', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = req.userId!;
    const { id: contactId } = req.params;
    const { threadId, subject } = req.body;

    if (!threadId) {
      return res.status(400).json({
        success: false,
        message: 'Thread ID is required'
      });
    }

    const result = await ContactsActivitiesFirestoreService.associateEmailThread(
      userId,
      contactId,
      threadId,
      subject || '(No Subject)'
    );

    res.json({
      success: true,
      message: 'Email thread associated with contact successfully',
      data: result
    });
  } catch (error: any) {
    logger.error('Associate email thread to contact error:', error);

    if (error.message === 'Contact not found') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;