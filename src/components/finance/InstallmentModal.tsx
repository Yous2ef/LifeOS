import { useState, useEffect } from "react";
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
import type { RecurringFrequency } from "@/types/modules/finance";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";
import { Calendar, CreditCard, Bell, CheckCircle } from "lucide-react";
import type { Installment } from "@/types/modules/finance";

interface InstallmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (installment: Omit<Installment, "id" | "createdAt">) => void;
    installment?: Installment | null;
}

const INSTALLMENT_CATEGORIES = [
    { value: "car", label: "سيارة", icon: "🚗" },
    { value: "home", label: "منزل/عقار", icon: "🏠" },
    { value: "electronics", label: "إلكترونيات", icon: "📱" },
    { value: "furniture", label: "أثاث", icon: "🛋️" },
    { value: "education", label: "تعليم", icon: "📚" },
    { value: "medical", label: "طبي", icon: "💊" },
    { value: "loan", label: "قرض شخصي", icon: "💰" },
    { value: "other", label: "أخرى", icon: "📦" },
];

export function InstallmentModal({
    isOpen,
    onClose,
    onSave,
    installment,
}: InstallmentModalProps) {
    const [title, setTitle] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [installmentAmount, setInstallmentAmount] = useState("");
    const [totalInstallments, setTotalInstallments] = useState("");
    const [paidInstallments, setPaidInstallments] = useState("0");
    const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
    const [categoryId, setCategoryId] = useState("other");
    const [startDate, setStartDate] = useState("");
    const [remindDaysBefore, setRemindDaysBefore] = useState("3");
    const [autoPayment, setAutoPayment] = useState(false);
    const [notes, setNotes] = useState("");

    // Track which field was last edited for smart calculation
    const [lastEdited, setLastEdited] = useState<
        "total" | "installment" | "count" | null
    >(null);

    // Calculate derived values
    const total = parseFloat(totalAmount) || 0;
    const perInstallment = parseFloat(installmentAmount) || 0;
    const numInstallments = parseInt(totalInstallments) || 0;
    const numPaid = parseInt(paidInstallments) || 0;
    const paidAmount = perInstallment * numPaid;
    const remainingAmount = total - paidAmount;

    useEffect(() => {
        if (installment) {
            setTitle(installment.title);
            setTotalAmount(installment.totalAmount.toString());
            setInstallmentAmount(installment.installmentAmount.toString());
            setTotalInstallments(installment.totalInstallments.toString());
            setPaidInstallments(installment.paidInstallments.toString());
            setFrequency(installment.frequency);
            setCategoryId(installment.categoryId);
            setStartDate(installment.startDate.split("T")[0]);
            setRemindDaysBefore(installment.remindDaysBefore.toString());
            setAutoPayment(installment.autoPayment);
            setNotes(installment.notes || "");
        } else {
            resetForm();
        }
    }, [installment, isOpen]);

    const resetForm = () => {
        setTitle("");
        setTotalAmount("");
        setInstallmentAmount("");
        setTotalInstallments("");
        setPaidInstallments("0");
        setFrequency("monthly");
        setCategoryId("other");
        setStartDate(new Date().toISOString().split("T")[0]);
        setRemindDaysBefore("3");
        setAutoPayment(false);
        setNotes("");
        setLastEdited(null);
    };

    // Smart bidirectional auto-calculation
    useEffect(() => {
        // Calculate based on last edited field
        if (lastEdited === "total" && total > 0 && numInstallments > 0) {
            // User edited total → calculate installment amount
            setInstallmentAmount((total / numInstallments).toFixed(2));
        } else if (
            lastEdited === "installment" &&
            perInstallment > 0 &&
            numInstallments > 0
        ) {
            // User edited installment amount → calculate total
            setTotalAmount((perInstallment * numInstallments).toFixed(2));
        } else if (lastEdited === "count" && numInstallments > 0) {
            if (total > 0) {
                // If total exists, calculate installment amount
                setInstallmentAmount((total / numInstallments).toFixed(2));
            } else if (perInstallment > 0) {
                // If installment amount exists, calculate total
                setTotalAmount((perInstallment * numInstallments).toFixed(2));
            }
        }
    }, [totalAmount, installmentAmount, totalInstallments, lastEdited]);

    // Handle field changes with tracking
    const handleTotalChange = (value: string) => {
        setTotalAmount(value);
        setLastEdited("total");
    };

    const handleInstallmentChange = (value: string) => {
        setInstallmentAmount(value);
        setLastEdited("installment");
    };

    const handleCountChange = (value: string) => {
        setTotalInstallments(value);
        setLastEdited("count");
    };

    const calculateNextPaymentDate = () => {
        const start = new Date(startDate);
        const now = new Date();
        let next = new Date(start);

        while (next <= now) {
            switch (frequency) {
                case "weekly":
                    next.setDate(next.getDate() + 7);
                    break;
                case "monthly":
                    next.setMonth(next.getMonth() + 1);
                    break;
                case "quarterly":
                    next.setMonth(next.getMonth() + 3);
                    break;
            }
        }

        return next.toISOString();
    };

    const calculateEndDate = () => {
        const start = new Date(startDate);
        const remaining = numInstallments - numPaid;

        switch (frequency) {
            case "weekly":
                start.setDate(start.getDate() + 7 * remaining);
                break;
            case "monthly":
                start.setMonth(start.getMonth() + remaining);
                break;
            case "quarterly":
                start.setMonth(start.getMonth() + 3 * remaining);
                break;
        }

        return start.toISOString();
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (
            !title ||
            !totalAmount ||
            !installmentAmount ||
            !totalInstallments ||
            !startDate
        ) {
            return;
        }

        onSave({
            title,
            totalAmount: total,
            paidAmount,
            installmentAmount: perInstallment,
            totalInstallments: numInstallments,
            paidInstallments: numPaid,
            frequency,
            startDate: new Date(startDate).toISOString(),
            nextPaymentDate: calculateNextPaymentDate(),
            endDate: calculateEndDate(),
            categoryId,
            status: numPaid >= numInstallments ? "completed" : "active",
            autoPayment,
            remindDaysBefore: parseInt(remindDaysBefore),
            notes: notes || undefined,
            payments: installment?.payments || [],
            updatedAt: new Date().toISOString(),
        });

        onClose();
    };

    const categoryInfo = INSTALLMENT_CATEGORIES.find(
        (c) => c.value === categoryId
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" />
                        {installment ? "تعديل القسط" : "إضافة قسط جديد"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">اسم القسط</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="مثال: قسط السيارة"
                            required
                        />
                    </div>

                    {/* Category */}
                    <div className="space-y-2">
                        <Label>الفئة</Label>
                        <Select
                            value={categoryId}
                            onValueChange={setCategoryId}>
                            <SelectTrigger>
                                <SelectValue>
                                    {categoryInfo?.icon} {categoryInfo?.label}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {INSTALLMENT_CATEGORIES.map((cat) => (
                                    <SelectItem
                                        key={cat.value}
                                        value={cat.value}>
                                        {cat.icon} {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Amounts */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="totalAmount">المبلغ الإجمالي</Label>
                            <Input
                                id="totalAmount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={totalAmount}
                                onChange={(e) =>
                                    handleTotalChange(e.target.value)
                                }
                                placeholder="0.00"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="installmentAmount">
                                قيمة القسط
                            </Label>
                            <Input
                                id="installmentAmount"
                                type="number"
                                min="0"
                                step="0.01"
                                value={installmentAmount}
                                onChange={(e) =>
                                    handleInstallmentChange(e.target.value)
                                }
                                placeholder="0.00"
                                required
                            />
                        </div>
                    </div>

                    {/* Installment Count */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="totalInstallments">
                                عدد الأقساط الكلي
                            </Label>
                            <Input
                                id="totalInstallments"
                                type="number"
                                min="1"
                                value={totalInstallments}
                                onChange={(e) =>
                                    handleCountChange(e.target.value)
                                }
                                placeholder="12"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paidInstallments">
                                الأقساط المدفوعة
                            </Label>
                            <Input
                                id="paidInstallments"
                                type="number"
                                min="0"
                                max={totalInstallments}
                                value={paidInstallments}
                                onChange={(e) =>
                                    setPaidInstallments(e.target.value)
                                }
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Summary Card */}
                    {total > 0 && numInstallments > 0 && (
                        <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    المدفوع
                                </span>
                                <span className="font-medium text-green-600">
                                    {paidAmount.toLocaleString("ar-EG")} ج.م
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    المتبقي
                                </span>
                                <span className="font-medium text-red-600">
                                    {remainingAmount.toLocaleString("ar-EG")}{" "}
                                    ج.م
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                    الأقساط المتبقية
                                </span>
                                <span className="font-medium">
                                    {numInstallments - numPaid} قسط
                                </span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all"
                                    style={{
                                        width: `${
                                            (numPaid / numInstallments) * 100
                                        }%`,
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Frequency & Start Date */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>تكرار الدفع</Label>
                            <Select
                                value={frequency}
                                onValueChange={(v) =>
                                    setFrequency(v as typeof frequency)
                                }>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="weekly">
                                        أسبوعي
                                    </SelectItem>
                                    <SelectItem value="monthly">
                                        شهري
                                    </SelectItem>
                                    <SelectItem value="quarterly">
                                        ربع سنوي
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startDate">تاريخ البداية</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                    className="pl-10"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reminder */}
                    <div className="space-y-2">
                        <Label
                            htmlFor="remindDaysBefore"
                            className="flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            التذكير قبل الموعد بـ
                        </Label>
                        <Select
                            value={remindDaysBefore}
                            onValueChange={setRemindDaysBefore}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">يوم واحد</SelectItem>
                                <SelectItem value="3">3 أيام</SelectItem>
                                <SelectItem value="7">أسبوع</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Auto Payment Toggle */}
                    <div className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium">
                                    دفع تلقائي
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    تسجيل الدفع تلقائياً في موعده
                                </p>
                            </div>
                        </div>
                        <Button
                            type="button"
                            variant={autoPayment ? "default" : "outline"}
                            size="sm"
                            onClick={() => setAutoPayment(!autoPayment)}>
                            {autoPayment ? "مفعّل" : "معطّل"}
                        </Button>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">ملاحظات (اختياري)</Label>
                        <TextArea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="أي ملاحظات إضافية..."
                            rows={2}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <Button type="submit" className="flex-1">
                            {installment ? "حفظ التعديلات" : "إضافة القسط"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}>
                            إلغاء
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
