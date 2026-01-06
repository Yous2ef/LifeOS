/**
 * GoalModal V2 - Gamified goal creation
 *
 * Features:
 * - Visual progress ring preview
 * - Category and priority selection
 * - Milestone planning
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Target, Calendar, Tag, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { TextArea } from "@/components/ui/TextArea";
import type {
    GoalCategory,
    GoalPriority,
    Currency,
    FinancialGoal,
} from "@/types/modules/finance";

interface GoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (goal: GoalFormData) => void;
    defaultCurrency: Currency;
    goal?: FinancialGoal | null;
}

export interface GoalFormData {
    title: string;
    description?: string;
    targetAmount: number;
    currentAmount: number;
    currency: Currency;
    category: GoalCategory;
    priority: GoalPriority;
    deadline?: string;
    icon: string;
    color: string;
}

const GOAL_CATEGORIES: { value: GoalCategory; label: string; icon: string }[] =
    [
        { value: "savings", label: "Savings", icon: "💰" },
        { value: "emergency-fund", label: "Emergency Fund", icon: "🆘" },
        { value: "travel", label: "Travel", icon: "✈️" },
        { value: "purchase", label: "Purchase", icon: "🛍️" },
        { value: "investment", label: "Investment", icon: "📈" },
        { value: "education", label: "Education", icon: "📚" },
        { value: "other", label: "Other", icon: "🎯" },
    ];

const GOAL_PRIORITIES: { value: GoalPriority; label: string; color: string }[] =
    [
        { value: "low", label: "Low", color: "text-blue-500" },
        { value: "medium", label: "Medium", color: "text-amber-500" },
        { value: "high", label: "High", color: "text-orange-500" },
        { value: "critical", label: "Critical", color: "text-rose-500" },
    ];

const GOAL_COLORS = [
    "#10b981", // emerald
    "#3b82f6", // blue
    "#8b5cf6", // violet
    "#f59e0b", // amber
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
    "#84cc16", // lime
];

export const GoalModal = ({
    isOpen,
    onClose,
    onSubmit,
    defaultCurrency,
    goal,
}: GoalModalProps) => {
    const isEditing = !!goal;

    const [formData, setFormData] = useState<GoalFormData>({
        title: "",
        description: "",
        targetAmount: 0,
        currentAmount: 0,
        currency: defaultCurrency,
        category: "savings",
        priority: "medium",
        deadline: "",
        icon: "🎯",
        color: GOAL_COLORS[0],
    });

    const [step, setStep] = useState<"basic" | "details">("basic");

    // Reset form when modal opens or populate with existing goal data
    useEffect(() => {
        if (isOpen) {
            if (goal) {
                // Editing existing goal
                setFormData({
                    title: goal.title,
                    description: goal.description || "",
                    targetAmount: goal.targetAmount,
                    currentAmount: goal.currentAmount,
                    currency: goal.currency,
                    category: goal.category,
                    priority: goal.priority,
                    deadline: goal.deadline || "",
                    icon: goal.icon || "🎯",
                    color: goal.color || GOAL_COLORS[0],
                });
            } else {
                // New goal
                setFormData({
                    title: "",
                    description: "",
                    targetAmount: 0,
                    currentAmount: 0,
                    currency: defaultCurrency,
                    category: "savings",
                    priority: "medium",
                    deadline: "",
                    icon: "🎯",
                    color: GOAL_COLORS[0],
                });
            }
            setStep("basic");
        }
    }, [isOpen, defaultCurrency, goal]);

    const handleSubmit = () => {
        if (!formData.title || formData.targetAmount <= 0) {
            return;
        }
        onSubmit(formData);
        onClose();
    };

    const progress =
        formData.targetAmount > 0
            ? Math.min(
                  (formData.currentAmount / formData.targetAmount) * 100,
                  100
              )
            : 0;

    // SVG Progress Ring
    const ringSize = 120;
    const strokeWidth = 8;
    const radius = (ringSize - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

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
                        className="fixed inset-x-4 top-[3%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-[51]">
                        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border/50">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-10 h-10 rounded-2xl flex items-center justify-center"
                                        style={{
                                            backgroundColor: `${formData.color}20`,
                                        }}>
                                        <Target
                                            className="w-5 h-5"
                                            style={{ color: formData.color }}
                                        />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold">
                                            {isEditing
                                                ? "Edit Goal"
                                                : "New Goal"}
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            {step === "basic"
                                                ? "Set your target"
                                                : "Add details"}
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

                            {/* Content */}
                            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                                {step === "basic" ? (
                                    <>
                                        {/* Progress Ring Preview */}
                                        <div className="flex justify-center py-4">
                                            <div className="relative">
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
                                                        strokeWidth={
                                                            strokeWidth
                                                        }
                                                        className="text-muted/30"
                                                    />
                                                    {/* Progress ring */}
                                                    <motion.circle
                                                        cx={ringSize / 2}
                                                        cy={ringSize / 2}
                                                        r={radius}
                                                        fill="none"
                                                        stroke={formData.color}
                                                        strokeWidth={
                                                            strokeWidth
                                                        }
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
                                                        transition={{
                                                            duration: 0.5,
                                                            ease: "easeOut",
                                                        }}
                                                    />
                                                </svg>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                                    <span className="text-3xl">
                                                        {formData.icon}
                                                    </span>
                                                    <span className="text-sm font-bold mt-1">
                                                        {progress.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                                <Tag className="w-3 h-3" />
                                                Goal Name
                                            </Label>
                                            <Input
                                                value={formData.title}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        title: e.target.value,
                                                    }))
                                                }
                                                placeholder="e.g., Emergency Fund, New MacBook"
                                                className="rounded-xl"
                                                autoFocus
                                            />
                                        </div>

                                        {/* Target Amount */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 block">
                                                Target Amount
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                    {formData.currency}
                                                </span>
                                                <Input
                                                    type="number"
                                                    value={
                                                        formData.targetAmount ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            targetAmount:
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

                                        {/* Starting Amount */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 block">
                                                Current Progress (optional)
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                    {formData.currency}
                                                </span>
                                                <Input
                                                    type="number"
                                                    value={
                                                        formData.currentAmount ||
                                                        ""
                                                    }
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            currentAmount:
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

                                        {/* Category Selection */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 block">
                                                Category
                                            </Label>
                                            <div className="grid grid-cols-4 gap-2">
                                                {GOAL_CATEGORIES.map((cat) => (
                                                    <button
                                                        key={cat.value}
                                                        onClick={() =>
                                                            setFormData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    category:
                                                                        cat.value,
                                                                    icon: cat.icon,
                                                                })
                                                            )
                                                        }
                                                        className={cn(
                                                            "flex flex-col items-center gap-1 p-3 rounded-2xl transition-all",
                                                            formData.category ===
                                                                cat.value
                                                                ? "ring-2"
                                                                : "bg-muted/50 hover:bg-muted"
                                                        )}
                                                        style={
                                                            formData.category ===
                                                            cat.value
                                                                ? {
                                                                      backgroundColor: `${formData.color}20`,
                                                                      borderColor:
                                                                          formData.color,
                                                                  }
                                                                : {}
                                                        }>
                                                        <span className="text-xl">
                                                            {cat.icon}
                                                        </span>
                                                        <span className="text-xs truncate w-full text-center">
                                                            {cat.label}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Color Selection */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                                <Sparkles className="w-3 h-3" />
                                                Color
                                            </Label>
                                            <div className="flex gap-2">
                                                {GOAL_COLORS.map((color) => (
                                                    <button
                                                        key={color}
                                                        onClick={() =>
                                                            setFormData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    color,
                                                                })
                                                            )
                                                        }
                                                        className={cn(
                                                            "w-8 h-8 rounded-full transition-all",
                                                            formData.color ===
                                                                color &&
                                                                "ring-2 ring-offset-2 ring-offset-background"
                                                        )}
                                                        style={{
                                                            backgroundColor:
                                                                color,
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Priority */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 block">
                                                Priority
                                            </Label>
                                            <div className="flex gap-2">
                                                {GOAL_PRIORITIES.map(
                                                    (priority) => (
                                                        <button
                                                            key={priority.value}
                                                            onClick={() =>
                                                                setFormData(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        priority:
                                                                            priority.value,
                                                                    })
                                                                )
                                                            }
                                                            className={cn(
                                                                "flex-1 px-3 py-2 rounded-xl text-sm transition-all",
                                                                formData.priority ===
                                                                    priority.value
                                                                    ? "bg-muted ring-2"
                                                                    : "bg-muted/50 hover:bg-muted",
                                                                priority.color
                                                            )}
                                                            style={
                                                                formData.priority ===
                                                                priority.value
                                                                    ? {
                                                                          borderColor:
                                                                              formData.color,
                                                                      }
                                                                    : {}
                                                            }>
                                                            {priority.label}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Deadline */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                Target Date (optional)
                                            </Label>
                                            <Input
                                                type="date"
                                                value={formData.deadline || ""}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        deadline:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="rounded-xl"
                                            />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 block">
                                                Description (optional)
                                            </Label>
                                            <TextArea
                                                value={
                                                    formData.description || ""
                                                }
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        description:
                                                            e.target.value,
                                                    }))
                                                }
                                                placeholder="Why is this goal important to you?"
                                                className="rounded-xl min-h-[80px]"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-border/50 flex gap-3">
                                {step === "basic" ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={onClose}
                                            className="flex-1 rounded-xl">
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={() => setStep("details")}
                                            disabled={
                                                !formData.title ||
                                                formData.targetAmount <= 0
                                            }
                                            className="flex-1 rounded-xl"
                                            style={{
                                                backgroundColor: formData.color,
                                            }}>
                                            Continue
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => setStep("basic")}
                                            className="flex-1 rounded-xl">
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            className="flex-1 rounded-xl"
                                            style={{
                                                backgroundColor: formData.color,
                                            }}>
                                            Create Goal
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Summary */}
                            {formData.title && formData.targetAmount > 0 && (
                                <div className="px-4 pb-4">
                                    <div
                                        className="flex items-center justify-between p-3 rounded-xl text-sm"
                                        style={{
                                            backgroundColor: `${formData.color}15`,
                                        }}>
                                        <div className="flex items-center gap-2">
                                            <span>{formData.icon}</span>
                                            <span className="font-medium">
                                                {formData.title}
                                            </span>
                                        </div>
                                        <span
                                            style={{ color: formData.color }}
                                            className="font-semibold">
                                            {formData.currency}{" "}
                                            {formData.targetAmount.toLocaleString()}
                                        </span>
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
