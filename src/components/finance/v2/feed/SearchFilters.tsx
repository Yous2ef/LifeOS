import type { ReactNode } from "react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/switch";
import type {
    Account,
    ExpenseCategory,
    FinanceProject,
    Fund,
    IncomeCategory,
    TransactionType,
} from "@/types/modules/finance";
import type { SearchFilters as Filters } from "@/utils/finance/search";
import { Chip } from "../controls/Chip";

/** "period" = the header's date range */
export type DateMode = "period" | "any" | "custom";

export interface SearchOptions {
    accounts: Account[];
    funds: Fund[];
    expenseCategories: ExpenseCategory[];
    incomeCategories: IncomeCategory[];
    projects: FinanceProject[];
    people: { id: string; name: string }[];
    /** Charity tracking is on: offer "Work costs only" */
    showWorkCost: boolean;
}

const TYPE_LABELS: Record<TransactionType, string> = {
    income: "Income",
    expense: "Expense",
    transfer: "Transfer",
    loan: "Loan",
    opening: "Opening balance",
};

const COPY = {
    type: "Type",
    account: "Account",
    allAccounts: "All accounts",
    fund: "Fund",
    allFunds: "All funds",
    category: "Category",
    allCategories: "All categories",
    expenseGroup: "Expense",
    incomeGroup: "Income",
    project: "Project",
    allProjects: "All projects",
    amount: "Amount",
    min: "Min",
    max: "Max",
    date: "Date",
    anyDate: "Any date",
    custom: "Custom",
    from: "From",
    to: "To",
    workCostOnly: "Work costs only",
    clear: "Clear filters",
};

const selectClass =
    "w-full h-9 rounded-xl bg-muted/50 px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60";

interface SearchFiltersProps {
    filters: Filters;
    onChange: (filters: Filters) => void;
    dateMode: DateMode;
    onDateModeChange: (mode: DateMode) => void;
    periodLabel: string;
    options: SearchOptions;
    /** Set while an account card is selected: the feed is locked to it */
    lockedAccountId?: string;
    onClear: () => void;
    /** For the Filters button's aria-controls */
    id?: string;
}

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
    <div>
        <Label className="text-xs text-muted-foreground mb-1.5 block">
            {label}
        </Label>
        {children}
    </div>
);

const toAmount = (value: string): number | undefined =>
    value === "" || Number.isNaN(Number(value)) ? undefined : Number(value);

