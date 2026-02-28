import { ScrollReveal } from '../animations/ScrollReveal';
import { UserPlus, Search, Send, CheckCircle } from 'lucide-react';

const steps = [
    {
        icon: <UserPlus className="w-8 h-8" />,
        title: "Create Profile",
        desc: "Complete your professional profile with skills, college info, and degree details."
    },
    {
        icon: <Search className="w-8 h-8" />,
        title: "Find Matches",
        desc: "Use advanced filters to find internships and jobs that match your skills precisely."
    },
    {
        icon: <Send className="w-8 h-8" />,
        title: "One-Click Apply",
        desc: "Apply to multiple high-growth startups with your pre-filled student profile."
    },
    {
        icon: <CheckCircle className="w-8 h-8" />,
        title: "Get Hired",
        desc: "Track your application status and land your dream role at top tech companies."
    }
];

export const HowItWorks = () => {
    return (
        <section className="py-32 px-6 max-w-7xl mx-auto">
            <div className="text-center mb-20">
                <ScrollReveal>
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">How it works</h2>
                    <p className="text-white/50 max-w-xl mx-auto text-lg leading-relaxed">
                        Four simple steps to bridging the gap between campus and the tech ecosystem.
                    </p>
                </ScrollReveal>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                {/* Progress Line */}
                <div className="hidden md:block absolute top-[2.5rem] left-[10%] right-[10%] h-[1px] bg-white/5 -z-10" />

                {steps.map((step, index) => (
                    <ScrollReveal key={step.title} delay={index * 0.1} direction="up">
                        <div className="flex flex-col items-center text-center group">
                            <div className="w-20 h-20 rounded-2xl bg-brand-glass border border-brand-glass-border flex items-center justify-center mb-8 text-brand-cyan group-hover:bg-brand-violet/20 group-hover:text-brand-violet transition-all duration-500 group-hover:rotate-6">
                                {step.icon}
                            </div>
                            <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                            <p className="text-white/40 text-sm leading-relaxed">{step.desc}</p>
                        </div>
                    </ScrollReveal>
                ))}
            </div>
        </section>
    );
};
