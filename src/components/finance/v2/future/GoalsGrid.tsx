import { motion } from "framer-motion";
import { Plus, Target, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { GoalRing } from "./GoalRing";
import { GlassCard } from "../layout/GlassCard";
import type { FinancialGoal } from "@/types/modules/finance";

interface GoalsGridProps {
    goals: FinancialGoal[];
    formatCurrency: (amount: number) => string;
    onGoalClick?: (goal: FinancialGoal) => void;
    onContribute?: (goalId: string) => void;
    onAddGoal?: () => void;
    className?: string;
    /** Maximum number of goals to display. When exceeded, shows "See All" instead of "Add" */
    maxGoals?: number;
}

export const GoalsGrid = ({
    goals,
    formatCurrency,
    onGoalClick,
    onContribute,
    onAddGoal,
    className,
    maxGoals,
}: GoalsGridProps) => {
    const activeGoals = goals.filter((g) => g.status === "active");
    const completedGoals = goals.filter((g) => g.status === "completed");

    // Limit displayed goals if maxGoals is set
    const displayedGoals = maxGoals
        ? activeGoals.slice(0, maxGoals)
        : activeGoals;
    const hasMoreGoals = maxGoals && activeGoals.length > maxGoals;

    // Calculate overall progress
    const totalTarget = activeGoals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalCurrent = activeGoals.reduce(
        (sum, g) => sum + g.currentAmount,
        0
    );
    // const overallProgress =
    //     totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

    if (goals.length === 0) {
        return (
            <GlassCard
                intensity="light"
                padding="lg"
                className={cn("text-center", className)}>
                <div className="py-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                        <Target className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                        Set Your First Goal
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Start saving towards something meaningful
                    </p>
                    {onAddGoal && (
                        <Button
                            onClick={onAddGoal}
                            className="rounded-full gap-2">
                            <Plus className="w-4 h-4" />
                            Create Goal
                        </Button>
                    )}
                </div>
            </GlassCard>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Compact Header - single line with all key info */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Goals</h3>
                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                        {activeGoals.length} active
                    </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    {totalTarget > 0 && (
                        <>
                            <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground text-xs">
                                    Progress:
                                </span>
                                <span className="font-semibold text-emerald-500 tabular-nums">
                                    {formatCurrency(totalCurrent)}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    /
                                </span>
                                <span className="font-medium tabular-nums">
                                    {formatCurrency(totalTarget)}
                                </span>
                            </div>
                        </>
                    )}
                    {/* Show Add button only if no maxGoals limit or we have room for more */}
                    {onAddGoal && !hasMoreGoals && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onAddGoal}
                            className="rounded-full gap-1 h-7 px-2">
                            <Plus className="w-4 h-4" />
                            Add
                        </Button>
                    )}
                </div>
            </div>

            {/* Goals Grid */}
            <div className="grid grid-cols-2 gap-3">
                {displayedGoals.map((goal, index) => (
                    <motion.div
                        key={goal.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.05 }}>
                        <GoalRing
                            goal={goal}
                            formatCurrency={formatCurrency}
                            onClick={() => onGoalClick?.(goal)}
                            onContribute={() => onContribute?.(goal.id)}
                            size="sm"
                        />
                    </motion.div>
                ))}

                {/* See All Card - when there are more goals than maxGoals */}
                {hasMoreGoals && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: displayedGoals.length * 0.05 }}>
                        <Link
                            to="/finance/goals"
                            className={cn(
                                "flex flex-col items-center justify-center p-4 rounded-3xl",
                                "border-2 border-dashed border-emerald-500/30",
                                "text-emerald-500",
                                "hover:border-emerald-500/50 hover:bg-emerald-500/5",
                                "transition-all duration-200",
                                "min-h-[180px]"
                            )}>
                            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2">
                                <ChevronRight className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-medium">See All</span>
                            <span className="text-xs text-emerald-500/70">
                                {activeGoals.length} goals
                            </span>
                        </Link>
                    </motion.div>
                )}

                {/* Add Goal Card - only when not exceeding maxGoals */}
                {onAddGoal && !hasMoreGoals && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: displayedGoals.length * 0.05 }}
                        onClick={onAddGoal}
                        className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-3xl",
                            "border-2 border-dashed border-muted-foreground/20",
                            "text-muted-foreground",
                            "hover:border-primary/30 hover:text-primary hover:bg-primary/5",
                            "transition-all duration-200",
                            "min-h-[180px]"
                        )}>
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                            <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium">New Goal</span>
                    </motion.button>
                )}
            </div>

            {/* Completed Goals (collapsed) */}
            {completedGoals.length > 0 && (
                <div className="pt-2">
                    <details className="group">
                        <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-2">
                            <span>
                                🏆 {completedGoals.length} completed goal
                                {completedGoals.length !== 1 ? "s" : ""}
                            </span>
                            <span className="text-xs group-open:rotate-90 transition-transform">
                                ▶
                            </span>
                        </summary>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                            {completedGoals.map((goal) => (
                                <GoalRing
                                    key={goal.id}
                                    goal={goal}
                                    formatCurrency={formatCurrency}
                                    onClick={() => onGoalClick?.(goal)}
                                    size="sm"
                                />
                            ))}
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
};
