import { motion } from "framer-motion";
import { Plus, CreditCard, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { InstallmentBar } from "./InstallmentBar";
import { GlassCard } from "../layout/GlassCard";
import type { Installment } from "@/types/modules/finance";

interface InstallmentsTimelineProps {
    installments: Installment[];
    formatCurrency: (amount: number) => string;
    onInstallmentClick?: (installment: Installment) => void;
    onPay?: (installmentId: string) => void;
    onAddInstallment?: () => void;
    className?: string;
    /** Maximum number of installments to display. When exceeded, shows "See All" instead of "Add" */
    maxInstallments?: number;
}

export const InstallmentsTimeline = ({
    installments,
    formatCurrency,
    onInstallmentClick,
    onPay,
    onAddInstallment,
    className,
    maxInstallments,
}: InstallmentsTimelineProps) => {
    // Sort: overdue first, then by next payment date
    const activeInstallments = installments
        .filter((i) => i.status !== "completed")
        .sort((a, b) => {
            if (a.status === "overdue" && b.status !== "overdue") return -1;
            if (b.status === "overdue" && a.status !== "overdue") return 1;
            return (
                new Date(a.nextPaymentDate).getTime() -
                new Date(b.nextPaymentDate).getTime()
            );
        });

    const completedInstallments = installments.filter(
        (i) => i.status === "completed"
    );

    // Limit displayed installments if maxInstallments is set
    const displayedInstallments = maxInstallments
        ? activeInstallments.slice(0, maxInstallments)
        : activeInstallments;
    const hasMoreInstallments =
        maxInstallments && activeInstallments.length > maxInstallments;

    // Calculate total debt
    const totalDebt = activeInstallments.reduce(
        (sum, i) => sum + (i.totalAmount - i.paidAmount),
        0
    );

    if (installments.length === 0) {
        return (
            <GlassCard
                intensity="light"
                padding="lg"
                className={cn("text-center", className)}>
                <div className="py-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                        <CreditCard className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                        No Installments
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Track your payment plans here
                    </p>
                    {onAddInstallment && (
                        <Button
                            onClick={onAddInstallment}
                            className="rounded-full gap-2">
                            <Plus className="w-4 h-4" />
                            Add Installment
                        </Button>
                    )}
                </div>
            </GlassCard>
        );
    }

    return (
        <div className={cn("space-y-4", className)}>
            {/* Compact Header - single line with all key info */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold">Installments</h3>
                    <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
                        {activeInstallments.length} active
                    </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    {totalDebt > 0 && (
                        <>
                            <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground text-xs">
                                    Remaining:
                                </span>
                                <span className="font-semibold text-rose-500 tabular-nums">
                                    {formatCurrency(totalDebt)}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="text-muted-foreground text-xs">
                                    Monthly:
                                </span>
                                <span className="font-semibold tabular-nums">
                                    {formatCurrency(
                                        activeInstallments.reduce(
                                            (sum, i) =>
                                                sum + i.installmentAmount,
                                            0
                                        )
                                    )}
                                </span>
                            </div>
                        </>
                    )}
                    {/* Show Add button only if no maxInstallments limit or we have room for more */}
                    {onAddInstallment && !hasMoreInstallments && (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onAddInstallment}
                            className="rounded-full gap-1 h-7 px-2">
                            <Plus className="w-4 h-4" />
                            Add
                        </Button>
                    )}
                </div>
            </div>

            {/* Active Installments */}
            <div className="space-y-3">
                {displayedInstallments.map((installment, index) => (
                    <motion.div
                        key={installment.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}>
                        <InstallmentBar
                            installment={installment}
                            formatCurrency={formatCurrency}
                            onClick={() => onInstallmentClick?.(installment)}
                            onPay={() => onPay?.(installment.id)}
                        />
                    </motion.div>
                ))}

                {/* See All Card - when there are more installments than maxInstallments */}
                {hasMoreInstallments && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: displayedInstallments.length * 0.05,
                        }}>
                        <Link
                            to="/finance/installments"
                            className={cn(
                                "flex items-center justify-between p-4 rounded-2xl",
                                "border-2 border-dashed border-violet-500/30",
                                "text-violet-500",
                                "hover:border-violet-500/50 hover:bg-violet-500/5",
                                "transition-all duration-200"
                            )}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                                    <ChevronRight className="w-5 h-5" />
                                </div>
                                <div>
                                    <span className="font-medium">
                                        See All Installments
                                    </span>
                                    <p className="text-xs text-violet-500/70">
                                        {activeInstallments.length} active
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                )}
            </div>

            {/* Completed Installments - only show when not limited */}
            {completedInstallments.length > 0 && !maxInstallments && (
                <div className="pt-2">
                    <details className="group">
                        <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors list-none flex items-center gap-2">
                            <span>
                                ✅ {completedInstallments.length} completed
                                installment
                                {completedInstallments.length !== 1 ? "s" : ""}
                            </span>
                            <span className="text-xs group-open:rotate-90 transition-transform">
                                ▶
                            </span>
                        </summary>
                        <div className="mt-3 space-y-3 opacity-60">
                            {completedInstallments.map((installment) => (
                                <InstallmentBar
                                    key={installment.id}
                                    installment={installment}
                                    formatCurrency={formatCurrency}
                                    onClick={() =>
                                        onInstallmentClick?.(installment)
                                    }
                                />
                            ))}
                        </div>
                    </details>
                </div>
            )}
        </div>
    );
};
