import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth';
import dealRoutes from './routes/deals';
import brainRoutes from './routes/brain';
import investorRoutes from './routes/investors';
import fundsRoutes from './routes/funds';
import lpGroupsRoutes from './routes/lp-groups';
import companyRoutes from './routes/companies';
import contactRoutes from './routes/contacts';
import reportRoutes from './routes/reports';
import integrationRoutes from './routes/integrations';
import dashboardRoutes from './routes/dashboard';
import gmailRoutes from './routes/gmail';

import { errorHandler } from './middleware/errorHandler';
import { authMiddleware, AuthRequest } from './middleware/auth';
import { connectDatabase } from './lib/database';
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

app.use('/api/auth', authRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/brain', authMiddleware, brainRoutes);
app.use('/api/investors', authMiddleware, investorRoutes);
app.use('/api/funds', authMiddleware, fundsRoutes);
app.use('/api/lp-groups', authMiddleware, lpGroupsRoutes);
app.use('/api/companies', authMiddleware, companyRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
// Integration routes with conditional auth (callback route is public)
app.use('/api/integrations', (req, res, next) => {
  console.log('Integration route hit:', req.path, req.method);
  // Skip auth middleware for the OAuth callback route
  if (req.path === '/google/callback') {
    console.log('Skipping auth for OAuth callback');
    return next();
  }
  console.log('Applying auth middleware');
  return authMiddleware(req, res, next);
}, integrationRoutes);

// Public test endpoint for Google OAuth debugging
app.get('/api/test-google', async (req, res) => {
  try {
    const hasClientId = !!process.env.GOOGLE_CLIENT_ID;
    const hasClientSecret = !!process.env.GOOGLE_CLIENT_SECRET;
    const hasRedirectUri = !!process.env.GOOGLE_REDIRECT_URI;

    // Also check what integrations exist in the database
    const prisma = require('./lib/database').default;
    const allIntegrations = await prisma.integration.findMany({
      select: {
        id: true,
        userId: true,
        provider: true,
        type: true,
        isActive: true,
        createdAt: true
      }
    });

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
        integrations: allIntegrations,
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
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/gmail', gmailRoutes);

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
  
  // Connect to database
  await connectDatabase();
});

export { io };