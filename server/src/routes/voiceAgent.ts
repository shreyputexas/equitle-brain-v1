import express from 'express';
import multer from 'multer';
import { VoiceAgentService } from '../services/voiceAgent.service';
import { RetellService } from '../services/retell.service';
import { ElevenLabsService } from '../services/elevenlabs.service';
import { OpenAIService } from '../services/openai.service';
import { firebaseAuthMiddleware, FirebaseAuthRequest } from '../middleware/firebaseAuth';
import logger from '../utils/logger';
// NOTE: io will be injected via dependency injection to avoid circular imports

const router = express.Router();

// Add CORS headers for all voice agent routes
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

// Test endpoint to verify route is working
router.get('/test', (req, res) => {
  console.log('🧪 TEST ROUTE HIT');
  res.json({ message: 'Voice agent route is working!', timestamp: new Date().toISOString() });
});

// ElevenLabs voices endpoint (no auth required) - matches mass voicemail implementation
router.get('/elevenlabs-voices', async (req, res) => {
  console.log('🎤 ELEVENLABS VOICES ROUTE HIT');
  try {
    const elevenLabsService = new ElevenLabsService();
    const remoteVoices = await elevenLabsService.getVoices();
    const clonedVoices = remoteVoices
      .filter(voice => voice.category === 'cloned')
      .map(voice => ({
        voice_id: voice.voice_id,
        name: voice.name,
        status: 'ready' as const,
        created_at: new Date().toISOString(),
      }));

    console.log('🎤 Found cloned voices:', clonedVoices.map(v => v.name));
    res.json(clonedVoices);
  } catch (error) {
    logger.error('Failed to get ElevenLabs voices:', error);
    res.status(500).json({ message: 'Failed to get ElevenLabs voices' });
  }
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/flac'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'));
    }
  }
});

// Initialize services lazily
let voiceAgentService: VoiceAgentService;
let retellService: RetellService;
let elevenLabsService: ElevenLabsService;
let openaiService: OpenAIService;

function getServices() {
  // Always create new services to pick up changes during development
  voiceAgentService = new VoiceAgentService();
  retellService = new RetellService();
  elevenLabsService = new ElevenLabsService();
  openaiService = new OpenAIService();
  return { voiceAgentService, retellService, elevenLabsService, openaiService };
}

/**
 * POST /api/voice-agent/create-call
 * Initiate a new voice call
 */
