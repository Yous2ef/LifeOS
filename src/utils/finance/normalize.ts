import type { DeletedRecord, FinanceData } from "@/types/modules/finance";
import { getDefaultFinanceData } from "./defaults";

/**
 * Fills every missing finance field with its default so readers and updaters
 * never see an undefined array (cloud data can arrive without newer fields).
 * Pure: no migration, no id generation beyond the fixed-id defaults.
 */
export const normalizeFinanceData = (
    raw?: Partial<FinanceData> | null,
): FinanceData => {
    const defaults = getDefaultFinanceData();
    const data = raw ?? {};

    return {
        ...defaults,
        ...data,
        accounts: data.accounts ?? defaults.accounts,
        transfers: data.transfers ?? defaults.transfers,
        incomes: data.incomes ?? defaults.incomes,
        expenses: data.expenses ?? defaults.expenses,
        categories: data.categories ?? defaults.categories,
        incomeCategories: data.incomeCategories ?? defaults.incomeCategories,
        installments: data.installments ?? defaults.installments,
        budgets: data.budgets ?? defaults.budgets,
        goals: data.goals ?? defaults.goals,
        alerts: data.alerts ?? defaults.alerts,
        settings: { ...defaults.settings, ...(data.settings ?? {}) },
        deleted: data.deleted ?? [],
    };
};

/** Returns tombstones for `ids`, replacing older tombstones of the same ids. */
export const addTombstones = (
    deleted: DeletedRecord[] | undefined,
    ids: string[],
    deletedAt: string = new Date().toISOString(),
): DeletedRecord[] => {
    const idSet = new Set(ids);
    return [
        ...(deleted ?? []).filter((record) => !idSet.has(record.id)),
        ...ids.map((id) => ({ id, deletedAt })),
    ];
};
