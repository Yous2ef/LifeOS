import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/progress";
import {
    Flame,
    Award,
    Trophy,
    Star,
    Zap,
    Heart,
    Sparkles,
    Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Expense, Budget, FinancialGoal } from "@/types/finance";

interface SpendingBehaviorProps {
    expenses: Expense[];
    budgets: Budget[];
    goals: FinancialGoal[];
}

interface Achievement {
    id: string;
    icon: React.ElementType;
    title: string;
    description: string;
    color: string;
    earned: boolean;
    progress?: number;
}

interface Streak {
    type: "budget" | "saving" | "goal";
    days: number;
    icon: React.ElementType;
    title: string;
    color: string;
}

export function SpendingBehavior({
    expenses,
    budgets,
    goals,
}: SpendingBehaviorProps) {
    const behaviorData = useMemo(() => {
        const now = new Date();
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );

        // Calculate streaks
        const streaks: Streak[] = [];

        // Budget streak - days in a row under budget
        let budgetStreak = 0;
        const sortedBudgets = [...budgets].sort((a, b) =>
            b.month.localeCompare(a.month)
        );
        for (const budget of sortedBudgets) {
            if (budget.totalActualExpenses <= budget.totalPlannedExpenses) {
                budgetStreak++;
            } else {
                break;
            }
        }
        if (budgetStreak > 0) {
            streaks.push({
                type: "budget",
                days: budgetStreak,
                icon: Flame,
                title: `${budgetStreak} شهر ملتزم بالميزانية`,
                color: "text-orange-500",
            });
        }

        // Saving streak - check consecutive days without non-essential spending
        const expensesByDate = new Map<string, number>();
        expenses.forEach((exp) => {
            const dateKey = new Date(exp.date).toISOString().split("T")[0];
            expensesByDate.set(
                dateKey,
                (expensesByDate.get(dateKey) || 0) + exp.amount
            );
        });

        let noSpendStreak = 0;
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(
                today.getTime() - i * 24 * 60 * 60 * 1000
            );
            const dateKey = checkDate.toISOString().split("T")[0];
            const dayExpenses = expensesByDate.get(dateKey) || 0;

            if (dayExpenses === 0) {
                noSpendStreak++;
            } else {
                break;
            }
        }
        if (noSpendStreak >= 1) {
            streaks.push({
                type: "saving",
                days: noSpendStreak,
                icon: Zap,
                title: `${noSpendStreak} يوم بدون صرف`,
                color: "text-yellow-500",
            });
        }

        // Goal progress streak
        const activeGoals = goals.filter((g) => g.status === "active");
        const goalsWithProgress = activeGoals.filter(
            (g) => g.currentAmount > 0
        );
        if (goalsWithProgress.length > 0) {
            streaks.push({
                type: "goal",
                days: goalsWithProgress.length,
                icon: Target,
                title: `${goalsWithProgress.length} أهداف نشطة`,
                color: "text-blue-500",
            });
        }

        // Calculate achievements
        const achievements: Achievement[] = [];

        // First expense tracked
        if (expenses.length >= 1) {
            achievements.push({
                id: "first-expense",
                icon: Star,
                title: "البداية",
                description: "سجلت أول نفقة",
                color: "bg-yellow-500",
                earned: true,
            });
        }

        // Track 10 expenses
        achievements.push({
            id: "ten-expenses",
            icon: Award,
            title: "منظم",
            description: "سجل 10 نفقات",
            color: "bg-blue-500",
            earned: expenses.length >= 10,
            progress: Math.min(100, (expenses.length / 10) * 100),
        });

        // Track 50 expenses
        achievements.push({
            id: "fifty-expenses",
            icon: Trophy,
            title: "خبير التتبع",
            description: "سجل 50 نفقة",
            color: "bg-purple-500",
            earned: expenses.length >= 50,
            progress: Math.min(100, (expenses.length / 50) * 100),
        });

        // Complete a goal
        const completedGoals = goals.filter((g) => g.status === "completed");
        achievements.push({
            id: "first-goal",
            icon: Heart,
            title: "محقق الأهداف",
            description: "أكمل هدف مالي",
            color: "bg-red-500",
            earned: completedGoals.length >= 1,
            progress:
                activeGoals.length > 0
                    ? Math.max(
                          ...activeGoals.map(
                              (g) => (g.currentAmount / g.targetAmount) * 100
                          )
                      )
                    : 0,
        });

        // Stay under budget for a month
        const underBudgetMonths = budgets.filter(
            (b) => b.totalActualExpenses <= b.totalPlannedExpenses
        );
        achievements.push({
            id: "budget-master",
            icon: Sparkles,
            title: "سيد الميزانية",
            description: "التزم بالميزانية شهر كامل",
            color: "bg-green-500",
            earned: underBudgetMonths.length >= 1,
            progress:
                budgets.length > 0
                    ? (underBudgetMonths.length / budgets.length) * 100
                    : 0,
        });

        // Calculate motivational message
        const messages = [];

        if (budgetStreak >= 3) {
            messages.push("🔥 أداء مذهل! استمر على هذا المعدل");
        }

        if (noSpendStreak >= 3) {
            messages.push("💪 إرادة قوية! كل يوم بدون صرف غير ضروري هو انتصار");
        }

        if (completedGoals.length > 0) {
            messages.push(`🏆 حققت ${completedGoals.length} أهداف! أنت ملهم`);
        }

        if (activeGoals.some((g) => g.currentAmount / g.targetAmount >= 0.9)) {
            messages.push("🎯 قربت تحقق هدفك! شوية كمان");
        }

        if (messages.length === 0) {
            if (expenses.length === 0) {
                messages.push("🚀 ابدأ بتسجيل أول نفقة عشان تتابع صرفك");
            } else if (goals.length === 0) {
                messages.push("💡 حدد هدف مالي عشان يكون عندك دافع للتوفير");
            } else {
                messages.push(
                    "📊 استمر في تتبع نفقاتك عشان تفهم عاداتك المالية"
                );
            }
        }

        return {
            streaks,
            achievements,
            motivationalMessage:
                messages[Math.floor(Math.random() * messages.length)],
        };
    }, [expenses, budgets, goals]);

    if (
        behaviorData.streaks.length === 0 &&
        behaviorData.achievements.filter((a) => a.earned).length === 0
    ) {
        return null; // Don't show if no data
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Trophy className="h-5 w-5" />
                    إنجازاتك
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Motivational Message */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                    <p className="text-sm text-center">
                        {behaviorData.motivationalMessage}
                    </p>
                </div>

                {/* Streaks */}
                {behaviorData.streaks.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">
                            السلاسل النشطة
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {behaviorData.streaks.map((streak, index) => {
                                const Icon = streak.icon;
                                return (
                                    <div
                                        key={index}
                                        className="flex items-center gap-2 px-3 py-2 rounded-full bg-muted/50 border">
                                        <Icon
                                            className={cn(
                                                "h-4 w-4",
                                                streak.color
                                            )}
                                        />
                                        <span className="text-sm font-medium">
                                            {streak.title}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Achievements */}
                <div className="space-y-2">
                    <p className="text-xs text-muted-foreground font-medium">
                        الإنجازات
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {behaviorData.achievements
                            .slice(0, 4)
                            .map((achievement) => {
                                const Icon = achievement.icon;
                                return (
                                    <div
                                        key={achievement.id}
                                        className={cn(
                                            "p-3 rounded-lg border transition-all",
                                            achievement.earned
                                                ? "bg-muted/30"
                                                : "bg-muted/10 opacity-50"
                                        )}>
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={cn(
                                                    "p-2 rounded-full",
                                                    achievement.earned
                                                        ? achievement.color
                                                        : "bg-muted"
                                                )}>
                                                <Icon
                                                    className={cn(
                                                        "h-4 w-4",
                                                        achievement.earned
                                                            ? "text-white"
                                                            : "text-muted-foreground"
                                                    )}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {achievement.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {achievement.description}
                                                </p>
                                            </div>
                                        </div>
                                        {!achievement.earned &&
                                            achievement.progress !==
                                                undefined && (
                                                <Progress
                                                    value={achievement.progress}
                                                    className="h-1 mt-2"
                                                />
                                            )}
                                    </div>
                                );
                            })}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
