import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { WebSocketServer } from 'ws';

// import authRoutes from './routes/auth'; // Temporarily disabled due to Prisma dependency
import firebaseAuthRoutes from './routes/firebaseAuth';
// import dealRoutes from './routes/deals'; // Temporarily disabled due to Prisma dependency
import firebaseDealRoutes from './routes/firebaseDeals';
import brainRoutes from './routes/brain';
// import investorRoutes from './routes/investors'; // Temporarily disabled due to Prisma dependency
import firebaseInvestorRoutes from './routes/firebaseInvestors';
// import fundsRoutes from './routes/funds'; // Temporarily disabled due to Prisma dependency
import firebaseFundsRoutes from './routes/firebaseFunds';
// import lpGroupsRoutes from './routes/lp-groups'; // Temporarily disabled due to Prisma dependency
import firebaseLpGroupsRoutes from './routes/firebaseLpGroups';
import companyRoutes from './routes/companies';
// import contactRoutes from './routes/contacts'; // Disabled - uses Prisma, replaced by Firebase
import firebaseContactsActivitiesRoutes from './routes/firebaseContactsActivities';
import firebaseDocumentsRoutes from './routes/firebaseDocuments';
import firebaseEmailsRoutes from './routes/firebaseEmails';
import searcherProfilesRoutes from './routes/searcherProfiles';
import thesisRoutes from './routes/thesis';
import onePagerRoutes from './routes/onePager';
import headshotsRoutes from './routes/headshots';
import logosRoutes from './routes/logos';
import reportRoutes from './routes/reports';
import integrationRoutes from './routes/integrations';
import googleWorkspaceRoutes from './routes/googleWorkspace';
import dashboardRoutes from './routes/dashboard';
import dataEnrichmentRoutes from './routes/dataEnrichment';
import apolloRoutes from './routes/apollo';
import voiceAgentRoutes from './routes/voiceAgent';
import campaignRoutes from './routes/campaigns';
import massVoicemailRoutes from './routes/massVoicemail';
import linkedinOutreachRoutes from './routes/linkedinOutreach';
import signupNotificationsRoutes from './routes/signupNotifications';
// import gmailRoutes from './routes/gmail'; // Temporarily disabled due to Prisma dependency

import { errorHandler } from './middleware/errorHandler';
// import { firebaseAuthMiddleware, AuthRequest } from './middleware/auth'; // Legacy
import { firebaseAuthMiddleware } from './middleware/firebaseAuth';
import { connectFirebase } from './lib/firebase';
import { EmailsFirestoreService } from './services/emails.firestore.service';
import logger from './utils/logger';

import { EmailSyncService } from './services/emailSync';
import emailProccesingRoutes from './routes/emailProcessing';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
      "https://equitle.com",
      "https://www.equitle.com",
      "https://api.equitle.com",
      "https://equitle-api.onrender.com",
      // Add deployment patterns
      /^https:\/\/.*\.onrender\.com$/,
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.netlify\.app$/
    ],
    methods: ["GET", "POST"]
  }
});

const PORT = Number(process.env.PORT) || 4001;

// WebSocket server for Retell LLM integration
const wss = new WebSocketServer({
  noServer: true
});

// Log WebSocket server setup
logger.info('WebSocket server initialized', {
  path: '/llm',
  port: PORT
});

// Handle WebSocket upgrade requests
server.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url!, `http://${request.headers.host}`).pathname;

  logger.info('WebSocket upgrade request', { pathname, headers: request.headers });

  if (pathname === '/llm' || pathname.startsWith('/llm/')) {
    logger.info('WebSocket upgrade accepted for path', { pathname });
    wss.handleUpgrade(request, socket, head, (ws) => {
      logger.info('WebSocket connection established for /llm');
      wss.emit('connection', ws, request);
    });
  } else {
    logger.warn('WebSocket upgrade rejected for path', { pathname });
    socket.destroy();
  }
});

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '1000'), // Increased for development
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "http://localhost:4001", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "https://equitle-api.onrender.com", "https://equitle.com", "https://www.equitle.com"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", "https:", "data:"],
      connectSrc: ["'self'", "http://localhost:4001", "https://equitle-api.onrender.com", "https://equitle.com", "https://www.equitle.com"],
    },
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "https://equitle.com",
    "https://www.equitle.com",
    "https://api.equitle.com",
    "https://equitle-api.onrender.com",
    // Add Render.com deployment patterns
    /^https:\/\/.*\.onrender\.com$/,
    // Add common frontend deployment patterns
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*\.netlify\.app$/,
    /^https:\/\/.*\.github\.io$/
  ],
  credentials: true
}));
// Temporarily disable rate limiter for development
// app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory with CORS headers
const uploadsPath = path.join(process.cwd(), 'uploads');
console.log('Static files path:', uploadsPath);
console.log('Static files exist:', fs.existsSync(uploadsPath));

