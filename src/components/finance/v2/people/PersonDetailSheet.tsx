import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type {
    Account,
    Loan,
    LoanPayment,
    Person,
} from "@/types/modules/finance";
import { summarizeLoan, type PersonSummary } from "@/utils/finance/loans";
import { BottomSheet } from "../modals/BottomSheet";
import { GlassCard } from "../layout/GlassCard";
import {
    DIRECTION_LABELS,
    LOAN_HINT,
    STATUS_LABELS,
    balanceLabel,
    netColor,
    signedAmount,
} from "./copy";

interface PersonDetailSheetProps {
    person: Person | null;
    onClose: () => void;
    summary?: PersonSummary;
    loans: Loan[];
    paymentsByLoan: Map<string, LoanPayment[]>;
    accounts: Account[];
    formatCurrency: (amount: number) => string;
    formatAmount: (amount: number) => string;
    onNewLoan: () => void;
    onSettlePerson: () => void;
    onSettleLoan: (loan: Loan) => void;
    onEditLoan: (loan: Loan) => void;
    onDeleteLoan: (loan: Loan) => void;
    onDeletePayment: (payment: LoanPayment) => void;
    onRename: (name: string) => void;
    onDelete: () => void;
}

const formatDate = (date: string) =>
    new Date(date.slice(0, 10)).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

/** One person's loans, newest first, each with its repayments */
export const PersonDetailSheet = ({
    person,
    onClose,
    summary,
    loans,
    paymentsByLoan,
    accounts,
    formatCurrency,
    formatAmount,
    onNewLoan,
    onSettlePerson,
    onSettleLoan,
    onEditLoan,
    onDeleteLoan,
    onDeletePayment,
    onRename,
    onDelete,
}: PersonDetailSheetProps) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [name, setName] = useState("");

    useEffect(() => {
        setIsRenaming(false);
        setName(person?.name ?? "");
    }, [person?.id, person?.name]);

    const net = summary?.net ?? 0;
    const accountName = (id: string) =>
        accounts.find((a) => a.id === id)?.name ?? "Account";
    const sortedLoans = [...loans].sort(
        (a, b) =>
            b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
    );

    return (
        <BottomSheet
            isOpen={!!person}
            onClose={onClose}
            title={person?.name}
            className="md:max-w-xl md:mx-auto">
            {person && (
                <div className="space-y-5 pb-6">
                    {/* Balance */}
                    <div className="text-center">
                        <p
                            className={cn(
                                "text-3xl font-bold tabular-nums",
                                netColor(net),
                            )}>
                            {signedAmount(net, formatAmount)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {balanceLabel(net, formatAmount)}
                        </p>
                        <div className="flex gap-2 mt-4">
                            {net !== 0 && (
                                <Button
                                    onClick={onSettlePerson}
                                    className="flex-1 rounded-xl bg-violet-500 hover:bg-violet-600 text-white">
                                    Settle up
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                onClick={onNewLoan}
                                className="flex-1 rounded-xl gap-2">
                                <Plus className="w-4 h-4" />
                                New loan
                            </Button>
                        </div>
                    </div>

                    {/* Loans */}
                    <div className="space-y-3">
                        {sortedLoans.map((loan) => {
                            const payments = [
                                ...(paymentsByLoan.get(loan.id) ?? []),
                            ].sort((a, b) => b.date.localeCompare(a.date));
                            const { outstanding, status } = summarizeLoan(
                                loan,
                                payments,
                            );
                            return (
                                <GlassCard
                                    key={loan.id}
                                    intensity="light"
                                    padding="sm"
                                    className="space-y-2">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium">
                                                {DIRECTION_LABELS[loan.direction]}{" "}
                                                <span className="tabular-nums">
                                                    {formatCurrency(loan.amount)}
                                                </span>
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(loan.date)} ·{" "}
                                                {accountName(loan.accountId)}
                                                {loan.dueDate &&
                                                    ` · Due ${formatDate(loan.dueDate)}`}
                                            </p>
                                            {loan.notes && (
                                                <p
                                                    className="text-xs text-muted-foreground mt-1"
                                                    dir="auto">
                                                    {loan.notes}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span
                                                className={cn(
                                                    "inline-block text-[11px] px-2 py-0.5 rounded-full",
                                                    status === "settled"
                                                        ? "bg-emerald-500/10 text-emerald-500"
                                                        : "bg-violet-500/10 text-violet-500",
                                                )}>
                                                {STATUS_LABELS[status]}
                                            </span>
                                            {outstanding > 0 && (
                                                <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                                                    {formatAmount(outstanding)} left
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {payments.length > 0 && (
                                        <ul className="border-t border-border/50 pt-2 space-y-1">
                                            {payments.map((payment) => (
                                                <li
                                                    key={payment.id}
                                                    className="flex items-center gap-2 text-xs">
                                                    <span className="text-muted-foreground flex-1">
                                                        {payment.isOffset
                                                            ? `Offset ${formatDate(payment.date)} · no money moved`
                                                            : `Repaid ${formatDate(payment.date)} · ${accountName(payment.accountId)}`}
                                                    </span>
                                                    <span className="tabular-nums font-medium">
                                                        {formatCurrency(payment.amount)}
                                                    </span>
                                                    {/* Offsets come in pairs across loans; they go with their loan */}
                                                    {!payment.isOffset && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                onDeletePayment(payment)
                                                            }
                                                            title="Delete repayment"
                                                            aria-label="Delete repayment"
                                                            className="p-1 rounded-md text-muted-foreground hover:text-red-500">
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    <div className="flex items-center gap-2 pt-1">
                                        {outstanding > 0 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onSettleLoan(loan)}
                                                className="rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:bg-violet-500/20">
                                                Settle up
                                            </Button>
                                        )}
                                        <div className="flex-1" />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEditLoan(loan)}
                                            title="Edit loan"
                                            aria-label="Edit loan"
                                            className="w-8 h-8 rounded-full">
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDeleteLoan(loan)}
                                            title="Delete loan"
                                            aria-label="Delete loan"
                                            className="w-8 h-8 rounded-full text-red-500">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </GlassCard>
                            );
                        })}
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        {LOAN_HINT}
                    </p>

                    {/* Person */}
                    <div className="border-t border-border/50 pt-4">
                        {isRenaming ? (
                            <div className="flex gap-2">
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    dir="auto"
                                    autoFocus
                                    aria-label="Name"
                                    className="rounded-xl"
                                />
                                <Button
                                    onClick={() => {
                                        if (!name.trim()) return;
                                        onRename(name.trim());
                                        setIsRenaming(false);
                                    }}
                                    disabled={!name.trim()}
                                    className="rounded-xl">
                                    Save
                                </Button>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsRenaming(true)}
                                    className="rounded-lg gap-2">
                                    <Pencil className="w-4 h-4" />
                                    Rename
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onDelete}
                                    className="rounded-lg gap-2 text-red-500">
                                    <Trash2 className="w-4 h-4" />
                                    Delete person
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </BottomSheet>
    );
};
