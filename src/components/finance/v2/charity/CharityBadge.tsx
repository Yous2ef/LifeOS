import { cn } from "@/lib/utils";
import type { CharityIncomeShare } from "@/utils/finance/charity";
import { badgeText } from "./copy";

const STATUS_CLASS: Record<CharityIncomeShare["status"], string> = {
    paid: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
    partial: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    unpaid: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
};

/** Per-income charity status in the feed */
export const CharityBadge = ({
    entry,
    formatAmount,
}: {
    entry: CharityIncomeShare;
    formatAmount: (amount: number) => string;
}) => (
    <span
        className={cn(
            "px-1.5 py-0.5 rounded-md whitespace-nowrap",
            STATUS_CLASS[entry.status],
        )}>
        {badgeText(entry, formatAmount)}
    </span>
);
