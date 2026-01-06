/**
 * InstallmentModal V2 - Debt/Installment tracking
 *
 * Features:
 * - Visual progress bar preview
 * - Payment schedule setup
 * - Linked account selection
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    CreditCard,
    Calendar,
    Tag,
    FileText,
    Repeat,
    Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { TextArea } from "@/components/ui/TextArea";
import type {
    Account,
    RecurringFrequency,
    Currency,
    Installment,
} from "@/types/modules/finance";

interface InstallmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (installment: InstallmentFormData) => void;
    accounts: Account[];
    defaultCurrency: Currency;
    installment?: Installment | null; // Existing installment for editing
}

export interface InstallmentFormData {
    title: string;
    totalAmount: number;
    paidAmount: number;
    installmentAmount: number;
    totalInstallments: number;
    paidInstallments: number;
    frequency: RecurringFrequency;
    startDate: string;
    nextDueDate: string;
    linkedAccountId?: string;
    merchant?: string;
    notes?: string;
    currency: Currency;
}

const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
    { value: "weekly", label: "Weekly" },
    { value: "bi-weekly", label: "Bi-weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
];

export const InstallmentModal = ({
    isOpen,
    onClose,
    onSubmit,
    accounts,
    defaultCurrency,
    installment,
}: InstallmentModalProps) => {
    const isEditing = !!installment;

    const [formData, setFormData] = useState<InstallmentFormData>({
        title: "",
        totalAmount: 0,
        paidAmount: 0,
        installmentAmount: 0,
        totalInstallments: 12,
        paidInstallments: 0,
        frequency: "monthly",
        startDate: new Date().toISOString().split("T")[0],
        nextDueDate: new Date().toISOString().split("T")[0],
        linkedAccountId: accounts.find((a) => a.isDefault)?.id,
        merchant: "",
        notes: "",
        currency: defaultCurrency,
    });

    const [step, setStep] = useState<"amount" | "schedule" | "details">(
        "amount"
    );

    // Reset form when modal opens - populate with existing data if editing
    useEffect(() => {
        if (isOpen) {
            if (installment) {
                // Editing existing installment
                setFormData({
                    title: installment.title,
                    totalAmount: installment.totalAmount,
                    paidAmount: installment.paidAmount,
                    installmentAmount: installment.installmentAmount,
                    totalInstallments: installment.totalInstallments,
                    paidInstallments: installment.paidInstallments,
                    frequency: installment.frequency,
                    startDate: installment.startDate,
                    nextDueDate: installment.nextPaymentDate,
                    linkedAccountId: installment.linkedAccountId,
                    merchant: "",
                    notes: installment.description || "",
                    currency: defaultCurrency,
                });
                setStep("amount");
            } else {
                // Creating new installment
                setFormData({
                    title: "",
                    totalAmount: 0,
                    paidAmount: 0,
                    installmentAmount: 0,
                    totalInstallments: 12,
                    paidInstallments: 0,
                    frequency: "monthly",
                    startDate: new Date().toISOString().split("T")[0],
                    nextDueDate: new Date().toISOString().split("T")[0],
                    linkedAccountId: accounts.find((a) => a.isDefault)?.id,
                    merchant: "",
                    notes: "",
                    currency: defaultCurrency,
                });
                setStep("amount");
            }
        }
    }, [isOpen, defaultCurrency, accounts, installment]);

    // Auto-calculate installment amount when total or count changes
    useEffect(() => {
        if (formData.totalAmount > 0 && formData.totalInstallments > 0) {
            const remaining = formData.totalAmount - formData.paidAmount;
            const remainingInstallments =
                formData.totalInstallments - formData.paidInstallments;
            if (remainingInstallments > 0) {
                setFormData((prev) => ({
                    ...prev,
                    installmentAmount: Math.ceil(
                        remaining / remainingInstallments
                    ),
                }));
            }
        }
    }, [
        formData.totalAmount,
        formData.totalInstallments,
        formData.paidAmount,
        formData.paidInstallments,
    ]);

    const handleSubmit = () => {
        if (
            !formData.title ||
            formData.totalAmount <= 0 ||
            formData.totalInstallments <= 0
        ) {
            return;
        }
        onSubmit(formData);
        onClose();
    };

    const progress =
        formData.totalInstallments > 0
            ? (formData.paidInstallments / formData.totalInstallments) * 100
            : 0;

    const remainingAmount = formData.totalAmount - formData.paidAmount;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300,
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-[51]">
                        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-violet-500/20 flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-violet-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold">
                                            {isEditing
                                                ? "Edit Installment"
                                                : "New Installment"}
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            {step === "amount"
                                                ? "Set the total"
                                                : step === "schedule"
                                                ? "Payment schedule"
                                                : "Final details"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    title="Close"
                                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Progress Steps */}
                            <div className="flex gap-1 px-4 pt-4">
                                {["amount", "schedule", "details"].map(
                                    (s, i) => (
                                        <div
                                            key={s}
                                            className={cn(
                                                "flex-1 h-1 rounded-full transition-all",
                                                (step === "amount" &&
                                                    i === 0) ||
                                                    (step === "schedule" &&
                                                        i <= 1) ||
                                                    (step === "details" &&
                                                        i <= 2)
                                                    ? "bg-violet-500"
                                                    : "bg-muted"
                                            )}
                                        />
                                    )
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
                                {step === "amount" && (
                                    <>
                                        {/* Title */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                                <Tag className="w-3 h-3" />
                                                What are you paying for?
                                            </Label>
                                            <Input
                                                value={formData.title}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        title: e.target.value,
                                                    }))
                                                }
                                                placeholder="e.g., MacBook Pro, Car Loan, Phone"
                                                className="rounded-xl"
                                                autoFocus
                                            />
                                        </div>

                                        {/* Total Amount */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 block">
                                                Total Amount
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                    {formData.currency}
                                                </span>
                                                <Input
                                                    type="number"
                                                    value={
                                                        formData.totalAmount ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            totalAmount:
                                                                parseFloat(
                                                                    e.target
                                                                        .value
                                                                ) || 0,
                                                        }))
                                                    }
                                                    placeholder="0.00"
                                                    className="rounded-xl pl-14 text-lg font-semibold"
                                                />
                                            </div>
                                        </div>

                                        {/* Already Paid */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 block">
                                                Already Paid (optional)
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                    {formData.currency}
                                                </span>
                                                <Input
                                                    type="number"
                                                    value={
                                                        formData.paidAmount ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            paidAmount:
                                                                parseFloat(
                                                                    e.target
                                                                        .value
                                                                ) || 0,
                                                        }))
                                                    }
                                                    placeholder="0.00"
                                                    className="rounded-xl pl-14"
                                                />
                                            </div>
                                        </div>

                                        {/* Merchant */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 block">
                                                Merchant / Store (optional)
                                            </Label>
                                            <Input
                                                value={formData.merchant || ""}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        merchant:
                                                            e.target.value,
                                                    }))
                                                }
                                                placeholder="e.g., Apple Store, Bank, Dealership"
                                                className="rounded-xl"
                                            />
                                        </div>
                                    </>
                                )}

                                {step === "schedule" && (
                                    <>
                                        {/* Visual Progress Bar */}
                                        <div className="p-4 bg-violet-500/10 rounded-2xl">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">
                                                    {formData.title ||
                                                        "Installment"}
                                                </span>
                                                <span className="text-sm text-muted-foreground">
                                                    {formData.paidInstallments}/
                                                    {formData.totalInstallments}{" "}
                                                    paid
                                                </span>
                                            </div>
                                            <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{
                                                        width: `${progress}%`,
                                                    }}
                                                    transition={{
                                                        duration: 0.5,
                                                        ease: "easeOut",
                                                    }}
                                                    className="h-full bg-violet-500 rounded-full"
                                                />
                                            </div>
                                            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                                                <span>
                                                    {formData.currency}{" "}
                                                    {formData.paidAmount.toLocaleString()}{" "}
                                                    paid
                                                </span>
                                                <span>
                                                    {formData.currency}{" "}
                                                    {remainingAmount.toLocaleString()}{" "}
                                                    remaining
                                                </span>
                                            </div>
                                        </div>

                                        {/* Number of Installments */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 block">
                                                Total Installments
                                            </Label>
                                            <div className="flex gap-2">
                                                {[3, 6, 12, 24, 36].map(
                                                    (num) => (
                                                        <button
                                                            key={num}
                                                            onClick={() =>
                                                                setFormData(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        totalInstallments:
                                                                            num,
                                                                    })
                                                                )
                                                            }
                                                            className={cn(
                                                                "flex-1 py-2 rounded-xl text-sm font-medium transition-all",
                                                                formData.totalInstallments ===
                                                                    num
                                                                    ? "bg-violet-500 text-white"
                                                                    : "bg-muted/50 hover:bg-muted"
                                                            )}>
                                                            {num}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                            <Input
                                                type="number"
                                                value={
                                                    formData.totalInstallments
                                                }
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        totalInstallments:
                                                            parseInt(
                                                                e.target.value
                                                            ) || 1,
                                                    }))
                                                }
                                                className="rounded-xl mt-2"
                                                min={1}
                                            />
                                        </div>

                                        {/* Paid Installments */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 block">
                                                Installments Already Paid
                                            </Label>
                                            <Input
                                                type="number"
                                                value={
                                                    formData.paidInstallments
                                                }
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        paidInstallments:
                                                            Math.min(
                                                                parseInt(
                                                                    e.target
                                                                        .value
                                                                ) || 0,
                                                                formData.totalInstallments
                                                            ),
                                                    }))
                                                }
                                                className="rounded-xl"
                                                min={0}
                                                max={formData.totalInstallments}
                                            />
                                        </div>

                                        {/* Frequency */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                                <Repeat className="w-3 h-3" />
                                                Payment Frequency
                                            </Label>
                                            <div className="flex flex-wrap gap-2">
                                                {FREQUENCIES.map((freq) => (
                                                    <button
                                                        key={freq.value}
                                                        onClick={() =>
                                                            setFormData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    frequency:
                                                                        freq.value,
                                                                })
                                                            )
                                                        }
                                                        className={cn(
                                                            "px-4 py-2 rounded-xl text-sm transition-all",
                                                            formData.frequency ===
                                                                freq.value
                                                                ? "bg-violet-500 text-white"
                                                                : "bg-muted/50 hover:bg-muted"
                                                        )}>
                                                        {freq.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Per-Installment Amount */}
                                        <div className="p-3 bg-muted/30 rounded-xl">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">
                                                    Per installment
                                                </span>
                                                <span className="text-lg font-semibold text-violet-500">
                                                    {formData.currency}{" "}
                                                    {formData.installmentAmount.toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {step === "details" && (
                                    <>
                                        {/* Start Date */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                Start Date
                                            </Label>
                                            <Input
                                                type="date"
                                                value={formData.startDate}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        startDate:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="rounded-xl"
                                            />
                                        </div>

                                        {/* Next Due Date */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                Next Payment Due
                                            </Label>
                                            <Input
                                                type="date"
                                                value={formData.nextDueDate}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        nextDueDate:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="rounded-xl"
                                            />
                                        </div>

                                        {/* Linked Account */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                                <Wallet className="w-3 h-3" />
                                                Pay From Account
                                            </Label>
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {accounts
                                                    .filter((a) => a.isActive)
                                                    .map((acc) => (
                                                        <button
                                                            key={acc.id}
                                                            onClick={() =>
                                                                setFormData(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        linkedAccountId:
                                                                            acc.id,
                                                                    })
                                                                )
                                                            }
                                                            className={cn(
                                                                "flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all",
                                                                formData.linkedAccountId ===
                                                                    acc.id
                                                                    ? "bg-violet-500/20 ring-2 ring-violet-500"
                                                                    : "bg-muted/50 hover:bg-muted"
                                                            )}>
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        acc.color,
                                                                }}
                                                            />
                                                            <span className="text-sm font-medium">
                                                                {acc.name}
                                                            </span>
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>

                                        {/* Notes */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                                <FileText className="w-3 h-3" />
                                                Notes (optional)
                                            </Label>
                                            <TextArea
                                                value={formData.notes || ""}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        notes: e.target.value,
                                                    }))
                                                }
                                                placeholder="Add any notes..."
                                                className="rounded-xl min-h-[80px]"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-border/50 flex gap-3">
                                {step === "amount" && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={onClose}
                                            className="flex-1 rounded-xl">
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={() => setStep("schedule")}
                                            disabled={
                                                !formData.title ||
                                                formData.totalAmount <= 0
                                            }
                                            className="flex-1 rounded-xl bg-violet-500 hover:bg-violet-600">
                                            Continue
                                        </Button>
                                    </>
                                )}
                                {step === "schedule" && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => setStep("amount")}
                                            className="flex-1 rounded-xl">
                                            Back
                                        </Button>
                                        <Button
                                            onClick={() => setStep("details")}
                                            disabled={
                                                formData.totalInstallments <= 0
                                            }
                                            className="flex-1 rounded-xl bg-violet-500 hover:bg-violet-600">
                                            Continue
                                        </Button>
                                    </>
                                )}
                                {step === "details" && (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => setStep("schedule")}
                                            className="flex-1 rounded-xl">
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            className="flex-1 rounded-xl bg-violet-500 hover:bg-violet-600">
                                            Create Installment
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Summary */}
                            {formData.title && formData.totalAmount > 0 && (
                                <div className="px-4 pb-4">
                                    <div className="flex items-center justify-between p-3 bg-violet-500/10 rounded-xl text-sm">
                                        <div className="flex items-center gap-2">
                                            <CreditCard className="w-4 h-4 text-violet-500" />
                                            <span className="font-medium">
                                                {formData.title}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-semibold text-violet-500">
                                                {formData.currency}{" "}
                                                {formData.installmentAmount.toLocaleString()}
                                                /mo
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {formData.totalInstallments -
                                                    formData.paidInstallments}{" "}
                                                payments left
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
