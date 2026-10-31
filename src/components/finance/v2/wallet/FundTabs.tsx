import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Fund } from "@/types/modules/finance";

interface FundTabsProps {
    funds: Fund[];
    /** Empty = All */
    focusedFundIds: string[];
    onFocusChange: (fundIds: string[]) => void;
    onManage: () => void;
    className?: string;
}

/** Which fund(s) the home screen shows: one visible fund, or All */
export const FundTabs = ({
    funds,
    focusedFundIds,
    onFocusChange,
    onManage,
    className,
}: FundTabsProps) => {
    const visibleFunds = funds.filter((fund) => fund.isVisible);
    const isAll = focusedFundIds.length === 0;
    const isOnly = (id: string) =>
        focusedFundIds.length === 1 && focusedFundIds[0] === id;

    const tabClass = (active: boolean) =>
        cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
            active
                ? "bg-primary text-primary-foreground shadow"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
        );

    return (
        <div
            role="tablist"
            className={cn(
                "flex items-center gap-2 overflow-x-auto scrollbar-none pb-1",
                className,
            )}>
            {visibleFunds.map((fund) => (
                <button
                    key={fund.id}
                    role="tab"
                    aria-selected={isOnly(fund.id)}
                    onClick={() => onFocusChange([fund.id])}
                    className={tabClass(isOnly(fund.id))}>
                    <span>{fund.icon}</span>
                    {fund.name}
                </button>
            ))}
            <button
                role="tab"
                aria-selected={isAll}
                onClick={() => onFocusChange([])}
                className={tabClass(isAll)}>
                All
            </button>
            <button
                onClick={onManage}
                title="Manage funds"
                aria-label="Manage funds"
                className="ml-auto shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <SlidersHorizontal className="w-4 h-4" />
            </button>
        </div>
    );
};
