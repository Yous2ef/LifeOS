import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/Label";
import { groupFunds } from "@/utils/finance/funds";
import type { Fund } from "@/types/modules/finance";

interface FundPickerProps {
    funds: Fund[];
    value: string;
    onChange: (fundId: string) => void;
    label?: string;
    /** Classes for the selected chip (each form has its own accent) */
    activeClassName?: string;
    className?: string;
}

const SET_ASIDE_LABEL = "Set aside";

/** Fund chips: visible funds first, hidden ones last under "Set aside" */
export const FundPicker = ({
    funds,
    value,
    onChange,
    label = "Fund",
    activeClassName = "bg-primary/20 ring-2 ring-primary",
    className,
}: FundPickerProps) => {
    // Only Me: nothing to choose
    if (funds.length <= 1) return null;
    const { visible, hidden } = groupFunds(funds);

    const chip = (fund: Fund) => (
        <button
            key={fund.id}
            type="button"
            onClick={() => onChange(fund.id)}
            className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-xl whitespace-nowrap text-sm font-medium transition-all",
                value === fund.id
                    ? activeClassName
                    : "bg-muted/50 hover:bg-muted",
            )}>
            <span>{fund.icon}</span>
            {fund.name}
        </button>
    );

    return (
        <div className={className}>
            <Label className="text-xs text-muted-foreground mb-2 block">
                {label}
            </Label>
            <div className="flex flex-wrap items-center gap-2 px-1">
                {visible.map(chip)}
                {hidden.length > 0 && (
                    <>
                        <span className="text-xs text-muted-foreground pl-1">
                            {SET_ASIDE_LABEL}
                        </span>
                        {hidden.map(chip)}
                    </>
                )}
            </div>
        </div>
    );
};

interface FundSelectProps {
    funds: Fund[];
    value: string;
    onChange: (fundId: string) => void;
    className?: string;
}

/** Compact fund dropdown (transfer form), hidden funds under "Set aside" */
export const FundSelect = ({
    funds,
    value,
    onChange,
    className,
}: FundSelectProps) => {
    if (funds.length <= 1) return null;
    const { visible, hidden } = groupFunds(funds);

    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            aria-label="Fund"
            className={cn(
                "w-full bg-transparent text-xs text-muted-foreground outline-none cursor-pointer",
                className,
            )}>
            {visible.map((fund) => (
                <option key={fund.id} value={fund.id}>
                    {fund.icon} {fund.name}
                </option>
            ))}
            {hidden.length > 0 && (
                <optgroup label={SET_ASIDE_LABEL}>
                    {hidden.map((fund) => (
                        <option key={fund.id} value={fund.id}>
                            {fund.icon} {fund.name}
                        </option>
                    ))}
                </optgroup>
            )}
        </select>
    );
};

interface FundBalanceWarningProps {
    /** Fund balance in the account after this spend or transfer */
    balanceAfter: number;
    fundName: string;
    accountName: string;
    formatCurrency: (amount: number) => string;
}

/** Warns (never blocks) when money would leave a fund it doesn't have there */
export const FundBalanceWarning = ({
    balanceAfter,
    fundName,
    accountName,
    formatCurrency,
}: FundBalanceWarningProps) => {
    if (balanceAfter >= 0) return null;
    return (
        <p className="text-xs text-amber-500">
            This leaves {fundName} in {accountName} at{" "}
            {formatCurrency(balanceAfter)}.
        </p>
    );
};
