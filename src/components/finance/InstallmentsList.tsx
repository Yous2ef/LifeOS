import { useState } from "react";
import {
    CreditCard,
    Check,
    AlertTriangle,
    Pencil,
    Wallet,
    Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/Dialog";
import { cn } from "@/lib/utils";
import type { Installment } from "@/types/finance";

interface InstallmentsListProps {
    installments: Installment[];
    formatCurrency: (amount: number) => string;
    onEdit?: (installment: Installment) => void;
    onDelete?: (installmentId: string) => void;
    onPayInstallment?: (id: string) => void;
}

export const InstallmentsList = ({
    installments,
    formatCurrency,
    onEdit,
    onDelete,
    onPayInstallment,
}: InstallmentsListProps) => {
    const [deleteConfirm, setDeleteConfirm] = useState<Installment | null>(
        null
    );

    const activeInstallments = installments.filter(
        (i) => i.status === "active"
    );
    const completedInstallments = installments.filter(
        (i) => i.status === "completed"
    );

    const getDaysUntilDue = (nextPaymentDate: string) => {
        const now = new Date();
        const due = new Date(nextPaymentDate);
        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const getStatusColor = (status: string, daysUntilDue?: number) => {
        if (status === "completed") return "bg-green-500/10 text-green-500";
        if (status === "paused") return "bg-yellow-500/10 text-yellow-500";
        if (
            status === "overdue" ||
            (daysUntilDue !== undefined && daysUntilDue < 0)
        ) {
            return "bg-red-500/10 text-red-500";
        }
        if (daysUntilDue !== undefined && daysUntilDue <= 3) {
            return "bg-orange-500/10 text-orange-500";
        }
        return "bg-primary/10 text-primary";
    };

    const formatDueDate = (nextPaymentDate: string) => {
        const days = getDaysUntilDue(nextPaymentDate);
        if (days < 0) return `${Math.abs(days)} days overdue`;
        if (days === 0) return "Due today";
        if (days === 1) return "Due tomorrow";
        if (days <= 7) return `Due in ${days} days`;
        return new Date(nextPaymentDate).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
    };

    // Calculate totals
    const totalDebt = activeInstallments.reduce(
        (sum, i) => sum + (i.totalAmount - i.paidAmount),
        0
    );
    const monthlyPayments = activeInstallments.reduce(
        (sum, i) => sum + i.installmentAmount,
        0
    );

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            {activeInstallments.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground mb-1">
                                Total Remaining
                            </p>
                            <p className="text-xl font-bold text-foreground tabular-nums">
                                {formatCurrency(totalDebt)}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-4">
                            <p className="text-xs text-muted-foreground mb-1">
                                Monthly Payments
                            </p>
                            <p className="text-xl font-bold text-orange-500 tabular-nums">
                                {formatCurrency(monthlyPayments)}
                            </p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Empty State */}
            {installments.length === 0 && (
                <Card>
                    <CardContent className="py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <CreditCard className="h-8 w-8 text-primary" />
                        </div>
                        <h4 className="font-semibold mb-2">No Installments</h4>
                        <p className="text-sm text-muted-foreground">
                            Track your installments, loans, and recurring
                            payments
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Active Installments */}
            {activeInstallments.length > 0 && (
                <div className="space-y-3">
                    {activeInstallments.map((installment) => {
                        const progress =
                            (installment.paidInstallments /
                                installment.totalInstallments) *
                            100;
                        const remaining =
                            installment.totalInstallments -
                            installment.paidInstallments;
                        const daysUntilDue = getDaysUntilDue(
                            installment.nextPaymentDate
                        );
                        const isUrgent = daysUntilDue <= 3;

                        return (
                            <Card
                                key={installment.id}
                                className={cn(
                                    "overflow-hidden transition-all",
                                    isUrgent &&
                                        daysUntilDue >= 0 &&
                                        "border-orange-500/50",
                                    daysUntilDue < 0 && "border-red-500/50"
                                )}>
                                <CardContent className="p-4">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-semibold truncate">
                                                    {installment.title}
                                                </h4>
                                                {daysUntilDue < 0 && (
                                                    <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                                                )}
                                            </div>
                                            {installment.description && (
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {installment.description}
                                                </p>
                                            )}
                                        </div>

                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "shrink-0",
                                                getStatusColor(
                                                    installment.status,
                                                    daysUntilDue
                                                )
                                            )}>
                                            {formatDueDate(
                                                installment.nextPaymentDate
                                            )}
                                        </Badge>
                                    </div>

                                    {/* Progress */}
                                    <div className="space-y-2 mb-3">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">
                                                {installment.paidInstallments}{" "}
                                                of{" "}
                                                {installment.totalInstallments}{" "}
                                                paid
                                            </span>
                                            <span className="font-medium">
                                                {progress.toFixed(0)}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary rounded-full transition-all"
                                                style={{
                                                    width: `${progress}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Footer Stats */}
                                    <div className="flex items-center justify-between text-sm">
                                        <div>
                                            <span className="text-muted-foreground">
                                                Each:{" "}
                                            </span>
                                            <span className="font-semibold tabular-nums">
                                                {formatCurrency(
                                                    installment.installmentAmount
                                                )}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground">
                                                Remaining:{" "}
                                            </span>
                                            <span className="font-semibold tabular-nums">
                                                {formatCurrency(
                                                    installment.totalAmount -
                                                        installment.paidAmount
                                                )}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Motivational Text */}
                                    <div className="mt-3 pt-3 border-t border-border">
                                        <p className="text-xs text-center">
                                            {remaining === 1 ? (
                                                <span className="text-green-500 font-medium">
                                                    🎉 Just 1 more payment to
                                                    go!
                                                </span>
                                            ) : remaining <= 3 ? (
                                                <span className="text-primary font-medium">
                                                    💪 Only {remaining} payments
                                                    left!
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    {remaining} payments
                                                    remaining
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Pay Button */}
                                    <div className="flex gap-2 mt-3">
                                        {onPayInstallment && (
                                            <Button
                                                size="sm"
                                                variant={
                                                    isUrgent
                                                        ? "default"
                                                        : "outline"
                                                }
                                                className="flex-1"
                                                onClick={() =>
                                                    onPayInstallment(
                                                        installment.id
                                                    )
                                                }>
                                                <Wallet className="h-4 w-4 mr-1" />
                                                Pay (
                                                {formatCurrency(
                                                    installment.installmentAmount
                                                )}
                                                )
                                            </Button>
                                        )}
                                        {onEdit && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    onEdit(installment)
                                                }>
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                        )}
                                        {onDelete && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                onClick={() =>
                                                    setDeleteConfirm(
                                                        installment
                                                    )
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

            {/* Completed Installments */}
            {completedInstallments.length > 0 && (
                <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        Completed
                    </h4>
                    <div className="space-y-2">
                        {completedInstallments
                            .slice(0, 3)
                            .map((installment) => (
                                <div
                                    key={installment.id}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                                    <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <Check className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium truncate">
                                            {installment.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatCurrency(
                                                installment.totalAmount
                                            )}{" "}
                                            paid off
                                        </p>
                                    </div>
                                    {onDelete && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                            onClick={() =>
                                                setDeleteConfirm(installment)
                                            }>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={!!deleteConfirm}
                onOpenChange={() => setDeleteConfirm(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-500 flex items-center gap-2">
                            <Trash2 className="h-5 w-5" />
                            حذف القسط
                        </DialogTitle>
                        <DialogDescription>
                            هل أنت متأكد من حذف هذا القسط؟
                        </DialogDescription>
                    </DialogHeader>
                    {deleteConfirm && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <CreditCard className="h-8 w-8 text-primary" />
                                    <div>
                                        <p className="font-medium">
                                            {deleteConfirm.title}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {deleteConfirm.paidInstallments} /{" "}
                                            {deleteConfirm.totalInstallments}{" "}
                                            أقساط مدفوعة
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            المتبقي:{" "}
                                            {formatCurrency(
                                                deleteConfirm.totalAmount -
                                                    deleteConfirm.paidAmount
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                ⚠️ سيتم حذف القسط وجميع سجلات الدفع المرتبطة به.
                                هذا الإجراء لا يمكن التراجع عنه.
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
                                    نعم، احذف القسط
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
