import { useMemo, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
    ArrowDownRight,
    ArrowUpRight,
    Award,
    BarChart3,
    Calendar,
    CheckCircle2,
    Flame,
    Lightbulb,
    Lock,
    Sparkles,
    Star,
    Target,
    TrendingDown,
    TrendingUp,
    Trophy,
    Wallet,
    Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Expense, FinancialGoal, Income } from "@/types/modules/finance";
import type { DateRange } from "@/utils/finance/aggregations";
import { GlassCard } from "../layout/GlassCard";
import { itemVariants } from "./chartTheme";

interface OverviewHighlightsProps {
    totals: { income: number; expense: number; savings: number; savingsRate: number };
    /** Biggest expense category in the range, if any */
    topCategory?: { icon: string; name: string; amount: number; percentage: number };
    dateRange: DateRange;
    incomes: Income[];
    expenses: Expense[];
    goals: FinancialGoal[];
    formatCurrency: (amount: number) => string;
}

/** Smart insights and achievements on the reports overview */
export const OverviewHighlights = ({
    totals,
    topCategory,
    dateRange,
    incomes,
    expenses,
    goals,
    formatCurrency,
}: OverviewHighlightsProps) => {
    // Smart insights with exciting gradients
    const insights = useMemo(() => {
        const result: {
            icon: ReactNode;
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
                    0,
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
                    0,
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
        if (topCategory) {
            const top = topCategory;
            result.push({
                icon: <span className="text-lg">{top.icon}</span>,
                emoji: "🎯",
                title: `Top: ${top.name}`,
                description: `${top.percentage.toFixed(
                    0,
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
                    (1000 * 60 * 60 * 24),
            ),
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
    }, [totals, topCategory, dateRange, formatCurrency]);

    // Achievements data - with progress tracking and exciting colors
    const achievements = useMemo(() => {
        const totalExpenses = expenses.length;
        const totalIncomes = incomes.length;
        const totalTransactions = totalExpenses + totalIncomes;
        const hasGoals = goals.length > 0;
        const completedGoals = goals.filter(
            (g) => g.currentAmount >= g.targetAmount,
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

    return (
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
                                    `bg-gradient-to-r ${insight.gradient} ${insight.glow}`,
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
                                            "backdrop-blur-sm text-white",
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
                                        (b) => b.unlocked,
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
                                        : "bg-muted/30 border-2 border-dashed border-muted-foreground/20",
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
                                            : "bg-muted text-muted-foreground",
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
                                            : "text-foreground",
                                    )}>
                                    {badge.title}
                                </p>
                                <p
                                    className={cn(
                                        "text-[11px] mb-3",
                                        badge.unlocked
                                            ? "text-white/80"
                                            : "text-muted-foreground",
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
                                                        100,
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
                                          (b) => !b.unlocked,
                                      ).length
                                  } more achievements to unlock!`
                                : "🎉 Amazing! You've unlocked all achievements!"}
                        </p>
                    </motion.div>
                </GlassCard>
            </motion.div>
        </div>
    );
};
