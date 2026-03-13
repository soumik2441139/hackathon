import { env } from './env';

export const SystemConfig = Object.freeze({
  redis: { 
    host: env.REDIS_HOST,
    port: parseInt(env.REDIS_PORT, 10),
    password: env.REDIS_PASSWORD,
    tls: env.REDIS_TLS === 'true',
  },
  redisSecondary: env.SECONDARY_REDIS_HOST ? {
    host: env.SECONDARY_REDIS_HOST,
    port: parseInt(env.SECONDARY_REDIS_PORT || '6379', 10),
    password: env.SECONDARY_REDIS_PASSWORD,
    tls: env.SECONDARY_REDIS_TLS === 'true',
  } : null,
  mongoUri: env.MONGODB_URI,
  azure: {
    connectionString: env.AZURE_STORAGE_CONNECTION_STRING,
    account: env.AZURE_STORAGE_ACCOUNT,
    key: env.AZURE_STORAGE_KEY,
    cdnBase: 'https://opushire.azureedge.net/resumes'
  },
  processing: {
    embeddingBatchSize: 20,
    archiveThresholdDays: 180
  },
  agent: {
    retryCount: 3,
    timeoutMs: 30000
  }
});
