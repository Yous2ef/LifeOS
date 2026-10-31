/**
 * CharitySettings - turn the 20%-of-net charity obligation on and set its
 * rate, start date, eligible income / donation categories and opening balance.
 */

import { useState } from "react";
import { HandHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/switch";
import type {
    CharitySettings as CharitySettingsData,
    ExpenseCategory,
    IncomeCategory,
} from "@/types/modules/finance";
import type { CharityLedger } from "@/utils/finance/charity";
import { PRIVACY_MASK, usePrivacyMode } from "@/hooks/usePrivacyMode";
import { CharityLedgerCards } from "../charity/CharityStrip";
import { COPY } from "../charity/copy";

interface CharitySettingsProps {
    settings: CharitySettingsData;
    ledger: CharityLedger | null;
    incomeCategories: IncomeCategory[];
    expenseCategories: ExpenseCategory[];
    onEnable: () => void;
    onUpdate: (updates: Partial<CharitySettingsData>) => void;
    formatAmount: (amount: number) => string;
}

const toggle = (ids: string[], id: string) =>
    ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];

const CategoryChips = ({
    categories,
    selected,
    onToggle,
}: {
    categories: { id: string; name: string; icon: string }[];
    selected: string[];
    onToggle: (id: string) => void;
}) => (
    <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
            <button
                key={category.id}
                type="button"
                onClick={() => onToggle(category.id)}
                aria-pressed={selected.includes(category.id)}
                className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm transition-all",
                    selected.includes(category.id)
                        ? "bg-teal-500/20 ring-2 ring-teal-500"
                        : "bg-muted/50 hover:bg-muted",
                )}>
                <span>{category.icon}</span>
                {category.name}
            </button>
        ))}
    </div>
);

export const CharitySettings = ({
    settings,
    ledger,
    incomeCategories,
    expenseCategories,
    onEnable,
    onUpdate,
    formatAmount,
}: CharitySettingsProps) => {
    // Typed text kept locally so clearing a field to retype doesn't snap it
    // back; the tab remounts each time it opens, which picks up other changes
    const [rateText, setRateText] = useState(
        String(Math.round(settings.rate * 10000) / 100),
    );
    const [openingText, setOpeningText] = useState(
        String(Math.abs(settings.openingBalance) || ""),
    );
    const isOpeningCredit = settings.openingBalance < 0;
    const { isHidden: amountsHidden } = usePrivacyMode();
    const [isEditingOpening, setIsEditingOpening] = useState(false);

    const setOpening = (amount: number, credit: boolean) =>
        onUpdate({ openingBalance: credit ? -amount : amount });

    return (
        <div className="space-y-4">
            <label className="flex items-center justify-between gap-3 p-4 bg-muted/30 rounded-2xl cursor-pointer">
                <span className="flex items-center gap-3">
                    <HandHeart className="w-5 h-5 text-teal-500" />
                    <span>
                        <span className="block text-sm font-medium">
                            Track charity
                        </span>
                        <span className="block text-xs text-muted-foreground">
                            A share of what you earn, after work costs
                        </span>
                    </span>
                </span>
                <Switch
                    checked={settings.enabled}
                    onCheckedChange={(checked) =>
                        checked ? onEnable() : onUpdate({ enabled: false })
                    }
                    aria-label="Track charity"
                />
            </label>

            {settings.enabled && (
                <>
                    {ledger && (
                        <CharityLedgerCards
                            ledger={ledger}
                            rate={settings.rate}
                            formatAmount={formatAmount}
                        />
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label className="text-xs text-muted-foreground mb-2 block">
                                Rate (%)
                            </Label>
                            <Input
                                type="number"
                                min={0}
                                max={100}
                                value={rateText}
                                onChange={(e) => {
                                    setRateText(e.target.value);
                                    const percent = parseFloat(e.target.value);
                                    if (percent >= 0 && percent <= 100) {
                                        onUpdate({ rate: percent / 100 });
                                    }
                                }}
                                className="rounded-xl"
                            />
                        </div>
                        <div>
                            <Label className="text-xs text-muted-foreground mb-2 block">
                                Start date
                            </Label>
                            <Input
                                type="date"
                                value={settings.startDate}
                                onChange={(e) =>
                                    e.target.value &&
                                    onUpdate({ startDate: e.target.value })
                                }
                                className="rounded-xl"
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">
                            Opening balance (before the start date)
                        </Label>
                        <div className="flex gap-2">
                            {[false, true].map((credit) => (
                                <button
                                    key={String(credit)}
                                    type="button"
                                    onClick={() =>
                                        setOpening(
                                            Math.abs(settings.openingBalance),
                                            credit,
                                        )
                                    }
                                    className={cn(
                                        "px-3 py-1.5 rounded-xl text-sm transition-all",
                                        isOpeningCredit === credit
                                            ? "bg-teal-500 text-white"
                                            : "bg-muted/50 hover:bg-muted",
                                    )}>
                                    {credit ? "Credit" : "Owed"}
                                </button>
                            ))}
                            {amountsHidden && !isEditingOpening ? (
                                // Privacy mode: show the mask, type only on request
                                <div className="flex-1 flex items-center justify-between gap-2 px-3 rounded-xl bg-muted/30">
                                    <span
                                        className="text-sm tabular-nums"
                                        aria-label="Opening balance">
                                        {PRIVACY_MASK}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setIsEditingOpening(true)}
                                        className="text-xs text-teal-500 hover:underline">
                                        {COPY.edit}
                                    </button>
                                </div>
                            ) : (
                                <Input
                                    type="number"
                                    min={0}
                                    value={openingText}
                                    onChange={(e) => {
                                        setOpeningText(e.target.value);
                                        setOpening(
                                            Math.abs(
                                                parseFloat(e.target.value) || 0,
                                            ),
                                            isOpeningCredit,
                                        );
                                    }}
                                    placeholder="0"
                                    aria-label="Opening balance"
                                    className="flex-1 rounded-xl"
                                />
                            )}
                        </div>
                    </div>

                    <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">
                            Income that owes charity
                        </Label>
                        <CategoryChips
                            categories={incomeCategories}
                            selected={settings.eligibleIncomeCategoryIds}
                            onToggle={(id) =>
                                onUpdate({
                                    eligibleIncomeCategoryIds: toggle(
                                        settings.eligibleIncomeCategoryIds,
                                        id,
                                    ),
                                })
                            }
                        />
                    </div>

                    <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">
                            Donation categories (count as paid)
                        </Label>
                        <CategoryChips
                            categories={expenseCategories}
                            selected={settings.donationCategoryIds}
                            onToggle={(id) =>
                                onUpdate({
                                    donationCategoryIds: toggle(
                                        settings.donationCategoryIds,
                                        id,
                                    ),
                                })
                            }
                        />
                    </div>
                </>
            )}
        </div>
    );
};
