import { cosineSimilarity } from '../../src/utils/math';

describe('cosineSimilarity', () => {
    it('returns 1.0 for identical vectors', () => {
        const v = [1, 2, 3, 4, 5];
        expect(cosineSimilarity(v, v)).toBeCloseTo(1.0, 5);
    });

    it('returns 0.0 for orthogonal vectors', () => {
        const a = [1, 0, 0];
        const b = [0, 1, 0];
        expect(cosineSimilarity(a, b)).toBeCloseTo(0.0, 5);
    });

    it('returns -1.0 for opposite vectors', () => {
        const a = [1, 2, 3];
        const b = [-1, -2, -3];
        expect(cosineSimilarity(a, b)).toBeCloseTo(-1.0, 5);
    });

    it('returns 0.0 for zero-length vector (no division by zero)', () => {
        const zero = [0, 0, 0];
        const v = [1, 2, 3];
        expect(cosineSimilarity(zero, v)).toBe(0);
        expect(cosineSimilarity(v, zero)).toBe(0);
        expect(cosineSimilarity(zero, zero)).toBe(0);
    });

    it('handles unit vectors correctly', () => {
        const a = [1, 0];
        const b = [Math.SQRT1_2, Math.SQRT1_2]; // 45-degree angle
        // cos(45°) ≈ 0.707
        expect(cosineSimilarity(a, b)).toBeCloseTo(Math.SQRT1_2, 5);
    });

    it('works with higher-dimensional vectors', () => {
        // Two arbitrary 10-dim vectors
        const a = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
        const b = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1];
        const result = cosineSimilarity(a, b);
        // Result should be between -1 and 1
        expect(result).toBeGreaterThanOrEqual(-1);
        expect(result).toBeLessThanOrEqual(1);
        // These vectors are somewhat similar (positive correlation)
        expect(result).toBeGreaterThan(0);
    });

    it('is commutative (a·b === b·a)', () => {
        const a = [3, 7, 2, 5];
        const b = [1, 4, 8, 6];
        expect(cosineSimilarity(a, b)).toBeCloseTo(cosineSimilarity(b, a), 10);
    });
});
