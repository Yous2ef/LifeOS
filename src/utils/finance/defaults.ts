import {
    DEFAULT_CHARITY_SETTINGS,
    DEFAULT_FINANCE_SETTINGS,
    FUND_CHARITY_ID,
    FUND_ME_ID,
    type CharitySettings,
    type ExpenseCategory,
    type FinanceData,
    type FinanceSettings,
    type Fund,
    type IncomeCategory,
} from "@/types/modules/finance";

// Default records get fixed ids so two devices seeding them create the same
// records — cloud merge unions by id, random ids would duplicate them.
/** Order value that puts a new record after every existing one */
export const nextOrder = (list: { order: number }[]): number =>
    Math.max(0, ...list.map((item) => item.order)) + 1;

const defaultId = (prefix: string, name: string): string =>
    `${prefix}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`;

export const DEFAULT_ACCOUNT_ID = "acc_main_cash";

export { FUND_CHARITY_ID, FUND_ME_ID } from "@/types/modules/finance";

// Epoch stamp so a renamed Me on any device always wins the merge over a seed
const SEED_STAMP = new Date(0).toISOString();

export const getDefaultMeFund = (): Fund => ({
    id: FUND_ME_ID,
    name: "Me",
    icon: "🙂",
    color: "#22c55e",
    kind: "personal",
    isVisible: true,
    order: 0,
    createdAt: SEED_STAMP,
    updatedAt: SEED_STAMP,
});

export const getDefaultExpenseCategories = (): ExpenseCategory[] => {
    const now = new Date().toISOString();
    const items: Omit<ExpenseCategory, "id">[] = [
        {
            name: "Rent/Mortgage",
            nameAr: "إيجار/قسط سكن",
            icon: "🏠",
            color: "#3b82f6",
            isEssential: true,
            isDefault: true,
            order: 1,
            createdAt: now,
        },
        {
            name: "Utilities",
            nameAr: "فواتير",
            icon: "⚡",
            color: "#eab308",
            isEssential: true,
            isDefault: true,
            order: 2,
            createdAt: now,
        },
        {
            name: "Transportation",
            nameAr: "مواصلات",
            icon: "🚗",
            color: "#8b5cf6",
            isEssential: true,
            isDefault: true,
            order: 3,
            createdAt: now,
        },
        {
            name: "Groceries",
            nameAr: "طعام وبقالة",
            icon: "🛒",
            color: "#22c55e",
            isEssential: true,
            isDefault: true,
            order: 4,
            createdAt: now,
        },
        {
            name: "Healthcare",
            nameAr: "صحة ودواء",
            icon: "💊",
            color: "#ef4444",
            isEssential: true,
            isDefault: true,
            order: 5,
            createdAt: now,
        },
        {
            name: "Insurance",
            nameAr: "تأمين",
            icon: "🛡️",
            color: "#0ea5e9",
            isEssential: true,
            isDefault: true,
            order: 6,
            createdAt: now,
        },
        {
            name: "Dining Out",
            nameAr: "أكل بره",
            icon: "🍔",
            color: "#f97316",
            isEssential: false,
            isDefault: true,
            order: 7,
            createdAt: now,
        },
        {
            name: "Entertainment",
            nameAr: "ترفيه",
            icon: "🎮",
            color: "#ec4899",
            isEssential: false,
            isDefault: true,
            order: 8,
            createdAt: now,
        },
        {
            name: "Shopping",
            nameAr: "تسوق",
            icon: "🛍️",
            color: "#a855f7",
            isEssential: false,
            isDefault: true,
            order: 9,
            createdAt: now,
        },
        {
            name: "Clothing",
            nameAr: "ملابس",
            icon: "👔",
            color: "#06b6d4",
            isEssential: false,
            isDefault: true,
            order: 10,
            createdAt: now,
        },
        {
            name: "Education",
            nameAr: "تعليم",
            icon: "📚",
            color: "#14b8a6",
            isEssential: false,
            isDefault: true,
            order: 11,
            createdAt: now,
        },
        {
            name: "Gifts",
            nameAr: "هدايا",
            icon: "🎁",
            color: "#f43f5e",
            isEssential: false,
            isDefault: true,
            order: 12,
            createdAt: now,
        },
        {
            name: "Sports",
            nameAr: "رياضة",
            icon: "⚽",
            color: "#10b981",
            isEssential: false,
            isDefault: true,
            order: 13,
            createdAt: now,
        },
        {
            name: "Travel",
            nameAr: "سفر",
            icon: "✈️",
            color: "#6366f1",
            isEssential: false,
            isDefault: true,
            order: 14,
            createdAt: now,
        },
        {
            name: "Subscriptions",
            nameAr: "اشتراكات",
            icon: "📱",
            color: "#8b5cf6",
            isEssential: false,
            isDefault: true,
            order: 15,
            createdAt: now,
        },
        {
            name: "Personal Care",
            nameAr: "عناية شخصية",
            icon: "💇",
            color: "#d946ef",
            isEssential: false,
            isDefault: true,
            order: 16,
            createdAt: now,
        },
        {
            name: "Emergency",
            nameAr: "طوارئ",
            icon: "🚨",
            color: "#dc2626",
            isEssential: true,
            isDefault: true,
            order: 17,
            createdAt: now,
        },
        {
            name: "Other",
            nameAr: "أخرى",
            icon: "📦",
            color: "#64748b",
            isEssential: false,
            isDefault: true,
            order: 18,
            createdAt: now,
        },
    ];
    return items.map((item) => ({ ...item, id: defaultId("exp_cat", item.name) }));
};

