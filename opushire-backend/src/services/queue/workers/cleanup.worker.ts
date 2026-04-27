import { createWorker } from '../queue.service';
import JobModel from '../../../models/Job';
import BotStat from '../../../models/BotStat';

export function registerCleanupWorker() {
  createWorker('cleanup-jobs', async () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const deleted = await JobModel.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
    const archived = await JobModel.updateMany(
      { createdAt: { $lt: oneWeekAgo, $gte: thirtyDaysAgo }, isArchived: { $ne: true } },
      { $set: { isArchived: true } },
    );

    if (archived.modifiedCount > 0) {
      await BotStat.incrementMetric('jobsArchived', archived.modifiedCount);
    }

    return { deleted: deleted.deletedCount, archived: archived.modifiedCount };
  });
}
