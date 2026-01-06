/**
 * GoalDetailsModal V2 - View goal details and contribution history
 *
 * Features:
 * - Goal progress visualization
 * - Contribution history timeline
 * - Edit and contribute actions
 * - Emerald theme
 */

import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Target,
    TrendingUp,
    Edit2,
    Plus,
    Calendar,
    Minus,
    ArrowDownLeft,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { FinancialGoal } from "@/types/modules/finance";

interface GoalDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    goal: FinancialGoal | null;
    formatCurrency: (amount: number) => string;
    onEdit?: () => void;
    onContribute?: () => void;
    onWithdraw?: () => void;
}

export const GoalDetailsModal = ({
    isOpen,
    onClose,
    goal,
    formatCurrency,
    onEdit,
    onContribute,
    onWithdraw,
}: GoalDetailsModalProps) => {
    if (!goal) return null;

    const progress = Math.min(
        (goal.currentAmount / goal.targetAmount) * 100,
        100
    );
    const remaining = goal.targetAmount - goal.currentAmount;
    const isComplete = progress >= 100;

    // Sort contributions by date (newest first)
    const sortedContributions = [...(goal.contributions || [])].sort(
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

    // SVG Progress Ring
    const ringSize = 140;
    const strokeWidth = 10;
    const radius = (ringSize - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    const color = goal.color || "#10b981";

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
                        <div className="bg-card/95 backdrop-blur-xl rounded-2xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/10 overflow-hidden flex flex-col max-h-full">
                            {/* Header */}
                            <div className="px-6 pt-6 pb-4 flex-shrink-0">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                            style={{
                                                backgroundColor: `${color}20`,
                                            }}>
                                            {goal.icon || "🎯"}
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-semibold">
                                                {goal.title}
                                            </h2>
                                            <p className="text-xs text-muted-foreground capitalize">
                                                {goal.category.replace(
                                                    "-",
                                                    " "
                                                )}{" "}
                                                • {goal.priority} priority
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
                                                    strokeDasharray={
                                                        circumference
                                                    }
                                                    initial={{
                                                        strokeDashoffset:
                                                            circumference,
                                                    }}
                                                    animate={{
                                                        strokeDashoffset,
                                                    }}
                                                    transition={{ duration: 1 }}
                                                    style={{
                                                        filter: `drop-shadow(0 0 10px ${color}60)`,
                                                    }}
                                                />
                                            </svg>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                <span className="text-3xl">
                                                    {goal.icon || "🎯"}
                                                </span>
                                                <span
                                                    className="text-xl font-bold tabular-nums"
                                                    style={{ color }}>
                                                    {progress.toFixed(0)}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Progress Details */}
                                        <div className="flex-1 space-y-3">
                                            <div>
                                                <div className="text-sm text-muted-foreground">
                                                    Current
                                                </div>
                                                <div
                                                    className="text-xl font-bold"
                                                    style={{ color }}>
                                                    {formatCurrency(
                                                        goal.currentAmount
                                                    )}
                                                </div>
                                            </div>
                                            <div className="border-t border-white/10 pt-2">
                                                <div className="text-sm text-muted-foreground">
                                                    Target
                                                </div>
                                                <div className="text-lg font-semibold">
                                                    {formatCurrency(
                                                        goal.targetAmount
                                                    )}
                                                </div>
                                            </div>
                                            {!isComplete && (
                                                <div className="text-xs text-muted-foreground">
                                                    {formatCurrency(remaining)}{" "}
                                                    remaining
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Deadline */}
                                    {goal.deadline && (
                                        <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2 text-sm">
                                            <Calendar className="w-4 h-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">
                                                Deadline:
                                            </span>
                                            <span>
                                                {formatDate(goal.deadline)}
                                            </span>
                                            {!isComplete &&
                                                new Date(goal.deadline) >
                                                    new Date() && (
                                                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                                                        {Math.ceil(
                                                            (new Date(
                                                                goal.deadline
                                                            ).getTime() -
                                                                Date.now()) /
                                                                (1000 *
                                                                    60 *
                                                                    60 *
                                                                    24)
                                                        )}{" "}
                                                        days left
                                                    </span>
                                                )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Contribution History */}
                            <div className="px-6 pb-4 flex-1 overflow-hidden flex flex-col min-h-0">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <TrendingUp
                                            className="w-4 h-4"
                                            style={{ color }}
                                        />
                                        Contribution History
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                        {sortedContributions.length}{" "}
                                        contribution
                                        {sortedContributions.length !== 1
                                            ? "s"
                                            : ""}
                                    </span>
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin">
                                    {sortedContributions.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">
                                                No transactions yet
                                            </p>
                                            <p className="text-xs mt-1">
                                                Start adding money to reach your
                                                goal!
                                            </p>
                                        </div>
                                    ) : (
                                        sortedContributions.map(
                                            (contribution, index) => {
                                                const isWithdrawal =
                                                    contribution.amount < 0;
                                                const displayAmount = Math.abs(
                                                    contribution.amount
                                                );
                                                return (
                                                    <motion.div
                                                        key={contribution.id}
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
                                                        className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                                                        <div
                                                            className="w-10 h-10 rounded-full flex items-center justify-center"
                                                            style={{
                                                                backgroundColor:
                                                                    isWithdrawal
                                                                        ? "rgba(239, 68, 68, 0.2)"
                                                                        : `${color}20`,
                                                            }}>
                                                            {isWithdrawal ? (
                                                                <Minus className="w-4 h-4 text-red-400" />
                                                            ) : (
                                                                <Plus
                                                                    className="w-4 h-4"
                                                                    style={{
                                                                        color,
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="flex items-center justify-between">
                                                                <span
                                                                    className={`font-medium ${
                                                                        isWithdrawal
                                                                            ? "text-red-400"
                                                                            : ""
                                                                    }`}
                                                                    style={
                                                                        isWithdrawal
                                                                            ? {}
                                                                            : {
                                                                                  color,
                                                                              }
                                                                    }>
                                                                    {isWithdrawal
                                                                        ? "-"
                                                                        : "+"}
                                                                    {formatCurrency(
                                                                        displayAmount
                                                                    )}
                                                                </span>
                                                                <span className="text-xs text-muted-foreground">
                                                                    {formatDate(
                                                                        contribution.date
                                                                    )}
                                                                </span>
                                                            </div>
                                                            {contribution.notes && (
                                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                                    {
                                                                        contribution.notes
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                );
                                            }
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="px-6 pb-6 pt-2 flex-shrink-0 border-t border-white/10 space-y-2">
                                <div className="flex gap-3">
                                    {onContribute && !isComplete && (
                                        <Button
                                            onClick={() => {
                                                onClose();
                                                onContribute();
                                            }}
                                            className="flex-1 gap-2"
                                            style={{
                                                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                                            }}>
                                            <Plus className="w-4 h-4" />
                                            Add Money
                                        </Button>
                                    )}
                                    {onWithdraw && goal.currentAmount > 0 && (
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                onClose();
                                                onWithdraw();
                                            }}
                                            className="flex-1 gap-2 border-amber-500/30 text-amber-400 hover:bg-amber-500/10">
                                            <ArrowDownLeft className="w-4 h-4" />
                                            Withdraw
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
                                        Edit Goal
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
