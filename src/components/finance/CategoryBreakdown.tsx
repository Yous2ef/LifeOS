import type { CategorySpending } from "@/types/finance";

interface CategoryBreakdownProps {
    categorySpending: CategorySpending[];
    formatCurrency: (amount: number) => string;
    limit?: number;
}

export const CategoryBreakdown = ({
    categorySpending,
    formatCurrency,
    limit = 6,
}: CategoryBreakdownProps) => {
    const displayCategories = categorySpending
        .filter((c) => c.spent > 0)
        .slice(0, limit);

    const totalSpent = categorySpending.reduce((sum, c) => sum + c.spent, 0);

    if (displayCategories.length === 0) {
        return (
            <div className="text-center py-6 text-muted-foreground">
                <p>No expenses this month</p>
                <p className="text-sm">Start tracking your spending</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {displayCategories.map((category) => {
                const percentage =
                    totalSpent > 0 ? (category.spent / totalSpent) * 100 : 0;

                return (
                    <div key={category.categoryId} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-lg">
                                    {category.categoryIcon}
                                </span>
                                <span className="text-sm font-medium truncate max-w-[120px] sm:max-w-none">
                                    {category.categoryName}
                                </span>
                            </div>
                            <div className="text-right">
                                <span className="text-sm font-semibold tabular-nums">
                                    {formatCurrency(category.spent)}
                                </span>
                                <span className="text-xs text-muted-foreground ml-2">
                                    {percentage.toFixed(0)}%
                                </span>
                            </div>
                        </div>

                        {/* Progress bar */}
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full transition-all duration-500"
                                style={{
                                    width: `${Math.min(percentage, 100)}%`,
                                    backgroundColor: category.categoryColor,
                                }}
                            />
                        </div>
                    </div>
                );
            })}

            {/* Show remaining categories count */}
            {categorySpending.filter((c) => c.spent > 0).length > limit && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                    +
                    {categorySpending.filter((c) => c.spent > 0).length - limit}{" "}
                    more categories
                </p>
            )}
        </div>
    );
};
