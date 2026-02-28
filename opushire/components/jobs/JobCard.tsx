import { Job } from '@/lib/types';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { MapPin, Clock, Briefcase, IndianRupee } from 'lucide-react';
import Link from 'next/link';
import { formatSalary } from '@/lib/utils';

interface JobCardProps {
    job: Job;
}

export const JobCard = ({ job }: JobCardProps) => {
    return (
        <div className="glass-card p-6 flex flex-col gap-6 hover:border-white/20 hover:bg-white/[0.05] transition-all group">
            <div className="flex justify-between items-start">
                <div className="flex gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-3xl border border-white/5 transition-transform group-hover:scale-110">
                        {job.companyLogo}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold group-hover:text-brand-violet transition-colors text-brand-text">{job.title}</h3>
                        <p className="text-brand-text/50">{job.company}</p>
                    </div>
                </div>
                {job.featured && <Badge variant="violet">Featured</Badge>}
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
                    <span>{job.posted}</span>
                </div>
            </div>

            <div className="flex flex-wrap gap-2">
                {job.tags.map(tag => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
            </div>

            <div className="flex gap-4 pt-2">
                <Link href={`/jobs/${job._id}`} className="flex-1">
                    <Button variant="glass" className="w-full">Details</Button>
                </Link>
                <Button variant="primary" className="px-8">Apply</Button>
            </div>
        </div>
    );
};
