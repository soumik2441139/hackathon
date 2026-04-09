/**
 * Integration Test Setup
 *
 * SAFETY RULE: Integration tests MUST NEVER run against the production database.
 * This file enforces that by:
 *   1. Hard-blocking if MONGODB_URI points to production (no 'opushire_test' in the name).
 *   2. Only allowing connections where the database name ends with '_test'.
 *
 * To run integration tests locally, set:
 *   TEST_MONGODB_URI=mongodb://localhost:27017/opushire_test
 */
import mongoose from 'mongoose';
import { logger } from '../src/utils/logger';

// Increase timeout for DB operations
jest.setTimeout(30000);

beforeAll(async () => {
  // Use the dedicated TEST URI — never fall back to production
  const testUri = process.env.TEST_MONGODB_URI;

  if (!testUri) {
    console.warn(
      '⚠️  [Test Setup] TEST_MONGODB_URI is not set. ' +
      'Integration tests require a local test DB. Skipping DB connection.\n' +
      '   Set TEST_MONGODB_URI=mongodb://localhost:27017/opushire_test to enable.'
    );
    return; // Skip — tests that need DB will fail gracefully (not delete prod data)
  }

  // Hard block: URI must contain '_test' to prove it's not production
  if (!testUri.includes('_test')) {
    throw new Error(
      `[Test Setup] REFUSED to connect — TEST_MONGODB_URI does not contain "_test".\n` +
      `URI: ${testUri}\n` +
      `This safety check prevents accidentally running destructive tests on production.`
    );
  }

  process.env.MONGODB_URI = testUri;

  try {
    await mongoose.connect(testUri);
    logger.info('Integration Test: Connected to test DB → ' + mongoose.connection.name);
  } catch (err) {
    logger.error({ err }, 'Integration Test: Failed to connect to test MongoDB');
    throw err; // Let Jest mark this as a setup failure (not process.exit)
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 0) return; // not connected, nothing to do

  // Only drop if confirmed test database
  if (mongoose.connection.name?.endsWith('_test')) {
    await mongoose.connection.dropDatabase();
    logger.info('Integration Test: Dropped test DB → ' + mongoose.connection.name);
  }

  await mongoose.connection.close();
  logger.info('Integration Test: Disconnected from MongoDB');
});
