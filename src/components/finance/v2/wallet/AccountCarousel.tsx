import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { AccountCard } from "./AccountCard";
import type { Account } from "@/types/modules/finance";

interface AccountCarouselProps {
    accounts: Account[];
    calculateBalance: (accountId: string) => number;
    formatCurrency: (amount: number) => string;
    onAccountClick?: (account: Account) => void;
    onAddAccount?: () => void;
    selectedAccountId?: string;
    className?: string;
}

export const AccountCarousel = ({
    accounts,
    calculateBalance,
    formatCurrency,
    onAccountClick,
    onAddAccount,
    selectedAccountId,
    className,
}: AccountCarouselProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    };

    const scroll = (direction: "left" | "right") => {
        if (!scrollRef.current) return;
        const scrollAmount = 280; // Card width + gap
        scrollRef.current.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
        setTimeout(checkScroll, 300);
    };

    const activeAccounts = accounts.filter((a) => a.isActive);

    return (
        <div className={cn("relative group", className)}>
            {/* Scroll Buttons - Desktop only */}
            {canScrollLeft && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 z-10">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => scroll("left")}
                        className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm shadow-lg border">
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                </motion.div>
            )}

            {canScrollRight && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 z-10">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => scroll("right")}
                        className="w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm shadow-lg border">
                        <ChevronRight className="w-5 h-5" />
                    </Button>
                </motion.div>
            )}

            {/* Cards Container */}
            <div
                ref={scrollRef}
                onScroll={checkScroll}
                className={cn(
                    "flex gap-4 overflow-x-auto scrollbar-none",
                    "snap-x snap-mandatory",
                    "px-4 lg:px-2 py-4",
                    "-mx-4 lg:-mx-2"
                )}
                style={{
                    scrollPaddingLeft: "1rem",
                    scrollPaddingRight: "1rem",
                }}>
                {activeAccounts.map((account, index) => (
                    <motion.div
                        key={account.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="snap-start shrink-0">
                        <AccountCard
                            account={account}
                            balance={calculateBalance(account.id)}
                            formatCurrency={formatCurrency}
                            onClick={() => onAccountClick?.(account)}
                            isSelected={account.id === selectedAccountId}
                        />
                    </motion.div>
                ))}

                {/* Add Account Card */}
                {onAddAccount && (
                    <motion.button
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: activeAccounts.length * 0.1 }}
                        onClick={onAddAccount}
                        className={cn(
                            "snap-start shrink-0",
                            "min-w-[260px] h-[160px]",
                            "rounded-3xl",
                            "border-2 border-dashed border-muted-foreground/30",
                            "flex flex-col items-center justify-center gap-3",
                            "text-muted-foreground",
                            "hover:border-primary/50 hover:text-primary hover:bg-primary/5",
                            "transition-all duration-200",
                            "cursor-pointer"
                        )}>
                        <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center">
                            <Plus className="w-6 h-6" />
                        </div>
                        <span className="text-sm font-medium">Add Account</span>
                    </motion.button>
                )}
            </div>

            {/* Scroll Indicator Dots - Mobile */}
            {activeAccounts.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-2 lg:hidden">
                    {activeAccounts.map((account) => (
                        <div
                            key={account.id}
                            className={cn(
                                "w-1.5 h-1.5 rounded-full transition-all duration-200",
                                account.id === selectedAccountId
                                    ? "bg-primary w-4"
                                    : "bg-muted-foreground/30"
                            )}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
