import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface NetWorthDisplayProps {
    amount: number;
    formatCurrency: (amount: number) => string;
    previousAmount?: number;
    compact?: boolean;
    className?: string;
}

export const NetWorthDisplay = ({
    amount,
    formatCurrency,
    previousAmount,
    compact = false,
    className,
}: NetWorthDisplayProps) => {
    const change = previousAmount !== undefined ? amount - previousAmount : 0;
    const changePercent =
        previousAmount && previousAmount !== 0
            ? ((amount - previousAmount) / Math.abs(previousAmount)) * 100
            : 0;

    const getTrendIcon = () => {
        if (change > 0) return <TrendingUp className="w-4 h-4" />;
        if (change < 0) return <TrendingDown className="w-4 h-4" />;
        return <Minus className="w-4 h-4" />;
    };

    const getTrendColor = () => {
        if (change > 0) return "text-emerald-500";
        if (change < 0) return "text-rose-500";
        return "text-muted-foreground";
    };

    if (compact) {
        return (
            <div className={cn("flex flex-col", className)}>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Net Worth
                </span>
                <motion.span
                    key={amount}
                    initial={{ opacity: 0.5, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-xl font-bold text-foreground tabular-nums">
                    {formatCurrency(amount)}
                </motion.span>
            </div>
        );
    }

    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center space-y-2",
                className
            )}>
            <span className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
                Total Net Worth
            </span>

            <motion.div
                key={amount}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="relative">
                <span
                    className={cn(
                        "text-4xl sm:text-5xl font-bold tracking-tight tabular-nums",
                        amount >= 0 ? "text-foreground" : "text-rose-500"
                    )}>
                    {formatCurrency(amount)}
                </span>

                {/* Glow effect for positive balance */}
                {amount > 0 && (
                    <div
                        className="absolute inset-0 blur-2xl opacity-20 -z-10"
                        style={{
                            background: `linear-gradient(135deg, #22c55e, #10b981)`,
                        }}
                    />
                )}
            </motion.div>

            {previousAmount !== undefined && change !== 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full",
                        "text-sm font-medium",
                        change > 0
                            ? "bg-emerald-500/10"
                            : change < 0
                            ? "bg-rose-500/10"
                            : "bg-muted",
                        getTrendColor()
                    )}>
                    {getTrendIcon()}
                    <span>
                        {change > 0 ? "+" : ""}
                        {formatCurrency(change)}
                    </span>
                    <span className="text-xs opacity-70">
                        ({changePercent > 0 ? "+" : ""}
                        {changePercent.toFixed(1)}%)
                    </span>
                </motion.div>
            )}
        </div>
    );
};