export const SearchFilters = ({
    filters,
    onChange,
    dateMode,
    onDateModeChange,
    periodLabel,
    options,
    lockedAccountId,
    onClear,
    id,
}: SearchFiltersProps) => {
    const set = (patch: Partial<Filters>) => onChange({ ...filters, ...patch });
    const toggleType = (type: TransactionType) =>
        set({
            types: filters.types.includes(type)
                ? filters.types.filter((t) => t !== type)
                : [...filters.types, type],
        });

    return (
        <div
            id={id}
            className="space-y-4 p-4 rounded-2xl bg-muted/20 border border-border/50">
            <Field label={COPY.type}>
                <div className="flex flex-wrap gap-2">
                    {(Object.keys(TYPE_LABELS) as TransactionType[]).map(
                        (type) => (
                            <Chip
                                key={type}
                                active={filters.types.includes(type)}
                                onClick={() => toggleType(type)}>
                                {TYPE_LABELS[type]}
                            </Chip>
                        ),
                    )}
                </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label={COPY.account}>
                    <select
                        aria-label={COPY.account}
                        className={selectClass}
                        disabled={!!lockedAccountId}
                        value={lockedAccountId ?? filters.accountId ?? ""}
                        onChange={(e) =>
                            set({ accountId: e.target.value || undefined })
                        }>
                        <option value="">{COPY.allAccounts}</option>
                        {options.accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.name}
                            </option>
                        ))}
                    </select>
                </Field>

                {options.funds.length > 1 && (
                    <Field label={COPY.fund}>
                        <select
                            aria-label={COPY.fund}
                            className={selectClass}
                            value={filters.fundId ?? ""}
                            onChange={(e) =>
                                set({ fundId: e.target.value || undefined })
                            }>
                            <option value="">{COPY.allFunds}</option>
                            {options.funds.map((f) => (
                                <option key={f.id} value={f.id}>
                                    {f.icon} {f.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                )}

                <Field label={COPY.category}>
                    <select
                        aria-label={COPY.category}
                        className={selectClass}
                        value={filters.categoryId ?? ""}
                        onChange={(e) =>
                            set({ categoryId: e.target.value || undefined })
                        }>
                        <option value="">{COPY.allCategories}</option>
                        <optgroup label={COPY.expenseGroup}>
                            {options.expenseCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.icon} {c.name}
                                </option>
                            ))}
                        </optgroup>
                        <optgroup label={COPY.incomeGroup}>
                            {options.incomeCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.icon} {c.name}
                                </option>
                            ))}
                        </optgroup>
                    </select>
                </Field>

                {options.projects.length > 0 && (
                    <Field label={COPY.project}>
                        <select
                            aria-label={COPY.project}
                            className={selectClass}
                            value={filters.projectId ?? ""}
                            onChange={(e) =>
                                set({ projectId: e.target.value || undefined })
                            }>
                            <option value="">{COPY.allProjects}</option>
                            {options.projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </Field>
                )}
            </div>

            <Field label={COPY.amount}>
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        placeholder={COPY.min}
                        aria-label={`${COPY.amount} ${COPY.min}`}
                        value={filters.minAmount ?? ""}
                        onChange={(e) =>
                            set({ minAmount: toAmount(e.target.value) })
                        }
                        className="h-9 rounded-xl bg-muted/50 border-0"
                    />
                    <span className="text-muted-foreground">–</span>
                    <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        placeholder={COPY.max}
                        aria-label={`${COPY.amount} ${COPY.max}`}
                        value={filters.maxAmount ?? ""}
                        onChange={(e) =>
                            set({ maxAmount: toAmount(e.target.value) })
                        }
                        className="h-9 rounded-xl bg-muted/50 border-0"
                    />
                </div>
            </Field>

            <Field label={COPY.date}>
                <div className="flex flex-wrap gap-2">
                    <Chip
                        active={dateMode === "period"}
                        onClick={() => onDateModeChange("period")}>
                        {periodLabel}
                    </Chip>
                    <Chip
                        active={dateMode === "any"}
                        onClick={() => onDateModeChange("any")}>
                        {COPY.anyDate}
                    </Chip>
                    <Chip
                        active={dateMode === "custom"}
                        onClick={() => onDateModeChange("custom")}>
                        {COPY.custom}
                    </Chip>
                </div>
                {dateMode === "custom" && (
                    <div className="flex items-center gap-2 mt-2">
                        <Input
                            type="date"
                            aria-label={COPY.from}
                            value={filters.from ?? ""}
                            onChange={(e) =>
                                set({ from: e.target.value || undefined })
                            }
                            className="h-9 rounded-xl bg-muted/50 border-0"
                        />
                        <span className="text-muted-foreground">–</span>
                        <Input
                            type="date"
                            aria-label={COPY.to}
                            value={filters.to ?? ""}
                            onChange={(e) =>
                                set({ to: e.target.value || undefined })
                            }
                            className="h-9 rounded-xl bg-muted/50 border-0"
                        />
                    </div>
                )}
            </Field>

            {options.showWorkCost && (
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                    <span className="text-sm">{COPY.workCostOnly}</span>
                    <Switch
                        checked={!!filters.workCostOnly}
                        onCheckedChange={(checked) =>
                            set({ workCostOnly: checked || undefined })
                        }
                    />
                </label>
            )}

            <button
                type="button"
                onClick={onClear}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {COPY.clear}
            </button>
        </div>
    );
};
