import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { AccountCard } from "./AccountCard";
import type { Account } from "@/types/modules/finance";

interface AccountListProps {
    accounts: Account[];
    calculateBalance: (accountId: string) => number;
    formatCurrency: (amount: number) => string;
    onAccountClick?: (account: Account) => void;
    onAddAccount?: () => void;
    selectedAccountId?: string;
    showArchived?: boolean;
    className?: string;
}

export const AccountList = ({
    accounts,
    calculateBalance,
    formatCurrency,
    onAccountClick,
    onAddAccount,
    selectedAccountId,
    showArchived = false,
    className,
}: AccountListProps) => {
    const filteredAccounts = showArchived
        ? accounts
        : accounts.filter((a) => a.isActive);

    // Sort by order, then by balance
    const sortedAccounts = [...filteredAccounts].sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return calculateBalance(b.id) - calculateBalance(a.id);
    });

    // Calculate total balance
    // const totalBalance = sortedAccounts.reduce(
    //     (sum, account) => sum + calculateBalance(account.id),
    //     0
    // );

    return (
        <div className={cn("space-y-4", className)}>
            {/* Accounts List */}
            <div className="space-y-2 ">
                <div className="flex flex-col gap-3 px-2 items-stretch">
                    {sortedAccounts.map((account, index) => (
                        <motion.div
                            key={account.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}>
                            <AccountCard
                                account={account}
                                balance={calculateBalance(account.id)}
                                formatCurrency={formatCurrency}
                                onClick={() => onAccountClick?.(account)}
                                isSelected={account.id === selectedAccountId}
                                compact
                            />
                        </motion.div>
                    ))}
                </div>
                {/* Add Account Button */}
                {onAddAccount && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: sortedAccounts.length * 0.05 }}>
                        <Button
                            variant="ghost"
                            onClick={onAddAccount}
                            className={cn(
                                "w-full justify-start gap-3 h-auto py-3 px-3",
                                "rounded-2xl",
                                "border-2 border-dashed border-muted-foreground/20",
                                "text-muted-foreground",
                                "hover:border-primary/30 hover:text-primary hover:bg-primary/5"
                            )}>
                            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                                <Plus className="w-5 h-5" />
                            </div>
                            <span className="font-medium text-sm">
                                Add Account
                            </span>
                        </Button>
                    </motion.div>
                )}
            </div>

            {/* Show Archived Toggle */}
            {accounts.some((a) => !a.isActive) && (
                <div className="pt-2 text-center">
                    <button
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => {
                            // This would toggle showArchived - parent should handle state
                        }}>
                        {showArchived
                            ? "Hide archived accounts"
                            : `Show ${
                                  accounts.filter((a) => !a.isActive).length
                              } archived account(s)`}
                    </button>
                </div>
            )}
        </div>
    );
};
