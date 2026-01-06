/**
 * CategoryStudio V2 - Visual category management
 *
 * Features:
 * - Create custom categories with icons & colors
 * - Set monthly budget limits
 * - Drag to reorder
 * - Visual usage stats
 */

import { useState, useMemo } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
    Plus,
    Edit2,
    Trash2,
    GripVertical,
    Check,
    X,
    ShoppingCart,
    Utensils,
    Car,
    Home,
    Gamepad2,
    Heart,
    GraduationCap,
    Briefcase,
    Gift,
    Plane,
    Smartphone,
    Shirt,
    Coffee,
    Dumbbell,
    Music,
    Film,
    BookOpen,
    Pill,
    Baby,
    Dog,
    Palette,
    TrendingUp,
    type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { ExpenseCategory, Currency } from "@/types/modules/finance";

interface CategoryStudioProps {
    categories: ExpenseCategory[];
    onAddCategory: (
        category: Omit<ExpenseCategory, "id" | "createdAt">
    ) => void;
    onUpdateCategory: (id: string, updates: Partial<ExpenseCategory>) => void;
    onDeleteCategory: (id: string) => void;
    onReorderCategories: (categories: ExpenseCategory[]) => void;
    getCategoryUsage: (categoryId: string) => { count: number; total: number };
    formatCurrency: (amount: number) => string;
    defaultCurrency: Currency;
}

const CATEGORY_ICONS: { name: string; icon: LucideIcon }[] = [
    { name: "ShoppingCart", icon: ShoppingCart },
    { name: "Utensils", icon: Utensils },
    { name: "Car", icon: Car },
    { name: "Home", icon: Home },
    { name: "Gamepad2", icon: Gamepad2 },
    { name: "Heart", icon: Heart },
    { name: "GraduationCap", icon: GraduationCap },
    { name: "Briefcase", icon: Briefcase },
    { name: "Gift", icon: Gift },
    { name: "Plane", icon: Plane },
    { name: "Smartphone", icon: Smartphone },
    { name: "Shirt", icon: Shirt },
    { name: "Coffee", icon: Coffee },
    { name: "Dumbbell", icon: Dumbbell },
    { name: "Music", icon: Music },
    { name: "Film", icon: Film },
    { name: "BookOpen", icon: BookOpen },
    { name: "Pill", icon: Pill },
    { name: "Baby", icon: Baby },
    { name: "Dog", icon: Dog },
    { name: "Palette", icon: Palette },
    { name: "TrendingUp", icon: TrendingUp },
];

const CATEGORY_COLORS = [
    "#ef4444", // red
    "#f97316", // orange
    "#f59e0b", // amber
    "#84cc16", // lime
    "#22c55e", // green
    "#10b981", // emerald
    "#14b8a6", // teal
    "#06b6d4", // cyan
    "#0ea5e9", // sky
    "#3b82f6", // blue
    "#6366f1", // indigo
    "#8b5cf6", // violet
    "#a855f7", // purple
    "#d946ef", // fuchsia
    "#ec4899", // pink
    "#f43f5e", // rose
];

// Extended color palette for the dialog
const EXTENDED_COLORS = [
    // Reds
    "#fca5a5",
    "#f87171",
    "#ef4444",
    "#dc2626",
    "#b91c1c",
    "#7f1d1d",
    // Oranges
    "#fdba74",
    "#fb923c",
    "#f97316",
    "#ea580c",
    "#c2410c",
    "#7c2d12",
    // Yellows
    "#fde047",
    "#facc15",
    "#eab308",
    "#ca8a04",
    "#a16207",
    "#713f12",
    // Greens
    "#86efac",
    "#4ade80",
    "#22c55e",
    "#16a34a",
    "#15803d",
    "#14532d",
    // Teals
    "#5eead4",
    "#2dd4bf",
    "#14b8a6",
    "#0d9488",
    "#0f766e",
    "#134e4a",
    // Blues
    "#93c5fd",
    "#60a5fa",
    "#3b82f6",
    "#2563eb",
    "#1d4ed8",
    "#1e3a8a",
    // Purples
    "#c4b5fd",
    "#a78bfa",
    "#8b5cf6",
    "#7c3aed",
    "#6d28d9",
    "#4c1d95",
    // Pinks
    "#f9a8d4",
    "#f472b6",
    "#ec4899",
    "#db2777",
    "#be185d",
    "#831843",
    // Grays
    "#d1d5db",
    "#9ca3af",
    "#6b7280",
    "#4b5563",
    "#374151",
    "#1f2937",
];

