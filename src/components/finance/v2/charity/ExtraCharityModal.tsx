import type { CharityPledge, Currency } from "@/types/modules/finance";
import {
    AmountEntrySheet,
    type AmountEntryData,
} from "../modals/AmountEntrySheet";
import { COPY } from "./copy";

const ACCENT = {
    text: "text-teal-500",
    button: "bg-teal-500 hover:bg-teal-600",
};

interface ExtraCharityModalProps {
    isOpen: boolean;
    /** Set when editing an existing pledge */
    pledge?: CharityPledge | null;
    onClose: () => void;
    /** Returns an error to show, or null when saved (the modal then closes) */
    onSubmit: (data: AmountEntryData) => string | null;
    currency: Currency;
    /** The charity start date: earlier pledges would count for nothing */
    startDate: string;
}

/** "+ Extra charity": an amount added to what is owed, paid later */
export const ExtraCharityModal = ({
    isOpen,
    pledge,
    onClose,
    onSubmit,
    currency,
    startDate,
}: ExtraCharityModalProps) => (
    <AmountEntrySheet
        isOpen={isOpen}
        title={pledge ? COPY.editExtraTitle : COPY.extraTitle}
        hint={COPY.extraHint}
        accent={ACCENT}
        submitLabel={pledge ? COPY.extraSave : COPY.extraAdd}
        currency={currency}
        initial={pledge ?? undefined}
        minDate={startDate}
        onClose={onClose}
        onSubmit={onSubmit}
    />
);
