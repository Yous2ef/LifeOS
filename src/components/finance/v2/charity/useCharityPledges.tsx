import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CharityPledge, Currency } from "@/types/modules/finance";
import type { CharityLedger } from "@/utils/finance/charity";
import type { RestorableRecord, WriteResult } from "@/hooks/useFinance";
import { showUndoToast } from "../feed/undoToast";
import type { AmountEntryData } from "../modals/AmountEntrySheet";
import { ExtraCharityModal } from "./ExtraCharityModal";
import { COPY } from "./copy";

interface CharityPledgesDeps {
    pledges: CharityPledge[];
    ledger: CharityLedger | null;
    currency: Currency;
    startDate: string;
    formatAmount: (amount: number) => string;
    addPledge: (data: AmountEntryData) => WriteResult;
    updatePledge: (id: string, data: AmountEntryData) => WriteResult;
    deletePledge: (id: string) => void;
    restoreRecord: (restored: RestorableRecord) => WriteResult;
}

const STATUS_TONE = {
    paid: "text-emerald-500",
    partial: "text-amber-500",
    unpaid: "text-muted-foreground",
};

const shortDate = (iso: string) =>
    new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

/**
 * "+ Extra charity": the add/edit modal and the compact list of pledges shown
 * in the charity strip's detail (edit, delete with undo).
 */
export const useCharityPledges = ({
    pledges,
    ledger,
    currency,
    startDate,
    formatAmount,
    addPledge,
    updatePledge,
    deletePledge,
    restoreRecord,
}: CharityPledgesDeps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [editing, setEditing] = useState<CharityPledge | null>(null);

    const openAdd = () => {
        setEditing(null);
        setIsOpen(true);
    };

    const remove = (pledge: CharityPledge) => {
        if (!window.confirm(COPY.extraDeleteConfirm)) return;
        deletePledge(pledge.id);
        showUndoToast(COPY.extraDeleted, () =>
            restoreRecord({ kind: "charityPledge", record: pledge }),
        );
    };

    const submit = (data: AmountEntryData) => {
        const result = editing
            ? updatePledge(editing.id, data)
            : addPledge(data);
        return result.success ? null : (result.error ?? "Couldn't save");
    };

    const sorted = [...pledges].sort((a, b) => b.date.localeCompare(a.date));

    const list =
        sorted.length > 0 ? (
            <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                    {COPY.extraTitle}
                </p>
                <ul className="divide-y divide-border/50">
                    {sorted.map((pledge) => {
                        const share = ledger?.perPledge.get(pledge.id);
                        return (
                            <li
                                key={pledge.id}
                                className="flex items-center gap-2 py-1.5 text-sm">
                                <div className="flex-1 min-w-0">
                                    <p className="truncate" dir="auto">
                                        {pledge.notes || COPY.extraTitle}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {shortDate(pledge.date)}
                                        {share && (
                                            <span
                                                className={cn(
                                                    "ml-2",
                                                    STATUS_TONE[share.status],
                                                )}>
                                                {COPY.pledgeStatus[share.status]}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <span className="tabular-nums font-medium">
                                    {formatAmount(pledge.amount)}
                                </span>
                                <button
                                    type="button"
                                    title={COPY.edit}
                                    aria-label={COPY.edit}
                                    onClick={() => {
                                        setEditing(pledge);
                                        setIsOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    title={COPY.delete}
                                    aria-label={COPY.delete}
                                    onClick={() => remove(pledge)}
                                    className="p-1.5 rounded-lg hover:bg-muted text-red-500">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </div>
        ) : null;

    const modal = (
        <ExtraCharityModal
            isOpen={isOpen}
            pledge={editing}
            onClose={() => {
                setIsOpen(false);
                setEditing(null);
            }}
            onSubmit={submit}
            currency={currency}
            startDate={startDate}
        />
    );

    return { openAdd, list, modal };
};
