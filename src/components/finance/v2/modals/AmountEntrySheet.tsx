import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { TextArea } from "@/components/ui/TextArea";
import { todayISO } from "@/utils/finance/dates";
import { BottomSheet } from "./BottomSheet";
import { AmountInput } from "../people/AmountInput";

export interface AmountEntryData {
    amount: number;
    date: string;
    notes?: string;
}

const COPY = {
    date: "Date",
    notes: "Notes (optional)",
    cancel: "Cancel",
};

/** Text and button colours of one form, e.g. amber for opening balances */
export interface AmountEntryAccent {
    text: string;
    button: string;
}

interface AmountEntrySheetProps {
    isOpen: boolean;
    title: string;
    /** Line above the amount (e.g. the account's name) */
    subtitle?: string;
    hint: string;
    accent: AmountEntryAccent;
    submitLabel: string;
    currency: string;
    /** Starting values each time the sheet opens; empty = a new entry today */
    initial?: Partial<AmountEntryData>;
    /** Earliest date allowed (YYYY-MM-DD) */
    minDate?: string;
    onClose: () => void;
    /** Returns an error to show, or null when saved (the sheet then closes) */
    onSubmit: (data: AmountEntryData) => string | null;
    /** Extra fields between the amount and the date (e.g. a fund picker) */
    children?: ReactNode;
}

/** Small amount + date + notes form shared by single-amount records */
export const AmountEntrySheet = ({
    isOpen,
    title,
    subtitle,
    hint,
    accent,
    submitLabel,
    currency,
    initial,
    minDate,
    onClose,
    onSubmit,
    children,
}: AmountEntrySheetProps) => {
    const [form, setForm] = useState<AmountEntryData>({
        amount: 0,
        date: todayISO(),
    });
    const [error, setError] = useState<string | null>(null);

    // `initial` must be stable while open (memoised by the caller)
    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setForm({
            amount: initial?.amount ?? 0,
            date: initial?.date ?? todayISO(),
            notes: initial?.notes ?? "",
        });
    }, [isOpen, initial]);

    const update = (changes: Partial<AmountEntryData>) =>
        setForm((prev) => ({ ...prev, ...changes }));

    const isValid = form.amount > 0 && !!form.date;

    const handleSubmit = () => {
        if (!isValid) return;
        const result = onSubmit({
            ...form,
            notes: form.notes?.trim() || undefined,
        });
        if (result) setError(result);
        else onClose();
    };

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            className="md:max-w-xl md:mx-auto">
            <div className="space-y-5 pb-6">
                <div className="text-center">
                    {subtitle && (
                        <p className="text-sm text-muted-foreground" dir="auto">
                            {subtitle}
                        </p>
                    )}
                    <AmountInput
                        value={form.amount}
                        onChange={(amount) => update({ amount })}
                        currency={currency}
                        className={cn(subtitle && "mt-2", accent.text)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">{hint}</p>
                </div>

                {children}

                <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                        {COPY.date}
                    </Label>
                    <Input
                        type="date"
                        value={form.date}
                        min={minDate}
                        onChange={(e) => update({ date: e.target.value })}
                        className="rounded-xl"
                    />
                </div>

                <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                        {COPY.notes}
                    </Label>
                    <TextArea
                        value={form.notes ?? ""}
                        onChange={(e) => update({ notes: e.target.value })}
                        dir="auto"
                        className="rounded-xl min-h-[60px]"
                    />
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 rounded-xl">
                        {COPY.cancel}
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid}
                        className={cn(
                            "flex-1 rounded-xl text-white",
                            accent.button,
                        )}>
                        {submitLabel}
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};
