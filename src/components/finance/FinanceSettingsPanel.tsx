import { useState } from "react";
import {
    DollarSign,
    Calendar,
    Bell,
    Palette,
    Tag,
    Plus,
    Trash2,
    Edit2,
    Check,
    X,
} from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardDescription,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/Label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/Select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/Dialog";
import type {
    Currency,
    ExpenseCategory,
    FinanceSettings,
} from "@/types/finance";

interface FinanceSettingsPanelProps {
    settings: FinanceSettings;
    categories: ExpenseCategory[];
    onUpdateSettings: (updates: Partial<FinanceSettings>) => void;
    onAddCategory: (
        category: Omit<ExpenseCategory, "id" | "createdAt">
    ) => void;
    onUpdateCategory: (id: string, updates: Partial<ExpenseCategory>) => void;
    onDeleteCategory: (id: string) => void;
}

const CURRENCIES: { value: Currency; label: string; symbol: string }[] = [
    { value: "EGP", label: "Egyptian Pound", symbol: "ج.م" },
    { value: "USD", label: "US Dollar", symbol: "$" },
    { value: "EUR", label: "Euro", symbol: "€" },
    { value: "GBP", label: "British Pound", symbol: "£" },
    { value: "SAR", label: "Saudi Riyal", symbol: "ر.س" },
    { value: "AED", label: "UAE Dirham", symbol: "د.إ" },
    { value: "KWD", label: "Kuwaiti Dinar", symbol: "د.ك" },
];

const CATEGORY_COLORS = [
    "#3b82f6",
    "#22c55e",
    "#ef4444",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#f97316",
    "#14b8a6",
    "#6366f1",
    "#dc2626",
    "#64748b",
    "#10b981",
    "#d946ef",
    "#0ea5e9",
];

const CATEGORY_ICONS = [
    "🏠",
    "⚡",
    "🚗",
    "🛒",
    "💊",
    "🛡️",
    "🍔",
    "🎮",
    "🛍️",
    "👔",
    "📚",
    "🎁",
    "⚽",
    "✈️",
    "📱",
    "💇",
    "🚨",
    "📦",
    "💰",
    "🎵",
    "🎬",
    "☕",
    "🍕",
    "🏋️",
    "🚌",
    "💻",
    "🎨",
    "🌐",
    "🔧",
    "🏥",
];

