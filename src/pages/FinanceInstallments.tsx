/**
 * Finance Installments Page - Full installments management
 */

import { useState } from "react";
import { useFinance } from "@/hooks/useFinance";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, CreditCard, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { GlassCard } from "@/components/finance/v2/layout/GlassCard";
import { InstallmentsTimeline } from "@/components/finance/v2/future/InstallmentsTimeline";
import { InstallmentModal } from "@/components/finance/v2/modals/InstallmentModal";
import { InstallmentDetailsModal } from "@/components/finance/v2/modals/InstallmentDetailsModal";
import { InstallmentRefundModal } from "@/components/finance/v2/modals/InstallmentRefundModal";
import { PaymentModal } from "@/components/finance/v2/modals/PaymentModal";
import { SkeletonCard } from "@/components/finance/v2/effects/SkeletonCard";

import type { Installment } from "@/types/modules/finance";

export default function FinanceInstallments() {
    const {
        accounts,
        categories,
        installments,
        settings,
        formatCurrency,
        addInstallment,
        updateInstallment,
        addInstallmentPayment,
        addInstallmentRefund,
        calculateAccountBalance,
    } = useFinance();

    const [showInstallmentModal, setShowInstallmentModal] = useState(false);
    const [showInstallmentDetailsModal, setShowInstallmentDetailsModal] =
        useState(false);
    const [showInstallmentRefundModal, setShowInstallmentRefundModal] =
        useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingInstallment, setEditingInstallment] =
        useState<Installment | null>(null);
    const [viewingInstallment, setViewingInstallment] =
        useState<Installment | null>(null);
    const [refundingInstallment, setRefundingInstallment] =
        useState<Installment | null>(null);
    const [payingInstallment, setPayingInstallment] =
        useState<Installment | null>(null);
    const [isLoading] = useState(false);

    // Separate active and completed installments
    const activeInstallments = installments.filter(
        (i) => i.status === "active"
    );
    const completedInstallments = installments.filter(
        (i) => i.status === "completed"
    );

    // Calculate totals
    const totalRemaining = activeInstallments.reduce(
        (sum, i) => sum + (i.totalAmount - i.paidAmount),
        0
    );
    const totalPaid = installments.reduce((sum, i) => sum + i.paidAmount, 0);

    return (
        <div className="min-h-screen bg-background text-primary pb-24">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-white/10">
                <div className="max-w-4xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Link
                            to="/finance"
                            className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold">Installments</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage your payment plans
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingInstallment(null);
                                setShowInstallmentModal(true);
                            }}
                            className="p-2.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition-colors">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.header>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <GlassCard
                        intensity="light"
                        padding="md"
                        className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">
                            {installments.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Total Plans
                        </div>
                    </GlassCard>
                    <GlassCard
                        intensity="light"
                        padding="md"
                        className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                            {activeInstallments.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Active
                        </div>
                    </GlassCard>
                    <GlassCard
                        intensity="light"
                        padding="md"
                        className="text-center">
                        <div className="text-lg font-bold text-red-400">
                            {formatCurrency(totalRemaining)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Remaining
                        </div>
                    </GlassCard>
                    <GlassCard
                        intensity="light"
                        padding="md"
                        className="text-center">
                        <div className="text-lg font-bold text-green-400">
                            {formatCurrency(totalPaid)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Total Paid
                        </div>
                    </GlassCard>
                </div>

                {/* Active Installments */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-blue-400" />
                        Active Installments
                    </h2>
                    {isLoading ? (
                        <div className="space-y-3">
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    ) : activeInstallments.length === 0 ? (
                        <GlassCard
                            intensity="light"
                            padding="lg"
                            className="text-center">
                            <CreditCard className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-muted-foreground">
                                No active installments
                            </p>
                            <button
                                onClick={() => {
                                    setEditingInstallment(null);
                                    setShowInstallmentModal(true);
                                }}
                                className="mt-4 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                                Add Your First Installment
                            </button>
                        </GlassCard>
                    ) : (
                        <InstallmentsTimeline
                            installments={activeInstallments}
                            formatCurrency={formatCurrency}
                            onInstallmentClick={(installment) => {
                                setViewingInstallment(installment);
                                setShowInstallmentDetailsModal(true);
                            }}
                            onPay={(installmentId) => {
                                const inst = installments.find(
                                    (i) => i.id === installmentId
                                );
                                if (inst) {
                                    setPayingInstallment(inst);
                                    setShowPaymentModal(true);
                                }
                            }}
                            onAddInstallment={() => {
                                setEditingInstallment(null);
                                setShowInstallmentModal(true);
                            }}
                        />
                    )}
                </section>

                {/* Completed Installments */}
                {completedInstallments.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-green-400" />
                            Completed ({completedInstallments.length})
                        </h2>
                        <InstallmentsTimeline
                            installments={completedInstallments}
                            formatCurrency={formatCurrency}
                            onInstallmentClick={(installment) => {
                                setViewingInstallment(installment);
                                setShowInstallmentDetailsModal(true);
                            }}
                            onPay={() => {}}
                            onAddInstallment={() => {}}
                        />
                    </section>
                )}
            </div>

            {/* Installment Modal */}
            <InstallmentModal
                isOpen={showInstallmentModal}
                onClose={() => {
                    setShowInstallmentModal(false);
                    setEditingInstallment(null);
                }}
                onSubmit={(data) => {
                    const installmentData = {
                        title: data.title,
                        totalAmount: data.totalAmount,
                        paidAmount: data.paidAmount,
                        installmentAmount: data.installmentAmount,
                        totalInstallments: data.totalInstallments,
                        paidInstallments: data.paidInstallments,
                        frequency: data.frequency,
                        linkedAccountId:
                            data.linkedAccountId || accounts[0]?.id || "",
                        startDate: data.startDate,
                        nextPaymentDate: data.nextDueDate,
                        description: data.notes,
                        categoryId: categories[0]?.id || "",
                        endDate: data.startDate,
                        status: "active" as const,
                        autoPayment: false,
                        remindDaysBefore: 3,
                        payments: [],
                    };

                    if (editingInstallment) {
                        updateInstallment(
                            editingInstallment.id,
                            installmentData
                        );
                    } else {
                        addInstallment(installmentData);
                    }
                    setShowInstallmentModal(false);
                    setEditingInstallment(null);
                }}
                accounts={accounts}
                defaultCurrency={settings.defaultCurrency}
                installment={editingInstallment}
            />

            {/* Payment Modal */}
            <PaymentModal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    setPayingInstallment(null);
                }}
                onSubmit={(data) => {
                    if (payingInstallment) {
                        addInstallmentPayment(
                            data.installmentId,
                            {
                                amount: data.amount,
                                date: data.date,
                                status: "paid",
                                notes: data.notes,
                            },
                            {
                                accountId: data.accountId,
                                paymentMethod: data.paymentMethod,
                            }
                        );
                        setShowPaymentModal(false);
                        setPayingInstallment(null);
                    }
                }}
                installment={payingInstallment}
                accounts={accounts}
                defaultCurrency={settings.defaultCurrency}
                formatCurrency={formatCurrency}
                calculateBalance={calculateAccountBalance}
            />

            {/* Installment Details Modal */}
            <InstallmentDetailsModal
                isOpen={showInstallmentDetailsModal}
                onClose={() => {
                    setShowInstallmentDetailsModal(false);
                    setViewingInstallment(null);
                }}
                installment={viewingInstallment}
                formatCurrency={formatCurrency}
                onEdit={() => {
                    if (viewingInstallment) {
                        setEditingInstallment(viewingInstallment);
                        setShowInstallmentDetailsModal(false);
                        setShowInstallmentModal(true);
                    }
                }}
                onPay={() => {
                    if (viewingInstallment) {
                        setPayingInstallment(viewingInstallment);
                        setShowInstallmentDetailsModal(false);
                        setShowPaymentModal(true);
                    }
                }}
                onRefund={() => {
                    if (viewingInstallment) {
                        setRefundingInstallment(viewingInstallment);
                        setShowInstallmentDetailsModal(false);
                        setShowInstallmentRefundModal(true);
                    }
                }}
            />

            {/* Installment Refund Modal */}
            <InstallmentRefundModal
                isOpen={showInstallmentRefundModal}
                onClose={() => {
                    setShowInstallmentRefundModal(false);
                    setRefundingInstallment(null);
                }}
                onSubmit={(data) => {
                    if (refundingInstallment) {
                        // Get account ID - use linked account or first active account
                        const accountId =
                            refundingInstallment.linkedAccountId ||
                            accounts.find((a) => a.isActive)?.id;
                        addInstallmentRefund(
                            refundingInstallment.id,
                            data.amount,
                            data.reason,
                            accountId ? { accountId } : undefined
                        );
                        setShowInstallmentRefundModal(false);
                        setRefundingInstallment(null);
                    }
                }}
                installment={refundingInstallment}
                formatCurrency={formatCurrency}
            />
        </div>
    );
}
