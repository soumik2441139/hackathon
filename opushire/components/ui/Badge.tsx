import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'violet' | 'cyan' | 'rose' | 'outline';
}

export const Badge = ({ children, className, variant = 'default' }: BadgeProps) => {
    const variants = {
        default: "bg-white/10 text-brand-text/80",
        violet: "bg-brand-violet/20 text-brand-violet border border-brand-violet/30",
        cyan: "bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/30",
        rose: "bg-brand-rose/20 text-brand-rose border border-brand-rose/30",
        outline: "bg-transparent border border-white/20 text-brand-text/70",
    };

    return (
        <span className={cn(
            "px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm",
            variants[variant],
            className
        )}>
            {children}
        </span>
    );
};
