import { PrismaClient } from '../generated/prisma';
import logger from '../utils/logger';

// Global instance to prevent multiple connections
declare global {
  var __prisma: PrismaClient | undefined;
}

// Initialize Prisma Client
const prisma = globalThis.__prisma || new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

// Connect to database
export const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    process.exit(1);
  }
};

// Disconnect from database
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    logger.info('🔌 Database disconnected');
  } catch (error) {
    logger.error('❌ Database disconnection failed:', error);
  }
};

export default prisma;