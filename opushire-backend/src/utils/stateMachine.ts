import { log, logError } from './logger';

/**
 * Formal state machine for Job tagTileStatus.
 *
 * Valid transitions:
 *   OK             → VETTED | NEEDS_SHORTENING
 *   NEEDS_SHORTENING → PENDING_REVIEW | FAILED | VETTED
 *   PENDING_REVIEW → READY_TO_APPLY | NEEDS_SHORTENING
 *   READY_TO_APPLY → VETTED
 *   FAILED         → NEEDS_SHORTENING
 *   VETTED         → (terminal — no further transitions)
 */

export type TagStatus =
  | 'OK'
  | 'NEEDS_SHORTENING'
  | 'PENDING_REVIEW'
  | 'READY_TO_APPLY'
  | 'FAILED'
  | 'VETTED';

const TRANSITIONS: Record<TagStatus, TagStatus[]> = {
  OK:               ['VETTED', 'NEEDS_SHORTENING'],
  NEEDS_SHORTENING: ['PENDING_REVIEW', 'FAILED', 'VETTED'],
  PENDING_REVIEW:   ['READY_TO_APPLY', 'NEEDS_SHORTENING'],
  READY_TO_APPLY:   ['VETTED'],
  FAILED:           ['NEEDS_SHORTENING'],
  VETTED:           [],
};

export interface TransitionResult {
  allowed: boolean;
  from: TagStatus;
  to: TagStatus;
  reason?: string;
}

/**
 * Check whether a transition is valid and return the result.
 * Does NOT mutate any data — purely validates.
 */
export function canTransition(from: TagStatus, to: TagStatus): TransitionResult {
  const allowed = TRANSITIONS[from]?.includes(to) ?? false;
  return {
    allowed,
    from,
    to,
    reason: allowed ? undefined : `Transition ${from} → ${to} is not allowed`,
  };
}

/**
 * Build a MongoDB $set update that enforces the state transition.
 * Throws if the transition is invalid.
 * Appends an audit entry to `statusHistory` so we have a full trail.
 */
export function buildStatusUpdate(
  from: TagStatus,
  to: TagStatus,
  actor: string,
  extra: Record<string, any> = {},
): Record<string, any> {
  const result = canTransition(from, to);
  if (!result.allowed) {
    logError('STATE_MACHINE', result.reason!, { from, to, actor });
    throw new Error(result.reason);
  }

  log('STATE_MACHINE', `${from} → ${to} by ${actor}`);

  return {
    $set: {
      tagTileStatus: to,
      ...extra,
    },
    $push: {
      statusHistory: {
        from,
        to,
        actor,
        timestamp: new Date(),
      },
    },
  };
}
