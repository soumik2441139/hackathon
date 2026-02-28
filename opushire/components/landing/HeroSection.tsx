import { Button } from '@/components/ui/Button';
import { HeroScene } from '@/components/animations/HeroScene';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import Link from 'next/link';

export const HeroSection = () => {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-32 px-6">
            <HeroScene />

            <div className="max-w-4xl text-center z-10">
                <ScrollReveal direction="down" duration={0.8}>
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-violet/10 border border-brand-violet/20 text-brand-violet text-sm font-medium mb-8">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-cyan opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-cyan"></span>
                        </span>
                        Active student hiring for 500+ startups
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={0.2} duration={1}>
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.1] tracking-tighter text-brand-text">
                        Elevate your <span className="text-gradient">Career</span> from Campus.
                    </h1>
                </ScrollReveal>

                <ScrollReveal delay={0.4} duration={1}>
                    <p className="text-xl md:text-2xl text-brand-text/60 mb-12 max-w-2xl mx-auto leading-relaxed">
                        The premium job portal designed for high-growth students. Connect with the best tech companies and land your dream internship today.
                    </p>
                </ScrollReveal>

                <ScrollReveal delay={0.6} duration={1} direction="up">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Link href="/jobs">
                            <Button size="lg" className="w-full sm:w-auto">Explore Opportunities</Button>
                        </Link>
                        <Link href="/register">
                            <Button variant="glass" size="lg" className="w-full sm:w-auto">Post a Profile</Button>
                        </Link>
                    </div>
                </ScrollReveal>

                <ScrollReveal delay={0.8} duration={1} direction="up">
                    <div className="mt-20 pt-12 border-t border-white/5">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/30 font-bold mb-8">Trusted by talent makers</p>
                        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-700">
                            <div className="text-2xl font-black italic">VERCEL</div>
                            <div className="text-2xl font-black tracking-widest leading-none">STRIPE</div>
                            <div className="text-2xl font-bold font-mono">razorpay</div>
                            <div className="text-2xl font-bold lowercase tracking-tighter">airbnb</div>
                        </div>
                    </div>
                </ScrollReveal>
            </div>
        </section>
    );
};
