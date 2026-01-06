/**
 * AccountManager V2 - Virtual Credit Card style account management
 *
 * Features:
 * - Create accounts with custom colors
 * - Visual card preview
 * - Edit/Archive functionality
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus,
    Edit2,
    Trash2,
    Archive,
    Wallet,
    Building2,
    Smartphone,
    CreditCard,
    HandCoins,
    TrendingUp,
    Check,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { Account, AccountType, Currency } from "@/types/modules/finance";

interface AccountManagerProps {
    accounts: Account[];
    onAddAccount: (
        account: Omit<Account, "id" | "createdAt" | "updatedAt" | "balance">
    ) => void;
    onUpdateAccount: (id: string, updates: Partial<Account>) => void;
    onDeleteAccount: (id: string) => void;
    hasTransactions: (accountId: string) => boolean;
    defaultCurrency: Currency;
    formatCurrency: (amount: number) => string;
    calculateBalance: (accountId: string) => number;
}

const ACCOUNT_TYPES: {
    value: AccountType;
    label: string;
    icon: React.ReactNode;
}[] = [
    { value: "cash", label: "Cash", icon: <Wallet className="w-4 h-4" /> },
    { value: "bank", label: "Bank", icon: <Building2 className="w-4 h-4" /> },
    {
        value: "mobile-wallet",
        label: "Mobile Wallet",
        icon: <Smartphone className="w-4 h-4" />,
    },
    {
        value: "credit-card",
        label: "Credit Card",
        icon: <CreditCard className="w-4 h-4" />,
    },
    {
        value: "savings",
        label: "Savings",
        icon: <HandCoins className="w-4 h-4" />,
    },
    {
        value: "investment",
        label: "Investment",
        icon: <TrendingUp className="w-4 h-4" />,
    },
];

const ACCOUNT_COLORS = [
    "#3b82f6", // blue
    "#10b981", // emerald
    "#8b5cf6", // violet
    "#f59e0b", // amber
    "#ec4899", // pink
    "#06b6d4", // cyan
    "#f97316", // orange
    "#84cc16", // lime
    "#6366f1", // indigo
    "#14b8a6", // teal
];

// Extended color palette for custom picker
const EXTENDED_COLORS = [
    // Row 1: Reds
    "#fca5a5",
    "#f87171",
    "#ef4444",
    "#dc2626",
    "#b91c1c",
    "#991b1b",
    // Row 2: Oranges
    "#fdba74",
    "#fb923c",
    "#f97316",
    "#ea580c",
    "#c2410c",
    "#9a3412",
    // Row 3: Yellows/Ambers
    "#fcd34d",
    "#fbbf24",
    "#f59e0b",
    "#d97706",
    "#b45309",
    "#92400e",
    // Row 4: Greens
    "#86efac",
    "#4ade80",
    "#22c55e",
    "#16a34a",
    "#15803d",
    "#166534",
    // Row 5: Teals/Cyans
    "#5eead4",
    "#2dd4bf",
    "#14b8a6",
    "#0d9488",
    "#0f766e",
    "#115e59",
    // Row 6: Blues
    "#93c5fd",
    "#60a5fa",
    "#3b82f6",
    "#2563eb",
    "#1d4ed8",
    "#1e40af",
    // Row 7: Purples
    "#c4b5fd",
    "#a78bfa",
    "#8b5cf6",
    "#7c3aed",
    "#6d28d9",
    "#5b21b6",
    // Row 8: Pinks
    "#f9a8d4",
    "#f472b6",
    "#ec4899",
    "#db2777",
    "#be185d",
    "#9d174d",
    // Row 9: Grays
    "#d1d5db",
    "#9ca3af",
    "#6b7280",
    "#4b5563",
    "#374151",
    "#1f2937",
];

const ACCOUNT_ICONS = ["💳", "🏦", "💰", "💵", "📱", "🏧", "💎", "🪙"];

interface NewAccountForm {
    name: string;
    type: AccountType;
    color: string;
    icon: string;
    initialBalance: number;
    currency: Currency;
    isDefault: boolean;
}

export const AccountManager = ({
    accounts,
    onAddAccount,
    onUpdateAccount,
    onDeleteAccount,
    hasTransactions,
    defaultCurrency,
    formatCurrency,
    calculateBalance,
}: AccountManagerProps) => {
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [showColorPicker, setShowColorPicker] = useState<
        "new" | "edit" | null
    >(null);

    const [newAccount, setNewAccount] = useState<NewAccountForm>({
        name: "",
        type: "bank",
        color: ACCOUNT_COLORS[0],
        icon: "💳",
        initialBalance: 0,
        currency: defaultCurrency,
        isDefault: false,
    });

    const [editForm, setEditForm] = useState<Partial<Account>>({});

    const handleCreateAccount = () => {
        if (!newAccount.name.trim()) return;

        onAddAccount({
            name: newAccount.name,
            type: newAccount.type,
            color: newAccount.color,
            icon: newAccount.icon,
            initialBalance: newAccount.initialBalance,
            currency: newAccount.currency,
            isDefault: newAccount.isDefault || accounts.length === 0,
            isActive: true,
            order: accounts.length,
        });

        setNewAccount({
            name: "",
            type: "bank",
            color: ACCOUNT_COLORS[0],
            icon: "💳",
            initialBalance: 0,
            currency: defaultCurrency,
            isDefault: false,
        });
        setIsCreating(false);
    };

    const handleStartEdit = (account: Account) => {
        setEditingId(account.id);
        setEditForm({
            name: account.name,
            type: account.type,
            color: account.color,
            icon: account.icon,
            isDefault: account.isDefault,
        });
    };

    const handleSaveEdit = (id: string) => {
        if (editForm.name?.trim()) {
            onUpdateAccount(id, editForm);
        }
        setEditingId(null);
        setEditForm({});
    };

    const handleDelete = (id: string) => {
        if (hasTransactions(id)) {
            // Archive instead of delete
            onUpdateAccount(id, { isActive: false });
        } else {
            onDeleteAccount(id);
        }
        setDeleteConfirmId(null);
    };

    const getTypeIcon = (type: AccountType) => {
        return (
            ACCOUNT_TYPES.find((t) => t.value === type)?.icon || (
                <Wallet className="w-4 h-4" />
            )
        );
    };

    return (
        <div className="space-y-4">
            {/* Account List */}
            <div className="space-y-3">
                {accounts.map((account) => {
                    const isEditing = editingId === account.id;
                    const balance = calculateBalance(account.id);

                    return (
                        <motion.div
                            key={account.id}
                            layout
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={cn(
                                "relative overflow-hidden rounded-2xl p-4 transition-all",
                                !account.isActive && "opacity-60"
                            )}
                            style={{
                                background: `linear-gradient(135deg, ${account.color}20 0%, ${account.color}10 100%)`,
                                borderLeft: `4px solid ${account.color}`,
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
                                        placeholder="Account name"
                                        className="rounded-lg bg-background/50"
                                        autoFocus
                                    />

                                    {/* Type Selection */}
                                    <div className="flex flex-wrap gap-1">
                                        {ACCOUNT_TYPES.map((type) => (
                                            <button
                                                key={type.value}
                                                onClick={() =>
                                                    setEditForm((prev) => ({
                                                        ...prev,
                                                        type: type.value,
                                                    }))
                                                }
                                                className={cn(
                                                    "flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs transition-all",
                                                    editForm.type === type.value
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-muted/50 hover:bg-muted"
                                                )}>
                                                {type.icon}
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Color Selection */}
                                    <div className="flex gap-1 flex-wrap items-center">
                                        {ACCOUNT_COLORS.map((color) => (
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
                                                    editForm.color === color &&
                                                        "ring-2 ring-offset-2 ring-offset-background"
                                                )}
                                                style={{
                                                    backgroundColor: color,
                                                }}
                                            />
                                        ))}
                                        {/* Custom color picker button */}
                                        <button
                                            onClick={() =>
                                                setShowColorPicker("edit")
                                            }
                                            className={cn(
                                                "w-6 h-6 rounded-full transition-all border-2 border-dashed border-muted-foreground/50 flex items-center justify-center text-muted-foreground hover:border-primary hover:text-primary",
                                                editForm.color &&
                                                    !ACCOUNT_COLORS.includes(
                                                        editForm.color
                                                    ) &&
                                                    "ring-2 ring-offset-2 ring-offset-background ring-primary"
                                            )}
                                            style={{
                                                backgroundColor:
                                                    editForm.color &&
                                                    !ACCOUNT_COLORS.includes(
                                                        editForm.color
                                                    )
                                                        ? editForm.color
                                                        : undefined,
                                            }}
                                            title="More colors">
                                            <Plus className="w-3 h-3" />
                                        </button>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setEditingId(null)}
                                            className="flex-1">
                                            <X className="w-4 h-4 mr-1" />
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                handleSaveEdit(account.id)
                                            }
                                            className="flex-1">
                                            <Check className="w-4 h-4 mr-1" />
                                            Save
                                        </Button>
                                    </div>
                                </div>
                            ) : deleteConfirmId === account.id ? (
                                /* Delete Confirmation */
                                <div className="text-center py-2">
                                    <p className="text-sm mb-3">
                                        {hasTransactions(account.id)
                                            ? "This account has transactions. It will be archived."
                                            : "Delete this account?"}
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
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() =>
                                                handleDelete(account.id)
                                            }
                                            className="flex-1">
                                            {hasTransactions(account.id)
                                                ? "Archive"
                                                : "Delete"}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                /* Normal Display */
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                                            style={{
                                                backgroundColor: `${account.color}30`,
                                            }}>
                                            {account.icon}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {account.name}
                                                </span>
                                                {account.isDefault && (
                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                                                        Default
                                                    </span>
                                                )}
                                                {!account.isActive && (
                                                    <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                                        Archived
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                {getTypeIcon(account.type)}
                                                <span className="capitalize">
                                                    {account.type.replace(
                                                        "-",
                                                        " "
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <span
                                            className="font-semibold tabular-nums"
                                            style={{
                                                color:
                                                    balance >= 0
                                                        ? account.color
                                                        : "#ef4444",
                                            }}>
                                            {formatCurrency(balance)}
                                        </span>

                                        <div className="flex gap-1">
                                            <button
                                                onClick={() =>
                                                    handleStartEdit(account)
                                                }
                                                title="Edit account"
                                                className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                                                <Edit2 className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                            {!account.isActive ? (
                                                /* Unarchive button */
                                                <button
                                                    onClick={() =>
                                                        onUpdateAccount(
                                                            account.id,
                                                            { isActive: true }
                                                        )
                                                    }
                                                    title="Unarchive account"
                                                    className="p-1.5 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-500 transition-colors">
                                                    <Archive className="w-4 h-4 text-muted-foreground" />
                                                </button>
                                            ) : (
                                                !account.isDefault && (
                                                    <button
                                                        onClick={() =>
                                                            setDeleteConfirmId(
                                                                account.id
                                                            )
                                                        }
                                                        title={
                                                            hasTransactions(
                                                                account.id
                                                            )
                                                                ? "Archive account"
                                                                : "Delete account"
                                                        }
                                                        className="p-1.5 rounded-lg hover:bg-muted/50 transition-colors">
                                                        {hasTransactions(
                                                            account.id
                                                        ) ? (
                                                            <Archive className="w-4 h-4 text-muted-foreground" />
                                                        ) : (
                                                            <Trash2 className="w-4 h-4 text-muted-foreground" />
                                                        )}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>

            {/* Create New Account */}
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
                                New Account
                            </h3>

                            {/* Preview Card */}
                            <div
                                className="relative h-32 rounded-2xl p-4 overflow-hidden"
                                style={{
                                    background: `linear-gradient(135deg, ${newAccount.color} 0%, ${newAccount.color}cc 100%)`,
                                }}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                                <div className="relative text-white">
                                    <div className="text-2xl mb-2">
                                        {newAccount.icon}
                                    </div>
                                    <div className="font-medium">
                                        {newAccount.name || "Account Name"}
                                    </div>
                                    <div className="text-sm opacity-75 capitalize">
                                        {newAccount.type.replace("-", " ")}
                                    </div>
                                </div>
                            </div>

                            {/* Name */}
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">
                                    Name
                                </Label>
                                <Input
                                    value={newAccount.name}
                                    onChange={(e) =>
                                        setNewAccount((prev) => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="e.g., Main Bank, Vodafone Cash"
                                    className="rounded-xl"
                                />
                            </div>

                            {/* Type */}
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">
                                    Type
                                </Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {ACCOUNT_TYPES.map((type) => (
                                        <button
                                            key={type.value}
                                            onClick={() =>
                                                setNewAccount((prev) => ({
                                                    ...prev,
                                                    type: type.value,
                                                }))
                                            }
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded-xl text-sm transition-all",
                                                newAccount.type === type.value
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted/50 hover:bg-muted"
                                            )}>
                                            {type.icon}
                                            <span className="truncate">
                                                {type.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color */}
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">
                                    Color
                                </Label>
                                <div className="flex gap-2 flex-wrap items-center">
                                    {ACCOUNT_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() =>
                                                setNewAccount((prev) => ({
                                                    ...prev,
                                                    color,
                                                }))
                                            }
                                            className={cn(
                                                "w-8 h-8 rounded-full transition-all",
                                                newAccount.color === color &&
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
                                            !ACCOUNT_COLORS.includes(
                                                newAccount.color
                                            ) &&
                                                "ring-2 ring-offset-2 ring-offset-background ring-primary"
                                        )}
                                        style={{
                                            backgroundColor:
                                                !ACCOUNT_COLORS.includes(
                                                    newAccount.color
                                                )
                                                    ? newAccount.color
                                                    : undefined,
                                        }}
                                        title="More colors">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Icon */}
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">
                                    Icon
                                </Label>
                                <div className="flex gap-2 flex-wrap">
                                    {ACCOUNT_ICONS.map((icon) => (
                                        <button
                                            key={icon}
                                            onClick={() =>
                                                setNewAccount((prev) => ({
                                                    ...prev,
                                                    icon,
                                                }))
                                            }
                                            className={cn(
                                                "w-10 h-10 rounded-xl text-xl transition-all flex items-center justify-center",
                                                newAccount.icon === icon
                                                    ? "bg-primary/20 ring-2 ring-primary"
                                                    : "bg-muted/50 hover:bg-muted"
                                            )}>
                                            {icon}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Initial Balance */}
                            <div>
                                <Label className="text-xs text-muted-foreground mb-1 block">
                                    Initial Balance
                                </Label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        {newAccount.currency}
                                    </span>
                                    <Input
                                        type="number"
                                        value={newAccount.initialBalance || ""}
                                        onChange={(e) =>
                                            setNewAccount((prev) => ({
                                                ...prev,
                                                initialBalance:
                                                    parseFloat(
                                                        e.target.value
                                                    ) || 0,
                                            }))
                                        }
                                        placeholder="0.00"
                                        className="rounded-xl pl-14"
                                    />
                                </div>
                            </div>

                            {/* Default Toggle */}
                            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                <span className="text-sm">
                                    Set as default account
                                </span>
                                <button
                                    onClick={() =>
                                        setNewAccount((prev) => ({
                                            ...prev,
                                            isDefault: !prev.isDefault,
                                        }))
                                    }
                                    className={cn(
                                        "w-12 h-6 rounded-full transition-all",
                                        newAccount.isDefault
                                            ? "bg-primary"
                                            : "bg-muted"
                                    )}>
                                    <div
                                        className={cn(
                                            "w-5 h-5 rounded-full bg-white shadow-md transition-transform",
                                            newAccount.isDefault
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
                                    onClick={handleCreateAccount}
                                    disabled={!newAccount.name.trim()}
                                    className="flex-1 rounded-xl"
                                    style={{
                                        backgroundColor: newAccount.color,
                                    }}>
                                    Create Account
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
                        Add New Account
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Color Picker Dialog */}
            <AnimatePresence>
                {showColorPicker && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowColorPicker(null)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-background rounded-2xl p-6 shadow-2xl border border-border/50 max-w-sm w-full">
                            <h3 className="text-lg font-semibold mb-4">
                                Choose Color
                            </h3>

                            {/* Native Color Picker */}
                            <div className="mb-4 flex items-center gap-3">
                                <div
                                    className="w-12 h-12 rounded-xl border-2 border-border overflow-hidden relative"
                                    style={{
                                        backgroundColor:
                                            showColorPicker === "new"
                                                ? newAccount.color
                                                : editForm.color || "#3b82f6",
                                    }}>
                                    <input
                                        type="color"
                                        value={
                                            showColorPicker === "new"
                                                ? newAccount.color
                                                : editForm.color || "#3b82f6"
                                        }
                                        onChange={(e) => {
                                            if (showColorPicker === "new") {
                                                setNewAccount((prev) => ({
                                                    ...prev,
                                                    color: e.target.value,
                                                }));
                                            } else {
                                                setEditForm((prev) => ({
                                                    ...prev,
                                                    color: e.target.value,
                                                }));
                                            }
                                        }}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">
                                        Custom Color
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Click to pick any color
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => setShowColorPicker(null)}
                                    className="rounded-xl">
                                    Done
                                </Button>
                            </div>

                            <div className="border-t border-border/50 pt-4">
                                <p className="text-xs text-muted-foreground mb-3">
                                    Or choose from presets:
                                </p>
                                <div className="grid grid-cols-6 gap-2">
                                    {EXTENDED_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => {
                                                if (showColorPicker === "new") {
                                                    setNewAccount((prev) => ({
                                                        ...prev,
                                                        color,
                                                    }));
                                                } else {
                                                    setEditForm((prev) => ({
                                                        ...prev,
                                                        color,
                                                    }));
                                                }
                                                setShowColorPicker(null);
                                            }}
                                            className={cn(
                                                "w-10 h-10 rounded-xl transition-all hover:scale-110",
                                                ((showColorPicker === "new" &&
                                                    newAccount.color ===
                                                        color) ||
                                                    (showColorPicker ===
                                                        "edit" &&
                                                        editForm.color ===
                                                            color)) &&
                                                    "ring-2 ring-offset-2 ring-offset-background ring-primary"
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
