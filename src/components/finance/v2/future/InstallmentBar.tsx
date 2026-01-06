import { motion } from "framer-motion";
import { Calendar, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import type { Installment } from "@/types/modules/finance";

interface InstallmentBarProps {
    installment: Installment;
    formatCurrency: (amount: number) => string;
    onClick?: () => void;
    onPay?: () => void;
    className?: string;
}

export const InstallmentBar = ({
    installment,
    formatCurrency,
    onClick,
    onPay,
    className,
}: InstallmentBarProps) => {
    const progress =
        (installment.paidInstallments / installment.totalInstallments) * 100;
    const isComplete = installment.status === "completed";
    const isOverdue = installment.status === "overdue";

    // Days until next payment
    const daysUntilPayment = Math.ceil(
        (new Date(installment.nextPaymentDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
    );

    const getStatusColor = () => {
        if (isComplete) return "#22c55e";
        if (isOverdue) return "#ef4444";
        if (daysUntilPayment <= 3) return "#f59e0b";
        return "#3b82f6";
    };

    const statusColor = getStatusColor();

    return (
        <motion.div
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={onClick}
            className={cn(
                "p-4 rounded-2xl",
                "bg-card/50 border border-border/50",
                "cursor-pointer transition-all duration-200",
                "hover:shadow-md hover:border-primary/30",
                isOverdue && "border-rose-500/50 bg-rose-500/5",
                className
            )}>
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm truncate">
                        {installment.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                        {formatCurrency(installment.installmentAmount)} /{" "}
                        {installment.frequency}
                    </p>
                </div>

                {/* Status Badge */}
                <div
                    className={cn(
                        "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
                        isComplete && "bg-emerald-500/10 text-emerald-500",
                        isOverdue && "bg-rose-500/10 text-rose-500",
                        !isComplete &&
                            !isOverdue &&
                            "bg-blue-500/10 text-blue-500"
                    )}>
                    {isComplete ? (
                        <>
                            <CheckCircle2 className="w-3 h-3" />
                            Done
                        </>
                    ) : isOverdue ? (
                        <>
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                        </>
                    ) : (
                        <>
                            <Calendar className="w-3 h-3" />
                            {daysUntilPayment <= 0
                                ? "Today"
                                : `${daysUntilPayment}d`}
                        </>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full relative overflow-hidden"
                        style={{
                            backgroundColor: statusColor,
                            boxShadow: `0 0 12px ${statusColor}40`,
                        }}>
                        {/* Animated shine effect */}
                        {!isComplete && (
                            <motion.div
                                animate={{ x: ["0%", "200%"] }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "linear",
                                }}
                                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                            />
                        )}
                    </motion.div>
                </div>

                {/* Progress Text */}
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                        {installment.paidInstallments} of{" "}
                        {installment.totalInstallments} paid
                    </span>
                    <span
                        className="font-medium tabular-nums"
                        style={{ color: statusColor }}>
                        {formatCurrency(installment.paidAmount)} /{" "}
                        {formatCurrency(installment.totalAmount)}
                    </span>
                </div>
            </div>

            {/* Pay Button */}
            {!isComplete && onPay && (
                <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                        e.stopPropagation();
                        onPay();
                    }}
                    className={cn(
                        "w-full mt-3 rounded-xl h-9 text-xs font-medium",
                        isOverdue
                            ? "border-rose-500/50 text-rose-500 hover:bg-rose-500/10"
                            : "border-primary/50 text-primary hover:bg-primary/10"
                    )}>
                    Pay {formatCurrency(installment.installmentAmount)}
                </Button>
            )}
        </motion.div>
    );
};
