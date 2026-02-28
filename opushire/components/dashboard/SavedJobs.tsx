import { MOCK_JOBS } from '@/lib/data';
import { JobCard } from '../jobs/JobCard';

export const SavedJobs = () => {
    const savedJobs = MOCK_JOBS.slice(0, 2);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Saved Opportunities</h2>
                <span className="text-sm text-white/50">{savedJobs.length} Saved</span>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {savedJobs.map(job => (
                    <JobCard key={job._id} job={job} />
                ))}
            </div>
        </div>
    );
};
