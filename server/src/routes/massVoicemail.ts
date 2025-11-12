import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';
import { ElevenLabsService } from '../services/elevenlabs.service';
import { SlybroadcastService, IndividualVoicemailRequest } from '../services/slybroadcast.service';
import logger from '../utils/logger';
import { io } from '../index';
import { db, FirestoreHelpers } from '../lib/firebase';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

interface Contact {
  name: string;
  first_name?: string;
  phone: string;
  company: string;
  title?: string;
  industry?: string;
  location?: string;
}

interface VoiceClone {
  voice_id: string;
  name: string;
  status: 'cloning' | 'ready' | 'failed';
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  status: 'creating' | 'generating' | 'completed' | 'failed';
  progress: number;
  total_contacts: number;
  completed_contacts: number;
  voice_clone_name: string;
  voice_id: string;
  template: string;
  created_at: string;
  contacts: Contact[];
  generated_files: string[];
  voicemailStatus?: string;
  voicemailBroadcastId?: string;
  validPhones?: string[];
  invalidPhones?: string[];
  voicemailSentAt?: string;
}

// In-memory storage for voice clones (these come from ElevenLabs API)
const voiceClones: VoiceClone[] = [];

// Firestore collection for campaigns (persistent storage)
const CAMPAIGNS_COLLECTION = 'massVoicemailCampaigns';

const elevenLabsService = new ElevenLabsService();

// Helper functions for Firestore campaign operations
async function saveCampaignToFirestore(campaign: Campaign): Promise<void> {
  try {
    const campaignRef = db.collection(CAMPAIGNS_COLLECTION).doc(campaign.id);
    await campaignRef.set({
      ...campaign,
      updatedAt: FirestoreHelpers.serverTimestamp(),
    }, { merge: true });
    logger.debug('Campaign saved to Firestore', { campaignId: campaign.id });
  } catch (error) {
    logger.error('Failed to save campaign to Firestore', { campaignId: campaign.id, error });
    throw error;
  }
}

async function getCampaignFromFirestore(campaignId: string): Promise<Campaign | null> {
  try {
    const campaignDoc = await db.collection(CAMPAIGNS_COLLECTION).doc(campaignId).get();
    if (!campaignDoc.exists) {
      return null;
    }
    return campaignDoc.data() as Campaign;
  } catch (error) {
    logger.error('Failed to get campaign from Firestore', { campaignId, error });
    throw error;
  }
}

async function getAllCampaignsFromFirestore(): Promise<Campaign[]> {
  try {
    const snapshot = await db.collection(CAMPAIGNS_COLLECTION)
      .orderBy('created_at', 'desc')
      .get();
    return snapshot.docs.map(doc => doc.data() as Campaign);
  } catch (error) {
    logger.error('Failed to get campaigns from Firestore', { error });
    // If ordering fails, try without orderBy
    try {
      const snapshot = await db.collection(CAMPAIGNS_COLLECTION).get();
      return snapshot.docs.map(doc => doc.data() as Campaign);
    } catch (fallbackError) {
      logger.error('Failed to get campaigns from Firestore (fallback)', { error: fallbackError });
      return [];
    }
  }
}

async function updateCampaignInFirestore(campaignId: string, updates: Partial<Campaign>): Promise<void> {
  try {
    const campaignRef = db.collection(CAMPAIGNS_COLLECTION).doc(campaignId);
    await campaignRef.update({
      ...updates,
      updatedAt: FirestoreHelpers.serverTimestamp(),
    });
    logger.debug('Campaign updated in Firestore', { campaignId, updates });
  } catch (error) {
    logger.error('Failed to update campaign in Firestore', { campaignId, error });
    throw error;
  }
}

// Get all voice clones
router.get('/voices', async (req: Request, res: Response) => {
  try {
    // Get clones from ElevenLabs API and merge with local storage
    const remoteVoices = await elevenLabsService.getVoices();
    const clonedVoices = remoteVoices
      .filter(voice => voice.category === 'cloned')
      .map(voice => ({
        voice_id: voice.voice_id,
        name: voice.name,
        status: 'ready' as const,
        created_at: new Date().toISOString(),
      }));

    res.json(clonedVoices);
  } catch (error) {
    logger.error('Failed to get voices:', error);
    res.status(500).json({ message: 'Failed to get voices' });
  }
});

