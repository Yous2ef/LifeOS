import { useState, useMemo, useEffect } from "react";
import {
    Plus,
    Wallet,
    CreditCard,
    Target,
    ChevronRight,
    ArrowUpRight,
    BarChart3,
    Receipt,
    ListFilter,
    Settings,
} from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFinance } from "@/hooks/useFinance";

// Components
import { OverviewCards } from "@/components/finance/OverviewCards";
import { QuickAddExpense } from "@/components/finance/QuickAddExpense";
import { ExpenseModal } from "@/components/finance/ExpenseModal";
import { IncomeModal } from "@/components/finance/IncomeModal";
import { TransactionList } from "@/components/finance/TransactionList";
import { CategoryBreakdown } from "@/components/finance/CategoryBreakdown";
import { GoalsOverview } from "@/components/finance/GoalsOverview";
import { InstallmentsList } from "@/components/finance/InstallmentsList";
import { SmartAlerts } from "@/components/finance/SmartAlerts";
// Phase 3 Components
import { SpendingChart } from "@/components/finance/SpendingChart";
import { CategoryPieChart } from "@/components/finance/CategoryPieChart";
import { InstallmentModal } from "@/components/finance/InstallmentModal";
import { InstallmentPaymentModal } from "@/components/finance/InstallmentPaymentModal";
import { GoalModal } from "@/components/finance/GoalModal";
import { BudgetPlanner } from "@/components/finance/BudgetPlanner";
// Phase 4 Components - Intelligence & UX
import { FinancialInsights } from "@/components/finance/FinancialInsights";
import { CashFlowForecast } from "@/components/finance/CashFlowForecast";
import { ReportsPanel } from "@/components/finance/ReportsPanel";
import { SpendingBehavior } from "@/components/finance/SpendingBehavior";
// Phase 5 - Animations & Settings
import Confetti, {
    CelebrationMessage,
    useCelebration,
} from "@/components/finance/Confetti";
import { FinanceSettingsPanel } from "@/components/finance/FinanceSettingsPanel";
import { ExportImportPanel } from "@/components/finance/ExportImportPanel";
import "@/components/finance/finance-animations.css";

import type {
    Installment,
    FinancialGoal,
    CategoryBudget,
} from "@/types/modules/finance";