router.post('/create-call', async (req, res) => {
  console.log('🎯 CREATE CALL ROUTE HIT - Headers:', req.headers);
  console.log('🎯 CREATE CALL ROUTE HIT - Body:', req.body);

  try {
    const { voiceAgentService } = getServices();
    const {
      phoneNumber,
      callType,
      contactName,
      companyName,
      dealType,
      investmentRange,
      industryFocus,
      customInstructions,
      voiceId,
      callerName,
      callObjective,
      referralSource,
      callingCompany
    } = req.body;

    // For development: always use dev user (no auth required)
    const userId = 'dev-user-123';

    console.log('Voice call request received:', {
      phoneNumber,
      callType,
      contactName,
      companyName,
      dealType,
      userId
    });

    if (!phoneNumber || !callType) {
      return res.status(400).json({
        error: 'Missing required fields: phoneNumber, callType'
      });
    }

    // Validate phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
      return res.status(400).json({ error: 'Invalid phone number format' });
    }

    // Validate call type
    if (!['live', 'voicemail'].includes(callType)) {
      return res.status(400).json({ error: 'Call type must be "live" or "voicemail"' });
    }

    logger.info('Creating voice call', { userId, phoneNumber, callType, callerName, callObjective, referralSource, callingCompany });

    // Create dynamic variables object for Retell
    const dynamicVariables = {
      contact_name: contactName || '',
      company_name: companyName || '',
      deal_type: dealType || '',
      investment_range: investmentRange || '',
      industry_focus: industryFocus || '',
      custom_instructions: customInstructions || '',
      caller_name: callerName || '',
      call_objective: callObjective || '',
      referral_source: referralSource || '',
      calling_company: callingCompany || ''
    };

    const result = await voiceAgentService.initiateCall(
      userId,
      phoneNumber,
      callType,
      dynamicVariables,
      voiceId
    );

    if (result.success) {
      // Emit real-time update to frontend
      // TODO: Restore io.emit after fixing circular dependency
      // io.to(`user-${userId}`).emit('call_initiated', {
      //   callId: result.callId,
      //   phoneNumber,
      //   status: 'initiated'
      // });

      res.json({
        success: true,
        callId: result.callId,
        message: 'Call initiated successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Failed to initiate call'
      });
    }
  } catch (error) {
    logger.error('Error creating voice call', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/voice-agent/webhook
 * Handle webhook health checks
 */
router.get('/webhook', async (req, res) => {
  try {
    logger.info('Webhook health check received');
    res.json({ 
      success: true, 
      message: 'Voice agent webhook is active',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in webhook health check', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/voice-agent/webhook
 * Handle Retell webhooks
 */
router.post('/webhook', async (req, res) => {
  try {
    const { retellService, voiceAgentService, openaiService } = getServices();
    const signature = req.headers['x-retell-signature'] as string;
    const body = JSON.stringify(req.body);

    // Temporarily disable webhook signature verification for development
    // if (!retellService.verifyWebhook(body, signature)) {
    //   return res.status(401).json({ error: 'Invalid webhook signature' });
    // }

    const event = retellService.parseWebhookEvent(req.body);

    logger.info('Received Retell webhook', {
      event: event.event,
      callId: event.call_id
    });

    // Handle different webhook events
    switch (event.event) {
      case 'call_started':
        await voiceAgentService.handleCallUpdate(event.call_id, 'ongoing');
        // Emit real-time update
        // TODO: Restore io.emit after fixing circular dependency
        // if (event.metadata?.userId) {
        //   io.to(`user-${event.metadata.userId}`).emit('call_started', {
        //     callId: event.metadata.callId,
        //     retellCallId: event.call_id
        //   });
        // }
        break;

      case 'call_ended':
        await voiceAgentService.handleCallUpdate(event.call_id, 'ended');

        // Generate call summary if transcript is available
        if (event.transcript && event.transcript.length > 0) {
          const transcript = event.transcript.map(t =>
            `${t.role === 'agent' ? 'AI' : 'User'}: ${t.content}`
          );

          const summary = await openaiService.generateCallSummary(transcript, {
            callId: event.metadata?.callId,
            duration: event.metadata?.duration
          });

          // Emit call summary to frontend
          // TODO: Restore io.emit after fixing circular dependency
          // if (event.metadata?.userId) {
          //   io.to(`user-${event.metadata.userId}`).emit('call_ended', {
          //     callId: event.metadata.callId,
          //     summary,
          //     transcript
          //   });
          // }
        }
        break;

      case 'call_transcript':
        if (event.transcript && event.transcript.length > 0) {
          const latestTranscript = event.transcript[event.transcript.length - 1];
          await voiceAgentService.handleCallUpdate(
            event.call_id,
            'ongoing',
            `${latestTranscript.role === 'agent' ? 'AI' : 'User'}: ${latestTranscript.content}`
          );

          // Emit real-time transcript update
          // TODO: Restore io.emit after fixing circular dependency
          // if (event.metadata?.userId) {
          //   io.to(`user-${event.metadata.userId}`).emit('call_transcript_update', {
          //     callId: event.metadata.callId,
          //     transcript: latestTranscript
          //   });
          // }
        }
        break;

      case 'call_failed':
        await voiceAgentService.handleCallUpdate(event.call_id, 'failed');
        // TODO: Restore io.emit after fixing circular dependency
        // if (event.metadata?.userId) {
        //   io.to(`user-${event.metadata.userId}`).emit('call_failed', {
        //     callId: event.metadata.callId,
        //     error: 'Call failed'
        //   });
        // }
        break;
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error handling Retell webhook', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/voice-agent/llm-webhook
 * Handle LLM webhook from Retell for conversation
 */
router.post('/llm-webhook', async (req, res) => {
  try {
    const { call_id, transcript, interaction_type } = req.body;

    if (interaction_type === 'response_required') {
      // Get the latest user message
      const userMessage = transcript[transcript.length - 1]?.content || '';

      // Generate AI response
      const aiResponse = await voiceAgentService.generateResponse(call_id, userMessage);

      res.json({
        response: aiResponse,
        response_id: Date.now().toString()
      });
    } else {
      res.json({ success: true });
    }
  } catch (error) {
    logger.error('Error handling LLM webhook', error);
    res.json({
      response: "I apologize, but I'm experiencing some technical difficulties. Let me have someone call you back.",
      response_id: Date.now().toString()
    });
  }
});

/**
 * GET /api/voice-agent/calls
 * Get call history for user
 */
router.get('/calls', firebaseAuthMiddleware, async (req, res) => {
  try {
    const userId = (req as FirebaseAuthRequest).user?.uid;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Initialize services
    const { voiceAgentService } = getServices();

    const calls = await voiceAgentService.getCallHistory(userId, limit);
    res.json({ calls });
  } catch (error) {
    logger.error('Error getting call history', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/voice-agent/calls/:callId
 * Get specific call details
 */
router.get('/calls/:callId', firebaseAuthMiddleware, async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = (req as FirebaseAuthRequest).user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Initialize services
    const { voiceAgentService } = getServices();

    const call = await voiceAgentService.getCallSession(callId);

    if (!call) {
      return res.status(404).json({ error: 'Call not found' });
    }

    // Verify user owns this call
    if (call.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ call });
  } catch (error) {
    logger.error('Error getting call details', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/voice-agent/voice-clone
 * Clone a voice using audio sample
 */
router.post('/voice-clone', firebaseAuthMiddleware, upload.single('audio'), async (req, res) => {
  try {
    const { name, description, isDefault } = req.body;
    const userId = (req as FirebaseAuthRequest).user?.uid;
    const audioFile = req.file;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!name || !audioFile) {
      return res.status(400).json({ error: 'Name and audio file are required' });
    }

    // Validate audio file
    const validation = elevenLabsService.validateAudioFile(audioFile.buffer);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    logger.info('Cloning voice', { userId, name, audioSize: audioFile.size });

    const voiceProfile = await voiceAgentService.createVoiceProfile(
      userId,
      name,
      description || '',
      audioFile.buffer,
      isDefault === 'true'
    );

    res.json({
      success: true,
      voiceProfile,
      message: 'Voice cloned successfully'
    });
  } catch (error) {
    logger.error('Error cloning voice', error);
    res.status(500).json({ error: 'Failed to clone voice' });
  }
});

/**
 * GET /api/voice-agent/voices
 * Get ElevenLabs cloned voices (simplified - matching mass voicemail implementation)
 */
router.get('/voices', async (req, res) => {
  try {
    // Get clones from ElevenLabs API (same as mass voicemail route)
    const elevenLabsService = new ElevenLabsService();
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
    logger.info(`Returning ${clonedVoices.length} cloned voices from ElevenLabs`);
  } catch (error) {
    logger.error('Failed to get voices:', error);
    res.status(500).json({ message: 'Failed to get voices' });
  }
});

/**
 * GET /api/voice-agent/test-elevenlabs
 * Test ElevenLabs API connection
 */
router.get('/test-elevenlabs', firebaseAuthMiddleware, async (req, res) => {
  try {
    const elevenLabsService = new ElevenLabsService();

    // Test the connection and get available voices
    const isConnected = await elevenLabsService.testConnection();

    if (!isConnected) {
      return res.status(500).json({
        success: false,
        error: 'Failed to connect to ElevenLabs API - check your API key'
      });
    }

    // Get available voices to verify the integration
    const voices = await elevenLabsService.getVoices();

    res.json({
      success: true,
      connected: true,
      voicesCount: voices.length,
      voices: voices.slice(0, 3) // Return first 3 voices as sample
    });
  } catch (error) {
    logger.error('ElevenLabs test error:', error);
    res.status(500).json({
      success: false,
      error: 'ElevenLabs API test failed',
      details: (error as Error).message
    });
  }
});

/**
 * GET /api/voice-agent/voices/available
 * Get available ElevenLabs voices
 */
router.get('/voices/available', firebaseAuthMiddleware, async (req, res) => {
  try {
    const voices = await elevenLabsService.getVoices();
    res.json({ voices });
  } catch (error) {
    logger.error('Error getting available voices', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/voice-agent/test-connections
 * Test API connections
 */
router.get('/test-connections', firebaseAuthMiddleware, async (req, res) => {
  try {
    const [retellTest, elevenLabsTest, openaiTest] = await Promise.all([
      retellService.testConnection(),
      elevenLabsService.testConnection(),
      openaiService.testConnection()
    ]);

    res.json({
      connections: {
        retell: retellTest,
        elevenlabs: elevenLabsTest,
        openai: openaiTest
      },
      allConnected: retellTest && elevenLabsTest && openaiTest
    });
  } catch (error) {
    logger.error('Error testing connections', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/voice-agent/phone-numbers
 * Get available phone numbers
 */
router.get('/phone-numbers', firebaseAuthMiddleware, async (req, res) => {
  try {
    const phoneNumbers = await retellService.getPhoneNumbers();
    res.json({ phoneNumbers });
  } catch (error) {
    logger.error('Error getting phone numbers', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/voice-agent/update-agent
 * Update the existing Retell agent with correct LLM URL (for development)
 */
router.post('/update-agent', async (req, res) => {
  try {
    const { retellService } = getServices();
    const agentId = process.env.RETELL_AGENT_ID;

    if (!agentId) {
      return res.status(400).json({ error: 'RETELL_AGENT_ID not configured' });
    }

    console.log('🔧 Updating Retell agent with websocket URL...');
    console.log('Agent ID:', agentId);
    console.log('Backend URL:', process.env.BACKEND_URL);
    console.log('LLM URL:', `${process.env.BACKEND_URL?.replace('https://', 'wss://')}/llm`);

    const updatedAgent = await retellService.updateAgent(agentId, {
      llm: {
        type: 'custom',
        custom_llm_url: `${process.env.BACKEND_URL?.replace('https://', 'wss://')}/llm`,
      }
    });

    res.json({
      success: true,
      message: 'Agent updated successfully',
      agent: updatedAgent,
      websocketUrl: `${process.env.BACKEND_URL?.replace('https://', 'wss://')}/llm`
    });
  } catch (error) {
    logger.error('Error updating Retell agent', error);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

/**
 * POST /api/voice-agent/test-call
 * Create a test call (for development)
 */
router.post('/test-call', firebaseAuthMiddleware, async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const userId = (req as FirebaseAuthRequest).user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Create test dynamic variables
    const testDynamicVariables = {
      contact_name: 'Test Contact',
      company_name: 'Test Company',
      deal_type: 'test-call',
      investment_range: 'N/A',
      industry_focus: 'System Testing',
      custom_instructions: 'You are a friendly AI assistant calling to test the voice system. Keep the conversation brief and professional. Ask if the call quality is good and if they can hear you clearly. Thank them for their time and end the call politely.',
      caller_name: 'Test Caller',
      call_objective: 'system testing and quality assurance',
      referral_source: 'internal testing'
    };

    const result = await voiceAgentService.initiateCall(
      userId,
      phoneNumber,
      'live',
      testDynamicVariables
    );

    res.json(result);
  } catch (error) {
    logger.error('Error creating test call', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

console.log('🚀 Voice Agent Routes Loaded Successfully');

export default router;