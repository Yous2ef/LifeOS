import { useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Income, Expense } from "@/types/modules/finance";

interface SpendingChartProps {
    incomes: Income[];
    expenses: Expense[];
    formatCurrency: (amount: number) => string;
}

interface MonthData {
    month: string;
    monthLabel: string;
    income: number;
    expenses: number;
    savings: number;
}

export function SpendingChart({
    incomes,
    expenses,
    formatCurrency,
}: SpendingChartProps) {
    const chartData = useMemo(() => {
        const now = new Date();
        const months: MonthData[] = [];

        // Get last 6 months
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;
            const monthLabel = date.toLocaleDateString("ar-EG", {
                month: "short",
            });

            // Calculate income for this month
            const monthIncome = incomes
                .filter((inc) => {
                    const incDate = new Date(
                        inc.actualDate || inc.expectedDate || inc.createdAt
                    );
                    return (
                        incDate.getFullYear() === date.getFullYear() &&
                        incDate.getMonth() === date.getMonth() &&
                        inc.status === "received"
                    );
                })
                .reduce((sum, inc) => sum + inc.amount, 0);

            // Calculate expenses for this month
            const monthExpenses = expenses
                .filter((exp) => {
                    const expDate = new Date(exp.date);
                    return (
                        expDate.getFullYear() === date.getFullYear() &&
                        expDate.getMonth() === date.getMonth()
                    );
                })
                .reduce((sum, exp) => sum + exp.amount, 0);

            months.push({
                month: monthKey,
                monthLabel,
                income: monthIncome,
                expenses: monthExpenses,
                savings: monthIncome - monthExpenses,
            });
        }

        return months;
    }, [incomes, expenses]);

    // Calculate trend
    const trend = useMemo(() => {
        if (chartData.length < 2) return { type: "neutral", percentage: 0 };

        const lastMonth = chartData[chartData.length - 1];
        const prevMonth = chartData[chartData.length - 2];

        if (prevMonth.savings === 0) return { type: "neutral", percentage: 0 };

        const change =
            ((lastMonth.savings - prevMonth.savings) /
                Math.abs(prevMonth.savings)) *
            100;

        return {
            type: change >= 0 ? "up" : "down",
            percentage: Math.abs(change).toFixed(1),
        };
    }, [chartData]);

    const totalSavings = chartData.reduce((sum, m) => sum + m.savings, 0);

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-medium">
                        الدخل مقابل المصروفات
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm">
                        {trend.type === "up" ? (
                            <span className="flex items-center gap-1 text-green-600">
                                <TrendingUp className="h-4 w-4" />+
                                {trend.percentage}%
                            </span>
                        ) : trend.type === "down" ? (
                            <span className="flex items-center gap-1 text-red-600">
                                <TrendingDown className="h-4 w-4" />-
                                {trend.percentage}%
                            </span>
                        ) : null}
                    </div>
                </div>
                <p className="text-sm text-muted-foreground">
                    إجمالي التوفير: {formatCurrency(totalSavings)}
                </p>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                className="stroke-muted"
                            />
                            <XAxis
                                dataKey="monthLabel"
                                tick={{ fontSize: 12 }}
                                className="text-muted-foreground"
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) =>
                                    `${(value / 1000).toFixed(0)}k`
                                }
                                className="text-muted-foreground"
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                    direction: "rtl",
                                }}
                                formatter={(value: number, name: string) => [
                                    formatCurrency(value),
                                    name === "income"
                                        ? "الدخل"
                                        : name === "expenses"
                                        ? "المصروفات"
                                        : "التوفير",
                                ]}
                                labelFormatter={(label) => `شهر ${label}`}
                            />
                            <Legend
                                formatter={(value) =>
                                    value === "income"
                                        ? "الدخل"
                                        : value === "expenses"
                                        ? "المصروفات"
                                        : "التوفير"
                                }
                            />
                            <Line
                                type="monotone"
                                dataKey="income"
                                stroke="#22c55e"
                                strokeWidth={2}
                                dot={{ fill: "#22c55e", strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="expenses"
                                stroke="#ef4444"
                                strokeWidth={2}
                                dot={{ fill: "#ef4444", strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="savings"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ fill: "#3b82f6", strokeWidth: 2 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
