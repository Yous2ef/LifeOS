import type {
    Expense,
    FinanceData,
    Installment,
    InstallmentPayment,
} from "@/types/modules/finance";
import type { InstallmentFormData } from "@/components/finance/v2/modals/InstallmentModal";

type NewInstallment = Omit<
    Installment,
    | "id"
    | "createdAt"
    | "updatedAt"
    | "payments"
    | "paidAmount"
    | "paidInstallments"
>;

/**
 * Fields the installment form may change on an existing installment.
 * Payments, paid totals, status, category and end date are owned by the
 * payment flow — sending them from the form used to wipe payment history.
 */
export const installmentFormToUpdates = (
    form: InstallmentFormData,
): Partial<Installment> => ({
    title: form.title,
    totalAmount: form.totalAmount,
    installmentAmount: form.installmentAmount,
    totalInstallments: form.totalInstallments,
    frequency: form.frequency,
    startDate: form.startDate,
    nextPaymentDate: form.nextDueDate,
    description: form.notes,
    ...(form.linkedAccountId ? { linkedAccountId: form.linkedAccountId } : {}),
});

export const installmentFormToNew = (
    form: InstallmentFormData,
    defaults: { accountId: string; categoryId: string },
): NewInstallment => ({
    title: form.title,
    totalAmount: form.totalAmount,
    installmentAmount: form.installmentAmount,
    totalInstallments: form.totalInstallments,
    frequency: form.frequency,
    linkedAccountId: form.linkedAccountId || defaults.accountId,
    startDate: form.startDate,
    nextPaymentDate: form.nextDueDate,
    description: form.notes,
    categoryId: defaults.categoryId,
    endDate: form.startDate, // Will be calculated
    status: "active",
    autoPayment: false,
    remindDaysBefore: 3,
});

/** An expense that pays an installment payment which still exists */
export const isLivePaymentExpense = (
    expense: Pick<Expense, "linkedPaymentId">,
    installments: Installment[],
): boolean =>
    !!expense.linkedPaymentId &&
    installments.some((inst) =>
        inst.payments.some((p) => p.id === expense.linkedPaymentId),
    );

const countsAsPaid = (payment: InstallmentPayment) =>
    payment.status === "paid" || payment.status === "late";

/** Paid totals and status derived from an installment's payment list */
export const summarizeInstallmentPayments = (
    installment: Installment,
    payments: InstallmentPayment[],
): Pick<Installment, "paidAmount" | "paidInstallments" | "status"> => {
    const paidAmount = Math.max(
        0,
        payments.filter(countsAsPaid).reduce((sum, p) => sum + p.amount, 0),
    );
    const paidInstallments = Math.min(
        installment.totalInstallments,
        Math.floor(paidAmount / installment.installmentAmount),
    );
    const isCompleted = paidInstallments >= installment.totalInstallments;
    return {
        paidAmount,
        paidInstallments,
        status: isCompleted
            ? "completed"
            : installment.status === "completed"
              ? "active"
              : installment.status,
    };
};

export interface InstallmentMismatch {
    installmentId: string;
    title: string;
    paidAmount: number;
    linkedCash: number; // linked expenses − linked refund incomes
}

/**
 * Installments whose recorded paidAmount isn't backed by linked cash
 * movements. Balances only count the linked expenses/incomes, so a mismatch
 * means the account balance differs from what the old formula showed.
 */
export const findInstallmentMismatches = (
    data: Pick<FinanceData, "installments" | "expenses" | "incomes">,
): InstallmentMismatch[] =>
    data.installments.flatMap((installment) => {
        const paidOut = data.expenses
            .filter((e) => e.linkedInstallmentId === installment.id)
            .reduce((sum, e) => sum + e.amount, 0);
        const refunded = data.incomes
            .filter((i) => i.linkedInstallmentId === installment.id)
            .reduce((sum, i) => sum + i.amount, 0);
        const linkedCash = paidOut - refunded;
        return Math.abs(linkedCash - installment.paidAmount) > 0.005
            ? [
                  {
                      installmentId: installment.id,
                      title: installment.title,
                      paidAmount: installment.paidAmount,
                      linkedCash,
                  },
              ]
            : [];
    });
