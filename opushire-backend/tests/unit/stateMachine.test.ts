import { canTransition, buildStatusUpdate, TagStatus } from '../../src/utils/stateMachine';

// Mock the logger so tests don't spam stdout
jest.mock('../../src/utils/logger', () => ({
    log: jest.fn(),
    logError: jest.fn(),
}));

describe('State Machine — canTransition()', () => {
    const validTransitions: [TagStatus, TagStatus][] = [
        ['OK', 'VETTED'],
        ['OK', 'NEEDS_SHORTENING'],
        ['NEEDS_SHORTENING', 'PENDING_REVIEW'],
        ['NEEDS_SHORTENING', 'FAILED'],
        ['NEEDS_SHORTENING', 'VETTED'],
        ['PENDING_REVIEW', 'READY_TO_APPLY'],
        ['PENDING_REVIEW', 'NEEDS_SHORTENING'],
        ['READY_TO_APPLY', 'VETTED'],
        ['FAILED', 'NEEDS_SHORTENING'],
    ];

    it.each(validTransitions)('%s → %s should be allowed', (from, to) => {
        const result = canTransition(from, to);
        expect(result.allowed).toBe(true);
        expect(result.from).toBe(from);
        expect(result.to).toBe(to);
        expect(result.reason).toBeUndefined();
    });

    const invalidTransitions: [TagStatus, TagStatus][] = [
        ['OK', 'READY_TO_APPLY'],
        ['OK', 'PENDING_REVIEW'],
        ['FAILED', 'READY_TO_APPLY'],
        ['VETTED', 'NEEDS_SHORTENING'],
        ['VETTED', 'OK'],
        ['READY_TO_APPLY', 'NEEDS_SHORTENING'],
        ['PENDING_REVIEW', 'FAILED'],
    ];

    it.each(invalidTransitions)('%s → %s should be rejected', (from, to) => {
        const result = canTransition(from, to);
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain('not allowed');
    });

    it('VETTED is terminal — no outgoing transitions allowed', () => {
        const allStates: TagStatus[] = ['OK', 'NEEDS_SHORTENING', 'PENDING_REVIEW', 'READY_TO_APPLY', 'FAILED', 'VETTED'];
        for (const target of allStates) {
            const result = canTransition('VETTED', target);
            expect(result.allowed).toBe(false);
        }
    });
});

describe('State Machine — buildStatusUpdate()', () => {
    it('produces correct $set and $push for valid transition', () => {
        const update = buildStatusUpdate('NEEDS_SHORTENING', 'PENDING_REVIEW', 'fix-worker');
        expect(update.$set.tagTileStatus).toBe('PENDING_REVIEW');
        expect(update.$push.statusHistory).toMatchObject({
            from: 'NEEDS_SHORTENING',
            to: 'PENDING_REVIEW',
            actor: 'fix-worker',
        });
        expect(update.$push.statusHistory.timestamp).toBeInstanceOf(Date);
    });

    it('merges extra fields into $set', () => {
        const update = buildStatusUpdate('NEEDS_SHORTENING', 'PENDING_REVIEW', 'fix-worker', {
            proposedTags: ['REACT', 'NODE'],
        });
        expect(update.$set.proposedTags).toEqual(['REACT', 'NODE']);
        expect(update.$set.tagTileStatus).toBe('PENDING_REVIEW');
    });

    it('throws on invalid transition', () => {
        expect(() => buildStatusUpdate('OK', 'READY_TO_APPLY', 'test')).toThrow('not allowed');
    });

    it('includes actor name in audit trail', () => {
        const update = buildStatusUpdate('PENDING_REVIEW', 'READY_TO_APPLY', 'supervise-worker');
        expect(update.$push.statusHistory.actor).toBe('supervise-worker');
    });
});
