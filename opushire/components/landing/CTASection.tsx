import { ScrollReveal } from '../animations/ScrollReveal';
import { Button } from '../ui/Button';
import Link from 'next/link';

export const CTASection = () => {
    return (
        <section className="py-32 px-6">
            <div className="max-w-7xl mx-auto relative group overflow-hidden rounded-[3rem]">
                {/* Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-brand-violet/40 to-brand-cyan/40 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-brand-dark/20 backdrop-blur-3xl" />

                <div className="relative z-10 py-20 px-8 flex flex-col items-center text-center">
                    <ScrollReveal>
                        <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                            Ready to land your <br />
                            <span className="text-gradient">dream role?</span>
                        </h2>
                        <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto mb-12">
                            Join thousands of students who have launched their careers through Opushire. Start your journey today.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/register">
                                <Button size="lg" className="px-12">Get Started Now</Button>
                            </Link>
                            <Link href="/jobs">
                                <Button variant="outline" size="lg" className="px-12">Browse Jobs</Button>
                            </Link>
                        </div>
                    </ScrollReveal>
                </div>
            </div>
        </section>
    );
};
