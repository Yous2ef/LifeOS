/**
 * Budget Widget - Budget Planning Overview
 *
 * Displays:
 * - Total budget vs spent with progress bar
 * - Category budget breakdown
 * - Budget tips/advice
 * - Edit button to configure budgets
 */

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Settings2, TrendingUp, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "../layout/GlassCard";
import type { ExpenseCategory } from "@/types/modules/finance";

interface CategoryBudgetData {
    categoryId: string;
    planned: number;
    spent: number;
}

interface BudgetOverview {
    id: string;
    month: string;
    totalPlannedIncome: number;
    totalActualIncome: number;
    totalPlannedExpenses: number;
    totalActualExpenses: number;
    savingsGoal: number;
    actualSavings: number;
    categoryBudgets: CategoryBudgetData[];
    isVirtual?: boolean;
}

interface BudgetWidgetProps {
    budgetOverview?: BudgetOverview;
    categories: ExpenseCategory[];
    formatCurrency: (amount: number) => string;
    onEdit: () => void;
}

export const BudgetWidget = ({
    budgetOverview,
    categories,
    formatCurrency,
    onEdit,
}: BudgetWidgetProps) => {
    const totalBudget = budgetOverview?.totalPlannedExpenses ?? 0;
    const totalSpent = budgetOverview?.totalActualExpenses ?? 0;

    // Calculate percentage and status
    const { percentage, statusColor, statusBg } = useMemo(() => {
        if (totalBudget === 0) {
            return {
                percentage: 0,
                status: "not-set",
                statusColor: "text-muted-foreground",
                statusBg: "bg-muted",
            };
        }

        const pct = (totalSpent / totalBudget) * 100;

        if (pct >= 100) {
            return {
                percentage: pct,
                status: "exceeded",
                statusColor: "text-red-500",
                statusBg: "bg-red-500",
            };
        } else if (pct >= 80) {
            return {
                percentage: pct,
                status: "warning",
                statusColor: "text-amber-500",
                statusBg: "bg-amber-500",
            };
        } else if (pct >= 50) {
            return {
                percentage: pct,
                status: "moderate",
                statusColor: "text-blue-500",
                statusBg: "bg-blue-500",
            };
        } else {
            return {
                percentage: pct,
                status: "good",
                statusColor: "text-emerald-500",
                statusBg: "bg-emerald-500",
            };
        }
    }, [totalBudget, totalSpent]);

    // Get category budgets with details
    const categoryBudgetsWithDetails = useMemo(() => {
        if (!budgetOverview?.categoryBudgets) return [];

        return budgetOverview.categoryBudgets
            .map((cb) => {
                const category = categories.find((c) => c.id === cb.categoryId);
                if (!category) return null;
                return {
                    ...cb,
                    name: category.name,
                    icon: category.icon,
                    color: category.color,
                    percentage:
                        cb.planned > 0 ? (cb.spent / cb.planned) * 100 : 0,
                };
            })
            .filter(Boolean)
            .filter((cb) => cb!.planned > 0 || cb!.spent > 0)
            .sort((a, b) => b!.spent - a!.spent)
            .slice(0, 4) as {
            categoryId: string;
            planned: number;
            spent: number;
            name: string;
            icon: string;
            color: string;
            percentage: number;
        }[];
    }, [budgetOverview?.categoryBudgets, categories]);

    // Generate tip based on spending
    const tip = useMemo(() => {
        if (totalBudget === 0) {
            return null;
        }

        if (percentage <= 50) {
            return {
                emoji: "💚",
                text: "Great job! You're spending less than half your budget",
                type: "success",
            };
        } else if (percentage <= 80) {
            return {
                emoji: "💙",
                text: "Good progress! Keep an eye on your spending",
                type: "info",
            };
        } else if (percentage < 100) {
            return {
                emoji: "💛",
                text: "Careful! You're approaching your budget limit",
                type: "warning",
            };
        } else {
            const exceeded = totalSpent - totalBudget;
            return {
                emoji: "❤️",
                text: `You've exceeded your budget by ${formatCurrency(
                    exceeded
                )}`,
                type: "danger",
            };
        }
    }, [percentage, totalBudget, totalSpent, formatCurrency]);

    // No budget set - show setup prompt
    if (totalBudget === 0) {
        return (
            <GlassCard intensity="light" className="p-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-violet-500/20">
                            <TrendingUp className="w-4 h-4 text-violet-400" />
                        </div>
                        <span className="font-medium text-sm">
                            Budget Planning
                        </span>
                    </div>
                    <button
                        onClick={onEdit}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                        title="Edit budget settings">
                        <Settings2 className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Summary when no budget */}
                <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Total Budget</span>
                    <span className="font-semibold">{formatCurrency(0)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-muted-foreground">Spent</span>
                    <span
                        className={cn(
                            "font-semibold",
                            totalSpent > 0 && "text-red-400"
                        )}>
                        {formatCurrency(totalSpent)}
                    </span>
                </div>

                {/* Progress bar placeholder */}
                <div className="h-2 bg-muted/50 rounded-full mb-4">
                    <div className="h-full w-0 rounded-full bg-muted" />
                </div>

                {/* Exceeded message if spent without budget */}
                {totalSpent > 0 && (
                    <div className="text-xs text-red-400 mb-3">
                        {formatCurrency(totalSpent)} spent without budget
                    </div>
                )}

                {/* Empty state */}
                <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-3">
                        No budget set for any category
                    </p>
                    <motion.button
                        onClick={onEdit}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 transition-colors text-sm font-medium"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}>
                        <Plus className="w-4 h-4" />
                        Set Up Budget
                    </motion.button>
                </div>

                {/* Tip */}
                <div className="mt-4 pt-3 border-t border-white/5">
                    <p className="text-xs text-muted-foreground">
                        <span className="text-amber-400">💡 Tip:</span> Set a
                        monthly budget to track your spending
                    </p>
                </div>
            </GlassCard>
        );
    }

    return (
        <GlassCard intensity="light" className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-violet-500/20">
                        <TrendingUp className="w-4 h-4 text-violet-400" />
                    </div>
                    <span className="font-medium text-sm">Budget Planning</span>
                </div>
                <button
                    onClick={onEdit}
                    className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                    title="Edit budget settings">
                    <Settings2 className="w-4 h-4 text-muted-foreground" />
                </button>
            </div>

            {/* Summary */}
            <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-muted-foreground">Total Budget</span>
                <span className="font-semibold">
                    {formatCurrency(totalBudget)}
                </span>
            </div>
            <div className="flex items-center justify-between text-sm mb-3">
                <span className="text-muted-foreground">Spent</span>
                <span className={cn("font-semibold", statusColor)}>
                    {formatCurrency(totalSpent)}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 bg-muted/50 rounded-full mb-2 overflow-hidden">
                <motion.div
                    className={cn("h-full rounded-full", statusBg)}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                />
            </div>

            {/* Percentage / Exceeded */}
            <div className="flex items-center justify-between text-xs mb-4">
                <span className={statusColor}>
                    {percentage > 100 && (
                        <span className="text-red-400">
                            {formatCurrency(totalSpent - totalBudget)} exceeded
                        </span>
                    )}
                </span>
                <span className="text-muted-foreground">
                    {percentage.toFixed(0)}%
                </span>
            </div>

            {/* Category Budgets */}
            {categoryBudgetsWithDetails.length > 0 && (
                <div className="space-y-2 mb-4">
                    {categoryBudgetsWithDetails.map((cat) => (
                        <div key={cat.categoryId} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1.5">
                                    <span>{cat.icon}</span>
                                    <span className="text-muted-foreground truncate max-w-[100px]">
                                        {cat.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={cn(
                                            "font-medium",
                                            cat.percentage >= 100
                                                ? "text-red-400"
                                                : cat.percentage >= 80
                                                ? "text-amber-400"
                                                : "text-foreground"
                                        )}>
                                        {formatCurrency(cat.spent)}
                                    </span>
                                    <span className="text-muted-foreground">
                                        / {formatCurrency(cat.planned)}
                                    </span>
                                </div>
                            </div>
                            <div className="h-1 bg-muted/30 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full rounded-full"
                                    style={{
                                        backgroundColor:
                                            cat.percentage >= 100
                                                ? "#ef4444"
                                                : cat.percentage >= 80
                                                ? "#f59e0b"
                                                : cat.color,
                                    }}
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${Math.min(
                                            cat.percentage,
                                            100
                                        )}%`,
                                    }}
                                    transition={{ duration: 0.5, delay: 0.1 }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty categories state */}
            {categoryBudgetsWithDetails.length === 0 && (
                <div className="text-center py-2 mb-4">
                    <p className="text-xs text-muted-foreground">
                        No category budgets configured
                    </p>
                </div>
            )}

            {/* Tip */}
            {tip && (
                <div className="pt-3 border-t border-white/5">
                    <p className="text-xs text-muted-foreground">
                        <span>{tip.emoji}</span> {tip.text}
                    </p>
                </div>
            )}
        </GlassCard>
    );
};

export default BudgetWidget;
