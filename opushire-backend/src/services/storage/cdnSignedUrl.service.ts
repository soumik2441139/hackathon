import path from "path";
import { generateSecureBlobUrl } from "./blobSas.service";
import { SystemConfig } from "../../config/system.config";

export function generateSignedCdnUrl(blobUrl: string, minutes: number = 10): string {
  const file = path.basename(blobUrl);

  const sasBlobUrl = generateSecureBlobUrl("resumes", file, minutes);
  const sasQuery = sasBlobUrl.split("?")[1];

  return `${SystemConfig.azure.cdnBase}/${file}?${sasQuery}`;
}
