import { useState } from "react";
import { ChevronDown, HandHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { CharityLedger } from "@/utils/finance/charity";
import { GlassCard } from "../layout/GlassCard";
import { COPY, stripText } from "./copy";

interface CharityStripProps {
    ledger: CharityLedger;
    rate: number;
    formatAmount: (amount: number) => string;
    onPay: (amount: number) => void;
    className?: string;
}

/** B4 ledger cards: net earnings, owed, paid, remaining (or credit) */
export const CharityLedgerCards = ({
    ledger,
    rate,
    formatAmount,
}: Omit<CharityStripProps, "onPay" | "className">) => {
    const isCredit = ledger.remaining < 0;
    const cards = [
        { label: COPY.ledgerNet, value: ledger.netEarnings },
        { label: COPY.ledgerOwed(rate), value: ledger.owed },
        { label: COPY.ledgerPaid, value: ledger.paid },
        {
            label: isCredit ? COPY.ledgerCredit : COPY.ledgerRemaining,
            value: Math.abs(ledger.remaining),
            accent: isCredit
                ? "text-emerald-500"
                : ledger.remaining > 0
                  ? "text-amber-500"
                  : undefined,
        },
    ];
    return (
        <div className="grid grid-cols-2 gap-2">
            {cards.map((card) => (
                <div key={card.label} className="p-3 rounded-xl bg-muted/40">
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                    <p
                        className={cn(
                            "text-base font-semibold tabular-nums",
                            card.accent,
                        )}>
                        {formatAmount(card.value)}
                    </p>
                </div>
            ))}
        </div>
    );
};

/** A1 home strip: "Charity: 1,500 of 2,000 paid · 500 left · Pay" */
export const CharityStrip = ({
    ledger,
    rate,
    formatAmount,
    onPay,
    className,
}: CharityStripProps) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <GlassCard intensity="light" padding="sm" className={className}>
            {/* Pay drops under the text when the wallet column is narrow */}
            <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                    type="button"
                    onClick={() => setIsOpen((open) => !open)}
                    aria-expanded={isOpen}
                    className="flex-1 min-w-[12rem] flex items-center gap-2 text-left text-sm">
                    <HandHeart className="w-4 h-4 text-teal-500 shrink-0" />
                    <span className="min-w-0 leading-snug tabular-nums">
                        {stripText(
                            ledger.paid,
                            ledger.owed,
                            ledger.remaining,
                            formatAmount,
                        )}
                    </span>
                    <ChevronDown
                        className={cn(
                            "w-4 h-4 text-muted-foreground shrink-0 transition-transform",
                            isOpen && "rotate-180",
                        )}
                    />
                </button>
                {ledger.remaining > 0 && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onPay(ledger.remaining)}
                        className="rounded-xl h-8 bg-teal-500/10 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20">
                        {COPY.pay}
                    </Button>
                )}
            </div>
            {isOpen && (
                <div className="mt-3">
                    <CharityLedgerCards
                        ledger={ledger}
                        rate={rate}
                        formatAmount={formatAmount}
                    />
                </div>
            )}
        </GlassCard>
    );
};
