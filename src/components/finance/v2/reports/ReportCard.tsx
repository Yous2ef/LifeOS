import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { GlassCard } from "../layout/GlassCard";
import { itemVariants } from "./chartTheme";

interface ReportCardProps {
    icon: ReactNode;
    /** Tailwind gradient stops for the icon tile, e.g. "from-violet-500 to-purple-500" */
    gradient: string;
    title: string;
    subtitle?: ReactNode;
    action?: ReactNode;
    className?: string;
    children: ReactNode;
}

/** Titled card every report section sits in */
export const ReportCard = ({
    icon,
    gradient,
    title,
    subtitle,
    action,
    className,
    children,
}: ReportCardProps) => (
    <motion.div variants={itemVariants} className={className}>
        <GlassCard intensity="light" className="p-6 h-full">
            <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                    <div
                        className={cn(
                            "p-2.5 rounded-xl bg-gradient-to-br shadow-lg text-white shrink-0",
                            gradient,
                        )}>
                        {icon}
                    </div>
                    <div className="min-w-0">
                        <h3 className="font-bold text-lg">{title}</h3>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                {action}
            </div>
            {children}
        </GlassCard>
    </motion.div>
);

interface StatTileProps {
    label: string;
    value: string;
    hint?: ReactNode;
    accent?: string;
}

export const StatTile = ({ label, value, hint, accent }: StatTileProps) => (
    <div className="p-4 rounded-2xl bg-muted/40 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-xl font-bold tabular-nums truncate", accent)}>
            {value}
        </p>
        {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
);

interface ChoiceChipsProps<T extends string> {
    value: T;
    options: { value: T; label: string }[];
    onChange: (value: T) => void;
    className?: string;
}

/** Small segmented control used for tabs and scope switches */
export const ChoiceChips = <T extends string>({
    value,
    options,
    onChange,
    className,
}: ChoiceChipsProps<T>) => (
    <div
        role="tablist"
        className={cn(
            "flex gap-1 p-1.5 bg-muted/50 rounded-2xl shadow-inner overflow-x-auto",
            className,
        )}>
        {options.map((option) => (
            <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={value === option.value}
                onClick={() => onChange(option.value)}
                className={cn(
                    "px-3 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all whitespace-nowrap",
                    value === option.value
                        ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground",
                )}>
                {option.label}
            </button>
        ))}
    </div>
);
