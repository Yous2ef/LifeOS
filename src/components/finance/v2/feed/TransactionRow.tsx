import { motion } from "framer-motion";
import {
    ArrowUpRight,
    ArrowLeftRight,
    MoreHorizontal,
    Trash2,
    Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";
import type { Transaction } from "@/types/modules/finance";

interface TransactionRowProps {
    transaction: Transaction;
    formatCurrency: (amount: number) => string;
    onClick?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    index?: number;
}

export const TransactionRow = ({
    transaction,
    formatCurrency,
    onClick,
    onEdit,
    onDelete,
    index = 0,
}: TransactionRowProps) => {
    const isIncome = transaction.type === "income";
    const isTransfer = transaction.type === "transfer";

    const getTimeString = (dateStr: string) => {
        // If we have full timestamp, show time
        if (dateStr.includes("T")) {
            return new Date(dateStr).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
            });
        }
        return null;
    };

    const time = getTimeString(transaction.date);

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.02 }}
            whileHover={{ backgroundColor: "var(--accent)" }}
            whileTap={{ scale: 0.99 }}
            onClick={onClick}
            className={cn(
                "flex items-center gap-3 px-4 py-3",
                "cursor-pointer transition-colors duration-150",
                "group"
            )}>
            {/* Icon */}
            <div
                className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                    "transition-transform duration-200 group-hover:scale-105"
                )}
                style={{
                    backgroundColor: isIncome
                        ? "rgba(34, 197, 94, 0.1)"
                        : isTransfer
                        ? "rgba(59, 130, 246, 0.1)"
                        : transaction.categoryColor
                        ? `${transaction.categoryColor}20`
                        : "rgba(239, 68, 68, 0.1)",
                }}>
                {isIncome ? (
                    <ArrowUpRight className="w-5 h-5 text-emerald-500" />
                ) : isTransfer ? (
                    <ArrowLeftRight className="w-5 h-5 text-blue-500" />
                ) : (
                    <span className="text-lg">
                        {transaction.categoryIcon || "💸"}
                    </span>
                )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                    {transaction.title}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {transaction.category && (
                        <span
                            className="px-1.5 py-0.5 rounded-md"
                            style={{
                                backgroundColor: transaction.categoryColor
                                    ? `${transaction.categoryColor}15`
                                    : "var(--muted)",
                                color: transaction.categoryColor || "inherit",
                            }}>
                            {transaction.category}
                        </span>
                    )}
                    {time && <span>{time}</span>}
                    {transaction.location && (
                        <span className="truncate">
                            📍 {transaction.location}
                        </span>
                    )}
                </div>
            </div>

            {/* Amount */}
            <div className="text-right shrink-0">
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                        "font-semibold tabular-nums",
                        isIncome
                            ? "text-emerald-500"
                            : isTransfer
                            ? "text-blue-500"
                            : "text-foreground"
                    )}>
                    {isIncome ? "+" : isTransfer ? "" : "-"}{" "}
                    {formatCurrency(transaction.amount)}
                </motion.p>
            </div>

            {/* Actions (visible on hover) */}
            {(onEdit || onDelete) && (
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <DropdownMenu>
                        <DropdownMenuTrigger
                            asChild
                            onClick={(e: React.MouseEvent) =>
                                e.stopPropagation()
                            }>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 rounded-full">
                                <MoreHorizontal className="w-4 h-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-40 rounded-xl">
                            {onEdit && (
                                <DropdownMenuItem
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        onEdit();
                                    }}
                                    className="gap-2 rounded-lg">
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </DropdownMenuItem>
                            )}
                            {onDelete && (
                                <DropdownMenuItem
                                    onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        onDelete();
                                    }}
                                    className="gap-2 rounded-lg text-red-500 focus:text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </motion.div>
    );
};