// Clone voice from audio file
router.post('/clone-voice', upload.single('audio'), async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    const audioFile = req.file;

    if (!audioFile || !name) {
      return res.status(400).json({ message: 'Audio file and name are required' });
    }

    // Read the uploaded file
    const audioBuffer = fs.readFileSync(audioFile.path);

    // Validate audio file
    const validation = elevenLabsService.validateAudioFile(audioBuffer);
    if (!validation.valid) {
      // Clean up uploaded file
      fs.unlinkSync(audioFile.path);
      return res.status(400).json({ message: validation.error });
    }

    // Clone voice with ElevenLabs
    const clonedVoice = await elevenLabsService.cloneVoice(name, audioBuffer);

    // Clean up uploaded file
    fs.unlinkSync(audioFile.path);

    // Add to local storage
    const voiceClone: VoiceClone = {
      voice_id: clonedVoice.voice_id,
      name: clonedVoice.name,
      status: 'ready',
      created_at: new Date().toISOString(),
    };

    voiceClones.push(voiceClone);

    res.json({ message: 'Voice cloned successfully', voice: voiceClone });
  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        logger.error('Failed to cleanup uploaded file:', cleanupError);
      }
    }

    logger.error('Failed to clone voice:', error);
    res.status(500).json({ message: 'Failed to clone voice', error: (error as Error).message });
  }
});

// Parse contacts from uploaded file
router.post('/parse-contacts', upload.single('contacts'), async (req: Request, res: Response) => {
  try {
    const contactsFile = req.file;

    if (!contactsFile) {
      return res.status(400).json({ message: 'Contacts file is required' });
    }

    let contacts: Contact[] = [];

    const fileExtension = path.extname(contactsFile.originalname).toLowerCase();

    if (fileExtension === '.csv') {
      // Parse CSV file
      const csvData = fs.readFileSync(contactsFile.path, 'utf-8');
      const lines = csvData.split('\n').filter(line => line.trim());

      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const contact: any = {};

        headers.forEach((header, index) => {
          if (values[index]) {
            contact[header] = values[index];
          }
        });

        // Map common field names
        const mappedContact: Contact = {
          name: contact.name || contact.full_name || `${contact.first_name} ${contact.last_name}`.trim(),
          first_name: contact.first_name || contact.name?.split(' ')[0],
          phone: contact.phone || contact.phone_number || contact.mobile,
          company: contact.company || contact.company_name || contact.organization,
          title: contact.title || contact.job_title || contact.position,
          industry: contact.industry || contact.sector,
          location: contact.location || contact.city || contact.address,
        };

        if (mappedContact.name && mappedContact.phone && mappedContact.company) {
          contacts.push(mappedContact);
        }
      }
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // Parse Excel file
      const workbook = XLSX.readFile(contactsFile.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      contacts = jsonData.map((row: any) => {
        const mappedContact: Contact = {
          name: row.name || row.full_name || row.Name || `${row.first_name || row['First Name']} ${row.last_name || row['Last Name']}`.trim(),
          first_name: row.first_name || row['First Name'] || row.name?.split(' ')[0],
          phone: row.phone || row.phone_number || row['Phone Number'] || row.mobile || row.Mobile,
          company: row.company || row.company_name || row['Company Name'] || row.Company || row.organization,
          title: row.title || row.job_title || row['Job Title'] || row.Title || row.position,
          industry: row.industry || row.Industry || row.sector,
          location: row.location || row.Location || row.city || row.City || row.address,
        };

        return mappedContact;
      }).filter(contact => contact.name && contact.phone && contact.company);
    } else {
      throw new Error('Unsupported file format. Please use CSV or Excel files.');
    }

    // Clean up uploaded file
    fs.unlinkSync(contactsFile.path);

    res.json({
      message: 'Contacts parsed successfully',
      contacts: contacts.slice(0, 100), // Limit preview to 100 contacts
      total: contacts.length
    });

  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        logger.error('Failed to cleanup uploaded file:', cleanupError);
      }
    }

    logger.error('Failed to parse contacts:', error);
    res.status(500).json({ message: 'Failed to parse contacts', error: (error as Error).message });
  }
});

