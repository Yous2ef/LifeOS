import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import type { Person } from "@/types/modules/finance";
import type { PersonSummary } from "@/utils/finance/loans";
import { GlassCard } from "../layout/GlassCard";
import {
    balanceLabel,
    loanCountLabel,
    netColor,
    signedAmount,
} from "./copy";

interface PersonCardProps {
    person: Person;
    summary?: PersonSummary;
    formatAmount: (amount: number) => string;
    onOpen: () => void;
    onSettleUp: () => void;
}

/** B3 people card: name, signed balance, loan count, "Settle up" */
export const PersonCard = ({
    person,
    summary,
    formatAmount,
    onOpen,
    onSettleUp,
}: PersonCardProps) => {
    const net = summary?.net ?? 0;

    return (
        <GlassCard
            intensity="light"
            padding="sm"
            className="hover:bg-card/60 transition-colors">
            {/* Its own button, so keys on "Settle up" never open the person */}
            <button
                type="button"
                onClick={onOpen}
                className="w-full flex items-center gap-3 text-left rounded-2xl">
                <div className="w-11 h-11 rounded-2xl bg-violet-500/15 text-violet-500 font-semibold flex items-center justify-center shrink-0">
                    {person.name.trim().charAt(0).toUpperCase() || "?"}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate" dir="auto">
                        {person.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {loanCountLabel(summary?.loanCount ?? 0)}
                    </p>
                </div>
                <div className="text-right shrink-0">
                    <p
                        className={cn(
                            "text-lg font-bold tabular-nums",
                            netColor(net),
                        )}>
                        {signedAmount(net, formatAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {balanceLabel(net, formatAmount)}
                    </p>
                </div>
            </button>
            {net !== 0 && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSettleUp}
                    className="mt-3 w-full rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20">
                    Settle up
                </Button>
            )}
        </GlassCard>
    );
};
