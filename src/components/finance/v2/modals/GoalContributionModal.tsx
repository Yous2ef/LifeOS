/**
 * GoalContributionModal V2 - Add money to a financial goal
 *
 * Features:
 * - Record contributions to goals
 * - Account selection for source
 * - Visual progress indicator
 * - Emerald theme for goals
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, TrendingUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { TextArea } from "@/components/ui/TextArea";
import type { FinancialGoal, Account, Currency } from "@/types/modules/finance";

interface GoalContributionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (contribution: ContributionFormData) => void;
    goal: FinancialGoal | null;
    accounts: Account[];
    defaultCurrency: Currency;
    formatCurrency: (amount: number) => string;
    calculateBalance: (accountId: string) => number;
}

export interface ContributionFormData {
    goalId: string;
    amount: number;
    accountId: string;
    date: string;
    notes?: string;
}

export const GoalContributionModal = ({
    isOpen,
    onClose,
    onSubmit,
    goal,
    accounts,
    defaultCurrency,
    formatCurrency,
    calculateBalance,
}: GoalContributionModalProps) => {
    const activeAccounts = accounts.filter((a) => a.isActive);

    const [formData, setFormData] = useState<ContributionFormData>({
        goalId: "",
        amount: 0,
        accountId: activeAccounts[0]?.id || "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
    });

    const [isProcessing, setIsProcessing] = useState(false);

    // Reset form when modal opens with goal data
    useEffect(() => {
        if (isOpen && goal) {
            const remaining = goal.targetAmount - goal.currentAmount;
            setFormData({
                goalId: goal.id,
                amount: Math.min(remaining, 100), // Suggest a reasonable amount
                accountId: activeAccounts[0]?.id || "",
                date: new Date().toISOString().split("T")[0],
                notes: "",
            });
            setIsProcessing(false);
        }
    }, [isOpen, goal, activeAccounts]);

    const handleSubmit = async () => {
        if (!formData.accountId || formData.amount <= 0 || !goal) {
            return;
        }

        setIsProcessing(true);

        // Simulate processing
        await new Promise((resolve) => setTimeout(resolve, 500));

        onSubmit(formData);
        setIsProcessing(false);
    };

    if (!goal) return null;

    const currentProgress = (goal.currentAmount / goal.targetAmount) * 100;
    const newAmount = goal.currentAmount + formData.amount;
    const newProgress = Math.min((newAmount / goal.targetAmount) * 100, 100);
    const remaining = goal.targetAmount - goal.currentAmount;
    const willComplete = newAmount >= goal.targetAmount;

    const selectedAccount = activeAccounts.find(
        (a) => a.id === formData.accountId
    );
    const accountBalance = selectedAccount
        ? calculateBalance(selectedAccount.id)
        : 0;
    const insufficientFunds = formData.amount > accountBalance;

    // SVG Progress Ring
    const ringSize = 100;
    const strokeWidth = 8;
    const radius = (ringSize - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const currentStrokeDashoffset =
        circumference - (currentProgress / 100) * circumference;
    const newStrokeDashoffset =
        circumference - (newProgress / 100) * circumference;

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
                        className="fixed inset-x-4 top-[10%] md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-[51]">
                        <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 overflow-hidden">
                            {/* Header */}
                            <div className="px-6 pt-6 pb-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center"
                                            style={{
                                                backgroundColor: `${
                                                    goal.color || "#10b981"
                                                }20`,
                                            }}>
                                            <span className="text-xl">
                                                {goal.icon || "🎯"}
                                            </span>
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold">
                                                Add to Goal
                                            </h2>
                                            <p className="text-xs text-muted-foreground">
                                                {goal.title}
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

                            {/* Progress Preview */}
                            <div className="px-6 pb-4">
                                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl p-4 border border-emerald-500/20">
                                    <div className="flex items-center gap-6">
                                        {/* Progress Ring */}
                                        <div className="relative flex-shrink-0">
                                            <svg
                                                width={ringSize}
                                                height={ringSize}
                                                className="transform -rotate-90">
                                                {/* Background ring */}
                                                <circle
                                                    cx={ringSize / 2}
                                                    cy={ringSize / 2}
                                                    r={radius}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth={strokeWidth}
                                                    className="text-muted/30"
                                                />
                                                {/* Current progress */}
                                                <circle
                                                    cx={ringSize / 2}
                                                    cy={ringSize / 2}
                                                    r={radius}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth={strokeWidth}
                                                    strokeLinecap="round"
                                                    strokeDasharray={
                                                        circumference
                                                    }
                                                    strokeDashoffset={
                                                        currentStrokeDashoffset
                                                    }
                                                    className="text-emerald-500/40"
                                                />
                                                {/* New progress preview */}
                                                <motion.circle
                                                    cx={ringSize / 2}
                                                    cy={ringSize / 2}
                                                    r={radius}
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth={strokeWidth}
                                                    strokeLinecap="round"
                                                    strokeDasharray={
                                                        circumference
                                                    }
                                                    initial={{
                                                        strokeDashoffset:
                                                            currentStrokeDashoffset,
                                                    }}
                                                    animate={{
                                                        strokeDashoffset:
                                                            newStrokeDashoffset,
                                                    }}
                                                    transition={{
                                                        duration: 0.5,
                                                    }}
                                                    className="text-emerald-500"
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <span className="text-lg font-bold">
                                                    {Math.round(newProgress)}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Details */}
                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Current
                                                </span>
                                                <span className="font-medium">
                                                    {formatCurrency(
                                                        goal.currentAmount
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    Adding
                                                </span>
                                                <span className="font-medium text-emerald-400">
                                                    +
                                                    {formatCurrency(
                                                        formData.amount
                                                    )}
                                                </span>
                                            </div>
                                            <div className="border-t border-white/10 pt-2 flex justify-between text-sm">
                                                <span className="text-muted-foreground">
                                                    New Total
                                                </span>
                                                <span className="font-bold text-emerald-400">
                                                    {formatCurrency(
                                                        Math.min(
                                                            newAmount,
                                                            goal.targetAmount
                                                        )
                                                    )}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-xs">
                                                <span className="text-muted-foreground">
                                                    Target
                                                </span>
                                                <span>
                                                    {formatCurrency(
                                                        goal.targetAmount
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Completion Message */}
                                    {willComplete && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-4 flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
                                            <Sparkles className="w-4 h-4" />
                                            <span>
                                                This contribution will complete
                                                your goal! 🎉
                                            </span>
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Form */}
                            <div className="px-6 pb-6 space-y-4">
                                {/* Amount */}
                                <div className="space-y-2">
                                    <Label>Contribution Amount</Label>
                                    <div className="relative">
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
                                            placeholder="0.00"
                                            className="text-lg font-semibold pl-8"
                                            min={0}
                                            step={0.01}
                                        />
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                            {defaultCurrency === "EGP"
                                                ? "£"
                                                : "$"}
                                        </span>
                                    </div>
                                    {remaining > 0 && (
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        amount: Math.min(
                                                            remaining,
                                                            50
                                                        ),
                                                    }))
                                                }
                                                className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
                                                +50
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        amount: Math.min(
                                                            remaining,
                                                            100
                                                        ),
                                                    }))
                                                }
                                                className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
                                                +100
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        amount: remaining,
                                                    }))
                                                }
                                                className="text-xs px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
                                                Complete (
                                                {formatCurrency(remaining)})
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* Account Selection */}
                                <div className="space-y-2">
                                    <Label>From Account</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {activeAccounts.map((account) => {
                                            const balance = calculateBalance(
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
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            accountId:
                                                                account.id,
                                                        }))
                                                    }
                                                    className={cn(
                                                        "p-3 rounded-xl border text-left transition-all",
                                                        isSelected
                                                            ? "border-emerald-500/50 bg-emerald-500/10"
                                                            : "border-white/10 hover:border-white/20"
                                                    )}>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span>
                                                            {account.icon}
                                                        </span>
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
                                        <p className="text-xs text-red-400">
                                            Insufficient funds in this account
                                        </p>
                                    )}
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label>Notes (optional)</Label>
                                    <TextArea
                                        value={formData.notes || ""}
                                        onChange={(e) =>
                                            setFormData((prev) => ({
                                                ...prev,
                                                notes: e.target.value,
                                            }))
                                        }
                                        placeholder="Add a note..."
                                        rows={2}
                                    />
                                </div>

                                {/* Submit Button */}
                                <Button
                                    onClick={handleSubmit}
                                    disabled={
                                        !formData.accountId ||
                                        formData.amount <= 0 ||
                                        insufficientFunds ||
                                        isProcessing
                                    }
                                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white">
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
                                            <TrendingUp className="w-4 h-4 mr-2" />
                                            Add{" "}
                                            {formatCurrency(formData.amount)} to
                                            Goal
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