app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type');

  // Set proper content type for MP3 files
  if (req.path.endsWith('.mp3')) {
    res.header('Content-Type', 'audio/mpeg');
  }

  next();
}, express.static(uploadsPath));

// Serve static files from one_pager_templates directory with CORS headers
const templatesPath = path.join(process.cwd(), 'equitle-brain-v1/one_pager_templates');
console.log('Templates path:', templatesPath);
console.log('Templates exist:', fs.existsSync(templatesPath));

app.use('/.claude/one_pager_templates', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}, express.static(templatesPath));

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// LLM WebSocket endpoint (returns upgrade required for HTTP requests)
app.get('/api/voice-agent/llm', (req, res) => {
  res.status(426).json({ error: 'Upgrade Required', message: 'This endpoint requires WebSocket connection' });
});

// Legacy JWT auth routes (will be deprecated)
// app.use('/api/auth', authRoutes); // Temporarily disabled due to Prisma dependency
// New Firebase auth routes
app.use('/api/firebase-auth', firebaseAuthRoutes);
// Legacy Prisma deals routes (will be deprecated)
// app.use('/api/deals', dealRoutes); // Temporarily disabled due to Prisma dependency
// New Firebase deals routes
app.use('/api/firebase-deals', firebaseDealRoutes);
app.use('/api/brain', firebaseAuthMiddleware, brainRoutes);
// Legacy Prisma investor routes (will be deprecated)
// app.use('/api/investors', firebaseAuthMiddleware, investorRoutes); // Temporarily disabled due to Prisma dependency
// New Firebase investor routes
app.use('/api/firebase-investors', firebaseInvestorRoutes);
// Legacy Prisma funds routes (will be deprecated)
// app.use('/api/funds', firebaseAuthMiddleware, fundsRoutes); // Temporarily disabled due to Prisma dependency
// New Firebase funds routes
app.use('/api/firebase-funds', firebaseFundsRoutes);
app.use('/api/email-processing', emailProccesingRoutes);

// Legacy Prisma LP groups routes (will be deprecated)
// app.use('/api/lp-groups', firebaseAuthMiddleware, lpGroupsRoutes); // Temporarily disabled due to Prisma dependency
// New Firebase LP groups routes
app.use('/api/firebase-lp-groups', firebaseLpGroupsRoutes);
app.use('/api/companies', firebaseAuthMiddleware, companyRoutes);
// New Firebase contacts, activities, and communications routes (replaces Prisma contacts)
app.use('/api/firebase', firebaseContactsActivitiesRoutes);
// New Firebase documents routes
app.use('/api/firebase-documents', firebaseDocumentsRoutes);
// New Firebase emails routes
app.use('/api/firebase-emails', firebaseEmailsRoutes);
// Searcher profiles routes
app.use('/api/searcher-profiles', searcherProfilesRoutes);
// Investment thesis routes
app.use('/api/thesis', thesisRoutes);
// One-pager generation routes
app.use('/api/one-pager', onePagerRoutes);
// Headshot upload routes
app.use('/api/headshots', headshotsRoutes);
app.use('/api/logos', logosRoutes);
app.use('/api/reports', firebaseAuthMiddleware, reportRoutes);
// Integration routes with conditional auth (callback route is public)
app.use('/api/integrations', (req, res, next) => {
  console.log('Integration route hit:', req.path, req.method);
  // Skip auth middleware for the OAuth callback routes
  if (req.path === '/google/callback' || req.path === '/microsoft/callback' || req.path === '/apollo/callback') {
    console.log('Skipping auth for OAuth callback');
    return next();
  }
  console.log('Applying auth middleware');
  return firebaseAuthMiddleware(req, res, next);
}, integrationRoutes);

// Google Workspace API routes (all require auth)
app.use('/api/google-workspace', firebaseAuthMiddleware, googleWorkspaceRoutes);

// Zapier webhook endpoint (no auth required)
app.post('/webhook', async (req, res) => {
  try {
    logger.info('Zapier webhook received', { body: req.body });

    // Use the same dev user ID that the frontend uses for development
    const userId = 'dev-user-123';

    // Store email in Firebase
    const storedEmail = await EmailsFirestoreService.storeEmail(userId, req.body);

    logger.info('Email stored successfully', { emailId: storedEmail.id });

    res.status(200).json({ success: true, message: 'Email processed successfully', emailId: storedEmail.id });
  } catch (error) {
    logger.error('Error processing webhook:', error);
    res.status(500).json({ success: false, error: 'Failed to process webhook' });
  }
});

