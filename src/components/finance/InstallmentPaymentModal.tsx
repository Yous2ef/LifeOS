import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { TextArea } from "@/components/ui/TextArea";
import {
    Wallet,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    History,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Installment, InstallmentPayment } from "@/types/modules/finance";

interface InstallmentPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    installment: Installment | null;
    onPay: (
        installmentId: string,
        payment: Omit<InstallmentPayment, "id" | "installmentId" | "createdAt">
    ) => void;
    formatCurrency: (amount: number) => string;
}

export function InstallmentPaymentModal({
    isOpen,
    onClose,
    installment,
    onPay,
    formatCurrency,
}: InstallmentPaymentModalProps) {
    const [amount, setAmount] = useState("");
    const [paymentDate, setPaymentDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [notes, setNotes] = useState("");
    const [showHistory, setShowHistory] = useState(false);

    if (!installment) return null;

    const defaultAmount = installment.installmentAmount;
    const nextDueDate = new Date(installment.nextPaymentDate);
    const selectedDate = new Date(paymentDate);
    const isEarly = selectedDate < nextDueDate;
    const isLate = selectedDate > nextDueDate;
    const daysEarly = isEarly
        ? Math.ceil(
              (nextDueDate.getTime() - selectedDate.getTime()) /
                  (1000 * 60 * 60 * 24)
          )
        : 0;
    const daysLate = isLate
        ? Math.ceil(
              (selectedDate.getTime() - nextDueDate.getTime()) /
                  (1000 * 60 * 60 * 24)
          )
        : 0;

    const paymentAmount = parseFloat(amount) || defaultAmount;
    const isPartial = paymentAmount < defaultAmount;
    const remainingAfterPayment =
        installment.totalAmount - installment.paidAmount - paymentAmount;

    const handleSubmit = () => {
        if (!amount && !defaultAmount) return;

        const status: InstallmentPayment["status"] = isLate
            ? "late"
            : isPartial
            ? "partial"
            : "paid";

        onPay(installment.id, {
            date: paymentDate,
            amount: paymentAmount,
            status,
            lateFee: isLate ? 0 : undefined, // Could add late fee calculation
            notes: notes || undefined,
        });

        // Reset and close
        setAmount("");
        setPaymentDate(new Date().toISOString().split("T")[0]);
        setNotes("");
        onClose();
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("ar-EG", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const getPaymentStatusColor = (status: string) => {
        switch (status) {
            case "paid":
                return "text-green-500 bg-green-500/10";
            case "late":
                return "text-orange-500 bg-orange-500/10";
            case "partial":
                return "text-yellow-500 bg-yellow-500/10";
            case "missed":
                return "text-red-500 bg-red-500/10";
            default:
                return "text-muted-foreground bg-muted";
        }
    };

    const getPaymentStatusLabel = (status: string) => {
        switch (status) {
            case "paid":
                return "مدفوع";
            case "late":
                return "متأخر";
            case "partial":
                return "جزئي";
            case "missed":
                return "فائت";
            default:
                return status;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="h-5 w-5" />
                        سداد قسط
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Installment Info */}
                    <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-medium">
                                {installment.title}
                            </span>
                            <span className="text-sm text-muted-foreground">
                                قسط {installment.paidInstallments + 1} من{" "}
                                {installment.totalInstallments}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                الموعد المحدد:
                            </span>
                            <span className="font-medium">
                                {formatDate(installment.nextPaymentDate)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                                قيمة القسط:
                            </span>
                            <span className="font-bold text-primary">
                                {formatCurrency(defaultAmount)}
                            </span>
                        </div>
                    </div>

                    {/* Payment Date */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="paymentDate"
                            className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            تاريخ الدفع
                        </Label>
                        <Input
                            id="paymentDate"
                            type="date"
                            value={paymentDate}
                            onChange={(e) => setPaymentDate(e.target.value)}
                        />
                        {/* Early/Late indicator */}
                        {isEarly && (
                            <p className="text-xs text-green-500 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                دفع مبكر بـ {daysEarly} يوم - ممتاز! 🎉
                            </p>
                        )}
                        {isLate && (
                            <p className="text-xs text-orange-500 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" />
                                دفع متأخر بـ {daysLate} يوم
                            </p>
                        )}
                    </div>

                    {/* Payment Amount */}
                    <div className="space-y-2">
                        <Label htmlFor="amount">المبلغ المدفوع</Label>
                        <Input
                            id="amount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={defaultAmount.toString()}
                        />
                        {isPartial && amount && (
                            <p className="text-xs text-yellow-500 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                دفع جزئي - سيتبقى{" "}
                                {formatCurrency(defaultAmount - paymentAmount)}
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                        <TextArea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="مثال: دفعت من حساب البنك..."
                            rows={2}
                        />
                    </div>

                    {/* Summary */}
                    <div className="rounded-lg border p-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                المبلغ الحالي:
                            </span>
                            <span>{formatCurrency(paymentAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">
                                المتبقي بعد السداد:
                            </span>
                            <span
                                className={cn(
                                    "font-medium",
                                    remainingAfterPayment <= 0
                                        ? "text-green-500"
                                        : "text-foreground"
                                )}>
                                {remainingAfterPayment <= 0
                                    ? "✅ مكتمل!"
                                    : formatCurrency(remainingAfterPayment)}
                            </span>
                        </div>
                    </div>

                    {/* Payment History */}
                    {installment.payments.length > 0 && (
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => setShowHistory(!showHistory)}
                                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors w-full">
                                <History className="h-4 w-4" />
                                سجل الدفعات ({installment.payments.length})
                                {showHistory ? (
                                    <ChevronUp className="h-4 w-4 mr-auto" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 mr-auto" />
                                )}
                            </button>
                            {showHistory && (
                                <div className="space-y-2 max-h-40 overflow-y-auto text-foreground">
                                    {installment.payments
                                        .slice()
                                        .reverse()
                                        .map((payment, index) => (
                                            <div
                                                key={payment.id}
                                                className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-muted-foreground">
                                                        #
                                                        {installment.payments
                                                            .length - index}
                                                    </span>
                                                    <span>
                                                        {formatDate(
                                                            payment.date
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium">
                                                        {formatCurrency(
                                                            payment.amount
                                                        )}
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "text-xs px-2 py-0.5 rounded",
                                                            getPaymentStatusColor(
                                                                payment.status
                                                            )
                                                        )}>
                                                        {getPaymentStatusLabel(
                                                            payment.status
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>
                        إلغاء
                    </Button>
                    <Button onClick={handleSubmit} className="gap-2">
                        <Wallet className="h-4 w-4" />
                        تأكيد الدفع
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
