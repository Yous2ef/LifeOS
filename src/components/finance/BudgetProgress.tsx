import { AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategorySpending } from "@/types/finance";

interface BudgetProgressProps {
    categorySpending: CategorySpending[];
    formatCurrency: (amount: number) => string;
}

export const BudgetProgress = ({
    categorySpending,
    formatCurrency,
}: BudgetProgressProps) => {
    if (categorySpending.length === 0) {
        return (
            <div className="text-center py-6 text-muted-foreground">
                <p>No budgets set</p>
                <p className="text-sm">
                    Set category budgets to track spending
                </p>
            </div>
        );
    }

    // Sort by percentage (highest first)
    const sortedCategories = [...categorySpending].sort(
        (a, b) => b.percentage - a.percentage
    );

    return (
        <div className="space-y-4">
            {sortedCategories.map((category) => {
                const remaining = category.budget - category.spent;
                const isOver = category.isOverBudget;
                const isWarning = category.percentage >= 80 && !isOver;
                const isGood = category.percentage < 80;

                return (
                    <div key={category.categoryId} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">
                                    {category.categoryIcon}
                                </span>
                                <span className="text-sm font-medium">
                                    {category.categoryName}
                                </span>
                                {isOver && (
                                    <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                                {isGood && category.percentage > 0 && (
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                )}
                            </div>
                            <div className="text-right text-sm">
                                <span
                                    className={cn(
                                        "font-semibold tabular-nums",
                                        isOver && "text-red-500"
                                    )}>
                                    {formatCurrency(category.spent)}
                                </span>
                                <span className="text-muted-foreground">
                                    {" / "}
                                    {formatCurrency(category.budget)}
                                </span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-500",
                                    isOver && "bg-red-500",
                                    isWarning && "bg-yellow-500",
                                    isGood && "bg-green-500"
                                )}
                                style={{
                                    width: `${Math.min(
                                        category.percentage,
                                        100
                                    )}%`,
                                }}
                            />
                        </div>

                        {/* Remaining text */}
                        <p
                            className={cn(
                                "text-xs",
                                isOver
                                    ? "text-red-500"
                                    : "text-muted-foreground"
                            )}>
                            {isOver
                                ? `Over by ${formatCurrency(
                                      Math.abs(remaining)
                                  )}`
                                : `${formatCurrency(remaining)} remaining`}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};
