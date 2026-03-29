import { Job } from '../models/Job';

/**
 * Enterprise Job Repository
 * Abstracts all direct MongoDB Mongoose interactions from the Service layer.
 * This guarantees the Service layer is entirely database-agnostic, enabling
 * 100% mocked offline Unit Testing, a primary benchmark for Staff Engineers.
 */
class JobRepository {
    async findJobsWithCount(query: Record<string, any>, skip: number, limit: number) {
        const [jobs, total] = await Promise.all([
            Job.find(query)
               .sort({ createdAt: -1 })
               .skip(skip)
               .limit(limit)
               .populate('postedBy', 'name email'),
            Job.countDocuments(query),
        ]);
        return { jobs, total };
    }

    async findById(id: string) {
        return await Job.findById(id).populate('postedBy', 'name email');
    }

    async create(data: any) {
        return await Job.create(data);
    }

    async updateById(id: string, data: any) {
        return await Job.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
    }

    async deleteById(id: string) {
        return await Job.findByIdAndDelete(id);
    }

    async deleteMany(ids: string[]): Promise<{ deletedCount: number }> {
        const result = await Job.deleteMany({ _id: { $in: ids } });
        return { deletedCount: result.deletedCount };
    }
}

export const JobRepo = new JobRepository();
