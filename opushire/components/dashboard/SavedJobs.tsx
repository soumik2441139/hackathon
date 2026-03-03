import { JobCard } from '../jobs/JobCard';
import { useAuth } from '@/context/AuthContext';
import { Job } from '@/lib/types';

export const SavedJobs = () => {
    const { user } = useAuth();
    const savedJobs = (user?.savedJobs as Job[]) || [];


    return (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-white">Saved Jobs</h2>
                <span className="text-sm font-bold uppercase tracking-widest text-yellow-500 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                    {savedJobs.length} MATCHES
                </span>
            </div>

            {savedJobs.length === 0 ? (
                <div className="glass-card p-16 text-center border-dashed border-white/20 bg-white/[0.02] rounded-2xl">
                    <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-6">
                        <span className="text-3xl text-yellow-500">📌</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No Saved Jobs Yes</h3>
                    <p className="text-white/40">Keep track of opportunities you like by saving them from the Job Board.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-20">
                    {savedJobs.map((job, idx) => (
                        <div key={job._id} className="animate-in fade-in slide-in-from-bottom-8" style={{ animationDelay: `${idx * 100}ms` }}>
                            <JobCard job={job} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
