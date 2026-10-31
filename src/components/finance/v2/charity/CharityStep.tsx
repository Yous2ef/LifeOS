import { Button } from "@/components/ui/Button";
import type { CharityPreview } from "@/utils/finance/charity";
import { COPY, payNowLabel } from "./copy";

/** What the income form does about charity when it saves */
export type CharityChoice =
    | { action: "already-paid"; amount: number }
    | { action: "pay-now"; amount: number };

interface CharityStepProps {
    preview: CharityPreview;
    rate: number;
    hasProject: boolean;
    /** A donation from a non-charity fund within a week: maybe the same money */
    showDoubleCountHint: boolean;
    formatAmount: (amount: number) => string;
    onChoose: (choice: CharityChoice | null) => void;
    submitLabel: string;
}

/**
 * B2: cards for work costs, the share of net and credit used, then
 * "Already paid" · "Pay x now" · "Later". Every button saves the income.
 */
export const CharityStep = ({
    preview,
    rate,
    hasProject,
    showDoubleCountHint,
    formatAmount,
    onChoose,
    submitLabel,
}: CharityStepProps) => {
    const cards = [
        {
            label: hasProject ? COPY.workCostsOnProject : COPY.workCosts,
            value: preview.workCosts,
        },
        { label: COPY.shareOfNet(rate), value: preview.share },
        { label: COPY.creditUsed, value: preview.creditUsed },
    ];
    const toPay = preview.toPay;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="p-3 rounded-xl bg-teal-500/10 text-center">
                        <p className="text-[11px] leading-tight text-muted-foreground">
                            {card.label}
                        </p>
                        <p className="mt-1 font-semibold tabular-nums">
                            {formatAmount(card.value)}
                        </p>
                    </div>
                ))}
            </div>
            {preview.paidForThis > 0 && (
                <p className="text-xs text-muted-foreground text-center tabular-nums">
                    {COPY.alreadyPaid}: {formatAmount(preview.paidForThis)}
                </p>
            )}

            {toPay > 0 ? (
                <div className="space-y-2">
                    <Button
                        onClick={() =>
                            onChoose({ action: "pay-now", amount: toPay })
                        }
                        className="w-full rounded-xl bg-teal-500 hover:bg-teal-600 text-white">
                        {payNowLabel(toPay, formatAmount)}
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() =>
                                onChoose({ action: "already-paid", amount: toPay })
                            }
                            className="flex-1 rounded-xl">
                            {COPY.alreadyPaid}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => onChoose(null)}
                            className="flex-1 rounded-xl">
                            {COPY.later}
                        </Button>
                    </div>
                    {showDoubleCountHint && (
                        <p className="text-xs text-amber-500">
                            {COPY.doubleCountHint}
                        </p>
                    )}
                </div>
            ) : (
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground text-center">
                        {COPY.coveredByCredit}
                    </p>
                    <Button
                        onClick={() => onChoose(null)}
                        className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600">
                        {submitLabel}
                    </Button>
                </div>
            )}
        </div>
    );
};
