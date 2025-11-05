import express from 'express';
import multer from 'multer';
import { firebaseAuthMiddleware, FirebaseAuthRequest } from '../middleware/firebaseAuth';
import { VoiceAgentService } from '../services/voiceAgent.service';
import logger from '../utils/logger';

const router = express.Router();

// Add CORS headers for all campaign routes
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Configure multer for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['text/csv', 'application/csv', 'text/plain'];
    if (allowedMimeTypes.includes(file.mimetype) || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only CSV files are allowed.'));
    }
  }
});

// Voice agent service instance
const voiceAgentService = new VoiceAgentService();

/**
 * Format phone number to E.164 format
 */
function formatPhoneNumber(phoneNumber: string): string {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // If starts with 1 and has 11 digits, it's already US format
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  // If has 10 digits, assume US number and add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }

  // If already starts with + return as is
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }

  // For other cases, assume US and add +1
  return `+1${digits}`;
}


// Mock campaign data for development
const mockCampaigns: any[] = [];
let campaignIdCounter = 1;

// Campaign execution queue
interface CampaignExecution {
  campaignId: string;
  userId: string;
  contacts: any[];
  messageTemplate: string;
  voiceId?: string;
  callDelay: number;
  currentIndex: number;
  isRunning: boolean;
}

const activeCampaignExecutions: Map<string, CampaignExecution> = new Map();

/**
 * POST /api/campaigns/parse-csv
 * Parse CSV file and return contacts preview
 */
router.post('/parse-csv', firebaseAuthMiddleware, upload.single('csv'), async (req, res) => {
  try {
    const userId = (req as any).userId || (req as any).user?.uid || (req as any).user?.id;
    const csvFile = req.file;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!csvFile) {
      return res.status(400).json({ error: 'CSV file is required' });
    }

    // Simple CSV parsing
    const csvText = csvFile.buffer.toString('utf-8');
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0]?.split(',').map(h => h.trim());

    const contacts = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      return {
        name: values[0] || `Contact ${index + 1}`,
        phoneNumber: formatPhoneNumber(values[1] || ''),
        companyName: values[2] || '',
        status: 'pending'
      };
    }).filter(contact => contact.phoneNumber);

    // Return preview of contacts
    res.json({
      success: true,
      contacts: contacts.slice(0, 100), // Return first 100 for preview
      totalCount: contacts.length,
      preview: true
    });

  } catch (error) {
    logger.error('Error parsing CSV', error);
    res.status(500).json({
      error: 'Failed to parse CSV file. Please check the format and try again.',
      details: (error as Error).message
    });
  }
});

/**
 * POST /api/campaigns
 * Create a new campaign
 */
router.post('/', firebaseAuthMiddleware, upload.single('csv'), async (req, res) => {
  try {
    const userId = (req as any).userId || (req as any).user?.uid || (req as any).user?.id;
    const csvFile = req.file;
    const {
      name,
      description,
      messageTemplate,
      voiceId,
      callDelay,
      dealType,
      investmentRange,
      industryFocus,
      customInstructions
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!name || !messageTemplate || !csvFile) {
      return res.status(400).json({
        error: 'Missing required fields: name, messageTemplate, and CSV file'
      });
    }

    // Simple CSV parsing
    const csvText = csvFile.buffer.toString('utf-8');
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0]?.split(',').map(h => h.trim());

    const contacts = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim());
      return {
        name: values[0] || `Contact ${index + 1}`,
        phoneNumber: formatPhoneNumber(values[1] || ''),
        companyName: values[2] || '',
        status: 'pending'
      };
    }).filter(contact => contact.phoneNumber);

    if (contacts.length === 0) {
      return res.status(400).json({
        error: 'No valid contacts found in CSV file'
      });
    }

    // Create mock campaign
    const campaign = {
      id: `campaign_${campaignIdCounter++}`,
      name,
      description: description || '',
      messageTemplate,
      voiceId,
      callDelay: parseInt(callDelay) || 30,
      status: 'draft',
      totalContacts: contacts.length,
      completedContacts: 0,
      failedContacts: 0,
      createdAt: new Date(),
      contacts
    };

    mockCampaigns.push(campaign);

    logger.info('Campaign created successfully', {
      campaignId: campaign.id,
      userId,
      contactCount: contacts.length
    });

    res.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        totalContacts: campaign.totalContacts,
        createdAt: campaign.createdAt
      },
      message: 'Campaign created successfully'
    });

  } catch (error) {
    logger.error('Error creating campaign', error);
    res.status(500).json({
      error: 'Failed to create campaign',
      details: (error as Error).message
    });
  }
});

