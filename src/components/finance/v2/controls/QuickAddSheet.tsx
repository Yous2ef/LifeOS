import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { ChevronLeft, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { todayISO } from "@/utils/finance/dates";
import type { CharityPreview } from "@/utils/finance/charity";
import {
    pickAccountId,
    pickFundId,
    readQuickAddMemory,
    recentFirst,
    type QuickAddKind,
} from "@/utils/finance/quickAdd";
import type {
    Account,
    Currency,
    Expense,
    ExpenseCategory,
    Fund,
    Income,
    IncomeCategory,
} from "@/types/modules/finance";
import { BottomSheet } from "../modals/BottomSheet";
import type { ExpenseFormData } from "../modals/ExpenseModal";
import type { IncomeFormData } from "../modals/IncomeModal";
import type { TransferFormData } from "../modals/TransferModal";
import {
    DonationDoubleCountHint,
    ExpenseFundWarning,
} from "../modals/ExpenseHints";
import { CharityStep, type CharityChoice } from "../charity/CharityStep";
import { AccountChips } from "../people/AccountChips";
import { LOAN_HINT } from "../people/copy";
import { Chip } from "./Chip";
import { FundPicker } from "./FundPicker";

type QuickAddTab = "expense" | "income" | "transfer" | "loan";

/** What "Full form" hands to the full expense or income form */
export type QuickAddDraft =
    | { kind: "expense"; data: Partial<ExpenseFormData> }
    | { kind: "income"; data: Partial<IncomeFormData> };

const TABS: { id: QuickAddTab; label: string }[] = [
    { id: "expense", label: "Expense" },
    { id: "income", label: "Income" },
    { id: "transfer", label: "Transfer" },
    { id: "loan", label: "Loan" },
];

// Each tab keeps the accent its full form uses
const ACCENT: Record<QuickAddTab, { text: string; chip: string; button: string }> =
    {
        expense: {
            text: "text-red-500",
            chip: "bg-red-500/20 ring-2 ring-red-500",
            button: "bg-red-600 hover:bg-red-700 text-white",
        },
        income: {
            text: "text-emerald-500",
            chip: "bg-emerald-500/20 ring-2 ring-emerald-500",
            button: "bg-emerald-600 hover:bg-emerald-700 text-white",
        },
        transfer: {
            text: "text-blue-500",
            chip: "bg-blue-500/20 ring-2 ring-blue-500",
            button: "bg-blue-600 hover:bg-blue-700 text-white",
        },
        loan: {
            text: "text-violet-500",
            chip: "bg-violet-500/20 ring-2 ring-violet-500",
            button: "bg-violet-600 hover:bg-violet-700 text-white",
        },
    };

const COPY = {
    title: "Quick add",
    amount: "Amount",
    category: "Category",
    from: "From",
    titleLabel: "Title (optional)",
    addExpense: "Add Expense",
    addIncome: "Add Income",
    fullForm: "Full form",
    continue: "Continue",
    back: "Back",
    transferHint: "Pick where it goes on the next step.",
};

interface QuickAddSheetProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: Account[];
    funds: Fund[];
    expenseCategories: ExpenseCategory[];
    incomeCategories: IncomeCategory[];
    /** Past records, to put recently used categories first */
    expenses: Expense[];
    incomes: Income[];
    defaultCurrency: Currency;
    formatCurrency: (amount: number) => string;
    formatAmount: (amount: number) => string;
    getFundBalance?: (accountId: string, fundId: string) => number;
    charityEnabled: boolean;
    /** Never preselected for an income, even when it was the last one used */
    charityFundId: string;
    charityRate: number;
    donationCategoryIds: string[];
    hasPaidOutsideNear?: (date: string) => boolean;
    hasDonationNear?: (date: string) => boolean;
    /** B2 charity step; undefined while charity tracking is off */
    getCharityPreview?: (income: IncomeFormData) => CharityPreview | null;
    onAddExpense: (data: ExpenseFormData) => void;
    onAddIncome: (data: IncomeFormData, charity: CharityChoice | null) => void;
    /** Open the full expense or income form with what was typed so far */
    onFullForm: (draft: QuickAddDraft) => void;
    onTransfer: (prefill: Partial<TransferFormData>) => void;
    onLoan: (amount: number) => void;
}

