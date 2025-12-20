import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { TextArea } from "@/components/ui/TextArea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";
import {
    Target,
    Calendar,
    TrendingUp,
    Trophy,
    Plus,
    X,
    Sparkles,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import type { FinancialGoal, GoalMilestone } from "@/types/modules/finance";

interface GoalModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (goal: Omit<FinancialGoal, "id" | "createdAt">) => void;
    goal?: FinancialGoal | null;
}

const GOAL_CATEGORIES = [
    {
        value: "emergency-fund",
        label: "صندوق الطوارئ",
        icon: "🏥",
        color: "#ef4444",
    },
    { value: "savings", label: "ادخار عام", icon: "💰", color: "#22c55e" },
    { value: "investment", label: "استثمار", icon: "📈", color: "#3b82f6" },
    { value: "purchase", label: "شراء شيء", icon: "🛍️", color: "#f97316" },
    { value: "travel", label: "سفر", icon: "✈️", color: "#8b5cf6" },
    { value: "education", label: "تعليم", icon: "📚", color: "#14b8a6" },
    { value: "other", label: "أخرى", icon: "🎯", color: "#64748b" },
];

const PRIORITY_OPTIONS = [
    { value: "low", label: "منخفضة", color: "bg-gray-500" },
    { value: "medium", label: "متوسطة", color: "bg-yellow-500" },
    { value: "high", label: "عالية", color: "bg-orange-500" },
    { value: "critical", label: "حرجة", color: "bg-red-500" },
];

