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

// Reports
import { ReportsModal } from "./reports/ReportsModal";

import type {
    Account,
    Transaction,
    FinancialGoal,
    Installment,
} from "@/types/modules/finance";

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
        calculateAccountBalance,
        addExpense,
        deleteExpense,
        addIncome,
        deleteIncome,
        addInstallment,
        updateInstallment,
        addInstallmentPayment,
        addInstallmentRefund,
        transferBetweenAccounts,
        addGoal,
        updateGoal,
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
        getDateRangeFromPreset("this-month")
    );

    // Modal states
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [showTransferModal, setShowTransferModal] = useState(false);
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
    const [showReportsModal, setShowReportsModal] = useState(false);
    const [showBudgetModal, setShowBudgetModal] = useState(false);

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
        null
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

    // Get all transactions merged
    const allTransactions: Transaction[] = useMemo(() => {
        const incomeTransactions: Transaction[] = incomes.map((inc) => {
            const incomeCategory = incomeCategories.find(
                (c) => c.id === inc.categoryId
            );
            return {
                id: inc.id,
                type: "income" as const,
                title: inc.title,
                amount: inc.amount,
                date: inc.actualDate || inc.createdAt.split("T")[0],
                accountId: inc.accountId,
                category: incomeCategory?.name,
                categoryId: inc.categoryId,
                categoryIcon: incomeCategory?.icon,
                categoryColor: incomeCategory?.color,
                notes: inc.notes,
                tags: inc.tags,
                status: inc.status,
                frequency: inc.frequency,
                isRecurring: inc.isRecurring,
                transactionNature: inc.type,
            };
        });

        const expenseTransactions: Transaction[] = expenses.map((exp) => {
            const category = categories.find((c) => c.id === exp.categoryId);
            return {
                id: exp.id,
                type: "expense" as const,
                title: exp.title,
                amount: exp.amount,
                date: exp.date,
                accountId: exp.accountId,
                location: exp.location,
                category: category?.name,
                categoryId: exp.categoryId,
                categoryIcon: category?.icon,
                categoryColor: category?.color,
                notes: exp.notes,
                tags: exp.tags,
                frequency: exp.recurringFrequency,
                isRecurring: exp.isRecurring,
                transactionNature: exp.type,
            };
        });

        const transferTransactions: Transaction[] = transfers.map((t) => {
            const fromAccount = accounts.find((a) => a.id === t.fromAccountId);
            const toAccount = accounts.find((a) => a.id === t.toAccountId);
            return {
                id: t.id,
                type: "transfer" as const,
                title:
                    t.notes ||
                    `${fromAccount?.name || "Account"} → ${
                        toAccount?.name || "Account"
                    }`,
                amount: t.amount,
                date: t.date,
                accountId: t.fromAccountId,
                toAccountId: t.toAccountId,
                category: "Transfer",
                notes: t.notes,
            };
        });

        return [
            ...incomeTransactions,
            ...expenseTransactions,
            ...transferTransactions,
        ].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [incomes, expenses, transfers, categories, accounts]);

    // Calculate net worth
    const netWorth = useMemo(
        () => {
            if (selectedAccount) {
                return calculateAccountBalance(selectedAccount.id);
            }
            return accounts
                .filter((a) => a.isActive)
                .reduce(
                    (sum, account) => sum + calculateAccountBalance(account.id),
                    0
                );
        },
        // Include transfers, incomes, expenses to ensure recalculation when balances change
        [
            accounts,
            calculateAccountBalance,
            transfers,
            incomes,
            expenses,
            selectedAccount,
        ]
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
            (g) => g.currentAmount >= g.targetAmount
        );
        const newlyCompleted = completedGoals.find(
            (g) => !celebratedGoals.has(g.id)
        );

        if (newlyCompleted) {
            celebrate(
                "Goal Achieved! 🎯",
                `You reached your "${newlyCompleted.title}" goal!`,
                "🏆"
            );
            const newCelebrated = new Set(celebratedGoals);
            newCelebrated.add(newlyCompleted.id);
            setCelebratedGoals(newCelebrated);
            localStorage.setItem(
                "lifeos-celebrated-goals",
                JSON.stringify([...newCelebrated])
            );
        }
    }, [goals, celebratedGoals, celebrate]);

    // ==================== Handlers ====================

    const hasTransactions = (accountId: string) => {
        return allTransactions.some((t) => t.accountId === accountId);
    };

    // ==================== Render ====================

    // Left Column - The Wallet
    const renderWalletColumn = () => (
        <>
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
                        onAccountClick={(account) =>
                            setSelectedAccount(
                                selectedAccount?.id === account.id
                                    ? null
                                    : account
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
                                (i) => i.id === installmentId
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
                    onTransactionClick={(t) => setSelectedTransaction(t)}
                    onDeleteIncome={deleteIncome}
                    onDeleteExpense={deleteExpense}
                    selectedAccount={selectedAccount}
                    onClearAccountFilter={() => setSelectedAccount(null)}
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
                accounts={accounts}
                calculateAccountBalance={calculateAccountBalance}
                formatCurrency={formatCurrency}
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                onSettingsClick={() => setShowSettingsSheet(true)}
                onAddClick={() => setShowExpenseModal(true)}
                onReportsClick={() => navigate("/finance/reports")}
                selectedAccount={selectedAccount}
            />

            {/* Mobile: Account Carousel */}
            <div className="lg:hidden px-4 py-4">
                {renderWalletColumn()}

                <AccountCarousel
                    accounts={accounts}
                    calculateBalance={calculateAccountBalance}
                    formatCurrency={formatCurrency}
                    onAccountClick={(account) =>
                        setSelectedAccount(
                            selectedAccount?.id === account.id ? null : account
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

            {/* Quick Actions FAB */}
            <QuickActions
                onAddIncome={() => setShowIncomeModal(true)}
                onAddExpense={() => setShowExpenseModal(true)}
                onAddTransfer={() => setShowTransferModal(true)}
            />

            {/* ==================== Modals & Sheets ==================== */}

            {/* Expense Modal */}
            <ExpenseModal
                isOpen={showExpenseModal}
                onClose={() => setShowExpenseModal(false)}
                onSubmit={(data) => {
                    addExpense({
                        title: data.title,
                        amount: data.amount,
                        currency: data.currency,
                        categoryId: data.categoryId,
                        type: data.type,
                        paymentMethod: data.paymentMethod,
                        accountId: data.accountId,
                        date: data.date,
                        isRecurring: data.isRecurring,
                        recurringFrequency: data.recurringFrequency,
                        tags: data.tags,
                        notes: data.notes,
                    });
                }}
                accounts={accounts}
                categories={categories}
                defaultCurrency={settings.defaultCurrency}
            />

            {/* Income Modal */}
            <IncomeModal
                isOpen={showIncomeModal}
                onClose={() => setShowIncomeModal(false)}
                onSubmit={(data) => {
                    addIncome({
                        title: data.title,
                        amount: data.amount,
                        currency: data.currency,
                        type: data.type,
                        categoryId: data.categoryId,
                        status: data.status,
                        frequency: data.frequency,
                        accountId: data.accountId,
                        actualDate: data.actualDate,
                        isRecurring: data.isRecurring,
                        tags: data.tags,
                        notes: data.notes,
                    });
                }}
                accounts={accounts}
                incomeCategories={incomeCategories}
                defaultCurrency={settings.defaultCurrency}
            />

            {/* Installment Modal */}
            <InstallmentModal
                isOpen={showInstallmentModal}
                onClose={() => {
                    setShowInstallmentModal(false);
                    setEditingInstallment(null);
                }}
                onSubmit={(data) => {
                    const installmentData = {
                        title: data.title,
                        totalAmount: data.totalAmount,
                        paidAmount: data.paidAmount,
                        installmentAmount: data.installmentAmount,
                        totalInstallments: data.totalInstallments,
                        paidInstallments: data.paidInstallments,
                        frequency: data.frequency,
                        linkedAccountId:
                            data.linkedAccountId || accounts[0]?.id || "",
                        startDate: data.startDate,
                        nextPaymentDate: data.nextDueDate,
                        description: data.notes,
                        categoryId: categories[0]?.id || "",
                        endDate: data.startDate, // Will be calculated
                        status: "active" as const,
                        autoPayment: false,
                        remindDaysBefore: 3,
                        payments: [],
                    };

                    if (editingInstallment) {
                        updateInstallment(
                            editingInstallment.id,
                            installmentData
                        );
                    } else {
                        addInstallment(installmentData);
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
                            data.notes
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
                            data.reason
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
                isOpen={showTransferModal}
                onClose={() => setShowTransferModal(false)}
                onSubmit={(data) => {
                    transferBetweenAccounts(
                        data.fromAccountId,
                        data.toAccountId,
                        data.amount,
                        data.notes
                    );
                    setShowTransferModal(false);
                }}
                accounts={accounts}
                defaultCurrency={settings.defaultCurrency}
                calculateBalance={calculateAccountBalance}
                formatCurrency={formatCurrency}
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
                        }
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
                installment={viewingInstallment}
                formatCurrency={formatCurrency}
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
                            accountId ? { accountId } : undefined
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
                        categoriesContent={
                            <CategoryStudioV2
                                expenseCategories={categories}
                                incomeCategories={incomeCategories}
                                onAddExpenseCategory={addCategory}
                                onUpdateExpenseCategory={updateCategory}
                                onDeleteExpenseCategory={deleteCategory}
                                onReorderExpenseCategories={(cats) =>
                                    cats.forEach((c, i) =>
                                        updateCategory(c.id, { order: i })
                                    )
                                }
                                onAddIncomeCategory={addIncomeCategory}
                                onUpdateIncomeCategory={updateIncomeCategory}
                                onDeleteIncomeCategory={deleteIncomeCategory}
                                onReorderIncomeCategories={(cats) =>
                                    cats.forEach((c, i) =>
                                        updateIncomeCategory(c.id, { order: i })
                                    )
                                }
                                getCategoryUsage={(id) => {
                                    const expenseCount = expenses.filter(
                                        (e) => e.categoryId === id
                                    ).length;
                                    const expenseTotal = expenses
                                        .filter((e) => e.categoryId === id)
                                        .reduce((sum, e) => sum + e.amount, 0);

                                    // Check income categories too
                                    const incomeCount = incomes.filter(
                                        (i) => i.categoryId === id
                                    ).length;
                                    const incomeTotal = incomes
                                        .filter((i) => i.categoryId === id)
                                        .reduce((sum, i) => sum + i.amount, 0);

                                    return {
                                        count: expenseCount + incomeCount,
                                        total: expenseTotal + incomeTotal,
                                    };
                                }}
                                formatCurrency={formatCurrency}
                                defaultCurrency={settings.defaultCurrency}
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
                                    : selectedTransaction.categoryIcon || "💸"}
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
                                            selectedTransaction.accountId
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
                                        (a) => a.id === accountId
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
                                        selectedTransaction.date
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
                                                " "
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
                                                )
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

            {/* Reports Modal */}
            <ReportsModal
                isOpen={showReportsModal}
                onClose={() => setShowReportsModal(false)}
                incomes={incomes}
                expenses={expenses}
                categories={categories}
                dateRange={dateRange}
                formatCurrency={formatCurrency}
            />

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
                                            cb.categoryId
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
