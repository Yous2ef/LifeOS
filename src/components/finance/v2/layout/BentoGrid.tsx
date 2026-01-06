import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface BentoGridProps {
    children: ReactNode;
    className?: string;
    columns?: 1 | 2 | 3 | 4;
}

export const BentoGrid = ({
    children,
    className,
    columns = 3,
}: BentoGridProps) => {
    return (
        <div
            className={cn(
                "grid gap-4",
                columns === 1 && "grid-cols-1",
                columns === 2 && "grid-cols-1 md:grid-cols-2",
                columns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
                columns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
                className
            )}>
            {children}
        </div>
    );
};

interface BentoCardProps {
    children: ReactNode;
    className?: string;
    colSpan?: 1 | 2 | 3;
    rowSpan?: 1 | 2 | 3;
    variant?: "default" | "glass" | "gradient" | "glow";
    glowColor?: string;
    onClick?: () => void;
    hoverable?: boolean;
}

export const BentoCard = ({
    children,
    className,
    colSpan = 1,
    rowSpan = 1,
    variant = "default",
    glowColor,
    onClick,
    hoverable = false,
}: BentoCardProps) => {
    const baseStyles = "rounded-3xl p-6 transition-all duration-300";

    const variantStyles = {
        default: "bg-card border border-border/50",
        glass: "bg-card/60 backdrop-blur-xl border border-white/10 shadow-xl",
        gradient:
            "bg-gradient-to-br from-card via-card to-accent/20 border border-border/50",
        glow: "bg-card border border-border/50 shadow-lg",
    };

    const spanStyles = cn(
        colSpan === 2 && "md:col-span-2",
        colSpan === 3 && "md:col-span-2 lg:col-span-3",
        rowSpan === 2 && "row-span-2",
        rowSpan === 3 && "row-span-3"
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            whileHover={hoverable ? { scale: 1.02, y: -4 } : undefined}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            onClick={onClick}
            className={cn(
                baseStyles,
                variantStyles[variant],
                spanStyles,
                hoverable && "cursor-pointer hover:shadow-2xl",
                onClick && "cursor-pointer",
                className
            )}
            style={
                variant === "glow" && glowColor
                    ? { boxShadow: `0 0 60px -12px ${glowColor}40` }
                    : undefined
            }>
            {children}
        </motion.div>
    );
};
