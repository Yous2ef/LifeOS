import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar,
    BarChart3,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Income, Expense, ExpenseCategory } from "@/types/modules/finance";

interface ReportsPanelProps {
    incomes: Income[];
    expenses: Expense[];
    categories: ExpenseCategory[];
    formatCurrency: (amount: number) => string;
}

interface PeriodSummary {
    income: number;
    expenses: number;
    net: number;
    topCategory: { name: string; amount: number; icon: string } | null;
    transactionCount: number;
    comparison: {
        expenses: number; // percentage change from previous period
        income: number;
    };
}

export function ReportsPanel({
    incomes,
    expenses,
    categories,
    formatCurrency,
}: ReportsPanelProps) {
    const [activeTab, setActiveTab] = useState("daily");

    const calculatePeriodSummary = (
        periodExpenses: Expense[],
        periodIncomes: Income[],
        prevPeriodExpenses: Expense[],
        prevPeriodIncomes: Income[]
    ): PeriodSummary => {
        const totalExpenses = periodExpenses.reduce(
            (sum, exp) => sum + exp.amount,
            0
        );
        const totalIncome = periodIncomes.reduce(
            (sum, inc) => sum + inc.amount,
            0
        );
        const prevTotalExpenses = prevPeriodExpenses.reduce(
            (sum, exp) => sum + exp.amount,
            0
        );
        const prevTotalIncome = prevPeriodIncomes.reduce(
            (sum, inc) => sum + inc.amount,
            0
        );

        // Find top category
        const categoryTotals: Record<string, number> = {};
        periodExpenses.forEach((exp) => {
            categoryTotals[exp.categoryId] =
                (categoryTotals[exp.categoryId] || 0) + exp.amount;
        });

        const topCategoryEntry = Object.entries(categoryTotals).sort(
            ([, a], [, b]) => b - a
        )[0];
        let topCategory = null;
        if (topCategoryEntry) {
            const cat = categories.find((c) => c.id === topCategoryEntry[0]);
            topCategory = {
                name: cat?.name || "أخرى",
                amount: topCategoryEntry[1],
                icon: cat?.icon || "📦",
            };
        }

        return {
            income: totalIncome,
            expenses: totalExpenses,
            net: totalIncome - totalExpenses,
            topCategory,
            transactionCount: periodExpenses.length + periodIncomes.length,
            comparison: {
                expenses:
                    prevTotalExpenses > 0
                        ? ((totalExpenses - prevTotalExpenses) /
                              prevTotalExpenses) *
                          100
                        : 0,
                income:
                    prevTotalIncome > 0
                        ? ((totalIncome - prevTotalIncome) / prevTotalIncome) *
                          100
                        : 0,
            },
        };
    };

    const reports = useMemo(() => {
        const now = new Date();
        const today = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
        );
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

        // This week (Saturday to Friday for Arabic calendar)
        const dayOfWeek = now.getDay();
        const weekStart = new Date(
            today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000
        );
        const lastWeekStart = new Date(
            weekStart.getTime() - 7 * 24 * 60 * 60 * 1000
        );

        // This month
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(
            now.getFullYear(),
            now.getMonth() - 1,
            1
        );
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        // This year
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
        const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);

        // Filter functions
        const filterByDate = (
            items: (Expense | Income)[],
            start: Date,
            end: Date
        ) => {
            return items.filter((item) => {
                const date = new Date(
                    "date" in item
                        ? item.date
                        : item.actualDate || item.expectedDate || item.createdAt
                );
                return date >= start && date <= end;
            });
        };

        // Daily
        const todayExpenses = expenses.filter((exp) => {
            const date = new Date(exp.date);
            return (
                date >= today &&
                date < new Date(today.getTime() + 24 * 60 * 60 * 1000)
            );
        });
        const todayIncomes = incomes.filter((inc) => {
            const date = new Date(
                inc.actualDate || inc.expectedDate || inc.createdAt
            );
            return (
                date >= today &&
                date < new Date(today.getTime() + 24 * 60 * 60 * 1000)
            );
        });
        const yesterdayExpenses = expenses.filter((exp) => {
            const date = new Date(exp.date);
            return date >= yesterday && date < today;
        });
        const yesterdayIncomes = incomes.filter((inc) => {
            const date = new Date(
                inc.actualDate || inc.expectedDate || inc.createdAt
            );
            return date >= yesterday && date < today;
        });

        // Weekly
        const thisWeekExpenses = filterByDate(
            expenses,
            weekStart,
            now
        ) as Expense[];
        const thisWeekIncomes = filterByDate(
            incomes,
            weekStart,
            now
        ) as Income[];
        const lastWeekExpenses = filterByDate(
            expenses,
            lastWeekStart,
            weekStart
        ) as Expense[];
        const lastWeekIncomes = filterByDate(
            incomes,
            lastWeekStart,
            weekStart
        ) as Income[];

        // Monthly
        const thisMonthExpenses = filterByDate(
            expenses,
            monthStart,
            now
        ) as Expense[];
        const thisMonthIncomes = filterByDate(
            incomes,
            monthStart,
            now
        ) as Income[];
        const lastMonthExpenses = filterByDate(
            expenses,
            lastMonthStart,
            lastMonthEnd
        ) as Expense[];
        const lastMonthIncomes = filterByDate(
            incomes,
            lastMonthStart,
            lastMonthEnd
        ) as Income[];

        // Yearly
        const thisYearExpenses = filterByDate(
            expenses,
            yearStart,
            now
        ) as Expense[];
        const thisYearIncomes = filterByDate(
            incomes,
            yearStart,
            now
        ) as Income[];
        const lastYearExpenses = filterByDate(
            expenses,
            lastYearStart,
            lastYearEnd
        ) as Expense[];
        const lastYearIncomes = filterByDate(
            incomes,
            lastYearStart,
            lastYearEnd
        ) as Income[];

        return {
            daily: calculatePeriodSummary(
                todayExpenses,
                todayIncomes,
                yesterdayExpenses,
                yesterdayIncomes
            ),
            weekly: calculatePeriodSummary(
                thisWeekExpenses,
                thisWeekIncomes,
                lastWeekExpenses,
                lastWeekIncomes
            ),
            monthly: calculatePeriodSummary(
                thisMonthExpenses,
                thisMonthIncomes,
                lastMonthExpenses,
                lastMonthIncomes
            ),
            yearly: calculatePeriodSummary(
                thisYearExpenses,
                thisYearIncomes,
                lastYearExpenses,
                lastYearIncomes
            ),
        };
    }, [incomes, expenses, categories]);

    const renderSummaryCard = (
        summary: PeriodSummary,
        periodLabel: string,
        comparisonLabel: string
    ) => (
        <div className="space-y-4">
            {/* Main Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-xs text-muted-foreground">الدخل</p>
                    <p className="text-lg font-bold text-green-600">
                        {formatCurrency(summary.income)}
                    </p>
                    {summary.comparison.income !== 0 && (
                        <div
                            className={cn(
                                "flex items-center gap-1 text-xs mt-1",
                                summary.comparison.income > 0
                                    ? "text-green-600"
                                    : "text-red-600"
                            )}>
                            {summary.comparison.income > 0 ? (
                                <ArrowUpRight className="h-3 w-3" />
                            ) : (
                                <ArrowDownRight className="h-3 w-3" />
                            )}
                            <span>
                                {Math.abs(summary.comparison.income).toFixed(0)}
                                %
                            </span>
                        </div>
                    )}
                </div>

                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-muted-foreground">المصروفات</p>
                    <p className="text-lg font-bold text-red-600">
                        {formatCurrency(summary.expenses)}
                    </p>
                    {summary.comparison.expenses !== 0 && (
                        <div
                            className={cn(
                                "flex items-center gap-1 text-xs mt-1",
                                summary.comparison.expenses < 0
                                    ? "text-green-600"
                                    : "text-red-600"
                            )}>
                            {summary.comparison.expenses > 0 ? (
                                <ArrowUpRight className="h-3 w-3" />
                            ) : (
                                <ArrowDownRight className="h-3 w-3" />
                            )}
                            <span>
                                {Math.abs(summary.comparison.expenses).toFixed(
                                    0
                                )}
                                %
                            </span>
                        </div>
                    )}
                </div>

                <div
                    className={cn(
                        "p-3 rounded-lg border",
                        summary.net >= 0
                            ? "bg-blue-500/10 border-blue-500/20"
                            : "bg-orange-500/10 border-orange-500/20"
                    )}>
                    <p className="text-xs text-muted-foreground">الصافي</p>
                    <p
                        className={cn(
                            "text-lg font-bold",
                            summary.net >= 0
                                ? "text-blue-600"
                                : "text-orange-600"
                        )}>
                        {summary.net >= 0 ? "+" : ""}
                        {formatCurrency(summary.net)}
                    </p>
                </div>
            </div>

            {/* Additional Info */}
            <div className="grid grid-cols-2 gap-3">
                {summary.topCategory && (
                    <div className="p-3 rounded-lg bg-muted/30 border">
                        <p className="text-xs text-muted-foreground">
                            أكتر فئة صرف
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg">
                                {summary.topCategory.icon}
                            </span>
                            <div>
                                <p className="text-sm font-medium">
                                    {summary.topCategory.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatCurrency(summary.topCategory.amount)}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="p-3 rounded-lg bg-muted/30 border">
                    <p className="text-xs text-muted-foreground">
                        عدد المعاملات
                    </p>
                    <p className="text-2xl font-bold mt-1">
                        {summary.transactionCount}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {periodLabel}
                    </p>
                </div>
            </div>

            {/* Comparison Note */}
            {(summary.comparison.expenses !== 0 ||
                summary.comparison.income !== 0) && (
                <div className="p-2 rounded-lg bg-muted/20 text-center">
                    <p className="text-xs text-muted-foreground">
                        {summary.comparison.expenses < 0 ? (
                            <span className="text-green-600">
                                صرفت أقل من {comparisonLabel} بنسبة{" "}
                                {Math.abs(summary.comparison.expenses).toFixed(
                                    0
                                )}
                                % 🎉
                            </span>
                        ) : summary.comparison.expenses > 0 ? (
                            <span className="text-orange-600">
                                صرفت أكتر من {comparisonLabel} بنسبة{" "}
                                {Math.abs(summary.comparison.expenses).toFixed(
                                    0
                                )}
                                %
                            </span>
                        ) : (
                            <span className="flex items-center justify-center gap-1">
                                <Minus className="h-3 w-3" />
                                نفس معدل الصرف
                            </span>
                        )}
                    </p>
                </div>
            )}
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5" />
                    التقارير
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4 mb-4">
                        <TabsTrigger value="daily" className="text-xs">
                            <Calendar className="h-3 w-3 ml-1" />
                            يومي
                        </TabsTrigger>
                        <TabsTrigger value="weekly" className="text-xs">
                            أسبوعي
                        </TabsTrigger>
                        <TabsTrigger value="monthly" className="text-xs">
                            شهري
                        </TabsTrigger>
                        <TabsTrigger value="yearly" className="text-xs">
                            سنوي
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="daily">
                        {renderSummaryCard(reports.daily, "اليوم", "أمس")}
                    </TabsContent>

                    <TabsContent value="weekly">
                        {renderSummaryCard(
                            reports.weekly,
                            "هذا الأسبوع",
                            "الأسبوع الماضي"
                        )}
                    </TabsContent>

                    <TabsContent value="monthly">
                        {renderSummaryCard(
                            reports.monthly,
                            "هذا الشهر",
                            "الشهر الماضي"
                        )}
                    </TabsContent>

                    <TabsContent value="yearly">
                        {renderSummaryCard(
                            reports.yearly,
                            "هذه السنة",
                            "السنة الماضية"
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
