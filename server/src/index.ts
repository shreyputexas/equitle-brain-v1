import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
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
// import contactRoutes from './routes/contacts'; // Temporarily disabled due to Prisma dependency
import firebaseContactsActivitiesRoutes from './routes/firebaseContactsActivities';
import firebaseDocumentsRoutes from './routes/firebaseDocuments';
import firebaseEmailsRoutes from './routes/firebaseEmails';
import reportRoutes from './routes/reports';
import integrationRoutes from './routes/integrations';
import dashboardRoutes from './routes/dashboard';
import voiceAgentRoutes from './routes/voiceAgent';
// import gmailRoutes from './routes/gmail'; // Temporarily disabled due to Prisma dependency

import { errorHandler } from './middleware/errorHandler';
// import { firebaseAuthMiddleware, AuthRequest } from './middleware/auth'; // Legacy
import { firebaseAuthMiddleware } from './middleware/firebaseAuth';
import { connectFirebase } from './lib/firebase';
import { EmailsFirestoreService } from './services/emails.firestore.service';
import logger from './utils/logger';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002"
    ],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4001;

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
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002"
  ],
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
// Legacy Prisma LP groups routes (will be deprecated)
// app.use('/api/lp-groups', firebaseAuthMiddleware, lpGroupsRoutes); // Temporarily disabled due to Prisma dependency
// New Firebase LP groups routes
app.use('/api/firebase-lp-groups', firebaseLpGroupsRoutes);
app.use('/api/companies', firebaseAuthMiddleware, companyRoutes);
// Legacy Prisma contacts routes (will be deprecated)
// app.use('/api/contacts', contactRoutes); // Temporarily disabled due to Prisma dependency
// New Firebase contacts, activities, and communications routes
app.use('/api/firebase', firebaseContactsActivitiesRoutes);
// New Firebase documents routes
app.use('/api/firebase-documents', firebaseDocumentsRoutes);
// New Firebase emails routes
app.use('/api/firebase-emails', firebaseEmailsRoutes);
app.use('/api/reports', firebaseAuthMiddleware, reportRoutes);
// Integration routes with conditional auth (callback route is public)
app.use('/api/integrations', (req, res, next) => {
  console.log('Integration route hit:', req.path, req.method);
  // Skip auth middleware for the OAuth callback route
  if (req.path === '/google/callback') {
    console.log('Skipping auth for OAuth callback');
    return next();
  }
  console.log('Applying auth middleware');
  return firebaseAuthMiddleware(req, res, next);
}, integrationRoutes);

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
// Voice agent routes
console.log('🔗 Mounting voice agent routes at /api/voice-agent');
try {
  app.use('/api/voice-agent', voiceAgentRoutes);
  console.log('✅ Voice agent routes mounted successfully');
} catch (error) {
  console.error('❌ Error mounting voice agent routes:', error);
}
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

// WebSocket handler for Retell LLM integration
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

server.listen(PORT, async () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`Project ID: ${process.env.FIREBASE_PROJECT_ID}`);

  // Connect to Firebase
  await connectFirebase();
});

export { io };