export function GoalModal({ isOpen, onClose, onSave, goal }: GoalModalProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [targetAmount, setTargetAmount] = useState("");
    const [currentAmount, setCurrentAmount] = useState("0");
    const [category, setCategory] =
        useState<FinancialGoal["category"]>("savings");
    const [priority, setPriority] =
        useState<FinancialGoal["priority"]>("medium");
    const [deadline, setDeadline] = useState("");
    const [monthlyContribution, setMonthlyContribution] = useState("");
    const [autoAllocate, setAutoAllocate] = useState(false);
    const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
    const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
    const [newMilestoneAmount, setNewMilestoneAmount] = useState("");
    const [showMilestones, setShowMilestones] = useState(false);

    const target = parseFloat(targetAmount) || 0;
    const current = parseFloat(currentAmount) || 0;
    const monthly = parseFloat(monthlyContribution) || 0;
    const progress = target > 0 ? (current / target) * 100 : 0;

    useEffect(() => {
        if (goal) {
            setTitle(goal.title);
            setDescription(goal.description || "");
            setTargetAmount(goal.targetAmount.toString());
            setCurrentAmount(goal.currentAmount.toString());
            setCategory(goal.category);
            setPriority(goal.priority);
            setDeadline(goal.deadline?.split("T")[0] || "");
            setMonthlyContribution(goal.monthlyContribution.toString());
            setAutoAllocate(goal.autoAllocate);
            setMilestones(goal.milestones || []);
            setShowMilestones((goal.milestones || []).length > 0);
        } else {
            resetForm();
        }
    }, [goal, isOpen]);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setTargetAmount("");
        setCurrentAmount("0");
        setCategory("savings");
        setPriority("medium");
        setDeadline("");
        setMonthlyContribution("");
        setAutoAllocate(false);
        setMilestones([]);
        setNewMilestoneTitle("");
        setNewMilestoneAmount("");
        setShowMilestones(false);
    };

    // Auto-calculate monthly contribution based on deadline
    useEffect(() => {
        if (target > 0 && deadline && !monthlyContribution) {
            const deadlineDate = new Date(deadline);
            const now = new Date();
            const monthsRemaining = Math.max(
                1,
                (deadlineDate.getFullYear() - now.getFullYear()) * 12 +
                    (deadlineDate.getMonth() - now.getMonth())
            );
            const remaining = target - current;
            if (remaining > 0) {
                setMonthlyContribution(
                    (remaining / monthsRemaining).toFixed(0)
                );
            }
        }
    }, [targetAmount, deadline, currentAmount]);

    const addMilestone = () => {
        if (!newMilestoneTitle || !newMilestoneAmount) return;

        const amount = parseFloat(newMilestoneAmount);
        if (isNaN(amount) || amount <= 0) return;

        const newMilestone: GoalMilestone = {
            id: `milestone-${Date.now()}`,
            title: newMilestoneTitle,
            targetAmount: amount,
            reached: current >= amount,
            reachedAt: current >= amount ? new Date().toISOString() : undefined,
        };

        setMilestones(
            [...milestones, newMilestone].sort(
                (a, b) => a.targetAmount - b.targetAmount
            )
        );
        setNewMilestoneTitle("");
        setNewMilestoneAmount("");
    };

    const removeMilestone = (id: string) => {
        setMilestones(milestones.filter((m) => m.id !== id));
    };

    // Generate automatic milestones at 25%, 50%, 75%
    const generateAutoMilestones = () => {
        if (target <= 0) return;

        const autoMilestones: GoalMilestone[] = [
            {
                id: `milestone-auto-25-${Date.now()}`,
                title: "ربع الطريق 🌱",
                targetAmount: Math.round(target * 0.25),
                reached: current >= target * 0.25,
                reachedAt:
                    current >= target * 0.25
                        ? new Date().toISOString()
                        : undefined,
            },
            {
                id: `milestone-auto-50-${Date.now()}`,
                title: "نصف الطريق 🔥",
                targetAmount: Math.round(target * 0.5),
                reached: current >= target * 0.5,
                reachedAt:
                    current >= target * 0.5
                        ? new Date().toISOString()
                        : undefined,
            },
            {
                id: `milestone-auto-75-${Date.now()}`,
                title: "قربت تخلص 🚀",
                targetAmount: Math.round(target * 0.75),
                reached: current >= target * 0.75,
                reachedAt:
                    current >= target * 0.75
                        ? new Date().toISOString()
                        : undefined,
            },
        ];

        setMilestones(autoMilestones);
        setShowMilestones(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!title || !targetAmount) return;

        // Update milestones reached status
        const updatedMilestones = milestones.map((m) => ({
            ...m,
            reached: current >= m.targetAmount,
            reachedAt:
                current >= m.targetAmount && !m.reachedAt
                    ? new Date().toISOString()
                    : m.reachedAt,
        }));

        onSave({
            title,
            description: description || undefined,
            targetAmount: target,
            currentAmount: current,
            currency: "EGP",
            priority,
            category,
            deadline: deadline ? new Date(deadline).toISOString() : undefined,
            monthlyContribution: monthly,
            autoAllocate,
            milestones: updatedMilestones,
            contributions: goal?.contributions || [],
            status: progress >= 100 ? "completed" : "active",
            updatedAt: new Date().toISOString(),
        });

        onClose();
    };

    const categoryInfo = GOAL_CATEGORIES.find((c) => c.value === category);
    const priorityInfo = PRIORITY_OPTIONS.find((p) => p.value === priority);

    // Calculate time remaining
    const getTimeRemaining = () => {
        if (!deadline) return null;
        const deadlineDate = new Date(deadline);
        const now = new Date();
        const days = Math.ceil(
            (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (days < 0) return "انتهى الموعد";
        if (days === 0) return "اليوم!";
        if (days === 1) return "غداً";
        if (days < 30) return `${days} يوم`;
        if (days < 365) return `${Math.ceil(days / 30)} شهر`;
        return `${(days / 365).toFixed(1)} سنة`;
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        {goal ? "تعديل الهدف" : "إضافة هدف مالي جديد"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">اسم الهدف</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="مثال: شراء لاب توب جديد"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">الوصف</Label>
                        <TextArea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="وصف مختصر للهدف..."
                            rows={2}
                        />
                    </div>

                    {/* Category & Priority */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label>الفئة</Label>
                            <Select
                                value={category}
                                onValueChange={(v) =>
                                    setCategory(v as typeof category)
                                }>
                                <SelectTrigger>
                                    <SelectValue>
                                        {categoryInfo?.icon}{" "}
                                        {categoryInfo?.label}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {GOAL_CATEGORIES.map((cat) => (
                                        <SelectItem
                                            key={cat.value}
                                            value={cat.value}>
                                            {cat.icon} {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>الأولوية</Label>
                            <Select
                                value={priority}
                                onValueChange={(v) =>
                                    setPriority(v as typeof priority)
                                }>
                                <SelectTrigger>
                                    <SelectValue>
                                        <span className="flex items-center gap-2">
                                            <span
                                                className={`h-2 w-2 rounded-full ${priorityInfo?.color}`}
                                            />
                                            {priorityInfo?.label}
                                        </span>
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    {PRIORITY_OPTIONS.map((p) => (
                                        <SelectItem
                                            key={p.value}
                                            value={p.value}>
                                            <span className="flex items-center gap-2">
                                                <span
                                                    className={`h-2 w-2 rounded-full ${p.color}`}
                                                />
                                                {p.label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Amounts */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="targetAmount">
                                المبلغ المستهدف
                            </Label>
                            <Input
                                id="targetAmount"
                                type="number"
                                min="0"
                                step="1"
                                value={targetAmount}
                                onChange={(e) =>
                                    setTargetAmount(e.target.value)
                                }
                                placeholder="10000"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="currentAmount">المبلغ الحالي</Label>
                            <Input
                                id="currentAmount"
                                type="number"
                                min="0"
                                step="1"
                                value={currentAmount}
                                onChange={(e) =>
                                    setCurrentAmount(e.target.value)
                                }
                                placeholder="0"
                            />
                        </div>
                    </div>

                    {/* Progress Card */}
                    {target > 0 && (
                        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">
                                    التقدم
                                </span>
                                <span className="font-medium">
                                    {progress.toFixed(1)}%
                                </span>
                            </div>
                            <div className="h-3 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full transition-all"
                                    style={{
                                        width: `${Math.min(100, progress)}%`,
                                        backgroundColor:
                                            categoryInfo?.color || "#22c55e",
                                    }}
                                />
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>
                                    {current.toLocaleString("ar-EG")} ج.م
                                </span>
                                <span>
                                    {target.toLocaleString("ar-EG")} ج.م
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Deadline & Monthly */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label
                                htmlFor="deadline"
                                className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                الموعد النهائي
                            </Label>
                            <Input
                                id="deadline"
                                type="date"
                                value={deadline}
                                onChange={(e) => setDeadline(e.target.value)}
                            />
                            {deadline && (
                                <p className="text-xs text-muted-foreground">
                                    المتبقي: {getTimeRemaining()}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label
                                htmlFor="monthlyContribution"
                                className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                المساهمة الشهرية
                            </Label>
                            <Input
                                id="monthlyContribution"
                                type="number"
                                min="0"
                                step="1"
                                value={monthlyContribution}
                                onChange={(e) =>
                                    setMonthlyContribution(e.target.value)
                                }
                                placeholder="500"
                            />
                        </div>
                    </div>

                    {/* Auto Allocate Toggle */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    تخصيص تلقائي
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    خصم المساهمة تلقائياً من الدخل
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant={autoAllocate ? "default" : "outline"}
                                size="sm"
                                onClick={() => setAutoAllocate(!autoAllocate)}>
                                {autoAllocate ? "مفعّل" : "معطّل"}
                            </Button>
                        </div>
                        {autoAllocate && monthly > 0 && (
                            <p className="text-xs text-primary bg-primary/10 p-2 rounded-lg">
                                ✨ سيتم تخصيص {monthly.toLocaleString()} ج.م
                                تلقائياً كل شهر لهذا الهدف
                            </p>
                        )}
                    </div>

                    {/* Milestones - Collapsible */}
                    {target > 0 && (
                        <div className="space-y-3 border rounded-lg p-3">
                            <button
                                type="button"
                                className="flex items-center justify-between w-full text-sm"
                                onClick={() =>
                                    setShowMilestones(!showMilestones)
                                }>
                                <Label className="flex items-center gap-2 cursor-pointer">
                                    <Trophy className="h-4 w-4 text-yellow-500" />
                                    المراحل (اختياري)
                                    {milestones.length > 0 && (
                                        <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                                            {milestones.length}
                                        </span>
                                    )}
                                </Label>
                                {showMilestones ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                )}
                            </button>

                            {!showMilestones && milestones.length === 0 && (
                                <p className="text-xs text-muted-foreground">
                                    نقاط إنجاز وسيطة تحفزك على الوصول لهدفك
                                </p>
                            )}

                            {showMilestones && (
                                <div className="space-y-3 pt-2">
                                    {/* Auto Generate Button */}
                                    {milestones.length === 0 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="w-full"
                                            onClick={generateAutoMilestones}>
                                            <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
                                            اقتراح مراحل تلقائية (25%، 50%، 75%)
                                        </Button>
                                    )}

                                    {/* Existing Milestones */}
                                    {milestones.length > 0 && (
                                        <div className="space-y-2">
                                            {milestones.map((m) => (
                                                <div
                                                    key={m.id}
                                                    className={`flex items-center justify-between rounded-lg border p-2 text-sm ${
                                                        m.reached
                                                            ? "bg-green-50 border-green-200 dark:bg-green-900/20"
                                                            : ""
                                                    }`}>
                                                    <div className="flex items-center gap-2">
                                                        {m.reached ? (
                                                            <span className="text-green-600">
                                                                ✓
                                                            </span>
                                                        ) : (
                                                            <span className="text-muted-foreground">
                                                                ○
                                                            </span>
                                                        )}
                                                        <span>{m.title}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-xs">
                                                            {m.targetAmount.toLocaleString(
                                                                "ar-EG"
                                                            )}{" "}
                                                            ج.م
                                                        </span>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 w-6 p-0"
                                                            onClick={() =>
                                                                removeMilestone(
                                                                    m.id
                                                                )
                                                            }>
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {/* Clear all button */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="w-full text-muted-foreground text-xs"
                                                onClick={() =>
                                                    setMilestones([])
                                                }>
                                                مسح الكل
                                            </Button>
                                        </div>
                                    )}

                                    {/* Add Custom Milestone */}
                                    <div className="space-y-2">
                                        <p className="text-xs text-muted-foreground">
                                            أو أضف مرحلة مخصصة:
                                        </p>
                                        <div className="flex gap-2">
                                            <Input
                                                placeholder="اسم المرحلة"
                                                value={newMilestoneTitle}
                                                onChange={(e) =>
                                                    setNewMilestoneTitle(
                                                        e.target.value
                                                    )
                                                }
                                                className="flex-1"
                                            />
                                            <Input
                                                type="number"
                                                placeholder="المبلغ"
                                                value={newMilestoneAmount}
                                                onChange={(e) =>
                                                    setNewMilestoneAmount(
                                                        e.target.value
                                                    )
                                                }
                                                className="w-24"
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                onClick={addMilestone}>
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                        <Button type="submit" className="flex-1">
                            {goal ? "حفظ التعديلات" : "إضافة الهدف"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}>
                            إلغاء
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
