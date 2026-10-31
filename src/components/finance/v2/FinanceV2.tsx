/**
 * Finance Module V2 - "2026 FinTech" Design
 *
 * A complete rebuild featuring:
 * - Bento Grid aesthetics with glassmorphism
 * - 3-column desktop layout (Wallet | Feed | Future)
 * - 1-column mobile with carousel & bottom sheets
 * - Gamified goals and installments
 * - Smart date filtering
 */

import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useFinance } from "@/hooks/useFinance";

// Layout
import { FinanceShell, FinanceSection } from "./layout/FinanceShell";
import { FinanceHeader } from "./layout/FinanceHeader";
import { GlassCard } from "./layout/GlassCard";

// Controls
import { getDateRangeFromPreset } from "./controls/SmartDatePicker";
import type { DateRange } from "./controls/SmartDatePicker";
import { QuickActions } from "./controls/QuickActions";

// Wallet Components
import { NetWorthDisplay } from "./wallet/NetWorthDisplay";
import { AccountCarousel } from "./wallet/AccountCarousel";
import { AccountList } from "./wallet/AccountList";
import { BudgetWidget } from "./wallet/BudgetWidget";
import { FundTabs } from "./wallet/FundTabs";

// Feed Components
import { TransactionFeed } from "./feed/TransactionFeed";
import { CashFlowChart } from "./feed/CashFlowChart";
import { TransactionDrawer } from "./feed/TransactionDrawer";

// Future Components
import { GoalsGrid } from "./future/GoalsGrid";
import { InstallmentsTimeline } from "./future/InstallmentsTimeline";

// Effects
import {
    ConfettiCelebration,
    CelebrationMessage,
} from "./effects/ConfettiCelebration";
import { SkeletonCard, SkeletonList } from "./effects/SkeletonCard";

// Modals
import { BottomSheet } from "./modals/BottomSheet";
import { ExpenseModal } from "./modals/ExpenseModal";
import { IncomeModal } from "./modals/IncomeModal";
import { InstallmentModal } from "./modals/InstallmentModal";
import { InstallmentDetailsModal } from "./modals/InstallmentDetailsModal";
import { InstallmentRefundModal } from "./modals/InstallmentRefundModal";
import { GoalModal } from "./modals/GoalModal";
import { GoalContributionModal } from "./modals/GoalContributionModal";
import { GoalDetailsModal } from "./modals/GoalDetailsModal";
import { GoalWithdrawalModal } from "./modals/GoalWithdrawalModal";
import { TransferModal } from "./modals/TransferModal";
import { PaymentModal } from "./modals/PaymentModal";
import { BudgetModal } from "./modals/BudgetModal";

// Settings
import { AccountManager } from "./settings/AccountManager";
import { SettingsPanel } from "./settings/SettingsPanel";
import { CategoryStudioV2 } from "./settings/CategoryStudioV2";
import { FundManager } from "./settings/FundManager";
import { CharitySettings } from "./settings/CharitySettings";
import { ProjectManager } from "./settings/ProjectManager";

// Charity
import { CharityStrip } from "./charity/CharityStrip";
import { CharityBadge } from "./charity/CharityBadge";
import { COPY as CHARITY_COPY } from "./charity/copy";
import { CHARITY_SHARE_EPSILON } from "@/utils/finance/charity";
import {
    payNowFromFund,
    paidOutsideAfter,
    toDraftIncome,
} from "./charity/incomeCharity";
import type { TransferFormData } from "./modals/TransferModal";
import type { ExpenseFormData } from "./modals/ExpenseModal";
import type { IncomeFormData } from "./modals/IncomeModal";
import type { CharityChoice } from "./charity/CharityStep";
import { QuickAddSheet, type QuickAddDraft } from "./controls/QuickAddSheet";

import type {
    Account,
    Expense,
    Income,
    Transaction,
    FinancialGoal,
    Installment,
} from "@/types/modules/finance";
import {
    installmentFormToNew,
    installmentFormToUpdates,
} from "@/utils/finance/installments";
import { buildFeedRows } from "@/utils/finance/feedRows";
import { touchesAccount } from "@/utils/finance/search";
import { rememberQuickAdd } from "@/utils/finance/quickAdd";
import { useTransactionActions } from "./feed/useTransactionActions";

// Custom hook for celebration
const useCelebration = () => {
    const [showConfetti, setShowConfetti] = useState(false);
    const [celebrationMessage, setCelebrationMessage] = useState<{
        title: string;
        subtitle?: string;
        emoji?: string;
    } | null>(null);

    const celebrate = (title: string, subtitle?: string, emoji?: string) => {
        setShowConfetti(true);
        setCelebrationMessage({ title, subtitle, emoji });
    };

    const endCelebration = () => {
        setShowConfetti(false);
        setCelebrationMessage(null);
    };

    return {
        showConfetti,
        celebrationMessage,
        celebrate,
        endCelebration,
    };
};

