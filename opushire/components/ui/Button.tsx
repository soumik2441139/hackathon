import { ReactNode, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'glass' | 'rose';
    size?: 'sm' | 'md' | 'lg' | 'icon';
    loading?: boolean;
}

export const Button = ({
    children,
    className,
    variant = 'primary',
    size = 'md',
    loading,
    disabled,
    ...props
}: ButtonProps) => {
    const variants = {
        primary: "bg-gradient-to-r from-brand-violet to-brand-cyan text-brand-dark font-bold shadow-lg shadow-brand-violet/20 hover:shadow-brand-violet/40",
        secondary: "bg-brand-rose text-brand-dark hover:bg-brand-rose/90",
        ghost: "bg-transparent hover:bg-white/10 text-brand-text",
        outline: "bg-transparent border border-white/20 hover:border-white/40 text-brand-text",
        glass: "bg-brand-glass backdrop-blur-md border border-brand-glass-border hover:bg-white/10 text-brand-text",
        rose: "bg-brand-rose text-brand-dark font-bold hover:opacity-90",
    };

    const sizes = {
        sm: "px-4 py-2 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg font-bold",
        icon: "p-3",
    };

    return (
        <button
            disabled={disabled || loading}
            className={cn(
                "rounded-full transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : null}
            {children}
        </button>
    );
};
