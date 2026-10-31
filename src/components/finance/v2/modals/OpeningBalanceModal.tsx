import { useEffect, useState } from "react";
import { fundOf } from "@/utils/finance/balances";
import type {
    Account,
    Currency,
    Fund,
    OpeningBalanceEntry,
} from "@/types/modules/finance";
import { AmountEntrySheet, type AmountEntryData } from "./AmountEntrySheet";
import { FundPicker } from "../controls/FundPicker";

const COPY = {
    title: "Opening balance",
    editTitle: "Edit opening balance",
    hint: "Money this account already had. It never counts as income, expense or charity.",
    save: "Save",
    add: "Add",
};

const ACCENT = {
    text: "text-amber-500",
    button: "bg-amber-500 hover:bg-amber-600",
};

export interface OpeningBalanceFormData extends AmountEntryData {
    fundId: string;
}

/** A new entry for `accountId`, or an existing `entry` to edit */
export type OpeningBalanceTarget =
    | { accountId: string; entry?: undefined }
    | { accountId?: undefined; entry: OpeningBalanceEntry };

interface OpeningBalanceModalProps {
    /** Memoised by the caller: the form resets whenever it changes */
    target: OpeningBalanceTarget | null;
    onClose: () => void;
    /** Returns an error to show, or null when saved (the modal then closes) */
    onSubmit: (data: OpeningBalanceFormData) => string | null;
    accounts: Account[];
    funds: Fund[];
    defaultCurrency: Currency;
}

export const OpeningBalanceModal = ({
    target,
    onClose,
    onSubmit,
    accounts,
    funds,
    defaultCurrency,
}: OpeningBalanceModalProps) => {
    const [fundId, setFundId] = useState(fundOf());

    useEffect(() => {
        if (target) setFundId(fundOf(target.entry?.fundId));
    }, [target]);

    const accountId = target?.entry?.accountId ?? target?.accountId;
    const account = accounts.find((a) => a.id === accountId);

    return (
        <AmountEntrySheet
            isOpen={!!target}
            title={target?.entry ? COPY.editTitle : COPY.title}
            subtitle={account?.name}
            hint={COPY.hint}
            accent={ACCENT}
            submitLabel={target?.entry ? COPY.save : COPY.add}
            currency={account?.currency ?? defaultCurrency}
            initial={target?.entry}
            onClose={onClose}
            onSubmit={(data) => onSubmit({ ...data, fundId })}>
            <FundPicker
                funds={funds}
                value={fundId}
                onChange={setFundId}
                activeClassName="bg-amber-500/20 ring-2 ring-amber-500"
            />
        </AmountEntrySheet>
    );
};
