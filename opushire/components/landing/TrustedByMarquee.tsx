"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { jobs } from '@/lib/api';

const TYPOGRAPHY_STYLES = [
    "font-black italic",
    "font-black tracking-widest leading-none uppercase",
    "font-bold font-mono",
    "font-bold lowercase tracking-tighter",
    "font-black uppercase",
    "font-bold font-serif italic",
    "font-bold tracking-tight"
];

export const TrustedByMarquee = () => {
    const [companies, setCompanies] = useState<React.ReactNode[]>([]);

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                // Fetch a large sample of jobs to grab company names
                const res = await jobs.getAll({ limit: 50 });
                const uniqueCompanyNames = Array.from(new Set(res.data.jobs.map(job => job.company)));

                if (uniqueCompanyNames.length === 0) return;

                // Create the original set of elements
                const companyElements = uniqueCompanyNames.map((companyName, index) => (
                    <div key={`c${index}`} className={`text-2xl px-8 ${TYPOGRAPHY_STYLES[index % TYPOGRAPHY_STYLES.length]}`}>
                        {companyName}
                    </div>
                ));

                // Duplicate the set for seamless looping
                const duplicateElements = uniqueCompanyNames.map((companyName, index) => (
                    <div key={`c${index}_dup`} className={`text-2xl px-8 ${TYPOGRAPHY_STYLES[index % TYPOGRAPHY_STYLES.length]}`}>
                        {companyName}
                    </div>
                ));

                setCompanies([...companyElements, ...duplicateElements]);
            } catch (error) {
                console.error("Failed to load companies for marquee:", error);
            }
        };

        fetchCompanies();
    }, []);

    // Prevent rendering the crawler if no data is loaded yet to avoid stuttering
    if (companies.length === 0) return null;

    return (
        <div className="w-full mt-20 pt-12 border-t border-white/5 relative">
            <p className="text-xs uppercase tracking-[0.2em] text-white/30 font-bold mb-8 text-center">
                Trusted by world-class teams
            </p>

            <div
                className="flex whitespace-nowrap opacity-40 grayscale hover:grayscale-0 transition-all duration-700 w-full overflow-hidden"
                style={{
                    maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
                }}
            >
                <motion.div
                    className="flex flex-row items-center justify-start space-x-12 w-max"
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
