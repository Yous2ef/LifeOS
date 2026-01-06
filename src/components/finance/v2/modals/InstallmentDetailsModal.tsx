/**
 * InstallmentDetailsModal V2 - View installment details and payment history
 *
 * Features:
 * - Installment progress visualization
 * - Payment history timeline
 * - Edit and pay actions
 * - Purple theme
 */

import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    CreditCard,
    TrendingUp,
    Edit2,
    Plus,
    Calendar,
    Minus,
    ArrowDownLeft,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Installment } from "@/types/modules/finance";

interface InstallmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    installment: Installment | null;
    formatCurrency: (amount: number) => string;
    onEdit?: () => void;
    onPay?: () => void;
    onRefund?: () => void;
}

export const InstallmentDetailsModal = ({
    isOpen,
    onClose,
    installment,
    formatCurrency,
    onEdit,
    onPay,
    onRefund,
}: InstallmentDetailsModalProps) => {
    if (!installment) return null;

    const progress = Math.min(
        (installment.paidAmount / installment.totalAmount) * 100,
        100
    );
    const remaining = installment.totalAmount - installment.paidAmount;
    const isComplete = installment.status === "completed" || progress >= 100;

    // Sort payments by date (newest first)
    const sortedPayments = [...(installment.payments || [])].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year:
                date.getFullYear() !== new Date().getFullYear()
                    ? "numeric"
                    : undefined,
        });
    };

    // Get status color and text
    const getStatusInfo = (status: string) => {
        switch (status) {
            case "paid":
                return { color: "#10b981", text: "Paid", icon: CheckCircle2 };
            case "partial":
                return { color: "#f59e0b", text: "Partial", icon: TrendingUp };
            case "late":
                return { color: "#ef4444", text: "Late", icon: Calendar };
            case "missed":
                return { color: "#ef4444", text: "Missed", icon: X };
            default:
                return { color: "#6b7280", text: status, icon: CreditCard };
        }
    };

    // SVG Progress Ring
    const ringSize = 140;
    const strokeWidth = 10;
    const radius = (ringSize - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const color = "#a855f7"; // Purple theme for installments

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
                        onClick={(e) => e.stopPropagation()}
                        className="fixed inset-x-4 top-[5%] md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-[51] max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 overflow-hidden flex flex-col max-h-full">
                            {/* Header */}
                            <div className="px-6 pt-6 pb-4 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center"
                                            style={{
                                                backgroundColor: `${color}20`,
                                            }}>
                                            <CreditCard
                                                className="w-6 h-6"
                                                style={{ color }}
                                            />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold">
                                                {installment.title}
                                            </h2>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {installment.frequency} •{" "}
                                                {installment.status}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Progress Section */}
                            <div className="px-6 pb-4 flex-shrink-0">
                                <div
                                    className="rounded-xl p-4 border"
                                    style={{
                                        background: `linear-gradient(135deg, ${color}10, ${color}05)`,
                                        borderColor: `${color}30`,
                                    }}>
                                    <div className="flex items-center gap-6">
                                        {/* Progress Ring */}
                                        <div className="relative flex-shrink-0">
                                            <svg
                                                width={ringSize}
                                                height={ringSize}
                                                className="transform -rotate-90">
                                                <circle
                                                    cx={ringSize / 2}
                                                    cy={ringSize / 2}
                                                    r={radius}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth={strokeWidth}
                                                    className="text-muted/30"
                                                />
                                                <motion.circle
                                                    cx={ringSize / 2}
                                                    cy={ringSize / 2}
                                                    r={radius}
                                                    fill="none"
                                                    stroke={color}
                                                    strokeWidth={strokeWidth}
                                                    strokeLinecap="round"
                                                    initial={{
                                                        strokeDashoffset:
                                                            circumference,
                                                    }}
                                                    animate={{
                                                        strokeDashoffset,
                                                    }}
                                                    transition={{
                                                        duration: 1,
                                                        ease: "easeOut",
                                                    }}
                                                    style={{
                                                        strokeDasharray:
                                                            circumference,
                                                    }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span
                                                    className="text-2xl font-bold"
                                                    style={{ color }}>
                                                    {Math.round(progress)}%
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    paid
                                                </span>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Paid
                                                </span>
                                                <span
                                                    className="font-semibold"
                                                    style={{ color }}>
                                                    {formatCurrency(
                                                        installment.paidAmount
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Remaining
                                                </span>
                                                <span className="font-semibold">
                                                    {formatCurrency(remaining)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Total
                                                </span>
                                                <span className="font-medium text-muted-foreground">
                                                    {formatCurrency(
                                                        installment.totalAmount
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Installments
                                                </span>
                                                <span className="font-medium text-muted-foreground">
                                                    {
                                                        installment.paidInstallments
                                                    }{" "}
                                                    /{" "}
                                                    {
                                                        installment.totalInstallments
                                                    }
                                                </span>
                                            </div>
                                            {!isComplete &&
                                                installment.nextPaymentDate && (
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2 pt-2 border-t border-white/10">
                                                        <Calendar className="w-3 h-3" />
                                                        <span>
                                                            Next:{" "}
                                                            {formatDate(
                                                                installment.nextPaymentDate
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Payment History */}
                            <div className="px-6 pb-4 flex-1 overflow-hidden flex flex-col min-h-0">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <TrendingUp
                                            className="w-4 h-4"
                                            style={{ color }}
                                        />
                                        Payment History
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                        {sortedPayments.length} payment
                                        {sortedPayments.length !== 1 ? "s" : ""}
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
                                    {sortedPayments.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">
                                                No payments yet
                                            </p>
                                            <p className="text-xs mt-1">
                                                Record your first payment!
                                            </p>
                                        </div>
                                    ) : (
                                        sortedPayments.map((payment, index) => {
                                            const statusInfo = getStatusInfo(
                                                payment.status
                                            );
                                            const isRefund = payment.amount < 0;
                                            const displayAmount = Math.abs(
                                                payment.amount
                                            );

                                            return (
                                                <motion.div
                                                    key={payment.id}
                                                    initial={{
                                                        opacity: 0,
                                                        x: -10,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        x: 0,
                                                    }}
                                                    transition={{
                                                        delay: index * 0.05,
                                                    }}
                                                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                                                    <div
                                                        className="w-10 h-10 rounded-full flex items-center justify-center"
                                                        style={{
                                                            backgroundColor:
                                                                isRefund
                                                                    ? "rgba(239, 68, 68, 0.2)"
                                                                    : `${statusInfo.color}20`,
                                                        }}>
                                                        {isRefund ? (
                                                            <Minus className="w-4 h-4 text-red-500" />
                                                        ) : (
                                                            <Plus
                                                                className="w-4 h-4"
                                                                style={{
                                                                    color: statusInfo.color,
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between">
                                                            <span
                                                                className={`font-medium ${
                                                                    isRefund
                                                                        ? "text-red-500"
                                                                        : ""
                                                                }`}
                                                                style={
                                                                    isRefund
                                                                        ? {}
                                                                        : {
                                                                              color: statusInfo.color,
                                                                          }
                                                                }>
                                                                {isRefund
                                                                    ? "-"
                                                                    : "+"}
                                                                {formatCurrency(
                                                                    displayAmount
                                                                )}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatDate(
                                                                    payment.date
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="text-xs px-1.5 py-0.5 rounded"
                                                                style={{
                                                                    backgroundColor: `${statusInfo.color}20`,
                                                                    color: statusInfo.color,
                                                                }}>
                                                                {isRefund
                                                                    ? "Refund"
                                                                    : statusInfo.text}
                                                            </span>
                                                            {payment.notes && (
                                                                <p className="text-xs text-muted-foreground truncate">
                                                                    {
                                                                        payment.notes
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="px-6 pb-6 pt-2 flex-shrink-0 border-t border-border space-y-2">
                                <div className="flex gap-3">
                                    {onPay && !isComplete && (
                                        <Button
                                            onClick={() => {
                                                onClose();
                                                onPay();
                                            }}
                                            className="flex-1 gap-2"
                                            style={{
                                                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                                            }}>
                                            <Plus className="w-4 h-4" />
                                            Record Payment
                                        </Button>
                                    )}
                                    {onRefund && installment.paidAmount > 0 && (
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                onClose();
                                                onRefund();
                                            }}
                                            className="flex-1 gap-2 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10">
                                            <ArrowDownLeft className="w-4 h-4" />
                                            Refund
                                        </Button>
                                    )}
                                </div>
                                {onEdit && (
                                    <Button
                                        variant="ghost"
                                        onClick={() => {
                                            onClose();
                                            onEdit();
                                        }}
                                        className="w-full gap-2 text-muted-foreground hover:text-foreground">
                                        <Edit2 className="w-4 h-4" />
                                        Edit Installment
                                    </Button>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
