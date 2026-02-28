import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface JobFilterProps {
    selectedType: string;
    onTypeChange: (type: string) => void;
}

const jobTypes = ["All", "Internship", "Full-time", "Part-time", "Contract"];
const categories = ["Engineering", "Design", "Product", "Marketing", "Sales"];

export const JobFilter = ({ selectedType, onTypeChange }: JobFilterProps) => {
    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/30 mb-6 px-2">Job Type</h3>
                <div className="flex flex-col gap-2">
                    {jobTypes.map(type => (
                        <button
                            key={type}
                            onClick={() => onTypeChange(type)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all font-medium ${selectedType === type
                                    ? "bg-brand-violet/20 text-brand-violet border border-brand-violet/30"
                                    : "text-white/50 hover:bg-white/5 hover:text-white"
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/30 mb-6 px-2">Categories</h3>
                <div className="flex flex-wrap gap-2 px-2">
                    {categories.map(cat => (
                        <Badge
                            key={cat}
                            variant="outline"
                            className="cursor-pointer hover:border-brand-cyan hover:text-brand-cyan transition-colors py-2 px-4 text-sm"
                        >
                            {cat}
                        </Badge>
                    ))}
                </div>
            </div>

            <div className="pt-4 px-2">
                <div className="glass-card p-6 bg-gradient-to-br from-brand-violet/20 to-brand-cyan/20 border-brand-violet/20">
                    <h4 className="font-bold mb-2">Get personalized alerts</h4>
                    <p className="text-xs text-white/50 mb-4">We'll notify you when new jobs match your profile.</p>
                    <Button variant="outline" size="sm" className="w-full text-xs">Set Alert</Button>
                </div>
            </div>
        </div>
    );
};
