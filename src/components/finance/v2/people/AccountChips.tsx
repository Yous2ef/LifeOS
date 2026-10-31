import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/Label";
import type { Account } from "@/types/modules/finance";

interface AccountChipsProps {
    accounts: Account[];
    value: string;
    onChange: (accountId: string) => void;
    /** Kept selectable even when archived (the record being edited uses it) */
    keepAccountId?: string;
    label?: string;
}

/** Account picker chips for the loan forms (active accounts only) */
export const AccountChips = ({
    accounts,
    value,
    onChange,
    keepAccountId,
    label = "Account",
}: AccountChipsProps) => (
    <div>
        <Label className="text-xs text-muted-foreground mb-2 block">
            {label}
        </Label>
        <div className="flex gap-2 overflow-x-auto px-1 py-1">
            {accounts
                .filter((a) => a.isActive || a.id === keepAccountId)
                .map((account) => (
                    <button
                        key={account.id}
                        type="button"
                        onClick={() => onChange(account.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all",
                            value === account.id
                                ? "bg-violet-500/20 ring-2 ring-violet-500"
                                : "bg-muted/50 hover:bg-muted",
                        )}>
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: account.color }}
                        />
                        <span className="text-sm font-medium">
                            {account.name}
                        </span>
                    </button>
                ))}
        </div>
    </div>
);
