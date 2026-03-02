import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

export const useGSAP = (callback: (context: gsap.Context) => void, deps: unknown[] = []) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(callback, containerRef);
        return () => ctx.revert();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);

    return containerRef;
};
