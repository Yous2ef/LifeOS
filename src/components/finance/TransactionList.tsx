import { useState } from "react";
import { ArrowUpRight, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/types/modules/finance";

interface TransactionListProps {
    transactions: Transaction[];
    formatCurrency: (amount: number) => string;
    compact?: boolean;
    onDeleteIncome?: (id: string) => void;
    onDeleteExpense?: (id: string) => void;
    onEditIncome?: (id: string) => void;
    onEditExpense?: (id: string) => void;
}

export const TransactionList = ({
    transactions,
    formatCurrency,
    compact = false,
    onDeleteIncome,
    onDeleteExpense,
    onEditIncome,
    onEditExpense,
}: TransactionListProps) => {
    const [deleteConfirm, setDeleteConfirm] = useState<Transaction | null>(
        null
    );

    if (transactions.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p>No transactions yet</p>
                <p className="text-sm">
                    Add your first income or expense to get started
                </p>
            </div>
        );
    }

    // Group transactions by date
    const groupedByDate: Record<string, Transaction[]> = {};
    transactions.forEach((t) => {
        const date = t.date;
        if (!groupedByDate[date]) {
            groupedByDate[date] = [];
        }
        groupedByDate[date].push(t);
    });

    const formatDateLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return "Today";
        if (date.toDateString() === yesterday.toDateString())
            return "Yesterday";

        return date.toLocaleDateString("en-US", {
            weekday: compact ? undefined : "short",
            month: "short",
            day: "numeric",
        });
    };

    if (compact) {
        // Simple list for compact mode
        return (
            <div className="space-y-2">
                {transactions.map((transaction) => (
                    <div
                        key={transaction.id}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                        {/* Icon */}
                        <div
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0",
                                transaction.type === "income"
                                    ? "bg-green-500/10"
                                    : "bg-muted"
                            )}
                            style={{
                                backgroundColor:
                                    transaction.type === "expense" &&
                                    transaction.categoryColor
                                        ? `${transaction.categoryColor}20`
                                        : undefined,
                            }}>
                            {transaction.type === "income" ? (
                                <ArrowUpRight className="h-5 w-5 text-green-500" />
                            ) : (
                                transaction.categoryIcon || "📦"
                            )}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                                {transaction.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {formatDateLabel(transaction.date)}
                                {transaction.category &&
                                    ` • ${transaction.category}`}
                            </p>
                        </div>

                        {/* Amount */}
                        <p
                            className={cn(
                                "text-sm font-semibold tabular-nums",
                                transaction.type === "income"
                                    ? "text-green-500"
                                    : "text-foreground"
                            )}>
                            {transaction.type === "income" ? "+" : "-"}
                            {formatCurrency(transaction.amount)}
                        </p>
                    </div>
                ))}
            </div>
        );
    }

    // Full list grouped by date
    return (
        <div className="space-y-4">
            {Object.entries(groupedByDate).map(([date, dayTransactions]) => (
                <div key={date}>
                    {/* Date Header */}
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-muted-foreground">
                            {formatDateLabel(date)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {dayTransactions.length} transaction
                            {dayTransactions.length > 1 ? "s" : ""}
                        </p>
                    </div>

                    {/* Transactions */}
                    <div className="space-y-2">
                        {dayTransactions.map((transaction) => (
                            <div
                                key={transaction.id}
                                className="group flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer">
                                {/* Icon */}
                                <div
                                    className={cn(
                                        "w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0",
                                        transaction.type === "income"
                                            ? "bg-green-500/10"
                                            : "bg-muted"
                                    )}
                                    style={{
                                        backgroundColor:
                                            transaction.type === "expense" &&
                                            transaction.categoryColor
                                                ? `${transaction.categoryColor}15`
                                                : undefined,
                                    }}>
                                    {transaction.type === "income" ? (
                                        <ArrowUpRight className="h-6 w-6 text-green-500" />
                                    ) : (
                                        transaction.categoryIcon || "📦"
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                        {transaction.title}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {transaction.category ||
                                            (transaction.type === "income"
                                                ? "Income"
                                                : "Expense")}
                                    </p>
                                </div>

                                {/* Amount */}
                                <div className="text-right">
                                    <p
                                        className={cn(
                                            "font-semibold tabular-nums",
                                            transaction.type === "income"
                                                ? "text-green-500"
                                                : "text-foreground"
                                        )}>
                                        {transaction.type === "income"
                                            ? "+"
                                            : "-"}
                                        {formatCurrency(transaction.amount)}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {((transaction.type === "income" &&
                                        onEditIncome) ||
                                        (transaction.type === "expense" &&
                                            onEditExpense)) && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (
                                                    transaction.type ===
                                                        "income" &&
                                                    onEditIncome
                                                ) {
                                                    onEditIncome(
                                                        transaction.id
                                                    );
                                                } else if (
                                                    transaction.type ===
                                                        "expense" &&
                                                    onEditExpense
                                                ) {
                                                    onEditExpense(
                                                        transaction.id
                                                    );
                                                }
                                            }}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    )}
                                    {((transaction.type === "income" &&
                                        onDeleteIncome) ||
                                        (transaction.type === "expense" &&
                                            onDeleteExpense)) && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteConfirm(transaction);
                                            }}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!deleteConfirm}
                onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="sm:max-w-md text-foreground">
                    <DialogHeader>
                        <DialogTitle className="text-red-500 flex items-center gap-2">
                            <Trash2 className="h-5 w-5" />
                            حذف{" "}
                            {deleteConfirm?.type === "income"
                                ? "الدخل"
                                : "المصروف"}
                        </DialogTitle>
                        <DialogDescription>
                            هل أنت متأكد من حذف هذه العملية؟
                        </DialogDescription>
                    </DialogHeader>
                    {deleteConfirm && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div
                                        className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center text-lg",
                                            deleteConfirm.type === "income"
                                                ? "bg-green-500/10"
                                                : "bg-muted"
                                        )}>
                                        {deleteConfirm.type === "income" ? (
                                            <ArrowUpRight className="h-5 w-5 text-green-500" />
                                        ) : (
                                            deleteConfirm.categoryIcon || "📦"
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {deleteConfirm.title}
                                        </p>
                                        <p
                                            className={cn(
                                                "text-sm font-semibold",
                                                deleteConfirm.type === "income"
                                                    ? "text-green-500"
                                                    : "text-foreground"
                                            )}>
                                            {deleteConfirm.type === "income"
                                                ? "+"
                                                : "-"}
                                            {formatCurrency(
                                                deleteConfirm.amount
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                ⚠️ سيتم حذف هذه العملية نهائياً. هذا الإجراء لا
                                يمكن التراجع عنه.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => {
                                        if (deleteConfirm) {
                                            if (
                                                deleteConfirm.type ===
                                                    "income" &&
                                                onDeleteIncome
                                            ) {
                                                onDeleteIncome(
                                                    deleteConfirm.id
                                                );
                                            } else if (
                                                deleteConfirm.type ===
                                                    "expense" &&
                                                onDeleteExpense
                                            ) {
                                                onDeleteExpense(
                                                    deleteConfirm.id
                                                );
                                            }
                                            setDeleteConfirm(null);
                                        }
                                    }}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    نعم، احذف
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setDeleteConfirm(null)}>
                                    إلغاء
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
