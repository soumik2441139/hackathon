import { createWorker } from '../queue.service';
import JobModel from '../../../models/Job';
import BotStat from '../../../models/BotStat';

export function registerCleanupWorker() {
  createWorker('cleanup-jobs', async () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);

    const deleted = await JobModel.deleteMany({ createdAt: { $lt: threeWeeksAgo } });
    const archived = await JobModel.updateMany(
      { createdAt: { $lt: oneWeekAgo, $gte: threeWeeksAgo }, isArchived: { $ne: true } },
      { $set: { isArchived: true } },
    );

    if (archived.modifiedCount > 0) {
      await (BotStat as any).incrementMetric('jobsArchived', archived.modifiedCount);
    }

    return { deleted: deleted.deletedCount, archived: archived.modifiedCount };
  });
}
