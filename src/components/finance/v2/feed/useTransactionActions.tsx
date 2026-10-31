import { useCallback, useMemo, useState } from "react";
import toast from "react-hot-toast";
import type {
    AccountTransfer,
    Expense,
    Income,
    Transaction,
} from "@/types/modules/finance";
import type { IncomeFormData } from "../modals/IncomeModal";
import type { ExpenseFormData } from "../modals/ExpenseModal";

type Restorable =
    | { kind: "income"; record: Income }
    | { kind: "expense"; record: Expense }
    | { kind: "transfer"; record: AccountTransfer };

interface TransactionActionsDeps {
    incomes: Income[];
    expenses: Expense[];
    transfers: AccountTransfer[];
    deleteIncome: (id: string) => void;
    deleteExpense: (id: string) => { success: boolean; error?: string };
    deleteTransfer: (id: string) => void;
    restoreRecord: (restored: Restorable) => void;
}

const LABELS: Record<Transaction["type"], string> = {
    income: "income",
    expense: "expense",
    transfer: "transfer",
};

const capitalize = (text: string) => text[0].toUpperCase() + text.slice(1);

/** Edit and delete (with confirm + undo) for rows of the transaction feed */
export const useTransactionActions = ({
    incomes,
    expenses,
    transfers,
    deleteIncome,
    deleteExpense,
    deleteTransfer,
    restoreRecord,
}: TransactionActionsDeps) => {
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    const startEdit = useCallback(
        (transaction: Transaction) => {
            if (transaction.type === "income") {
                setEditingIncome(
                    incomes.find((i) => i.id === transaction.id) ?? null,
                );
            } else if (transaction.type === "expense") {
                setEditingExpense(
                    expenses.find((e) => e.id === transaction.id) ?? null,
                );
            }
        },
        [incomes, expenses],
    );

    const stopEdit = useCallback(() => {
        setEditingIncome(null);
        setEditingExpense(null);
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

    const findRecord = useCallback(
        (transaction: Transaction): Restorable | null => {
            if (transaction.type === "income") {
                const record = incomes.find((i) => i.id === transaction.id);
                return record ? { kind: "income", record } : null;
            }
            if (transaction.type === "expense") {
                const record = expenses.find((e) => e.id === transaction.id);
                return record ? { kind: "expense", record } : null;
            }
            const record = transfers.find((t) => t.id === transaction.id);
            return record ? { kind: "transfer", record } : null;
        },
        [incomes, expenses, transfers],
    );

    const handleDelete = useCallback(
        (transaction: Transaction) => {
            const restorable = findRecord(transaction);
            if (!restorable) return;
            const label = LABELS[transaction.type];
            if (!window.confirm(`Delete this ${label}?`)) return;

            if (restorable.kind === "expense") {
                const result = deleteExpense(transaction.id);
                if (!result.success) {
                    toast.error(result.error ?? "Couldn't delete this expense");
                    return;
                }
            } else if (restorable.kind === "income") {
                deleteIncome(transaction.id);
            } else {
                deleteTransfer(transaction.id);
            }

            toast(
                (t) => (
                    <span className="flex items-center gap-3">
                        {capitalize(label)} deleted
                        <button
                            className="font-semibold text-primary"
                            onClick={() => {
                                restoreRecord(restorable);
                                toast.dismiss(t.id);
                            }}>
                            Undo
                        </button>
                    </span>
                ),
                { duration: 6000 },
            );
        },
        [findRecord, deleteExpense, deleteIncome, deleteTransfer, restoreRecord],
    );

    return {
        editingIncome,
        editingExpense,
        incomeInitialData,
        expenseInitialData,
        startEdit,
        stopEdit,
        handleDelete,
    };
};
