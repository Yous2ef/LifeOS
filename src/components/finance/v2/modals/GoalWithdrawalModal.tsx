/**
 * GoalWithdrawalModal V2 - Withdraw money from a goal
 *
 * Features:
 * - Preview of goal progress after withdrawal
 * - Quick amount buttons
 * - Reason/notes field
 * - Emerald theme
 */

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, ArrowDownLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TextArea } from "@/components/ui/TextArea";
import type { FinancialGoal } from "@/types/modules/finance";

export interface WithdrawalFormData {
    amount: number;
    reason?: string;
}

interface GoalWithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: WithdrawalFormData) => void;
    goal: FinancialGoal | null;
    formatCurrency: (amount: number, currency?: string) => string;
}

export function GoalWithdrawalModal({
    isOpen,
    onClose,
    onSubmit,
    goal,
    formatCurrency,
}: GoalWithdrawalModalProps) {
    const [amount, setAmount] = useState("");
    const [reason, setReason] = useState("");

    // Reset form when goal changes
    useEffect(() => {
        if (goal) {
            setAmount("");
            setReason("");
        }
    }, [goal?.id]);

    const numericAmount = useMemo(() => {
        const parsed = parseFloat(amount);
        return isNaN(parsed) ? 0 : parsed;
    }, [amount]);

    const previewAmount = useMemo(() => {
        if (!goal) return 0;
        return Math.max(0, goal.currentAmount - numericAmount);
    }, [goal, numericAmount]);

    const previewProgress = useMemo(() => {
        if (!goal || goal.targetAmount === 0) return 0;
        return Math.min(100, (previewAmount / goal.targetAmount) * 100);
    }, [goal, previewAmount]);

    const currentProgress = useMemo(() => {
        if (!goal || goal.targetAmount === 0) return 0;
        return Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
    }, [goal]);

    const exceedsBalance = numericAmount > (goal?.currentAmount || 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (numericAmount > 0 && numericAmount <= (goal?.currentAmount || 0)) {
            onSubmit({
                amount: numericAmount,
                reason: reason.trim() || undefined,
            });
        }
    };

    const quickAmounts = useMemo(() => {
        if (!goal) return [];
        const current = goal.currentAmount;
        const amounts: { label: string; value: number }[] = [];

        if (current >= 50) amounts.push({ label: "-50", value: 50 });
        if (current >= 100) amounts.push({ label: "-100", value: 100 });
        if (current >= 500) amounts.push({ label: "-500", value: 500 });
        amounts.push({ label: "All", value: current });

        return amounts.slice(0, 4);
    }, [goal]);

    if (!goal) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}>
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="w-full max-w-md bg-card/95 backdrop-blur-xl rounded-2xl border border-amber-500/20 shadow-2xl shadow-amber-500/10 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="relative px-6 py-4 border-b border-border">
                            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10" />
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-amber-500/20">
                                        <ArrowDownLeft className="w-5 h-5 text-amber-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-foreground">
                                            Withdraw from Goal
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            {goal.title}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-muted transition-colors">
                                    <X className="w-5 h-5 text-muted-foreground" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Progress Preview */}
                            <div className="flex items-center justify-center">
                                <div className="relative">
                                    {/* Background ring */}
                                    <svg
                                        className="w-32 h-32 -rotate-90"
                                        viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="42"
                                            fill="none"
                                            className="stroke-muted"
                                            strokeWidth="8"
                                        />
                                        {/* Current progress (faded) */}
                                        <motion.circle
                                            cx="50"
                                            cy="50"
                                            r="42"
                                            fill="none"
                                            stroke="rgba(16, 185, 129, 0.3)"
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            strokeDasharray={`${
                                                currentProgress * 2.64
                                            } 264`}
                                        />
                                        {/* Preview progress */}
                                        <motion.circle
                                            cx="50"
                                            cy="50"
                                            r="42"
                                            fill="none"
                                            stroke={
                                                exceedsBalance
                                                    ? "#ef4444"
                                                    : numericAmount > 0
                                                    ? "#f59e0b"
                                                    : "#10b981"
                                            }
                                            strokeWidth="8"
                                            strokeLinecap="round"
                                            initial={false}
                                            animate={{
                                                strokeDasharray: `${
                                                    previewProgress * 2.64
                                                } 264`,
                                            }}
                                            transition={{
                                                duration: 0.3,
                                                ease: "easeOut",
                                            }}
                                        />
                                    </svg>
                                    {/* Center content */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <motion.span
                                            className={`text-2xl font-bold ${
                                                exceedsBalance
                                                    ? "text-red-500"
                                                    : "text-foreground"
                                            }`}
                                            key={previewProgress}
                                            initial={{ scale: 1.1 }}
                                            animate={{ scale: 1 }}>
                                            {Math.round(previewProgress)}%
                                        </motion.span>
                                        <span className="text-xs text-muted-foreground">
                                            after withdrawal
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Current Balance */}
                            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-emerald-500" />
                                    <span className="text-sm text-muted-foreground">
                                        Current Balance
                                    </span>
                                </div>
                                <span className="text-sm font-medium text-emerald-500">
                                    {formatCurrency(
                                        goal.currentAmount,
                                        goal.currency
                                    )}
                                </span>
                            </div>

                            {/* Amount Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Withdrawal Amount
                                </label>
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    min="0"
                                    max={goal.currentAmount}
                                    step="0.01"
                                    className="text-lg"
                                    autoFocus
                                />

                                {/* Quick amounts */}
                                <div className="flex gap-2">
                                    {quickAmounts.map((qa) => (
                                        <button
                                            key={qa.label}
                                            type="button"
                                            onClick={() =>
                                                setAmount(qa.value.toString())
                                            }
                                            className="flex-1 px-3 py-2 text-sm font-medium rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30 transition-colors">
                                            {qa.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Exceeds Balance Warning */}
                            {exceedsBalance && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-2 p-3 rounded-xl bg-red-500/20 border border-red-500/30">
                                    <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                                    <span className="text-sm text-red-600 dark:text-red-300">
                                        Amount exceeds current balance
                                    </span>
                                </motion.div>
                            )}

                            {/* Reason */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Reason (Optional)
                                </label>
                                <TextArea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="Why are you withdrawing?"
                                    rows={2}
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={onClose}
                                    className="flex-1">
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        numericAmount <= 0 || exceedsBalance
                                    }
                                    className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                                    Withdraw{" "}
                                    {numericAmount > 0 &&
                                        formatCurrency(
                                            numericAmount,
                                            goal.currency
                                        )}
                                </Button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