// Public test endpoint for Google OAuth debugging
app.get('/api/test-google', async (req, res) => {
  try {
    const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
    const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
    const hasRedirectUri = !!process.env.GOOGLE_REDIRECT_URI;

    res.json({
      success: true,
      data: {
        googleSetup: {
          hasClientId,
          hasClientSecret,
          hasRedirectUri,
          clientId: process.env.GOOGLE_CLIENT_ID,
          redirectUri: process.env.GOOGLE_REDIRECT_URI,
          isConfigured: hasClientId && hasClientSecret && hasRedirectUri
        },
        message: hasClientId && hasClientSecret && hasRedirectUri
          ? 'Google integration is properly configured'
          : 'Google integration is missing required environment variables'
      }
    });
  } catch (error) {
    logger.error('Error testing Google integration setup:', error);
    res.status(500).json({ success: false, error: 'Failed to test Google integration setup' });
  }
});
// Dashboard routes (using Prisma temporarily)
app.use('/api/dashboard', firebaseAuthMiddleware, dashboardRoutes);
// Data enrichment routes - no auth required for development
app.use('/api/data-enrichment', dataEnrichmentRoutes);
// Apollo API routes - no auth required for development
app.use('/api/apollo', apolloRoutes);
// Voice Agent routes - temporarily removing auth for debugging
app.use('/api/voice-agent', voiceAgentRoutes);
// Campaign routes for mass voicemail
app.use('/api/campaigns', campaignRoutes);
// Mass voicemail routes
app.use('/api/mass-voicemail', massVoicemailRoutes);
// LinkedIn outreach routes
app.use('/api/linkedin-outreach', linkedinOutreachRoutes);
app.use('/api/signup-notifications', signupNotificationsRoutes);
// app.use('/api/gmail', gmailRoutes);

app.use(errorHandler);

io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('join-room', (roomId: string) => {
    socket.join(roomId);
    logger.info(`Client ${socket.id} joined room ${roomId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

wss.on('connection', (ws, req) => {
  logger.info('Retell LLM WebSocket connected', { url: req.url });

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      logger.info('Received LLM WebSocket message', { type: message.type, content: message.content });

      // Log the full message for debugging
      logger.info('Received LLM WebSocket message details', {
        type: message.type,
        content: message.content?.substring(0, 100),
        interaction_type: message.interaction_type,
        full_message: message
      });

      // Handle different Retell message types
      if (message.interaction_type === 'response_required') {
        // Import services dynamically to avoid circular dependencies
        const { OpenAIService } = await import('./services/openai.service');
        const openaiService = new OpenAIService();

        // Get the latest user message from transcript
        const userMessage = message.transcript?.[message.transcript.length - 1]?.content || '';

        logger.info('Processing user message', { userMessage });

        // Convert Retell transcript format to our expected string format
        const conversationHistory = (message.transcript || []).map((entry: any) => {
          if (entry.role === 'user') {
            return `User: ${entry.content}`;
          } else if (entry.role === 'agent') {
            return `AI: ${entry.content}`;
          }
          return `${entry.role}: ${entry.content}`;
        });

        // Generate AI response with a more conversational prompt
        const aiResponse = await openaiService.generateResponse(
          'You are a professional but friendly AI assistant making a phone call for Equitle, a deal management platform. Keep responses natural, engaging, and under 2 sentences. Be conversational and responsive.',
          conversationHistory,
          userMessage
        );

        logger.info('Generated AI response', { aiResponse });

        // Send response back to Retell in the correct format
        const response = {
          type: "assistant_message",
          content: [
            {
              type: "text",
              text: aiResponse
            }
          ]
        };

        logger.info('Sending LLM response to Retell', { response });
        ws.send(JSON.stringify(response));
      } else {
        // For other interaction types, just acknowledge
        logger.info('Received non-response message', {
          interaction_type: message.interaction_type,
          type: message.type
        });
        ws.send(JSON.stringify({ success: true }));
      }
    } catch (error) {
      logger.error('Error handling LLM WebSocket message', error);
      // Send fallback response in correct format
      const fallbackResponse = {
        type: "assistant_message",
        content: [
          {
            type: "text",
            text: "I apologize, but I'm experiencing some technical difficulties. Let me have someone call you back."
          }
        ]
      };
      ws.send(JSON.stringify(fallbackResponse));
    }
  });

  ws.on('close', () => {
    logger.info('Retell LLM WebSocket disconnected');
  });

  ws.on('error', (error) => {
    logger.error('Retell LLM WebSocket error', error);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Connect to Firebase (non-blocking to allow server to start)
  (async () => {
    try {
      await connectFirebase();
    } catch (error: any) {
      console.error('Firebase connection failed but server will continue:', error?.message || error);
    }
  })();

  // Start email sync (also non-blocking)
  (async () => {
    try {
      await EmailSyncService.startEmailSync();
    } catch (error: any) {
      console.error('Email sync failed to start but server will continue:', error?.message || error);
    }
  })();
});

export { io };