export const getDefaultIncomeCategories = (): IncomeCategory[] => {
    const now = new Date().toISOString();
    const items: Omit<IncomeCategory, "id">[] = [
        {
            name: "Salary",
            nameAr: "راتب",
            icon: "💼",
            color: "#3b82f6",
            isDefault: true,
            order: 1,
            createdAt: now,
        },
        {
            name: "Freelance",
            nameAr: "عمل حر",
            icon: "💻",
            color: "#8b5cf6",
            isDefault: true,
            order: 2,
            createdAt: now,
        },
        {
            name: "Business",
            nameAr: "أعمال",
            icon: "🏢",
            color: "#14b8a6",
            isDefault: true,
            order: 3,
            createdAt: now,
        },
        {
            name: "Investment",
            nameAr: "استثمار",
            icon: "📈",
            color: "#22c55e",
            isDefault: true,
            order: 4,
            createdAt: now,
        },
        {
            name: "Bonus",
            nameAr: "مكافأة",
            icon: "🎉",
            color: "#f59e0b",
            isDefault: true,
            order: 5,
            createdAt: now,
        },
        {
            name: "Commission",
            nameAr: "عمولة",
            icon: "💰",
            color: "#10b981",
            isDefault: true,
            order: 6,
            createdAt: now,
        },
        {
            name: "Gift",
            nameAr: "هدية",
            icon: "🎁",
            color: "#ec4899",
            isDefault: true,
            order: 7,
            createdAt: now,
        },
        {
            name: "Refund",
            nameAr: "استرداد",
            icon: "🔄",
            color: "#06b6d4",
            isDefault: true,
            order: 8,
            createdAt: now,
        },
        {
            name: "Rental Income",
            nameAr: "دخل إيجار",
            icon: "🏠",
            color: "#6366f1",
            isDefault: true,
            order: 9,
            createdAt: now,
        },
        {
            name: "Other",
            nameAr: "أخرى",
            icon: "📦",
            color: "#64748b",
            isDefault: true,
            order: 10,
            createdAt: now,
        },
    ];
    return items.map((item) => ({ ...item, id: defaultId("inc_cat", item.name) }));
};

// Fresh arrays each call so no caller can mutate the shared defaults
export const getDefaultCharitySettings = (): CharitySettings => ({
    ...DEFAULT_CHARITY_SETTINGS,
    eligibleIncomeCategoryIds: [],
    donationCategoryIds: [],
});

export const getDefaultFinanceSettings = (): FinanceSettings => ({
    ...DEFAULT_FINANCE_SETTINGS,
    focusedFundIds: [FUND_ME_ID],
    charity: getDefaultCharitySettings(),
});

export const getDefaultCharityFund = (now: string, order: number): Fund => ({
    id: FUND_CHARITY_ID,
    name: "Charity",
    icon: "🤲",
    color: "#14b8a6",
    kind: "charity",
    isVisible: true,
    order,
    createdAt: now,
    updatedAt: now,
});

// Fixed ids, like the seeded categories, so two devices enabling charity
// create the same records
export const DONATIONS_CATEGORY_ID = defaultId("exp_cat", "Donations");
export const REFUND_INCOME_CATEGORY_ID = defaultId("inc_cat", "Refund");

export const getDonationsCategory = (
    now: string,
    order: number,
): ExpenseCategory => ({
    id: DONATIONS_CATEGORY_ID,
    name: "Donations",
    nameAr: "صدقات",
    icon: "🤲",
    color: "#14b8a6",
    isEssential: false,
    isDefault: false,
    isWorkCostDefault: false,
    order,
    createdAt: now,
    updatedAt: now,
});

export const getRefundIncomeCategory = (
    now: string,
    order: number,
): IncomeCategory => ({
    id: REFUND_INCOME_CATEGORY_ID,
    name: "Refund",
    nameAr: "استرداد",
    icon: "🔄",
    color: "#06b6d4",
    isDefault: true,
    order,
    createdAt: now,
    updatedAt: now,
});

export const getDefaultFinanceData = (): FinanceData => ({
    accounts: [], // Populated by migration or the user
    transfers: [],
    funds: [getDefaultMeFund()],
    people: [],
    loans: [],
    loanPayments: [],
    openingBalances: [],
    charityPledges: [],
    projects: [],
    incomes: [],
    expenses: [],
    categories: getDefaultExpenseCategories(),
    incomeCategories: getDefaultIncomeCategories(),
    installments: [],
    budgets: [],
    goals: [],
    alerts: [],
    settings: getDefaultFinanceSettings(),
});
