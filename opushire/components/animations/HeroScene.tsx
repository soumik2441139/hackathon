"use client";
import React from 'react';
import { useGSAP } from '@/hooks/useGSAP';
import gsap from 'gsap';

export const HeroScene = () => {
    const container = useGSAP(() => {
        gsap.to(".orb", {
            x: "random(-100, 100)",
            y: "random(-100, 100)",
            duration: "random(10, 20)",
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            stagger: {
                each: 1,
                from: "random"
            }
        });

        gsap.to(".glass-layer", {
            rotate: "random(-5, 5)",
            duration: 15,
            repeat: -1,
            yoyo: true,
            ease: "none"
        });
    });

    return (
        <div ref={container} className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
            <div className="orb absolute top-[20%] left-[10%] w-[40vw] h-[40vw] rounded-full bg-brand-violet/20 blur-[120px]" />
            <div className="orb absolute bottom-[10%] right-[10%] w-[35vw] h-[35vw] rounded-full bg-brand-cyan/20 blur-[120px]" />
            <div className="absolute inset-0 bg-brand-dark/40 backdrop-blur-[100px]" />

            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            <div className="absolute inset-0 bg-grid-white/[0.02] [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        </div>
    );
};
