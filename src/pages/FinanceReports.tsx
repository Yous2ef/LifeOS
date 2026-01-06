/**
 * Finance Reports Page - Comprehensive Financial Analytics
 *
 * Features:
 * - Income vs Expenses trends
 * - Spending by category (donut + bars)
 * - Cash flow forecast
 * - Smart financial insights
 * - Achievements & streaks
 */

import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    TrendingUp,
    TrendingDown,
    PieChart,
    BarChart3,
    Lightbulb,
    Trophy,
    Calendar,
    Zap,
    Target,
    Wallet,
    Flame,
    Star,
    Award,
    CheckCircle2,
    Lock,
    Sparkles,
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
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    Area,
    AreaChart,
    Legend,
    Line,
} from "recharts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { useFinance } from "@/hooks/useFinance";
import { GlassCard } from "@/components/finance/v2/layout/GlassCard";

// Time range options
type TimeRange = "1m" | "3m" | "6m" | "1y" | "all";

const TIME_RANGES: { value: TimeRange; label: string }[] = [
    { value: "1m", label: "1M" },
    { value: "3m", label: "3M" },
    { value: "6m", label: "6M" },
    { value: "1y", label: "1Y" },
    { value: "all", label: "All" },
];

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export const FinanceReports = () => {
    const { incomes, expenses, categories, goals, formatCurrency } =
        useFinance();

    const [timeRange, setTimeRange] = useState<TimeRange>("6m");

    // Get date range based on selection
    const dateRange = useMemo(() => {
        const end = new Date();
        // Set end to end of today (23:59:59.999)
        end.setHours(23, 59, 59, 999);

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
    }, [timeRange]);

    // Filter data by date range
    const filteredData = useMemo(() => {
        const filteredIncomes = incomes.filter((i) => {
            const date = new Date(i.actualDate || i.createdAt);
            return date >= dateRange.start && date <= dateRange.end;
        });

        const filteredExpenses = expenses.filter((e) => {
            const date = new Date(e.date);
            return date >= dateRange.start && date <= dateRange.end;
        });

        return { incomes: filteredIncomes, expenses: filteredExpenses };
    }, [incomes, expenses, dateRange]);

    // Calculate totals
    const totals = useMemo(() => {
        const income = filteredData.incomes.reduce(
            (sum, i) => sum + i.amount,
            0
        );
        const expense = filteredData.expenses.reduce(
            (sum, e) => sum + e.amount,
            0
        );
        const savings = income - expense;
        const savingsRate = income > 0 ? (savings / income) * 100 : 0;

        return { income, expense, savings, savingsRate };
    }, [filteredData]);

    // Monthly chart data
    const monthlyData = useMemo(() => {
        const months: {
            [key: string]: {
                income: number;
                expense: number;
                savings: number;
                month: string;
            };
        } = {};

        // Initialize months in range
        const current = new Date(dateRange.start);
        while (current <= dateRange.end) {
            const key = `${current.getFullYear()}-${String(
                current.getMonth() + 1
            ).padStart(2, "0")}`;
            const monthName = current.toLocaleDateString("en-US", {
                month: "short",
            });
            months[key] = {
                income: 0,
                expense: 0,
                savings: 0,
                month: monthName,
            };
            current.setMonth(current.getMonth() + 1);
        }

        // Add income
        filteredData.incomes.forEach((i) => {
            const date = new Date(i.actualDate || i.createdAt);
            const key = `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;
            if (months[key]) {
                months[key].income += i.amount;
            }
        });

        // Add expenses
        filteredData.expenses.forEach((e) => {
            const date = new Date(e.date);
            const key = `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;
            if (months[key]) {
                months[key].expense += e.amount;
            }
        });

        // Calculate savings
        Object.values(months).forEach((m) => {
            m.savings = m.income - m.expense;
        });

        return Object.values(months);
    }, [filteredData, dateRange]);

    // Category spending data
    const categoryData = useMemo(() => {
        const categoryMap = new Map<
            string,
            { amount: number; count: number }
        >();

        filteredData.expenses.forEach((e) => {
            const current = categoryMap.get(e.categoryId) || {
                amount: 0,
                count: 0,
            };
            categoryMap.set(e.categoryId, {
                amount: current.amount + e.amount,
                count: current.count + 1,
            });
        });

        const result = categories
            .map((cat) => {
                const spending = categoryMap.get(cat.id) || {
                    amount: 0,
                    count: 0,
                };
                return {
                    ...cat,
                    amount: spending.amount,
                    count: spending.count,
                    percentage:
                        totals.expense > 0
                            ? (spending.amount / totals.expense) * 100
                            : 0,
                };
            })
            .filter((c) => c.amount > 0)
            .sort((a, b) => b.amount - a.amount);

        return result;
    }, [filteredData, categories, totals.expense]);

    // Cash Flow Forecast Data
    const forecastData = useMemo(() => {
        // Calculate average monthly income and expenses from historical data
        const monthCount = Math.max(monthlyData.length, 1);
        const avgIncome =
            monthlyData.reduce((sum, m) => sum + m.income, 0) / monthCount;
        const avgExpense =
            monthlyData.reduce((sum, m) => sum + m.expense, 0) / monthCount;
        const avgSavings = avgIncome - avgExpense;

        // Create forecast for next 3 months
        const today = new Date();
        const forecastMonths: {
            month: string;
            income: number;
            expense: number;
            forecast?: number;
            isProjection?: boolean;
        }[] = [];

        // Add last 2 months of actual data
        const recentData = monthlyData.slice(-2);
        recentData.forEach((m) => {
            forecastMonths.push({
                ...m,
                isProjection: false,
            });
        });

        // Add 3 months of projections
        for (let i = 1; i <= 3; i++) {
            const futureDate = new Date(today);
            futureDate.setMonth(futureDate.getMonth() + i);
            const monthName = futureDate.toLocaleDateString("en-US", {
                month: "short",
                year: "2-digit",
            });

            // Add some variance to projections (slightly optimistic)
            const projectedIncome = avgIncome * (1 + Math.random() * 0.1);
            const projectedExpense = avgExpense * (0.95 + Math.random() * 0.1);

            forecastMonths.push({
                month: monthName,
                income: projectedIncome,
                expense: projectedExpense,
                forecast: projectedIncome - projectedExpense,
                isProjection: true,
            });
        }

        // 3-month projection total
        const threeMonthForecast = avgSavings * 3;

        return {
            data: forecastMonths,
            avgMonthly: avgSavings,
            threeMonthForecast,
        };
    }, [monthlyData]);

    // Smart insights with exciting gradients
    const insights = useMemo(() => {
        const result: {
            icon: React.ReactNode;
            emoji: string;
            title: string;
            description: string;
            value: string;
            trend?: "up" | "down" | "neutral";
            gradient: string;
            iconBg: string;
            glow: string;
        }[] = [];

        // Savings rate insight
        if (totals.savingsRate > 20) {
            result.push({
                icon: <Sparkles className="w-5 h-5" />,
                emoji: "🚀",
                title: "Amazing Savings!",
                description: `You're crushing it with ${totals.savingsRate.toFixed(
                    0
                )}% savings rate`,
                value: formatCurrency(totals.savings),
                trend: "up",
                gradient: "from-emerald-500 via-green-500 to-teal-500",
                iconBg: "bg-white/20",
                glow: "shadow-emerald-500/40",
            });
        } else if (totals.savingsRate > 0) {
            result.push({
                icon: <TrendingUp className="w-5 h-5" />,
                emoji: "💪",
                title: "Building Wealth",
                description: `${totals.savingsRate.toFixed(
                    0
                )}% saved - push to 20%!`,
                value: formatCurrency(totals.savings),
                trend: "neutral",
                gradient: "from-amber-500 via-yellow-500 to-orange-500",
                iconBg: "bg-white/20",
                glow: "shadow-amber-500/40",
            });
        } else {
            result.push({
                icon: <TrendingDown className="w-5 h-5" />,
                emoji: "⚠️",
                title: "Budget Alert",
                description: "Time to cut some spending!",
                value: formatCurrency(Math.abs(totals.savings)),
                trend: "down",
                gradient: "from-red-500 via-rose-500 to-pink-500",
                iconBg: "bg-white/20",
                glow: "shadow-red-500/40",
            });
        }

        // Top spending category
        if (categoryData.length > 0) {
            const top = categoryData[0];
            result.push({
                icon: <span className="text-lg">{top.icon}</span>,
                emoji: "🎯",
                title: `Top: ${top.name}`,
                description: `${top.percentage.toFixed(
                    0
                )}% of spending goes here`,
                value: formatCurrency(top.amount),
                trend: "neutral",
                gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
                iconBg: "bg-white/20",
                glow: "shadow-violet-500/40",
            });
        }

        // Average daily spending
        const days = Math.max(
            1,
            Math.ceil(
                (dateRange.end.getTime() - dateRange.start.getTime()) /
                    (1000 * 60 * 60 * 24)
            )
        );
        const dailyAvg = totals.expense / days;
        result.push({
            icon: <Calendar className="w-5 h-5" />,
            emoji: "📅",
            title: "Daily Spending",
            description: `Your average per day`,
            value: formatCurrency(dailyAvg),
            trend: "neutral",
            gradient: "from-cyan-500 via-blue-500 to-indigo-500",
            iconBg: "bg-white/20",
            glow: "shadow-cyan-500/40",
        });

        // Monthly average
        const months = Math.max(1, days / 30);
        const monthlyAvg = totals.expense / months;
        result.push({
            icon: <BarChart3 className="w-5 h-5" />,
            emoji: "📊",
            title: "Monthly Avg",
            description: `Typical month spending`,
            value: formatCurrency(monthlyAvg),
            trend: "neutral",
            gradient: "from-indigo-500 via-blue-500 to-sky-500",
            iconBg: "bg-white/20",
            glow: "shadow-indigo-500/40",
        });

        return result;
    }, [totals, categoryData, dateRange, formatCurrency]);

    // Achievements data - with progress tracking and exciting colors
    const achievements = useMemo(() => {
        const totalExpenses = expenses.length;
        const totalIncomes = incomes.length;
        const totalTransactions = totalExpenses + totalIncomes;
        const hasGoals = goals.length > 0;
        const completedGoals = goals.filter(
            (g) => g.currentAmount >= g.targetAmount
        ).length;

        // Calculate streak (days without spending)
        const today = new Date();
        let streak = 0;
        const checkDate = new Date(today);

        while (streak < 365) {
            const dayExpenses = expenses.filter((e) => {
                const expDate = new Date(e.date);
                return expDate.toDateString() === checkDate.toDateString();
            });

            if (dayExpenses.length === 0) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }

        return {
            streak,
            badges: [
                {
                    id: "first",
                    icon: <Star className="w-6 h-6" />,
                    title: "Getting Started",
                    description: "Log your first expense",
                    unlocked: totalExpenses >= 1,
                    progress: Math.min(totalExpenses, 1),
                    target: 1,
                    gradient: "from-amber-400 via-yellow-500 to-orange-400",
                    bgGlow: "shadow-amber-500/50",
                    iconBg: "bg-gradient-to-br from-amber-400 to-yellow-500",
                },
                {
                    id: "regular",
                    icon: <CheckCircle2 className="w-6 h-6" />,
                    title: "Organized",
                    description: "Log 10 expenses",
                    unlocked: totalExpenses >= 10,
                    progress: Math.min(totalExpenses, 10),
                    target: 10,
                    gradient: "from-emerald-400 via-green-500 to-teal-400",
                    bgGlow: "shadow-emerald-500/50",
                    iconBg: "bg-gradient-to-br from-emerald-400 to-green-500",
                },
                {
                    id: "tracker",
                    icon: <Target className="w-6 h-6" />,
                    title: "Goal Setter",
                    description: "Create a financial goal",
                    unlocked: hasGoals,
                    progress: goals.length > 0 ? 1 : 0,
                    target: 1,
                    gradient: "from-violet-400 via-purple-500 to-fuchsia-400",
                    bgGlow: "shadow-violet-500/50",
                    iconBg: "bg-gradient-to-br from-violet-400 to-purple-500",
                },
                {
                    id: "achiever",
                    icon: <Trophy className="w-6 h-6" />,
                    title: "Achiever",
                    description: "Complete a goal",
                    unlocked: completedGoals > 0,
                    progress: completedGoals,
                    target: 1,
                    gradient: "from-rose-400 via-pink-500 to-red-400",
                    bgGlow: "shadow-rose-500/50",
                    iconBg: "bg-gradient-to-br from-rose-400 to-pink-500",
                },
                {
                    id: "saver",
                    icon: <Wallet className="w-6 h-6" />,
                    title: "Super Saver",
                    description: "Save 20%+ of income",
                    unlocked: totals.savingsRate >= 20,
                    progress: Math.min(Math.max(totals.savingsRate, 0), 20),
                    target: 20,
                    gradient: "from-cyan-400 via-blue-500 to-indigo-400",
                    bgGlow: "shadow-cyan-500/50",
                    iconBg: "bg-gradient-to-br from-cyan-400 to-blue-500",
                },
                {
                    id: "master",
                    icon: <Award className="w-6 h-6" />,
                    title: "Finance Master",
                    description: "Log 50 transactions",
                    unlocked: totalTransactions >= 50,
                    progress: Math.min(totalTransactions, 50),
                    target: 50,
                    gradient: "from-orange-400 via-amber-500 to-yellow-400",
                    bgGlow: "shadow-orange-500/50",
                    iconBg: "bg-gradient-to-br from-orange-400 to-amber-500",
                },
            ],
        };
    }, [expenses, incomes, goals, totals.savingsRate]);

    // Chart colors
    const CHART_COLORS = [
        "#8b5cf6",
        "#10b981",
        "#f59e0b",
        "#ef4444",
        "#3b82f6",
        "#ec4899",
        "#14b8a6",
        "#f97316",
        "#6366f1",
        "#84cc16",
    ];

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

                    {/* Time Range Selector */}
                    <div className="flex gap-1 p-1.5 bg-muted/50 rounded-2xl shadow-inner">
                        {TIME_RANGES.map((range) => (
                            <motion.button
                                key={range.value}
                                onClick={() => setTimeRange(range.value)}
                                className={cn(
                                    "px-4 py-2 text-sm font-bold rounded-xl transition-all",
                                    timeRange === range.value
                                        ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/30"
                                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                                )}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}>
                                {range.label}
                            </motion.button>
                        ))}
                    </div>
                </div>
            </motion.div>

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
                            : "bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 shadow-orange-500/25"
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

            {/* Insights & Achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Smart Insights - Exciting Design */}
                <motion.div variants={itemVariants}>
                    <GlassCard intensity="light" className="p-6">
                        <div className="flex items-center gap-3 mb-5">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30">
                                <Lightbulb className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">
                                    Smart Insights
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    AI-powered analysis
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {insights.map((insight, index) => (
                                <motion.div
                                    key={index}
                                    className={cn(
                                        "relative overflow-hidden rounded-2xl p-4 shadow-lg",
                                        `bg-gradient-to-r ${insight.gradient} ${insight.glow}`
                                    )}
                                    initial={{
                                        opacity: 0,
                                        x: -20,
                                        scale: 0.95,
                                    }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    transition={{
                                        delay: index * 0.1,
                                        type: "spring",
                                    }}
                                    whileHover={{ scale: 1.02, x: 4 }}>
                                    {/* Decorative elements */}
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />

                                    <div className="relative z-10 flex items-center gap-3">
                                        <div
                                            className={cn(
                                                "p-2.5 rounded-xl",
                                                insight.iconBg,
                                                "backdrop-blur-sm text-white"
                                            )}>
                                            {insight.icon}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-white text-sm flex items-center gap-1.5">
                                                <span>{insight.emoji}</span>
                                                {insight.title}
                                            </p>
                                            <p className="text-xs text-white/80">
                                                {insight.description}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-white text-lg">
                                                {insight.value}
                                            </p>
                                            {insight.trend &&
                                                insight.trend !== "neutral" && (
                                                    <span className="text-white/80 text-xs flex items-center justify-end gap-0.5">
                                                        {insight.trend ===
                                                            "up" && (
                                                            <>
                                                                <ArrowUpRight className="w-3 h-3" />{" "}
                                                                Great!
                                                            </>
                                                        )}
                                                        {insight.trend ===
                                                            "down" && (
                                                            <>
                                                                <ArrowDownRight className="w-3 h-3" />{" "}
                                                                Alert
                                                            </>
                                                        )}
                                                    </span>
                                                )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </GlassCard>
                </motion.div>

                {/* Achievements */}
                <motion.div variants={itemVariants}>
                    <GlassCard intensity="light" className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/30">
                                <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">
                                    Achievements
                                </h3>
                                <p className="text-xs text-muted-foreground">
                                    {
                                        achievements.badges.filter(
                                            (b) => b.unlocked
                                        ).length
                                    }
                                    /{achievements.badges.length} unlocked
                                </p>
                            </div>
                        </div>

                        {/* Streak */}
                        {achievements.streak > 0 && (
                            <motion.div
                                className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 shadow-xl shadow-orange-500/30 relative overflow-hidden"
                                initial={{ scale: 0.95 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300 }}>
                                {/* Sparkle effects */}
                                <div className="absolute inset-0 opacity-30">
                                    <div className="absolute top-2 left-4 w-2 h-2 bg-white rounded-full animate-pulse" />
                                    <div className="absolute top-4 right-8 w-1.5 h-1.5 bg-white rounded-full animate-pulse delay-300" />
                                    <div className="absolute bottom-3 left-12 w-1 h-1 bg-white rounded-full animate-pulse delay-500" />
                                </div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <motion.div
                                        className="p-3 rounded-xl bg-white/20 backdrop-blur-sm"
                                        animate={{ rotate: [0, -10, 10, 0] }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatDelay: 3,
                                        }}>
                                        <Flame className="w-7 h-7 text-white drop-shadow-lg" />
                                    </motion.div>
                                    <div className="text-white">
                                        <p className="font-bold text-xl flex items-center gap-2">
                                            <Zap className="w-5 h-5" />
                                            {achievements.streak} Day Streak!
                                        </p>
                                        <p className="text-sm text-white/80">
                                            🔥 No spending streak - Keep it
                                            going!
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* Badges Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {achievements.badges.map((badge, index) => (
                                <motion.div
                                    key={badge.id}
                                    className={cn(
                                        "relative p-4 rounded-2xl text-center transition-all overflow-hidden",
                                        badge.unlocked
                                            ? `bg-gradient-to-br ${badge.gradient} shadow-xl ${badge.bgGlow}`
                                            : "bg-muted/30 border-2 border-dashed border-muted-foreground/20"
                                    )}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={
                                        badge.unlocked
                                            ? { scale: 1.05, rotate: 1 }
                                            : { scale: 1.02 }
                                    }
                                    whileTap={{ scale: 0.98 }}>
                                    {/* Unlocked sparkle overlay */}
                                    {badge.unlocked && (
                                        <div className="absolute inset-0 opacity-40">
                                            <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                            <div className="absolute bottom-4 left-3 w-1 h-1 bg-white rounded-full animate-ping delay-500" />
                                        </div>
                                    )}

                                    {/* Icon */}
                                    <motion.div
                                        className={cn(
                                            "mx-auto mb-3 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg",
                                            badge.unlocked
                                                ? "bg-white/30 backdrop-blur-sm text-white"
                                                : "bg-muted text-muted-foreground"
                                        )}
                                        animate={
                                            badge.unlocked
                                                ? { y: [0, -3, 0] }
                                                : {}
                                        }
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            repeatDelay: 2,
                                        }}>
                                        {badge.unlocked ? (
                                            badge.icon
                                        ) : (
                                            <Lock className="w-5 h-5" />
                                        )}
                                    </motion.div>

                                    {/* Title & Description */}
                                    <p
                                        className={cn(
                                            "text-sm font-bold mb-1",
                                            badge.unlocked
                                                ? "text-white"
                                                : "text-foreground"
                                        )}>
                                        {badge.title}
                                    </p>
                                    <p
                                        className={cn(
                                            "text-[11px] mb-3",
                                            badge.unlocked
                                                ? "text-white/80"
                                                : "text-muted-foreground"
                                        )}>
                                        {badge.description}
                                    </p>

                                    {/* Progress bar for locked badges */}
                                    {!badge.unlocked && (
                                        <div className="mt-2">
                                            <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                                                <span>
                                                    {badge.progress}/
                                                    {badge.target}
                                                </span>
                                                <span>
                                                    {Math.round(
                                                        (badge.progress /
                                                            badge.target) *
                                                            100
                                                    )}
                                                    %
                                                </span>
                                            </div>
                                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    className={`h-full bg-gradient-to-r ${badge.gradient} rounded-full`}
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${
                                                            (badge.progress /
                                                                badge.target) *
                                                            100
                                                        }%`,
                                                    }}
                                                    transition={{
                                                        duration: 1,
                                                        delay: index * 0.1,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Unlocked checkmark */}
                                    {badge.unlocked && (
                                        <div className="absolute top-2 right-2 w-5 h-5 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {/* Motivational footer */}
                        <motion.div
                            className="mt-5 p-3 rounded-xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-fuchsia-500/10 border border-violet-500/20 text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}>
                            <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
                                ✨{" "}
                                {achievements.badges.filter((b) => !b.unlocked)
                                    .length > 0
                                    ? `${
                                          achievements.badges.filter(
                                              (b) => !b.unlocked
                                          ).length
                                      } more achievements to unlock!`
                                    : "🎉 Amazing! You've unlocked all achievements!"}
                            </p>
                        </motion.div>
                    </GlassCard>
                </motion.div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Income vs Expenses Chart */}
                <motion.div variants={itemVariants}>
                    <GlassCard intensity="light" className="p-6">
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
                                        : "bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-red-500/30"
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
                                        tickFormatter={(v) =>
                                            `${(v / 1000).toFixed(0)}k`
                                        }
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

                {/* Expenses by Category Donut */}
                <motion.div variants={itemVariants}>
                    <GlassCard intensity="light" className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 shadow-lg shadow-violet-500/30">
                                    <PieChart className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">
                                        Expenses by Category
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        🎯 {formatCurrency(totals.expense)}{" "}
                                        total spent
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="h-[200px] w-[200px] mx-auto">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={categoryData.slice(0, 6)}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="amount"
                                            nameKey="name">
                                            {categoryData
                                                .slice(0, 6)
                                                .map((_, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={
                                                            CHART_COLORS[
                                                                index %
                                                                    CHART_COLORS.length
                                                            ]
                                                        }
                                                    />
                                                ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number) =>
                                                formatCurrency(value)
                                            }
                                            contentStyle={{
                                                backgroundColor: "var(--card)",
                                                border: "1px solid var(--border)",
                                                borderRadius: "12px",
                                            }}
                                        />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="flex-1 space-y-2">
                                {categoryData.slice(0, 5).map((cat, index) => (
                                    <div
                                        key={cat.id}
                                        className="flex items-center gap-2">
                                        <div
                                            className="w-3 h-3 rounded-full shrink-0"
                                            style={{
                                                backgroundColor:
                                                    CHART_COLORS[
                                                        index %
                                                            CHART_COLORS.length
                                                    ],
                                            }}
                                        />
                                        <span className="text-sm truncate flex-1">
                                            {cat.icon} {cat.name}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {cat.percentage.toFixed(0)}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>

            {/* Cash Flow Forecast */}
            <motion.div variants={itemVariants} className="mb-6">
                <GlassCard intensity="light" className="p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 shadow-lg shadow-teal-500/30">
                            <TrendingUp className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">
                                Cash Flow Forecast
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Future projections based on your habits
                            </p>
                        </div>
                    </div>

                    {/* Forecast Summary Cards */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <motion.div
                            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 p-4 shadow-lg shadow-emerald-500/25"
                            whileHover={{ scale: 1.02 }}>
                            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-1">
                                    <CheckCircle2 className="w-4 h-4 text-white/80" />
                                    <span className="text-white/80 text-xs font-medium">
                                        3-Month Forecast
                                    </span>
                                </div>
                                <p
                                    className={cn(
                                        "text-2xl font-bold text-white",
                                        forecastData.threeMonthForecast < 0 &&
                                            "text-red-200"
                                    )}>
                                    {forecastData.threeMonthForecast >= 0
                                        ? "+"
                                        : ""}
                                    {formatCurrency(
                                        forecastData.threeMonthForecast
                                    )}
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-4 shadow-lg shadow-cyan-500/25"
                            whileHover={{ scale: 1.02 }}>
                            <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-white/80" />
                                    <span className="text-white/80 text-xs font-medium">
                                        Monthly Average
                                    </span>
                                </div>
                                <p
                                    className={cn(
                                        "text-2xl font-bold text-white",
                                        forecastData.avgMonthly < 0 &&
                                            "text-red-200"
                                    )}>
                                    {forecastData.avgMonthly >= 0 ? "+" : ""}
                                    {formatCurrency(forecastData.avgMonthly)}
                                </p>
                            </div>
                        </motion.div>
                    </div>

                    {/* Forecast Chart */}
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={forecastData.data}>
                                <defs>
                                    <linearGradient
                                        id="forecastIncomeGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1">
                                        <stop
                                            offset="5%"
                                            stopColor="#10b981"
                                            stopOpacity={0.4}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#10b981"
                                            stopOpacity={0.05}
                                        />
                                    </linearGradient>
                                    <linearGradient
                                        id="forecastExpenseGradient"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1">
                                        <stop
                                            offset="5%"
                                            stopColor="#ef4444"
                                            stopOpacity={0.4}
                                        />
                                        <stop
                                            offset="95%"
                                            stopColor="#ef4444"
                                            stopOpacity={0.05}
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
                                    tickFormatter={(v) =>
                                        `${(v / 1000).toFixed(0)}k`
                                    }
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
                                    fill="url(#forecastIncomeGradient)"
                                    name="Income"
                                />
                                <Area
                                    type="monotone"
                                    dataKey="expense"
                                    stroke="#ef4444"
                                    strokeWidth={2}
                                    fill="url(#forecastExpenseGradient)"
                                    name="Expenses"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="forecast"
                                    stroke="#8b5cf6"
                                    strokeWidth={2}
                                    strokeDasharray="8 4"
                                    dot={{ fill: "#8b5cf6", r: 4 }}
                                    name="Forecast"
                                />
                                <Legend />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </motion.div>

            {/* Spending by Category Bars */}
            <motion.div variants={itemVariants} className="mb-6">
                <GlassCard intensity="light" className="p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 shadow-lg shadow-cyan-500/30">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">
                                Spending Breakdown
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                💰 Where your money goes
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {categoryData.slice(0, 8).map((cat, index) => (
                            <motion.div
                                key={cat.id}
                                className="space-y-2 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">
                                            {cat.icon}
                                        </span>
                                        <span className="font-semibold">
                                            {cat.name}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-lg">
                                            {formatCurrency(cat.amount)}
                                        </span>
                                        <span className="text-sm text-muted-foreground ml-2 px-2 py-0.5 rounded-full bg-muted">
                                            {cat.percentage.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="h-3 bg-muted rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full rounded-full"
                                        style={{
                                            background: `linear-gradient(90deg, ${
                                                CHART_COLORS[
                                                    index % CHART_COLORS.length
                                                ]
                                            }, ${
                                                CHART_COLORS[
                                                    (index + 1) %
                                                        CHART_COLORS.length
                                                ]
                                            })`,
                                        }}
                                        initial={{ width: 0 }}
                                        animate={{
                                            width: `${cat.percentage}%`,
                                        }}
                                        transition={{
                                            duration: 0.8,
                                            delay: index * 0.1,
                                        }}
                                    />
                                </div>
                            </motion.div>
                        ))}

                        {categoryData.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">
                                No expenses in this time period
                            </p>
                        )}
                    </div>
                </GlassCard>
            </motion.div>
        </motion.div>
    );
};

export default FinanceReports;
