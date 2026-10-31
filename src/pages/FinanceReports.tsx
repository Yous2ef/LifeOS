/**
 * Finance Reports Page
 *
 * Tabs: overview (totals, cash flow, forecast, insights), spending and income
 * (same depth for both), monthly statement, net worth trend, projects and —
 * when tracking is on — the charity ledger.
 */

import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
} from "lucide-react";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
    Legend,
    Line,
} from "recharts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useFinance } from "@/hooks/useFinance";
import { usePrivacyMode } from "@/hooks/usePrivacyMode";
import { GlassCard } from "@/components/finance/v2/layout/GlassCard";
import { CharityLedgerReport } from "@/components/finance/v2/reports/CharityLedgerReport";
import { ChoiceChips } from "@/components/finance/v2/reports/ReportCard";
import { FlowReport, type FlowRow } from "@/components/finance/v2/reports/FlowReport";
import { ForecastCard } from "@/components/finance/v2/reports/ForecastCard";
import { MonthlyStatementReport } from "@/components/finance/v2/reports/MonthlyStatementReport";
import { NetWorthReport } from "@/components/finance/v2/reports/NetWorthReport";
import { OverviewHighlights } from "@/components/finance/v2/reports/OverviewHighlights";
import { ProjectReport } from "@/components/finance/v2/reports/ProjectReport";
import {
    axisAmount,
    containerVariants,
    itemVariants,
    type ReportFormat,
} from "@/components/finance/v2/reports/chartTheme";
import {
    countedIncomesInRange,
    expensesInRange,
    monthKey,
    monthlySeries,
    sumAmounts,
    totalsByCategory,
} from "@/utils/finance/aggregations";
import { incomeDate } from "@/utils/finance/balances";
import { todayISO } from "@/utils/finance/dates";
import {
    firstRecordDate,
    forecastFromHistory,
    netWorthSeries,
    projectReport,
} from "@/utils/finance/reports";

// Time range options
type TimeRange = "1m" | "3m" | "6m" | "1y" | "all";
type ReportFilterMode = "preset" | "from-only" | "from-to";

const FILTER_MODES: { value: ReportFilterMode; label: string }[] = [
    { value: "preset", label: "Preset" },
    { value: "from-only", label: "From" },
    { value: "from-to", label: "From → To" },
];

const TIME_RANGES: { value: TimeRange; label: string }[] = [
    { value: "1m", label: "1M" },
    { value: "3m", label: "3M" },
    { value: "6m", label: "6M" },
    { value: "1y", label: "1Y" },
    { value: "all", label: "All" },
];

type ReportTab =
    | "overview"
    | "spending"
    | "income"
    | "statement"
    | "networth"
    | "projects"
    | "charity";

const TABS: { value: ReportTab; label: string }[] = [
    { value: "overview", label: "Overview" },
    { value: "spending", label: "Spending" },
    { value: "income", label: "Income" },
    { value: "statement", label: "Statement" },
    { value: "networth", label: "Net worth" },
    { value: "projects", label: "Projects" },
    { value: "charity", label: "Charity" },
];

// Tabs whose numbers follow the date range filter
const RANGED_TABS: ReportTab[] = ["overview", "spending", "income", "networth"];

type FundScope = "focused" | "all";

const MONTH_MS = 30.44 * 24 * 60 * 60 * 1000;

