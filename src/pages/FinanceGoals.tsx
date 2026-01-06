/**
 * Finance Goals Page - Full goals management
 */

import { useState } from "react";
import { useFinance } from "@/hooks/useFinance";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Target } from "lucide-react";
import { Link } from "react-router-dom";

import { GlassCard } from "@/components/finance/v2/layout/GlassCard";
import { GoalsGrid } from "@/components/finance/v2/future/GoalsGrid";
import { GoalModal } from "@/components/finance/v2/modals/GoalModal";
import { GoalContributionModal } from "@/components/finance/v2/modals/GoalContributionModal";
import { GoalDetailsModal } from "@/components/finance/v2/modals/GoalDetailsModal";
import { GoalWithdrawalModal } from "@/components/finance/v2/modals/GoalWithdrawalModal";
import { SkeletonCard } from "@/components/finance/v2/effects/SkeletonCard";

import type { FinancialGoal } from "@/types/modules/finance";

export default function FinanceGoals() {
    const {
        accounts,
        goals,
        settings,
        formatCurrency,
        addGoal,
        updateGoal,
        addGoalContribution,
        calculateAccountBalance,
    } = useFinance();

    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showContributionModal, setShowContributionModal] = useState(false);
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    const [showGoalDetailsModal, setShowGoalDetailsModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
    const [contributingGoal, setContributingGoal] =
        useState<FinancialGoal | null>(null);
    const [withdrawingGoal, setWithdrawingGoal] =
        useState<FinancialGoal | null>(null);
    const [viewingGoal, setViewingGoal] = useState<FinancialGoal | null>(null);
    const [isLoading] = useState(false);

    // Separate active and completed goals
    const activeGoals = goals.filter((g) => g.currentAmount < g.targetAmount);
    const completedGoals = goals.filter(
        (g) => g.currentAmount >= g.targetAmount
    );

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
                            <h1 className="text-xl font-bold">
                                Financial Goals
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Track your savings progress
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingGoal(null);
                                setShowGoalModal(true);
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
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <GlassCard
                        intensity="light"
                        padding="md"
                        className="text-center">
                        <div className="text-2xl font-bold text-emerald-400">
                            {goals.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Total Goals
                        </div>
                    </GlassCard>
                    <GlassCard
                        intensity="light"
                        padding="md"
                        className="text-center">
                        <div className="text-2xl font-bold text-blue-400">
                            {activeGoals.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            In Progress
                        </div>
                    </GlassCard>
                    <GlassCard
                        intensity="light"
                        padding="md"
                        className="text-center col-span-2 sm:col-span-1">
                        <div className="text-2xl font-bold text-amber-400">
                            {completedGoals.length}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            Completed
                        </div>
                    </GlassCard>
                </div>

                {/* Active Goals */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Target className="w-5 h-5 text-blue-400" />
                        Active Goals
                    </h2>
                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <SkeletonCard variant="goal" />
                            <SkeletonCard variant="goal" />
                            <SkeletonCard variant="goal" />
                        </div>
                    ) : activeGoals.length === 0 ? (
                        <GlassCard
                            intensity="light"
                            padding="lg"
                            className="text-center">
                            <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50" />
                            <p className="text-muted-foreground">
                                No active goals yet
                            </p>
                            <button
                                onClick={() => {
                                    setEditingGoal(null);
                                    setShowGoalModal(true);
                                }}
                                className="mt-4 px-4 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">
                                Create Your First Goal
                            </button>
                        </GlassCard>
                    ) : (
                        <GoalsGrid
                            goals={activeGoals}
                            formatCurrency={formatCurrency}
                            onGoalClick={(goal) => {
                                setViewingGoal(goal);
                                setShowGoalDetailsModal(true);
                            }}
                            onContribute={(goalId) => {
                                const goal = goals.find((g) => g.id === goalId);
                                if (goal) {
                                    setContributingGoal(goal);
                                    setShowContributionModal(true);
                                }
                            }}
                            onAddGoal={() => {
                                setEditingGoal(null);
                                setShowGoalModal(true);
                            }}
                        />
                    )}
                </section>

                {/* Completed Goals */}
                {completedGoals.length > 0 && (
                    <section className="space-y-4">
                        <h2 className="text-lg font-semibold flex items-center gap-2">
                            <span className="text-xl">🏆</span>
                            Completed Goals
                        </h2>
                        <GoalsGrid
                            goals={completedGoals}
                            formatCurrency={formatCurrency}
                            onGoalClick={(goal) => {
                                setViewingGoal(goal);
                                setShowGoalDetailsModal(true);
                            }}
                            onContribute={() => {}}
                            onAddGoal={() => {}}
                        />
                    </section>
                )}
            </div>

            {/* Goal Modal */}
            <GoalModal
                key={editingGoal?.id || "new-goal"}
                isOpen={showGoalModal}
                onClose={() => {
                    setShowGoalModal(false);
                    setEditingGoal(null);
                }}
                onSubmit={(data) => {
                    const goalData = {
                        title: data.title,
                        targetAmount: data.targetAmount,
                        currentAmount: data.currentAmount,
                        currency: data.currency,
                        category: data.category,
                        priority: data.priority,
                        deadline: data.deadline,
                        color: data.color,
                        icon: data.icon,
                        monthlyContribution: 0,
                        autoAllocate: false,
                        status: "active" as const,
                        milestones: [],
                        contributions: [],
                    };

                    if (editingGoal) {
                        updateGoal(editingGoal.id, goalData);
                    } else {
                        addGoal(goalData);
                    }
                    setShowGoalModal(false);
                    setEditingGoal(null);
                }}
                defaultCurrency={settings.defaultCurrency}
                goal={editingGoal}
            />

            {/* Goal Contribution Modal */}
            <GoalContributionModal
                isOpen={showContributionModal}
                onClose={() => {
                    setShowContributionModal(false);
                    setContributingGoal(null);
                }}
                onSubmit={(data) => {
                    if (contributingGoal) {
                        addGoalContribution(
                            contributingGoal.id,
                            data.amount,
                            data.notes
                        );
                        setShowContributionModal(false);
                        setContributingGoal(null);
                    }
                }}
                goal={contributingGoal}
                accounts={accounts}
                defaultCurrency={settings.defaultCurrency}
                formatCurrency={formatCurrency}
                calculateBalance={calculateAccountBalance}
            />

            {/* Goal Details Modal */}
            <GoalDetailsModal
                isOpen={showGoalDetailsModal}
                onClose={() => {
                    setShowGoalDetailsModal(false);
                    setViewingGoal(null);
                }}
                goal={viewingGoal}
                formatCurrency={formatCurrency}
                onEdit={() => {
                    if (viewingGoal) {
                        setEditingGoal(viewingGoal);
                        setShowGoalDetailsModal(false);
                        setShowGoalModal(true);
                    }
                }}
                onContribute={() => {
                    if (viewingGoal) {
                        setContributingGoal(viewingGoal);
                        setShowGoalDetailsModal(false);
                        setShowContributionModal(true);
                    }
                }}
                onWithdraw={() => {
                    if (viewingGoal) {
                        setWithdrawingGoal(viewingGoal);
                        setShowGoalDetailsModal(false);
                        setShowWithdrawalModal(true);
                    }
                }}
            />

            {/* Goal Withdrawal Modal */}
            <GoalWithdrawalModal
                isOpen={showWithdrawalModal}
                onClose={() => {
                    setShowWithdrawalModal(false);
                    setWithdrawingGoal(null);
                }}
                onSubmit={(data) => {
                    if (withdrawingGoal) {
                        addGoalContribution(
                            withdrawingGoal.id,
                            -data.amount,
                            data.reason
                        );
                        setShowWithdrawalModal(false);
                        setWithdrawingGoal(null);
                    }
                }}
                goal={withdrawingGoal}
                formatCurrency={formatCurrency}
            />
        </div>
    );
}
