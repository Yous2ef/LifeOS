import type {
    Account,
    AccountTransfer,
    Expense,
    FinanceData,
    Income,
    Installment,
} from "@/types/modules/finance";
import { normalizeFinanceData } from "../normalize";

const STAMP = "2026-10-01T00:00:00.000Z";

export const account = (over: Partial<Account> = {}): Account => ({
    id: "acc_1",
    name: "Cash",
    type: "cash",
    initialBalance: 0,
    color: "#000",
    icon: "💵",
    currency: "EGP",
    isDefault: true,
    isActive: true,
    order: 1,
    createdAt: STAMP,
    updatedAt: STAMP,
    ...over,
});

export const income = (over: Partial<Income> = {}): Income => ({
    id: "inc_1",
    title: "Salary",
    amount: 100,
    currency: "EGP",
    categoryId: "cat_salary",
    type: "variable",
    status: "received",
    frequency: "one-time",
    accountId: "acc_1",
    actualDate: "2026-10-10",
    isRecurring: false,
    tags: [],
    createdAt: STAMP,
    updatedAt: STAMP,
    ...over,
});

export const expense = (over: Partial<Expense> = {}): Expense => ({
    id: "exp_1",
    title: "Food",
    amount: 30,
    currency: "EGP",
    categoryId: "cat_food",
    type: "variable",
    paymentMethod: "cash",
    accountId: "acc_1",
    date: "2026-10-11",
    isRecurring: false,
    tags: [],
    createdAt: STAMP,
    updatedAt: STAMP,
    ...over,
});

export const transfer = (
    over: Partial<AccountTransfer> = {},
): AccountTransfer => ({
    id: "tr_1",
    fromAccountId: "acc_1",
    toAccountId: "acc_2",
    amount: 20,
    date: "2026-10-12",
    createdAt: STAMP,
    updatedAt: STAMP,
    ...over,
});

export const installment = (over: Partial<Installment> = {}): Installment => ({
    id: "inst_1",
    title: "Phone",
    totalAmount: 1200,
    paidAmount: 0,
    installmentAmount: 100,
    totalInstallments: 12,
    paidInstallments: 0,
    frequency: "monthly",
    categoryId: "cat_food",
    linkedAccountId: "acc_1",
    startDate: "2026-10-01",
    nextPaymentDate: "2026-11-01",
    endDate: "2027-10-01",
    status: "active",
    autoPayment: false,
    remindDaysBefore: 3,
    payments: [],
    createdAt: STAMP,
    updatedAt: STAMP,
    ...over,
});

export const financeData = (over: Partial<FinanceData> = {}): FinanceData =>
    normalizeFinanceData({ categories: [], incomeCategories: [], ...over });
