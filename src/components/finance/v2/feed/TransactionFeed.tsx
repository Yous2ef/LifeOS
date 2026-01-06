import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronDown, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "../layout/GlassCard";
import { TransactionRow } from "./TransactionRow";
import type { Transaction, Account } from "@/types/modules/finance";
import type { DateRange } from "../controls/SmartDatePicker";

const ITEMS_PER_PAGE = 15;

interface TransactionFeedProps {
    transactions: Transaction[];
    formatCurrency: (amount: number) => string;
    dateRange: DateRange;
    onTransactionClick?: (transaction: Transaction) => void;
    onDeleteIncome?: (id: string) => void;
    onDeleteExpense?: (id: string) => void;
    selectedAccount?: Account | null;
    onClearAccountFilter?: () => void;
    className?: string;
}

export const TransactionFeed = ({
    transactions,
    formatCurrency,
    dateRange,
    onTransactionClick,
    onDeleteIncome,
    onDeleteExpense,
    selectedAccount,
    onClearAccountFilter,
    className,
}: TransactionFeedProps) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    // Filter transactions by date range, account, and search
    const filteredTransactions = useMemo(() => {
        let filtered = transactions.filter((t) => {
            const transactionDate = new Date(t.date);
            const inDateRange =
                transactionDate >= dateRange.start &&
                transactionDate <= dateRange.end;

            // Filter by account if selected
            const matchesAccount =
                !selectedAccount || t.accountId === selectedAccount.id;

            return inDateRange && matchesAccount;
        });

        // Apply search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (t) =>
                    t.title.toLowerCase().includes(query) ||
                    t.category?.toLowerCase().includes(query)
            );
        }

        // Sort by date (newest first)
        return filtered.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [transactions, dateRange, searchQuery, selectedAccount]);

    // Reset visible count when filters change
    useMemo(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [dateRange, searchQuery, selectedAccount]);

    // Paginated transactions
    const paginatedTransactions = useMemo(() => {
        return filteredTransactions.slice(0, visibleCount);
    }, [filteredTransactions, visibleCount]);

    // Group paginated transactions by date
    const groupedTransactions = useMemo(() => {
        const groups: Record<string, Transaction[]> = {};

        paginatedTransactions.forEach((t) => {
            const dateKey = t.date;
            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(t);
        });

        return groups;
    }, [paginatedTransactions]);

    const hasMore = visibleCount < filteredTransactions.length;

    const handleShowMore = () => {
        setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
    };

    const formatDateLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString())
            return "Yesterday";

        return date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
        });
    };

    // Calculate totals for the filtered period
    const totals = useMemo(() => {
        let income = 0;
        let expense = 0;
        let transfer = 0;

        filteredTransactions.forEach((t) => {
            if (t.type === "income") income += t.amount;
            else if (t.type === "expense") expense += t.amount;
            else if (t.type === "transfer") transfer += t.amount;
        });

        return { income, expense, transfer, net: income - expense };
    }, [filteredTransactions]);

    const sortedDates = Object.keys(groupedTransactions).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    return (
        <div className={cn("space-y-4", className)}>
            {/* Account Filter Header */}
            {selectedAccount && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-primary/10 border border-primary/20">
                    <button
                        onClick={onClearAccountFilter}
                        className="p-1.5 rounded-full hover:bg-primary/20 transition-colors"
                        title="Back to all accounts">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="flex-1">
                        <p className="text-xs text-muted-foreground">
                            Filtering by
                        </p>
                        <p className="font-medium">{selectedAccount.name}</p>
                    </div>
                    <span className="text-sm text-muted-foreground tabular-nums">
                        {filteredTransactions.length} transaction
                        {filteredTransactions.length !== 1 ? "s" : ""}
                    </span>
                </motion.div>
            )}

            {/* Header with Search */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                    <AnimatePresence mode="wait">
                        {showSearch ? (
                            <motion.div
                                key="search"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: "100%" }}
                                exit={{ opacity: 0, width: 0 }}
                                className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    autoFocus
                                    placeholder="Search transactions..."
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    className="pl-9 pr-9 h-10 rounded-full bg-muted/50 border-0"
                                />
                                <button
                                    onClick={() => {
                                        setSearchQuery("");
                                        setShowSearch(false);
                                    }}
                                    title="Close search"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="header"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}>
                                <h2 className="text-lg font-semibold">
                                    Transactions
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {filteredTransactions.length} transaction
                                    {filteredTransactions.length !== 1
                                        ? "s"
                                        : ""}{" "}
                                    in {dateRange.label}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowSearch(!showSearch)}
                        className="rounded-full w-9 h-9">
                        <Search className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Summary Pills */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium shrink-0">
                    <span className="text-xs opacity-70">Income</span>
                    <span className="tabular-nums">
                        {formatCurrency(totals.income)}
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-medium shrink-0">
                    <span className="text-xs opacity-70">Expenses</span>
                    <span className="tabular-nums">
                        {formatCurrency(totals.expense)}
                    </span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shrink-0",
                        totals.net >= 0
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                    )}>
                    <span className="text-xs opacity-70">Net</span>
                    <span className="tabular-nums">
                        {totals.net >= 0 ? "+" : ""}
                        {formatCurrency(totals.net)}
                    </span>
                </motion.div>
            </div>

            {/* Transaction List */}
            {sortedDates.length === 0 ? (
                <GlassCard
                    intensity="light"
                    padding="lg"
                    className="text-center">
                    <div className="py-8">
                        <div className="w-16 h-16 rounded-full bg-muted/50 mx-auto mb-4 flex items-center justify-center">
                            <Search className="w-7 h-7 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-1">
                            No transactions found
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {searchQuery
                                ? "Try a different search term"
                                : `No transactions in ${dateRange.label.toLowerCase()}`}
                        </p>
                    </div>
                </GlassCard>
            ) : (
                <div className="space-y-6">
                    {sortedDates.map((date, groupIndex) => (
                        <motion.div
                            key={date}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: groupIndex * 0.05 }}
                            className="space-y-2">
                            {/* Date Header */}
                            <div className="flex items-center justify-between px-1">
                                <span className="text-sm font-medium text-muted-foreground">
                                    {formatDateLabel(date)}
                                </span>
                                <span className="text-xs text-muted-foreground tabular-nums">
                                    {groupedTransactions[date].length}{" "}
                                    transaction
                                    {groupedTransactions[date].length !== 1
                                        ? "s"
                                        : ""}
                                </span>
                            </div>

                            {/* Transactions for this date */}
                            <GlassCard
                                intensity="light"
                                padding="none"
                                className="divide-y divide-border/50">
                                {groupedTransactions[date].map(
                                    (transaction, index) => (
                                        <TransactionRow
                                            key={transaction.id}
                                            transaction={transaction}
                                            formatCurrency={formatCurrency}
                                            onClick={() =>
                                                onTransactionClick?.(
                                                    transaction
                                                )
                                            }
                                            onDelete={() => {
                                                if (
                                                    transaction.type ===
                                                    "income"
                                                ) {
                                                    onDeleteIncome?.(
                                                        transaction.id
                                                    );
                                                } else {
                                                    onDeleteExpense?.(
                                                        transaction.id
                                                    );
                                                }
                                            }}
                                            index={index}
                                        />
                                    )
                                )}
                            </GlassCard>
                        </motion.div>
                    ))}

                    {/* Show More Button */}
                    {hasMore && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="pt-2">
                            <Button
                                variant="ghost"
                                onClick={handleShowMore}
                                className="w-full h-12 rounded-2xl bg-muted/30 hover:bg-muted/50 border border-border/50">
                                <ChevronDown className="w-4 h-4 mr-2" />
                                Show More (
                                {filteredTransactions.length -
                                    visibleCount}{" "}
                                remaining)
                            </Button>
                        </motion.div>
                    )}
                </div>
            )}
        </div>
    );
};
