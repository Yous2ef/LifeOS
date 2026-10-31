import { useId, useState, useMemo, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronDown, ArrowLeft, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "../layout/GlassCard";
import { TransactionRow } from "./TransactionRow";
import {
    SearchFilters,
    type DateMode,
    type SearchOptions,
} from "./SearchFilters";
import type { Transaction, Account } from "@/types/modules/finance";
import type { DateRange } from "../controls/SmartDatePicker";
import { todayISO } from "@/utils/finance/dates";
import {
    EMPTY_FILTERS,
    countActiveFilters,
    filterTransactions,
    searchTotals,
    type SearchFilters as Filters,
    type SearchableTransaction,
} from "@/utils/finance/search";

const ITEMS_PER_PAGE = 15;

const NO_OPTIONS: SearchOptions = {
    accounts: [],
    funds: [],
    expenseCategories: [],
    incomeCategories: [],
    projects: [],
    people: [],
    showWorkCost: false,
};

const COPY = {
    searchPlaceholder: "Search title, notes, person, project…",
    filters: "Filters",
    allTime: "All Time",
    loans: "Loans",
    moneyIn: "in",
    moneyOut: "out",
    transfers: "Transfers",
    notCounted: "Loans and transfers are not counted in income, expenses or net.",
    tryAnother: "Try another search or clear the filters",
};

interface TransactionFeedProps {
    /** Newest first */
    transactions: SearchableTransaction[];
    formatCurrency: (amount: number) => string;
    dateRange: DateRange;
    onTransactionClick?: (transaction: Transaction) => void;
    onEdit?: (transaction: Transaction) => void;
    onDelete?: (transaction: Transaction) => void;
    selectedAccount?: Account | null;
    onClearAccountFilter?: () => void;
    className?: string;
    /** Extra chip per row (e.g. an income's charity status) */
    renderBadge?: (transaction: Transaction) => ReactNode;
    /** Lists the filter panel picks from */
    searchOptions?: SearchOptions;
}

export const TransactionFeed = ({
    transactions,
    formatCurrency,
    dateRange,
    onTransactionClick,
    onEdit,
    onDelete,
    selectedAccount,
    onClearAccountFilter,
    className,
    renderBadge,
    searchOptions = NO_OPTIONS,
}: TransactionFeedProps) => {
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
    const [dateMode, setDateMode] = useState<DateMode>("period");
    const [showSearch, setShowSearch] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

    const activeFilterCount = countActiveFilters(filters);
    const isSearching =
        !!filters.text.trim() || activeFilterCount > 0 || dateMode !== "period";

    const periodText =
        dateMode === "period"
            ? dateRange.label
            : dateMode === "any"
              ? COPY.allTime
              : [filters.from, filters.to].filter(Boolean).join(" – ") ||
                COPY.allTime;

    const effectiveFilters = useMemo<Filters>(
        () => ({
            ...filters,
            accountId: selectedAccount?.id ?? filters.accountId,
            ...(dateMode === "period"
                ? {
                      from: todayISO(dateRange.start),
                      to: todayISO(dateRange.end),
                  }
                : dateMode === "any"
                  ? { from: undefined, to: undefined }
                  : {}),
        }),
        [filters, selectedAccount, dateMode, dateRange],
    );

    const filteredTransactions = useMemo(
        () =>
            filterTransactions(transactions, effectiveFilters, {
                people: searchOptions.people,
                projects: searchOptions.projects,
            }),
        [transactions, effectiveFilters, searchOptions],
    );

    // Back to the first page whenever the results change shape
    const [pagedFor, setPagedFor] = useState(effectiveFilters);
    if (pagedFor !== effectiveFilters) {
        setPagedFor(effectiveFilters);
        setVisibleCount(ITEMS_PER_PAGE);
    }

    const clearSearch = () => {
        setFilters(EMPTY_FILTERS);
        setDateMode("period");
    };

    // The panel's "Clear filters" keeps what was typed and the dates
    const clearFilters = () =>
        setFilters((prev) => ({
            ...EMPTY_FILTERS,
            text: prev.text,
            from: prev.from,
            to: prev.to,
        }));

    // A custom range starts from the period being shown
    const changeDateMode = (mode: DateMode) => {
        if (mode === "custom" && dateMode !== "custom") {
            setFilters((prev) => ({
                ...prev,
                from: todayISO(dateRange.start),
                to: todayISO(dateRange.end),
            }));
        }
        setDateMode(mode);
    };

    const filtersId = useId();

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

    const totals = useMemo(
        () => searchTotals(filteredTransactions, effectiveFilters.accountId),
        [filteredTransactions, effectiveFilters.accountId],
    );

    const sortedDates = Object.keys(groupedTransactions).sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    const countText = `${totals.count} transaction${totals.count !== 1 ? "s" : ""}`;

    const pill = (
        label: string,
        value: string,
        tone: string,
        delay = 0,
        title?: string,
    ) => (
        <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay }}
            title={title}
            className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium shrink-0",
                tone,
            )}>
            <span className="text-xs opacity-70">{label}</span>
            <span className="tabular-nums">{value}</span>
        </motion.div>
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
                        {countText}
                    </span>
                </motion.div>
            )}

            {/* Header with Search */}
            <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
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
                                    placeholder={COPY.searchPlaceholder}
                                    aria-label="Search transactions"
                                    value={filters.text}
                                    onChange={(e) =>
                                        setFilters((prev) => ({
                                            ...prev,
                                            text: e.target.value,
                                        }))
                                    }
                                    className="pl-9 pr-9 h-10 rounded-full bg-muted/50 border-0"
                                />
                                <button
                                    onClick={() => {
                                        clearSearch();
                                        setShowSearch(false);
                                        setShowFilters(false);
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
                                    {countText} in {periodText}
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        title="Search transactions"
                        onClick={() => setShowSearch(!showSearch)}
                        className="rounded-full w-9 h-9">
                        <Search className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        title={COPY.filters}
                        aria-expanded={showFilters}
                        aria-controls={showFilters ? filtersId : undefined}
                        onClick={() => setShowFilters(!showFilters)}
                        className={cn(
                            "relative rounded-full w-9 h-9",
                            showFilters && "bg-muted",
                        )}>
                        <SlidersHorizontal className="w-4 h-4" />
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] leading-4 tabular-nums">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                </div>
            </div>

            {/* The title line (with the live count) hides behind the search box */}
            {showSearch && (
                <p className="text-sm text-muted-foreground px-1 -mt-2">
                    {countText} in {periodText}
                </p>
            )}

            {showFilters && (
                <SearchFilters
                    filters={filters}
                    onChange={setFilters}
                    dateMode={dateMode}
                    onDateModeChange={changeDateMode}
                    periodLabel={dateRange.label}
                    options={searchOptions}
                    lockedAccountId={selectedAccount?.id}
                    onClear={clearFilters}
                    id={filtersId}
                />
            )}

            {/* Summary Pills: loans and transfers stay out of the net */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                {pill(
                    "Income",
                    formatCurrency(totals.income),
                    "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                )}
                {pill(
                    "Expenses",
                    formatCurrency(totals.expense),
                    "bg-red-500/10 text-red-600 dark:text-red-400",
                    0.05,
                )}
                {pill(
                    "Net",
                    `${totals.net >= 0 ? "+" : ""}${formatCurrency(totals.net)}`,
                    totals.net >= 0
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "bg-orange-500/10 text-orange-600 dark:text-orange-400",
                    0.1,
                )}
                {totals.loanCount > 0 &&
                    pill(
                        COPY.loans,
                        `${COPY.moneyIn} ${formatCurrency(totals.loanIn)} · ${COPY.moneyOut} ${formatCurrency(totals.loanOut)}`,
                        "bg-violet-500/10 text-violet-600 dark:text-violet-400",
                        0.15,
                        COPY.notCounted,
                    )}
                {totals.transferCount > 0 &&
                    pill(
                        COPY.transfers,
                        // Seen from one account a transfer comes in or goes out
                        effectiveFilters.accountId
                            ? `${COPY.moneyIn} ${formatCurrency(totals.transferIn)} · ${COPY.moneyOut} ${formatCurrency(totals.transferOut)}`
                            : formatCurrency(totals.transferAmount),
                        "bg-muted text-muted-foreground",
                        0.2,
                        COPY.notCounted,
                    )}
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
                            {isSearching
                                ? COPY.tryAnother
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
                                            onEdit={
                                                onEdit
                                                    ? () => onEdit(transaction)
                                                    : undefined
                                            }
                                            onDelete={
                                                onDelete
                                                    ? () => onDelete(transaction)
                                                    : undefined
                                            }
                                            index={index}
                                            badge={renderBadge?.(transaction)}
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
