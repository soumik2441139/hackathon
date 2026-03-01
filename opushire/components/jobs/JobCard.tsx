import { Job } from '@/lib/types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { MapPin, Clock, Briefcase, IndianRupee } from 'lucide-react';
import Link from 'next/link';
import { formatSalary, timeAgo } from '@/lib/utils';

interface JobCardProps {
    job: Job;
}

export const JobCard = ({ job }: JobCardProps) => {
    return (
        <div className="glass-card p-8 flex flex-col h-full hover:border-white/20 hover:bg-white/[0.05] transition-all group min-h-[420px] justify-between">
            <div className="space-y-6">
                <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl border border-white/5 transition-transform group-hover:scale-110 overflow-hidden shrink-0">
                            {job.companyLogo?.startsWith('http') ? (
                                <img src={job.companyLogo} alt={`${job.company} logo`} className="w-full h-full object-contain p-1" />
                            ) : (
                                job.companyLogo || '🏢'
                            )}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold group-hover:text-brand-violet transition-colors text-brand-text line-clamp-1">{job.title}</h3>
                            <p className="text-brand-text/50 font-medium">{job.company}</p>
                        </div>
                    </div>
                    {job.featured && <Badge variant="violet" className="shrink-0">Featured</Badge>}
                </div>

                <div className="flex flex-wrap gap-y-3 gap-x-6">
                    <div className="flex items-center gap-2 text-sm text-brand-text/50">
                        <MapPin size={16} className="text-brand-cyan" />
                        <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-brand-text/50">
                        <Briefcase size={16} className="text-brand-cyan" />
                        <span>{job.type}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-brand-text/50">
                        <IndianRupee size={16} className="text-brand-cyan" />
                        <span>{job.salary || formatSalary(job.salaryMin, job.salaryMax)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-brand-text/50">
                        <Clock size={16} className="text-brand-cyan" />
                        <span>{job.posted || timeAgo(job.createdAt)}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 min-h-[64px] content-start">
                    {job.tags.slice(0, 4).map(tag => (
                        <Badge key={tag} variant="outline" className="bg-white/5 border-white/10 uppercase tracking-tighter text-[10px]">{tag}</Badge>
                    ))}
                </div>
            </div>

            <div className="flex gap-4 pt-6 mt-auto border-t border-white/5">
                <Link href={`/jobs/${job._id}`} className="flex-1">
                    <Button variant="glass" className="w-full h-12 font-bold uppercase tracking-widest text-xs">Details</Button>
                </Link>
                <Button variant="primary" className="px-10 h-12 font-bold uppercase tracking-widest text-xs">Apply</Button>
            </div>
        </div>
    );
};
