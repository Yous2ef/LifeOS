import { cn } from "@/lib/utils";

interface AmountInputProps {
    value: number;
    onChange: (amount: number) => void;
    currency: string;
    className?: string;
}

/** Large amount field of the loan forms */
export const AmountInput = ({
    value,
    onChange,
    currency,
    className,
}: AmountInputProps) => (
    <div className={cn("text-4xl font-bold text-violet-500", className)}>
        <span className="text-2xl text-muted-foreground mr-1">{currency}</span>
        <input
            type="number"
            inputMode="decimal"
            min="0"
            value={value || ""}
            onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
            placeholder="0"
            aria-label="Amount"
            className="bg-transparent text-center w-40 outline-none text-4xl font-bold"
        />
    </div>
);
