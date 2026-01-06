import { motion } from "framer-motion";
import { Settings, Plus, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { SmartDatePicker } from "../controls/SmartDatePicker";
import type { DateRange } from "../controls/SmartDatePicker";
import { NetWorthDisplay } from "../wallet/NetWorthDisplay";
import type { Account } from "@/types/modules/finance";

interface FinanceHeaderProps {
    accounts: Account[];
    calculateAccountBalance: (accountId: string) => number;
    formatCurrency: (amount: number) => string;
    dateRange: DateRange;
    onDateRangeChange: (range: DateRange) => void;
    onSettingsClick: () => void;
    onAddClick: () => void;
    onReportsClick?: () => void;
    selectedAccount?: Account | null;
    className?: string;
}

export const FinanceHeader = ({
    accounts,
    calculateAccountBalance,
    formatCurrency,
    dateRange,
    onDateRangeChange,
    onSettingsClick,
    onAddClick,
    onReportsClick,
    selectedAccount,
    className,
}: FinanceHeaderProps) => {
    // Show selected account balance or total net worth
    const displayAmount = selectedAccount
        ? calculateAccountBalance(selectedAccount.id)
        : accounts
              .filter((a) => a.isActive)
              .reduce(
                  (sum, account) => sum + calculateAccountBalance(account.id),
                  0
              );

    return (
        <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className={cn(
                // Desktop: sticky top
                "lg:sticky lg:top-0 lg:border-b",
                // Mobile: fixed bottom with safe area padding
                "fixed bottom-0 left-0 right-0 lg:relative",
                "border-t lg:border-t-0 border-border/50",
                "z-40",
                "bg-background/95 backdrop-blur-xl",
                "px-4 lg:px-6 py-3 lg:py-4",
                // Add safe area for iOS notch/home indicator
                "pb-safe",
                className
            )}>
            {/* Desktop Layout */}
            <div className="hidden lg:flex items-center justify-between gap-4">
                {/* Left: Net Worth or Selected Account Balance */}
                <div className="flex-shrink-0">
                    <NetWorthDisplay
                        amount={displayAmount}
                        formatCurrency={formatCurrency}
                        compact
                    />
                </div>

                {/* Center: Smart Date Picker */}
                <div>
                    <SmartDatePicker
                        value={dateRange}
                        onChange={onDateRangeChange}
                    />
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2">
                    {onReportsClick && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onReportsClick}
                            className="rounded-full w-10 h-10"
                            title="Reports">
                            <BarChart3 className="w-5 h-5" />
                        </Button>
                    )}

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onSettingsClick}
                        className="rounded-full w-10 h-10">
                        <Settings className="w-5 h-5" />
                    </Button>

                    <Button
                        size="sm"
                        onClick={onAddClick}
                        className="rounded-full px-4 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25">
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Add</span>
                    </Button>
                </div>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="flex lg:hidden items-center justify-around gap-2">
                {/* Date Picker */}
                <div className="flex items-center">
                    <SmartDatePicker
                        value={dateRange}
                        onChange={onDateRangeChange}
                    />
                </div>

                {/* Reports */}
                {onReportsClick && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onReportsClick}
                        className="flex-col h-auto py-2 px-3 gap-1 hover:bg-primary/10"
                        title="Reports">
                        <BarChart3 className="w-5 h-5" />
                        <span className="text-[10px] font-medium">Reports</span>
                    </Button>
                )}

                {/* Settings */}
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onSettingsClick}
                    className="flex-col h-auto py-2 px-3 gap-1 hover:bg-primary/10">
                    <Settings className="w-5 h-5" />
                    <span className="text-[10px] font-medium">Settings</span>
                </Button>
            </div>
        </motion.header>
    );
};
