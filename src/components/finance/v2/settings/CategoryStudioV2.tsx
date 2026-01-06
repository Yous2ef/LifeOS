/**
 * CategoryStudio V2 - Visual category management for both Income and Expense categories
 *
 * Features:
 * - Tabbed interface for Income vs Expense categories
 * - Compact grid layout (2-3 columns)
 * - Real emoji icons from data
 * - Create, edit, delete, and reorder categories
 * - Visual usage stats
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Plus, Edit2, Trash2, GripVertical, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type {
    ExpenseCategory,
    IncomeCategory,
    Currency,
} from "@/types/modules/finance";

interface CategoryStudioV2Props {
    expenseCategories: ExpenseCategory[];
    incomeCategories: IncomeCategory[];
    onAddExpenseCategory: (
        category: Omit<ExpenseCategory, "id" | "createdAt">
    ) => void;
    onUpdateExpenseCategory: (
        id: string,
        updates: Partial<ExpenseCategory>
    ) => void;
    onDeleteExpenseCategory: (id: string) => void;
    onReorderExpenseCategories: (categories: ExpenseCategory[]) => void;
    onAddIncomeCategory: (
        category: Omit<IncomeCategory, "id" | "createdAt">
    ) => void;
    onUpdateIncomeCategory: (
        id: string,
        updates: Partial<IncomeCategory>
    ) => void;
    onDeleteIncomeCategory: (id: string) => void;
    onReorderIncomeCategories: (categories: IncomeCategory[]) => void;
    getCategoryUsage: (categoryId: string) => { count: number; total: number };
    formatCurrency: (amount: number) => string;
    defaultCurrency: Currency;
}

type CategoryTab = "expense" | "income";

const EMOJI_SUGGESTIONS = [
    "💰",
    "💵",
    "💴",
    "💶",
    "💷",
    "💳",
    "💸",
    "🏦",
    "🏠",
    "🏡",
    "🏢",
    "🏪",
    "🏫",
    "🏬",
    "🏭",
    "🏗️",
    "🚗",
    "🚕",
    "🚙",
    "🚌",
    "🚎",
    "🏎️",
    "🚓",
    "🚑",
    "🛒",
    "🛍️",
    "🎁",
    "🎀",
    "🎂",
    "🍔",
    "🍕",
    "🍱",
    "☕",
    "🍺",
    "🍻",
    "🥂",
    "🍷",
    "🥤",
    "🧃",
    "🧋",
    "⚡",
    "💡",
    "🔥",
    "💧",
    "☎️",
    "📱",
    "💻",
    "⌨️",
    "📚",
    "📖",
    "✏️",
    "📝",
    "🎓",
    "🎒",
    "🏫",
    "📐",
    "💊",
    "💉",
    "🩺",
    "🏥",
    "⚕️",
    "🧬",
    "🔬",
    "🧪",
    "✈️",
    "🚁",
    "🛫",
    "🏖️",
    "🗽",
    "🗼",
    "🏰",
    "🎡",
    "🎮",
    "🎯",
    "🎲",
    "🎰",
    "🎭",
    "🎪",
    "🎨",
    "🎬",
    "⚽",
    "🏀",
    "🏈",
    "⚾",
    "🎾",
    "🏐",
    "🏉",
    "🥊",
    "👔",
    "👕",
    "👖",
    "👗",
    "👘",
    "👙",
    "👚",
    "🧥",
    "🔧",
    "🔨",
    "⚙️",
    "🛠️",
    "🔩",
    "⚒️",
    "🛡️",
    "🎯",
    "📦",
    "📮",
    "📪",
    "📫",
    "📬",
    "📭",
    "📄",
    "📃",
    "🚨",
    "⚠️",
    "🆘",
    "🆙",
    "🔴",
    "🟠",
    "🟡",
    "🟢",
];

const CATEGORY_COLORS = [
    "#ef4444",
    "#f97316",
    "#f59e0b",
    "#84cc16",
    "#22c55e",
    "#10b981",
    "#14b8a6",
    "#06b6d4",
    "#0ea5e9",
    "#3b82f6",
    "#6366f1",
    "#8b5cf6",
    "#a855f7",
    "#d946ef",
    "#ec4899",
    "#f43f5e",
];

interface NewCategoryForm {
    name: string;
    icon: string;
    color: string;
    monthlyBudget?: number;
    isEssential?: boolean;
}

export const CategoryStudioV2 = ({
    expenseCategories,
    incomeCategories,
    onAddExpenseCategory,
    onUpdateExpenseCategory,
    onDeleteExpenseCategory,
    onReorderExpenseCategories,
    onAddIncomeCategory,
    onUpdateIncomeCategory,
    onDeleteIncomeCategory,
    onReorderIncomeCategories,
    getCategoryUsage,
    formatCurrency,
    defaultCurrency,
}: CategoryStudioV2Props) => {
    const [activeTab, setActiveTab] = useState<CategoryTab>("expense");
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [showColorPicker, setShowColorPicker] = useState<
        "new" | "edit" | null
    >(null);

    const [newCategory, setNewCategory] = useState<NewCategoryForm>({
        name: "",
        icon: "💰",
        color: CATEGORY_COLORS[0],
        monthlyBudget: undefined,
        isEssential: false,
    });

    const [editForm, setEditForm] = useState<
        Partial<ExpenseCategory | IncomeCategory>
    >({});

    const currentCategories =
        activeTab === "expense" ? expenseCategories : incomeCategories;

    const orderedCategories = useMemo(() => {
        return [...currentCategories].sort(
            (a, b) => (a.order || 0) - (b.order || 0)
        );
    }, [currentCategories]);

    const handleCreateCategory = () => {
        if (!newCategory.name.trim()) return;

        if (activeTab === "expense") {
            onAddExpenseCategory({
                name: newCategory.name,
                icon: newCategory.icon,
                color: newCategory.color,
                monthlyBudget: newCategory.monthlyBudget,
                isEssential: newCategory.isEssential || false,
                isDefault: false,
                order: expenseCategories.length,
            });
        } else {
            onAddIncomeCategory({
                name: newCategory.name,
                icon: newCategory.icon,
                color: newCategory.color,
                isDefault: false,
                order: incomeCategories.length,
            });
        }

        setNewCategory({
            name: "",
            icon: "💰",
            color: CATEGORY_COLORS[0],
            monthlyBudget: undefined,
            isEssential: false,
        });
        setIsCreating(false);
    };

    const handleStartEdit = (category: ExpenseCategory | IncomeCategory) => {
        setEditingId(category.id);
        setEditForm({
            name: category.name,
            icon: category.icon,
            color: category.color,
            ...(activeTab === "expense" && {
                monthlyBudget: (category as ExpenseCategory).monthlyBudget,
                isEssential: (category as ExpenseCategory).isEssential,
            }),
        });
    };

    const handleSaveEdit = (id: string) => {
        if (editForm.name?.trim()) {
            if (activeTab === "expense") {
                onUpdateExpenseCategory(
                    id,
                    editForm as Partial<ExpenseCategory>
                );
            } else {
                onUpdateIncomeCategory(id, editForm as Partial<IncomeCategory>);
            }
        }
        setEditingId(null);
        setEditForm({});
    };

    const handleReorder = (newOrder: (ExpenseCategory | IncomeCategory)[]) => {
        const reordered = newOrder.map((cat, index) => ({
            ...cat,
            order: index,
        }));

        if (activeTab === "expense") {
            onReorderExpenseCategories(reordered as ExpenseCategory[]);
        } else {
            onReorderIncomeCategories(reordered as IncomeCategory[]);
        }
    };

    const handleDelete = (id: string) => {
        const category = currentCategories.find((c) => c.id === id);

        // Don't allow deleting default categories
        if (category?.isDefault) {
            setDeleteConfirmId(null);
            return;
        }

        if (activeTab === "expense") {
            onDeleteExpenseCategory(id);
        } else {
            onDeleteIncomeCategory(id);
        }
        setDeleteConfirmId(null);
    };

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-muted/30 rounded-xl">
                <button
                    onClick={() => {
                        setActiveTab("expense");
                        setIsCreating(false);
                        setEditingId(null);
                        setDeleteConfirmId(null);
                    }}
                    className={cn(
                        "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        activeTab === "expense"
                            ? "bg-background shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}>
                    Expense Categories ({expenseCategories.length})
                </button>
                <button
                    onClick={() => {
                        setActiveTab("income");
                        setIsCreating(false);
                        setEditingId(null);
                        setDeleteConfirmId(null);
                    }}
                    className={cn(
                        "flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                        activeTab === "income"
                            ? "bg-background shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}>
                    Income Categories ({incomeCategories.length})
                </button>
            </div>

            {/* Category Grid with Reorder */}
            <Reorder.Group
                axis="y"
                values={orderedCategories}
                onReorder={handleReorder}
                className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {orderedCategories.map((category) => {
                    const isEditing = editingId === category.id;
                    const usage = getCategoryUsage(category.id);
                    const budgetPercent =
                        activeTab === "expense" &&
                        (category as ExpenseCategory).monthlyBudget
                            ? Math.min(
                                  (usage.total /
                                      (category as ExpenseCategory)
                                          .monthlyBudget!) *
                                      100,
                                  100
                              )
                            : 0;

                    return (
                        <Reorder.Item
                            key={category.id}
                            value={category}
                            dragListener={
                                !isEditing && deleteConfirmId !== category.id
                            }>
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative overflow-hidden rounded-xl p-3 transition-all"
                                style={{
                                    background: `linear-gradient(135deg, ${category.color}15 0%, ${category.color}05 100%)`,
                                }}>
                                {isEditing ? (
                                    /* Edit Mode */
                                    <div className="space-y-3">
                                        <Input
                                            value={editForm.name || ""}
                                            onChange={(e) =>
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    name: e.target.value,
                                                }))
                                            }
                                            placeholder="Category name"
                                            className="rounded-lg bg-background/50"
                                            autoFocus
                                        />

                                        {/* Emoji Selector */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-1 block">
                                                Icon (Emoji)
                                            </Label>
                                            <div className="grid grid-cols-10 gap-1">
                                                {EMOJI_SUGGESTIONS.slice(
                                                    0,
                                                    30
                                                ).map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() =>
                                                            setEditForm(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    icon: emoji,
                                                                })
                                                            )
                                                        }
                                                        className={cn(
                                                            "p-1.5 rounded-lg text-xl transition-all hover:scale-110",
                                                            editForm.icon ===
                                                                emoji
                                                                ? "bg-primary/20 ring-2 ring-primary"
                                                                : "hover:bg-muted"
                                                        )}>
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                            <Input
                                                value={editForm.icon || ""}
                                                onChange={(e) =>
                                                    setEditForm((prev) => ({
                                                        ...prev,
                                                        icon: e.target.value,
                                                    }))
                                                }
                                                placeholder="Or type your own emoji"
                                                className="rounded-lg bg-background/50 mt-2 text-center text-2xl"
                                                maxLength={2}
                                            />
                                        </div>

                                        {/* Color Selector */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-1 block">
                                                Color
                                            </Label>
                                            <div className="flex gap-2 flex-wrap items-center">
                                                {CATEGORY_COLORS.map(
                                                    (color) => (
                                                        <button
                                                            key={color}
                                                            onClick={() =>
                                                                setEditForm(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        color,
                                                                    })
                                                                )
                                                            }
                                                            className={cn(
                                                                "w-8 h-8 rounded-full transition-all",
                                                                editForm.color ===
                                                                    color &&
                                                                    "ring-2 ring-offset-2 ring-offset-background"
                                                            )}
                                                            style={{
                                                                backgroundColor:
                                                                    color,
                                                            }}
                                                        />
                                                    )
                                                )}
                                                {/* Custom color picker button */}
                                                <button
                                                    onClick={() =>
                                                        setShowColorPicker(
                                                            "edit"
                                                        )
                                                    }
                                                    className={cn(
                                                        "w-8 h-8 rounded-full transition-all border-2 border-dashed border-muted-foreground/50 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary",
                                                        editForm.color &&
                                                            !CATEGORY_COLORS.includes(
                                                                editForm.color
                                                            ) &&
                                                            "ring-2 ring-offset-2 ring-offset-background ring-primary"
                                                    )}
                                                    style={{
                                                        backgroundColor:
                                                            editForm.color &&
                                                            !CATEGORY_COLORS.includes(
                                                                editForm.color
                                                            )
                                                                ? editForm.color
                                                                : undefined,
                                                    }}
                                                    title="More colors">
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Extended Color Picker Dialog */}
                                            <AnimatePresence>
                                                {showColorPicker === "edit" && (
                                                    <motion.div
                                                        initial={{
                                                            opacity: 0,
                                                            height: 0,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            height: "auto",
                                                        }}
                                                        exit={{
                                                            opacity: 0,
                                                            height: 0,
                                                        }}
                                                        className="overflow-hidden mt-3">
                                                        <div className="p-4 bg-background/80 backdrop-blur-sm rounded-xl border border-border">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <Label className="text-sm font-medium">
                                                                    Select Color
                                                                </Label>
                                                                <button
                                                                    onClick={() =>
                                                                        setShowColorPicker(
                                                                            null
                                                                        )
                                                                    }
                                                                    className="p-1 hover:bg-muted rounded-lg transition-colors">
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </div>

                                                            {/* Native Color Picker */}
                                                            <div className="mb-4 flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                                                                <div
                                                                    className="w-10 h-10 rounded-lg border-2 border-border overflow-hidden relative cursor-pointer"
                                                                    style={{
                                                                        backgroundColor:
                                                                            editForm.color ||
                                                                            "#3b82f6",
                                                                    }}>
                                                                    <input
                                                                        type="color"
                                                                        value={
                                                                            editForm.color ||
                                                                            "#3b82f6"
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) => {
                                                                            setEditForm(
                                                                                (
                                                                                    prev
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    color: e
                                                                                        .target
                                                                                        .value,
                                                                                })
                                                                            );
                                                                        }}
                                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                    />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-xs font-medium">
                                                                        Custom
                                                                        Color
                                                                    </p>
                                                                    <p className="text-[10px] text-muted-foreground">
                                                                        Click to
                                                                        pick any
                                                                        color
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <p className="text-xs text-muted-foreground mb-2">
                                                                Popular Colors:
                                                            </p>
                                                            <div className="grid grid-cols-12 gap-1.5">
                                                                {[
                                                                    "#ef4444",
                                                                    "#f97316",
                                                                    "#f59e0b",
                                                                    "#84cc16",
                                                                    "#22c55e",
                                                                    "#10b981",
                                                                    "#14b8a6",
                                                                    "#06b6d4",
                                                                    "#0ea5e9",
                                                                    "#3b82f6",
                                                                    "#6366f1",
                                                                    "#8b5cf6",
                                                                    "#a855f7",
                                                                    "#d946ef",
                                                                    "#ec4899",
                                                                    "#f43f5e",
                                                                    "#64748b",
                                                                    "#78716c",
                                                                    "#1f2937",
                                                                    "#0f172a",
                                                                    "#fca5a5",
                                                                    "#fdba74",
                                                                    "#fde047",
                                                                    "#bef264",
                                                                ].map(
                                                                    (color) => (
                                                                        <button
                                                                            key={
                                                                                color
                                                                            }
                                                                            onClick={() => {
                                                                                setEditForm(
                                                                                    (
                                                                                        prev
                                                                                    ) => ({
                                                                                        ...prev,
                                                                                        color,
                                                                                    })
                                                                                );
                                                                            }}
                                                                            className={cn(
                                                                                "w-full aspect-square rounded-md transition-all hover:scale-110",
                                                                                editForm.color ===
                                                                                    color &&
                                                                                    "ring-2 ring-offset-1 ring-offset-background ring-white"
                                                                            )}
                                                                            style={{
                                                                                backgroundColor:
                                                                                    color,
                                                                            }}
                                                                        />
                                                                    )
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Expense-specific fields */}
                                        {activeTab === "expense" && (
                                            <>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-muted-foreground">
                                                        Budget:
                                                    </span>
                                                    <Input
                                                        type="number"
                                                        value={
                                                            (
                                                                editForm as Partial<ExpenseCategory>
                                                            ).monthlyBudget ||
                                                            ""
                                                        }
                                                        onChange={(e) =>
                                                            setEditForm(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    monthlyBudget:
                                                                        e.target
                                                                            .value
                                                                            ? parseFloat(
                                                                                  e
                                                                                      .target
                                                                                      .value
                                                                              )
                                                                            : undefined,
                                                                })
                                                            )
                                                        }
                                                        placeholder="No limit"
                                                        className="h-8 w-32 rounded-lg text-sm"
                                                    />
                                                    <span className="text-xs text-muted-foreground">
                                                        {defaultCurrency}/month
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() =>
                                                            setEditForm(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    isEssential:
                                                                        !(
                                                                            prev as Partial<ExpenseCategory>
                                                                        )
                                                                            .isEssential,
                                                                })
                                                            )
                                                        }
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-lg text-sm transition-all",
                                                            (
                                                                editForm as Partial<ExpenseCategory>
                                                            ).isEssential
                                                                ? "bg-primary text-primary-foreground"
                                                                : "bg-muted/50"
                                                        )}>
                                                        {(
                                                            editForm as Partial<ExpenseCategory>
                                                        ).isEssential
                                                            ? "Essential ✓"
                                                            : "Mark as Essential"}
                                                    </button>
                                                </div>
                                            </>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    setEditingId(null)
                                                }
                                                className="flex-1">
                                                <X className="w-4 h-4 mr-1" />
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    handleSaveEdit(category.id)
                                                }
                                                className="flex-1">
                                                <Check className="w-4 h-4 mr-1" />
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                ) : deleteConfirmId === category.id ? (
                                    /* Delete Confirmation */
                                    <div className="text-center py-2">
                                        <p className="text-sm mb-3">
                                            {category.isDefault
                                                ? "Cannot delete default categories."
                                                : usage.count > 0
                                                ? `This category has ${usage.count} transactions. Delete anyway?`
                                                : "Delete this category?"}
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    setDeleteConfirmId(null)
                                                }
                                                className="flex-1">
                                                Cancel
                                            </Button>
                                            {!category.isDefault && (
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() =>
                                                        handleDelete(
                                                            category.id
                                                        )
                                                    }
                                                    className="flex-1">
                                                    Delete
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    /* Normal Display */
                                    <div className="flex items-center gap-3">
                                        <div className="cursor-grab active:cursor-grabbing text-muted-foreground">
                                            <GripVertical className="w-4 h-4" />
                                        </div>

                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl"
                                            style={{
                                                backgroundColor: `${category.color}30`,
                                            }}>
                                            {category.icon}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="font-medium truncate">
                                                    {category.name}
                                                </span>
                                                {activeTab === "expense" &&
                                                    (
                                                        category as ExpenseCategory
                                                    ).isEssential && (
                                                        <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                                            Essential
                                                        </span>
                                                    )}
                                                {category.isDefault && (
                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                        System
                                                    </span>
                                                )}
                                            </div>
                                            {activeTab === "expense" &&
                                            (category as ExpenseCategory)
                                                .monthlyBudget ? (
                                                <div className="mt-1">
                                                    <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                                                        <span>
                                                            {formatCurrency(
                                                                usage.total
                                                            )}
                                                        </span>
                                                        <span>
                                                            {formatCurrency(
                                                                (
                                                                    category as ExpenseCategory
                                                                ).monthlyBudget!
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <motion.div
                                                            className="h-full rounded-full"
                                                            style={{
                                                                backgroundColor:
                                                                    budgetPercent >
                                                                    90
                                                                        ? "#ef4444"
                                                                        : category.color,
                                                                width: `${budgetPercent}%`,
                                                            }}
                                                            initial={{
                                                                width: 0,
                                                            }}
                                                            animate={{
                                                                width: `${budgetPercent}%`,
                                                            }}
                                                            transition={{
                                                                duration: 0.5,
                                                            }}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">
                                                    {usage.count} transactions •{" "}
                                                    {formatCurrency(
                                                        usage.total
                                                    )}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                onClick={() =>
                                                    handleStartEdit(category)
                                                }
                                                title="Edit category"
                                                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                                                <Edit2 className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                            {!category.isDefault && (
                                                <button
                                                    onClick={() =>
                                                        setDeleteConfirmId(
                                                            category.id
                                                        )
                                                    }
                                                    title="Delete category"
                                                    className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                                                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </Reorder.Item>
                    );
                })}
            </Reorder.Group>

            {/* Create New Category */}
            <AnimatePresence>
                {isCreating ? (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden">
                        <div className="p-4 bg-muted/30 rounded-2xl border border-dashed border-border space-y-4">
                            <h3 className="font-medium flex items-center gap-2">
                                <Plus className="w-4 h-4" />
                                New{" "}
                                {activeTab === "expense"
                                    ? "Expense"
                                    : "Income"}{" "}
                                Category
                            </h3>

                            {/* Preview */}
                            <div
                                className="flex items-center gap-3 p-3 rounded-xl"
                                style={{
                                    background: `linear-gradient(135deg, ${newCategory.color}20 0%, ${newCategory.color}10 100%)`,
                                }}>
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                    style={{
                                        backgroundColor: `${newCategory.color}30`,
                                    }}>
                                    {newCategory.icon}
                                </div>
                                <span className="font-medium">
                                    {newCategory.name || "Category Name"}
                                </span>
                            </div>

                            {/* Name */}
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">
                                    Name
                                </Label>
                                <Input
                                    value={newCategory.name}
                                    onChange={(e) =>
                                        setNewCategory((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder={
                                        activeTab === "expense"
                                            ? "e.g., Food & Dining"
                                            : "e.g., Freelance Work"
                                    }
                                    className="rounded-xl"
                                />
                            </div>

                            {/* Emoji Selector */}
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">
                                    Icon (Emoji)
                                </Label>
                                <div className="grid grid-cols-10 gap-1">
                                    {EMOJI_SUGGESTIONS.slice(0, 30).map(
                                        (emoji) => (
                                            <button
                                                key={emoji}
                                                onClick={() =>
                                                    setNewCategory((prev) => ({
                                                        ...prev,
                                                        icon: emoji,
                                                    }))
                                                }
                                                className={cn(
                                                    "p-1.5 rounded-lg text-xl transition-all hover:scale-110",
                                                    newCategory.icon === emoji
                                                        ? "bg-primary/20 ring-2 ring-primary"
                                                        : "hover:bg-muted"
                                                )}>
                                                {emoji}
                                            </button>
                                        )
                                    )}
                                </div>
                                <Input
                                    value={newCategory.icon}
                                    onChange={(e) =>
                                        setNewCategory((prev) => ({
                                            ...prev,
                                            icon: e.target.value,
                                        }))
                                    }
                                    placeholder="Or type your own emoji"
                                    className="rounded-xl mt-2 text-center text-2xl"
                                    maxLength={2}
                                />
                            </div>

                            {/* Color */}
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">
                                    Color
                                </Label>
                                <div className="flex gap-2 flex-wrap items-center">
                                    {CATEGORY_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() =>
                                                setNewCategory((prev) => ({
                                                    ...prev,
                                                    color,
                                                }))
                                            }
                                            className={cn(
                                                "w-8 h-8 rounded-full transition-all",
                                                newCategory.color === color &&
                                                    "ring-2 ring-offset-2 ring-offset-background"
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    {/* Custom color picker button */}
                                    <button
                                        onClick={() =>
                                            setShowColorPicker("new")
                                        }
                                        className={cn(
                                            "w-8 h-8 rounded-full transition-all border-2 border-dashed border-muted-foreground/50 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary",
                                            !CATEGORY_COLORS.includes(
                                                newCategory.color
                                            ) &&
                                                "ring-2 ring-offset-2 ring-offset-background ring-primary"
                                        )}
                                        style={{
                                            backgroundColor:
                                                !CATEGORY_COLORS.includes(
                                                    newCategory.color
                                                )
                                                    ? newCategory.color
                                                    : undefined,
                                        }}
                                        title="More colors">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Extended Color Picker Dialog */}
                                <AnimatePresence>
                                    {showColorPicker === "new" && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{
                                                opacity: 1,
                                                height: "auto",
                                            }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="overflow-hidden mt-3">
                                            <div className="p-4 bg-background/80 backdrop-blur-sm rounded-xl border border-border">
                                                <div className="flex items-center justify-between mb-3">
                                                    <Label className="text-sm font-medium">
                                                        Select Color
                                                    </Label>
                                                    <button
                                                        onClick={() =>
                                                            setShowColorPicker(
                                                                null
                                                            )
                                                        }
                                                        className="p-1 hover:bg-muted rounded-lg transition-colors">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                {/* Native Color Picker */}
                                                <div className="mb-4 flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                                                    <div
                                                        className="w-10 h-10 rounded-lg border-2 border-border overflow-hidden relative cursor-pointer"
                                                        style={{
                                                            backgroundColor:
                                                                newCategory.color,
                                                        }}>
                                                        <input
                                                            type="color"
                                                            value={
                                                                newCategory.color
                                                            }
                                                            onChange={(e) => {
                                                                setNewCategory(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        color: e
                                                                            .target
                                                                            .value,
                                                                    })
                                                                );
                                                            }}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-xs font-medium">
                                                            Custom Color
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            Click to pick any
                                                            color
                                                        </p>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-muted-foreground mb-2">
                                                    Popular Colors:
                                                </p>
                                                <div className="grid grid-cols-12 gap-1.5">
                                                    {[
                                                        "#ef4444",
                                                        "#f97316",
                                                        "#f59e0b",
                                                        "#84cc16",
                                                        "#22c55e",
                                                        "#10b981",
                                                        "#14b8a6",
                                                        "#06b6d4",
                                                        "#0ea5e9",
                                                        "#3b82f6",
                                                        "#6366f1",
                                                        "#8b5cf6",
                                                        "#a855f7",
                                                        "#d946ef",
                                                        "#ec4899",
                                                        "#f43f5e",
                                                        "#64748b",
                                                        "#78716c",
                                                        "#1f2937",
                                                        "#0f172a",
                                                        "#fca5a5",
                                                        "#fdba74",
                                                        "#fde047",
                                                        "#bef264",
                                                    ].map((color) => (
                                                        <button
                                                            key={color}
                                                            onClick={() => {
                                                                setNewCategory(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        color,
                                                                    })
                                                                );
                                                            }}
                                                            className={cn(
                                                                "w-full aspect-square rounded-md transition-all hover:scale-110",
                                                                newCategory.color ===
                                                                    color &&
                                                                    "ring-2 ring-offset-1 ring-offset-background ring-white"
                                                            )}
                                                            style={{
                                                                backgroundColor:
                                                                    color,
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Expense-specific fields */}
                            {activeTab === "expense" && (
                                <>
                                    <div>
                                        <Label className="text-xs text-muted-foreground mb-1 block">
                                            Monthly Budget (optional)
                                        </Label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                                {defaultCurrency}
                                            </span>
                                            <Input
                                                type="number"
                                                value={
                                                    newCategory.monthlyBudget ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    setNewCategory((prev) => ({
                                                        ...prev,
                                                        monthlyBudget: e.target
                                                            .value
                                                            ? parseFloat(
                                                                  e.target.value
                                                              )
                                                            : undefined,
                                                    }))
                                                }
                                                placeholder="No limit"
                                                className="rounded-xl pl-14"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                        <span className="text-sm">
                                            Mark as essential expense
                                        </span>
                                        <button
                                            onClick={() =>
                                                setNewCategory((prev) => ({
                                                    ...prev,
                                                    isEssential:
                                                        !prev.isEssential,
                                                }))
                                            }
                                            className={cn(
                                                "w-12 h-6 rounded-full transition-all",
                                                newCategory.isEssential
                                                    ? "bg-amber-500"
                                                    : "bg-muted"
                                            )}>
                                            <div
                                                className={cn(
                                                    "w-5 h-5 rounded-full bg-white shadow-md transition-transform",
                                                    newCategory.isEssential
                                                        ? "translate-x-6"
                                                        : "translate-x-0.5"
                                                )}
                                            />
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 rounded-xl">
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateCategory}
                                    disabled={!newCategory.name.trim()}
                                    className="flex-1 rounded-xl text-white"
                                    style={{
                                        backgroundColor: newCategory.color,
                                    }}>
                                    Create Category
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => setIsCreating(true)}
                        className="w-full p-4 rounded-2xl border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-muted-foreground hover:text-primary">
                        <Plus className="w-5 h-5" />
                        Add New {activeTab === "expense"
                            ? "Expense"
                            : "Income"}{" "}
                        Category
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};
