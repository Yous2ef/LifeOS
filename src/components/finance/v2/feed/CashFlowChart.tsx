import { useMemo } from "react";
import { motion } from "framer-motion";
import {
    TrendingUp,
    TrendingDown,
    ArrowRight,
    X,
    ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GlassCard } from "../layout/GlassCard";
import type {
    Income,
    Expense,
    Account,
    AccountTransfer,
} from "@/types/modules/finance";
import type { DateRange } from "../controls/SmartDatePicker";

interface CashFlowChartProps {
    incomes: Income[];
    expenses: Expense[];
    transfers: AccountTransfer[];
    dateRange: DateRange;
    formatCurrency: (amount: number) => string;
    className?: string;
    selectedAccount?: Account | null;
    onClearAccountFilter?: () => void;
    onTransfer?: () => void;
}

export const CashFlowChart = ({
    incomes,
    expenses,
    transfers,
    dateRange,
    formatCurrency,
    className,
    selectedAccount,
    onClearAccountFilter,
    onTransfer,
}: CashFlowChartProps) => {
    const data = useMemo(() => {
        // Filter by date range
        let filteredIncomes = incomes.filter((i) => {
            const date = new Date(i.actualDate || i.createdAt);
            return date >= dateRange.start && date <= dateRange.end;
        });

        let filteredExpenses = expenses.filter((e) => {
            const date = new Date(e.date);
            return date >= dateRange.start && date <= dateRange.end;
        });

        let filteredTransfers = transfers.filter((t) => {
            const date = new Date(t.date);
            return date >= dateRange.start && date <= dateRange.end;
        });

        // Filter by selected account if provided
        if (selectedAccount) {
            filteredIncomes = filteredIncomes.filter(
                (i) => i.accountId === selectedAccount.id
            );
            filteredExpenses = filteredExpenses.filter(
                (e) => e.accountId === selectedAccount.id
            );
            // For transfers, show if account is source or destination
            filteredTransfers = filteredTransfers.filter(
                (t) =>
                    t.fromAccountId === selectedAccount.id ||
                    t.toAccountId === selectedAccount.id
            );
        }

        const totalIncome = filteredIncomes.reduce(
            (sum, i) => sum + i.amount,
            0
        );
        const totalExpense = filteredExpenses.reduce(
            (sum, e) => sum + e.amount,
            0
        );
        const totalTransfer = filteredTransfers.reduce(
            (sum, t) => sum + t.amount,
            0
        );
        const netFlow = totalIncome - totalExpense;
        const maxValue = Math.max(totalIncome, totalExpense, totalTransfer, 1);

        return {
            income: totalIncome,
            expense: totalExpense,
            transfer: totalTransfer,
            net: netFlow,
            incomePercent: (totalIncome / maxValue) * 100,
            expensePercent: (totalExpense / maxValue) * 100,
            transferPercent: (totalTransfer / maxValue) * 100,
        };
    }, [incomes, expenses, transfers, dateRange, selectedAccount]);

    return (
        <GlassCard
            intensity="light"
            padding="md"
            className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Cash Flow</h3>
                    {selectedAccount && (
                        <button
                            onClick={onClearAccountFilter}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                            {selectedAccount.name}
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {onTransfer && (
                        <button
                            onClick={onTransfer}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-medium hover:bg-blue-500/20 transition-colors">
                            <ArrowLeftRight className="w-3 h-3" />
                            Transfer
                        </button>
                    )}
                    <span className="text-xs text-muted-foreground">
                        {dateRange.label}
                    </span>
                </div>
            </div>

            {/* Visual Bars */}
            <div className="space-y-4">
                {/* Income Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <span className="text-muted-foreground">
                                Income
                            </span>
                        </div>
                        <span className="font-semibold text-emerald-500 tabular-nums">
                            {formatCurrency(data.income)}
                        </span>
                    </div>
                    <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${data.incomePercent}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full"
                            style={{
                                boxShadow: "0 0 20px rgba(34, 197, 94, 0.4)",
                            }}
                        />
                    </div>
                </div>

                {/* Expense Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <TrendingDown className="w-4 h-4 text-red-500" />
                            <span className="text-muted-foreground">
                                Expenses
                            </span>
                        </div>
                        <span className="font-semibold text-red-500 tabular-nums">
                            {formatCurrency(data.expense)}
                        </span>
                    </div>
                    <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${data.expensePercent}%` }}
                            transition={{
                                duration: 0.8,
                                ease: "easeOut",
                                delay: 0.1,
                            }}
                            className="h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full"
                            style={{
                                boxShadow: "0 0 20px rgba(239, 68, 68, 0.4)",
                            }}
                        />
                    </div>
                </div>

                {/* Transfer Bar */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                            <ArrowLeftRight className="w-4 h-4 text-blue-500" />
                            <span className="text-muted-foreground">
                                Transfers
                            </span>
                        </div>
                        <span className="font-semibold text-blue-500 tabular-nums">
                            {formatCurrency(data.transfer)}
                        </span>
                    </div>
                    <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${data.transferPercent}%` }}
                            transition={{
                                duration: 0.8,
                                ease: "easeOut",
                                delay: 0.2,
                            }}
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                            style={{
                                boxShadow: "0 0 20px rgba(59, 130, 246, 0.4)",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Net Flow Summary */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={cn(
                    "flex items-center justify-between p-3 rounded-2xl",
                    data.net >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
                )}>
                <div className="flex items-center gap-3">
                    <div
                        className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            data.net >= 0
                                ? "bg-emerald-500/20"
                                : "bg-red-500/20"
                        )}>
                        <ArrowRight
                            className={cn(
                                "w-5 h-5",
                                data.net >= 0
                                    ? "text-emerald-500"
                                    : "text-red-500"
                            )}
                        />
                    </div>
                    <div>
                        <p className="text-xs text-muted-foreground">
                            Net Cash Flow
                        </p>
                        <p
                            className={cn(
                                "font-bold tabular-nums",
                                data.net >= 0
                                    ? "text-emerald-500"
                                    : "text-red-500"
                            )}>
                            {data.net >= 0 ? "+" : ""}
                            {formatCurrency(data.net)}
                        </p>
                    </div>
                </div>

                {/* Savings Rate */}
                {data.income > 0 && (
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                            Savings Rate
                        </p>
                        <p
                            className={cn(
                                "font-semibold tabular-nums",
                                data.net >= 0
                                    ? "text-emerald-500"
                                    : "text-red-500"
                            )}>
                            {((data.net / data.income) * 100).toFixed(0)}%
                        </p>
                    </div>
                )}
            </motion.div>
        </GlassCard>
    );
};
