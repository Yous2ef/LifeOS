import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type {
    AccountTransfer,
    Expense,
    Income,
    Installment,
    Loan,
    LoanPayment,
    Transaction,
} from "@/types/modules/finance";
import type { RestorableRecord } from "@/hooks/useFinance";
import { isLivePaymentExpense } from "@/utils/finance/installments";
import { showUndoToast } from "./undoToast";
import { withRepaymentsText } from "../people/copy";
import { COPY as CHARITY_COPY } from "../charity/copy";
import type { IncomeFormData } from "../modals/IncomeModal";
import type { ExpenseFormData } from "../modals/ExpenseModal";
import type { TransferFormData } from "../modals/TransferModal";

interface TransactionActionsDeps {
    incomes: Income[];
    expenses: Expense[];
    transfers: AccountTransfer[];
    installments: Installment[];
    loans: Loan[];
    loanPayments: LoanPayment[];
    deleteIncome: (id: string) => void;
    deleteExpense: (id: string) => { success: boolean; error?: string };
    deleteTransfer: (id: string) => void;
    deleteLoan: (id: string) => void;
    deleteLoanPayment: (id: string) => void;
    restoreRecord: (restored: RestorableRecord) => {
        success: boolean;
        error?: string;
    };
    /** Loans are edited from the People page */
    onOpenLoan?: (transaction: Transaction) => void;
}

const LABELS: Record<Transaction["type"], string> = {
    income: "income",
    expense: "expense",
    transfer: "transfer",
    loan: "loan",
};

const labelOf = (transaction: Transaction) =>
    transaction.loan?.kind === "repayment"
        ? "repayment"
        : LABELS[transaction.type];

const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);

/** Edit and delete (with confirm + undo) for rows of the transaction feed */
export const useTransactionActions = ({
    incomes,
    expenses,
    transfers,
    installments,
    loans,
    loanPayments,
    deleteIncome,
    deleteExpense,
    deleteTransfer,
    deleteLoan,
    deleteLoanPayment,
    restoreRecord,
    onOpenLoan,
}: TransactionActionsDeps) => {
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [editingTransfer, setEditingTransfer] =
        useState<AccountTransfer | null>(null);

    const startEdit = useCallback(
        (transaction: Transaction) => {
            if (transaction.type === "income") {
                setEditingIncome(
                    incomes.find((i) => i.id === transaction.id) ?? null,
                );
            } else if (transaction.type === "expense") {
                const expense = expenses.find((e) => e.id === transaction.id);
                // Mirrors the delete guard: the payment owns amount and account
                if (expense && isLivePaymentExpense(expense, installments)) {
                    toast.error("Edit this payment from the installment");
                    return;
                }
                setEditingExpense(expense ?? null);
            } else if (transaction.type === "loan") {
                onOpenLoan?.(transaction);
            } else {
                setEditingTransfer(
                    transfers.find((t) => t.id === transaction.id) ?? null,
                );
            }
        },
        [incomes, expenses, transfers, installments, onOpenLoan],
    );

    const stopEdit = useCallback(() => {
        setEditingIncome(null);
        setEditingExpense(null);
        setEditingTransfer(null);
    }, []);

    // Memoised so the modal's reset effect doesn't wipe edits on every render
    const incomeInitialData = useMemo<Partial<IncomeFormData> | undefined>(
        () => editingIncome ?? undefined,
        [editingIncome],
    );
    const expenseInitialData = useMemo<Partial<ExpenseFormData> | undefined>(
        () => editingExpense ?? undefined,
        [editingExpense],
    );
    const transferInitialData = useMemo<
        Partial<TransferFormData> | undefined
    >(() => editingTransfer ?? undefined, [editingTransfer]);

    const findRecord = useCallback(
        (transaction: Transaction): RestorableRecord | null => {
            if (transaction.type === "income") {
                const record = incomes.find((i) => i.id === transaction.id);
                return record ? { kind: "income", record } : null;
            }
            if (transaction.type === "expense") {
                const record = expenses.find((e) => e.id === transaction.id);
                return record ? { kind: "expense", record } : null;
            }
            if (transaction.loan?.kind === "repayment") {
                const record = loanPayments.find((p) => p.id === transaction.id);
                return record ? { kind: "loanPayment", record } : null;
            }
            if (transaction.loan) {
                const record = loans.find((l) => l.id === transaction.id);
                const payments = loanPayments.filter(
                    (p) => p.loanId === transaction.id,
                );
                return record ? { kind: "loan", record, payments } : null;
            }
            const record = transfers.find((t) => t.id === transaction.id);
            return record ? { kind: "transfer", record } : null;
        },
        [incomes, expenses, transfers, loans, loanPayments],
    );

    const handleDelete = useCallback(
        (transaction: Transaction) => {
            const restorable = findRecord(transaction);
            if (!restorable) return;
            const label = labelOf(transaction);
            const extra =
                restorable.kind === "loan"
                    ? withRepaymentsText(restorable.payments.length)
                    : "";
            // "Already paid" lives on the income, so it goes with it
            const charityNote =
                restorable.kind === "income" &&
                (restorable.record.charityPaidOutsideAmount ?? 0) > 0
                    ? ` ${CHARITY_COPY.paymentRemovedWithIncome}`
                    : "";
            if (!window.confirm(`Delete this ${label}${extra}?${charityNote}`))
                return;

            if (restorable.kind === "expense") {
                const result = deleteExpense(transaction.id);
                if (!result.success) {
                    toast.error(result.error ?? "Couldn't delete this expense");
                    return;
                }
            } else if (restorable.kind === "income") {
                deleteIncome(transaction.id);
            } else if (restorable.kind === "loan") {
                deleteLoan(transaction.id);
            } else if (restorable.kind === "loanPayment") {
                deleteLoanPayment(transaction.id);
            } else {
                deleteTransfer(transaction.id);
            }

            showUndoToast(`${capitalize(label)} deleted`, () =>
                restoreRecord(restorable),
            );
        },
        [
            findRecord,
            deleteExpense,
            deleteIncome,
            deleteTransfer,
            deleteLoan,
            deleteLoanPayment,
            restoreRecord,
        ],
    );

    return {
        editingIncome,
        editingExpense,
        editingTransfer,
        incomeInitialData,
        expenseInitialData,
        transferInitialData,
        startEdit,
        stopEdit,
        handleDelete,
    };
};
