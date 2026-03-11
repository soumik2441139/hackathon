import * as dotenv from "dotenv";
dotenv.config();

export const SystemConfig = Object.freeze({
  redis: { 
    host: process.env.REDIS_HOST || "localhost", 
    port: parseInt(process.env.REDIS_PORT || "6379", 10) 
  },
  mongoUri: process.env.MONGO_URI,
  azure: {
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
    account: process.env.AZURE_STORAGE_ACCOUNT,
    key: process.env.AZURE_STORAGE_KEY,
    cdnBase: "https://opushire.azureedge.net/resumes"
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
