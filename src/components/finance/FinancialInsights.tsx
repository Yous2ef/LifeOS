import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
    TrendingUp,
    TrendingDown,
    Target,
    AlertTriangle,
    Sparkles,
    Calendar,
    Wallet,
    ArrowUpRight,
    ArrowDownRight,
    Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type {
    Income,
    Expense,
    ExpenseCategory,
    FinancialGoal,
    Budget,
} from "@/types/modules/finance";

interface FinancialInsightsProps {
    incomes: Income[];
    expenses: Expense[];
    categories: ExpenseCategory[];
    goals: FinancialGoal[];
    budgets: Budget[];
    formatCurrency: (amount: number) => string;
}

interface Insight {
    id: string;
    type: "positive" | "warning" | "info" | "suggestion";
    icon: React.ElementType;
    title: string;
    message: string;
    value?: string;
    trend?: "up" | "down" | "neutral";
}

export function FinancialInsights({
    incomes,
    expenses,
    categories,
    goals,
    budgets,
    formatCurrency,
}: FinancialInsightsProps) {
    const insights = useMemo(() => {
        const generatedInsights: Insight[] = [];
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

        // Filter expenses by month
        const thisMonthExpenses = expenses.filter((exp) => {
            const date = new Date(exp.date);
            return (
                date.getMonth() === thisMonth && date.getFullYear() === thisYear
            );
        });

        const lastMonthExpenses = expenses.filter((exp) => {
            const date = new Date(exp.date);
            return (
                date.getMonth() === lastMonth &&
                date.getFullYear() === lastMonthYear
            );
        });

        const thisMonthTotal = thisMonthExpenses.reduce(
            (sum, exp) => sum + exp.amount,
            0
        );
        const lastMonthTotal = lastMonthExpenses.reduce(
            (sum, exp) => sum + exp.amount,
            0
        );

        // Filter incomes by month
        const thisMonthIncomes = incomes.filter((inc) => {
            const date = new Date(
                inc.actualDate || inc.expectedDate || inc.createdAt
            );
            return (
                new Date(date).getMonth() === thisMonth &&
                new Date(date).getFullYear() === thisYear
            );
        });
        const thisMonthIncomeTotal = thisMonthIncomes.reduce(
            (sum, inc) => sum + inc.amount,
            0
        );

        // 1. Month-over-month comparison
        if (lastMonthTotal > 0) {
            const percentChange =
                ((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100;
            if (percentChange > 15) {
                generatedInsights.push({
                    id: "month-comparison-warning",
                    type: "warning",
                    icon: TrendingUp,
                    title: "زيادة في الصرف",
                    message: `صرفت ${Math.abs(percentChange).toFixed(
                        0
                    )}% أكتر من الشهر اللي فات`,
                    value: formatCurrency(thisMonthTotal - lastMonthTotal),
                    trend: "up",
                });
            } else if (percentChange < -10) {
                generatedInsights.push({
                    id: "month-comparison-positive",
                    type: "positive",
                    icon: TrendingDown,
                    title: "تحسن في الصرف! 🎉",
                    message: `صرفت ${Math.abs(percentChange).toFixed(
                        0
                    )}% أقل من الشهر اللي فات`,
                    value: formatCurrency(
                        Math.abs(thisMonthTotal - lastMonthTotal)
                    ),
                    trend: "down",
                });
            }
        }

        // 2. Savings rate
        if (thisMonthIncomeTotal > 0) {
            const savings = thisMonthIncomeTotal - thisMonthTotal;
            const savingsRate = (savings / thisMonthIncomeTotal) * 100;

            if (savingsRate >= 20) {
                generatedInsights.push({
                    id: "savings-excellent",
                    type: "positive",
                    icon: Wallet,
                    title: "نسبة ادخار ممتازة! 💪",
                    message: `بتوفر ${savingsRate.toFixed(
                        0
                    )}% من دخلك - أداء رائع!`,
                    value: formatCurrency(savings),
                    trend: "up",
                });
            } else if (savingsRate >= 10) {
                generatedInsights.push({
                    id: "savings-good",
                    type: "info",
                    icon: Wallet,
                    title: "نسبة ادخار جيدة",
                    message: `بتوفر ${savingsRate.toFixed(0)}% من دخلك`,
                    value: formatCurrency(savings),
                    trend: "neutral",
                });
            } else if (savingsRate < 5 && savingsRate >= 0) {
                generatedInsights.push({
                    id: "savings-low",
                    type: "warning",
                    icon: AlertTriangle,
                    title: "نسبة ادخار منخفضة",
                    message: `بتوفر ${savingsRate.toFixed(
                        0
                    )}% فقط - حاول تزود الادخار`,
                    trend: "down",
                });
            }
        }

        // 3. Top spending category
        const categoryTotals: Record<string, number> = {};
        thisMonthExpenses.forEach((exp) => {
            categoryTotals[exp.categoryId] =
                (categoryTotals[exp.categoryId] || 0) + exp.amount;
        });

        const topCategory = Object.entries(categoryTotals).sort(
            ([, a], [, b]) => b - a
        )[0];

        if (topCategory && thisMonthTotal > 0) {
            const [catId, amount] = topCategory;
            const category = categories.find((c) => c.id === catId);
            const percentage = (amount / thisMonthTotal) * 100;

            if (percentage > 40) {
                generatedInsights.push({
                    id: "top-category",
                    type: "info",
                    icon: Target,
                    title: `أكتر فئة صرف: ${category?.name || "أخرى"}`,
                    message: `${percentage.toFixed(0)}% من صرفك راح لـ ${
                        category?.name || "هذه الفئة"
                    }`,
                    value: formatCurrency(amount),
                });
            }
        }

        // 4. Day of week pattern
        const dayTotals: Record<number, number> = {};
        thisMonthExpenses.forEach((exp) => {
            const day = new Date(exp.date).getDay();
            dayTotals[day] = (dayTotals[day] || 0) + exp.amount;
        });

        const topDay = Object.entries(dayTotals).sort(
            ([, a], [, b]) => b - a
        )[0];

        if (topDay) {
            const dayNames = [
                "الأحد",
                "الإثنين",
                "الثلاثاء",
                "الأربعاء",
                "الخميس",
                "الجمعة",
                "السبت",
            ];
            const [dayIndex, amount] = topDay;
            generatedInsights.push({
                id: "day-pattern",
                type: "info",
                icon: Calendar,
                title: `يوم الصرف الأعلى: ${dayNames[parseInt(dayIndex)]}`,
                message: `بتصرف أكتر يوم ${dayNames[parseInt(dayIndex)]}`,
                value: formatCurrency(amount),
            });
        }

        // 5. Budget alerts
        const currentBudget = budgets.find((b) => {
            const [year, month] = b.month.split("-").map(Number);
            return year === thisYear && month - 1 === thisMonth;
        });

        if (currentBudget) {
            const overBudgetCategories = currentBudget.categoryBudgets.filter(
                (cb) => cb.spent > cb.planned && cb.planned > 0
            );

            if (overBudgetCategories.length > 0) {
                const cat = overBudgetCategories[0];
                const category = categories.find(
                    (c) => c.id === cat.categoryId
                );
                const overPercent =
                    ((cat.spent - cat.planned) / cat.planned) * 100;

                generatedInsights.push({
                    id: `budget-over-${cat.categoryId}`,
                    type: "warning",
                    icon: AlertTriangle,
                    title: `تجاوزت ميزانية ${category?.name || "الفئة"}`,
                    message: `تجاوزت بنسبة ${overPercent.toFixed(
                        0
                    )}% - حاول تقلل الصرف`,
                    value: formatCurrency(cat.spent - cat.planned),
                    trend: "up",
                });
            } else if (currentBudget.categoryBudgets.length > 0) {
                const allOnTrack = currentBudget.categoryBudgets.every(
                    (cb) => cb.spent <= cb.planned || cb.planned === 0
                );
                if (allOnTrack) {
                    generatedInsights.push({
                        id: "budget-on-track",
                        type: "positive",
                        icon: Sparkles,
                        title: "ملتزم بالميزانية! 💚",
                        message: "أنت ماشي صح - استمر!",
                    });
                }
            }
        }

        // 6. Goal progress
        const activeGoals = goals.filter((g) => g.status === "active");
        activeGoals.forEach((goal) => {
            const progress =
                goal.targetAmount > 0
                    ? (goal.currentAmount / goal.targetAmount) * 100
                    : 0;

            if (progress >= 90 && progress < 100) {
                generatedInsights.push({
                    id: `goal-almost-${goal.id}`,
                    type: "positive",
                    icon: Target,
                    title: `قربت تحقق هدف "${goal.title}"! 🎯`,
                    message: `باقي ${formatCurrency(
                        goal.targetAmount - goal.currentAmount
                    )} فقط`,
                    value: `${progress.toFixed(0)}%`,
                    trend: "up",
                });
            } else if (progress >= 50 && progress < 90) {
                generatedInsights.push({
                    id: `goal-halfway-${goal.id}`,
                    type: "info",
                    icon: Target,
                    title: `تقدم جيد في "${goal.title}"`,
                    message: `وصلت لـ ${progress.toFixed(0)}% من الهدف`,
                    value: formatCurrency(goal.currentAmount),
                });
            }
        });

        // 7. Saving opportunity suggestion
        const nonEssentialCategories = categories.filter((c) => !c.isEssential);
        const nonEssentialSpending = thisMonthExpenses
            .filter((exp) =>
                nonEssentialCategories.some((c) => c.id === exp.categoryId)
            )
            .reduce((sum, exp) => sum + exp.amount, 0);

        if (nonEssentialSpending > thisMonthTotal * 0.3) {
            const savingPotential = nonEssentialSpending * 0.2;
            generatedInsights.push({
                id: "saving-opportunity",
                type: "suggestion",
                icon: Lightbulb,
                title: "فرصة توفير! 💡",
                message: `لو قللت الصرف غير الضروري 20% هتوفر ${formatCurrency(
                    savingPotential
                )}`,
                value: formatCurrency(savingPotential),
            });
        }

        return generatedInsights.slice(0, 6); // Max 6 insights
    }, [incomes, expenses, categories, goals, budgets, formatCurrency]);

    const getInsightStyles = (type: Insight["type"]) => {
        switch (type) {
            case "positive":
                return {
                    bg: "bg-green-500/10 border-green-500/20",
                    iconBg: "bg-green-500/20",
                    iconColor: "text-green-600",
                };
            case "warning":
                return {
                    bg: "bg-orange-500/10 border-orange-500/20",
                    iconBg: "bg-orange-500/20",
                    iconColor: "text-orange-600",
                };
            case "suggestion":
                return {
                    bg: "bg-purple-500/10 border-purple-500/20",
                    iconBg: "bg-purple-500/20",
                    iconColor: "text-purple-600",
                };
            default:
                return {
                    bg: "bg-blue-500/10 border-blue-500/20",
                    iconBg: "bg-blue-500/20",
                    iconColor: "text-blue-600",
                };
        }
    };

    if (insights.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Sparkles className="h-5 w-5" />
                        رؤى مالية
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                        أضف المزيد من المعاملات لرؤية التحليلات والنصائح 📊
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5" />
                    رؤى مالية ذكية
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {insights.map((insight) => {
                    const styles = getInsightStyles(insight.type);
                    const Icon = insight.icon;

                    return (
                        <div
                            key={insight.id}
                            className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border transition-all",
                                styles.bg
                            )}>
                            <div
                                className={cn(
                                    "p-2 rounded-lg shrink-0",
                                    styles.iconBg
                                )}>
                                <Icon
                                    className={cn("h-4 w-4", styles.iconColor)}
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium">
                                        {insight.title}
                                    </p>
                                    {insight.trend &&
                                        (insight.trend === "up" ? (
                                            <ArrowUpRight className="h-4 w-4 text-red-500" />
                                        ) : insight.trend === "down" ? (
                                            <ArrowDownRight className="h-4 w-4 text-green-500" />
                                        ) : null)}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {insight.message}
                                </p>
                            </div>

                            {insight.value && (
                                <div className="text-sm font-semibold shrink-0">
                                    {insight.value}
                                </div>
                            )}
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