/** One sheet for every kind of entry: amount first, then the fewest choices */
export const QuickAddSheet = (props: QuickAddSheetProps) => (
    <BottomSheet
        isOpen={props.isOpen}
        onClose={props.onClose}
        title={COPY.title}
        className="md:max-w-lg md:mx-auto">
        {/* The sheet unmounts its content when closed: each open starts fresh */}
        <QuickAddForm {...props} />
    </BottomSheet>
);

interface Place {
    accountId: string;
    fundId: string;
}

const QuickAddForm = ({
    onClose,
    accounts,
    funds,
    expenseCategories,
    incomeCategories,
    expenses,
    incomes,
    defaultCurrency,
    formatCurrency,
    formatAmount,
    getFundBalance,
    charityEnabled,
    charityFundId,
    charityRate,
    donationCategoryIds,
    hasPaidOutsideNear,
    hasDonationNear,
    getCharityPreview,
    onAddExpense,
    onAddIncome,
    onFullForm,
    onTransfer,
    onLoan,
}: QuickAddSheetProps) => {
    const idBase = useId();
    const tabId = (id: QuickAddTab) => `${idBase}-tab-${id}`;
    const panelId = `${idBase}-panel`;
    const tabRefs = useRef<Partial<Record<QuickAddTab, HTMLButtonElement>>>(
        {},
    );

    const [tab, setTab] = useState<QuickAddTab>("expense");
    const [amount, setAmount] = useState(0);
    const [title, setTitle] = useState("");
    // Each kind starts from its own last account and fund
    const [places, setPlaces] = useState<Record<QuickAddKind, Place>>(() => {
        const start = (kind: QuickAddKind, excludeFund?: string): Place => {
            const memory = readQuickAddMemory(kind);
            return {
                accountId: pickAccountId(accounts, memory.accountId),
                fundId: pickFundId(funds, memory.fundId, excludeFund),
            };
        };
        return {
            expense: start("expense"),
            income: start("income", charityFundId),
            transfer: start("transfer"),
        };
    });
    const [picked, setPicked] = useState<Partial<Record<QuickAddTab, string>>>(
        {},
    );
    // Set once "Continue" finds charity owed on this income
    const [charityStep, setCharityStep] = useState<{
        income: IncomeFormData;
        preview: CharityPreview;
    } | null>(null);

    const expenseCats = useMemo(
        () => recentFirst(expenseCategories, expenses),
        [expenseCategories, expenses],
    );
    const incomeCats = useMemo(
        () => recentFirst(incomeCategories, incomes),
        [incomeCategories, incomes],
    );
    const categories: (ExpenseCategory | IncomeCategory)[] =
        tab === "income" ? incomeCats : expenseCats;
    const categoryId = picked[tab] ?? categories[0]?.id ?? "";
    const category = categories.find((c) => c.id === categoryId);

    const place = tab === "loan" ? null : places[tab];
    const setPlace = (changes: Partial<Place>) => {
        if (tab === "loan") return;
        setPlaces((prev) => ({ ...prev, [tab]: { ...prev[tab], ...changes } }));
    };

    const accent = ACCENT[tab];
    const isEntry = tab === "expense" || tab === "income";
    const canSubmit =
        tab === "loan" ||
        (amount > 0 && !!place?.accountId && (!isEntry || !!categoryId));
    const today = todayISO();

    const expenseDraft = (): ExpenseFormData => {
        const isDonation = donationCategoryIds.includes(categoryId);
        // Same rule as the full form: saved explicitly once charity is on
        const isWorkCost =
            !isDonation &&
            !!(category as ExpenseCategory | undefined)?.isWorkCostDefault;
        return {
            title: title.trim(),
            amount,
            currency: defaultCurrency,
            categoryId,
            accountId: places.expense.accountId,
            fundId: places.expense.fundId,
            type: "variable",
            paymentMethod: "card",
            date: today,
            isRecurring: false,
            tags: [],
            notes: "",
            ...(charityEnabled || isDonation ? { isWorkCost } : {}),
        };
    };

    const incomeDraft = (): IncomeFormData => ({
        title: title.trim(),
        amount,
        currency: defaultCurrency,
        categoryId,
        accountId: places.income.accountId,
        fundId: places.income.fundId,
        type: "variable",
        status: "received",
        frequency: "one-time",
        actualDate: today,
        expectedDate: today,
        isRecurring: false,
        tags: [],
        notes: "",
    });

    const submit = () => {
        if (!canSubmit) return;
        if (tab === "expense") {
            onAddExpense(expenseDraft());
        } else if (tab === "income") {
            const income = incomeDraft();
            const preview = getCharityPreview?.(income);
            // Same B2 step as the full form, so "Pay now" links this income
            if (preview && preview.share > 0) {
                setCharityStep({ income, preview });
                return;
            }
            onAddIncome(income, null);
        } else if (tab === "transfer") {
            const from = places.transfer;
            const to = accounts.find(
                (a) => a.isActive && a.id !== from.accountId,
            );
            onTransfer({
                amount,
                fromAccountId: from.accountId,
                fromFundId: from.fundId,
                toAccountId: to?.id ?? from.accountId,
            });
        } else {
            onLoan(amount);
        }
        onClose();
    };

    const openFullForm = () => {
        const { title: draftTitle, ...rest } =
            tab === "income" ? incomeDraft() : expenseDraft();
        const data = { ...rest, ...(draftTitle ? { title: draftTitle } : {}) };
        onClose();
        onFullForm(
            tab === "income"
                ? { kind: "income", data: data as Partial<IncomeFormData> }
                : { kind: "expense", data: data as Partial<ExpenseFormData> },
        );
    };

    const onTabKeyDown = (e: KeyboardEvent) => {
        const index = TABS.findIndex((t) => t.id === tab);
        const next =
            e.key === "ArrowRight"
                ? (index + 1) % TABS.length
                : e.key === "ArrowLeft"
                  ? (index - 1 + TABS.length) % TABS.length
                  : e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? TABS.length - 1
                      : -1;
        if (next < 0) return;
        e.preventDefault();
        setTab(TABS[next].id);
        tabRefs.current[TABS[next].id]?.focus();
    };

    if (charityStep) {
        return (
            <div className="space-y-4 pb-6">
                <button
                    type="button"
                    onClick={() => setCharityStep(null)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="w-4 h-4" />
                    {COPY.back}
                </button>
                <CharityStep
                    preview={charityStep.preview}
                    rate={charityRate}
                    hasProject={false}
                    showDoubleCountHint={!!hasDonationNear?.(today)}
                    formatAmount={formatAmount}
                    onChoose={(choice) => {
                        onAddIncome(charityStep.income, choice);
                        onClose();
                    }}
                    submitLabel={COPY.addIncome}
                />
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-6">
            <div
                role="tablist"
                aria-label={COPY.title}
                onKeyDown={onTabKeyDown}
                className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-muted/50">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        ref={(el) => {
                            if (el) tabRefs.current[t.id] = el;
                        }}
                        id={tabId(t.id)}
                        type="button"
                        role="tab"
                        aria-selected={tab === t.id}
                        aria-controls={panelId}
                        tabIndex={tab === t.id ? 0 : -1}
                        onClick={() => setTab(t.id)}
                        className={cn(
                            "py-2 rounded-xl text-sm font-medium transition-colors",
                            tab === t.id
                                ? cn("bg-background shadow-sm", ACCENT[t.id].text)
                                : "text-muted-foreground hover:text-foreground",
                        )}>
                        {t.label}
                    </button>
                ))}
            </div>

            <div
                role="tabpanel"
                id={panelId}
                aria-labelledby={tabId(tab)}
                className="space-y-5">
                <div
                    className={cn(
                        "flex justify-center items-center text-4xl font-bold",
                        accent.text,
                    )}>
                    <span className="text-2xl text-muted-foreground mr-1">
                        {defaultCurrency}
                    </span>
                    <input
                        autoFocus
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={amount || ""}
                        onChange={(e) =>
                            setAmount(parseFloat(e.target.value) || 0)
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter") submit();
                        }}
                        placeholder="0"
                        aria-label={COPY.amount}
                        className="bg-transparent text-center w-44 outline-none"
                    />
                </div>

                {tab === "loan" && (
                    <p className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Info className="w-4 h-4 mt-0.5 shrink-0" />
                        {LOAN_HINT}
                    </p>
                )}

                {isEntry && categories.length > 0 && (
                    <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">
                            {COPY.category}
                        </Label>
                        <div className="flex gap-2 overflow-x-auto px-1 py-1">
                            {categories.map((c) => (
                                <Chip
                                    key={c.id}
                                    active={c.id === categoryId}
                                    onClick={() =>
                                        setPicked((prev) => ({
                                            ...prev,
                                            [tab]: c.id,
                                        }))
                                    }
                                    activeClassName={accent.chip}
                                    className="rounded-xl py-2">
                                    <span>{c.icon}</span>
                                    {c.name}
                                </Chip>
                            ))}
                        </div>
                    </div>
                )}

                {place && (
                    <>
                        <AccountChips
                            accounts={accounts}
                            value={place.accountId}
                            onChange={(accountId) => setPlace({ accountId })}
                            label={tab === "transfer" ? COPY.from : undefined}
                        />
                        <FundPicker
                            funds={funds}
                            value={place.fundId}
                            onChange={(fundId) => setPlace({ fundId })}
                            activeClassName={accent.chip}
                        />
                    </>
                )}

                {tab === "expense" && (
                    <>
                        <ExpenseFundWarning
                            draft={expenseDraft()}
                            accounts={accounts}
                            funds={funds}
                            getFundBalance={getFundBalance}
                            formatCurrency={formatCurrency}
                        />
                        <DonationDoubleCountHint
                            draft={expenseDraft()}
                            donationCategoryIds={donationCategoryIds}
                            charityFundId={charityFundId}
                            hasPaidOutsideNear={hasPaidOutsideNear}
                        />
                    </>
                )}

                {isEntry && (
                    <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">
                            {COPY.titleLabel}
                        </Label>
                        <Input
                            aria-label={COPY.titleLabel}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") submit();
                            }}
                            placeholder={category?.name}
                            className="h-10 rounded-xl bg-muted/50 border-0"
                        />
                    </div>
                )}

                {tab === "transfer" && (
                    <p className="text-xs text-muted-foreground">
                        {COPY.transferHint}
                    </p>
                )}
            </div>

            <div className="flex gap-2">
                {isEntry && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={openFullForm}
                        className="h-12 rounded-2xl bg-muted/50">
                        {COPY.fullForm}
                    </Button>
                )}
                <Button
                    type="button"
                    disabled={!canSubmit}
                    onClick={submit}
                    className={cn("flex-1 h-12 rounded-2xl", accent.button)}>
                    {tab === "expense"
                        ? COPY.addExpense
                        : tab === "income"
                          ? incomeButtonLabel(getCharityPreview, incomeDraft())
                          : COPY.continue}
                </Button>
            </div>
        </div>
    );
};

// "Continue" when the charity step follows, like the full form
const incomeButtonLabel = (
    getCharityPreview: QuickAddSheetProps["getCharityPreview"],
    income: IncomeFormData,
) =>
    income.amount > 0 && (getCharityPreview?.(income)?.share ?? 0) > 0
        ? COPY.continue
        : COPY.addIncome;
