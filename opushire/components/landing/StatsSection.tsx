import { ScrollReveal } from '../animations/ScrollReveal';

const stats = [
    { label: "Active Jobs", value: "2.5K+", suffix: "" },
    { label: "Partner Startups", value: "500", suffix: "+" },
    { label: "Average Salary", value: "₹45K", suffix: "/mo" },
    { label: "Success Rate", value: "85", suffix: "%" },
];

export const StatsSection = () => {
    return (
        <section className="py-24 px-6">
            <div className="max-w-7xl mx-auto glass-card py-16 px-8 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
                {stats.map((stat, index) => (
                    <ScrollReveal key={stat.label} delay={index * 0.1}>
                        <div className="flex flex-col gap-2">
                            <div className="text-4xl md:text-5xl font-black text-brand-text flex items-end justify-center">
                                {stat.value}
                                <span className="text-xl text-brand-cyan ml-1 mb-1 font-bold">{stat.suffix}</span>
                            </div>
                            <p className="text-brand-text/40 text-sm font-medium uppercase tracking-widest">{stat.label}</p>
                        </div>
                    </ScrollReveal>
                ))}
            </div>
        </section>
    );
};
