import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import type { ReactNode } from "react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
    children: ReactNode;
    className?: string;
    intensity?: "light" | "medium" | "heavy";
    border?: boolean;
    glow?: boolean;
    glowColor?: string;
    padding?: "none" | "sm" | "md" | "lg";
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
    (
        {
            children,
            className,
            intensity = "medium",
            border = true,
            glow = false,
            glowColor = "var(--accent-color)",
            padding = "md",
            ...motionProps
        },
        ref
    ) => {
        const intensityStyles = {
            light: "bg-card/40 backdrop-blur-sm",
            medium: "bg-card/60 backdrop-blur-xl",
            heavy: "bg-card/80 backdrop-blur-2xl",
        };

        const paddingStyles = {
            none: "",
            sm: "p-3",
            md: "p-5",
            lg: "p-8",
        };

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={cn(
                    "rounded-3xl",
                    intensityStyles[intensity],
                    paddingStyles[padding],
                    border && "border border-white/10",
                    glow && "shadow-xl",
                    className
                )}
                style={
                    glow
                        ? { boxShadow: `0 8px 32px -8px ${glowColor}30` }
                        : undefined
                }
                {...motionProps}>
                {children}
            </motion.div>
        );
    }
);

GlassCard.displayName = "GlassCard";
