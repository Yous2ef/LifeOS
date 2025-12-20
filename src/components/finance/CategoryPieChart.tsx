import { useMemo } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import type { Expense, ExpenseCategory } from "@/types/modules/finance";

interface CategoryPieChartProps {
    expenses: Expense[];
    categories: ExpenseCategory[];
    formatCurrency: (amount: number) => string;
    period?: "week" | "month" | "year";
}

interface CategoryData {
    name: string;
    value: number;
    color: string;
    icon: string;
    percentage: number;
    [key: string]: string | number; // Index signature for Recharts compatibility
}

export function CategoryPieChart({
    expenses,
    categories,
    formatCurrency,
    period = "month",
}: CategoryPieChartProps) {
    const chartData = useMemo(() => {
        const now = new Date();
        let startDate: Date;

        switch (period) {
            case "week":
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case "year":
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case "month":
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }

        // Filter expenses by period
        const filteredExpenses = expenses.filter((exp) => {
            const expDate = new Date(exp.date);
            return expDate >= startDate && expDate <= now;
        });

        // Group by category
        const categoryTotals: Record<string, number> = {};
        filteredExpenses.forEach((exp) => {
            const catId = exp.categoryId;
            categoryTotals[catId] = (categoryTotals[catId] || 0) + exp.amount;
        });

        const total = Object.values(categoryTotals).reduce(
            (sum, val) => sum + val,
            0
        );

        // Create chart data
        const data: CategoryData[] = Object.entries(categoryTotals)
            .map(([catId, amount]) => {
                const category = categories.find((c) => c.id === catId) || {
                    name: "أخرى",
                    color: "#64748b",
                    icon: "📦",
                };
                return {
                    name: category.name,
                    value: amount,
                    color: category.color,
                    icon: category.icon,
                    percentage: total > 0 ? (amount / total) * 100 : 0,
                };
            })
            .sort((a, b) => b.value - a.value)
            .slice(0, 8); // Top 8 categories

        return { data, total };
    }, [expenses, categories, period]);

    const periodLabel =
        period === "week"
            ? "هذا الأسبوع"
            : period === "year"
            ? "هذه السنة"
            : "هذا الشهر";

    if (chartData.data.length === 0) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium">
                        المصروفات حسب الفئة
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        {periodLabel}
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                        <p>لا توجد مصروفات {periodLabel}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium">
                    المصروفات حسب الفئة
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    {periodLabel} • إجمالي: {formatCurrency(chartData.total)}
                </p>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData.data}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value">
                                {chartData.data.map((entry) => (
                                    <Cell
                                        key={`cell-${entry.name}`}
                                        fill={entry.color}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                    direction: "rtl",
                                }}
                                formatter={(value: number) => [
                                    formatCurrency(value),
                                    "المبلغ",
                                ]}
                            />
                            <Legend
                                layout="vertical"
                                align="right"
                                verticalAlign="middle"
                                formatter={(value) => {
                                    const item = chartData.data.find(
                                        (d) => d.name === value
                                    );
                                    return (
                                        <span className="text-xs">
                                            {item?.icon} {value} (
                                            {item?.percentage.toFixed(0)}%)
                                        </span>
                                    );
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Top 3 Categories List */}
                <div className="mt-4 space-y-2">
                    {chartData.data.slice(0, 3).map((cat) => (
                        <div
                            key={cat.name}
                            className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <span
                                    className="h-3 w-3 rounded-full"
                                    style={{ backgroundColor: cat.color }}
                                />
                                <span>
                                    {cat.icon} {cat.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">
                                    {formatCurrency(cat.value)}
                                </span>
                                <span className="text-muted-foreground">
                                    ({cat.percentage.toFixed(0)}%)
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
