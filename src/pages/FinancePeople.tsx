/**
 * Finance People Page - who owes you, whom you owe, loans and repayments
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, HandCoins, Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useFinance } from "@/hooks/useFinance";
import { GlassCard } from "@/components/finance/v2/layout/GlassCard";
import { PersonCard } from "@/components/finance/v2/people/PersonCard";
import { PersonDetailSheet } from "@/components/finance/v2/people/PersonDetailSheet";
import {
    LoanModal,
    type LoanFormData,
} from "@/components/finance/v2/people/LoanModal";
import {
    SettleUpModal,
    type SettleUpContext,
    type SettleUpFormData,
} from "@/components/finance/v2/people/SettleUpModal";
import {
    LOAN_HINT,
    withRepaymentsText,
} from "@/components/finance/v2/people/copy";
import { showUndoToast } from "@/components/finance/v2/feed/undoToast";
import {
    loanTotals,
    settlementFor,
    summarizePeople,
    type SettleTarget,
} from "@/utils/finance/loans";
import type { Loan, LoanPayment, Person } from "@/types/modules/finance";

export default function FinancePeople() {
    const {
        people,
        loans,
        loanPayments,
        loanPaymentsByLoan,
        accounts,
        funds,
        settings,
        formatCurrency,
        formatAmount,
        balanceOf,
        addPerson,
        updatePerson,
        deletePerson,
        addLoan,
        updateLoan,
        deleteLoan,
        deleteLoanPayment,
        settleUp,
        restoreRecord,
    } = useFinance();
    const location = useLocation();
    const navigate = useNavigate();

    const [viewingPersonId, setViewingPersonId] = useState<string | null>(null);
    const [showLoanModal, setShowLoanModal] = useState(false);
    const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
    const [loanPersonId, setLoanPersonId] = useState<string | undefined>();
    const [settleTarget, setSettleTarget] = useState<SettleTarget | null>(
        null,
    );
    const [settleContext, setSettleContext] = useState<SettleUpContext | null>(
        null,
    );

    // Arriving from the feed (a loan row) or the quick "New loan" action
    useEffect(() => {
        const state = location.state as
            | { personId?: string; newLoan?: boolean }
            | null;
        if (!state) return;
        if (state.personId) setViewingPersonId(state.personId);
        if (state.newLoan) setShowLoanModal(true);
        navigate(location.pathname, { replace: true, state: null });
    }, [location.state, location.pathname, navigate]);

    const loanData = useMemo(
        () => ({ loans, loanPayments }),
        [loans, loanPayments],
    );
    const summaries = useMemo(() => summarizePeople(loanData), [loanData]);
    // Across all funds: this page is about people, not the focused book
    const totals = useMemo(() => loanTotals(loanData), [loanData]);

    // Open balances first (largest first), then settled people by name
    const sortedPeople = useMemo(
        () =>
            [...people].sort((a, b) => {
                const netA = Math.abs(summaries.get(a.id)?.net ?? 0);
                const netB = Math.abs(summaries.get(b.id)?.net ?? 0);
                return netB - netA || a.name.localeCompare(b.name);
            }),
        [people, summaries],
    );

    const viewingPerson = people.find((p) => p.id === viewingPersonId) ?? null;
    const nameOf = (personId: string) =>
        people.find((p) => p.id === personId)?.name ?? "";

    const openSettle = (target: SettleTarget, personId: string) => {
        const { loans: targets, remaining } = settlementFor(loanData, target);
        if (targets.length === 0) return;
        setSettleTarget(target);
        setSettleContext({
            personName: nameOf(personId),
            direction: targets[0].direction,
            remaining,
            accountId: targets[0].accountId,
            fundId: targets[0].fundId,
            minDate: targets[0].date.slice(0, 10),
        });
    };

    const closeSettle = () => {
        setSettleTarget(null);
        setSettleContext(null);
    };

    const openNewLoan = (personId?: string) => {
        setEditingLoan(null);
        setLoanPersonId(personId);
        setShowLoanModal(true);
    };

    const closeLoanModal = () => {
        setShowLoanModal(false);
        setEditingLoan(null);
    };

    const handleSaveLoan = (form: LoanFormData): string | null => {
        const loanFields = {
            direction: form.direction,
            amount: form.amount,
            accountId: form.accountId,
            fundId: form.fundId,
            date: form.date,
            dueDate: form.dueDate,
            notes: form.notes,
        };
        if (editingLoan) {
            const result = updateLoan(editingLoan.id, {
                ...loanFields,
                personId: form.personId,
            });
            return result.success ? null : (result.error ?? "Couldn't save");
        }
        const personId = form.newPersonName
            ? addPerson(form.newPersonName).id
            : form.personId;
        addLoan({ ...loanFields, personId });
        return null;
    };

    const handleSettle = (form: SettleUpFormData): string | null => {
        if (!settleTarget) return null;
        const result = settleUp({ target: settleTarget, ...form });
        return result.success ? null : (result.error ?? "Couldn't save");
    };

    const handleDeleteLoan = (loan: Loan) => {
        const payments = loanPaymentsByLoan.get(loan.id) ?? [];
        const extra = withRepaymentsText(payments.length);
        if (!window.confirm(`Delete this loan${extra}?`)) return;
        deleteLoan(loan.id);
        showUndoToast("Loan deleted", () =>
            restoreRecord({ kind: "loan", record: loan, payments }),
        );
    };

    const handleDeletePayment = (payment: LoanPayment) => {
        if (!window.confirm("Delete this repayment?")) return;
        deleteLoanPayment(payment.id);
        showUndoToast("Repayment deleted", () =>
            restoreRecord({ kind: "loanPayment", record: payment }),
        );
    };

    const handleDeletePerson = (person: Person) => {
        const result = deletePerson(person.id);
        if (!result.success) {
            toast.error(result.error ?? "Couldn't delete");
            return;
        }
        setViewingPersonId(null);
        showUndoToast(`${person.name} deleted`, () =>
            restoreRecord({ kind: "person", record: person }),
        );
    };

    return (
        <div className="min-h-screen bg-background text-primary pb-24">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-white/10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/finance"
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                            aria-label="Back to finance">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-xl font-bold">People</h1>
                            <p className="text-sm text-muted-foreground">
                                {LOAN_HINT}
                            </p>
                        </div>
                        <button
                            onClick={() => openNewLoan()}
                            aria-label="New loan"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium transition-colors">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">New loan</span>
                        </button>
                    </div>
                </div>
            </motion.header>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* Totals */}
                <div className="grid grid-cols-2 gap-4">
                    <GlassCard
                        intensity="light"
                        padding="md"
                        className="text-center">
                        <div className="text-2xl font-bold text-emerald-500 tabular-nums">
                            {formatAmount(totals.receivable)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Owed to you
                        </div>
                    </GlassCard>
                    <GlassCard
                        intensity="light"
                        padding="md"
                        className="text-center">
                        <div className="text-2xl font-bold text-red-500 tabular-nums">
                            {formatAmount(totals.payable)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            You owe
                        </div>
                    </GlassCard>
                </div>

                {/* People */}
                {sortedPeople.length === 0 ? (
                    <GlassCard
                        intensity="light"
                        padding="lg"
                        className="text-center">
                        <HandCoins className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                        <p className="text-muted-foreground">No loans yet</p>
                        <button
                            onClick={() => openNewLoan()}
                            className="mt-4 px-4 py-2 rounded-lg bg-violet-500/20 text-violet-500 hover:bg-violet-500/30 transition-colors">
                            New loan
                        </button>
                    </GlassCard>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {sortedPeople.map((person) => (
                            <PersonCard
                                key={person.id}
                                person={person}
                                summary={summaries.get(person.id)}
                                formatAmount={formatAmount}
                                onOpen={() => setViewingPersonId(person.id)}
                                onSettleUp={() =>
                                    openSettle(
                                        { personId: person.id },
                                        person.id,
                                    )
                                }
                            />
                        ))}
                    </div>
                )}
            </div>

            <PersonDetailSheet
                person={viewingPerson}
                onClose={() => setViewingPersonId(null)}
                summary={
                    viewingPerson ? summaries.get(viewingPerson.id) : undefined
                }
                loans={loans.filter((l) => l.personId === viewingPersonId)}
                paymentsByLoan={loanPaymentsByLoan}
                accounts={accounts}
                formatCurrency={formatCurrency}
                formatAmount={formatAmount}
                onNewLoan={() => openNewLoan(viewingPerson?.id)}
                onSettlePerson={() =>
                    viewingPerson &&
                    openSettle({ personId: viewingPerson.id }, viewingPerson.id)
                }
                onSettleLoan={(loan) =>
                    openSettle({ loanId: loan.id }, loan.personId)
                }
                onEditLoan={(loan) => {
                    setEditingLoan(loan);
                    setShowLoanModal(true);
                }}
                onDeleteLoan={handleDeleteLoan}
                onDeletePayment={handleDeletePayment}
                onRename={(name) =>
                    viewingPerson && updatePerson(viewingPerson.id, { name })
                }
                onDelete={() => viewingPerson && handleDeletePerson(viewingPerson)}
            />

            <LoanModal
                isOpen={showLoanModal}
                onClose={closeLoanModal}
                onSubmit={handleSaveLoan}
                people={people}
                accounts={accounts}
                funds={funds}
                defaultCurrency={settings.defaultCurrency}
                formatCurrency={formatCurrency}
                getFundBalance={balanceOf}
                loan={editingLoan}
                hasRepayments={
                    !!editingLoan &&
                    (loanPaymentsByLoan.get(editingLoan.id)?.length ?? 0) > 0
                }
                defaultPersonId={loanPersonId}
            />

            <SettleUpModal
                context={settleContext}
                onClose={closeSettle}
                onSubmit={handleSettle}
                accounts={accounts}
                funds={funds}
                defaultCurrency={settings.defaultCurrency}
                formatCurrency={formatCurrency}
                getFundBalance={balanceOf}
            />
        </div>
    );
}
