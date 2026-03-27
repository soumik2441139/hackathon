import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../config/env';
import { logger } from '../utils/logger';

/**
 * Enterprise Vector Database Service
 * Connects to Qdrant (Local free container or Qdrant Cloud Cluster)
 * to store 768-dimensional AI embeddings from Gemini.
 */
class VectorDatabaseService {
    private client: QdrantClient | null = null;
    private collectionName = 'opushire-resumes';

    init() {
        if (env.VECTOR_DB_URL) {
            this.client = new QdrantClient({
                url: env.VECTOR_DB_URL,
                apiKey: env.VECTOR_DB_API_KEY,
            });
            logger.info({ scope: 'VectorDB' }, 'Qdrant Vector Database initialized successfully');
            this.ensureCollection();
        } else {
            logger.warn({ scope: 'VectorDB' }, 'No VECTOR_DB_URL found. Advanced Semantic matching is offline. Falling back to MongoDB text indexing.');
        }
    }

    private async ensureCollection() {
        if (!this.client) return;
        try {
            const collections = await this.client.getCollections();
            const exists = collections.collections.some((c) => c.name === this.collectionName);
            if (!exists) {
                // Gemini "text-embedding-004" model uses exactly 768 dimensions
                await this.client.createCollection(this.collectionName, {
                    vectors: { size: 768, distance: 'Cosine' },
                });
                logger.info({ scope: 'VectorDB' }, `Created new Qdrant HNSW vector index: ${this.collectionName}`);
            }
        } catch (e) {
            logger.error({ scope: 'VectorDB', err: e }, 'Failed to initialize Qdrant HNSW collection');
        }
    }

    /**
     * Pushes a candidate's resume embedding array into Vector memory.
     */
    async upsertResumeEmbeddings(resumeId: string, embedding: number[], metadata: Record<string, any>) {
        if (!this.client) return;

        await this.client.upsert(this.collectionName, {
            wait: true,
            points: [
                {
                    id: this.uuidFromString(resumeId),
                    vector: embedding,
                    payload: { ...metadata, originId: resumeId },
                }
            ]
        });
    }

    /**
     * Executes an Approximate Nearest Neighbor (ANN) Cosine search 
     * to find the top resumes that match a specific Job Description Vector.
     */
    async searchResumes(jobEmbedding: number[], topK: number = 10) {
        if (!this.client) return [];

        const results = await this.client.search(this.collectionName, {
            vector: jobEmbedding,
            limit: topK,
            with_payload: true,
        });

        return results.map(hit => ({
            id: hit.payload?.originId || hit.id,
            score: hit.score,
            metadata: hit.payload,
        }));
    }

    /**
     * Qdrant strictly requires valid UUIDs. This maps Mongo ObjectIds safely to UUIDv4 shapes.
     */
    private uuidFromString(str: string): string {
        const hash = Buffer.from(str).toString('hex').padEnd(32, '0').slice(0, 32);
        return `${hash.slice(0,8)}-${hash.slice(8,12)}-4000-8000-${hash.slice(20,32)}`;
    }
}

export const VectorDB = new VectorDatabaseService();
