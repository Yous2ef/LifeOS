/**
 * PaymentModal V2 - Glassmorphic installment payment recording
 *
 * Features:
 * - Record payments for installments
 * - Account selection for payment source
 * - Payment amount with validation
 * - Visual progress indicator
 * - Purple theme for payments
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, CheckCircle2, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { TextArea } from "@/components/ui/TextArea";
import type {
    Installment,
    Account,
    Currency,
    PaymentMethod,
} from "@/types/modules/finance";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (payment: PaymentFormData) => void;
    installment: Installment | null;
    accounts: Account[];
    defaultCurrency: Currency;
    formatCurrency: (amount: number) => string;
    calculateBalance: (accountId: string) => number;
}

export interface PaymentFormData {
    installmentId: string;
    amount: number;
    accountId: string;
    paymentMethod: PaymentMethod;
    date: string;
    notes?: string;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] =
    [
        { value: "card", label: "Card", icon: "💳" },
        { value: "cash", label: "Cash", icon: "💵" },
        { value: "bank-transfer", label: "Bank Transfer", icon: "🏦" },
        { value: "mobile-wallet", label: "Mobile Wallet", icon: "📱" },
        { value: "other", label: "Other", icon: "📝" },
    ];

export const PaymentModal = ({
    isOpen,
    onClose,
    onSubmit,
    installment,
    accounts,
    defaultCurrency,
    formatCurrency,
    calculateBalance,
}: PaymentModalProps) => {
    const activeAccounts = accounts.filter((a) => a.isActive);

    const [formData, setFormData] = useState<PaymentFormData>({
        installmentId: "",
        amount: 0,
        accountId: activeAccounts[0]?.id || "",
        paymentMethod: "card",
        date: new Date().toISOString().split("T")[0],
        notes: "",
    });

    const [isProcessing, setIsProcessing] = useState(false);

    // Reset form when modal opens with installment data
    useEffect(() => {
        if (isOpen && installment) {
            setFormData({
                installmentId: installment.id,
                amount: installment.installmentAmount,
                accountId:
                    installment.linkedAccountId || activeAccounts[0]?.id || "",
                paymentMethod: "card",
                date: new Date().toISOString().split("T")[0],
                notes: "",
            });
            setIsProcessing(false);
        }
    }, [isOpen, installment, activeAccounts]);

    const handleSubmit = async () => {
        if (!formData.accountId || formData.amount <= 0 || !installment) {
            return;
        }

        setIsProcessing(true);

        // Simulate processing
        await new Promise((resolve) => setTimeout(resolve, 500));

        onSubmit(formData);
        setIsProcessing(false);
        onClose();
    };

    const remainingAmount = installment
        ? installment.totalAmount - installment.paidAmount
        : 0;

    const progressPercent = installment
        ? (installment.paidAmount / installment.totalAmount) * 100
        : 0;

    const selectedAccount = activeAccounts.find(
        (a) => a.id === formData.accountId
    );
    const accountBalance = selectedAccount
        ? calculateBalance(selectedAccount.id)
        : 0;
    const insufficientFunds = formData.amount > accountBalance;

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        onClick={(e) => e.stopPropagation()}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[51] w-full max-w-md">
                        <div className="relative bg-card/95 backdrop-blur-xl rounded-3xl border border-border/50 shadow-2xl overflow-hidden">
                            {/* Purple gradient header */}
                            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-purple-500/20 via-violet-500/10 to-transparent" />

                            {/* Header */}
                            <div className="relative p-6 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                                            <Receipt className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold">
                                                Record Payment
                                            </h2>
                                            <p className="text-sm text-muted-foreground">
                                                {installment?.title ||
                                                    "Installment Payment"}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Progress indicator */}
                                {installment && (
                                    <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/30">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-muted-foreground">
                                                Progress
                                            </span>
                                            <span className="font-medium">
                                                {installment.paidInstallments}{" "}
                                                of{" "}
                                                {installment.totalInstallments}{" "}
                                                payments
                                            </span>
                                        </div>
                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-gradient-to-r from-purple-500 to-violet-500"
                                                initial={{ width: 0 }}
                                                animate={{
                                                    width: `${progressPercent}%`,
                                                }}
                                                transition={{
                                                    duration: 0.5,
                                                    delay: 0.2,
                                                }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs mt-2">
                                            <span className="text-purple-400">
                                                {formatCurrency(
                                                    installment.paidAmount
                                                )}{" "}
                                                paid
                                            </span>
                                            <span className="text-muted-foreground">
                                                {formatCurrency(
                                                    remainingAmount
                                                )}{" "}
                                                remaining
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Form */}
                            <div className="relative p-6 pt-0 space-y-4 max-h-[50vh] overflow-y-auto">
                                {/* Amount */}
                                <div className="space-y-2">
                                    <Label>Payment Amount</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                            {defaultCurrency === "EGP"
                                                ? "E£"
                                                : defaultCurrency === "USD"
                                                ? "$"
                                                : "€"}
                                        </span>
                                        <Input
                                            type="number"
                                            value={formData.amount || ""}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    amount:
                                                        parseFloat(
                                                            e.target.value
                                                        ) || 0,
                                                }))
                                            }
                                            className="pl-10 text-lg font-semibold"
                                            placeholder="0.00"
                                        />
                                    </div>
                                    {installment && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    amount: installment.installmentAmount,
                                                }))
                                            }
                                            className="text-xs text-purple-400 hover:text-purple-300">
                                            Use installment amount:{" "}
                                            {formatCurrency(
                                                installment.installmentAmount
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Account Selection */}
                                <div className="space-y-2">
                                    <Label>Pay From Account</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {activeAccounts
                                            .slice(0, 4)
                                            .map((account) => {
                                                const balance =
                                                    calculateBalance(
                                                        account.id
                                                    );
                                                const isSelected =
                                                    formData.accountId ===
                                                    account.id;
                                                return (
                                                    <button
                                                        key={account.id}
                                                        type="button"
                                                        onClick={() =>
                                                            setFormData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    accountId:
                                                                        account.id,
                                                                })
                                                            )
                                                        }
                                                        className={cn(
                                                            "p-3 rounded-xl border text-left transition-all",
                                                            isSelected
                                                                ? "border-purple-500/50 bg-purple-500/10"
                                                                : "border-border/50 hover:border-border"
                                                        )}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        account.color,
                                                                }}
                                                            />
                                                            <span className="text-sm font-medium truncate">
                                                                {account.name}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {formatCurrency(
                                                                balance
                                                            )}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                    {insufficientFunds && (
                                        <p className="text-xs text-destructive">
                                            Insufficient funds in selected
                                            account
                                        </p>
                                    )}
                                </div>

                                {/* Payment Method */}
                                <div className="space-y-2">
                                    <Label>Payment Method</Label>
                                    <div className="flex gap-2 flex-wrap">
                                        {PAYMENT_METHODS.map((method) => (
                                            <button
                                                key={method.value}
                                                type="button"
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        paymentMethod:
                                                            method.value,
                                                    }))
                                                }
                                                className={cn(
                                                    "px-3 py-2 rounded-lg border text-sm transition-all flex items-center gap-2",
                                                    formData.paymentMethod ===
                                                        method.value
                                                        ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                                                        : "border-border/50 hover:border-border"
                                                )}>
                                                <span>{method.icon}</span>
                                                <span>{method.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="space-y-2">
                                    <Label>Payment Date</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            type="date"
                                            value={formData.date}
                                            onChange={(e) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    date: e.target.value,
                                                }))
                                            }
                                            className="pl-10"
                                        />
                                    </div>
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label>Notes (Optional)</Label>
                                    <TextArea
                                        value={formData.notes}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                notes: e.target.value,
                                            }))
                                        }
                                        placeholder="Any additional notes..."
                                        rows={2}
                                    />
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="relative p-6 pt-4 border-t border-border/30">
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={onClose}
                                        className="flex-1">
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={
                                            !formData.amount ||
                                            !formData.accountId ||
                                            insufficientFunds ||
                                            isProcessing
                                        }
                                        className="flex-1 bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white border-0">
                                        {isProcessing ? (
                                            <motion.div
                                                animate={{ rotate: 360 }}
                                                transition={{
                                                    duration: 1,
                                                    repeat: Infinity,
                                                    ease: "linear",
                                                }}
                                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                            />
                                        ) : (
                                            <>
                                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                                Record Payment
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default PaymentModal;