/**
 * GET /api/campaigns
 * Get user's campaigns
 */
router.get('/', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId || (req as any).user?.uid || (req as any).user?.id;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const campaigns = mockCampaigns.slice(0, limit);

    // Remove detailed contact data from list view for performance
    const campaignSummaries = campaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      status: campaign.status,
      totalContacts: campaign.totalContacts,
      completedContacts: campaign.completedContacts,
      failedContacts: campaign.failedContacts,
      createdAt: campaign.createdAt,
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt
    }));

    res.json({
      success: true,
      campaigns: campaignSummaries
    });

  } catch (error) {
    logger.error('Error getting campaigns', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/campaigns/:campaignId
 * Get specific campaign details
 */
router.get('/:campaignId', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId || (req as any).user?.uid || (req as any).user?.id;
    const { campaignId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const campaign = mockCampaigns.find(c => c.id === campaignId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({
      success: true,
      campaign
    });

  } catch (error) {
    logger.error('Error getting campaign details', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/campaigns/:campaignId/stats
 * Get campaign statistics
 */
router.get('/:campaignId/stats', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId || (req as any).user?.uid || (req as any).user?.id;
    const { campaignId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const campaign = mockCampaigns.find(c => c.id === campaignId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const stats = {
      totalContacts: campaign.totalContacts,
      completedContacts: campaign.completedContacts,
      failedContacts: campaign.failedContacts,
      pendingContacts: campaign.totalContacts - campaign.completedContacts - campaign.failedContacts,
      successRate: campaign.completedContacts / campaign.totalContacts * 100
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('Error getting campaign stats', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/campaigns/:campaignId/start
 * Start campaign execution - actually send voicemails
 */
router.post('/:campaignId/start', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId || (req as any).user?.uid || (req as any).user?.id;
    const { campaignId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const campaign = mockCampaigns.find(c => c.id === campaignId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status === 'running') {
      return res.status(400).json({ error: 'Campaign is already running' });
    }

    // Update campaign status
    campaign.status = 'running';
    campaign.startedAt = new Date();

    // Start campaign execution
    await startCampaignExecution(campaignId, userId, campaign);

    logger.info('Campaign started successfully', { campaignId, userId, contactCount: campaign.contacts.length });
    res.json({
      success: true,
      message: 'Campaign started successfully - voicemails are being sent'
    });

  } catch (error) {
    logger.error('Error starting campaign', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/campaigns/:campaignId/pause
 * Pause campaign execution
 */
router.post('/:campaignId/pause', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId || (req as any).user?.uid || (req as any).user?.id;
    const { campaignId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const campaign = mockCampaigns.find(c => c.id === campaignId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    // Stop campaign execution
    const execution = activeCampaignExecutions.get(campaignId);
    if (execution) {
      execution.isRunning = false;
      activeCampaignExecutions.delete(campaignId);
    }

    campaign.status = 'paused';

    logger.info('Campaign paused successfully', { campaignId, userId });
    res.json({
      success: true,
      message: 'Campaign paused successfully'
    });

  } catch (error) {
    logger.error('Error pausing campaign', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/campaigns/:campaignId
 * Delete campaign
 */
router.delete('/:campaignId', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as any).userId || (req as any).user?.uid || (req as any).user?.id;
    const { campaignId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const campaignIndex = mockCampaigns.findIndex(c => c.id === campaignId);

    if (campaignIndex === -1) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    mockCampaigns.splice(campaignIndex, 1);

    logger.info('Campaign deleted successfully', { campaignId, userId });
    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });

  } catch (error) {
    logger.error('Error deleting campaign', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/campaigns/test-message
 * Test message template personalization
 */
router.post('/test-message', firebaseAuthMiddleware, async (req, res) => {
  try {
    const { messageTemplate, testContact } = req.body;

    if (!messageTemplate || !testContact) {
      return res.status(400).json({
        error: 'Message template and test contact are required'
      });
    }

    // Simple template personalization for testing
    let personalizedMessage = messageTemplate;
    personalizedMessage = personalizedMessage.replace(/\{\{contact_name\}\}/g, testContact.name || 'John Doe');
    personalizedMessage = personalizedMessage.replace(/\{\{company_name\}\}/g, testContact.companyName || 'Acme Corp');
    personalizedMessage = personalizedMessage.replace(/\{\{first_name\}\}/g, (testContact.name || 'John').split(' ')[0]);

    res.json({
      success: true,
      personalizedMessage,
      originalTemplate: messageTemplate
    });

  } catch (error) {
    logger.error('Error testing message template', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/campaigns/templates/default
 * Get default message templates
 */
router.get('/templates/default', firebaseAuthMiddleware, async (req, res) => {
  try {
    const templates = [
      {
        id: 'professional-outreach',
        name: 'Professional Outreach',
        description: 'Professional voicemail for business development',
        template: `Hi {{contact_name}}, this is calling from Equitle regarding investment opportunities at {{company_name}}. We specialize in connecting businesses with qualified investors. I'd love to discuss how we might be able to help you with your funding goals. Please give me a call back at your convenience. Thank you and have a great day.`
      },
      {
        id: 'investor-qualification',
        name: 'Investor Qualification',
        description: 'Voicemail to qualify potential investors',
        template: `Hello {{first_name}}, this is calling from Equitle. We're currently working with some exciting investment opportunities in your area of interest. I'd like to learn more about your investment criteria and see if we have any deals that might be a good fit. When you have a moment, please give me a call back. Looking forward to connecting with you.`
      },
      {
        id: 'follow-up',
        name: 'Follow-up Message',
        description: 'Follow-up voicemail for previous conversations',
        template: `Hi {{contact_name}}, this is following up from Equitle. I wanted to touch base about the investment opportunity we discussed for {{company_name}}. I have some additional information that might be of interest to you. Please call me back when you get a chance. Thank you.`
      }
    ];

    res.json({
      success: true,
      templates
    });

  } catch (error) {
    logger.error('Error getting default templates', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Start campaign execution - processes contacts and sends voicemails
 */
async function startCampaignExecution(campaignId: string, userId: string, campaign: any): Promise<void> {
  try {
    logger.info('Starting campaign execution', { campaignId, contactCount: campaign.contacts.length });

    // Create campaign execution context
    const execution: CampaignExecution = {
      campaignId,
      userId,
      contacts: campaign.contacts,
      messageTemplate: campaign.messageTemplate,
      voiceId: campaign.voiceId,
      callDelay: campaign.callDelay * 1000, // Convert to milliseconds
      currentIndex: 0,
      isRunning: true
    };

    activeCampaignExecutions.set(campaignId, execution);

    // Process contacts sequentially with delay
    processNextContact(execution);

  } catch (error) {
    logger.error('Error starting campaign execution', error);
    const campaign = mockCampaigns.find(c => c.id === campaignId);
    if (campaign) {
      campaign.status = 'failed';
    }
  }
}

/**
 * Process next contact in the campaign queue
 */
async function processNextContact(execution: CampaignExecution): Promise<void> {
  if (!execution.isRunning || execution.currentIndex >= execution.contacts.length) {
    // Campaign completed
    completeCampaign(execution.campaignId);
    return;
  }

  const contact = execution.contacts[execution.currentIndex];
  logger.info('Processing contact', {
    campaignId: execution.campaignId,
    contactIndex: execution.currentIndex + 1,
    totalContacts: execution.contacts.length,
    contactName: contact.name,
    phoneNumber: contact.phoneNumber
  });

  try {
    // Personalize message template
    const personalizedMessage = personalizeMessage(execution.messageTemplate, contact);

    // Format phone number to E.164 format for Retell
    const formattedPhoneNumber = formatPhoneNumber(contact.phoneNumber);

    // Create dynamic variables for Retell agent
    const dynamicVariables = {
      contact_name: contact.name || 'there',
      company_name: contact.companyName || 'your company',
      first_name: (contact.name || 'there').split(' ')[0],
      phone_number: formattedPhoneNumber,
      message: personalizedMessage,
      // Additional variables for your prompt
      deal_type: 'investment',
      industry_focus: 'technology and growth sectors',
      investment_range: '$1M - $50M',
      custom_instructions: 'Please mention our focus on helping companies scale and our track record with similar businesses in their sector.'
    };

    logger.info('Sending voicemail', {
      campaignId: execution.campaignId,
      contact: contact.name,
      originalPhoneNumber: contact.phoneNumber,
      formattedPhoneNumber: formattedPhoneNumber,
      personalizedMessage: personalizedMessage.substring(0, 100) + '...'
    });

    // Initiate voicemail call using VoiceAgentService
    const callResult = await voiceAgentService.initiateCall(
      execution.userId,
      formattedPhoneNumber, // Use formatted E.164 phone number
      'voicemail', // This is a voicemail call
      dynamicVariables,
      execution.voiceId
    );

    // Update contact status and campaign progress
    const campaign = mockCampaigns.find(c => c.id === execution.campaignId);
    if (campaign) {
      if (callResult.success) {
        contact.status = 'completed';
        contact.callId = callResult.callId;
        campaign.completedContacts++;
        logger.info('Voicemail sent successfully', {
          campaignId: execution.campaignId,
          contact: contact.name,
          callId: callResult.callId
        });
      } else {
        contact.status = 'failed';
        contact.error = callResult.error;
        campaign.failedContacts++;
        logger.error('Failed to send voicemail', {
          campaignId: execution.campaignId,
          contact: contact.name,
          error: callResult.error
        });
      }
    }

  } catch (error) {
    logger.error('Error processing contact', {
      campaignId: execution.campaignId,
      contact: contact.name,
      error: (error as Error).message
    });

    // Mark contact as failed
    contact.status = 'failed';
    contact.error = (error as Error).message;
    const campaign = mockCampaigns.find(c => c.id === execution.campaignId);
    if (campaign) {
      campaign.failedContacts++;
    }
  }

  // Move to next contact
  execution.currentIndex++;

  // Schedule next contact processing with delay
  setTimeout(() => {
    processNextContact(execution);
  }, execution.callDelay);
}

/**
 * Complete campaign execution
 */
function completeCampaign(campaignId: string): void {
  const campaign = mockCampaigns.find(c => c.id === campaignId);
  if (campaign) {
    campaign.status = 'completed';
    campaign.completedAt = new Date();
    logger.info('Campaign completed', {
      campaignId,
      totalContacts: campaign.totalContacts,
      completedContacts: campaign.completedContacts,
      failedContacts: campaign.failedContacts
    });
  }

  // Remove from active executions
  activeCampaignExecutions.delete(campaignId);
}

/**
 * Personalize message template with contact data
 */
function personalizeMessage(template: string, contact: any): string {
  let message = template;
  message = message.replace(/\{\{contact_name\}\}/g, contact.name || 'there');
  message = message.replace(/\{\{company_name\}\}/g, contact.companyName || 'your company');
  message = message.replace(/\{\{first_name\}\}/g, (contact.name || 'there').split(' ')[0]);
  return message;
}

console.log('🚀 Campaign Routes Loaded Successfully');

export default router;