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
        <div className="glass-card p-6 flex flex-col h-full hover:border-white/20 hover:bg-white/[0.05] transition-all group justify-between">
            <div className="space-y-4">
                <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center text-xl transition-transform group-hover:scale-110 overflow-hidden shrink-0 shadow-sm border border-white/10">
                            {job.companyLogo?.startsWith('http') || job.companyLogo?.startsWith('data:') ? (
                                <img src={job.companyLogo} alt={`${job.company} logo`} className="w-full h-full object-contain p-1.5" />
                            ) : (
                                <span className="text-brand-dark font-bold">{job.companyLogo || '🏢'}</span>
                            )}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold group-hover:text-brand-violet transition-colors text-brand-text line-clamp-1">{job.title}</h3>
                            <p className="text-sm text-brand-text/50 font-medium">{job.company}</p>
                        </div>
                    </div>
                    {job.featured && <Badge variant="violet" className="shrink-0 text-[10px] py-0 h-5">Featured</Badge>}
                </div>

                <div className="flex flex-wrap gap-y-2 gap-x-5">
                    <div className="flex items-center gap-1.5 text-xs text-brand-text/50 font-medium">
                        <MapPin size={14} className="text-brand-cyan" />
                        <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-brand-text/50 font-medium">
                        <Briefcase size={14} className="text-brand-cyan" />
                        <span>{job.type}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-brand-text/50 font-medium">
                        <IndianRupee size={14} className="text-brand-cyan" />
                        <span>{job.salary || formatSalary(job.salaryMin, job.salaryMax)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-brand-text/50 font-medium">
                        <Clock size={14} className="text-brand-cyan" />
                        <span>{job.posted || timeAgo(job.createdAt)}</span>
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 content-start">
                    {job.tags.slice(0, 4).map(tag => (
                        <Badge key={tag} variant="outline" className="bg-white/5 border-white/10 uppercase tracking-tighter text-[9px] px-2 h-5 font-bold">{tag}</Badge>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 pt-5 mt-5 border-t border-white/5">
                <Link href={`/jobs/${job._id}`} className="flex-1">
                    <Button variant="glass" className="w-full h-10 font-bold uppercase tracking-widest text-[10px]">Details</Button>
                </Link>
                <Button variant="primary" className="px-8 h-10 font-bold uppercase tracking-widest text-[10px]">Apply</Button>
            </div>
        </div>
    );
};
