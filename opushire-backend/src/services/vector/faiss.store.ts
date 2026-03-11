import faiss from 'faiss-node';

const DIMENSIONS = 768; // Based on text-embedding-004 output size
const index = new faiss.IndexFlatL2(DIMENSIONS);

// Simple memory store tracking vector internal integer ID -> Job MongoDB ObjectId string
const idMap: string[] = [];

export function addVector(id: string, vec: number[]): void {
    if (vec.length !== DIMENSIONS) {
        throw new Error(`Vector dimension mismatch. Expected ${DIMENSIONS}, got ${vec.length}`);
    }
    index.add(vec);
    idMap.push(id);
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
        dimensions: (index as any).d || DIMENSIONS
    };
}
