import { useState } from "react";
import {
    Target,
    Trophy,
    TrendingUp,
    Pencil,
    PlusCircle,
    Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { GoalContributionModal } from "./GoalContributionModal";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";
import type { FinancialGoal } from "@/types/finance";

interface GoalsOverviewProps {
    goals: FinancialGoal[];
    formatCurrency: (amount: number) => string;
    onEdit?: (goal: FinancialGoal) => void;
    onDelete?: (goalId: string) => void;
    onContribute?: (goalId: string, amount: number, notes?: string) => void;
}

export const GoalsOverview = ({
    goals,
    formatCurrency,
    onEdit,
    onDelete,
    onContribute,
}: GoalsOverviewProps) => {
    const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(
        null
    );
    const [deleteConfirm, setDeleteConfirm] = useState<FinancialGoal | null>(
        null
    );

    const activeGoals = goals.filter((g) => g.status === "active");
    const completedGoals = goals.filter((g) => g.status === "completed");

    const handleContribute = (
        goalId: string,
        amount: number,
        notes?: string
    ) => {
        if (onContribute) {
            onContribute(goalId, amount, notes);
        }
    };

    const getGoalIcon = (category: string) => {
        switch (category) {
            case "emergency-fund":
                return "🛡️";
            case "savings":
                return "💰";
            case "investment":
                return "📈";
            case "purchase":
                return "🛒";
            case "travel":
                return "✈️";
            case "education":
                return "🎓";
            default:
                return "🎯";
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "critical":
                return "text-red-500 bg-red-500/10";
            case "high":
                return "text-orange-500 bg-orange-500/10";
            case "medium":
                return "text-yellow-500 bg-yellow-500/10";
            default:
                return "text-blue-500 bg-blue-500/10";
        }
    };

    const calculateTimeRemaining = (deadline?: string) => {
        if (!deadline) return null;
        const now = new Date();
        const target = new Date(deadline);
        const diffTime = target.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return "Overdue";
        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Tomorrow";
        if (diffDays < 7) return `${diffDays} days`;
        if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
        if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months`;
        return `${Math.ceil(diffDays / 365)} years`;
    };

    return (
        <div className="space-y-4">
            {/* Empty State */}
            {goals.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <Target className="h-8 w-8 text-primary" />
                        </div>
                        <h4 className="font-semibold mb-2">No Goals Yet</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                            Set financial goals to track your progress towards
                            saving for what matters
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Active Goals */}
            {activeGoals.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeGoals.map((goal) => {
                        const progress =
                            (goal.currentAmount / goal.targetAmount) * 100;
                        const timeRemaining = calculateTimeRemaining(
                            goal.deadline
                        );

                        return (
                            <Card key={goal.id} className="overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        {/* Icon */}
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
                                            style={{
                                                backgroundColor: goal.color
                                                    ? `${goal.color}20`
                                                    : "var(--primary-10)",
                                            }}>
                                            {goal.icon ||
                                                getGoalIcon(goal.category)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h4 className="font-semibold truncate">
                                                    {goal.title}
                                                </h4>
                                                <span
                                                    className={cn(
                                                        "text-xs px-1.5 py-0.5 rounded",
                                                        getPriorityColor(
                                                            goal.priority
                                                        )
                                                    )}>
                                                    {goal.priority}
                                                </span>
                                            </div>
                                            {goal.description && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {goal.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-semibold text-primary tabular-nums">
                                                {formatCurrency(
                                                    goal.currentAmount
                                                )}
                                            </span>
                                            <span className="text-muted-foreground tabular-nums">
                                                {formatCurrency(
                                                    goal.targetAmount
                                                )}
                                            </span>
                                        </div>

                                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{
                                                    width: `${Math.min(
                                                        progress,
                                                        100
                                                    )}%`,
                                                    backgroundColor:
                                                        goal.color ||
                                                        "var(--primary)",
                                                }}
                                            />
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>
                                                {progress.toFixed(0)}% complete
                                            </span>
                                            {timeRemaining && (
                                                <span>
                                                    {timeRemaining} remaining
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Monthly contribution suggestion */}
                                    {goal.monthlyContribution > 0 && (
                                        <div className="mt-3 pt-3 border-t border-border">
                                            <p className="text-xs text-muted-foreground">
                                                <TrendingUp className="h-3 w-3 inline mr-1" />
                                                Contributing{" "}
                                                {formatCurrency(
                                                    goal.monthlyContribution
                                                )}
                                                /month
                                            </p>
                                        </div>
                                    )}

                                    {/* Milestones Progress */}
                                    {goal.milestones.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-border">
                                            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                                                <Trophy className="h-3 w-3" />
                                                المراحل (
                                                {
                                                    goal.milestones.filter(
                                                        (m) => m.reached
                                                    ).length
                                                }
                                                /{goal.milestones.length})
                                            </p>
                                            <div className="flex gap-1">
                                                {goal.milestones.map(
                                                    (milestone) => (
                                                        <div
                                                            key={milestone.id}
                                                            className={cn(
                                                                "flex-1 h-2 rounded-full transition-colors",
                                                                milestone.reached
                                                                    ? "bg-green-500"
                                                                    : "bg-muted"
                                                            )}
                                                            title={`${
                                                                milestone.title
                                                            }: ${formatCurrency(
                                                                milestone.targetAmount
                                                            )}`}
                                                        />
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="mt-3 pt-3 border-t border-border flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() =>
                                                setSelectedGoal(goal)
                                            }>
                                            <PlusCircle className="h-4 w-4 mr-1" />
                                            إيداع / سحب
                                        </Button>
                                        {onEdit && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => onEdit(goal)}>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {onDelete && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                onClick={() =>
                                                    setDeleteConfirm(goal)
                                                }>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Completed Goals */}
            {completedGoals.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-yellow-500" />
                        الأهداف المكتملة
                    </h4>
                    <div className="space-y-2 text-foreground">
                        {completedGoals.map((goal) => (
                            <div
                                key={goal.id}
                                className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                                onClick={() => setSelectedGoal(goal)}>
                                <span className="text-xl">
                                    {goal.icon || getGoalIcon(goal.category)}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">
                                        {goal.title}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatCurrency(goal.targetAmount)} تم
                                        تحقيقه
                                    </p>
                                </div>
                                <Trophy className="h-5 w-5 text-yellow-500" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Goal Contribution Modal */}
            {selectedGoal && (
                <GoalContributionModal
                    isOpen={!!selectedGoal}
                    onClose={() => setSelectedGoal(null)}
                    goal={selectedGoal}
                    formatCurrency={formatCurrency}
                    onContribute={handleContribute}
                />
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!deleteConfirm}
                onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-500 flex items-center gap-2">
                            <Trash2 className="h-5 w-5" />
                            حذف الهدف
                        </DialogTitle>
                        <DialogDescription>
                            هل أنت متأكد من حذف هذا الهدف؟
                        </DialogDescription>
                    </DialogHeader>
                    {deleteConfirm && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">
                                        {deleteConfirm.icon ||
                                            getGoalIcon(deleteConfirm.category)}
                                    </span>
                                    <div>
                                        <p className="font-medium">
                                            {deleteConfirm.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            الرصيد:{" "}
                                            {formatCurrency(
                                                deleteConfirm.currentAmount
                                            )}{" "}
                                            /{" "}
                                            {formatCurrency(
                                                deleteConfirm.targetAmount
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                ⚠️ سيتم حذف الهدف وجميع سجلات الإيداع والسحب
                                المرتبطة به. هذا الإجراء لا يمكن التراجع عنه.
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => {
                                        if (onDelete && deleteConfirm) {
                                            onDelete(deleteConfirm.id);
                                            setDeleteConfirm(null);
                                        }
                                    }}>
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    نعم، احذف الهدف
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => setDeleteConfirm(null)}>
                                    إلغاء
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};
