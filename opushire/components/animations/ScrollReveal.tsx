"use client";
import React, { useEffect, useRef } from 'react';
import { motion, useInView, useAnimation, Variant } from 'framer-motion';

interface ScrollRevealProps {
    children: React.ReactNode;
    width?: "fit-content" | "100%";
    delay?: number;
    duration?: number;
    direction?: "up" | "down" | "left" | "right";
}

export const ScrollReveal = ({
    children,
    width = "fit-content",
    delay = 0,
    duration = 0.5,
    direction = "up"
}: ScrollRevealProps) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });
    const controls = useAnimation();

    useEffect(() => {
        if (isInView) {
            controls.start("visible");
        }
    }, [isInView, controls]);

    const variants = {
        hidden: {
            opacity: 0,
            y: direction === "up" ? 40 : direction === "down" ? -40 : 0,
            x: direction === "left" ? 40 : direction === "right" ? -40 : 0,
        },
        visible: {
            opacity: 1,
            y: 0,
            x: 0,
            transition: {
                duration,
                delay,
                ease: "easeInOut"
            }
        },
    };

    return (
        <div ref={ref} style={{ position: "relative", width, overflow: "visible" } as any}>
            <motion.div
                variants={variants as any}
                initial="hidden"
                animate={controls}
            >
                {children}
            </motion.div>
        </div>
    );
};
