import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

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
import reportRoutes from './routes/reports';
import integrationRoutes from './routes/integrations';
import dashboardRoutes from './routes/dashboard';
// import gmailRoutes from './routes/gmail'; // Temporarily disabled due to Prisma dependency

import { errorHandler } from './middleware/errorHandler';
// import { firebaseAuthMiddleware, AuthRequest } from './middleware/auth'; // Legacy
import { firebaseAuthMiddleware } from './middleware/firebaseAuth';
import { connectFirebase } from './lib/firebase';
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

const PORT = process.env.PORT || 4000;

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

server.listen(PORT, async () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Connect to Firebase
  await connectFirebase();
});

export { io };