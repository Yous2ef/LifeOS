import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
    className?: string;
    variant?: "default" | "account" | "transaction" | "goal";
}

export const SkeletonCard = ({
    className,
    variant = "default",
}: SkeletonCardProps) => {
    const shimmer = (
        <motion.div
            animate={{ x: ["0%", "200%"] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
        />
    );

    if (variant === "account") {
        return (
            <div
                className={cn(
                    "relative overflow-hidden rounded-3xl p-5 min-w-[260px] h-[160px]",
                    "bg-muted/50",
                    className
                )}>
                {shimmer}
                <div className="flex justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-muted animate-pulse" />
                    <div className="w-20 h-4 rounded-md bg-muted animate-pulse" />
                </div>
                <div className="mt-auto pt-12 space-y-2">
                    <div className="w-24 h-4 rounded-md bg-muted animate-pulse" />
                    <div className="w-32 h-6 rounded-md bg-muted animate-pulse" />
                </div>
            </div>
        );
    }

    if (variant === "transaction") {
        return (
            <div
                className={cn(
                    "relative overflow-hidden flex items-center gap-3 p-4",
                    className
                )}>
                {shimmer}
                <div className="w-10 h-10 rounded-2xl bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="w-32 h-4 rounded-md bg-muted animate-pulse" />
                    <div className="w-20 h-3 rounded-md bg-muted animate-pulse" />
                </div>
                <div className="w-16 h-5 rounded-md bg-muted animate-pulse shrink-0" />
            </div>
        );
    }

    if (variant === "goal") {
        return (
            <div
                className={cn(
                    "relative overflow-hidden rounded-3xl p-4 text-center",
                    "bg-muted/30 border border-border/50",
                    className
                )}>
                {shimmer}
                <div className="w-20 h-20 rounded-full bg-muted animate-pulse mx-auto mb-3" />
                <div className="w-24 h-4 rounded-md bg-muted animate-pulse mx-auto mb-2" />
                <div className="w-16 h-3 rounded-md bg-muted animate-pulse mx-auto" />
            </div>
        );
    }

    // Default card skeleton
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-3xl p-6",
                "bg-muted/30 border border-border/50",
                className
            )}>
            {shimmer}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
                    <div className="flex-1 space-y-2">
                        <div className="w-24 h-4 rounded-md bg-muted animate-pulse" />
                        <div className="w-16 h-3 rounded-md bg-muted animate-pulse" />
                    </div>
                </div>
                <div className="h-2 rounded-full bg-muted animate-pulse" />
                <div className="flex gap-2">
                    <div className="w-20 h-8 rounded-full bg-muted animate-pulse" />
                    <div className="w-20 h-8 rounded-full bg-muted animate-pulse" />
                </div>
            </div>
        </div>
    );
};

interface SkeletonListProps {
    count?: number;
    variant?: SkeletonCardProps["variant"];
    className?: string;
}

export const SkeletonList = ({
    count = 3,
    variant = "transaction",
    className,
}: SkeletonListProps) => {
    return (
        <div className={cn("space-y-1", className)}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} variant={variant} />
            ))}
        </div>
    );
};
