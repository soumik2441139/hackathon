import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

export const useGSAP = (callback: (context: gsap.Context) => void, deps: any[] = []) => {
    const containerRef = useRef<any>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(callback, containerRef);
        return () => ctx.revert();
    }, deps);

    return containerRef;
};
