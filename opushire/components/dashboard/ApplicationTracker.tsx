import { Badge } from '../ui/Badge';
import { IndianRupee, MapPin, Search } from 'lucide-react';

const mockApps = [
    { id: 1, job: "Full Stack Developer Intern", company: "Vercel", status: "Applied", date: "2 days ago" },
    { id: 2, job: "Frontend Engineer", company: "Stripe", status: "Interview", date: "5 days ago" },
    { id: 3, job: "Product Designer", company: "Airbnb", status: "Shortlisted", date: "1 week ago" },
];

export const ApplicationTracker = () => {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Your Applications</h2>
                <span className="text-sm text-white/50">{mockApps.length} Total</span>
            </div>

            <div className="space-y-4">
                {mockApps.map(app => (
                    <div key={app.id} className="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/20 transition-all">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center font-bold text-lg">
                                {app.company.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold">{app.job}</h3>
                                <p className="text-sm text-white/50">{app.company}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-8">
                            <div className="hidden md:block">
                                <p className="text-xs uppercase tracking-widest text-white/30 font-bold mb-1">Applied</p>
                                <p className="text-sm">{app.date}</p>
                            </div>
                            <Badge variant={app.status === 'Interview' ? 'cyan' : app.status === 'Shortlisted' ? 'violet' : 'default'} className="px-5 py-2">
                                {app.status}
                            </Badge>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
