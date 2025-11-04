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
import companyRoutes from './routes/companies';
import contactRoutes from './routes/contacts';
import reportRoutes from './routes/reports';

import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/auth';
import logger from './utils/logger';
import { db } from './lib/firebase';
import { sendSignupNotification } from './services/email.service';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5001;

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), 
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true
}));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/deals', authMiddleware, dealRoutes);
app.use('/api/brain', authMiddleware, brainRoutes);
app.use('/api/investors', authMiddleware, investorRoutes);
app.use('/api/companies', authMiddleware, companyRoutes);
app.use('/api/contacts', authMiddleware, contactRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);

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

// Set up Firestore polling for signup requests
const signupRequestsRef = db.collection('signup-requests');
const processedSignups = new Set<string>(); // Track processed document IDs

// Poll for new signup requests every 5 seconds
const POLL_INTERVAL_MS = 5000;

async function checkForNewSignups() {
  try {
    logger.debug('Checking for new signup requests...');
    
    // Get all pending signup requests (limit to most recent 100 to avoid loading too much)
    const querySnapshot = await signupRequestsRef
      .where('status', '==', 'pending')
      .limit(100)
      .get();

    logger.debug(`Found ${querySnapshot.size} pending signup requests in Firestore`);

    const newSignups: Array<{ id: string; email: string; timestamp: string }> = [];

    querySnapshot.forEach((doc: any) => {
      // Skip if we've already processed this document
      if (processedSignups.has(doc.id)) {
        return;
      }

      const data = doc.data();
      const userEmail = data.email;
      const timestamp = data.timestamp || data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString();

      newSignups.push({
        id: doc.id,
        email: userEmail,
        timestamp,
      });
      processedSignups.add(doc.id);
    });

    logger.debug(`Found ${newSignups.length} new signups to process`);

    // Process new signups
    for (const signup of newSignups) {
      logger.info('New signup request detected', {
        email: signup.email,
        documentId: signup.id,
        timestamp: signup.timestamp,
      });

      // Send email notification
      await sendSignupNotification(signup.email, signup.timestamp).catch((error) => {
        logger.error('Error in sendSignupNotification', {
          error: error instanceof Error ? error.message : 'Unknown error',
          email: signup.email,
        });
      });
    }
  } catch (error) {
    logger.error('Error checking for new signups', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}

// Start polling when server starts
setInterval(checkForNewSignups, POLL_INTERVAL_MS);
logger.info('Firestore polling initialized for signup-requests collection (checking every 5 seconds)');

// Also check immediately on startup (to catch any signups that happened while server was down)
checkForNewSignups();

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export { io };