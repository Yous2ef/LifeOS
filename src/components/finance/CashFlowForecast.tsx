import { useMemo } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Income, Expense } from "@/types/finance";

interface CashFlowForecastProps {
    incomes: Income[];
    expenses: Expense[];
    formatCurrency: (amount: number) => string;
    monthsToForecast?: number;
}

interface ForecastData {
    month: string;
    income: number;
    expenses: number;
    net: number;
    cumulative: number;
    isForecast: boolean;
}

export function CashFlowForecast({
    incomes,
    expenses,
    formatCurrency,
    monthsToForecast = 3,
}: CashFlowForecastProps) {
    const forecastData = useMemo(() => {
        const now = new Date();
        const data: ForecastData[] = [];

        // Get last 6 months of actual data
        const monthlyData: Record<
            string,
            { income: number; expenses: number }
        > = {};

        // Process incomes
        incomes.forEach((inc) => {
            const date = new Date(
                inc.actualDate || inc.expectedDate || inc.createdAt
            );
            const key = `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;
            if (!monthlyData[key]) {
                monthlyData[key] = { income: 0, expenses: 0 };
            }
            monthlyData[key].income += inc.amount;
        });

        // Process expenses
        expenses.forEach((exp) => {
            const date = new Date(exp.date);
            const key = `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;
            if (!monthlyData[key]) {
                monthlyData[key] = { income: 0, expenses: 0 };
            }
            monthlyData[key].expenses += exp.amount;
        });

        // Calculate averages for forecasting
        const sortedMonths = Object.keys(monthlyData).sort().slice(-6);
        let totalIncome = 0;
        let totalExpenses = 0;
        let monthCount = 0;

        sortedMonths.forEach((month) => {
            totalIncome += monthlyData[month].income;
            totalExpenses += monthlyData[month].expenses;
            monthCount++;
        });

        const avgIncome = monthCount > 0 ? totalIncome / monthCount : 0;
        const avgExpenses = monthCount > 0 ? totalExpenses / monthCount : 0;

        // Calculate expense trend (is it increasing or decreasing?)
        let expenseTrend = 0;
        if (sortedMonths.length >= 2) {
            const recentMonths = sortedMonths.slice(-3);
            const olderMonths = sortedMonths.slice(0, 3);

            const recentAvg =
                recentMonths.reduce(
                    (sum, m) => sum + monthlyData[m].expenses,
                    0
                ) / recentMonths.length;
            const olderAvg =
                olderMonths.reduce(
                    (sum, m) => sum + monthlyData[m].expenses,
                    0
                ) / olderMonths.length;

            if (olderAvg > 0) {
                expenseTrend = (recentAvg - olderAvg) / olderAvg;
            }
        }

        // Add historical data
        let cumulative = 0;
        const monthNames = [
            "يناير",
            "فبراير",
            "مارس",
            "أبريل",
            "مايو",
            "يونيو",
            "يوليو",
            "أغسطس",
            "سبتمبر",
            "أكتوبر",
            "نوفمبر",
            "ديسمبر",
        ];

        sortedMonths.slice(-4).forEach((monthKey) => {
            const [year, month] = monthKey.split("-").map(Number);
            const monthData = monthlyData[monthKey];
            const net = monthData.income - monthData.expenses;
            cumulative += net;

            data.push({
                month: `${monthNames[month - 1]} ${year.toString().slice(-2)}`,
                income: monthData.income,
                expenses: monthData.expenses,
                net,
                cumulative,
                isForecast: false,
            });
        });

        // Add forecast months
        for (let i = 1; i <= monthsToForecast; i++) {
            const forecastDate = new Date(
                now.getFullYear(),
                now.getMonth() + i,
                1
            );
            const monthName = monthNames[forecastDate.getMonth()];
            const year = forecastDate.getFullYear().toString().slice(-2);

            // Apply trend to forecast
            const trendMultiplier = 1 + expenseTrend * 0.5 * i; // Dampen the trend
            const forecastExpenses = Math.max(
                0,
                avgExpenses * Math.min(1.5, Math.max(0.5, trendMultiplier))
            );
            const forecastIncome = avgIncome; // Assume income stays stable
            const net = forecastIncome - forecastExpenses;
            cumulative += net;

            data.push({
                month: `${monthName} ${year}*`,
                income: Math.round(forecastIncome),
                expenses: Math.round(forecastExpenses),
                net: Math.round(net),
                cumulative: Math.round(cumulative),
                isForecast: true,
            });
        }

        return data;
    }, [incomes, expenses, monthsToForecast]);

    // Calculate forecast summary
    const summary = useMemo(() => {
        const forecastMonths = forecastData.filter((d) => d.isForecast);
        const totalForecastNet = forecastMonths.reduce(
            (sum, m) => sum + m.net,
            0
        );
        const avgMonthlyNet =
            forecastMonths.length > 0
                ? totalForecastNet / forecastMonths.length
                : 0;

        const lastActual = forecastData
            .filter((d) => !d.isForecast)
            .slice(-1)[0];
        const lastForecast = forecastMonths.slice(-1)[0];

        return {
            totalForecastNet,
            avgMonthlyNet,
            trend: avgMonthlyNet >= 0 ? "positive" : "negative",
            startCumulative: lastActual?.cumulative || 0,
            endCumulative: lastForecast?.cumulative || 0,
        };
    }, [forecastData]);

    if (forecastData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <TrendingUp className="h-5 w-5" />
                        توقعات التدفق النقدي
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-4">
                        أضف المزيد من المعاملات لرؤية التوقعات المالية 📈
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <TrendingUp className="h-5 w-5" />
                    توقعات التدفق النقدي
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                    <div
                        className={cn(
                            "p-3 rounded-lg border",
                            summary.trend === "positive"
                                ? "bg-green-500/10 border-green-500/20"
                                : "bg-red-500/10 border-red-500/20"
                        )}>
                        <div className="flex items-center gap-2">
                            {summary.trend === "positive" ? (
                                <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                                <AlertTriangle className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-xs text-muted-foreground">
                                التوقع للـ {monthsToForecast} شهور
                            </span>
                        </div>
                        <p
                            className={cn(
                                "text-lg font-bold mt-1",
                                summary.trend === "positive"
                                    ? "text-green-600"
                                    : "text-red-600"
                            )}>
                            {summary.totalForecastNet >= 0 ? "+" : ""}
                            {formatCurrency(summary.totalForecastNet)}
                        </p>
                    </div>

                    <div className="p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-2">
                            {summary.avgMonthlyNet >= 0 ? (
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            )}
                            <span className="text-xs text-muted-foreground">
                                المتوسط الشهري
                            </span>
                        </div>
                        <p
                            className={cn(
                                "text-lg font-bold mt-1",
                                summary.avgMonthlyNet >= 0
                                    ? "text-green-600"
                                    : "text-red-600"
                            )}>
                            {summary.avgMonthlyNet >= 0 ? "+" : ""}
                            {formatCurrency(summary.avgMonthlyNet)}
                        </p>
                    </div>
                </div>

                {/* Chart */}
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={forecastData}
                            margin={{
                                top: 10,
                                right: 10,
                                left: -20,
                                bottom: 0,
                            }}>
                            <defs>
                                <linearGradient
                                    id="colorIncome"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor="#22c55e"
                                        stopOpacity={0.3}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor="#22c55e"
                                        stopOpacity={0}
                                    />
                                </linearGradient>
                                <linearGradient
                                    id="colorExpenses"
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
                                className="stroke-muted"
                            />
                            <XAxis
                                dataKey="month"
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                className="fill-muted-foreground"
                            />
                            <YAxis
                                fontSize={10}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) =>
                                    `${(value / 1000).toFixed(0)}k`
                                }
                                className="fill-muted-foreground"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                    direction: "rtl",
                                }}
                                formatter={(value: number, name: string) => {
                                    const labels: Record<string, string> = {
                                        income: "الدخل",
                                        expenses: "المصروفات",
                                        net: "الصافي",
                                    };
                                    return [
                                        formatCurrency(value),
                                        labels[name] || name,
                                    ];
                                }}
                            />
                            <ReferenceLine
                                y={0}
                                stroke="hsl(var(--muted-foreground))"
                                strokeDasharray="3 3"
                            />
                            <Area
                                type="monotone"
                                dataKey="income"
                                stroke="#22c55e"
                                fill="url(#colorIncome)"
                                strokeWidth={2}
                                dot={false}
                            />
                            <Area
                                type="monotone"
                                dataKey="expenses"
                                stroke="#ef4444"
                                fill="url(#colorExpenses)"
                                strokeWidth={2}
                                dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex items-center justify-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                        <span className="h-3 w-3 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">الدخل</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="h-3 w-3 rounded-full bg-red-500" />
                        <span className="text-muted-foreground">المصروفات</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">* توقعات</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
