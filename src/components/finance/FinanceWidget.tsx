import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Target,
    ArrowRight,
    AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useApp } from "@/context/AppContext";

interface FinanceWidgetProps {
    compact?: boolean;
}

export function FinanceWidget({ compact = false }: FinanceWidgetProps) {
    const navigate = useNavigate();
    const { data } = useApp();

    // Get finance data from unified AppContext
    const financeData = useMemo(() => {
        return (
            data.finance || {
                incomes: [],
                expenses: [],
                installments: [],
                goals: [],
                settings: { defaultCurrency: "EGP" },
            }
        );
    }, [data.finance]);

    // Calculate this month's stats
    const stats = useMemo(() => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        // Filter this month's incomes
        const monthlyIncomes =
            financeData.incomes?.filter((inc: any) => {
                const date = new Date(
                    inc.actualDate || inc.expectedDate || inc.createdAt
                );
                return (
                    date.getMonth() === thisMonth &&
                    date.getFullYear() === thisYear
                );
            }) || [];

        // Filter this month's expenses
        const monthlyExpenses =
            financeData.expenses?.filter((exp: any) => {
                const date = new Date(exp.date);
                return (
                    date.getMonth() === thisMonth &&
                    date.getFullYear() === thisYear
                );
            }) || [];

        const totalIncome = monthlyIncomes.reduce(
            (sum: number, inc: any) => sum + inc.amount,
            0
        );
        const totalExpenses = monthlyExpenses.reduce(
            (sum: number, exp: any) => sum + exp.amount,
            0
        );
        const balance = totalIncome - totalExpenses;
        const savingsRate =
            totalIncome > 0
                ? ((totalIncome - totalExpenses) / totalIncome) * 100
                : 0;

        // Active installments
        const activeInstallments =
            financeData.installments?.filter((i: any) => i.status === "active")
                .length || 0;

        // Upcoming installment payment
        const upcomingPayments =
            financeData.installments?.filter((i: any) => {
                if (i.status !== "active") return false;
                const nextPayment = new Date(i.nextPaymentDate);
                const daysUntil = Math.ceil(
                    (nextPayment.getTime() - now.getTime()) /
                        (1000 * 60 * 60 * 24)
                );
                return daysUntil >= 0 && daysUntil <= 7;
            }).length || 0;

        // Active goals
        const activeGoals =
            financeData.goals?.filter((g: any) => g.status === "active")
                .length || 0;

        // Goals progress
        const goalProgress =
            financeData.goals
                ?.filter((g: any) => g.status === "active")
                .reduce((sum: number, g: any) => {
                    const progress =
                        g.targetAmount > 0
                            ? (g.currentAmount / g.targetAmount) * 100
                            : 0;
                    return sum + progress;
                }, 0) / Math.max(1, activeGoals);

        return {
            totalIncome,
            totalExpenses,
            balance,
            savingsRate,
            activeInstallments,
            upcomingPayments,
            activeGoals,
            goalProgress,
        };
    }, [financeData]);

    // Format currency
    const formatCurrency = (amount: number): string => {
        const currency = financeData.settings?.defaultCurrency || "EGP";
        const symbols: Record<string, string> = {
            EGP: "ج.م",
            USD: "$",
            EUR: "€",
            GBP: "£",
            SAR: "ر.س",
            AED: "د.إ",
        };
        return `${amount.toLocaleString("ar-EG")} ${
            symbols[currency] || currency
        }`;
    };

    if (compact) {
        return (
            <Card
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => navigate("/finance")}>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
                            <Wallet className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">Finance</p>
                            <p
                                className={cn(
                                    "text-lg font-bold",
                                    stats.balance >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                )}>
                                {stats.balance >= 0 ? "+" : ""}
                                {formatCurrency(stats.balance)}
                            </p>
                        </div>
                        {stats.upcomingPayments > 0 && (
                            <div className="flex items-center gap-1 text-orange-500">
                                <AlertTriangle className="h-4 w-4" />
                                <span className="text-xs">
                                    {stats.upcomingPayments}
                                </span>
                            </div>
                        )}
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Wallet className="h-5 w-5 text-primary" />
                        المالية - هذا الشهر
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/finance")}>
                        عرض الكل
                        <ArrowRight className="h-4 w-4 mr-1" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Income vs Expenses */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-1 text-green-600 mb-1">
                            <TrendingUp className="h-4 w-4" />
                            <span className="text-xs">الدخل</span>
                        </div>
                        <p className="text-lg font-bold text-green-600">
                            {formatCurrency(stats.totalIncome)}
                        </p>
                    </div>

                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-1 text-red-600 mb-1">
                            <TrendingDown className="h-4 w-4" />
                            <span className="text-xs">المصروفات</span>
                        </div>
                        <p className="text-lg font-bold text-red-600">
                            {formatCurrency(stats.totalExpenses)}
                        </p>
                    </div>

                    <div
                        className={cn(
                            "p-3 rounded-lg border",
                            stats.balance >= 0
                                ? "bg-blue-500/10 border-blue-500/20"
                                : "bg-orange-500/10 border-orange-500/20"
                        )}>
                        <div
                            className={cn(
                                "flex items-center gap-1 mb-1",
                                stats.balance >= 0
                                    ? "text-blue-600"
                                    : "text-orange-600"
                            )}>
                            <Wallet className="h-4 w-4" />
                            <span className="text-xs">الصافي</span>
                        </div>
                        <p
                            className={cn(
                                "text-lg font-bold",
                                stats.balance >= 0
                                    ? "text-blue-600"
                                    : "text-orange-600"
                            )}>
                            {stats.balance >= 0 ? "+" : ""}
                            {formatCurrency(stats.balance)}
                        </p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                    {/* Installments */}
                    <div className="p-3 rounded-lg bg-muted/30 border">
                        <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-orange-500" />
                            <span className="text-sm">الأقساط النشطة</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-2xl font-bold">
                                {stats.activeInstallments}
                            </span>
                            {stats.upcomingPayments > 0 && (
                                <span className="text-xs text-orange-500 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {stats.upcomingPayments} قادمة
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Goals */}
                    <div className="p-3 rounded-lg bg-muted/30 border">
                        <div className="flex items-center gap-2">
                            <Target className="h-4 w-4 text-primary" />
                            <span className="text-sm">الأهداف النشطة</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-2xl font-bold">
                                {stats.activeGoals}
                            </span>
                            {stats.activeGoals > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {stats.goalProgress.toFixed(0)}% متوسط
                                </span>
                            )}
                        </div>
                        {stats.activeGoals > 0 && (
                            <Progress
                                value={stats.goalProgress}
                                className="h-1 mt-2"
                            />
                        )}
                    </div>
                </div>

                {/* Savings Rate */}
                {stats.totalIncome > 0 && (
                    <div className="p-3 rounded-lg bg-gradient-to-r from-green-500/10 to-blue-500/10 border">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">نسبة الادخار</span>
                            <span
                                className={cn(
                                    "text-lg font-bold",
                                    stats.savingsRate >= 20
                                        ? "text-green-600"
                                        : stats.savingsRate >= 10
                                        ? "text-blue-600"
                                        : stats.savingsRate >= 0
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                )}>
                                {stats.savingsRate.toFixed(0)}%
                            </span>
                        </div>
                        <Progress
                            value={Math.max(
                                0,
                                Math.min(100, stats.savingsRate)
                            )}
                            className="h-2 mt-2"
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
