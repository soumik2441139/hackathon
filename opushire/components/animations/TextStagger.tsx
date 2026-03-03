"use client";
import { motion, useAnimation, useInView, Variants } from "framer-motion";
import { useEffect, useRef } from "react";

interface TextStaggerProps {
    text: string;
    className?: string;
    delay?: number;
}

export const TextStagger = ({ text, className = "", delay = 0 }: TextStaggerProps) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });
    const controls = useAnimation();

    useEffect(() => {
        if (isInView) {
            controls.start("visible");
        }
    }, [isInView, controls]);

    const words = text.split(" ");

    const container: Variants = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.12, delayChildren: delay * i },
        }),
    };

    const child: Variants = {
        visible: {
            opacity: 1,
            y: 0,
            rotateX: 0,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
            },
        },
        hidden: {
            opacity: 0,
            y: 50,
            rotateX: -90,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
            },
        },
    };

    return (
        <motion.div
            ref={ref}
            className={`overflow-hidden flex flex-wrap justify-center ${className}`}
            variants={container}
            initial="hidden"
            animate={controls}
        >
            {words.map((word, index) => (
                <motion.span variants={child} style={{ marginRight: "0.25em" }} key={index}>
                    {word === "Career" ? <span className="text-gradient">Career</span> : word}
                </motion.span>
            ))}
        </motion.div>
    );
};
