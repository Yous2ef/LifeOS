/**
 * FinanceWidget V2 - Dashboard widget for quick finance overview
 *
 * Features:
 * - Compact net worth display
 * - Quick spending indicator
 * - Mini budget progress
 */

import { motion } from "framer-motion";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    ArrowRight,
    Target,
    Calendar,
} from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useFinance } from "@/hooks/useFinance";
import { GlassCard } from "./v2/layout/GlassCard";

export const FinanceWidget = () => {
    const { accounts, goals, formatCurrency, getMonthlyStats } = useFinance();

    // Calculate totals
    const netWorth = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const stats = getMonthlyStats();
    const monthlyExpenses = stats.totalExpensesThisMonth;
    const monthlyIncome = stats.totalIncomeThisMonth;
    const savings = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;

    // Active goals progress
    const activeGoals = goals.filter((g) => g.status === "active");
    const avgGoalProgress =
        activeGoals.length > 0
            ? activeGoals.reduce(
                  (sum, g) => sum + (g.currentAmount / g.targetAmount) * 100,
                  0
              ) / activeGoals.length
            : 0;

    return (
        <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/20">
                        <Wallet className="w-4 h-4 text-emerald-500" />
                    </div>
                    <h3 className="font-semibold">Finance</h3>
                </div>
                <Link
                    to="/finance"
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors">
                    View all
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="space-y-4">
                {/* Net Worth */}
                <div>
                    <div className="text-xs text-muted-foreground mb-1">
                        Net Worth
                    </div>
                    <div className="text-2xl font-bold tabular-nums">
                        {formatCurrency(netWorth)}
                    </div>
                </div>

                {/* Monthly Stats */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                            Income
                        </div>
                        <div className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            +{formatCurrency(monthlyIncome)}
                        </div>
                    </div>

                    <div className="p-3 bg-muted/30 rounded-xl">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                            <TrendingDown className="w-3 h-3 text-red-500" />
                            Expenses
                        </div>
                        <div className="font-semibold text-red-600 dark:text-red-400 tabular-nums">
                            -{formatCurrency(monthlyExpenses)}
                        </div>
                    </div>
                </div>

                {/* Savings Rate */}
                <div className="p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            This Month
                        </div>
                        <span
                            className={cn(
                                "text-sm font-semibold",
                                savings >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-red-600 dark:text-red-400"
                            )}>
                            {savings >= 0 ? "+" : ""}
                            {formatCurrency(savings)}
                        </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                            className={cn(
                                "h-full rounded-full",
                                savingsRate >= 20
                                    ? "bg-emerald-500"
                                    : savingsRate >= 0
                                    ? "bg-amber-500"
                                    : "bg-red-500"
                            )}
                            initial={{ width: 0 }}
                            animate={{
                                width: `${Math.min(
                                    Math.abs(savingsRate),
                                    100
                                )}%`,
                            }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 text-right">
                        {savingsRate.toFixed(0)}% savings rate
                    </div>
                </div>

                {/* Goals Progress */}
                {activeGoals.length > 0 && (
                    <div className="p-3 bg-muted/30 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Target className="w-3 h-3" />
                                {activeGoals.length} Active Goal
                                {activeGoals.length !== 1 ? "s" : ""}
                            </div>
                            <span className="text-sm font-semibold text-primary">
                                {avgGoalProgress.toFixed(0)}%
                            </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                                className="h-full rounded-full bg-primary"
                                initial={{ width: 0 }}
                                animate={{ width: `${avgGoalProgress}%` }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </GlassCard>
    );
};