export const FinanceSettingsPanel = ({
    settings,
    categories,
    onUpdateSettings,
    onAddCategory,
    onUpdateCategory,
    onDeleteCategory,
}: FinanceSettingsPanelProps) => {
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [editingCategory, setEditingCategory] =
        useState<ExpenseCategory | null>(null);
    const [newCategory, setNewCategory] = useState({
        name: "",
        nameAr: "",
        icon: "📦",
        color: "#3b82f6",
        isEssential: false,
    });

    const handleSaveCategory = () => {
        if (!newCategory.name.trim()) return;

        if (editingCategory) {
            onUpdateCategory(editingCategory.id, {
                name: newCategory.name,
                nameAr: newCategory.nameAr,
                icon: newCategory.icon,
                color: newCategory.color,
                isEssential: newCategory.isEssential,
            });
        } else {
            onAddCategory({
                name: newCategory.name,
                nameAr: newCategory.nameAr,
                icon: newCategory.icon,
                color: newCategory.color,
                isEssential: newCategory.isEssential,
                isDefault: false,
                order: categories.length + 1,
            });
        }

        setShowCategoryModal(false);
        setEditingCategory(null);
        setNewCategory({
            name: "",
            nameAr: "",
            icon: "📦",
            color: "#3b82f6",
            isEssential: false,
        });
    };

    const handleEditCategory = (category: ExpenseCategory) => {
        setEditingCategory(category);
        setNewCategory({
            name: category.name,
            nameAr: category.nameAr || "",
            icon: category.icon,
            color: category.color,
            isEssential: category.isEssential,
        });
        setShowCategoryModal(true);
    };

    const customCategories = categories.filter((c) => !c.isDefault);
    const defaultCategories = categories.filter((c) => c.isDefault);

    return (
        <div className="space-y-6">
            {/* Currency Settings */}
            <Card className="animate-fade-in-up">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Currency Settings
                    </CardTitle>
                    <CardDescription>
                        Configure your default currency and display options
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Default Currency</Label>
                            <Select
                                value={settings.defaultCurrency}
                                onValueChange={(value: Currency) =>
                                    onUpdateSettings({ defaultCurrency: value })
                                }>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CURRENCIES.map((currency) => (
                                        <SelectItem
                                            key={currency.value}
                                            value={currency.value}>
                                            {currency.symbol} {currency.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Show Cents</Label>
                                <p className="text-xs text-muted-foreground">
                                    Display decimal places in amounts
                                </p>
                            </div>
                            <Switch
                                checked={settings.showCents}
                                onCheckedChange={(checked: boolean) =>
                                    onUpdateSettings({ showCents: checked })
                                }
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Date Settings */}
            <Card className="animate-fade-in-up">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Date Settings
                    </CardTitle>
                    <CardDescription>
                        Configure when your financial month starts
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Month Start Day</Label>
                        <Select
                            value={String(settings.monthStartDay)}
                            onValueChange={(value: string) =>
                                onUpdateSettings({
                                    monthStartDay: parseInt(value),
                                })
                            }>
                            <SelectTrigger className="w-full sm:w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from(
                                    { length: 28 },
                                    (_, i) => i + 1
                                ).map((day) => (
                                    <SelectItem key={day} value={String(day)}>
                                        Day {day} of each month
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Set this to your salary day for more accurate
                            monthly tracking
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="animate-fade-in-up">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Settings
                    </CardTitle>
                    <CardDescription>
                        Configure alerts and reminders
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Budget Alerts</Label>
                            <p className="text-xs text-muted-foreground">
                                Get notified when approaching budget limits
                            </p>
                        </div>
                        <Switch
                            checked={settings.enableBudgetAlerts}
                            onCheckedChange={(checked: boolean) =>
                                onUpdateSettings({
                                    enableBudgetAlerts: checked,
                                })
                            }
                        />
                    </div>

                    {settings.enableBudgetAlerts && (
                        <div className="space-y-2 pl-4 border-l-2 border-muted">
                            <Label>Warning Threshold</Label>
                            <Select
                                value={String(settings.budgetWarningThreshold)}
                                onValueChange={(value: string) =>
                                    onUpdateSettings({
                                        budgetWarningThreshold: parseInt(value),
                                    })
                                }>
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="50">
                                        50% of budget
                                    </SelectItem>
                                    <SelectItem value="60">
                                        60% of budget
                                    </SelectItem>
                                    <SelectItem value="70">
                                        70% of budget
                                    </SelectItem>
                                    <SelectItem value="80">
                                        80% of budget
                                    </SelectItem>
                                    <SelectItem value="90">
                                        90% of budget
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Installment Reminders</Label>
                            <p className="text-xs text-muted-foreground">
                                Get reminded before payment due dates
                            </p>
                        </div>
                        <Switch
                            checked={settings.enableInstallmentReminders}
                            onCheckedChange={(checked: boolean) =>
                                onUpdateSettings({
                                    enableInstallmentReminders: checked,
                                })
                            }
                        />
                    </div>

                    {settings.enableInstallmentReminders && (
                        <div className="space-y-2 pl-4 border-l-2 border-muted">
                            <Label>Reminder Days Before</Label>
                            <Select
                                value={String(settings.installmentReminderDays)}
                                onValueChange={(value: string) =>
                                    onUpdateSettings({
                                        installmentReminderDays:
                                            parseInt(value),
                                    })
                                }>
                                <SelectTrigger className="w-full sm:w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="1">
                                        1 day before
                                    </SelectItem>
                                    <SelectItem value="2">
                                        2 days before
                                    </SelectItem>
                                    <SelectItem value="3">
                                        3 days before
                                    </SelectItem>
                                    <SelectItem value="5">
                                        5 days before
                                    </SelectItem>
                                    <SelectItem value="7">
                                        7 days before
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Financial Insights</Label>
                            <p className="text-xs text-muted-foreground">
                                Show smart spending analysis and tips
                            </p>
                        </div>
                        <Switch
                            checked={settings.enableInsights}
                            onCheckedChange={(checked: boolean) =>
                                onUpdateSettings({ enableInsights: checked })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Weekly Reports</Label>
                            <p className="text-xs text-muted-foreground">
                                Show weekly spending summary
                            </p>
                        </div>
                        <Switch
                            checked={settings.weeklyReportEnabled}
                            onCheckedChange={(checked: boolean) =>
                                onUpdateSettings({
                                    weeklyReportEnabled: checked,
                                })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Monthly Reports</Label>
                            <p className="text-xs text-muted-foreground">
                                Show monthly spending summary
                            </p>
                        </div>
                        <Switch
                            checked={settings.monthlyReportEnabled}
                            onCheckedChange={(checked: boolean) =>
                                onUpdateSettings({
                                    monthlyReportEnabled: checked,
                                })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Category Management */}
            <Card className="animate-fade-in-up">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tag className="h-5 w-5" />
                        Expense Categories
                    </CardTitle>
                    <CardDescription>
                        Manage your expense categories
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Custom Categories */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Custom Categories</Label>
                            <Button
                                size="sm"
                                onClick={() => {
                                    setEditingCategory(null);
                                    setNewCategory({
                                        name: "",
                                        nameAr: "",
                                        icon: "📦",
                                        color: "#3b82f6",
                                        isEssential: false,
                                    });
                                    setShowCategoryModal(true);
                                }}>
                                <Plus className="h-4 w-4 mr-1" />
                                Add Category
                            </Button>
                        </div>

                        {customCategories.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                                No custom categories yet
                            </p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {customCategories.map((category) => (
                                    <div
                                        key={category.id}
                                        className="flex items-center justify-between p-3 rounded-lg border"
                                        style={{
                                            borderColor: category.color + "40",
                                        }}>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                                                style={{
                                                    backgroundColor:
                                                        category.color + "20",
                                                }}>
                                                {category.icon}
                                            </span>
                                            <div>
                                                <p className="font-medium text-sm">
                                                    {category.name}
                                                </p>
                                                {category.nameAr && (
                                                    <p className="text-xs text-muted-foreground">
                                                        {category.nameAr}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    handleEditCategory(category)
                                                }>
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    onDeleteCategory(
                                                        category.id
                                                    )
                                                }>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Default Categories */}
                    <div className="space-y-2 pt-4 border-t">
                        <Label>
                            Default Categories ({defaultCategories.length})
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                            {defaultCategories.map((category) => (
                                <div
                                    key={category.id}
                                    className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                                    <span
                                        className="w-6 h-6 rounded-full flex items-center justify-center text-sm"
                                        style={{
                                            backgroundColor:
                                                category.color + "20",
                                        }}>
                                        {category.icon}
                                    </span>
                                    <span className="text-xs font-medium truncate">
                                        {category.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Category Modal */}
            <Dialog
                open={showCategoryModal}
                onOpenChange={setShowCategoryModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5" />
                            {editingCategory ? "Edit Category" : "Add Category"}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Name (English)</Label>
                            <Input
                                value={newCategory.name}
                                onChange={(e) =>
                                    setNewCategory({
                                        ...newCategory,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="e.g., Coffee"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Name (Arabic - Optional)</Label>
                            <Input
                                value={newCategory.nameAr}
                                onChange={(e) =>
                                    setNewCategory({
                                        ...newCategory,
                                        nameAr: e.target.value,
                                    })
                                }
                                placeholder="e.g., قهوة"
                                dir="rtl"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Icon</Label>
                            <div className="grid grid-cols-10 gap-1">
                                {CATEGORY_ICONS.map((icon) => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() =>
                                            setNewCategory({
                                                ...newCategory,
                                                icon,
                                            })
                                        }
                                        className={`w-8 h-8 rounded flex items-center justify-center text-lg hover:bg-muted transition-colors ${
                                            newCategory.icon === icon
                                                ? "bg-primary/20 ring-2 ring-primary"
                                                : ""
                                        }`}>
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Color</Label>
                            <div className="grid grid-cols-8 gap-1">
                                {CATEGORY_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() =>
                                            setNewCategory({
                                                ...newCategory,
                                                color,
                                            })
                                        }
                                        className={`w-8 h-8 rounded-full transition-all ${
                                            newCategory.color === color
                                                ? "ring-2 ring-offset-2 ring-primary"
                                                : ""
                                        }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Essential Category</Label>
                                <p className="text-xs text-muted-foreground">
                                    Mark as essential/necessary expense
                                </p>
                            </div>
                            <Switch
                                checked={newCategory.isEssential}
                                onCheckedChange={(checked: boolean) =>
                                    setNewCategory({
                                        ...newCategory,
                                        isEssential: checked,
                                    })
                                }
                            />
                        </div>

                        {/* Preview */}
                        <div className="pt-4 border-t">
                            <Label className="mb-2 block">Preview</Label>
                            <div
                                className="inline-flex items-center gap-2 p-3 rounded-lg border"
                                style={{
                                    borderColor: newCategory.color + "40",
                                }}>
                                <span
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
                                    style={{
                                        backgroundColor:
                                            newCategory.color + "20",
                                    }}>
                                    {newCategory.icon}
                                </span>
                                <div>
                                    <p className="font-medium">
                                        {newCategory.name || "Category Name"}
                                    </p>
                                    {newCategory.nameAr && (
                                        <p className="text-sm text-muted-foreground">
                                            {newCategory.nameAr}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCategoryModal(false)}>
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveCategory}
                            disabled={!newCategory.name.trim()}>
                            <Check className="h-4 w-4 mr-1" />
                            {editingCategory ? "Save Changes" : "Add Category"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
