import { BlobServiceClient } from "@azure/storage-blob";
import path from "path";
import fs from "fs";
import { SystemConfig } from "../../config/system.config";

const conn = SystemConfig.azure.connectionString;
// Initialize later or cleanly export functions using a getter to prevent crash if env is missing during startup
let blobService: BlobServiceClient | null = null;
const containerName = "resumes";

function getBlobService() {
    if (!blobService && conn) {
        blobService = BlobServiceClient.fromConnectionString(conn);
    }
    return blobService;
}

export async function uploadToBlob(localFilePath: string): Promise<string> {
  const svc = getBlobService();
  if (!svc) throw new Error("Azure Storage Connection String not configured.");
  
  const container = svc.getContainerClient(containerName);

  const fileName = path.basename(localFilePath);
  const blockBlob = container.getBlockBlobClient(fileName);

  const stream = fs.createReadStream(localFilePath);
  await blockBlob.uploadStream(stream);

  return blockBlob.url;
}
