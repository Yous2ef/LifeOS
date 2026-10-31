import { HandHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CharityLedger } from "@/utils/finance/charity";
import { CharityLedgerCards } from "../charity/CharityStrip";
import { COPY, ratePercent } from "../charity/copy";
import { monthLabel, type ReportFormat } from "./chartTheme";
import { ReportCard } from "./ReportCard";

interface CharityLedgerReportProps {
    ledger: CharityLedger;
    rate: number;
    startDate: string;
    format: ReportFormat;
    formatAmount: (amount: number) => string;
}

/** "500" owed, "300 credit" when paid ahead, "0" when settled */
const balanceText = (balance: number, formatAmount: (n: number) => string) =>
    balance < 0 ? `${formatAmount(-balance)} credit` : formatAmount(balance);

/**
 * B4 ledger: the four cards, then one row per month. Every row adds up on its
 * own (opening + owed + carried + extra − paid = balance) and opens at the previous
 * row's balance, so the last balance is what's remaining.
 */
export const CharityLedgerReport = ({
    ledger,
    rate,
    startDate,
    format,
    formatAmount,
}: CharityLedgerReportProps) => {
    const hasCarried = ledger.monthly.some((row) => row.carried !== 0);
    const hasPledged = ledger.monthly.some((row) => row.pledged !== 0);
    const rows = [...ledger.monthly].reverse();

    return (
        <ReportCard
            icon={<HandHeart className="w-5 h-5" />}
            gradient="from-teal-500 to-emerald-500"
            title="Charity ledger"
            subtitle={`${ratePercent(rate)} of net earnings since ${format.date(startDate)}`}>
            <CharityLedgerCards ledger={ledger} rate={rate} formatAmount={formatAmount} />

            {rows.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                    Nothing owed or paid yet.
                </p>
            ) : (
                <div className="mt-5 overflow-x-auto -mx-2">
                    <table className="w-full text-sm min-w-[520px]">
                        <thead>
                            <tr className="text-xs text-muted-foreground text-right">
                                <th className="text-left font-medium px-2 py-2">Month</th>
                                <th className="font-medium px-2 py-2">Opening</th>
                                <th className="font-medium px-2 py-2">Owed</th>
                                {hasCarried && (
                                    <th
                                        className="font-medium px-2 py-2"
                                        title="Work costs beyond earnings, held back for later months">
                                        Carried
                                    </th>
                                )}
                                {hasPledged && (
                                    <th
                                        className="font-medium px-2 py-2"
                                        title="Extra charity added on top of the rate">
                                        {COPY.ledgerPledged}
                                    </th>
                                )}
                                <th className="font-medium px-2 py-2">Paid</th>
                                <th className="font-medium px-2 py-2">Balance</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/60">
                            {rows.map((row) => (
                                <tr key={row.month} className="text-right tabular-nums">
                                    <td className="text-left px-2 py-2 font-medium whitespace-nowrap">
                                        {monthLabel(row.month)}
                                    </td>
                                    <td className="px-2 py-2 text-muted-foreground">
                                        {balanceText(row.opening, formatAmount)}
                                    </td>
                                    <td className="px-2 py-2">{formatAmount(row.owed)}</td>
                                    {hasCarried && (
                                        <td className="px-2 py-2 text-muted-foreground">
                                            {formatAmount(row.carried)}
                                        </td>
                                    )}
                                    {hasPledged && (
                                        <td className="px-2 py-2">
                                            {formatAmount(row.pledged)}
                                        </td>
                                    )}
                                    <td className="px-2 py-2 text-emerald-500">
                                        {formatAmount(row.paid)}
                                    </td>
                                    <td
                                        className={cn(
                                            "px-2 py-2 font-semibold",
                                            row.balance > 0 && "text-amber-500",
                                            row.balance < 0 && "text-emerald-500",
                                        )}>
                                        {balanceText(row.balance, formatAmount)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </ReportCard>
    );
};
