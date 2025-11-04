import express from 'express';
import Joi from 'joi';
import { firebaseAuthMiddleware, FirebaseAuthRequest } from '../middleware/firebaseAuth';
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
router.get('/contacts', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
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
router.get('/contacts/:id', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
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
router.post('/contacts', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
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
router.put('/contacts/:id', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
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
router.delete('/contacts/:id', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const result = await ContactsActivitiesFirestoreService.deleteContact(userId, id);

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
      message: 'Server error'
    });
  }
});

// @route   POST /api/firebase/contacts/bulk-save
// @desc    Bulk save enriched contacts from Apollo
// @access  Private
router.post('/contacts/bulk-save', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { contacts: enrichedContacts, contactType } = req.body;

    if (!enrichedContacts || !Array.isArray(enrichedContacts)) {
      return res.status(400).json({ success: false, error: 'Invalid contacts data' });
    }

    logger.info(`Bulk saving ${enrichedContacts.length} ${contactType} contacts for user ${userId}`);

    const savedContacts = [];
    const skippedContacts = [];

    for (const enrichedContact of enrichedContacts) {
      try {
        logger.info(`Processing contact: ${enrichedContact.name}`, { enrichedContact });
        
        // Check if contact already exists by email
        let existingContacts = [];
        if (enrichedContact.email && 
            enrichedContact.email !== 'email_not_unlocked' && 
            !enrichedContact.email.includes('email_not_unlocked')) {
          existingContacts = await ContactsActivitiesFirestoreService.getAllContacts(userId, {
            email: enrichedContact.email
          });
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
          if (enrichedContact.phone) contactData.phone = enrichedContact.phone;
          if (enrichedContact.linkedin_url) contactData.linkedinUrl = enrichedContact.linkedin_url;
          if (enrichedContact.title) contactData.title = enrichedContact.title;
          if (enrichedContact.company) contactData.company = enrichedContact.company;
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

// === ACTIVITY ROUTES ===

// @route   GET /api/firebase-activities
// @desc    Get all activities for the authenticated user
// @access  Private
router.get('/activities', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
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
router.post('/activities', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
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
router.get('/communications', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
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
router.post('/communications', firebaseAuthMiddleware, async (req: FirebaseAuthRequest, res) => {
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

export default router;