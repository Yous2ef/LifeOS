import { useState, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { TextArea } from "@/components/ui/TextArea";
import {
    ArrowUpCircle,
    ArrowDownCircle,
    Target,
    TrendingUp,
    TrendingDown,
    History,
    PartyPopper,
    AlertTriangle,
    Trophy,
    CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinancialGoal } from "@/types/modules/finance";

interface GoalContributionModalProps {
    isOpen: boolean;
    onClose: () => void;
    goal: FinancialGoal;
    formatCurrency: (amount: number) => string;
    onContribute: (goalId: string, amount: number, notes?: string) => void;
}

type TransactionType = "deposit" | "withdraw";

export function GoalContributionModal({
    isOpen,
    onClose,
    goal,
    formatCurrency,
    onContribute,
}: GoalContributionModalProps) {
    const [transactionType, setTransactionType] =
        useState<TransactionType>("deposit");
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");
    const [showHistory, setShowHistory] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<{
        type: "success" | "warning";
        message: string;
        details?: string;
    } | null>(null);

    const parsedAmount = parseFloat(amount) || 0;
    const effectiveAmount =
        transactionType === "withdraw" ? -parsedAmount : parsedAmount;
    const newBalance = goal.currentAmount + effectiveAmount;
    const currentProgress = (goal.currentAmount / goal.targetAmount) * 100;
    const newProgress = (newBalance / goal.targetAmount) * 100;
    const progressDelta = newProgress - currentProgress;

    // Calculate remaining to goal
    const newRemaining = goal.targetAmount - newBalance;

    // Check if withdrawal exceeds balance
    const canWithdraw =
        transactionType === "withdraw"
            ? parsedAmount <= goal.currentAmount
            : true;

    // Sort contributions by date (newest first)
    const sortedContributions = useMemo(() => {
        return [...goal.contributions].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [goal.contributions]);

    const handleSubmit = () => {
        if (!parsedAmount || parsedAmount <= 0) return;
        if (!canWithdraw) return;

        // Show feedback message
        if (transactionType === "deposit") {
            if (newBalance >= goal.targetAmount) {
                setFeedbackMessage({
                    type: "success",
                    message: "🎉 تهانينا! وصلت لهدفك!",
                    details: `أضفت ${formatCurrency(
                        parsedAmount
                    )} ووصلت للهدف ${formatCurrency(goal.targetAmount)}!`,
                });
            } else {
                setFeedbackMessage({
                    type: "success",
                    message: `🎯 أحسنت! اقتربت ${progressDelta.toFixed(
                        1
                    )}% من هدفك`,
                    details: `باقي ${formatCurrency(
                        newRemaining
                    )} فقط للوصول لهدفك`,
                });
            }
        } else {
            setFeedbackMessage({
                type: "warning",
                message: `⚠️ ابتعدت ${Math.abs(progressDelta).toFixed(
                    1
                )}% عن هدفك`,
                details: `الآن باقي ${formatCurrency(
                    newRemaining
                )} للوصول لهدفك`,
            });
        }

        // Perform the contribution
        onContribute(goal.id, effectiveAmount, notes || undefined);

        // // Reset form after short delay to show feedback
        // setTimeout(() => {
        //     setAmount("");
        //     setNotes("");
        //     setFeedbackMessage(null);
        //     onClose();
        // }, 2000);
    };

    const resetAndClose = () => {
        setAmount("");
        setNotes("");
        setFeedbackMessage(null);
        setShowHistory(false);
        setTransactionType("deposit");
        onClose();
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    // Check which milestones are reached
    const milestonesStatus = goal.milestones.map((m) => ({
        ...m,
        wouldBeReached: newBalance >= m.targetAmount,
        isNewlyReached: !m.reached && newBalance >= m.targetAmount,
    }));

    const newlyReachedMilestones = milestonesStatus.filter(
        (m) => m.isNewlyReached
    );

    return (
        <Dialog open={isOpen} onOpenChange={resetAndClose}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="text-2xl">{goal.icon || "🎯"}</span>
                        {goal.title}
                    </DialogTitle>
                </DialogHeader>

                {/* Feedback Message */}
                {feedbackMessage && (
                    <div
                        onClick={() => {
                            setFeedbackMessage(null);
                            setAmount("");
                            setNotes("");
                        }}
                        className={cn(
                            "p-4 rounded-lg text-center animate-pulse cursor-pointer hover:opacity-80 transition-opacity",
                            feedbackMessage.type === "success"
                                ? "bg-green-500/10 border border-green-500/30"
                                : "bg-yellow-500/10 border border-yellow-500/30"
                        )}>
                        <p className="font-bold text-lg text-foreground">
                            {feedbackMessage.message}
                        </p>
                        {feedbackMessage.details && (
                            <p className="text-sm text-foreground/70 mt-1">
                                {feedbackMessage.details}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-3">
                            اضغط للإغلاق
                        </p>
                    </div>
                )}

                {!feedbackMessage && (
                    <>
                        {/* Current Progress */}
                        <div className="bg-muted/30 p-4 rounded-lg space-y-3 text-foreground">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">
                                    الرصيد الحالي
                                </span>
                                <span className="font-bold text-lg">
                                    {formatCurrency(goal.currentAmount)}
                                </span>
                            </div>
                            <div className="h-3 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{
                                        width: `${Math.min(
                                            currentProgress,
                                            100
                                        )}%`,
                                        backgroundColor:
                                            goal.color || "var(--primary)",
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{currentProgress.toFixed(1)}% مكتمل</span>
                                <span>
                                    الهدف: {formatCurrency(goal.targetAmount)}
                                </span>
                            </div>
                        </div>

                        {/* Milestones Progress (if any) */}
                        {goal.milestones.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-sm flex items-center gap-2">
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                    المراحل (نقاط الإنجاز)
                                </Label>
                                <div className="grid grid-cols-2 gap-2">
                                    {goal.milestones.map((milestone) => {
                                        const wouldBeReached =
                                            newBalance >=
                                            milestone.targetAmount;
                                        const isNewlyReached =
                                            !milestone.reached &&
                                            parsedAmount > 0 &&
                                            wouldBeReached;
                                        return (
                                            <div
                                                key={milestone.id}
                                                className={cn(
                                                    "p-2 rounded-lg border text-xs",
                                                    milestone.reached
                                                        ? "bg-green-500/10 border-green-500/30"
                                                        : isNewlyReached
                                                        ? "bg-yellow-500/10 border-yellow-500/30 animate-pulse"
                                                        : "bg-muted/30 border-border"
                                                )}>
                                                <div className="flex items-center gap-1">
                                                    {milestone.reached ? (
                                                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                    ) : isNewlyReached ? (
                                                        <PartyPopper className="h-3 w-3 text-yellow-500" />
                                                    ) : (
                                                        <Target className="h-3 w-3 text-muted-foreground" />
                                                    )}
                                                    <span className="font-medium truncate">
                                                        {milestone.title}
                                                    </span>
                                                </div>
                                                <p className="text-muted-foreground mt-1">
                                                    {formatCurrency(
                                                        milestone.targetAmount
                                                    )}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Transaction Type Tabs */}
                        <div className="flex gap-2 p-1 bg-muted rounded-lg">
                            <Button
                                variant={
                                    transactionType === "deposit"
                                        ? "default"
                                        : "ghost"
                                }
                                className={cn(
                                    "flex-1",
                                    transactionType === "deposit" &&
                                        "bg-green-600 hover:bg-green-700"
                                )}
                                onClick={() => setTransactionType("deposit")}>
                                <ArrowUpCircle className="h-4 w-4 mr-2" />
                                إيداع
                            </Button>
                            <Button
                                variant={
                                    transactionType === "withdraw"
                                        ? "default"
                                        : "ghost"
                                }
                                className={cn(
                                    "flex-1",
                                    transactionType === "withdraw" &&
                                        "bg-orange-600 hover:bg-orange-700"
                                )}
                                onClick={() => setTransactionType("withdraw")}>
                                <ArrowDownCircle className="h-4 w-4 mr-2" />
                                سحب
                            </Button>
                        </div>

                        {/* Amount Input */}
                        <div className="space-y-2">
                            <Label>المبلغ</Label>
                            <Input
                                type="number"
                                min="0"
                                step="1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder={
                                    transactionType === "deposit"
                                        ? "أدخل مبلغ الإيداع"
                                        : "أدخل مبلغ السحب"
                                }
                                className={cn(
                                    !canWithdraw &&
                                        "border-red-500 focus-visible:ring-red-500"
                                )}
                            />
                            {!canWithdraw && (
                                <p className="text-xs text-red-500 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    المبلغ أكبر من الرصيد المتاح (
                                    {formatCurrency(goal.currentAmount)})
                                </p>
                            )}
                        </div>

                        {/* Preview Change */}
                        {parsedAmount > 0 && canWithdraw && (
                            <div
                                className={cn(
                                    "p-3 rounded-lg border",
                                    transactionType === "deposit"
                                        ? "bg-green-500/5 border-green-500/30"
                                        : "bg-orange-500/5 border-orange-500/30"
                                )}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {transactionType === "deposit" ? (
                                            <TrendingUp className="h-4 w-4 text-green-500" />
                                        ) : (
                                            <TrendingDown className="h-4 w-4 text-orange-500" />
                                        )}
                                        <span className="text-sm">
                                            الرصيد الجديد
                                        </span>
                                    </div>
                                    <span className="font-bold">
                                        {formatCurrency(newBalance)}
                                    </span>
                                </div>
                                <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                                    <span>{currentProgress.toFixed(1)}%</span>
                                    <span>→</span>
                                    <span
                                        className={cn(
                                            "font-medium",
                                            transactionType === "deposit"
                                                ? "text-green-500"
                                                : "text-orange-500"
                                        )}>
                                        {newProgress.toFixed(1)}%
                                    </span>
                                    <span
                                        className={cn(
                                            transactionType === "deposit"
                                                ? "text-green-500"
                                                : "text-orange-500"
                                        )}>
                                        ({progressDelta > 0 ? "+" : ""}
                                        {progressDelta.toFixed(1)}%)
                                    </span>
                                </div>
                                {newlyReachedMilestones.length > 0 &&
                                    transactionType === "deposit" && (
                                        <div className="mt-2 text-xs text-yellow-500 flex items-center gap-1">
                                            <PartyPopper className="h-3 w-3" />
                                            ستصل لمرحلة:{" "}
                                            {newlyReachedMilestones
                                                .map((m) => m.title)
                                                .join("، ")}
                                        </div>
                                    )}
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-2">
                            <Label>ملاحظات (اختياري)</Label>
                            <TextArea
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                placeholder="مثال: راتب شهر يناير"
                                rows={2}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <Button
                                className={cn(
                                    "flex-1",
                                    transactionType === "deposit"
                                        ? "bg-green-600 hover:bg-green-700"
                                        : "bg-orange-600 hover:bg-orange-700"
                                )}
                                onClick={handleSubmit}
                                disabled={!parsedAmount || !canWithdraw}>
                                {transactionType === "deposit" ? (
                                    <>
                                        <ArrowUpCircle className="h-4 w-4 mr-2" />
                                        إيداع{" "}
                                        {parsedAmount > 0 &&
                                            formatCurrency(parsedAmount)}
                                    </>
                                ) : (
                                    <>
                                        <ArrowDownCircle className="h-4 w-4 mr-2" />
                                        سحب{" "}
                                        {parsedAmount > 0 &&
                                            formatCurrency(parsedAmount)}
                                    </>
                                )}
                            </Button>
                            <Button variant="outline" onClick={resetAndClose}>
                                إلغاء
                            </Button>
                        </div>

                        {/* Transaction History Toggle */}
                        <Button
                            variant="ghost"
                            className="w-full text-muted-foreground"
                            onClick={() => setShowHistory(!showHistory)}>
                            <History className="h-4 w-4 mr-2" />
                            {showHistory ? "إخفاء السجل" : "عرض سجل العمليات"}
                            {goal.contributions.length > 0 && (
                                <span className="ml-2 bg-muted px-2 py-0.5 rounded text-xs">
                                    {goal.contributions.length}
                                </span>
                            )}
                        </Button>

                        {/* Transaction History */}
                        {showHistory && (
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {sortedContributions.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        لا توجد عمليات سابقة
                                    </p>
                                ) : (
                                    sortedContributions.map((contribution) => (
                                        <div
                                            key={contribution.id}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-lg border",
                                                contribution.amount >= 0
                                                    ? "bg-green-500/5 border-green-500/20"
                                                    : "bg-orange-500/5 border-orange-500/20"
                                            )}>
                                            <div className="flex items-center gap-3">
                                                {contribution.amount >= 0 ? (
                                                    <ArrowUpCircle className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <ArrowDownCircle className="h-4 w-4 text-orange-500" />
                                                )}
                                                <div>
                                                    <p
                                                        className={cn(
                                                            "font-medium text-sm",
                                                            contribution.amount >=
                                                                0
                                                                ? "text-green-600"
                                                                : "text-orange-600"
                                                        )}>
                                                        {contribution.amount >=
                                                        0
                                                            ? "+"
                                                            : ""}
                                                        {formatCurrency(
                                                            contribution.amount
                                                        )}
                                                    </p>
                                                    {contribution.notes && (
                                                        <p className="text-xs text-muted-foreground">
                                                            {contribution.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(contribution.date)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
