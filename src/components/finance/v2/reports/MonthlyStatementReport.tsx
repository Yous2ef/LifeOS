import { useMemo, useState, type ReactNode } from "react";
import {
    AlertTriangle,
    ArrowLeftRight,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    FileText,
    GitCompareArrows,
    HandCoins,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { firstRecordDate } from "@/utils/finance/reports";
import {
    computeMonthlyStatement,
    nextMonth,
    previousMonth,
    statementMonthOf,
    statementPeriod,
    type StatementLine,
    type StatementScope,
    type StatementSource,
} from "@/utils/finance/statements";
import { monthLabel, signed, type ReportFormat } from "./chartTheme";
import { ReportCard } from "./ReportCard";

interface MonthlyStatementReportProps {
    source: StatementSource;
    scope: StatementScope;
    /** settings.monthStartDay: financial months, as budgets use */
    startDay: number;
    today: string;
    format: ReportFormat;
    /** Fund scope switch, shown in the card header */
    scopeControl?: ReactNode;
}

/** Every financial month from the first record to the current one, newest first */
const availableMonths = (source: StatementSource, startDay: number, today: string) => {
    const current = statementMonthOf(today, startDay);
    const firstDate = firstRecordDate(source);
    const first = firstDate ? statementMonthOf(firstDate, startDay) : current;
    const months: string[] = [];
    for (let month = first < current ? first : current; month <= current; month = nextMonth(month)) {
        months.push(month);
    }
    return months.reverse();
};

const Row = ({
    label,
    value,
    strong,
    muted,
    indent,
}: {
    label: ReactNode;
    value: string;
    strong?: boolean;
    muted?: boolean;
    indent?: boolean;
}) => (
    <div
        className={cn(
            "flex items-center justify-between gap-3 py-1.5",
            indent && "pl-6",
            strong && "font-bold",
            muted && "text-muted-foreground text-sm",
        )}>
        <span className="min-w-0 truncate">{label}</span>
        <span className="tabular-nums shrink-0">{value}</span>
    </div>
);

const CategoryLines = ({
    lines,
    format,
}: {
    lines: StatementLine[];
    format: ReportFormat;
}) =>
    lines.length === 0 ? (
        <Row indent muted label="None" value="—" />
    ) : (
        <>
            {lines.map((line) => (
                <Row
                    key={line.categoryId}
                    indent
                    muted
                    label={`${line.icon ?? ""} ${line.name}`.trim()}
                    value={format.currency(line.amount)}
                />
            ))}
        </>
    );

const change = (current: number, previous: number) =>
    previous === 0 ? null : ((current - previous) / Math.abs(previous)) * 100;

/**
 * Monthly statement: opening → + income → − expenses = net, then loans and
 * transfers on their own lines (never income or expense), closing at the
 * balance computeBalances gives for the last day.
 */
export const MonthlyStatementReport = ({
    source,
    scope,
    startDay,
    today,
    format,
    scopeControl,
}: MonthlyStatementReportProps) => {
    const months = useMemo(
        () => availableMonths(source, startDay, today),
        [source, startDay, today],
    );
    const [month, setMonth] = useState(() => statementMonthOf(today, startDay));
    const selected = months.includes(month) ? month : months[0];
    const index = months.indexOf(selected);

    const statement = useMemo(
        () => computeMonthlyStatement(source, statementPeriod(selected, startDay), scope),
        [source, selected, startDay, scope],
    );
    const previous = useMemo(
        () =>
            computeMonthlyStatement(
                source,
                statementPeriod(previousMonth(selected), startDay),
                scope,
            ),
        [source, selected, startDay, scope],
    );

    const { loans, transfers } = statement;
    const hasLoans = loans.borrowed + loans.lent + loans.repaidToYou + loans.youRepaid > 0;
    const hasTransfers = transfers.in + transfers.out + transfers.internal > 0;

    const comparison = [
        { label: "Income", now: statement.income.total, before: previous.income.total, good: 1 },
        { label: "Expenses", now: statement.expense.total, before: previous.expense.total, good: -1 },
        { label: "Net", now: statement.net, before: previous.net, good: 1 },
        { label: "Closing balance", now: statement.closing, before: previous.closing, good: 1 },
    ];

    return (
        <div className="space-y-6">
            <ReportCard
                icon={<FileText className="w-5 h-5" />}
                gradient="from-slate-600 to-slate-800"
                title={`Statement · ${monthLabel(selected)}`}
                subtitle={
                    <span dir="ltr">
                        {format.date(statement.start)} – {format.date(statement.end)}
                    </span>
                }
                action={scopeControl}>
                <div className="flex items-center gap-2 mb-5">
                    <button
                        type="button"
                        aria-label="Previous month"
                        disabled={index >= months.length - 1}
                        onClick={() => setMonth(months[index + 1])}
                        className="h-10 w-10 grid place-items-center rounded-xl bg-muted/50 hover:bg-muted disabled:opacity-40">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <select
                        value={selected}
                        onChange={(e) => setMonth(e.target.value)}
                        className="h-10 px-3 rounded-xl bg-background border border-border text-sm flex-1 sm:flex-none">
                        {months.map((m) => (
                            <option key={m} value={m}>
                                {monthLabel(m)}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        aria-label="Next month"
                        disabled={index <= 0}
                        onClick={() => setMonth(months[index - 1])}
                        className="h-10 w-10 grid place-items-center rounded-xl bg-muted/50 hover:bg-muted disabled:opacity-40">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="divide-y divide-border/60">
                    <Row strong label="Opening balance" value={format.currency(statement.opening)} />

                    <div className="py-2">
                        <Row
                            strong
                            label={<span className="text-emerald-500">Income</span>}
                            value={`+${format.currency(statement.income.total)}`}
                        />
                        <CategoryLines lines={statement.income.byCategory} format={format} />
                    </div>

                    <div className="py-2">
                        <Row
                            strong
                            label={<span className="text-rose-500">Expenses</span>}
                            value={`−${format.currency(statement.expense.total)}`}
                        />
                        <CategoryLines lines={statement.expense.byCategory} format={format} />
                    </div>

                    <Row
                        strong
                        label="Net (income − expenses)"
                        value={signed(statement.net, format.currency)}
                    />

                    <div className="py-2">
                        <Row
                            strong
                            label={
                                <span className="inline-flex items-center gap-2 text-violet-500">
                                    <HandCoins className="w-4 h-4" /> Loans
                                </span>
                            }
                            value={signed(loans.net, format.currency)}
                        />
                        <p className="text-xs text-muted-foreground pb-1">
                            Loans never count as income or expense.
                        </p>
                        {hasLoans ? (
                            <>
                                {loans.borrowed > 0 && (
                                    <Row indent muted label="Borrowed" value={`+${format.currency(loans.borrowed)}`} />
                                )}
                                {loans.repaidToYou > 0 && (
                                    <Row indent muted label="Repaid to you" value={`+${format.currency(loans.repaidToYou)}`} />
                                )}
                                {loans.lent > 0 && (
                                    <Row indent muted label="Lent" value={`−${format.currency(loans.lent)}`} />
                                )}
                                {loans.youRepaid > 0 && (
                                    <Row indent muted label="You repaid" value={`−${format.currency(loans.youRepaid)}`} />
                                )}
                            </>
                        ) : (
                            <Row indent muted label="None" value="—" />
                        )}
                    </div>

                    <div className="py-2">
                        <Row
                            strong
                            label={
                                <span className="inline-flex items-center gap-2 text-sky-500">
                                    <ArrowLeftRight className="w-4 h-4" /> Transfers
                                </span>
                            }
                            value={signed(transfers.net, format.currency)}
                        />
                        {hasTransfers ? (
                            <>
                                {transfers.in > 0 && (
                                    <Row indent muted label="Moved in" value={`+${format.currency(transfers.in)}`} />
                                )}
                                {transfers.out > 0 && (
                                    <Row indent muted label="Moved out" value={`−${format.currency(transfers.out)}`} />
                                )}
                                {transfers.internal > 0 && (
                                    <Row
                                        indent
                                        muted
                                        label="Moved between your places (no change)"
                                        value={format.currency(transfers.internal)}
                                    />
                                )}
                            </>
                        ) : (
                            <Row indent muted label="None" value="—" />
                        )}
                    </div>

                    <Row strong label="Closing balance" value={format.currency(statement.closing)} />
                </div>

                <p
                    className={cn(
                        "mt-4 text-xs flex items-center gap-1.5",
                        statement.difference === 0 ? "text-muted-foreground" : "text-amber-500",
                    )}>
                    {statement.difference === 0 ? (
                        <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Opening + net + loans + transfers = closing balance
                        </>
                    ) : (
                        <>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Off by {format.currency(Math.abs(statement.difference))}
                        </>
                    )}
                </p>
            </ReportCard>

            <ReportCard
                icon={<GitCompareArrows className="w-5 h-5" />}
                gradient="from-sky-500 to-indigo-500"
                title="Compared with previous month"
                subtitle={monthLabel(previousMonth(selected))}>
                <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 gap-y-2 text-sm">
                    <span className="text-xs text-muted-foreground" />
                    <span className="text-xs text-muted-foreground text-right">
                        {monthLabel(previousMonth(selected))}
                    </span>
                    <span className="text-xs text-muted-foreground text-right">
                        {monthLabel(selected)}
                    </span>
                    {comparison.map((item) => {
                        const pct = change(item.now, item.before);
                        const better = (item.now - item.before) * item.good > 0;
                        return (
                            <div key={item.label} className="contents">
                                <span className="font-medium">{item.label}</span>
                                <span className="tabular-nums text-right text-muted-foreground">
                                    {format.currency(item.before)}
                                </span>
                                <span className="tabular-nums text-right font-semibold">
                                    {format.currency(item.now)}
                                    {pct !== null && item.now !== item.before && (
                                        <span
                                            className={cn(
                                                "block text-xs font-medium",
                                                better ? "text-emerald-500" : "text-rose-500",
                                            )}>
                                            {pct > 0 ? "↑" : "↓"} {Math.abs(pct).toFixed(0)}%
                                        </span>
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </ReportCard>
        </div>
    );
};
