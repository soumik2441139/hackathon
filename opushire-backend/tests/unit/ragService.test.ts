import { buildFewShotSection } from '../../src/services/rag/rag.service';

describe('RAG buildFewShotSection', () => {
    it('returns empty string for empty examples array', () => {
        expect(buildFewShotSection([])).toBe('');
    });

    it('formats a single example correctly', () => {
        const result = buildFewShotSection([
            { input: 'Need someone with deep TypeScript knowledge', output: 'TYPESCRIPT' },
        ]);
        expect(result).toContain('Input: Need someone with deep TypeScript knowledge');
        expect(result).toContain('Output: TYPESCRIPT');
        expect(result).toContain('---');
        expect(result).toContain('Now handle the current case:');
    });

    it('formats multiple examples separated by dashes', () => {
        const result = buildFewShotSection([
            { input: 'React expert needed', output: 'REACT' },
            { input: 'Python data engineer', output: 'PYTHON, DATA' },
        ]);
        // Should contain both examples
        expect(result).toContain('Input: React expert needed');
        expect(result).toContain('Output: PYTHON, DATA');
        // Count separators
        const dashCount = (result.match(/---/g) || []).length;
        expect(dashCount).toBe(2);
    });

    it('starts with the header text', () => {
        const result = buildFewShotSection([{ input: 'a', output: 'b' }]);
        expect(result).toContain('examples of past successful decisions');
    });

    it('ends with the instruction to handle current case', () => {
        const result = buildFewShotSection([{ input: 'a', output: 'b' }]);
        expect(result.trimEnd()).toMatch(/Now handle the current case:$/);
    });
});
