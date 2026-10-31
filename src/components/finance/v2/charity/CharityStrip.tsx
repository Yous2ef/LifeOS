import { useState, type ReactNode } from "react";
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
    /** "+ Extra charity": add an amount on top of what's owed */
    onAddExtra?: () => void;
    /** Shown under the ledger cards when the strip is open (extra pledges) */
    detail?: ReactNode;
    className?: string;
}

/** B4 ledger cards: net earnings, owed, paid, remaining (or credit) */
export const CharityLedgerCards = ({
    ledger,
    rate,
    formatAmount,
}: Pick<CharityStripProps, "ledger" | "rate" | "formatAmount">) => {
    const isCredit = ledger.remaining < 0;
    const cards: {
        label: string;
        value: number;
        accent?: string;
        note?: string;
    }[] = [
        { label: COPY.ledgerNet, value: ledger.netEarnings },
        {
            label: COPY.ledgerOwed(rate),
            value: ledger.owed,
            note:
                ledger.pledged > 0
                    ? COPY.extraIncluded(formatAmount(ledger.pledged))
                    : undefined,
        },
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
                    {card.note && (
                        <p className="text-[11px] text-muted-foreground tabular-nums">
                            {card.note}
                        </p>
                    )}
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
    onAddExtra,
    detail,
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
                {onAddExtra && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onAddExtra}
                        className="rounded-xl h-8 text-teal-600 dark:text-teal-400 hover:bg-teal-500/10">
                        {COPY.addExtra}
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
                    {detail && <div className="mt-3">{detail}</div>}
                </div>
            )}
        </GlassCard>
    );
};
