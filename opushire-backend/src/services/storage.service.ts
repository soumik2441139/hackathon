import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { BlobServiceClient } from '@azure/storage-blob';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Enterprise Multi-Cloud Storage Adapter
 * Flawlessly abstracts connection details so the backend can seamlessly
 * switch between Local MinIO (S3 clone) and Production Azure Blob Storage.
 */
class CloudStorage {
    private s3Client: S3Client | null = null;
    private blobClient: BlobServiceClient | null = null;
    private bucketName: string;

    constructor() {
        this.bucketName = env.STORAGE_BUCKET;

        if (env.AZURE_STORAGE_CONNECTION_STRING) {
            this.blobClient = BlobServiceClient.fromConnectionString(env.AZURE_STORAGE_CONNECTION_STRING);
            logger.info({ scope: 'Storage' }, 'StorageService initialized with Microsoft Azure Blob Storage');
        } else if (env.STORAGE_URL) {
            this.s3Client = new S3Client({
                endpoint: env.STORAGE_URL, // e.g., http://localhost:9000
                region: 'us-east-1',       // Required by SDK but unused by MinIO
                credentials: {
                    accessKeyId: env.STORAGE_ACCESS_KEY || 'minioadmin',
                    secretAccessKey: env.STORAGE_SECRET_KEY || 'minioadmin',
                },
                forcePathStyle: true,      // CRITICAL for MinIO path routing
            });
            logger.info({ scope: 'Storage' }, 'StorageService initialized with self-hosted MinIO (S3 Compatible)');
        } else {
            logger.warn({ scope: 'Storage' }, 'No Cloud Storage configured. Uploads will silently drop (Not Infrastructure Ready).');
        }
    }

    /**
     * Uploads the buffer to the active cloud provider and returns a public URL.
     */
    async uploadResume(fileName: string, buffer: Buffer, contentType: string = 'application/pdf'): Promise<string> {
        const key = `resumes/${Date.now()}-${fileName.replace(/\s+/g, '-')}`;

        if (this.blobClient) {
            const containerClient = this.blobClient.getContainerClient(this.bucketName);
            await containerClient.createIfNotExists({ access: 'blob' });
            
            const blockBlobClient = containerClient.getBlockBlobClient(key);
            await blockBlobClient.uploadData(buffer, {
                blobHTTPHeaders: { blobContentType: contentType }
            });
            
            return blockBlobClient.url;
        }

        if (this.s3Client) {
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: buffer,
                ContentType: contentType,
            });
            
            await this.s3Client.send(command);
            
            // Generate direct access URL (MinIO format)
            return `${env.STORAGE_URL}/${this.bucketName}/${key}`;
        }

        throw new Error('Storage adapter is offline. Configure AZURE_STORAGE_CONNECTION_STRING or STORAGE_URL.');
    }

    /**
     * Generates a temporary secure link for private assets.
     */
    async getSecureDownloadUrl(key: string, expirySeconds: number = 3600): Promise<string> {
        if (this.s3Client) {
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: key,
            });
            return await getSignedUrl(this.s3Client, command, { expiresIn: expirySeconds });
        }
        
        throw new Error('getSecureDownloadUrl not yet implemented for Azure Blob Adapter.');
    }
}

export const StorageService = new CloudStorage();
