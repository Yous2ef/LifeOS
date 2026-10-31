import type { DeletedRecord, FinanceData, Fund } from "@/types/modules/finance";
import { FUND_ME_ID, getDefaultFinanceData, getDefaultMeFund } from "./defaults";

// Me is ensured here, not in the first-run migration, so data from any device
// or backup always has the fund that records without a fundId belong to.
const withMeFund = (funds: Fund[] | undefined): Fund[] => {
    const list = funds ?? [];
    return list.some((fund) => fund.id === FUND_ME_ID)
        ? list
        : [getDefaultMeFund(), ...list];
};

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
        funds: withMeFund(data.funds),
        incomes: data.incomes ?? defaults.incomes,
        expenses: data.expenses ?? defaults.expenses,
        categories: data.categories ?? defaults.categories,
        incomeCategories: data.incomeCategories ?? defaults.incomeCategories,
        installments: data.installments ?? defaults.installments,
        budgets: data.budgets ?? defaults.budgets,
        goals: data.goals ?? defaults.goals,
        alerts: data.alerts ?? defaults.alerts,
        settings: {
            ...defaults.settings,
            ...(data.settings ?? {}),
            focusedFundIds:
                data.settings?.focusedFundIds ??
                defaults.settings.focusedFundIds,
        },
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
