import { Button } from '@/components/ui/Button';
import dynamic from 'next/dynamic';
import { ScrollReveal } from '@/components/animations/ScrollReveal';
import { TextStagger } from '@/components/animations/TextStagger';
import { TrustedByMarquee } from './TrustedByMarquee';
import Link from 'next/link';

const ShaderAnimation = dynamic(() => import('@/components/ui/ShaderAnimation').then(mod => mod.ShaderAnimation), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-black" />
});

export const HeroSection = () => {
    return (
        <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-0 px-6 overflow-hidden">
            <div className="absolute inset-0 -z-10 bg-black">
                <ShaderAnimation />
                <div className="absolute inset-0 bg-brand-dark/20 backdrop-blur-[40px]" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-dark/20 to-brand-dark" />
            </div>

            <div className="max-w-4xl text-center z-10 w-full">

                <TextStagger
                    text="Elevate your Career from Campus."
                    className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.1] tracking-tighter text-brand-text"
                    delay={0}
                />

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
                    <TrustedByMarquee />
                </ScrollReveal>
            </div>
        </section>
    );
};
