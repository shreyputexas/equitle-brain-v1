// Legacy database file - Prisma has been replaced with Firebase
// This file is kept only for legacy route compatibility and exports null

import logger from '../utils/logger';

// Mock prisma client for legacy routes
const prisma = null;

// Legacy functions - no-ops since we're using Firebase
export const connectDatabase = async () => {
  logger.info('ℹ️ Legacy database connection skipped - using Firebase');
};

export const disconnectDatabase = async () => {
  logger.info('ℹ️ Legacy database disconnection skipped - using Firebase');
};

export default prisma;