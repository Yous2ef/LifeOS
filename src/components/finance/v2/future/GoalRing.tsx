import { motion } from "framer-motion";
import { Target, Plus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { FinancialGoal } from "@/types/modules/finance";

interface GoalRingProps {
    goal: FinancialGoal;
    formatCurrency: (amount: number) => string;
    onClick?: () => void;
    onContribute?: () => void;
    size?: "sm" | "md" | "lg";
    className?: string;
}

export const GoalRing = ({
    goal,
    formatCurrency,
    onClick,
    onContribute,
    size = "md",
    className,
}: GoalRingProps) => {
    const progress = Math.min(
        (goal.currentAmount / goal.targetAmount) * 100,
        100
    );
    const isComplete = progress >= 100;

    const sizeConfig = {
        sm: { ring: 80, stroke: 6, iconSize: 20 },
        md: { ring: 120, stroke: 8, iconSize: 28 },
        lg: { ring: 160, stroke: 10, iconSize: 36 },
    };

    const { ring, stroke, iconSize } = sizeConfig[size];
    const radius = (ring - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // Get color based on goal category or custom color
    const getGoalColor = () => {
        if (goal.color) return goal.color;
        switch (goal.category) {
            case "emergency-fund":
                return "#ef4444";
            case "savings":
                return "#22c55e";
            case "investment":
                return "#8b5cf6";
            case "purchase":
                return "#f59e0b";
            case "travel":
                return "#06b6d4";
            case "education":
                return "#3b82f6";
            default:
                return "#6366f1";
        }
    };

    const color = getGoalColor();

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={cn(
                "relative flex flex-col items-center p-4 rounded-3xl",
                "bg-card/50 border border-border/50",
                "cursor-pointer transition-all duration-200",
                "hover:shadow-lg hover:border-primary/30",
                isComplete &&
                    "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5",
                className
            )}
            style={
                isComplete
                    ? { boxShadow: "0 0 40px rgba(34, 197, 94, 0.2)" }
                    : undefined
            }>
            {/* Completion Badge */}
            {isComplete && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                    <Sparkles className="w-4 h-4 text-white" />
                </motion.div>
            )}

            {/* Progress Ring */}
            <div className="relative" style={{ width: ring, height: ring }}>
                <svg
                    className="transform -rotate-90"
                    width={ring}
                    height={ring}>
                    {/* Background Circle */}
                    <circle
                        cx={ring / 2}
                        cy={ring / 2}
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={stroke}
                        className="text-muted/30"
                    />
                    {/* Progress Circle */}
                    <motion.circle
                        cx={ring / 2}
                        cy={ring / 2}
                        r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        style={{
                            filter: `drop-shadow(0 0 8px ${color}60)`,
                        }}
                    />
                </svg>

                {/* Center Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {goal.icon ? (
                        <span style={{ fontSize: iconSize }}>{goal.icon}</span>
                    ) : (
                        <Target
                            className="text-muted-foreground"
                            style={{ width: iconSize, height: iconSize }}
                        />
                    )}
                    <motion.span
                        key={progress}
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="text-lg font-bold tabular-nums mt-1"
                        style={{ color }}>
                        {progress.toFixed(0)}%
                    </motion.span>
                </div>
            </div>

            {/* Goal Info */}
            <div className="mt-3 text-center space-y-1">
                <h4 className="font-semibold text-sm truncate max-w-[120px]">
                    {goal.title}
                </h4>
                <p className="text-xs text-muted-foreground tabular-nums">
                    {formatCurrency(goal.currentAmount)} /{" "}
                    {formatCurrency(goal.targetAmount)}
                </p>
            </div>

            {/* Contribute Button */}
            {!isComplete && onContribute && (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                        e.stopPropagation();
                        onContribute();
                    }}
                    className="mt-2 h-8 px-3 rounded-full text-xs gap-1"
                    style={{ color }}>
                    <Plus className="w-3 h-3" />
                    Add
                </Button>
            )}

            {/* Deadline indicator */}
            {goal.deadline && !isComplete && (
                <div className="mt-2 text-xs text-muted-foreground">
                    {new Date(goal.deadline) > new Date() ? (
                        <span>
                            {Math.ceil(
                                (new Date(goal.deadline).getTime() -
                                    Date.now()) /
                                    (1000 * 60 * 60 * 24)
                            )}{" "}
                            days left
                        </span>
                    ) : (
                        <span className="text-rose-500">Overdue</span>
                    )}
                </div>
            )}
        </motion.div>
    );
};
