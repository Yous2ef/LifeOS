/**
 * Reports Modal - Financial Analytics Summary
 *
 * Shows spending breakdown by category, income sources,
 * and trends for the selected date range.
 */

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    TrendingUp,
    TrendingDown,
    PieChart,
    BarChart3,
    ArrowUpRight,
    ArrowDownLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "../layout/GlassCard";
import type { Income, Expense, ExpenseCategory } from "@/types/modules/finance";
import type { DateRange } from "../controls/SmartDatePicker";

interface ReportsModalProps {
    isOpen: boolean;
    onClose: () => void;
    incomes: Income[];
    expenses: Expense[];
    categories: ExpenseCategory[];
    dateRange: DateRange;
    formatCurrency: (amount: number) => string;
}

interface CategorySpendingData {
    category: ExpenseCategory;
    amount: number;
    count: number;
    percentage: number;
}

type ModalFilterMode = "preset" | "from-only" | "from-to";

export const ReportsModal = ({
    isOpen,
    onClose,
    incomes,
    expenses,
    categories,
    dateRange,
    formatCurrency,
}: ReportsModalProps) => {
    const [filterMode, setFilterMode] = useState<ModalFilterMode>("preset");
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
        null,
    );

    const effectiveRange = useMemo(() => {
        if (filterMode === "preset") {
            return dateRange;
        }

        const start = fromDate ? new Date(fromDate) : new Date(2020, 0, 1);
        start.setHours(0, 0, 0, 0);

        const end =
            filterMode === "from-to" && toDate ? new Date(toDate) : new Date();
        end.setHours(23, 59, 59, 999);

        if (end < start) {
            return {
                ...dateRange,
                start,
                end: new Date(start),
                label: "Custom",
            };
        }

        return {
            ...dateRange,
            start,
            end,
            label: filterMode === "from-only" ? "From date" : "Custom range",
        };
    }, [dateRange, filterMode, fromDate, toDate]);

    // Calculate filtered data
    const data = useMemo(() => {
        const filteredIncomes = incomes.filter((i) => {
            const date = new Date(i.actualDate || i.createdAt);
            return date >= effectiveRange.start && date <= effectiveRange.end;
        });

        const filteredExpenses = expenses.filter((e) => {
            const date = new Date(e.date);
            return date >= effectiveRange.start && date <= effectiveRange.end;
        });

        const totalIncome = filteredIncomes.reduce(
            (sum, i) => sum + i.amount,
            0,
        );
        const totalExpense = filteredExpenses.reduce(
            (sum, e) => sum + e.amount,
            0,
        );

        // Calculate spending by category
        const categoryMap = new Map<
            string,
            { amount: number; count: number }
        >();
        filteredExpenses.forEach((e) => {
            const current = categoryMap.get(e.categoryId) || {
                amount: 0,
                count: 0,
            };
            categoryMap.set(e.categoryId, {
                amount: current.amount + e.amount,
                count: current.count + 1,
            });
        });

        const categorySpending: CategorySpendingData[] = categories
            .map((cat) => {
                const spending = categoryMap.get(cat.id) || {
                    amount: 0,
                    count: 0,
                };
                return {
                    category: cat,
                    amount: spending.amount,
                    count: spending.count,
                    percentage:
                        totalExpense > 0
                            ? (spending.amount / totalExpense) * 100
                            : 0,
                };
            })
            .sort((a, b) => b.amount - a.amount);

        // Calculate income by type
        const incomeByType = new Map<string, number>();
        filteredIncomes.forEach((i) => {
            const current = incomeByType.get(i.type) || 0;
            incomeByType.set(i.type, current + i.amount);
        });

        const incomeSources = Array.from(incomeByType.entries())
            .map(([type, amount]) => ({
                type,
                amount,
                percentage: totalIncome > 0 ? (amount / totalIncome) * 100 : 0,
            }))
            .sort((a, b) => b.amount - a.amount);

        return {
            totalIncome,
            totalExpense,
            netFlow: totalIncome - totalExpense,
            categorySpending,
            incomeSources,
            transactionCount: filteredIncomes.length + filteredExpenses.length,
            avgDailyExpense:
                filteredExpenses.length > 0
                    ? totalExpense /
                      Math.max(
                          1,
                          Math.ceil(
                              (effectiveRange.end.getTime() -
                                  effectiveRange.start.getTime()) /
                                  (1000 * 60 * 60 * 24),
                          ),
                      )
                    : 0,
            filteredExpenses,
        };
    }, [incomes, expenses, categories, effectiveRange]);

    const selectedCategoryTransactions = useMemo(() => {
        if (!selectedCategoryId) return [];
        return data.filteredExpenses
            .filter((expense) => expense.categoryId === selectedCategoryId)
            .sort(
                (a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime(),
            );
    }, [data.filteredExpenses, selectedCategoryId]);

    const formatDisplayDate = (dateStr: string) => {
        const date = new Date(dateStr);
        if (Number.isNaN(date.getTime())) return dateStr;
        return new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(date);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-background rounded-3xl shadow-2xl border border-border/50">
                    {/* Header */}
                    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl px-6 py-4 border-b border-border/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-primary/10">
                                <BarChart3 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Financial Report
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {effectiveRange.label}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="rounded-full">
                            <X className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant={
                                        filterMode === "preset"
                                            ? "default"
                                            : "outline"
                                    }
                                    onClick={() => setFilterMode("preset")}
                                    className="rounded-xl">
                                    Preset
                                </Button>
                                <Button
                                    size="sm"
                                    variant={
                                        filterMode === "from-only"
                                            ? "default"
                                            : "outline"
                                    }
                                    onClick={() => setFilterMode("from-only")}
                                    className="rounded-xl">
                                    From
                                </Button>
                                <Button
                                    size="sm"
                                    variant={
                                        filterMode === "from-to"
                                            ? "default"
                                            : "outline"
                                    }
                                    onClick={() => setFilterMode("from-to")}
                                    className="rounded-xl">
                                    From To
                                </Button>
                            </div>

                            {filterMode !== "preset" && (
                                <div className="flex gap-2">
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) =>
                                            setFromDate(e.target.value)
                                        }
                                        className="h-9 px-3 rounded-lg bg-background border border-border text-sm flex-1"
                                    />
                                    {filterMode === "from-to" && (
                                        <input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) =>
                                                setToDate(e.target.value)
                                            }
                                            className="h-9 px-3 rounded-lg bg-background border border-border text-sm flex-1"
                                        />
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 gap-3">
                            <GlassCard
                                intensity="light"
                                padding="md"
                                className="space-y-1">
                                <div className="flex items-center gap-2 text-emerald-500">
                                    <ArrowUpRight className="w-4 h-4" />
                                    <span className="text-xs font-medium">
                                        Total Income
                                    </span>
                                </div>
                                <p className="text-xl font-bold tabular-nums">
                                    {formatCurrency(data.totalIncome)}
                                </p>
                            </GlassCard>

                            <GlassCard
                                intensity="light"
                                padding="md"
                                className="space-y-1">
                                <div className="flex items-center gap-2 text-red-500">
                                    <ArrowDownLeft className="w-4 h-4" />
                                    <span className="text-xs font-medium">
                                        Total Expenses
                                    </span>
                                </div>
                                <p className="text-xl font-bold tabular-nums">
                                    {formatCurrency(data.totalExpense)}
                                </p>
                            </GlassCard>

                            <GlassCard
                                intensity="light"
                                padding="md"
                                className="space-y-1">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <PieChart className="w-4 h-4" />
                                    <span className="text-xs font-medium">
                                        Transactions
                                    </span>
                                </div>
                                <p className="text-xl font-bold tabular-nums">
                                    {data.transactionCount}
                                </p>
                            </GlassCard>

                            <GlassCard
                                intensity="light"
                                padding="md"
                                className={cn(
                                    "space-y-1",
                                    data.netFlow >= 0
                                        ? "ring-1 ring-emerald-500/20"
                                        : "ring-1 ring-red-500/20",
                                )}>
                                <div
                                    className={cn(
                                        "flex items-center gap-2",
                                        data.netFlow >= 0
                                            ? "text-emerald-500"
                                            : "text-red-500",
                                    )}>
                                    {data.netFlow >= 0 ? (
                                        <TrendingUp className="w-4 h-4" />
                                    ) : (
                                        <TrendingDown className="w-4 h-4" />
                                    )}
                                    <span className="text-xs font-medium">
                                        Net Flow
                                    </span>
                                </div>
                                <p className="text-xl font-bold tabular-nums">
                                    {data.netFlow >= 0 ? "+" : ""}
                                    {formatCurrency(data.netFlow)}
                                </p>
                            </GlassCard>
                        </div>

                        {/* Daily Average */}
                        <GlassCard intensity="light" padding="md">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Average Daily Spending
                                    </p>
                                    <p className="text-lg font-semibold tabular-nums">
                                        {formatCurrency(data.avgDailyExpense)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">
                                        Projected Monthly
                                    </p>
                                    <p className="text-lg font-semibold tabular-nums text-muted-foreground">
                                        {formatCurrency(
                                            data.avgDailyExpense * 30,
                                        )}
                                    </p>
                                </div>
                            </div>
                        </GlassCard>

                        {/* Spending by Category */}
                        {data.categorySpending.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-muted-foreground">
                                    Spending by Category
                                </h3>
                                <div className="space-y-2">
                                    {data.categorySpending.map(
                                        (item, index) => (
                                            <motion.div
                                                key={item.category.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{
                                                    delay: index * 0.05,
                                                }}>
                                                <GlassCard
                                                    intensity="light"
                                                    padding="sm"
                                                    className={cn(
                                                        "cursor-pointer transition-all",
                                                        selectedCategoryId ===
                                                            item.category.id &&
                                                            "ring-1 ring-primary/40",
                                                    )}
                                                    onClick={() =>
                                                        setSelectedCategoryId(
                                                            (prev) =>
                                                                prev ===
                                                                item.category.id
                                                                    ? null
                                                                    : item
                                                                          .category
                                                                          .id,
                                                        )
                                                    }>
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                                            style={{
                                                                backgroundColor: `${item.category.color}20`,
                                                            }}>
                                                            {item.category.icon}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="font-medium truncate">
                                                                    {
                                                                        item
                                                                            .category
                                                                            .name
                                                                    }
                                                                </span>
                                                                <span className="font-bold tabular-nums">
                                                                    {formatCurrency(
                                                                        item.amount,
                                                                    )}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                                                                    <motion.div
                                                                        initial={{
                                                                            width: 0,
                                                                        }}
                                                                        animate={{
                                                                            width: `${item.percentage}%`,
                                                                        }}
                                                                        transition={{
                                                                            delay:
                                                                                index *
                                                                                    0.05 +
                                                                                0.2,
                                                                            duration: 0.5,
                                                                        }}
                                                                        className="h-full rounded-full"
                                                                        style={{
                                                                            backgroundColor:
                                                                                item
                                                                                    .category
                                                                                    .color,
                                                                        }}
                                                                    />
                                                                </div>
                                                                <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
                                                                    {item.percentage.toFixed(
                                                                        1,
                                                                    )}
                                                                    %
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {selectedCategoryId ===
                                                        item.category.id && (
                                                        <div className="mt-3 pt-3 border-t border-border space-y-2">
                                                            <p className="text-xs text-muted-foreground">
                                                                Transactions
                                                            </p>
                                                            {selectedCategoryTransactions.length ===
                                                            0 ? (
                                                                <p className="text-xs text-muted-foreground">
                                                                    No
                                                                    transactions
                                                                    in this
                                                                    period.
                                                                </p>
                                                            ) : (
                                                                <div className="space-y-1.5 max-h-44 overflow-y-auto">
                                                                    {selectedCategoryTransactions.map(
                                                                        (
                                                                            tx,
                                                                        ) => (
                                                                            <div
                                                                                key={
                                                                                    tx.id
                                                                                }
                                                                                className="flex items-center justify-between rounded-lg bg-muted/40 px-2 py-1.5">
                                                                                <div className="min-w-0">
                                                                                    <p className="text-xs font-medium truncate">
                                                                                        {
                                                                                            tx.title
                                                                                        }
                                                                                    </p>
                                                                                    <p className="text-[10px] text-muted-foreground">
                                                                                        <span dir="ltr">
                                                                                            {formatDisplayDate(
                                                                                                tx.date,
                                                                                            )}
                                                                                        </span>
                                                                                    </p>
                                                                                </div>
                                                                                <p className="text-xs font-semibold tabular-nums">
                                                                                    {formatCurrency(
                                                                                        tx.amount,
                                                                                    )}
                                                                                </p>
                                                                            </div>
                                                                        ),
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </GlassCard>
                                            </motion.div>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Income Sources */}
                        {data.incomeSources.length > 0 && (
                            <div className="space-y-3">
                                <h3 className="text-sm font-medium text-muted-foreground">
                                    Income Sources
                                </h3>
                                <div className="space-y-2">
                                    {data.incomeSources.map((item, index) => (
                                        <motion.div
                                            key={item.type}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{
                                                delay: index * 0.05,
                                            }}>
                                            <GlassCard
                                                intensity="light"
                                                padding="sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10">
                                                        <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-medium capitalize">
                                                                {item.type.replace(
                                                                    /-/g,
                                                                    " ",
                                                                )}
                                                            </span>
                                                            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                                                                {formatCurrency(
                                                                    item.amount,
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                                                                <motion.div
                                                                    initial={{
                                                                        width: 0,
                                                                    }}
                                                                    animate={{
                                                                        width: `${item.percentage}%`,
                                                                    }}
                                                                    transition={{
                                                                        delay:
                                                                            index *
                                                                                0.05 +
                                                                            0.2,
                                                                        duration: 0.5,
                                                                    }}
                                                                    className="h-full rounded-full bg-emerald-500"
                                                                />
                                                            </div>
                                                            <span className="text-xs text-muted-foreground tabular-nums w-12 text-right">
                                                                {item.percentage.toFixed(
                                                                    1,
                                                                )}
                                                                %
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </GlassCard>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {data.transactionCount === 0 && (
                            <div className="text-center py-12">
                                <div className="w-16 h-16 rounded-full bg-muted/50 mx-auto mb-4 flex items-center justify-center">
                                    <BarChart3 className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium mb-1">
                                    No Data Available
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    No transactions found for{" "}
                                    {effectiveRange.label.toLowerCase()}
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};