interface NewCategoryForm {
    name: string;
    icon: string;
    color: string;
    monthlyBudget: number | undefined;
    isEssential: boolean;
}

export const CategoryStudio = ({
    categories,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
    onReorderCategories,
    getCategoryUsage,
    formatCurrency,
    defaultCurrency,
}: CategoryStudioProps) => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [showColorPicker, setShowColorPicker] = useState<
        "new" | "edit" | null
    >(null);

    const [newCategory, setNewCategory] = useState<NewCategoryForm>({
        name: "",
        icon: "ShoppingCart",
        color: CATEGORY_COLORS[0],
        monthlyBudget: undefined,
        isEssential: false,
    });

    const [editForm, setEditForm] = useState<Partial<ExpenseCategory>>({});

    const orderedCategories = useMemo(() => {
        return [...categories].sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [categories]);

    const getIconComponent = (iconName: string) => {
        const found = CATEGORY_ICONS.find((i) => i.name === iconName);
        return found ? found.icon : ShoppingCart;
    };

    const handleCreateCategory = () => {
        if (!newCategory.name.trim()) return;

        onAddCategory({
            name: newCategory.name,
            icon: newCategory.icon,
            color: newCategory.color,
            monthlyBudget: newCategory.monthlyBudget,
            isEssential: newCategory.isEssential,
            isDefault: false,
            order: categories.length,
        });

        setNewCategory({
            name: "",
            icon: "ShoppingCart",
            color: CATEGORY_COLORS[0],
            monthlyBudget: undefined,
            isEssential: false,
        });
        setIsCreating(false);
    };

    const handleStartEdit = (category: ExpenseCategory) => {
        setEditingId(category.id);
        setEditForm({
            name: category.name,
            icon: category.icon,
            color: category.color,
            monthlyBudget: category.monthlyBudget,
            isEssential: category.isEssential,
        });
    };

    const handleSaveEdit = (id: string) => {
        if (editForm.name?.trim()) {
            onUpdateCategory(id, editForm);
        }
        setEditingId(null);
        setEditForm({});
    };

    const handleReorder = (newOrder: ExpenseCategory[]) => {
        const reordered = newOrder.map((cat, index) => ({
            ...cat,
            order: index,
        }));
        onReorderCategories(reordered);
    };

    const handleDelete = (id: string) => {
        const category = categories.find((c) => c.id === id);

        // Don't allow deleting default categories
        if (category?.isDefault) {
            setDeleteConfirmId(null);
            return;
        }

        onDeleteCategory(id);
        setDeleteConfirmId(null);
    };

    return (
        <div className="space-y-4">
            {/* Category List with Reorder */}
            <Reorder.Group
                axis="y"
                values={orderedCategories}
                onReorder={handleReorder}
                className="space-y-2">
                {orderedCategories.map((category) => {
                    const isEditing = editingId === category.id;
                    const usage = getCategoryUsage(category.id);
                    const IconComponent = getIconComponent(category.icon);
                    const budgetPercent = category.monthlyBudget
                        ? Math.min(
                              (usage.total / category.monthlyBudget) * 100,
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
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
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

                                        {/* Icon Grid */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-1 block">
                                                Icon
                                            </Label>
                                            <div className="grid grid-cols-8 gap-1">
                                                {CATEGORY_ICONS.slice(
                                                    0,
                                                    16
                                                ).map(
                                                    ({ name, icon: Icon }) => (
                                                        <button
                                                            key={name}
                                                            onClick={() =>
                                                                setEditForm(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        icon: name,
                                                                    })
                                                                )
                                                            }
                                                            className={cn(
                                                                "p-2 rounded-lg transition-all",
                                                                editForm.icon ===
                                                                    name
                                                                    ? "bg-primary text-primary-foreground"
                                                                    : "hover:bg-muted"
                                                            )}>
                                                            <Icon className="w-4 h-4" />
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Color Row */}
                                        <div className="flex gap-1 flex-wrap">
                                            {CATEGORY_COLORS.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() =>
                                                        setEditForm((prev) => ({
                                                            ...prev,
                                                            color,
                                                        }))
                                                    }
                                                    className={cn(
                                                        "w-6 h-6 rounded-full transition-all",
                                                        editForm.color ===
                                                            color &&
                                                            "ring-2 ring-offset-2 ring-offset-background"
                                                    )}
                                                    style={{
                                                        backgroundColor: color,
                                                    }}
                                                />
                                            ))}
                                            {/* More Colors Button for Edit */}
                                            <button
                                                onClick={() =>
                                                    setShowColorPicker("edit")
                                                }
                                                className={cn(
                                                    "w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/50",
                                                    "flex items-center justify-center hover:border-primary hover:text-primary transition-all",
                                                    editForm.color &&
                                                        !CATEGORY_COLORS.includes(
                                                            editForm.color
                                                        ) &&
                                                        "ring-2 ring-offset-2 ring-offset-background"
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
                                                {(!editForm.color ||
                                                    CATEGORY_COLORS.includes(
                                                        editForm.color
                                                    )) && (
                                                    <Plus className="w-2.5 h-2.5" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Color Picker Dialog for Edit */}
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
                                                    className="overflow-hidden">
                                                    <div className="p-3 bg-background/80 backdrop-blur-sm rounded-xl border border-border">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <Label className="text-xs font-medium">
                                                                Select Color
                                                            </Label>
                                                            <button
                                                                onClick={() =>
                                                                    setShowColorPicker(
                                                                        null
                                                                    )
                                                                }
                                                                className="p-0.5 hover:bg-muted rounded transition-colors">
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                        </div>

                                                        {/* Native Color Picker */}
                                                        <div className="mb-3 flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                                                            <div
                                                                className="w-8 h-8 rounded-lg border-2 border-border overflow-hidden relative"
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
                                                                <p className="text-[10px] font-medium">
                                                                    Custom
                                                                </p>
                                                                <p className="text-[9px] text-muted-foreground">
                                                                    Click to
                                                                    pick
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <p className="text-[10px] text-muted-foreground mb-1">
                                                            Presets:
                                                        </p>
                                                        <div className="grid grid-cols-9 gap-1">
                                                            {EXTENDED_COLORS.map(
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
                                                                            setShowColorPicker(
                                                                                null
                                                                            );
                                                                        }}
                                                                        className={cn(
                                                                            "w-5 h-5 rounded transition-all hover:scale-110",
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

                                        {/* Budget */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                Budget:
                                            </span>
                                            <Input
                                                type="number"
                                                value={
                                                    editForm.monthlyBudget || ""
                                                }
                                                onChange={(e) =>
                                                    setEditForm((prev) => ({
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
                                                className="h-8 w-32 rounded-lg text-sm"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                {defaultCurrency}/month
                                            </span>
                                        </div>

                                        {/* Essential Toggle */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    setEditForm((prev) => ({
                                                        ...prev,
                                                        isEssential:
                                                            !prev.isEssential,
                                                    }))
                                                }
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-sm transition-all",
                                                    editForm.isEssential
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted/50"
                                                )}>
                                                {editForm.isEssential
                                                    ? "Essential ✓"
                                                    : "Mark as Essential"}
                                            </button>
                                        </div>

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
                                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                            style={{
                                                backgroundColor: `${category.color}30`,
                                            }}>
                                            <IconComponent
                                                className="w-5 h-5"
                                                style={{
                                                    color: category.color,
                                                }}
                                            />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium truncate">
                                                    {category.name}
                                                </span>
                                                {category.isEssential && (
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
                                            {category.monthlyBudget ? (
                                                <div className="mt-1">
                                                    <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                                                        <span>
                                                            {formatCurrency(
                                                                usage.total
                                                            )}
                                                        </span>
                                                        <span>
                                                            {formatCurrency(
                                                                category.monthlyBudget
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
                                New Category
                            </h3>

                            {/* Preview */}
                            <div
                                className="flex items-center gap-3 p-3 rounded-xl"
                                style={{
                                    background: `linear-gradient(135deg, ${newCategory.color}20 0%, ${newCategory.color}10 100%)`,
                                }}>
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                                    style={{
                                        backgroundColor: `${newCategory.color}30`,
                                    }}>
                                    {(() => {
                                        const IconComp = getIconComponent(
                                            newCategory.icon
                                        );
                                        return (
                                            <IconComp
                                                className="w-5 h-5"
                                                style={{
                                                    color: newCategory.color,
                                                }}
                                            />
                                        );
                                    })()}
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
                                    placeholder="e.g., Food & Dining"
                                    className="rounded-xl"
                                />
                            </div>

                            {/* Icon Picker */}
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">
                                    Icon
                                </Label>
                                <div className="grid grid-cols-8 gap-1.5">
                                    {CATEGORY_ICONS.map(
                                        ({ name, icon: Icon }) => (
                                            <button
                                                key={name}
                                                onClick={() =>
                                                    setNewCategory((prev) => ({
                                                        ...prev,
                                                        icon: name,
                                                    }))
                                                }
                                                className={cn(
                                                    "p-2 rounded-lg transition-all",
                                                    newCategory.icon === name
                                                        ? "text-white"
                                                        : "hover:bg-muted text-muted-foreground"
                                                )}
                                                style={{
                                                    backgroundColor:
                                                        newCategory.icon ===
                                                        name
                                                            ? newCategory.color
                                                            : undefined,
                                                }}>
                                                <Icon className="w-4 h-4" />
                                            </button>
                                        )
                                    )}
                                </div>
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
                                                "w-7 h-7 rounded-full transition-all",
                                                newCategory.color === color &&
                                                    "ring-2 ring-offset-2 ring-offset-background"
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    {/* More Colors Button */}
                                    <button
                                        onClick={() =>
                                            setShowColorPicker("new")
                                        }
                                        className={cn(
                                            "w-7 h-7 rounded-full border-2 border-dashed border-muted-foreground/50",
                                            "flex items-center justify-center hover:border-primary hover:text-primary transition-all",
                                            !CATEGORY_COLORS.includes(
                                                newCategory.color
                                            ) &&
                                                "ring-2 ring-offset-2 ring-offset-background"
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
                                        {CATEGORY_COLORS.includes(
                                            newCategory.color
                                        ) && <Plus className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>

                            {/* Color Picker Dialog */}
                            <AnimatePresence>
                                {showColorPicker === "new" && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden">
                                        <div className="p-4 bg-background/80 backdrop-blur-sm rounded-xl border border-border">
                                            <div className="flex items-center justify-between mb-3">
                                                <Label className="text-sm font-medium">
                                                    Select Color
                                                </Label>
                                                <button
                                                    onClick={() =>
                                                        setShowColorPicker(null)
                                                    }
                                                    className="p-1 hover:bg-muted rounded-lg transition-colors">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>

                                            {/* Native Color Picker */}
                                            <div className="mb-4 flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                                                <div
                                                    className="w-10 h-10 rounded-lg border-2 border-border overflow-hidden relative"
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
                                                        Click to pick any color
                                                    </p>
                                                </div>
                                            </div>

                                            <p className="text-xs text-muted-foreground mb-2">
                                                Presets:
                                            </p>
                                            <div className="grid grid-cols-9 gap-1.5">
                                                {EXTENDED_COLORS.map(
                                                    (color) => (
                                                        <button
                                                            key={color}
                                                            onClick={() => {
                                                                setNewCategory(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        color,
                                                                    })
                                                                );
                                                                setShowColorPicker(
                                                                    null
                                                                );
                                                            }}
                                                            className={cn(
                                                                "w-6 h-6 rounded-md transition-all hover:scale-110",
                                                                newCategory.color ===
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

                            {/* Budget */}
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
                                        value={newCategory.monthlyBudget || ""}
                                        onChange={(e) =>
                                            setNewCategory((prev) => ({
                                                ...prev,
                                                monthlyBudget: e.target.value
                                                    ? parseFloat(e.target.value)
                                                    : undefined,
                                            }))
                                        }
                                        placeholder="No limit"
                                        className="rounded-xl pl-14"
                                    />
                                </div>
                            </div>

                            {/* Essential Toggle */}
                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                <span className="text-sm">
                                    Mark as essential expense
                                </span>
                                <button
                                    onClick={() =>
                                        setNewCategory((prev) => ({
                                            ...prev,
                                            isEssential: !prev.isEssential,
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
                        Add New Category
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
};

export type { NewCategoryForm };
