import mongoose from 'mongoose';
import { enqueue } from '../services/queue/queue.service';
import { log, logError } from '../utils/logger';

/**
 * MongoDB Change Stream triggers.
 * Listens for inserts/updates on collections and pushes jobs
 * into BullMQ queues — replacing all polling loops.
 */
export function registerChangeStreams() {
  const db = mongoose.connection;

  // Wait until connection is ready
  if (db.readyState !== 1) {
    db.once('open', () => startWatchers());
  } else {
    startWatchers();
  }
}

function startWatchers() {
  const db = mongoose.connection;

  // ─── Jobs Collection: new inserts → scan queue ─────────────────
  try {
    const jobsStream = db.collection('jobs').watch(
      [{ $match: { operationType: 'insert' } }],
      { fullDocument: 'updateLookup' },
    );

    jobsStream.on('change', (change: any) => {
      const jobId = change.fullDocument?._id?.toString();
      if (!jobId) return;

      log('CHANGE_STREAM', `New job inserted: ${jobId}`);
      enqueue('scan-jobs', 'scan', { jobId }, {
        jobId: `scan-${jobId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      }).catch((err) => logError('CHANGE_STREAM', 'Failed to enqueue scan job', err));
    });

    jobsStream.on('error', (err) => {
      logError('CHANGE_STREAM', 'Jobs watcher error', err);
    });

    log('CHANGE_STREAM', 'Watching jobs collection for inserts');
  } catch (err) {
    logError('CHANGE_STREAM', 'Failed to start jobs watcher (requires replica set)', err);
  }

  // ─── Resumes Collection: new inserts → match queue ─────────────
  try {
    const resumeStream = db.collection('resumes').watch(
      [{ $match: { operationType: 'insert' } }],
      { fullDocument: 'updateLookup' },
    );

    resumeStream.on('change', (change: any) => {
      const resumeId  = change.fullDocument?._id?.toString();
      const userId    = change.fullDocument?.userId?.toString();
      if (!resumeId) return;

      log('CHANGE_STREAM', `New resume uploaded: ${resumeId}`);

      // Trigger one-time resume match (existing pipeline)
      enqueue('match-resumes', 'match', { resumeId }, {
        jobId:   `match-${resumeId}`,
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        delay:   10000,
      }).catch((err) => logError('CHANGE_STREAM', 'Failed to enqueue match job', err));

      // Register repeatable Antigravity job-fetch for this candidate (every 1h)
      // jobId: fetch:${userId} prevents duplicate schedules if candidate re-uploads
      if (userId) {
        enqueue('fetch-jobs', 'fetch', { candidateId: userId }, {
          jobId: `fetch:${userId}`,
          repeat: { every: 60 * 60 * 1000 }, // every 1 hour
        }).catch((err) => logError('CHANGE_STREAM', 'Failed to schedule fetch-jobs for candidate', err));

        log('CHANGE_STREAM', `Scheduled hourly job-fetch for candidate ${userId}`);
      }
    });

    resumeStream.on('error', (err) => {
      logError('CHANGE_STREAM', 'Resumes watcher error', err);
    });

    log('CHANGE_STREAM', 'Watching resumes collection for inserts');
  } catch (err) {
    logError('CHANGE_STREAM', 'Failed to start resumes watcher (requires replica set)', err);
  }

  // ─── Resumes: linkedin field added → enrich queue ──────────────
  try {
    const enrichStream = db.collection('resumes').watch(
      [{
        $match: {
          operationType: 'update',
          'updateDescription.updatedFields.extraData.linkedin': { $exists: true },
        },
      }],
      { fullDocument: 'updateLookup' },
    );

    enrichStream.on('change', (change: any) => {
      const resumeId = change.fullDocument?._id?.toString();
      const linkedinUrl = change.fullDocument?.extraData?.linkedin;
      if (!resumeId || !linkedinUrl) return;

      log('CHANGE_STREAM', `LinkedIn URL detected for resume ${resumeId}`);
      enqueue('linkedin-enrich', 'enrich', { resumeId, linkedinUrl }, {
        jobId: `enrich-${resumeId}`,
        attempts: 2,
        backoff: { type: 'exponential', delay: 10000 },
      }).catch((err) => logError('CHANGE_STREAM', 'Failed to enqueue enrich job', err));
    });

    log('CHANGE_STREAM', 'Watching resumes for LinkedIn URLs');
  } catch (err) {
    logError('CHANGE_STREAM', 'Failed to start enrich watcher', err);
  }
}
