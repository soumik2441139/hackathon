import { parseKeywordList, extractFallbackKeywords } from '../../src/services/queue/workers/fix.worker';

describe('fix.worker — parseKeywordList', () => {
    it('parses comma-separated keywords', () => {
        const result = parseKeywordList('REACT, NODE, PYTHON');
        expect(result).toEqual(['REACT', 'NODE', 'PYTHON']);
    });

    it('caps at 3 keywords', () => {
        const result = parseKeywordList('A, B, C, D, E, F');
        expect(result).toHaveLength(3);
    });

    it('strips markdown formatting', () => {
        const result = parseKeywordList('*REACT*, _NODE_, **PYTHON**');
        expect(result).toContain('REACT');
        expect(result).toContain('NODE');
        expect(result).toContain('PYTHON');
    });

    it('uppercases all keywords', () => {
        const result = parseKeywordList('react, node.js');
        expect(result.every(k => k === k.toUpperCase())).toBe(true);
    });

    it('handles newline-separated input', () => {
        const result = parseKeywordList('React\nNode\nPython');
        expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('returns empty array for empty input', () => {
        expect(parseKeywordList('')).toEqual([]);
    });
});

describe('fix.worker — extractFallbackKeywords', () => {
    it('picks top-3 most frequent words', () => {
        const lines = [
            'Need experience with React and Node',
            'React is required, also Node experience',
            'Python and React development',
        ];
        const result = extractFallbackKeywords(lines);
        expect(result.length).toBeLessThanOrEqual(3);
        // 'react' appears 3 times → should be first
        expect(result[0]).toBe('REACT');
    });

    it('ignores stop words', () => {
        const lines = ['and or the with for from requirements skills experience'];
        const result = extractFallbackKeywords(lines);
        expect(result).toHaveLength(0);
    });

    it('ignores words shorter than 3 characters', () => {
        const lines = ['an at is go do in'];
        const result = extractFallbackKeywords(lines);
        expect(result).toHaveLength(0);
    });

    it('returns uppercased keywords', () => {
        const lines = ['typescript mongodb flutter'];
        const result = extractFallbackKeywords(lines);
        expect(result.every(k => k === k.toUpperCase())).toBe(true);
    });

    it('handles empty input gracefully', () => {
        expect(extractFallbackKeywords([])).toEqual([]);
        expect(extractFallbackKeywords([undefined as any])).toEqual([]);
    });
});
