import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { TextArea } from "@/components/ui/TextArea";
import { day, fundOf } from "@/utils/finance/balances";
import { todayISO } from "@/utils/finance/dates";
import { roundMoney } from "@/utils/finance/loans";
import type {
    Account,
    Currency,
    Fund,
    LoanDirection,
} from "@/types/modules/finance";
import { BottomSheet } from "../modals/BottomSheet";
import { FundBalanceWarning, FundPicker } from "../controls/FundPicker";
import { AccountChips } from "./AccountChips";
import { AmountInput } from "./AmountInput";

export interface SettleUpFormData {
    amount: number;
    accountId: string;
    fundId: string;
    date: string;
    notes?: string;
}

/** What is being settled; the form prefills from it */
export interface SettleUpContext {
    personName: string;
    direction: LoanDirection;
    remaining: number;
    accountId: string;
    fundId?: string;
    /** Date of the oldest loan being paid; a repayment can't be earlier */
    minDate: string;
}

interface SettleUpModalProps {
    context: SettleUpContext | null;
    onClose: () => void;
    /** Returns an error to show, or null when saved (the modal then closes) */
    onSubmit: (data: SettleUpFormData) => string | null;
    accounts: Account[];
    funds: Fund[];
    defaultCurrency: Currency;
    formatCurrency: (amount: number) => string;
    getFundBalance?: (accountId: string, fundId: string) => number;
}

export const SettleUpModal = ({
    context,
    onClose,
    onSubmit,
    accounts,
    funds,
    defaultCurrency,
    formatCurrency,
    getFundBalance,
}: SettleUpModalProps) => {
    const [form, setForm] = useState<SettleUpFormData>({
        amount: 0,
        accountId: "",
        fundId: fundOf(),
        date: todayISO(),
    });
    const [error, setError] = useState<string | null>(null);

    // Prefill the remainder; a partial amount is fine
    useEffect(() => {
        if (!context) return;
        setError(null);
        setForm({
            amount: context.remaining,
            accountId: context.accountId,
            fundId: fundOf(context.fundId),
            date: todayISO(),
            notes: "",
        });
    }, [context]);

    const update = (changes: Partial<SettleUpFormData>) =>
        setForm((prev) => ({ ...prev, ...changes }));

    const remaining = context?.remaining ?? 0;
    const isOver = roundMoney(form.amount) > remaining;
    const isTooEarly = !!context && day(form.date) < context.minDate;
    const isValid =
        form.amount > 0 && !isOver && !isTooEarly && !!form.accountId;

    // Paying back takes money out: warn (not block) when the fund lacks it
    const account = accounts.find((a) => a.id === form.accountId);
    const fund = funds.find((f) => f.id === form.fundId);
    const balanceAfter =
        context?.direction === "borrowed" && getFundBalance && account
            ? getFundBalance(account.id, form.fundId) - form.amount
            : 0;

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
            isOpen={!!context}
            onClose={onClose}
            title="Settle up"
            className="md:max-w-xl md:mx-auto">
            {context && (
                <div className="space-y-5 pb-6">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground" dir="auto">
                            {context.direction === "borrowed"
                                ? `You pay ${context.personName} back`
                                : `${context.personName} pays you back`}
                        </p>
                        <AmountInput
                            value={form.amount}
                            onChange={(amount) => update({ amount })}
                            currency={defaultCurrency}
                            className="mt-2"
                        />
                        <p
                            className={
                                isOver
                                    ? "text-xs text-red-500 mt-1"
                                    : "text-xs text-muted-foreground mt-1"
                            }>
                            {isOver
                                ? "That's more than what's left to settle."
                                : `Remaining ${formatCurrency(remaining)}`}
                        </p>
                    </div>

                    <AccountChips
                        accounts={accounts}
                        value={form.accountId}
                        onChange={(accountId) => update({ accountId })}
                        keepAccountId={context.accountId}
                    />

                    <FundPicker
                        funds={funds}
                        value={form.fundId}
                        onChange={(fundId) => update({ fundId })}
                        activeClassName="bg-violet-500/20 ring-2 ring-violet-500"
                    />

                    {account && form.amount > 0 && (
                        <FundBalanceWarning
                            balanceAfter={balanceAfter}
                            fundName={fund?.name ?? "Me"}
                            accountName={account.name}
                            formatCurrency={formatCurrency}
                        />
                    )}

                    <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">
                            Date
                        </Label>
                        <Input
                            type="date"
                            value={form.date}
                            min={context.minDate}
                            onChange={(e) => update({ date: e.target.value })}
                            className="rounded-xl"
                        />
                        {isTooEarly && (
                            <p className="text-xs text-red-500 mt-1">
                                A repayment can't be dated before the loan.
                            </p>
                        )}
                    </div>

                    <div>
                        <Label className="text-xs text-muted-foreground mb-2 block">
                            Notes (optional)
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
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!isValid}
                            className="flex-1 rounded-xl bg-violet-500 hover:bg-violet-600 text-white">
                            Settle up
                        </Button>
                    </div>
                </div>
            )}
        </BottomSheet>
    );
};
