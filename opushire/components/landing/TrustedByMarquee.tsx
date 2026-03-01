"use client";
import React from 'react';
import { motion } from 'framer-motion';

export const TrustedByMarquee = () => {
    // We duplicate the list to create a seamless infinite loop
    const companies = [
        <div key="c0" className="text-2xl font-black italic px-8">VERCEL</div>,
        <div key="c1" className="text-2xl font-black tracking-widest leading-none px-8">STRIPE</div>,
        <div key="c2" className="text-2xl font-bold font-mono px-8">razorpay</div>,
        <div key="c3" className="text-2xl font-bold lowercase tracking-tighter px-8">airbnb</div>,
        <div key="c4" className="text-2xl font-black uppercase px-8">CRED</div>,
        <div key="c5" className="text-2xl font-bold font-serif italic px-8">Notion</div>,
        <div key="c6" className="text-2xl font-bold px-8">OpenAI</div>,

        // Duplicates for seamless loop
        <div key="c0_dup" className="text-2xl font-black italic px-8">VERCEL</div>,
        <div key="c1_dup" className="text-2xl font-black tracking-widest leading-none px-8">STRIPE</div>,
        <div key="c2_dup" className="text-2xl font-bold font-mono px-8">razorpay</div>,
        <div key="c3_dup" className="text-2xl font-bold lowercase tracking-tighter px-8">airbnb</div>,
        <div key="c4_dup" className="text-2xl font-black uppercase px-8">CRED</div>,
        <div key="c5_dup" className="text-2xl font-bold font-serif italic px-8">Notion</div>,
        <div key="c6_dup" className="text-2xl font-bold px-8">OpenAI</div>,
    ];

    return (
        <div className="w-full overflow-hidden mt-20 pt-12 border-t border-white/5 relative">
            <p className="text-xs uppercase tracking-[0.2em] text-white/30 font-bold mb-8 text-center">
                Trusted by world-class teams
            </p>

            {/* Fade effect on the very edges so logos "vanish" */}
            <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#031d27] to-transparent z-10 pointer-events-none translate-y-20"></div>
            <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#031d27] to-transparent z-10 pointer-events-none translate-y-20"></div>

            <div className="flex whitespace-nowrap opacity-40 grayscale hover:grayscale-0 transition-all duration-700 w-max">
                <motion.div
                    className="flex flex-row items-center justify-start space-x-12"
                    animate={{ x: "-50%" }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 25 // adjust speed of crawler
                    }}
                >
                    {...companies}
                </motion.div>
            </div>
        </div>
    );
};