const formatDisplayDate = (dateStr: string) => {
    // Plain YYYY-MM-DD is read as a local day, not UTC midnight
    const date = new Date(
        /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T00:00:00` : dateStr,
    );
    if (Number.isNaN(date.getTime())) return dateStr;
    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
};

export const FinanceReports = () => {
    const {
        accounts,
        transfers,
        incomes,
        expenses,
        categories,
        incomeCategories,
        goals,
        funds,
        focusedFundIds,
        loans,
        loanPayments,
        projects,
        settings,
        charitySettings,
        charityLedger,
        formatCurrency,
        formatAmount,
    } = useFinance();
    const { mask } = usePrivacyMode();
    // Axis ticks don't go through formatCurrency, so mask them here
    const formatAxisAmount = (v: number) => mask(axisAmount(v));
    const format: ReportFormat = {
        currency: (amount) => formatCurrency(amount),
        axis: formatAxisAmount,
        date: formatDisplayDate,
    };

    const [searchParams, setSearchParams] = useSearchParams();
    const tabs = TABS.filter(
        (tab) => tab.value !== "charity" || charitySettings.enabled,
    );
    const requestedTab = searchParams.get("tab") as ReportTab | null;
    const tab: ReportTab =
        requestedTab && tabs.some((t) => t.value === requestedTab)
            ? requestedTab
            : "overview";
    const setTab = (next: ReportTab) =>
        setSearchParams(next === "overview" ? {} : { tab: next }, {
            replace: true,
        });

    const [timeRange, setTimeRange] = useState<TimeRange>("6m");
    const [filterMode, setFilterMode] = useState<ReportFilterMode>("preset");
    const [fromDate, setFromDate] = useState<string>("");
    const [toDate, setToDate] = useState<string>("");
    const [fundScope, setFundScope] = useState<FundScope>("focused");

    const today = todayISO();

    // Get date range based on selection
    const dateRange = useMemo(() => {
        const end = new Date();
        // Set end to end of today (23:59:59.999)
        end.setHours(23, 59, 59, 999);

        if (filterMode !== "preset") {
            const parsedFrom = fromDate ? new Date(fromDate) : null;
            const parsedTo = toDate ? new Date(toDate) : null;

            const start =
                parsedFrom && !Number.isNaN(parsedFrom.getTime())
                    ? new Date(parsedFrom)
                    : new Date(2020, 0, 1);
            start.setHours(0, 0, 0, 0);

            const customEnd =
                filterMode === "from-to" &&
                parsedTo &&
                !Number.isNaN(parsedTo.getTime())
                    ? new Date(parsedTo)
                    : new Date(end);
            customEnd.setHours(23, 59, 59, 999);

            const safeEnd = customEnd < start ? new Date(start) : customEnd;
            safeEnd.setHours(23, 59, 59, 999);

            return { start, end: safeEnd };
        }

        const start = new Date();

        switch (timeRange) {
            case "1m":
                start.setMonth(start.getMonth() - 1);
                break;
            case "3m":
                start.setMonth(start.getMonth() - 3);
                break;
            case "6m":
                start.setMonth(start.getMonth() - 6);
                break;
            case "1y":
                start.setFullYear(start.getFullYear() - 1);
                break;
            case "all":
                start.setFullYear(2020);
                break;
        }

        // Set start to beginning of that day (00:00:00.000)
        start.setHours(0, 0, 0, 0);

        return { start, end };
    }, [timeRange, filterMode, fromDate, toDate]);

    // The range clipped to the first record, so "All" doesn't chart (or
    // average over) years before any money was tracked
    const firstDay = useMemo(
        () => firstRecordDate({ incomes, expenses, transfers, loans }),
        [incomes, expenses, transfers, loans],
    );
    const activeRange = useMemo(() => {
        const firstDate = new Date(`${firstDay ?? today}T00:00:00`);
        const start = firstDate > dateRange.start ? firstDate : dateRange.start;
        return { start: start > dateRange.end ? dateRange.start : start, end: dateRange.end };
    }, [firstDay, today, dateRange]);

    const monthsInRange = Math.max(
        1,
        Math.round(
            ((activeRange.end.getTime() - activeRange.start.getTime()) / MONTH_MS) * 10,
        ) / 10,
    );

    // Filter data by date range (received income only)
    const filteredData = useMemo(
        () => ({
            incomes: countedIncomesInRange(incomes, dateRange),
            expenses: expensesInRange(expenses, dateRange),
        }),
        [incomes, expenses, dateRange],
    );

    // Calculate totals
    const totals = useMemo(() => {
        const income = sumAmounts(filteredData.incomes);
        const expense = sumAmounts(filteredData.expenses);
        const savings = income - expense;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;

        return { income, expense, savings, savingsRate };
    }, [filteredData]);

    // Monthly chart data
    const monthlyData = useMemo(
        () => monthlySeries(incomes, expenses, activeRange),
        [incomes, expenses, activeRange],
    );

    const topCategory = useMemo(() => {
        const top = totalsByCategory(filteredData.expenses, categories)[0];
        return top && top.amount > 0
            ? { ...top.category, amount: top.amount, percentage: top.percentage }
            : undefined;
    }, [categories, filteredData.expenses]);

    const expenseRows = useMemo<FlowRow[]>(
        () =>
            filteredData.expenses.map((e) => ({
                id: e.id,
                title: e.title,
                amount: e.amount,
                date: e.date,
                categoryId: e.categoryId,
                projectId: e.projectId,
            })),
        [filteredData.expenses],
    );
    const incomeRows = useMemo<FlowRow[]>(
        () =>
            filteredData.incomes.map((i) => ({
                id: i.id,
                title: i.title,
                amount: i.amount,
                date: incomeDate(i),
                categoryId: i.categoryId,
                projectId: i.projectId,
            })),
        [filteredData.incomes],
    );

    // Forecast reads the last full months on its own, whatever the range,
    // starting no earlier than the first record so empty months don't count
    const forecast = useMemo(() => {
        const now = new Date();
        const threeBack = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        const first = firstDay ? new Date(`${firstDay.slice(0, 7)}-01T00:00:00`) : now;
        const series = monthlySeries(incomes, expenses, {
            start: first > threeBack ? first : threeBack,
            end: now,
        });
        return {
            forecast: forecastFromHistory(series, monthKey(now)),
            recent: series.filter((m) => m.key < monthKey(now)).slice(-2),
        };
    }, [incomes, expenses, firstDay]);

    const expenseMonthly = useMemo(
        () => monthlyData.map((m) => ({ ...m, amount: m.expense })),
        [monthlyData],
    );
    const incomeMonthly = useMemo(
        () => monthlyData.map((m) => ({ ...m, amount: m.income })),
        [monthlyData],
    );

    // Statement and net worth follow the home screen's focus by default
    const hasFocus = focusedFundIds.length > 0;
    const scopeFundIds = useMemo(
        () => (fundScope === "focused" ? focusedFundIds : []),
        [fundScope, focusedFundIds],
    );
    const focusLabel = funds
        .filter((fund) => focusedFundIds.includes(fund.id))
        .map((fund) => fund.name)
        .join(" + ");
    const scopeControl = hasFocus ? (
        <ChoiceChips
            value={fundScope}
            onChange={setFundScope}
            options={[
                { value: "focused", label: focusLabel || "Focused" },
                { value: "all", label: "All funds" },
            ]}
            className="shrink-0"
        />
    ) : undefined;

    const statementSource = useMemo(
        () => ({
            accounts,
            incomes,
            expenses,
            transfers,
            loans,
            loanPayments,
            categories,
            incomeCategories,
        }),
        [accounts, incomes, expenses, transfers, loans, loanPayments, categories, incomeCategories],
    );
    const statementScope = useMemo(
        () => ({
            fundIds: scopeFundIds,
            accountIds: accounts.filter((a) => a.isActive).map((a) => a.id),
        }),
        [scopeFundIds, accounts],
    );

    const netWorthPoints = useMemo(
        () =>
            tab === "networth"
                ? netWorthSeries(
                      statementSource,
                      monthKey(activeRange.start),
                      monthKey(activeRange.end),
                      { fundIds: statementScope.fundIds, today },
                  )
                : [],
        [tab, statementSource, activeRange, statementScope, today],
    );

    const projectRows = useMemo(
        () =>
            projectReport({ incomes, expenses, categories }, projects, {
                charity: charitySettings,
            }),
        [incomes, expenses, categories, projects, charitySettings],
    );

    return (
        <motion.div
            className="min-h-screen bg-background p-4 md:p-6 lg:p-8 text-primary"
            variants={containerVariants}
            initial="hidden"
            animate="visible">
            {/* Header */}
            <motion.div variants={itemVariants} className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                    <Link to="/finance">
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                    </Link>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            Financial Reports
                        </h1>
                        <p className="text-muted-foreground">
                            Smart insights & analytics for your finances
                        </p>
                    </div>

                    {/* Report Filter */}
                    {RANGED_TABS.includes(tab) && (
                        <div className="space-y-2">
                            <ChoiceChips
                                value={filterMode}
                                onChange={setFilterMode}
                                options={FILTER_MODES}
                            />

                            {filterMode === "preset" ? (
                                <ChoiceChips
                                    value={timeRange}
                                    onChange={setTimeRange}
                                    options={TIME_RANGES}
                                />
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) =>
                                            setFromDate(e.target.value)
                                        }
                                        className="h-10 px-3 rounded-xl bg-background border border-border text-sm"
                                    />
                                    {filterMode === "from-to" && (
                                        <input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) =>
                                                setToDate(e.target.value)
                                            }
                                            className="h-10 px-3 rounded-xl bg-background border border-border text-sm"
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <ChoiceChips
                    value={tab}
                    onChange={setTab}
                    options={tabs}
                    className="mt-5"
                />
            </motion.div>

            {/* Keyed so a newly shown tab runs its own enter animation:
                children mounted after the page's first animation would
                otherwise stay at their hidden variant */}
            <motion.div
                key={tab}
                variants={containerVariants}
                initial="hidden"
                animate="visible">
                {tab === "overview" && (
                    <>
                        {/* Summary Cards - Exciting Gradient Design */}
                        <motion.div
                            variants={itemVariants}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            {/* Total Income */}
                            <motion.div
                                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-500 p-5 shadow-xl shadow-emerald-500/25"
                                whileHover={{ scale: 1.02, y: -2 }}
                                transition={{ type: "spring", stiffness: 300 }}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                                            <ArrowUpRight className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-white/80 text-sm font-medium">
                                            Total Income
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold text-white">
                                        {formatCurrency(totals.income)}
                                    </p>
                                    <p className="text-white/70 text-xs mt-1">
                                        💰 Money earned
                                    </p>
                                </div>
                            </motion.div>

                            {/* Total Expenses */}
                            <motion.div
                                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-red-500 to-pink-500 p-5 shadow-xl shadow-rose-500/25"
                                whileHover={{ scale: 1.02, y: -2 }}
                                transition={{ type: "spring", stiffness: 300 }}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                                            <ArrowDownRight className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-white/80 text-sm font-medium">
                                            Total Expenses
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold text-white">
                                        {formatCurrency(totals.expense)}
                                    </p>
                                    <p className="text-white/70 text-xs mt-1">
                                        💸 Money spent
                                    </p>
                                </div>
                            </motion.div>

                            {/* Net Savings */}
                            <motion.div
                                className={cn(
                                    "relative overflow-hidden rounded-2xl p-5 shadow-xl",
                                    totals.savings >= 0
                                        ? "bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-500 shadow-violet-500/25"
                                        : "bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 shadow-orange-500/25",
                                )}
                                whileHover={{ scale: 1.02, y: -2 }}
                                transition={{ type: "spring", stiffness: 300 }}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
                                            <DollarSign className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="text-white/80 text-sm font-medium">
                                            Net Savings
                                        </span>
                                    </div>
                                    <p className="text-3xl font-bold text-white">
                                        {totals.savings >= 0 ? "+" : ""}
                                        {formatCurrency(totals.savings)}
                                    </p>
                                    <p className="text-white/70 text-xs mt-1">
                                        {totals.savings >= 0
                                            ? "✨ Great job saving!"
                                            : "⚡ Time to save more!"}
                                    </p>
                                </div>
                            </motion.div>
                        </motion.div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <motion.div variants={itemVariants}>
                                <GlassCard intensity="light" className="p-6 h-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/30">
                                                <TrendingUp className="w-5 h-5 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">
                                                    Income vs Expenses
                                                </h3>
                                                <p className="text-xs text-muted-foreground">
                                                    📈 Monthly cash flow trends
                                                </p>
                                            </div>
                                        </div>
                                        <motion.div
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-sm font-bold shadow-lg",
                                                totals.savings >= 0
                                                    ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-emerald-500/30"
                                                    : "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-500/30",
                                            )}
                                            whileHover={{ scale: 1.05 }}>
                                            {totals.savings >= 0 ? "↑" : "↓"}{" "}
                                            {Math.abs(totals.savingsRate).toFixed(1)}%
                                        </motion.div>
                                    </div>

                                    <div className="h-[280px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={monthlyData}>
                                                <defs>
                                                    <linearGradient
                                                        id="incomeGradient"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1">
                                                        <stop
                                                            offset="5%"
                                                            stopColor="#10b981"
                                                            stopOpacity={0.3}
                                                        />
                                                        <stop
                                                            offset="95%"
                                                            stopColor="#10b981"
                                                            stopOpacity={0}
                                                        />
                                                    </linearGradient>
                                                    <linearGradient
                                                        id="expenseGradient"
                                                        x1="0"
                                                        y1="0"
                                                        x2="0"
                                                        y2="1">
                                                        <stop
                                                            offset="5%"
                                                            stopColor="#ef4444"
                                                            stopOpacity={0.3}
                                                        />
                                                        <stop
                                                            offset="95%"
                                                            stopColor="#ef4444"
                                                            stopOpacity={0}
                                                        />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="var(--border)"
                                                    opacity={0.5}
                                                />
                                                <XAxis
                                                    dataKey="month"
                                                    stroke="var(--muted-foreground)"
                                                    fontSize={12}
                                                />
                                                <YAxis
                                                    stroke="var(--muted-foreground)"
                                                    fontSize={12}
                                                    tickFormatter={formatAxisAmount}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: "var(--card)",
                                                        border: "1px solid var(--border)",
                                                        borderRadius: "12px",
                                                    }}
                                                    formatter={(value: number) =>
                                                        formatCurrency(value)
                                                    }
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="income"
                                                    stroke="#10b981"
                                                    strokeWidth={2}
                                                    fill="url(#incomeGradient)"
                                                    name="Income"
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="expense"
                                                    stroke="#ef4444"
                                                    strokeWidth={2}
                                                    fill="url(#expenseGradient)"
                                                    name="Expenses"
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="savings"
                                                    stroke="#3b82f6"
                                                    strokeWidth={2}
                                                    strokeDasharray="5 5"
                                                    dot={false}
                                                    name="Savings"
                                                />
                                                <Legend />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </GlassCard>
                            </motion.div>
                            <ForecastCard
                                forecast={forecast.forecast}
                                recent={forecast.recent}
                                format={format}
                            />
                        </div>

                        <OverviewHighlights
                            totals={totals}
                            topCategory={topCategory}
                            dateRange={activeRange}
                            incomes={incomes}
                            expenses={expenses}
                            goals={goals}
                            formatCurrency={formatCurrency}
                        />
                    </>
                )}

                {tab === "spending" && (
                    <FlowReport
                        kind="expense"
                        rows={expenseRows}
                        categories={categories}
                        projects={projects}
                        monthly={expenseMonthly}
                        monthCount={monthsInRange}
                        format={format}
                    />
                )}

                {tab === "income" && (
                    <FlowReport
                        kind="income"
                        rows={incomeRows}
                        categories={incomeCategories}
                        projects={projects}
                        monthly={incomeMonthly}
                        monthCount={monthsInRange}
                        format={format}
                    />
                )}

                {tab === "statement" && (
                    <MonthlyStatementReport
                        source={statementSource}
                        scope={statementScope}
                        startDay={settings.monthStartDay}
                        today={today}
                        format={format}
                        scopeControl={scopeControl}
                    />
                )}

                {tab === "networth" && (
                    <NetWorthReport
                        points={netWorthPoints}
                        format={format}
                        scopeControl={scopeControl}
                    />
                )}

                {tab === "projects" && (
                    <ProjectReport
                        rows={projectRows}
                        showCharity={charitySettings.enabled}
                        format={format}
                    />
                )}

                {tab === "charity" && charityLedger && (
                    <CharityLedgerReport
                        ledger={charityLedger}
                        rate={charitySettings.rate}
                        startDate={charitySettings.startDate}
                        format={format}
                        formatAmount={formatAmount}
                    />
                )}
            </motion.div>
        </motion.div>
    );
};

export default FinanceReports;
