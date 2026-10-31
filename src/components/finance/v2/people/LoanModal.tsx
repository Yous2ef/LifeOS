import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { TextArea } from "@/components/ui/TextArea";
import { fundOf } from "@/utils/finance/balances";
import { todayISO } from "@/utils/finance/dates";
import type {
    Account,
    Currency,
    Fund,
    Loan,
    LoanDirection,
    Person,
} from "@/types/modules/finance";
import { BottomSheet } from "../modals/BottomSheet";
import { FundBalanceWarning, FundPicker } from "../controls/FundPicker";
import { AccountChips } from "./AccountChips";
import { AmountInput } from "./AmountInput";
import { LOAN_HINT } from "./copy";

const NEW_PERSON = "__new__";

export interface LoanFormData {
    /** Existing person, or empty when `newPersonName` is set */
    personId: string;
    newPersonName?: string;
    direction: LoanDirection;
    amount: number;
    accountId: string;
    fundId: string;
    date: string;
    dueDate?: string;
    notes?: string;
}

interface LoanModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** Returns an error to show, or null when saved (the modal then closes) */
    onSubmit: (data: LoanFormData) => string | null;
    people: Person[];
    accounts: Account[];
    funds: Fund[];
    defaultCurrency: Currency;
    formatCurrency: (amount: number) => string;
    getFundBalance?: (accountId: string, fundId: string) => number;
    /** Edit this loan instead of creating one */
    loan?: Loan | null;
    /** The edited loan has repayments: its direction can't change */
    hasRepayments?: boolean;
    defaultPersonId?: string;
    /** Starting amount of a new loan (from quick-add) */
    defaultAmount?: number;
}

const DIRECTIONS: { value: LoanDirection; label: string; help: string }[] = [
    {
        value: "borrowed",
        label: "I borrowed",
        help: "The money comes into this account. You pay it back later.",
    },
    {
        value: "lent",
        label: "I lent",
        help: "The money leaves this account. They pay you back later.",
    },
];

