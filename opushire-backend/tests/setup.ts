/**
 * Integration Test Setup
 * Connects to MongoDB before tests and cleans up after.
 */
import mongoose from 'mongoose';
import { connectDBBlocking } from '../src/config/db';
import { logger } from '../src/utils/logger';

// Increase timeout for DB operations
jest.setTimeout(30000);

beforeAll(async () => {
  // Use a dedicated test database name to avoid clobbering local/dev data
  const originalUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/opushire';
  if (!originalUri.includes('opushire_test')) {
      process.env.MONGODB_URI = originalUri.replace(/\/[^/?]+/, '/opushire_test');
  }

  try {
    await connectDBBlocking();
    logger.info('Integration Test: Connected to MongoDB at ' + mongoose.connection.name);
  } catch (err) {
    logger.error({ err }, 'Integration Test: Failed to connect to MongoDB');
    process.exit(1);
  }
});

afterAll(async () => {
  // Clear the test database or just close connection?
  // Industry grade: Drop database after tests to ensure clean environment
  // But for now, just closing is safer unless we are sure it's a test DB.
  if (mongoose.connection.name === 'opushire_test') {
      await mongoose.connection.dropDatabase();
  }
  await mongoose.connection.close();
  logger.info('Integration Test: Disconnected from MongoDB');
});
