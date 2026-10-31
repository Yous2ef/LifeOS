/**
 * FundManager - create, rename, recolor, hide/show, reorder and (guarded)
 * delete funds. Funds say who money belongs to; accounts say where it sits.
 */

import { useState } from "react";
import toast from "react-hot-toast";
import {
    ChevronDown,
    ChevronUp,
    Edit2,
    Eye,
    EyeOff,
    Plus,
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FUND_CHARITY_ID, FUND_ME_ID } from "@/utils/finance/defaults";
import type { Fund } from "@/types/modules/finance";

type FundDraft = Pick<Fund, "name" | "icon" | "color">;

interface FundManagerProps {
    funds: Fund[];
    onAddFund: (fund: FundDraft) => void;
    onUpdateFund: (id: string, updates: Partial<FundDraft>) => void;
    onDeleteFund: (id: string) => { success: boolean; error?: string };
    /** Why a fund can't be deleted (checked before asking to confirm) */
    getDeleteError: (id: string) => string | null;
    onReorderFunds: (orderedIds: string[]) => void;
    onToggleVisibility: (id: string) => void;
    getFundBalance: (fundId: string) => number;
    formatCurrency: (amount: number) => string;
}

const FUND_COLORS = [
    "#22c55e",
    "#3b82f6",
    "#8b5cf6",
    "#f59e0b",
    "#ec4899",
    "#06b6d4",
    "#ef4444",
    "#64748b",
];

const EMPTY_DRAFT: FundDraft = { name: "", icon: "💰", color: FUND_COLORS[1] };

const FundForm = ({
    initial,
    submitLabel,
    onSubmit,
    onCancel,
}: {
    initial: FundDraft;
    submitLabel: string;
    onSubmit: (draft: FundDraft) => void;
    onCancel: () => void;
}) => {
    const [draft, setDraft] = useState(initial);
    const canSave = draft.name.trim().length > 0;

    return (
        <div className="p-3 rounded-2xl bg-muted/30 space-y-3">
            <div className="flex gap-2">
                <Input
                    value={draft.icon}
                    onChange={(e) =>
                        setDraft((prev) => ({ ...prev, icon: e.target.value }))
                    }
                    aria-label="Icon"
                    className="w-14 rounded-xl text-center text-lg"
                />
                <Input
                    value={draft.name}
                    onChange={(e) =>
                        setDraft((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Name"
                    aria-label="Name"
                    className="flex-1 rounded-xl"
                    autoFocus
                />
            </div>
            <div className="flex flex-wrap gap-2">
                {FUND_COLORS.map((color) => (
                    <button
                        key={color}
                        type="button"
                        onClick={() => setDraft((prev) => ({ ...prev, color }))}
                        aria-label={color}
                        className={cn(
                            "w-7 h-7 rounded-full transition-transform",
                            draft.color === color &&
                                "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110",
                        )}
                        style={{ backgroundColor: color }}
                    />
                ))}
            </div>
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1 rounded-xl">
                    Cancel
                </Button>
                <Button
                    onClick={() =>
                        onSubmit({ ...draft, name: draft.name.trim() })
                    }
                    disabled={!canSave}
                    className="flex-1 rounded-xl">
                    {submitLabel}
                </Button>
            </div>
        </div>
    );
};

export const FundManager = ({
    funds,
    onAddFund,
    onUpdateFund,
    onDeleteFund,
    getDeleteError,
    onReorderFunds,
    onToggleVisibility,
    getFundBalance,
    formatCurrency,
}: FundManagerProps) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const move = (index: number, delta: number) => {
        const ids = funds.map((fund) => fund.id);
        const target = index + delta;
        if (target < 0 || target >= ids.length) return;
        [ids[index], ids[target]] = [ids[target], ids[index]];
        onReorderFunds(ids);
    };

    const handleDelete = (fund: Fund) => {
        const blocker = getDeleteError(fund.id);
        if (blocker) {
            toast.error(blocker);
            return;
        }
        if (!window.confirm(`Delete "${fund.name}"?`)) return;
        const result = onDeleteFund(fund.id);
        if (!result.success && result.error) toast.error(result.error);
    };

    const iconButton =
        "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors disabled:opacity-30 disabled:pointer-events-none";

    return (
        <div className="space-y-2">
            {funds.map((fund, index) =>
                editingId === fund.id ? (
                    <FundForm
                        key={fund.id}
                        initial={{
                            name: fund.name,
                            icon: fund.icon,
                            color: fund.color,
                        }}
                        submitLabel="Save"
                        onSubmit={(draft) => {
                            onUpdateFund(fund.id, draft);
                            setEditingId(null);
                        }}
                        onCancel={() => setEditingId(null)}
                    />
                ) : (
                    <div
                        key={fund.id}
                        className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl bg-muted/30",
                            !fund.isVisible && "opacity-60",
                        )}>
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                            style={{ backgroundColor: `${fund.color}33` }}>
                            {fund.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                                {fund.name}
                            </p>
                            <p className="text-xs text-muted-foreground tabular-nums">
                                {formatCurrency(getFundBalance(fund.id))}
                            </p>
                        </div>
                        <div className="flex items-center">
                            <button
                                onClick={() => move(index, -1)}
                                disabled={index === 0}
                                title="Move up"
                                aria-label="Move up"
                                className={iconButton}>
                                <ChevronUp className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => move(index, 1)}
                                disabled={index === funds.length - 1}
                                title="Move down"
                                aria-label="Move down"
                                className={iconButton}>
                                <ChevronDown className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => onToggleVisibility(fund.id)}
                                disabled={fund.id === FUND_ME_ID}
                                title={fund.isVisible ? "Hide" : "Show"}
                                aria-label={fund.isVisible ? "Hide" : "Show"}
                                className={iconButton}>
                                {fund.isVisible ? (
                                    <Eye className="w-4 h-4" />
                                ) : (
                                    <EyeOff className="w-4 h-4" />
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setIsCreating(false);
                                    setEditingId(fund.id);
                                }}
                                title="Edit"
                                aria-label="Edit"
                                className={iconButton}>
                                <Edit2 className="w-4 h-4" />
                            </button>
                            {fund.id !== FUND_ME_ID &&
                                fund.id !== FUND_CHARITY_ID && (
                                    <button
                                        onClick={() => handleDelete(fund)}
                                        title="Delete"
                                        aria-label="Delete"
                                        className={cn(
                                            iconButton,
                                            "hover:text-rose-500",
                                        )}>
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                        </div>
                    </div>
                ),
            )}

            {isCreating ? (
                <FundForm
                    initial={EMPTY_DRAFT}
                    submitLabel="Add fund"
                    onSubmit={(draft) => {
                        onAddFund(draft);
                        setIsCreating(false);
                    }}
                    onCancel={() => setIsCreating(false)}
                />
            ) : (
                <Button
                    variant="ghost"
                    onClick={() => {
                        setEditingId(null);
                        setIsCreating(true);
                    }}
                    className="w-full justify-start gap-3 h-auto py-3 px-3 rounded-2xl border-2 border-dashed border-muted-foreground/20 text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5">
                    <Plus className="w-5 h-5" />
                    <span className="font-medium text-sm">New fund</span>
                </Button>
            )}
        </div>
    );
};