// Create new campaign
router.post('/create-campaign', upload.single('contacts'), async (req: Request, res: Response) => {
  try {
    logger.info('🚀 Starting campaign creation', {
      name: req.body.name,
      template: req.body.template,
      voice_id: req.body.voice_id,
      hasContactsFile: !!req.file,
      fileName: req.file?.originalname
    });

    const { name, template, voice_id } = req.body;
    const contactsFile = req.file;

    if (!name || !template || !voice_id || !contactsFile) {
      logger.error('❌ Campaign creation failed - missing required fields', {
        hasName: !!name,
        hasTemplate: !!template,
        hasVoiceId: !!voice_id,
        hasContactsFile: !!contactsFile
      });
      return res.status(400).json({ message: 'All fields are required' });
    }

    logger.info('✅ All required fields present, parsing contacts...');

    // Parse contacts (reuse logic from parse-contacts)
    let contacts: Contact[] = [];
    const fileExtension = path.extname(contactsFile.originalname).toLowerCase();

    logger.info('📄 Parsing file type', { fileExtension, fileName: contactsFile.originalname });

    if (fileExtension === '.csv') {
      logger.info('📊 Processing CSV file...');
      const csvData = fs.readFileSync(contactsFile.path, 'utf-8');
      const lines = csvData.split('\n').filter(line => line.trim());

      logger.info('📋 CSV data read', { totalLines: lines.length });

      if (lines.length < 2) {
        logger.error('❌ CSV file invalid - not enough lines', { lineCount: lines.length });
        throw new Error('CSV file must have at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      logger.info('📝 CSV headers detected', { headers });

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const contact: any = {};

        headers.forEach((header, index) => {
          if (values[index]) {
            contact[header] = values[index];
          }
        });

        const mappedContact: Contact = {
          name: contact.name || contact.full_name || `${contact.first_name} ${contact.last_name}`.trim(),
          first_name: contact.first_name || contact.name?.split(' ')[0],
          phone: contact.phone || contact.phone_number || contact.mobile,
          company: contact.company || contact.company_name || contact.organization,
          title: contact.title || contact.job_title || contact.position,
          industry: contact.industry || contact.sector,
          location: contact.location || contact.city || contact.address,
        };

        if (mappedContact.name && mappedContact.phone && mappedContact.company) {
          contacts.push(mappedContact);
          logger.debug('✅ Contact mapped successfully', {
            name: mappedContact.name,
            phone: mappedContact.phone,
            company: mappedContact.company
          });
        } else {
          logger.warn('⚠️ Contact skipped - missing required fields', {
            line: i + 1,
            hasName: !!mappedContact.name,
            hasPhone: !!mappedContact.phone,
            hasCompany: !!mappedContact.company,
            rawData: contact
          });
        }
      }
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      const workbook = XLSX.readFile(contactsFile.path);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      contacts = jsonData.map((row: any) => {
        const mappedContact: Contact = {
          name: row.name || row.full_name || row.Name || `${row.first_name || row['First Name']} ${row.last_name || row['Last Name']}`.trim(),
          first_name: row.first_name || row['First Name'] || row.name?.split(' ')[0],
          phone: row.phone || row.phone_number || row['Phone Number'] || row.mobile || row.Mobile,
          company: row.company || row.company_name || row['Company Name'] || row.Company || row.organization,
          title: row.title || row.job_title || row['Job Title'] || row.Title || row.position,
          industry: row.industry || row.Industry || row.sector,
          location: row.location || row.Location || row.city || row.City || row.address,
        };

        return mappedContact;
      }).filter(contact => contact.name && contact.phone && contact.company);
    }

    // Get voice clone name
    const voiceClone = await elevenLabsService.getVoice(voice_id);
    const voiceCloneName = voiceClone?.name || 'Unknown Voice';

    // Create campaign
    const campaign: Campaign = {
      id: `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      status: 'creating',
      progress: 0,
      total_contacts: contacts.length,
      completed_contacts: 0,
      voice_clone_name: voiceCloneName,
      voice_id,
      template,
      created_at: new Date().toISOString(),
      contacts,
      generated_files: [],
    };

    // Save campaign to Firestore (persistent storage)
    await saveCampaignToFirestore(campaign);

    // Clean up uploaded file
    fs.unlinkSync(contactsFile.path);

    // Start MP3 generation in background
    generateCampaignMP3s(campaign.id);

    res.json({ message: 'Campaign created successfully', campaign: {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      total_contacts: campaign.total_contacts
    } });

  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        logger.error('Failed to cleanup uploaded file:', cleanupError);
      }
    }

    logger.error('Failed to create campaign:', error);
    res.status(500).json({ message: 'Failed to create campaign', error: (error as Error).message });
  }
});

// Get all campaigns
router.get('/campaigns', async (req: Request, res: Response) => {
  try {
    const campaigns = await getAllCampaignsFromFirestore();
    const campaignList = campaigns.map(campaign => ({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      progress: campaign.progress,
      total_contacts: campaign.total_contacts,
      completed_contacts: campaign.completed_contacts,
      voice_clone_name: campaign.voice_clone_name,
      created_at: campaign.created_at,
    }));

    res.json(campaignList);
  } catch (error) {
    logger.error('Failed to get campaigns:', error);
    res.status(500).json({ message: 'Failed to get campaigns' });
  }
});

// Get campaign details
router.get('/campaigns/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaign = await getCampaignFromFirestore(id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json(campaign);
  } catch (error) {
    logger.error('Failed to get campaign:', error);
    res.status(500).json({ message: 'Failed to get campaign' });
  }
});

// Download campaign MP3 files
router.get('/campaigns/:id/download', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const campaign = await getCampaignFromFirestore(id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (campaign.status !== 'completed') {
      return res.status(400).json({ message: 'Campaign not yet completed' });
    }

    logger.info('📥 Download request received', {
      campaignId: id,
      campaignStatus: campaign.status,
      generatedFilesCount: campaign.generated_files.length,
      generatedFiles: campaign.generated_files
    });

    if (campaign.generated_files.length === 0) {
      return res.status(400).json({ message: 'No MP3 files found for this campaign' });
    }

    const campaignDir = path.join('uploads', 'campaigns', id);

    // If only one file, download it directly
    if (campaign.generated_files.length === 1) {
      const filePath = path.join(campaignDir, campaign.generated_files[0]);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'MP3 file not found' });
      }

      logger.info('🎵 Serving MP3 file for download', {
        campaignId: id,
        fileName: campaign.generated_files[0],
        filePath
      });

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Disposition', `attachment; filename="${campaign.generated_files[0]}"`);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } else {
      // TODO: For multiple files, create zip archive
      res.json({
        message: 'Multiple files - zip download coming soon',
        files: campaign.generated_files,
        note: 'Use individual file download for now'
      });
    }
  } catch (error) {
    logger.error('Failed to download campaign files:', error);
    res.status(500).json({ message: 'Failed to download campaign files' });
  }
});

// Helper function to substitute variables in template
function substituteTemplate(template: string, contact: Contact): string {
  let result = template;

  // Replace variables with contact data
  result = result.replace(/{name}/g, contact.name || '');
  result = result.replace(/{first_name}/g, contact.first_name || contact.name?.split(' ')[0] || '');
  result = result.replace(/{company}/g, contact.company || '');
  result = result.replace(/{title}/g, contact.title || '');
  result = result.replace(/{industry}/g, contact.industry || '');
  result = result.replace(/{location}/g, contact.location || '');

  return result;
}

// Background function to generate MP3s for campaign
async function generateCampaignMP3s(campaignId: string): Promise<void> {
  logger.info('🎵 Starting MP3 generation for campaign', { campaignId });

  let campaign = await getCampaignFromFirestore(campaignId);
  if (!campaign) {
    logger.error('❌ Campaign not found for MP3 generation', { campaignId });
    return;
  }

  try {
    logger.info('📊 Campaign found, updating status to generating', {
      campaignId,
      campaignName: campaign.name,
      totalContacts: campaign.contacts.length,
      voiceId: campaign.voice_id
    });

    campaign.status = 'generating';
    await updateCampaignInFirestore(campaignId, { status: 'generating' });

    // Create campaign directory for MP3 files
    const campaignDir = path.join('uploads', 'campaigns', campaignId);
    logger.info('📁 Creating campaign directory', { campaignDir });

    if (!fs.existsSync(campaignDir)) {
      fs.mkdirSync(campaignDir, { recursive: true });
      logger.info('✅ Campaign directory created successfully');
    } else {
      logger.info('📂 Campaign directory already exists');
    }

    const totalContacts = campaign.contacts.length;
    let completedCount = 0;

    logger.info('🔄 Starting contact processing loop', { totalContacts });

    for (const contact of campaign.contacts) {
      try {
        logger.info('👤 Processing contact', {
          name: contact.name,
          company: contact.company,
          phone: contact.phone,
          contactIndex: completedCount + 1,
          totalContacts
        });

        // Generate personalized message
        const personalizedMessage = substituteTemplate(campaign.template, contact);
        logger.info('💬 Message personalized', {
          originalTemplate: campaign.template,
          personalizedMessage: personalizedMessage.substring(0, 100) + '...',
          contactName: contact.name
        });

        // Test ElevenLabs service connection first
        logger.info('🔌 Testing ElevenLabs connection before generating MP3...');
        const connectionTest = await elevenLabsService.testConnection();
        if (!connectionTest) {
          logger.error('❌ ElevenLabs connection test failed');
          throw new Error('ElevenLabs service unavailable');
        }
        logger.info('✅ ElevenLabs connection confirmed');

        // Generate MP3 with ElevenLabs
        logger.info('🎤 Calling ElevenLabs textToSpeech API', {
          textLength: personalizedMessage.length,
          voiceId: campaign.voice_id
        });

        const mp3Buffer = await elevenLabsService.textToSpeech({
          text: personalizedMessage,
          voice_id: campaign.voice_id,
        });

        logger.info('🎵 MP3 buffer received from ElevenLabs', {
          bufferSize: mp3Buffer.length,
          bufferType: typeof mp3Buffer
        });

        // Save MP3 file
        const fileName = `${campaignId}_${contact.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.mp3`;
        const filePath = path.join(campaignDir, fileName);

        logger.info('💾 Saving MP3 file', { fileName, filePath });

        fs.writeFileSync(filePath, mp3Buffer);
        logger.info('✅ MP3 file saved successfully');

        campaign.generated_files.push(fileName);
        completedCount++;
        campaign.completed_contacts = completedCount;
        campaign.progress = Math.round((completedCount / totalContacts) * 100);

        // Update campaign in Firestore
        await updateCampaignInFirestore(campaignId, {
          generated_files: campaign.generated_files,
          completed_contacts: completedCount,
          progress: campaign.progress,
        });

        // Emit real-time progress update
        io.emit('campaign-progress', {
          campaignId: campaignId,
          progress: campaign.progress,
          completed: completedCount,
          total: totalContacts,
          status: campaign.status,
          currentContact: contact.name
        });

        logger.info(`🎉 Generated MP3 for ${contact.name} (${completedCount}/${totalContacts})`, {
          progress: campaign.progress,
          fileName
        });

        // Add small delay to respect API rate limits
        logger.info('⏱️ Waiting 1 second for rate limiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        logger.error(`❌ Failed to generate MP3 for ${contact.name}:`, {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
          contactName: contact.name,
          voiceId: campaign.voice_id
        });
        // Continue with next contact
      }
    }

    const finalStatus = completedCount === totalContacts ? 'completed' : 'failed';
    campaign.status = finalStatus;

    // Update campaign status in Firestore
    await updateCampaignInFirestore(campaignId, { status: finalStatus });

    // Emit final campaign status update
    io.emit('campaign-completed', {
      campaignId: campaignId,
      status: finalStatus,
      completed: completedCount,
      total: totalContacts,
      progress: 100,
      generatedFiles: campaign.generated_files.length
    });

    logger.info(`🏁 Campaign ${campaignId} ${finalStatus}`, {
      campaignId,
      completedCount,
      totalContacts,
      successRate: `${completedCount}/${totalContacts}`,
      generatedFiles: campaign.generated_files.length
    });

  } catch (error) {
    await updateCampaignInFirestore(campaignId, { status: 'failed' });
    logger.error(`💥 Campaign ${campaignId} failed with critical error:`, {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      campaignId
    });
  }
}

// Serve MP3 file directly (public endpoint for Slybroadcast)
router.get('/mp3/:campaignId/:filename', async (req: Request, res: Response) => {
  try {
    const { campaignId, filename } = req.params;
    
    // Security: Validate inputs to prevent path traversal attacks
    if (!campaignId || !filename || 
        campaignId.includes('..') || filename.includes('..') ||
        campaignId.includes('/') || filename.includes('/') ||
        !/^[a-zA-Z0-9._-]+$/.test(campaignId) || 
        !/^[a-zA-Z0-9._-]+\.mp3$/.test(filename)) {
      logger.warn('⚠️ Invalid MP3 request parameters', { campaignId, filename });
      return res.status(400).json({ message: 'Invalid request parameters' });
    }
    
    const filePath = path.join('uploads', 'campaigns', campaignId, filename);
    
    // Additional security: Ensure resolved path is within uploads directory
    const resolvedPath = path.resolve(filePath);
    const uploadsDir = path.resolve('uploads', 'campaigns');
    if (!resolvedPath.startsWith(uploadsDir)) {
      logger.warn('⚠️ Path traversal attempt detected', { campaignId, filename, resolvedPath });
      return res.status(400).json({ message: 'Invalid file path' });
    }

    logger.info('🎵 Direct MP3 file request', { campaignId, filename, filePath });

    if (!fs.existsSync(filePath)) {
      logger.warn('⚠️ MP3 file not found', { campaignId, filename, filePath });
      return res.status(404).json({ message: 'MP3 file not found' });
    }

    // Set headers for public access and proper content type
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Don't set Content-Disposition to allow direct playback/download by Slybroadcast
    const fileStream = fs.createReadStream(filePath);
    fileStream.on('error', (error) => {
      logger.error('Error streaming MP3 file:', { campaignId, filename, error });
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming file' });
      }
    });
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Failed to serve MP3 file:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Failed to serve MP3 file' });
    }
  }
});

// Helper function to generate public MP3 URL
function getPublicMp3Url(campaignId: string, filename: string, req?: Request): string {
  // Prefer BASE_URL or BACKEND_URL environment variable for production
  const baseUrl = process.env.BASE_URL || 
                  process.env.BACKEND_URL ||
                  (req ? `${req.protocol}://${req.get('host')}` : 'http://localhost:4001');
  
  // Ensure URL doesn't end with slash
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  
  // CRITICAL: Check if URL is localhost (won't work for Slybroadcast)
  if (cleanBaseUrl.includes('localhost') || cleanBaseUrl.includes('127.0.0.1')) {
    logger.warn('⚠️ BASE_URL/BACKEND_URL not set - using localhost (will not work for Slybroadcast)', {
      baseUrl: cleanBaseUrl,
      hint: 'Set BASE_URL or BACKEND_URL environment variable to your production domain'
    });
    // Still generate the URL but log warning - let the validation catch it
  }
  
  // Validate campaignId and filename to prevent path traversal
  if (!campaignId || !filename || campaignId.includes('..') || filename.includes('..')) {
    throw new Error('Invalid campaign ID or filename');
  }
  
  const fullUrl = `${cleanBaseUrl}/api/mass-voicemail/mp3/${campaignId}/${encodeURIComponent(filename)}`;
  
  // Final validation
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    throw new Error(`Generated URL is not valid: ${fullUrl}`);
  }
  
  return fullUrl;
}

// Send personalized voicemail campaign using Slybroadcast
router.post('/campaigns/:id/send-personalized-voicemails', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    const { callerIdNumber, callerIdName } = req.body;

    logger.info('📞 Starting personalized voicemail delivery for campaign', {
      campaignId,
      callerIdNumber,
      callerIdName
    });

    // Get campaign from Firestore
    const campaign = await getCampaignFromFirestore(campaignId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'completed') {
      return res.status(400).json({ error: 'Campaign must be completed before sending voicemails' });
    }

    // Initialize Slybroadcast service
    const slybroadcastService = new SlybroadcastService();

    // Test connection first
    const connectionTest = await slybroadcastService.testConnection();
    if (!connectionTest) {
      return res.status(500).json({ error: 'Unable to connect to Slybroadcast. Please check credentials.' });
    }

    // Get campaign directory
    const campaignDir = path.join('uploads/campaigns', campaignId);

    if (!fs.existsSync(campaignDir)) {
      return res.status(400).json({ error: 'Campaign files not found' });
    }

    // Create individual voicemail requests for each contact
    const voicemailRequests: IndividualVoicemailRequest[] = [];

    for (const contact of campaign.contacts) {
      // Find the corresponding MP3 file for this contact
      const mp3Files = fs.readdirSync(campaignDir).filter(file =>
        file.endsWith('.mp3') && file.includes(contact.name.replace(/[^a-zA-Z0-9]/g, '_'))
      );

      if (mp3Files.length > 0) {
        const mp3File = mp3Files[0];
        try {
          // Generate public URL for Slybroadcast (required by their API)
          const mp3Url = getPublicMp3Url(campaignId, mp3File, req);

          // Validate URL is not empty and looks like a valid URL
          if (!mp3Url || !mp3Url.trim() || !mp3Url.startsWith('http')) {
            throw new Error(`Invalid URL generated: ${mp3Url}`);
          }

          logger.info('🔗 Generated public MP3 URL for Slybroadcast', {
            contactName: contact.name,
            filename: mp3File,
            mp3Url,
            urlLength: mp3Url.length
          });

          voicemailRequests.push({
            phoneNumber: contact.phone,
            mp3Url: mp3Url.trim(), // Use public URL instead of file path
            callerIdNumber,
            callerIdName,
            title: `${campaign.name} - ${contact.name}`
          });
        } catch (error) {
          logger.error('❌ Failed to generate MP3 URL', {
            contactName: contact.name,
            filename: mp3File,
            error: (error as Error).message,
            campaignId
          });
          // Skip this contact if URL generation fails - don't fall back to file path
          // Slybroadcast requires URLs, not base64
        }
      } else {
        logger.warn('⚠️ No MP3 file found for contact', {
          contactName: contact.name,
          campaignId
        });
      }
    }

    if (voicemailRequests.length === 0) {
      return res.status(400).json({ error: 'No valid MP3 files found for contacts' });
    }

    logger.info('📋 Prepared personalized voicemail requests', {
      totalRequests: voicemailRequests.length,
      totalContacts: campaign.contacts.length
    });

    // Send personalized voicemails
    const result = await slybroadcastService.sendPersonalizedVoicemails(voicemailRequests);

    // Update campaign status in Firestore
    const voicemailSentAt = new Date().toISOString();
    await updateCampaignInFirestore(campaignId, {
      voicemailStatus: 'sent',
      voicemailSentAt,
    });

    // Emit voicemail delivery completion
    io.emit('voicemail-delivery-completed', {
      campaignId,
      successful: result.successful.length,
      failed: result.failed.length,
      total: voicemailRequests.length,
      results: result
    });

    logger.info('🎉 Personalized voicemail campaign completed', {
      campaignId,
      successful: result.successful.length,
      failed: result.failed.length,
      total: voicemailRequests.length
    });

    res.json({
      success: true,
      message: 'Personalized voicemail campaign sent',
      results: {
        successful: result.successful.length,
        failed: result.failed.length,
        total: voicemailRequests.length,
        successfulDeliveries: result.successful,
        failedDeliveries: result.failed
      },
      campaignUpdate: {
        voicemailStatus: 'sent',
        voicemailSentAt
      }
    });

  } catch (error) {
    logger.error('❌ Error sending personalized voicemail campaign', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Send voicemail campaign using Slybroadcast (original bulk method)
router.post('/campaigns/:id/send-voicemails', async (req: Request, res: Response) => {
  try {
    const { id: campaignId } = req.params;
    const { callerIdNumber, callerIdName } = req.body;

    logger.info('📞 Starting voicemail delivery for campaign', {
      campaignId,
      callerIdNumber,
      callerIdName
    });

    // Get campaign from Firestore
    const campaign = await getCampaignFromFirestore(campaignId);

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'completed') {
      return res.status(400).json({ error: 'Campaign must be completed before sending voicemails' });
    }

    // Initialize Slybroadcast service
    const slybroadcastService = new SlybroadcastService();

    // Test Slybroadcast connection first
    const connectionTest = await slybroadcastService.testConnection();
    if (!connectionTest) {
      return res.status(500).json({ error: 'Unable to connect to Slybroadcast. Please check credentials.' });
    }

    // Get the MP3 file path
    const campaignDir = path.join('uploads/campaigns', campaignId);
    const mp3Files = fs.readdirSync(campaignDir).filter(file => file.endsWith('.mp3'));

    if (mp3Files.length === 0) {
      return res.status(400).json({ error: 'No MP3 files found for this campaign' });
    }

    // Generate public URL for Slybroadcast (required by their API)
    const mp3File = mp3Files[0];
    let mp3Url: string;
    try {
      mp3Url = getPublicMp3Url(campaignId, mp3File, req);
      logger.info('🔗 Generated public MP3 URL for bulk voicemail', {
        filename: mp3File,
        mp3Url
      });
    } catch (error) {
      logger.error('❌ Failed to generate MP3 URL', {
        filename: mp3File,
        error: (error as Error).message
      });
      return res.status(500).json({ 
        error: 'Failed to generate MP3 URL. Please ensure BASE_URL or BACKEND_URL environment variable is set.' 
      });
    }

    // Format and validate phone numbers
    const phoneNumbers = campaign.contacts.map((contact: Contact) => contact.phone?.toString() || '');
    const { valid: validPhones, invalid: invalidPhones } = slybroadcastService.validatePhoneNumbers(phoneNumbers);

    logger.info('📋 Phone number validation results', {
      total: phoneNumbers.length,
      valid: validPhones.length,
      invalid: invalidPhones.length,
      invalidNumbers: invalidPhones
    });

    if (validPhones.length === 0) {
      return res.status(400).json({
        error: 'No valid phone numbers found',
        invalidNumbers: invalidPhones
      });
    }

    // Send voicemail campaign using public URL
    const result = await slybroadcastService.sendVoicemailCampaign({
      phoneNumbers: validPhones,
      mp3Url: mp3Url, // Use public URL for Slybroadcast
      callerIdNumber,
      callerIdName,
      title: campaign.name
    });

    if (result.success) {
      // Update campaign status in Firestore
      const voicemailSentAt = new Date().toISOString();
      await updateCampaignInFirestore(campaignId, {
        voicemailStatus: 'sent',
        voicemailBroadcastId: result.broadcastId,
        validPhones,
        invalidPhones,
        voicemailSentAt,
      });

      logger.info('🎉 Voicemail campaign sent successfully', {
        campaignId,
        broadcastId: result.broadcastId,
        validPhones: validPhones.length,
        invalidPhones: invalidPhones.length
      });

      res.json({
        success: true,
        message: 'Voicemail campaign sent successfully',
        broadcastId: result.broadcastId,
        sentTo: validPhones.length,
        invalidNumbers: invalidPhones,
        campaignUpdate: {
          voicemailStatus: 'sent',
          voicemailBroadcastId: result.broadcastId,
          voicemailSentAt
        }
      });
    } else {
      logger.error('❌ Failed to send voicemail campaign', { error: result.error });
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to send voicemail campaign'
      });
    }

  } catch (error) {
    logger.error('❌ Error sending voicemail campaign', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test Slybroadcast connection
router.get('/test-slybroadcast', async (req: Request, res: Response) => {
  try {
    const slybroadcastService = new SlybroadcastService();
    const isConnected = await slybroadcastService.testConnection();

    res.json({
      success: true,
      connected: isConnected,
      message: isConnected ? 'Slybroadcast connection successful' : 'Slybroadcast connection failed - check credentials'
    });
  } catch (error) {
    logger.error('Error testing Slybroadcast connection', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test Slybroadcast connection'
    });
  }
});

// Test individual voicemail sending
router.post('/test-individual-voicemail', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, mp3Url, mp3FilePath, callerIdNumber, callerIdName } = req.body;

    if (!phoneNumber || (!mp3Url && !mp3FilePath) || !callerIdNumber) {
      return res.status(400).json({
        error: 'phoneNumber, (mp3Url or mp3FilePath), and callerIdNumber are required'
      });
    }

    const slybroadcastService = new SlybroadcastService();

    logger.info('🧪 Testing individual voicemail delivery', {
      phoneNumber,
      mp3Url,
      callerIdNumber,
      callerIdName
    });

    const result = await slybroadcastService.sendIndividualVoicemail({
      phoneNumber,
      mp3Url,
      mp3FilePath,
      callerIdNumber,
      callerIdName,
      title: 'Test Voicemail'
    });

    res.json({
      success: result.success,
      result,
      message: result.success ? 'Test voicemail sent successfully!' : 'Test voicemail failed'
    });

  } catch (error) {
    logger.error('Error testing individual voicemail', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test individual voicemail'
    });
  }
});

export default router;
