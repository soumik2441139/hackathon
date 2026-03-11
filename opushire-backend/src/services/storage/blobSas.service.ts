import {
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions
} from "@azure/storage-blob";
import { SystemConfig } from "../../config/system.config";

export function generateSecureBlobUrl(container: string, blobName: string, minutes: number = 10): string {
  const account = SystemConfig.azure.account;
  const key = SystemConfig.azure.key;
  
  if (!account || !key) throw new Error("Azure Storage Account or Key not configured.");
  
  const credential = new StorageSharedKeyCredential(account, key);

  const expiresOn = new Date(Date.now() + minutes * 60 * 1000);

  const sas = generateBlobSASQueryParameters({
    containerName: container,
    blobName,
    permissions: BlobSASPermissions.parse("r"),
    expiresOn
  }, credential).toString();

  return `https://${account}.blob.core.windows.net/${container}/${blobName}?${sas}`;
}
