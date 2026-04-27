import faiss from 'faiss-node';
import fs from 'fs';
import path from 'path';
import { log, logError } from '../../utils/logger';

const DIMENSIONS = 768; // Based on text-embedding-004 output size
const PERSIST_DIR = path.join(__dirname, '..', '..', '..', 'data', 'faiss');
const INDEX_PATH = path.join(PERSIST_DIR, 'index.faiss');
const IDMAP_PATH = path.join(PERSIST_DIR, 'idmap.json');

// Simple memory store tracking vector internal integer ID -> Job MongoDB ObjectId string
let idMap: string[] = [];
let index: faiss.IndexFlatL2;

function initIndex(): faiss.IndexFlatL2 {
    // Try loading persisted index from disk
    try {
        if (fs.existsSync(INDEX_PATH) && fs.existsSync(IDMAP_PATH)) {
            const loaded = faiss.IndexFlatL2.read(INDEX_PATH);
            idMap = JSON.parse(fs.readFileSync(IDMAP_PATH, 'utf-8'));
            log('FAISS', `Loaded ${idMap.length} vectors from disk`);
            return loaded;
        }
    } catch (e: any) {
        log('FAISS', `Failed to load persisted index, starting fresh: ${e.message}`);
    }
    return new faiss.IndexFlatL2(DIMENSIONS);
}

index = initIndex();

function persistToDisk(): void {
    try {
        fs.mkdirSync(PERSIST_DIR, { recursive: true });
        index.write(INDEX_PATH);
        fs.writeFileSync(IDMAP_PATH, JSON.stringify(idMap));
    } catch (e: any) {
        logError('FAISS', `Persist failed: ${e.message}`, e);
    }
}

// Debounce writes so rapid addVector calls don't thrash the disk
let persistTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersist(): void {
    if (persistTimer) clearTimeout(persistTimer);
    persistTimer = setTimeout(persistToDisk, 5000);
}

export function addVector(id: string, vec: number[]): void {
    if (vec.length !== DIMENSIONS) {
        throw new Error(`Vector dimension mismatch. Expected ${DIMENSIONS}, got ${vec.length}`);
    }
    index.add(vec);
    idMap.push(id);
    schedulePersist();
}

export function search(vec: number[], k: number = 20): string[] {
    if (index.ntotal() === 0) return [];
    
    // faiss.search throws if k > ntotal
    const actualK = Math.min(k, index.ntotal());
    
    const r = index.search(vec, actualK);
    // @ts-ignore - types are incorrect in faiss-node for results structure
    const labels = r.labels || [];
    return labels.map((i: any) => idMap[i]).filter((id: any) => id !== undefined);
}

export function getFaissStats() {
    return {
        totalVectors: index.ntotal(),
        dimensions: (index as any).d || DIMENSIONS,
        persistPath: PERSIST_DIR,
    };
}

// Flush to disk on graceful shutdown
process.on('SIGTERM', persistToDisk);
process.on('SIGINT', persistToDisk);
