/**
 * Budget Modal - Configure Monthly Budget
 *
 * Features:
 * - Set total monthly budget (optional)
 * - Set per-category budget limits
 * - View current spending per category
 * - Save/update budget settings
 */

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Save,
    Wallet,
    TrendingUp,
    AlertCircle,
    RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { ExpenseCategory, CategoryBudget } from "@/types/modules/finance";

interface BudgetOverview {
    id: string;
    month: string;
    totalPlannedIncome: number;
    totalActualIncome: number;
    totalPlannedExpenses: number;
    totalActualExpenses: number;
    savingsGoal: number;
    actualSavings: number;
    categoryBudgets: CategoryBudget[];
    isVirtual?: boolean;
}

interface BudgetModalProps {
    isOpen: boolean;
    onClose: () => void;
    budgetOverview?: BudgetOverview;
    categories: ExpenseCategory[];
    formatCurrency: (amount: number) => string;
    onSave: (
        categoryBudgets: { categoryId: string; planned: number }[]
    ) => void;
    currentMonth: string;
}

export const BudgetModal = ({
    isOpen,
    onClose,
    budgetOverview,
    categories,
    formatCurrency,
    onSave,
    currentMonth,
}: BudgetModalProps) => {
    // State for category budgets
    const [categoryBudgets, setCategoryBudgets] = useState<
        Record<string, number>
    >({});
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize from existing data
    useEffect(() => {
        if (isOpen) {
            const initial: Record<string, number> = {};
            categories.forEach((cat) => {
                const existing = budgetOverview?.categoryBudgets?.find(
                    (cb) => cb.categoryId === cat.id
                );
                initial[cat.id] = existing?.planned ?? (cat.monthlyBudget || 0);
            });
            setCategoryBudgets(initial);
            setHasChanges(false);
        }
    }, [isOpen, categories, budgetOverview]);

    // Calculate totals
    const totals = useMemo(() => {
        const totalPlanned = Object.values(categoryBudgets).reduce(
            (sum, val) => sum + val,
            0
        );
        const totalSpent = budgetOverview?.totalActualExpenses ?? 0;
        return { totalPlanned, totalSpent };
    }, [categoryBudgets, budgetOverview?.totalActualExpenses]);

    // Handle budget change for category
    const handleBudgetChange = (categoryId: string, value: string) => {
        const numValue = parseFloat(value) || 0;
        setCategoryBudgets((prev) => ({
            ...prev,
            [categoryId]: numValue,
        }));
        setHasChanges(true);
    };

    // Reset all budgets
    const handleReset = () => {
        const reset: Record<string, number> = {};
        categories.forEach((cat) => {
            reset[cat.id] = 0;
        });
        setCategoryBudgets(reset);
        setHasChanges(true);
    };

    // Save budgets
    const handleSave = () => {
        const budgetData = Object.entries(categoryBudgets).map(
            ([categoryId, planned]) => ({
                categoryId,
                planned,
            })
        );
        onSave(budgetData);
        onClose();
    };

    // Format month display
    const monthDisplay = useMemo(() => {
        const [year, month] = currentMonth.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
        });
    }, [currentMonth]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}>
                {/* Backdrop */}
                <motion.div
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                />

                {/* Modal */}
                <motion.div
                    className="relative w-full max-w-lg max-h-[85vh] overflow-hidden rounded-2xl bg-background border border-white/10 shadow-2xl"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{
                        type: "spring",
                        damping: 25,
                        stiffness: 300,
                    }}>
                    {/* Header */}
                    <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-background/95 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-violet-500/20">
                                <Wallet className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <h2 className="font-semibold text-lg">
                                    Budget Planning
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    {monthDisplay}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                            title="Close budget modal">
                            <X className="w-5 h-5 text-muted-foreground" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="p-4 overflow-y-auto max-h-[calc(85vh-140px)]">
                        {/* Summary */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-violet-400" />
                                    <span className="text-xs text-muted-foreground">
                                        Total Budget
                                    </span>
                                </div>
                                <p className="text-lg font-bold text-violet-400">
                                    {formatCurrency(totals.totalPlanned)}
                                </p>
                            </div>
                            <div
                                className={cn(
                                    "p-3 rounded-xl border",
                                    totals.totalSpent > totals.totalPlanned &&
                                        totals.totalPlanned > 0
                                        ? "bg-red-500/10 border-red-500/20"
                                        : "bg-emerald-500/10 border-emerald-500/20"
                                )}>
                                <div className="flex items-center gap-2 mb-1">
                                    <Wallet className="w-4 h-4 text-emerald-400" />
                                    <span className="text-xs text-muted-foreground">
                                        Spent
                                    </span>
                                </div>
                                <p
                                    className={cn(
                                        "text-lg font-bold",
                                        totals.totalSpent >
                                            totals.totalPlanned &&
                                            totals.totalPlanned > 0
                                            ? "text-red-400"
                                            : "text-emerald-400"
                                    )}>
                                    {formatCurrency(totals.totalSpent)}
                                </p>
                            </div>
                        </div>

                        {/* Category Budgets */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-medium text-muted-foreground">
                                    Category Budgets
                                </h3>
                                <button
                                    onClick={handleReset}
                                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                    <RotateCcw className="w-3 h-3" />
                                    Reset All
                                </button>
                            </div>

                            {categories.map((category) => {
                                const spent =
                                    budgetOverview?.categoryBudgets?.find(
                                        (cb) => cb.categoryId === category.id
                                    )?.spent || 0;
                                const planned =
                                    categoryBudgets[category.id] || 0;
                                const percentage =
                                    planned > 0 ? (spent / planned) * 100 : 0;
                                const isOverBudget =
                                    spent > planned && planned > 0;

                                return (
                                    <motion.div
                                        key={category.id}
                                        className="p-3 rounded-xl bg-white/5 border border-white/5"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">
                                                    {category.icon}
                                                </span>
                                                <span className="font-medium text-sm">
                                                    {category.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={cn(
                                                        "text-xs",
                                                        isOverBudget
                                                            ? "text-red-400"
                                                            : "text-muted-foreground"
                                                    )}>
                                                    Spent:{" "}
                                                    {formatCurrency(spent)}
                                                </span>
                                                {isOverBudget && (
                                                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="relative flex-1">
                                                <input
                                                    type="number"
                                                    value={
                                                        categoryBudgets[
                                                            category.id
                                                        ] || ""
                                                    }
                                                    onChange={(e) =>
                                                        handleBudgetChange(
                                                            category.id,
                                                            e.target.value
                                                        )
                                                    }
                                                    placeholder="0"
                                                    min="0"
                                                    step="10"
                                                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none text-sm"
                                                />
                                            </div>
                                            {planned > 0 && (
                                                <span
                                                    className={cn(
                                                        "text-xs font-medium min-w-[50px] text-right",
                                                        percentage >= 100
                                                            ? "text-red-400"
                                                            : percentage >= 80
                                                            ? "text-amber-400"
                                                            : "text-emerald-400"
                                                    )}>
                                                    {percentage.toFixed(0)}%
                                                </span>
                                            )}
                                        </div>

                                        {/* Mini progress bar */}
                                        {planned > 0 && (
                                            <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all",
                                                        percentage >= 100
                                                            ? "bg-red-500"
                                                            : percentage >= 80
                                                            ? "bg-amber-500"
                                                            : "bg-emerald-500"
                                                    )}
                                                    style={{
                                                        width: `${Math.min(
                                                            percentage,
                                                            100
                                                        )}%`,
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="sticky bottom-0 flex items-center justify-between gap-3 p-4 border-t border-white/10 bg-background/95 backdrop-blur-sm">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="flex-1 bg-violet-600 hover:bg-violet-700"
                            disabled={!hasChanges}>
                            <Save className="w-4 h-4 mr-2" />
                            Save Budget
                        </Button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default BudgetModal;
