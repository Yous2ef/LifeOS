import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/progress";
import {
    PieChart,
    Settings,
    Plus,
    Check,
    AlertTriangle,
    TrendingUp,
} from "lucide-react";
import type { Budget, CategoryBudget, ExpenseCategory } from "@/types/finance";

interface BudgetPlannerProps {
    budget: Budget | null;
    categories: ExpenseCategory[];
    formatCurrency: (amount: number) => string;
    onSaveBudget: (categoryBudgets: CategoryBudget[]) => void;
}

export function BudgetPlanner({
    budget,
    categories,
    formatCurrency,
    onSaveBudget,
}: BudgetPlannerProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedBudgets, setEditedBudgets] = useState<Record<string, string>>(
        {}
    );

    // Initialize edited budgets from current budget
    const handleStartEdit = () => {
        const initial: Record<string, string> = {};
        categories.forEach((cat) => {
            const existing = budget?.categoryBudgets.find(
                (b) => b.categoryId === cat.id
            );
            initial[cat.id] =
                existing?.planned.toString() ||
                cat.monthlyBudget?.toString() ||
                "0";
        });
        setEditedBudgets(initial);
        setIsEditing(true);
    };

    const handleSave = () => {
        const categoryBudgets: CategoryBudget[] = categories.map((cat) => {
            const planned = parseFloat(editedBudgets[cat.id]) || 0;
            const existing = budget?.categoryBudgets.find(
                (b) => b.categoryId === cat.id
            );
            const spent = existing?.spent || 0;

            return {
                categoryId: cat.id,
                categoryName: cat.name,
                planned,
                spent,
                remaining: planned - spent,
                percentage: planned > 0 ? (spent / planned) * 100 : 0,
            };
        });

        onSaveBudget(categoryBudgets);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
        setEditedBudgets({});
    };

    const totalPlanned =
        budget?.categoryBudgets.reduce((sum, b) => sum + b.planned, 0) || 0;
    const totalSpent =
        budget?.categoryBudgets.reduce((sum, b) => sum + b.spent, 0) || 0;
    const totalRemaining = totalPlanned - totalSpent;
    const overallPercentage =
        totalPlanned > 0 ? (totalSpent / totalPlanned) * 100 : 0;

    const getStatusColor = (percentage: number) => {
        if (percentage <= 50) return "bg-green-500";
        if (percentage <= 80) return "bg-yellow-500";
        if (percentage <= 100) return "bg-orange-500";
        return "bg-red-500";
    };

    const getStatusIcon = (percentage: number) => {
        if (percentage <= 80)
            return <Check className="h-4 w-4 text-green-600" />;
        if (percentage <= 100)
            return <AlertTriangle className="h-4 w-4 text-orange-600" />;
        return <TrendingUp className="h-4 w-4 text-red-600" />;
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base font-medium">
                        <PieChart className="h-5 w-5" />
                        تخطيط الميزانية
                    </CardTitle>
                    {isEditing ? (
                        <div className="flex gap-2">
                            <Button size="sm" onClick={handleSave}>
                                <Check className="mr-1 h-4 w-4" />
                                حفظ
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancel}>
                                إلغاء
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleStartEdit}>
                            <Settings className="mr-1 h-4 w-4" />
                            تعديل
                        </Button>
                    )}
                </div>

                {/* Overall Summary */}
                {budget && !isEditing && (
                    <div className="mt-3 rounded-lg bg-muted/50 p-3 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span>إجمالي الميزانية</span>
                            <span className="font-medium">
                                {formatCurrency(totalPlanned)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span>المصروف</span>
                            <span
                                className={
                                    totalSpent > totalPlanned
                                        ? "text-red-600"
                                        : "text-muted-foreground"
                                }>
                                {formatCurrency(totalSpent)}
                            </span>
                        </div>
                        <Progress
                            value={Math.min(100, overallPercentage)}
                            className="h-2"
                        />
                        <div className="flex items-center justify-between text-xs">
                            <span
                                className={
                                    totalRemaining >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                }>
                                {totalRemaining >= 0 ? "متبقي" : "تجاوز"}:{" "}
                                {formatCurrency(Math.abs(totalRemaining))}
                            </span>
                            <span className="text-muted-foreground">
                                {overallPercentage.toFixed(0)}%
                            </span>
                        </div>
                    </div>
                )}
            </CardHeader>

            <CardContent className="space-y-3">
                {isEditing ? (
                    // Edit Mode
                    <div className="space-y-3">
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                className="flex items-center gap-3">
                                <div className="flex items-center gap-2 min-w-[120px]">
                                    <span
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: cat.color }}
                                    />
                                    <span className="text-sm truncate">
                                        {cat.icon} {cat.name}
                                    </span>
                                </div>
                                <Input
                                    type="number"
                                    min="0"
                                    step="100"
                                    value={editedBudgets[cat.id] || "0"}
                                    onChange={(e) =>
                                        setEditedBudgets({
                                            ...editedBudgets,
                                            [cat.id]: e.target.value,
                                        })
                                    }
                                    className="w-28 text-left"
                                    placeholder="0"
                                />
                                <span className="text-xs text-muted-foreground">
                                    ج.م
                                </span>
                            </div>
                        ))}

                        {/* Quick Templates */}
                        <div className="border-t pt-3 mt-4">
                            <p className="text-xs text-muted-foreground mb-2">
                                قوالب سريعة:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        const newBudgets: Record<
                                            string,
                                            string
                                        > = {};
                                        categories.forEach((cat) => {
                                            // 50/30/20 rule estimation
                                            newBudgets[cat.id] = cat.isEssential
                                                ? "2000"
                                                : "500";
                                        });
                                        setEditedBudgets(newBudgets);
                                    }}>
                                    قاعدة 50/30/20
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        const newBudgets: Record<
                                            string,
                                            string
                                        > = {};
                                        categories.forEach((cat) => {
                                            newBudgets[cat.id] = "1000";
                                        });
                                        setEditedBudgets(newBudgets);
                                    }}>
                                    توزيع متساوي
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : budget && budget.categoryBudgets.length > 0 ? (
                    // View Mode - Show budgets
                    <div className="space-y-3">
                        {budget.categoryBudgets
                            .filter((b) => b.planned > 0)
                            .map((catBudget) => {
                                const category = categories.find(
                                    (c) => c.id === catBudget.categoryId
                                );
                                const percentage =
                                    catBudget.planned > 0
                                        ? (catBudget.spent /
                                              catBudget.planned) *
                                          100
                                        : 0;
                                const isOver = percentage > 100;

                                return (
                                    <div
                                        key={catBudget.categoryId}
                                        className="space-y-1">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className="h-3 w-3 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            category?.color,
                                                    }}
                                                />
                                                <span className="truncate">
                                                    {category?.icon}{" "}
                                                    {category?.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(percentage)}
                                                <span
                                                    className={
                                                        isOver
                                                            ? "text-red-600 font-medium"
                                                            : ""
                                                    }>
                                                    {percentage.toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={`absolute top-0 left-0 h-full transition-all ${getStatusColor(
                                                    percentage
                                                )}`}
                                                style={{
                                                    width: `${Math.min(
                                                        100,
                                                        percentage
                                                    )}%`,
                                                }}
                                            />
                                            {isOver && (
                                                <div
                                                    className="absolute top-0 h-full bg-red-500/50"
                                                    style={{
                                                        left: "100%",
                                                        width: `${Math.min(
                                                            50,
                                                            percentage - 100
                                                        )}%`,
                                                        transform:
                                                            "translateX(-100%)",
                                                    }}
                                                />
                                            )}
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>
                                                {formatCurrency(
                                                    catBudget.spent
                                                )}
                                            </span>
                                            <span>
                                                {formatCurrency(
                                                    catBudget.planned
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}

                        {budget.categoryBudgets.filter((b) => b.planned > 0)
                            .length === 0 && (
                            <div className="text-center py-6 text-muted-foreground">
                                <p>لم يتم تحديد ميزانية لأي فئة</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-2"
                                    onClick={handleStartEdit}>
                                    <Plus className="mr-1 h-4 w-4" />
                                    إعداد الميزانية
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    // No budget yet
                    <div className="text-center py-6 text-muted-foreground">
                        <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                            لم يتم إعداد ميزانية لهذا الشهر
                        </p>
                        <p className="text-xs mt-1">
                            حدد ميزانية لكل فئة لتتبع إنفاقك
                        </p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-3"
                            onClick={handleStartEdit}>
                            <Plus className="mr-1 h-4 w-4" />
                            إعداد الميزانية
                        </Button>
                    </div>
                )}

                {/* Budget Tips */}
                {budget && !isEditing && totalSpent > 0 && (
                    <div className="border-t pt-3 mt-3">
                        <p className="text-xs text-muted-foreground mb-2">
                            💡 نصيحة:
                        </p>
                        {overallPercentage < 50 ? (
                            <p className="text-xs text-green-600">
                                أداء ممتاز! أنت تنفق أقل من نصف ميزانيتك 💚
                            </p>
                        ) : overallPercentage < 80 ? (
                            <p className="text-xs text-yellow-600">
                                أنت في المسار الصحيح، استمر في التحكم بالإنفاق
                                👍
                            </p>
                        ) : overallPercentage < 100 ? (
                            <p className="text-xs text-orange-600">
                                انتبه! اقتربت من حد الميزانية، قلل من النفقات
                                غير الضرورية ⚠️
                            </p>
                        ) : (
                            <p className="text-xs text-red-600">
                                تجاوزت الميزانية! راجع نفقاتك وحاول تقليل
                                الإنفاق 🚨
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