export const Finance = () => {
    const {
        incomes,
        expenses,
        categories,
        installments,
        goals,
        alerts,
        settings,
        getMonthlyStats,
        getCategorySpending,
        getRecentTransactions,
        getOrCreateBudget,
        formatCurrency,
        quickAddExpense,
        addExpense,
        deleteExpense,
        addIncome,
        deleteIncome,
        addInstallment,
        updateInstallment,
        deleteInstallment,
        addInstallmentPayment,
        addGoal,
        updateGoal,
        deleteGoal,
        addGoalContribution,
        updateBudget,
        dismissAlert,
        updateSettings,
        addCategory,
        updateCategory,
        deleteCategory,
        exportData,
        importData,
        resetData,
    } = useFinance();

    // Celebration hook for achievements
    const {
        showConfetti,
        celebrationMessage,
        celebrate,
        endCelebration,
        setShowConfetti,
        setCelebrationMessage,
    } = useCelebration();

    // Modal states
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showIncomeModal, setShowIncomeModal] = useState(false);
    const [showInstallmentModal, setShowInstallmentModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [editingInstallment, setEditingInstallment] =
        useState<Installment | null>(null);
    const [payingInstallment, setPayingInstallment] =
        useState<Installment | null>(null);
    const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
    const [activeTab, setActiveTab] = useState("overview");

    // Track completed goals for celebration
    const [celebratedGoals, setCelebratedGoals] = useState<Set<string>>(() => {
        const saved = localStorage.getItem("lifeos-celebrated-goals");
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    // Calculate stats
    const stats = useMemo(() => getMonthlyStats(), [getMonthlyStats]);
    const categorySpending = useMemo(
        () => getCategorySpending(),
        [getCategorySpending]
    );
    const recentTransactions = useMemo(
        () => getRecentTransactions(5),
        [getRecentTransactions]
    );

    // Current month name
    const currentMonthName = new Date().toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });

    // Get budget for current month
    const currentBudget = useMemo(
        () => getOrCreateBudget(),
        [getOrCreateBudget]
    );

    // Active installments
    const activeInstallments = useMemo(
        () => installments.filter((i) => i.status === "active"),
        [installments]
    );

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

    // Active goals
    const activeGoals = useMemo(
        () => goals.filter((g) => g.status === "active"),
        [goals]
    );

    // Handle installment save
    const handleSaveInstallment = (
        installmentData: Omit<Installment, "id" | "createdAt">
    ) => {
        if (editingInstallment) {
            updateInstallment(editingInstallment.id, installmentData);
        } else {
            addInstallment(
                installmentData as Parameters<typeof addInstallment>[0]
            );
        }
        setEditingInstallment(null);
    };

    // Handle goal save
    const handleSaveGoal = (
        goalData: Omit<FinancialGoal, "id" | "createdAt">
    ) => {
        if (editingGoal) {
            updateGoal(editingGoal.id, goalData);
        } else {
            addGoal(goalData as Parameters<typeof addGoal>[0]);
        }
        setEditingGoal(null);
    };

    // Handle budget save
    const handleSaveBudget = (categoryBudgets: CategoryBudget[]) => {
        if (currentBudget) {
            updateBudget(currentBudget.id, { categoryBudgets });
        }
    };

    return (
        <div className="space-y-4 sm:space-y-6 pb-20 lg:pb-6">
            {/* Celebration Effects */}
            <Confetti isActive={showConfetti} onComplete={endCelebration} />
            <CelebrationMessage
                isVisible={!!celebrationMessage}
                message={celebrationMessage?.message || ""}
                subMessage={celebrationMessage?.subMessage}
                emoji={celebrationMessage?.emoji}
                onClose={() => {
                    setShowConfetti(false);
                    setCelebrationMessage(null);
                }}
            />

            {/* Header - Mobile Optimized */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in-up">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground flex items-center gap-2">
                        <Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                        Finance
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground mt-1">
                        {currentMonthName} Overview
                    </p>
                </div>

                {/* Action Buttons - Stack on mobile */}
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowIncomeModal(true)}
                        className="flex-1 sm:flex-none">
                        <ArrowUpRight className="h-4 w-4 mr-1 text-green-500" />
                        <span className="hidden sm:inline">Add</span> Income
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setShowExpenseModal(true)}
                        className="flex-1 sm:flex-none">
                        <Plus className="h-4 w-4 mr-1" />
                        <span className="hidden sm:inline">Add</span> Expense
                    </Button>
                </div>
            </div>

            {/* Smart Alerts */}
            {alerts.length > 0 && (
                <SmartAlerts alerts={alerts} onDismiss={dismissAlert} />
            )}

            {/* Overview Cards - Mobile First Grid */}
            <OverviewCards stats={stats} formatCurrency={formatCurrency} />

            {/* Main Content Tabs - Touch Friendly */}
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full">
                <TabsList className="w-full grid grid-cols-5 h-auto p-1">
                    <TabsTrigger
                        value="overview"
                        className="text-xs sm:text-sm py-2 px-1 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <BarChart3 className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="transactions"
                        className="text-xs sm:text-sm py-2 px-1 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Receipt className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Transactions</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="installments"
                        className="text-xs sm:text-sm py-2 px-1 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <CreditCard className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Installments</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="goals"
                        className="text-xs sm:text-sm py-2 px-1 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Target className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Goals</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="settings"
                        className="text-xs sm:text-sm py-2 px-1 sm:px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Settings className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Settings</span>
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-4 space-y-4">
                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Spending Chart - Income vs Expenses */}
                        <SpendingChart
                            incomes={incomes}
                            expenses={expenses}
                            formatCurrency={formatCurrency}
                        />

                        {/* Category Pie Chart */}
                        <CategoryPieChart
                            expenses={expenses}
                            categories={categories}
                            formatCurrency={formatCurrency}
                            period="month"
                        />
                    </div>

                    {/* Budget & Category Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Budget Planner */}
                        <BudgetPlanner
                            budget={currentBudget}
                            categories={categories}
                            formatCurrency={formatCurrency}
                            onSaveBudget={handleSaveBudget}
                        />

                        {/* Category Breakdown */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                    <ListFilter className="h-4 w-4 text-primary" />
                                    Spending by Category
                                </CardTitle>
                                <CardDescription>
                                    Where your money goes
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <CategoryBreakdown
                                    categorySpending={categorySpending}
                                    formatCurrency={formatCurrency}
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Transactions */}
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                                        <Receipt className="h-4 w-4 text-primary" />
                                        Recent Transactions
                                    </CardTitle>
                                    <CardDescription>
                                        Your latest activity
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveTab("transactions")}
                                    className="text-xs">
                                    View All
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <TransactionList
                                transactions={recentTransactions}
                                formatCurrency={formatCurrency}
                                compact
                            />
                        </CardContent>
                    </Card>

                    {/* Quick Stats Row */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Active Installments Quick View */}
                        <Card
                            className="cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => setActiveTab("installments")}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-orange-500/10">
                                        <CreditCard className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground">
                                            Active Installments
                                        </p>
                                        <p className="text-lg font-bold">
                                            {activeInstallments.length}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Goals Quick View */}
                        <Card
                            className="cursor-pointer hover:bg-accent/50 transition-colors"
                            onClick={() => setActiveTab("goals")}>
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10">
                                        <Target className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-muted-foreground">
                                            Active Goals
                                        </p>
                                        <p className="text-lg font-bold">
                                            {activeGoals.length}
                                        </p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Phase 4: Intelligence & UX Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Financial Insights */}
                        <FinancialInsights
                            incomes={incomes}
                            expenses={expenses}
                            categories={categories}
                            goals={goals}
                            budgets={currentBudget ? [currentBudget] : []}
                            formatCurrency={formatCurrency}
                        />

                        {/* Cash Flow Forecast */}
                        <CashFlowForecast
                            incomes={incomes}
                            expenses={expenses}
                            formatCurrency={formatCurrency}
                        />
                    </div>

                    {/* Reports & Behavior Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Reports Panel */}
                        <ReportsPanel
                            incomes={incomes}
                            expenses={expenses}
                            categories={categories}
                            formatCurrency={formatCurrency}
                        />

                        {/* Spending Behavior & Achievements */}
                        <SpendingBehavior
                            expenses={expenses}
                            budgets={currentBudget ? [currentBudget] : []}
                            goals={goals}
                        />
                    </div>
                </TabsContent>

                {/* Transactions Tab */}
                <TabsContent value="transactions" className="mt-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base sm:text-lg">
                                    All Transactions
                                </CardTitle>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm">
                                        <ListFilter className="h-4 w-4 mr-1" />
                                        Filter
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <TransactionList
                                transactions={getRecentTransactions(50)}
                                formatCurrency={formatCurrency}
                                onDeleteIncome={deleteIncome}
                                onDeleteExpense={deleteExpense}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Installments Tab */}
                <TabsContent value="installments" className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">Installments</h2>
                        <Button
                            size="sm"
                            onClick={() => {
                                setEditingInstallment(null);
                                setShowInstallmentModal(true);
                            }}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Installment
                        </Button>
                    </div>
                    <InstallmentsList
                        installments={installments}
                        formatCurrency={formatCurrency}
                        onEdit={(installment: Installment) => {
                            setEditingInstallment(installment);
                            setShowInstallmentModal(true);
                        }}
                        onDelete={deleteInstallment}
                        onPayInstallment={(id: string) => {
                            const inst = installments.find((i) => i.id === id);
                            if (inst) {
                                setPayingInstallment(inst);
                                setShowPaymentModal(true);
                            }
                        }}
                    />
                </TabsContent>

                {/* Goals Tab */}
                <TabsContent value="goals" className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold">
                            Financial Goals
                        </h2>
                        <Button
                            size="sm"
                            onClick={() => {
                                setEditingGoal(null);
                                setShowGoalModal(true);
                            }}>
                            <Plus className="h-4 w-4 mr-1" />
                            Add Goal
                        </Button>
                    </div>
                    <GoalsOverview
                        goals={goals}
                        formatCurrency={formatCurrency}
                        onEdit={(goal: FinancialGoal) => {
                            setEditingGoal(goal);
                            setShowGoalModal(true);
                        }}
                        onDelete={deleteGoal}
                        onContribute={addGoalContribution}
                    />
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="mt-4 space-y-4">
                    <FinanceSettingsPanel
                        settings={settings}
                        categories={categories}
                        onUpdateSettings={updateSettings}
                        onAddCategory={addCategory}
                        onUpdateCategory={updateCategory}
                        onDeleteCategory={deleteCategory}
                    />
                    <ExportImportPanel
                        onExport={exportData}
                        onImport={importData}
                        onReset={resetData}
                    />
                </TabsContent>
            </Tabs>

            {/* Floating Quick Add Button - Mobile */}
            <button
                onClick={() => setShowQuickAdd(true)}
                className="lg:hidden fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
                aria-label="Quick add expense">
                <Plus className="h-6 w-6" />
            </button>

            {/* Modals */}
            <QuickAddExpense
                isOpen={showQuickAdd}
                onClose={() => setShowQuickAdd(false)}
                categories={categories}
                onAdd={quickAddExpense}
            />

            <ExpenseModal
                isOpen={showExpenseModal}
                onClose={() => setShowExpenseModal(false)}
                categories={categories}
                onSave={addExpense}
                defaultCurrency={settings.defaultCurrency}
            />

            <IncomeModal
                isOpen={showIncomeModal}
                onClose={() => setShowIncomeModal(false)}
                onSave={addIncome}
                defaultCurrency={settings.defaultCurrency}
            />

            <InstallmentModal
                isOpen={showInstallmentModal}
                onClose={() => {
                    setShowInstallmentModal(false);
                    setEditingInstallment(null);
                }}
                onSave={handleSaveInstallment}
                installment={editingInstallment}
            />

            <InstallmentPaymentModal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    setPayingInstallment(null);
                }}
                installment={payingInstallment}
                onPay={addInstallmentPayment}
                formatCurrency={formatCurrency}
            />

            <GoalModal
                isOpen={showGoalModal}
                onClose={() => {
                    setShowGoalModal(false);
                    setEditingGoal(null);
                }}
                onSave={handleSaveGoal}
                goal={editingGoal}
            />
        </div>
    );
};

export default Finance;