export const LoanModal = ({
    isOpen,
    onClose,
    onSubmit,
    people,
    accounts,
    funds,
    defaultCurrency,
    formatCurrency,
    getFundBalance,
    loan,
    hasRepayments = false,
    defaultPersonId,
    defaultAmount,
}: LoanModalProps) => {
    const isEditing = !!loan;
    const [form, setForm] = useState<LoanFormData>(() => emptyForm());
    const [error, setError] = useState<string | null>(null);

    function emptyForm(): LoanFormData {
        return {
            personId: defaultPersonId ?? people[0]?.id ?? NEW_PERSON,
            newPersonName: "",
            direction: "borrowed",
            amount: defaultAmount ?? 0,
            accountId:
                accounts.find((a) => a.isActive && a.isDefault)?.id ??
                accounts.find((a) => a.isActive)?.id ??
                "",
            fundId: fundOf(),
            date: todayISO(),
            dueDate: "",
            notes: "",
        };
    }

    // Reset whenever the modal opens (or switches to another loan)
    useEffect(() => {
        if (!isOpen) return;
        setError(null);
        setForm(
            loan
                ? {
                      personId: loan.personId,
                      direction: loan.direction,
                      amount: loan.amount,
                      accountId: loan.accountId,
                      fundId: fundOf(loan.fundId),
                      date: loan.date.slice(0, 10),
                      dueDate: loan.dueDate ?? "",
                      notes: loan.notes ?? "",
                  }
                : emptyForm(),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, loan]);

    const update = (changes: Partial<LoanFormData>) =>
        setForm((prev) => ({ ...prev, ...changes }));

    const isNewPerson = form.personId === NEW_PERSON;
    const hasPerson = isNewPerson
        ? !!form.newPersonName?.trim()
        : !!form.personId;
    const isValid =
        hasPerson && form.amount > 0 && !!form.accountId && !!form.date;

    const account = accounts.find((a) => a.id === form.accountId);
    const fund = funds.find((f) => f.id === form.fundId);
    // Lending takes money out: warn (not block) when the fund doesn't have it
    const balanceAfterLending =
        !isEditing && form.direction === "lent" && getFundBalance && account
            ? getFundBalance(account.id, form.fundId) - form.amount
            : 0;

    const handleSubmit = () => {
        if (!isValid) return;
        const result = onSubmit({
            ...form,
            personId: isNewPerson ? "" : form.personId,
            newPersonName: isNewPerson ? form.newPersonName?.trim() : undefined,
            dueDate: form.dueDate || undefined,
            notes: form.notes?.trim() || undefined,
        });
        if (result) setError(result);
        else onClose();
    };

    return (
        <BottomSheet
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Edit loan" : "New loan"}
            className="md:max-w-xl md:mx-auto">
            <div className="space-y-5 pb-6">
                {/* Person */}
                <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                        Person
                    </Label>
                    {people.length > 0 && (
                        <select
                            value={form.personId}
                            onChange={(e) => update({ personId: e.target.value })}
                            aria-label="Person"
                            className="w-full h-10 px-3 rounded-xl bg-muted/50 text-sm outline-none">
                            {people.map((person) => (
                                <option key={person.id} value={person.id}>
                                    {person.name}
                                </option>
                            ))}
                            {!isEditing && (
                                <option value={NEW_PERSON}>+ New person</option>
                            )}
                        </select>
                    )}
                    {isNewPerson && (
                        <Input
                            value={form.newPersonName ?? ""}
                            onChange={(e) =>
                                update({ newPersonName: e.target.value })
                            }
                            placeholder="Name"
                            dir="auto"
                            autoFocus
                            className="rounded-xl mt-2"
                        />
                    )}
                </div>

                {/* Direction */}
                <div>
                    <div className="grid grid-cols-2 gap-2">
                        {DIRECTIONS.map((option) => (
                            <button
                                key={option.value}
                                type="button"
                                disabled={hasRepayments}
                                onClick={() => update({ direction: option.value })}
                                className={cn(
                                    "py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed",
                                    form.direction === option.value
                                        ? "bg-violet-500/20 ring-2 ring-violet-500 text-violet-600 dark:text-violet-300"
                                        : "bg-muted/50 hover:bg-muted",
                                )}>
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        {hasRepayments
                            ? "Direction is locked once there are repayments."
                            : DIRECTIONS.find((d) => d.value === form.direction)
                                  ?.help}
                    </p>
                </div>

                {/* Amount */}
                <div className="text-center py-2">
                    <AmountInput
                        value={form.amount}
                        onChange={(amount) => update({ amount })}
                        currency={defaultCurrency}
                    />
                </div>

                <AccountChips
                    accounts={accounts}
                    value={form.accountId}
                    onChange={(accountId) => update({ accountId })}
                    keepAccountId={loan?.accountId}
                />

                <FundPicker
                    funds={funds}
                    value={form.fundId}
                    onChange={(fundId) => update({ fundId })}
                    activeClassName="bg-violet-500/20 ring-2 ring-violet-500"
                />

                {account && form.amount > 0 && (
                    <FundBalanceWarning
                        balanceAfter={balanceAfterLending}
                        fundName={fund?.name ?? "Me"}
                        accountName={account.name}
                        formatCurrency={formatCurrency}
                    />
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">
                            Date
                        </Label>
                        <Input
                            type="date"
                            value={form.date}
                            onChange={(e) => update({ date: e.target.value })}
                            className="rounded-xl"
                        />
                    </div>
                    <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">
                            Due date (optional)
                        </Label>
                        <Input
                            type="date"
                            value={form.dueDate ?? ""}
                            onChange={(e) => update({ dueDate: e.target.value })}
                            className="rounded-xl"
                        />
                    </div>
                </div>

                <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                        Notes (optional)
                    </Label>
                    <TextArea
                        value={form.notes ?? ""}
                        onChange={(e) => update({ notes: e.target.value })}
                        placeholder="What was it for?"
                        dir="auto"
                        className="rounded-xl min-h-[60px]"
                    />
                </div>

                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    {LOAN_HINT}
                </p>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <div className="flex gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="flex-1 rounded-xl">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!isValid}
                        className="flex-1 rounded-xl bg-violet-500 hover:bg-violet-600 text-white">
                        {isEditing ? "Save changes" : "Save loan"}
                    </Button>
                </div>
            </div>
        </BottomSheet>
    );
};
