import { BlobServiceClient } from "@azure/storage-blob";
import { SystemConfig } from "../../config/system.config";

export async function archiveOldBlob(containerName: string, blobName: string) {
  const conn = SystemConfig.azure.connectionString;
  if (!conn) throw new Error("Azure Storage Connection String not configured.");
  const blobService = BlobServiceClient.fromConnectionString(conn);

  const container = blobService.getContainerClient(containerName);
  const blob = container.getBlockBlobClient(blobName);

  await blob.setAccessTier("Archive");
}