export const FinanceV2 = () => {
    const {
        accounts,
        transfers,
        incomes,
        expenses,
        categories,
        incomeCategories,
        installments,
        goals,
        settings,
        formatCurrency,
        formatAmount,
        calculateAccountBalance,
        funds,
        focusedFundIds,
        setFocusedFunds,
        addFund,
        updateFund,
        deleteFund,
        getFundDeleteError,
        reorderFunds,
        toggleFundVisibility,
        balanceOf,
        balanceOfFund,
        calculateFocusedBalance,
        netWorth: totalNetWorth,
        charitySettings,
        charityLedger,
        enableCharity,
        updateCharitySettings,
        previewCharity,
        charityDonationNear,
        charityPaidOutsideNear,
        projects,
        addProject,
        updateProject,
        deleteProject,
        getProjectDeleteError,
        people,
        loans,
        loanPayments,
        deleteLoan,
        deleteLoanPayment,
        addExpense,
        deleteExpense,
        addIncome,
        deleteIncome,
        updateIncome,
        updateExpense,
        deleteTransfer,
        updateTransfer,
        restoreRecord,
        addInstallment,
        updateInstallment,
        deleteInstallmentPayment,
        deleteInstallment,
        addInstallmentPayment,
        addInstallmentRefund,
        transferBetweenAccounts,
        addGoal,
        updateGoal,
        deleteGoal,
        addGoalContribution,
        addAccount,
        updateAccount,
        deleteAccount,
        addCategory,
        updateCategory,
        deleteCategory,
        addIncomeCategory,
        updateIncomeCategory,
        deleteIncomeCategory,
        updateSettings,
        exportData,
        importData,
        resetData,
        getBudgetOverview,
        createBudget,
        updateBudget,
        getCurrentMonth,
    } = useFinance();

    const navigate = useNavigate();

    // ==================== State ====================

    // Date range for filtering (Smart Date Picker)
    const [dateRange, setDateRange] = useState<DateRange>(() =>
        getDateRangeFromPreset("this-month"),
    );

    // Modal states
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
    // Starting values of a new transfer (charity "Pay": Me → Charity)
    const [transferPrefill, setTransferPrefill] = useState<
        Partial<TransferFormData> | undefined
    >();
    const [showInstallmentModal, setShowInstallmentModal] = useState(false);
    const [showInstallmentDetailsModal, setShowInstallmentDetailsModal] =
        useState(false);
    const [showInstallmentRefundModal, setShowInstallmentRefundModal] =
        useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showContributionModal, setShowContributionModal] = useState(false);
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    const [showGoalDetailsModal, setShowGoalDetailsModal] = useState(false);
    const [showSettingsSheet, setShowSettingsSheet] = useState(false);
    const [showAccountManager, setShowAccountManager] = useState(false);
    const [showFundManager, setShowFundManager] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    // What quick-add's "Full form" hands to the expense or income form
    const [fullFormDraft, setFullFormDraft] = useState<QuickAddDraft | null>(
        null,
    );

    // Edit states
    const [editingInstallment, setEditingInstallment] =
        useState<Installment | null>(null);
    const [viewingInstallment, setViewingInstallment] =
        useState<Installment | null>(null);
    const [refundingInstallment, setRefundingInstallment] =
        useState<Installment | null>(null);
    const [payingInstallment, setPayingInstallment] =
        useState<Installment | null>(null);
    const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
    const [contributingGoal, setContributingGoal] =
        useState<FinancialGoal | null>(null);
    const [withdrawingGoal, setWithdrawingGoal] =
        useState<FinancialGoal | null>(null);
    const [viewingGoal, setViewingGoal] = useState<FinancialGoal | null>(null);
    const [selectedTransaction, setSelectedTransaction] =
        useState<Transaction | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(
        null,
    );

    // Loading state (for skeleton display)
    const [isLoading, setIsLoading] = useState(true);

    // Celebration state
    const { showConfetti, celebrationMessage, celebrate, endCelebration } =
        useCelebration();

    // Track celebrated goals
    const [celebratedGoals, setCelebratedGoals] = useState<Set<string>>(() => {
        const saved = localStorage.getItem("lifeos-celebrated-goals");
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    // ==================== Computed Values ====================

    // Incomes, expenses, transfers and loan movements as one feed
    const allTransactions = useMemo(
        () =>
            buildFeedRows(
                {
                    incomes,
                    expenses,
                    transfers,
                    accounts,
                    funds,
                    categories,
                    incomeCategories,
                    loans,
                    loanPayments,
                    people,
                },
                charitySettings,
            ),
        [
            incomes,
            expenses,
            transfers,
            accounts,
            funds,
            categories,
            incomeCategories,
            loans,
            loanPayments,
            people,
            charitySettings,
        ],
    );

    const searchOptions = useMemo(
        () => ({
            accounts,
            funds,
            expenseCategories: categories,
            incomeCategories,
            projects,
            people,
            showWorkCost: charitySettings.enabled,
        }),
        [
            accounts,
            funds,
            categories,
            incomeCategories,
            projects,
            people,
            charitySettings.enabled,
        ],
    );

    // Loan rows open their person on the People page
    const openLoan = (transaction: Transaction) =>
        navigate("/finance/people", {
            state: { personId: transaction.loan?.personId },
        });

    const transactionActions = useTransactionActions({
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
        onOpenLoan: openLoan,
    });

    // Net worth with loans (or the selected account's focused part)
    const netWorth = selectedAccount
        ? calculateFocusedBalance(selectedAccount.id)
        : totalNetWorth;

    // "x of total" on account cards only when focusing on some funds; with
    // only Me the focused part always equals the total
    const showFocusedPart = funds.length > 1 && focusedFundIds.length > 0;
    const focusedCardBalance = showFocusedPart
        ? calculateFocusedBalance
        : undefined;

    const payCharity = (amount: number) => {
        const account =
            accounts.find((a) => a.isDefault && a.isActive) ??
            accounts.find((a) => a.isActive);
        if (!account) return;
        setTransferPrefill({
            fromAccountId: account.id,
            toAccountId: account.id,
            fromFundId: payNowFromFund(undefined, charitySettings.fundId),
            toFundId: charitySettings.fundId,
            amount,
            notes: CHARITY_COPY.transferNote,
        });
        setShowTransferModal(true);
    };

    const editingIncome = transactionActions.editingIncome;
    const getIncomeCharityPreview = useMemo(
        () =>
            charitySettings.enabled
                ? (form: Parameters<typeof toDraftIncome>[0]) =>
                      previewCharity(toDraftIncome(form, editingIncome))
                : undefined,
        [charitySettings.enabled, previewCharity, editingIncome],
    );
    // Quick-add only ever creates
    const getNewIncomeCharityPreview = useMemo(
        () =>
            charitySettings.enabled
                ? (form: Parameters<typeof toDraftIncome>[0]) =>
                      previewCharity(toDraftIncome(form, null))
                : undefined,
        [charitySettings.enabled, previewCharity],
    );

    const renderCharityBadge = (transaction: Transaction) => {
        const entry =
            transaction.type === "income"
                ? charityLedger?.perIncome.get(transaction.id)
                : undefined;
        // Work costs can absorb a share entirely: nothing to show
        return entry && entry.share > CHARITY_SHARE_EPSILON ? (
            <CharityBadge entry={entry} formatAmount={formatAmount} />
        ) : null;
    };

    const fundManager = (
        <FundManager
            funds={funds}
            onAddFund={addFund}
            onUpdateFund={updateFund}
            onDeleteFund={deleteFund}
            getDeleteError={getFundDeleteError}
            onReorderFunds={reorderFunds}
            onToggleVisibility={toggleFundVisibility}
            getFundBalance={balanceOfFund}
            formatCurrency={formatCurrency}
            charityFundId={charitySettings.fundId}
        />
    );

    // Get current month for budget
    const currentMonth = useMemo(() => getCurrentMonth(), [getCurrentMonth]);

    // Get budget overview for current month
    const budgetOverview = useMemo(() => {
        return getBudgetOverview(currentMonth);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [getBudgetOverview, currentMonth, expenses, categories]);

    // ==================== Effects ====================

    // Simulate loading
    useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    // Check for newly completed goals and celebrate
    useEffect(() => {
        const completedGoals = goals.filter(
            (g) => g.currentAmount >= g.targetAmount,
        );
        const newlyCompleted = completedGoals.find(
            (g) => !celebratedGoals.has(g.id),
        );

        if (newlyCompleted) {
            celebrate(
                "Goal Achieved! 🎯",
                `You reached your "${newlyCompleted.title}" goal!`,
                "🏆",
            );
            const newCelebrated = new Set(celebratedGoals);
            newCelebrated.add(newlyCompleted.id);
            setCelebratedGoals(newCelebrated);
            localStorage.setItem(
                "lifeos-celebrated-goals",
                JSON.stringify([...newCelebrated]),
            );
        }
    }, [goals, celebratedGoals, celebrate]);

    // ==================== Handlers ====================

    // Incoming transfers count too, or the account could be deleted under them
    const hasTransactions = (accountId: string) =>
        allTransactions.some((t) => touchesAccount(t, accountId));

    // Shared by the expense form and quick-add
    const submitExpense = (data: ExpenseFormData, editing: Expense | null) => {
        const fallbackTitle =
            categories.find((c) => c.id === data.categoryId)?.name ||
            "Expense";
        const expenseData = {
            title: data.title?.trim() || fallbackTitle,
            amount: data.amount,
            currency: data.currency,
            categoryId: data.categoryId,
            type: data.type,
            paymentMethod: data.paymentMethod,
            accountId: data.accountId,
            fundId: data.fundId,
            date: data.date,
            isRecurring: data.isRecurring,
            recurringFrequency: data.recurringFrequency,
            tags: data.tags,
            notes: data.notes,
            projectId: data.projectId,
            isWorkCost: data.isWorkCost,
        };
        if (editing) {
            updateExpense(editing.id, expenseData);
            transactionActions.stopEdit();
        } else {
            addExpense(expenseData);
            rememberQuickAdd("expense", {
                accountId: data.accountId,
                fundId: data.fundId,
            });
        }
    };

    // Shared by the income form and quick-add
    const submitIncome = (
        data: IncomeFormData,
        charity: CharityChoice | null,
        editing: Income | null,
    ) => {
        const fallbackTitle =
            incomeCategories.find((c) => c.id === data.categoryId)?.name ||
            "Income";
        const incomeData = {
            title: data.title?.trim() || fallbackTitle,
            amount: data.amount,
            currency: data.currency,
            type: data.type,
            categoryId: data.categoryId,
            status: data.status,
            frequency: data.frequency,
            accountId: data.accountId,
            fundId: data.fundId,
            // Pending income has no actual date until it's received
            actualDate:
                data.status === "received" ? data.actualDate : undefined,
            expectedDate:
                data.status === "received" ? undefined : data.expectedDate,
            isRecurring: data.isRecurring,
            tags: data.tags,
            notes: data.notes,
            projectId: data.projectId,
            charityPaidOutsideAmount: paidOutsideAfter(charity, editing),
        };
        let incomeId = editing?.id;
        if (editing) {
            updateIncome(editing.id, incomeData);
            transactionActions.stopEdit();
        } else {
            incomeId = addIncome(incomeData).id;
            rememberQuickAdd("income", {
                accountId: data.accountId,
                fundId: data.fundId,
            });
        }
        if (charity?.action === "pay-now") {
            transferBetweenAccounts(
                data.accountId,
                data.accountId,
                charity.amount,
                CHARITY_COPY.transferNote,
                data.actualDate,
                {
                    fromFundId: payNowFromFund(
                        data.fundId,
                        charitySettings.fundId,
                    ),
                    toFundId: charitySettings.fundId,
                    // Pays this income first, not the oldest one
                    charityIncomeId: incomeId,
                },
            );
        }
    };

    const handleDeleteGoal = (goal: FinancialGoal) => {
        const amountToTransfer = Math.max(0, goal.currentAmount);
        let transferToGoalId: string | undefined;

        if (amountToTransfer > 0) {
            const targetGoals = goals.filter((g) => g.id !== goal.id);
            if (targetGoals.length === 0) {
                window.alert(
                    "You need another goal to transfer this money before deleting.",
                );
                return;
            }

            const choices = targetGoals
                .map((g, index) => `${index + 1}. ${g.title}`)
                .join("\n");
            const selection = window.prompt(
                `"${goal.title}" has ${formatCurrency(
                    amountToTransfer,
                )}.\nChoose where to transfer it before deleting (enter number):\n\n${choices}`,
            );

            if (!selection) return;

            const selectedIndex = Number(selection) - 1;
            if (
                !Number.isInteger(selectedIndex) ||
                selectedIndex < 0 ||
                selectedIndex >= targetGoals.length
            ) {
                window.alert("Invalid selection.");
                return;
            }

            transferToGoalId = targetGoals[selectedIndex].id;
        }

        const didDelete = deleteGoal(goal.id, transferToGoalId);
        if (!didDelete) {
            window.alert("Could not delete goal. Please try again.");
            return;
        }

        setShowGoalDetailsModal(false);
        setViewingGoal(null);
    };

    const handleDeleteInstallment = (installment: Installment) => {
        const amountToTransfer = Math.max(0, installment.paidAmount);
        let transferToInstallmentId: string | undefined;

        if (amountToTransfer > 0) {
            const targetInstallments = installments.filter(
                (i) => i.id !== installment.id,
            );
            if (targetInstallments.length === 0) {
                window.alert(
                    "You need another installment to transfer this paid amount before deleting.",
                );
                return;
            }

            const choices = targetInstallments
                .map((i, index) => `${index + 1}. ${i.title}`)
                .join("\n");
            const selection = window.prompt(
                `"${installment.title}" has ${formatCurrency(
                    amountToTransfer,
                )} paid.\nChoose where to transfer it before deleting (enter number):\n\n${choices}`,
            );

            if (!selection) return;

            const selectedIndex = Number(selection) - 1;
            if (
                !Number.isInteger(selectedIndex) ||
                selectedIndex < 0 ||
                selectedIndex >= targetInstallments.length
            ) {
                window.alert("Invalid selection.");
                return;
            }

            transferToInstallmentId = targetInstallments[selectedIndex].id;
        }

        const didDelete = deleteInstallment(
            installment.id,
            transferToInstallmentId,
        );
        if (!didDelete) {
            window.alert("Could not delete installment. Please try again.");
            return;
        }

        setShowInstallmentDetailsModal(false);
        setViewingInstallment(null);
    };

    // ==================== Render ====================

    // Left Column - The Wallet
    const renderWalletColumn = () => (
        <>
            <FundTabs
                funds={funds}
                focusedFundIds={focusedFundIds}
                onFocusChange={setFocusedFunds}
                onManage={() => setShowFundManager(true)}
                className="mb-3"
            />

            {/* Net Worth Hero*/}
            <GlassCard
                intensity="medium"
                glow
                glowColor="#22c55e"
                padding="lg"
                className="text-center">
                <NetWorthDisplay
                    amount={netWorth}
                    formatCurrency={formatCurrency}
                />
            </GlassCard>

            {charityLedger && (
                <CharityStrip
                    ledger={charityLedger}
                    rate={charitySettings.rate}
                    formatAmount={formatAmount}
                    onPay={payCharity}
                    className="mt-3"
                />
            )}

            {/* Accounts List */}
            <FinanceSection title="Accounts" className="max-lg:hidden mt-5">
                {isLoading ? (
                    <div className="space-y-2">
                        <SkeletonCard variant="account" />
                        <SkeletonCard variant="account" />
                    </div>
                ) : (
                    <AccountList
                        accounts={accounts}
                        calculateBalance={calculateAccountBalance}
                        formatCurrency={formatCurrency}
                        calculateFocusedBalance={focusedCardBalance}
                        formatAmount={formatAmount}
                        onAccountClick={(account) =>
                            setSelectedAccount(
                                selectedAccount?.id === account.id
                                    ? null
                                    : account,
                            )
                        }
                        onAddAccount={() => setShowAccountManager(true)}
                        selectedAccountId={selectedAccount?.id}
                    />
                )}
            </FinanceSection>

            {/* Budget Planning */}
            <FinanceSection
                title="Budget Planning"
                className="mt-5"
                action={
                    <button
                        onClick={() => setShowBudgetModal(true)}
                        className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                        {budgetOverview ? "Edit" : "Set Up"}
                    </button>
                }>
                <BudgetWidget
                    budgetOverview={budgetOverview}
                    categories={categories}
                    formatCurrency={formatCurrency}
                    onEdit={() => setShowBudgetModal(true)}
                />
            </FinanceSection>
        </>
    );

    // Center Column - The Feed
    const renderFeedColumn = () => (
        <>
            {/* Cash Flow Chart */}
            <CashFlowChart
                incomes={incomes}
                expenses={expenses}
                transfers={transfers}
                dateRange={dateRange}
                formatCurrency={formatCurrency}
                selectedAccount={selectedAccount}
                onClearAccountFilter={() => setSelectedAccount(null)}
                onTransfer={() => setShowTransferModal(true)}
            />

            {/* Goals Preview - Show top 2 goals */}
            <FinanceSection
                title="Goals"
                action={
                    goals.length > 0 ? (
                        <Link
                            to="/finance/goals"
                            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                            See All ({goals.length})
                        </Link>
                    ) : undefined
                }>
                {isLoading ? (
                    <div className="grid grid-cols-2 gap-3">
                        <SkeletonCard variant="goal" />
                        <SkeletonCard variant="goal" />
                    </div>
                ) : (
                    <GoalsGrid
                        goals={goals}
                        maxGoals={1}
                        formatCurrency={formatCurrency}
                        onGoalClick={(goal) => {
                            setViewingGoal(goal);
                            setShowGoalDetailsModal(true);
                        }}
                        onContribute={(goalId) => {
                            const goal = goals.find((g) => g.id === goalId);
                            if (goal) {
                                setContributingGoal(goal);
                                setShowContributionModal(true);
                            }
                        }}
                        onAddGoal={() => {
                            setEditingGoal(null);
                            setShowGoalModal(true);
                        }}
                    />
                )}
            </FinanceSection>

            {/* Installments Preview - Show limited installments */}
            <FinanceSection
                title="Installments"
                action={
                    installments.length > 0 ? (
                        <Link
                            to="/finance/installments"
                            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">
                            See All ({installments.length})
                        </Link>
                    ) : undefined
                }>
                {isLoading ? (
                    <div className="space-y-3">
                        <SkeletonCard />
                        <SkeletonCard />
                    </div>
                ) : (
                    <InstallmentsTimeline
                        installments={installments}
                        maxInstallments={1}
                        formatCurrency={formatCurrency}
                        onInstallmentClick={(installment) => {
                            setViewingInstallment(installment);
                            setShowInstallmentDetailsModal(true);
                        }}
                        onPay={(installmentId) => {
                            const inst = installments.find(
                                (i) => i.id === installmentId,
                            );
                            if (inst) {
                                setPayingInstallment(inst);
                                setShowPaymentModal(true);
                            }
                        }}
                        onAddInstallment={() => {
                            setEditingInstallment(null);
                            setShowInstallmentModal(true);
                        }}
                    />
                )}
            </FinanceSection>

            {/* Transaction Feed */}
            {isLoading ? (
                <GlassCard intensity="light" padding="none">
                    <SkeletonList count={5} variant="transaction" />
                </GlassCard>
            ) : (
                <TransactionFeed
                    transactions={allTransactions}
                    formatCurrency={formatCurrency}
                    dateRange={dateRange}
                    onTransactionClick={(t) =>
                        t.loan ? openLoan(t) : setSelectedTransaction(t)
                    }
                    onEdit={transactionActions.startEdit}
                    onDelete={transactionActions.handleDelete}
                    selectedAccount={selectedAccount}
                    onClearAccountFilter={() => setSelectedAccount(null)}
                    renderBadge={charityLedger ? renderCharityBadge : undefined}
                    searchOptions={searchOptions}
                />
            )}
        </>
    );

    return (
        <div className="min-h-screen bg-background text-primary pb-20 lg:pb-0">
            {/* Celebration Effects */}
            <ConfettiCelebration
                isActive={showConfetti}
                onComplete={endCelebration}
            />
            <CelebrationMessage
                isVisible={!!celebrationMessage}
                title={celebrationMessage?.title || ""}
                subtitle={celebrationMessage?.subtitle}
                emoji={celebrationMessage?.emoji}
                onClose={endCelebration}
            />

            {/* Header */}
            <FinanceHeader
                netWorth={netWorth}
                formatCurrency={formatCurrency}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                onSettingsClick={() => setShowSettingsSheet(true)}
                onAddClick={() => setShowQuickAdd(true)}
                onReportsClick={() => navigate("/finance/reports")}
                onPeopleClick={() => navigate("/finance/people")}
            />

            {/* Mobile: Account Carousel */}
            <div className="lg:hidden px-4 py-4">
                {renderWalletColumn()}

                <AccountCarousel
                    accounts={accounts}
                    calculateBalance={calculateAccountBalance}
                    formatCurrency={formatCurrency}
                    calculateFocusedBalance={focusedCardBalance}
                    formatAmount={formatAmount}
                    onAccountClick={(account) =>
                        setSelectedAccount(
                            selectedAccount?.id === account.id ? null : account,
                        )
                    }
                    onAddAccount={() => setShowAccountManager(true)}
                    selectedAccountId={selectedAccount?.id}
                />
            </div>

            {/* Main Layout - 2 Column */}
            <FinanceShell
                leftColumn={
                    <div className="max-lg:hidden">{renderWalletColumn()}</div>
                }
                centerColumn={renderFeedColumn()}
            />

            {/* One add button: the quick-add sheet */}
            <QuickActions onAdd={() => setShowQuickAdd(true)} />

            <QuickAddSheet
                isOpen={showQuickAdd}
                onClose={() => setShowQuickAdd(false)}
                accounts={accounts}
                funds={funds}
                expenseCategories={categories}
                incomeCategories={incomeCategories}
                expenses={expenses}
                incomes={incomes}
                defaultCurrency={settings.defaultCurrency}
                formatCurrency={formatCurrency}
                formatAmount={formatAmount}
                getFundBalance={balanceOf}
                charityEnabled={charitySettings.enabled}
                charityFundId={charitySettings.fundId}
                charityRate={charitySettings.rate}
                donationCategoryIds={charitySettings.donationCategoryIds}
                hasPaidOutsideNear={charityPaidOutsideNear}
                hasDonationNear={charityDonationNear}
                getCharityPreview={getNewIncomeCharityPreview}
                onAddExpense={(data) => submitExpense(data, null)}
                onAddIncome={(data, charity) =>
                    submitIncome(data, charity, null)
                }
                onFullForm={(draft) => {
                    setFullFormDraft(draft);
                    if (draft.kind === "income") setShowIncomeModal(true);
                    else setShowExpenseModal(true);
                }}
                onTransfer={(prefill) => {
                    setTransferPrefill(prefill);
                    setShowTransferModal(true);
                }}
                onLoan={(amount) =>
                    navigate("/finance/people", {
                        state: { newLoan: true, amount },
                    })
                }
            />

            {/* ==================== Modals & Sheets ==================== */}

            {/* Expense Modal */}
            <ExpenseModal
                isOpen={showExpenseModal || !!transactionActions.editingExpense}
                onClose={() => {
                    setShowExpenseModal(false);
                    setFullFormDraft(null);
                    transactionActions.stopEdit();
                }}
                initialData={transactionActions.expenseInitialData}
                prefill={
                    fullFormDraft?.kind === "expense"
                        ? fullFormDraft.data
                        : undefined
                }
                onSubmit={(data) =>
                    submitExpense(data, transactionActions.editingExpense)
                }
                accounts={accounts}
                categories={categories}
                defaultCurrency={settings.defaultCurrency}
                funds={funds}
                getFundBalance={balanceOf}
                formatCurrency={formatCurrency}
                projects={projects}
                onCreateProject={addProject}
                showWorkCost={charitySettings.enabled}
                donationCategoryIds={charitySettings.donationCategoryIds}
                charityFundId={charitySettings.fundId}
                hasPaidOutsideNear={charityPaidOutsideNear}
            />

            {/* Income Modal */}
            <IncomeModal
                isOpen={showIncomeModal || !!transactionActions.editingIncome}
                onClose={() => {
                    setShowIncomeModal(false);
                    setFullFormDraft(null);
                    transactionActions.stopEdit();
                }}
                initialData={transactionActions.incomeInitialData}
                prefill={
                    fullFormDraft?.kind === "income"
                        ? fullFormDraft.data
                        : undefined
                }
                onSubmit={(data, charity) =>
                    submitIncome(
                        data,
                        charity,
                        transactionActions.editingIncome,
                    )
                }
                accounts={accounts}
                incomeCategories={incomeCategories}
                defaultCurrency={settings.defaultCurrency}
                funds={funds}
                projects={projects}
                onCreateProject={addProject}
                getCharityPreview={getIncomeCharityPreview}
                charityRate={charitySettings.rate}
                hasDonationNear={charityDonationNear}
                formatAmount={formatAmount}
            />

            {/* Installment Modal */}
            <InstallmentModal
                isOpen={showInstallmentModal}
                onClose={() => {
                    setShowInstallmentModal(false);
                    setEditingInstallment(null);
                }}
                onSubmit={(data) => {
                    if (editingInstallment) {
                        updateInstallment(
                            editingInstallment.id,
                            installmentFormToUpdates(data),
                        );
                    } else {
                        addInstallment(
                            installmentFormToNew(data, {
                                accountId: accounts[0]?.id || "",
                                categoryId: categories[0]?.id || "",
                            }),
                        );
                    }
                    setShowInstallmentModal(false);
                    setEditingInstallment(null);
                }}
                accounts={accounts}
                defaultCurrency={settings.defaultCurrency}
                installment={editingInstallment}
            />

            {/* Goal Modal */}
            <GoalModal
                key={editingGoal?.id || "new-goal"}
                isOpen={showGoalModal}
                onClose={() => {
                    setShowGoalModal(false);
                    setEditingGoal(null);
                }}
                onSubmit={(data) => {
                    const goalData = {
                        title: data.title,
                        targetAmount: data.targetAmount,
                        currentAmount: data.currentAmount,
                        currency: data.currency,
                        category: data.category,
                        priority: data.priority,
                        deadline: data.deadline,
                        color: data.color,
                        icon: data.icon,
                        monthlyContribution: 0,
                        autoAllocate: false,
                        status: "active" as const,
                        milestones: [],
                        contributions: [],
                    };

                    if (editingGoal) {
                        updateGoal(editingGoal.id, goalData);
                    } else {
                        addGoal(goalData);
                    }
                    setShowGoalModal(false);
                    setEditingGoal(null);
                }}
                defaultCurrency={settings.defaultCurrency}
                goal={editingGoal}
            />

            {/* Goal Contribution Modal */}
            <GoalContributionModal
                isOpen={showContributionModal}
                onClose={() => {
                    setShowContributionModal(false);
                    setContributingGoal(null);
                }}
                onSubmit={(data) => {
                    if (contributingGoal) {
                        // Add contribution to goal history
                        addGoalContribution(
                            contributingGoal.id,
                            data.amount,
                            data.notes,
                        );
                        setShowContributionModal(false);
                        setContributingGoal(null);
                    }
                }}
                goal={contributingGoal}
                accounts={accounts}
                defaultCurrency={settings.defaultCurrency}
                formatCurrency={formatCurrency}
                calculateBalance={calculateAccountBalance}
            />

            {/* Goal Details Modal */}
            <GoalDetailsModal
                isOpen={showGoalDetailsModal}
                onClose={() => {
                    setShowGoalDetailsModal(false);
                    setViewingGoal(null);
                }}
                goal={viewingGoal}
                formatCurrency={formatCurrency}
                onEdit={() => {
                    if (viewingGoal) {
                        setEditingGoal(viewingGoal);
                        setShowGoalModal(true);
                    }
                }}
                onContribute={() => {
                    if (viewingGoal) {
                        setContributingGoal(viewingGoal);
                        setShowContributionModal(true);
                    }
                }}
                onWithdraw={() => {
                    if (viewingGoal) {
                        setWithdrawingGoal(viewingGoal);
                        setShowWithdrawalModal(true);
                    }
                }}
                onDelete={() => {
                    if (viewingGoal) {
                        handleDeleteGoal(viewingGoal);
                    }
                }}
            />

            {/* Goal Withdrawal Modal */}
            <GoalWithdrawalModal
                isOpen={showWithdrawalModal}
                onClose={() => {
                    setShowWithdrawalModal(false);
                    setWithdrawingGoal(null);
                }}
                onSubmit={(data) => {
                    if (withdrawingGoal) {
                        // Use negative amount for withdrawal
                        addGoalContribution(
                            withdrawingGoal.id,
                            -data.amount,
                            data.reason,
                        );
                        setShowWithdrawalModal(false);
                        setWithdrawingGoal(null);
                    }
                }}
                goal={withdrawingGoal}
                formatCurrency={formatCurrency}
            />

            {/* Transfer Modal */}
            <TransferModal
                isOpen={
                    showTransferModal || !!transactionActions.editingTransfer
                }
                onClose={() => {
                    setShowTransferModal(false);
                    setTransferPrefill(undefined);
                    transactionActions.stopEdit();
                }}
                initialData={transactionActions.transferInitialData}
                prefill={transferPrefill}
                onSubmit={(data) => {
                    const editing = transactionActions.editingTransfer;
                    if (editing) {
                        updateTransfer(editing.id, {
                            fromAccountId: data.fromAccountId,
                            toAccountId: data.toAccountId,
                            fromFundId: data.fromFundId,
                            toFundId: data.toFundId,
                            amount: data.amount,
                            date: data.date,
                            notes: data.notes,
                        });
                        transactionActions.stopEdit();
                    } else {
                        transferBetweenAccounts(
                            data.fromAccountId,
                            data.toAccountId,
                            data.amount,
                            data.notes,
                            data.date,
                            {
                                fromFundId: data.fromFundId,
                                toFundId: data.toFundId,
                            },
                        );
                        rememberQuickAdd("transfer", {
                            accountId: data.fromAccountId,
                            fundId: data.fromFundId,
                        });
                    }
                    setShowTransferModal(false);
                }}
                accounts={accounts}
                defaultCurrency={settings.defaultCurrency}
                calculateBalance={calculateAccountBalance}
                formatCurrency={formatCurrency}
                funds={funds}
                getFundBalance={balanceOf}
            />

            {/* Payment Modal (for installments) */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    setPayingInstallment(null);
                }}
                onSubmit={(data) => {
                    addInstallmentPayment(
                        data.installmentId,
                        {
                            amount: data.amount,
                            date: data.date,
                            status: "paid",
                            notes: data.notes,
                        },
                        {
                            accountId: data.accountId,
                            paymentMethod: data.paymentMethod,
                        },
                    );
                    setShowPaymentModal(false);
                    setPayingInstallment(null);
                }}
                installment={payingInstallment}
                accounts={accounts}
                defaultCurrency={settings.defaultCurrency}
                formatCurrency={formatCurrency}
                calculateBalance={calculateAccountBalance}
            />

            {/* Installment Details Modal */}
            <InstallmentDetailsModal
                isOpen={showInstallmentDetailsModal}
                onClose={() => {
                    setShowInstallmentDetailsModal(false);
                    setViewingInstallment(null);
                }}
                // Read the live record so the open modal reflects payment changes
                installment={
                    installments.find((i) => i.id === viewingInstallment?.id) ??
                    viewingInstallment
                }
                formatCurrency={formatCurrency}
                onDeletePayment={(paymentId) => {
                    if (viewingInstallment) {
                        deleteInstallmentPayment(viewingInstallment.id, paymentId);
                    }
                }}
                onEdit={() => {
                    if (viewingInstallment) {
                        setEditingInstallment(viewingInstallment);
                        setShowInstallmentModal(true);
                    }
                }}
                onPay={() => {
                    if (viewingInstallment) {
                        setPayingInstallment(viewingInstallment);
                        setShowPaymentModal(true);
                    }
                }}
                onRefund={() => {
                    if (viewingInstallment) {
                        setRefundingInstallment(viewingInstallment);
                        setShowInstallmentRefundModal(true);
                    }
                }}
                onDelete={() => {
                    if (viewingInstallment) {
                        handleDeleteInstallment(viewingInstallment);
                    }
                }}
            />

            {/* Installment Refund Modal */}
            <InstallmentRefundModal
                isOpen={showInstallmentRefundModal}
                onClose={() => {
                    setShowInstallmentRefundModal(false);
                    setRefundingInstallment(null);
                }}
                onSubmit={(data) => {
                    if (refundingInstallment) {
                        // Get account ID - use linked account or first active account
                        const accountId =
                            refundingInstallment.linkedAccountId ||
                            accounts.find((a) => a.isActive)?.id;
                        addInstallmentRefund(
                            refundingInstallment.id,
                            data.amount,
                            data.reason,
                            accountId ? { accountId } : undefined,
                        );
                        setShowInstallmentRefundModal(false);
                        setRefundingInstallment(null);
                    }
                }}
                installment={refundingInstallment}
                formatCurrency={formatCurrency}
            />

            {/* Settings Bottom Sheet */}
            <BottomSheet
                isOpen={showSettingsSheet}
                onClose={() => setShowSettingsSheet(false)}
                title="Settings">
                <div className="space-y-6 pb-8">
                    <SettingsPanel
                        settings={settings}
                        onUpdateSettings={updateSettings}
                        onExport={exportData}
                        onImport={(data: unknown) =>
                            importData(data as Parameters<typeof importData>[0])
                        }
                        onResetData={resetData}
                        accountsContent={
                            <AccountManager
                                accounts={accounts}
                                onAddAccount={addAccount}
                                onUpdateAccount={updateAccount}
                                onDeleteAccount={deleteAccount}
                                hasTransactions={hasTransactions}
                                defaultCurrency={settings.defaultCurrency}
                                formatCurrency={formatCurrency}
                                calculateBalance={calculateAccountBalance}
                            />
                        }
                        fundsContent={fundManager}
                        charityContent={
                            <CharitySettings
                                settings={charitySettings}
                                ledger={charityLedger}
                                incomeCategories={incomeCategories}
                                expenseCategories={categories}
                                onEnable={enableCharity}
                                onUpdate={updateCharitySettings}
                                formatAmount={formatAmount}
                            />
                        }
                        projectsContent={
                            <ProjectManager
                                projects={projects}
                                onAddProject={addProject}
                                onUpdateProject={updateProject}
                                onDeleteProject={deleteProject}
                                getDeleteError={getProjectDeleteError}
                            />
                        }
                        categoriesContent={
                            <CategoryStudioV2
                                expenseCategories={categories}
                                incomeCategories={incomeCategories}
                                onAddExpenseCategory={addCategory}
                                onUpdateExpenseCategory={updateCategory}
                                onDeleteExpenseCategory={deleteCategory}
                                onReorderExpenseCategories={(cats) =>
                                    cats.forEach((c, i) =>
                                        updateCategory(c.id, { order: i }),
                                    )
                                }
                                onAddIncomeCategory={addIncomeCategory}
                                onUpdateIncomeCategory={updateIncomeCategory}
                                onDeleteIncomeCategory={deleteIncomeCategory}
                                onReorderIncomeCategories={(cats) =>
                                    cats.forEach((c, i) =>
                                        updateIncomeCategory(c.id, {
                                            order: i,
                                        }),
                                    )
                                }
                                getCategoryUsage={(id) => {
                                    const expenseCount = expenses.filter(
                                        (e) => e.categoryId === id,
                                    ).length;
                                    const expenseTotal = expenses
                                        .filter((e) => e.categoryId === id)
                                        .reduce((sum, e) => sum + e.amount, 0);

                                    // Check income categories too
                                    const incomeCount = incomes.filter(
                                        (i) => i.categoryId === id,
                                    ).length;
                                    const incomeTotal = incomes
                                        .filter((i) => i.categoryId === id)
                                        .reduce((sum, i) => sum + i.amount, 0);

                                    const installmentCount =
                                        installments.filter(
                                            (inst) => inst.categoryId === id,
                                        ).length;
                                    const installmentTotal = installments
                                        .filter(
                                            (inst) => inst.categoryId === id,
                                        )
                                        .reduce(
                                            (sum, inst) =>
                                                sum + inst.paidAmount,
                                            0,
                                        );

                                    return {
                                        count:
                                            expenseCount +
                                            incomeCount +
                                            installmentCount,
                                        total:
                                            expenseTotal +
                                            incomeTotal +
                                            installmentTotal,
                                    };
                                }}
                                formatCurrency={formatCurrency}
                                defaultCurrency={settings.defaultCurrency}
                                showWorkCost={charitySettings.enabled}
                                donationCategoryIds={
                                    charitySettings.donationCategoryIds
                                }
                            />
                        }
                    />
                </div>
            </BottomSheet>

            {/* Account Manager Bottom Sheet */}
            <BottomSheet
                isOpen={showAccountManager}
                onClose={() => setShowAccountManager(false)}
                title="Manage Accounts">
                <AccountManager
                    accounts={accounts}
                    onAddAccount={addAccount}
                    onUpdateAccount={updateAccount}
                    onDeleteAccount={deleteAccount}
                    hasTransactions={hasTransactions}
                    defaultCurrency={settings.defaultCurrency}
                    formatCurrency={formatCurrency}
                    calculateBalance={calculateAccountBalance}
                />
            </BottomSheet>

            <BottomSheet
                isOpen={showFundManager}
                onClose={() => setShowFundManager(false)}
                title="Manage Funds">
                {fundManager}
            </BottomSheet>

            {/* Transaction Drawer */}
            <TransactionDrawer
                className="text-primary"
                isOpen={!!selectedTransaction}
                onClose={() => setSelectedTransaction(null)}
                title={
                    selectedTransaction?.type === "income"
                        ? "Income Details"
                        : selectedTransaction?.type === "transfer"
                          ? "Transfer Details"
                          : "Expense Details"
                }>
                {selectedTransaction && (
                    <div className="space-y-4">
                        <div className="text-center py-4">
                            <div
                                className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl ${
                                    selectedTransaction.type === "income"
                                        ? "bg-emerald-500/10"
                                        : "bg-muted"
                                }`}
                                style={{
                                    backgroundColor:
                                        selectedTransaction.type ===
                                            "expense" &&
                                        selectedTransaction.categoryColor
                                            ? `${selectedTransaction.categoryColor}20`
                                            : undefined,
                                }}>
                                {selectedTransaction.type === "income"
                                    ? "💰"
                                    : selectedTransaction.type === "transfer"
                                      ? "🔄"
                                      : selectedTransaction.categoryIcon ||
                                        "💸"}
                            </div>
                            <h3 className="text-xl font-bold">
                                {selectedTransaction.title}
                            </h3>
                            <p className="text-muted-foreground">
                                {selectedTransaction.category}
                            </p>
                            <p
                                className={`text-3xl font-bold mt-4 ${
                                    selectedTransaction.type === "income"
                                        ? "text-emerald-500"
                                        : "text-foreground"
                                }`}>
                                {selectedTransaction.type === "income"
                                    ? "+"
                                    : selectedTransaction.type === "transfer"
                                      ? ""
                                      : "-"}
                                {formatCurrency(selectedTransaction.amount)}
                            </p>
                        </div>

                        <div className="space-y-3">
                            {/* From Account (for expenses and transfers) */}
                            {selectedTransaction.type !== "income" &&
                                selectedTransaction.accountId &&
                                (() => {
                                    const account = accounts.find(
                                        (a) =>
                                            a.id ===
                                            selectedTransaction.accountId,
                                    );
                                    return account ? (
                                        <div className="flex justify-between py-2 border-b border-border/50">
                                            <span className="text-muted-foreground">
                                                From Account
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            account.color,
                                                    }}
                                                />
                                                <span className="font-medium">
                                                    {account.name}
                                                </span>
                                            </div>
                                        </div>
                                    ) : null;
                                })()}

                            {/* To Account (for income and transfers) */}
                            {(selectedTransaction.type === "income" ||
                                selectedTransaction.toAccountId) &&
                                (() => {
                                    const accountId =
                                        selectedTransaction.type === "income"
                                            ? selectedTransaction.accountId
                                            : selectedTransaction.toAccountId;
                                    const account = accounts.find(
                                        (a) => a.id === accountId,
                                    );
                                    return account ? (
                                        <div className="flex justify-between py-2 border-b border-border/50">
                                            <span className="text-muted-foreground">
                                                To Account
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            account.color,
                                                    }}
                                                />
                                                <span className="font-medium">
                                                    {account.name}
                                                </span>
                                            </div>
                                        </div>
                                    ) : null;
                                })()}

                            {/* Type (TransactionNature) */}
                            {selectedTransaction.transactionNature && (
                                <div className="flex justify-between py-2 border-b border-border/50">
                                    <span className="text-muted-foreground">
                                        Type
                                    </span>
                                    <span className="font-medium capitalize">
                                        {selectedTransaction.transactionNature}
                                    </span>
                                </div>
                            )}

                            {/* Status (for income) */}
                            {selectedTransaction.status && (
                                <div className="flex justify-between py-2 border-b border-border/50">
                                    <span className="text-muted-foreground">
                                        Status
                                    </span>
                                    <span className="font-medium capitalize">
                                        {selectedTransaction.status}
                                    </span>
                                </div>
                            )}

                            {/* Date */}
                            <div className="flex justify-between py-2 border-b border-border/50">
                                <span className="text-muted-foreground">
                                    Date
                                </span>
                                <span className="font-medium">
                                    {new Date(
                                        selectedTransaction.date,
                                    ).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </span>
                            </div>

                            {/* Recurring */}
                            {selectedTransaction.isRecurring &&
                                selectedTransaction.frequency && (
                                    <div className="flex justify-between py-2 border-b border-border/50">
                                        <span className="text-muted-foreground">
                                            Frequency
                                        </span>
                                        <span className="font-medium capitalize">
                                            {selectedTransaction.frequency.replace(
                                                "-",
                                                " ",
                                            )}
                                        </span>
                                    </div>
                                )}

                            {/* Location */}
                            {selectedTransaction.location && (
                                <div className="flex justify-between py-2 border-b border-border/50">
                                    <span className="text-muted-foreground">
                                        Location
                                    </span>
                                    <span className="font-medium">
                                        {selectedTransaction.location}
                                    </span>
                                </div>
                            )}

                            {/* Tags */}
                            {selectedTransaction.tags &&
                                selectedTransaction.tags.length > 0 && (
                                    <div className="py-2 border-b border-border/50">
                                        <span className="text-muted-foreground block mb-2">
                                            Tags
                                        </span>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedTransaction.tags.map(
                                                (tag, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="px-2 py-1 rounded-lg text-xs bg-muted">
                                                        #{tag}
                                                    </span>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Notes */}
                            {selectedTransaction.notes && (
                                <div className="py-2">
                                    <span className="text-muted-foreground block mb-2">
                                        Notes
                                    </span>
                                    <p className="text-sm">
                                        {selectedTransaction.notes}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </TransactionDrawer>

            {/* Budget Modal */}
            <BudgetModal
                isOpen={showBudgetModal}
                onClose={() => setShowBudgetModal(false)}
                categories={categories}
                budgetOverview={budgetOverview}
                formatCurrency={formatCurrency}
                currentMonth={currentMonth}
                onSave={(categoryBudgets) => {
                    if (budgetOverview && !budgetOverview.isVirtual) {
                        // Update existing budget with new category budgets
                        updateBudget(budgetOverview.id, {
                            categoryBudgets: categoryBudgets.map((cb) => ({
                                ...cb,
                                spent:
                                    budgetOverview.categoryBudgets.find(
                                        (existing) =>
                                            existing.categoryId ===
                                            cb.categoryId,
                                    )?.spent || 0,
                            })),
                        });
                    } else {
                        // Create new budget first, then update with category budgets
                        const newBudget = createBudget(currentMonth);
                        if (newBudget) {
                            updateBudget(newBudget.id, {
                                categoryBudgets: categoryBudgets.map((cb) => ({
                                    ...cb,
                                    spent: 0,
                                })),
                            });
                        }
                    }
                    setShowBudgetModal(false);
                }}
            />
        </div>
    );
};

export default FinanceV2;
