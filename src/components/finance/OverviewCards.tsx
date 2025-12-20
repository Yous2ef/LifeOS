import { useMemo } from "react";
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Percent,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { FinancialStats } from "@/types/modules/finance";

interface OverviewCardsProps {
    stats: FinancialStats;
    formatCurrency: (amount: number) => string;
}

export const OverviewCards = ({
    stats,
    formatCurrency,
}: OverviewCardsProps) => {
    const cards = useMemo(
        () => [
            {
                title: "Total Income",
                value: stats.totalIncomeThisMonth,
                change: stats.incomeVsLastMonth,
                icon: ArrowUpRight,
                color: "text-green-500",
                bgColor: "bg-green-500/10",
                trend: stats.incomeVsLastMonth >= 0 ? "up" : "down",
            },
            {
                title: "Total Expenses",
                value: stats.totalExpensesThisMonth,
                change: stats.expensesVsLastMonth,
                icon: ArrowDownRight,
                color: "text-red-500",
                bgColor: "bg-red-500/10",
                trend: stats.expensesVsLastMonth <= 0 ? "up" : "down", // Less expenses is good
            },
            {
                title: "Balance",
                value: stats.netBalanceThisMonth,
                icon: Wallet,
                color:
                    stats.netBalanceThisMonth >= 0
                        ? "text-primary"
                        : "text-red-500",
                bgColor:
                    stats.netBalanceThisMonth >= 0
                        ? "bg-primary/10"
                        : "bg-red-500/10",
                isBalance: true,
            },
            {
                title: "Savings Rate",
                value: stats.savingsRateThisMonth,
                icon: Percent,
                color:
                    stats.savingsRateThisMonth >= 20
                        ? "text-green-500"
                        : stats.savingsRateThisMonth >= 0
                        ? "text-yellow-500"
                        : "text-red-500",
                bgColor:
                    stats.savingsRateThisMonth >= 20
                        ? "bg-green-500/10"
                        : stats.savingsRateThisMonth >= 0
                        ? "bg-yellow-500/10"
                        : "bg-red-500/10",
                isPercentage: true,
            },
        ],
        [stats]
    );

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {cards.map((card) => (
                <Card key={card.title} className="overflow-hidden">
                    <CardContent className="p-3 sm:p-4">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                                    {card.title}
                                </p>
                                <p
                                    className={cn(
                                        "text-lg sm:text-2xl font-bold mt-1 truncate",
                                        card.isBalance &&
                                            card.value < 0 &&
                                            "text-red-500"
                                    )}>
                                    {card.isPercentage
                                        ? `${card.value.toFixed(1)}%`
                                        : formatCurrency(Math.abs(card.value))}
                                    {card.isBalance && card.value < 0 && (
                                        <span className="text-xs ml-1">-</span>
                                    )}
                                </p>

                                {/* Change indicator */}
                                {card.change !== undefined && (
                                    <div className="flex items-center gap-1 mt-1">
                                        {card.change >= 0 ? (
                                            <TrendingUp
                                                className={cn(
                                                    "h-3 w-3",
                                                    card.trend === "up"
                                                        ? "text-green-500"
                                                        : "text-red-500"
                                                )}
                                            />
                                        ) : (
                                            <TrendingDown
                                                className={cn(
                                                    "h-3 w-3",
                                                    card.trend === "up"
                                                        ? "text-green-500"
                                                        : "text-red-500"
                                                )}
                                            />
                                        )}
                                        <span
                                            className={cn(
                                                "text-xs",
                                                card.trend === "up"
                                                    ? "text-green-500"
                                                    : "text-red-500"
                                            )}>
                                            {Math.abs(card.change).toFixed(1)}%
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            vs last month
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div
                                className={cn(
                                    "p-2 rounded-lg shrink-0",
                                    card.bgColor
                                )}>
                                <card.icon
                                    className={cn(
                                        "h-4 w-4 sm:h-5 sm:w-5",
                                        card.color
                                    )}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
