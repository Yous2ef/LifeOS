import type { Account, Fund } from "@/types/modules/finance";
import { FUND_ME_ID } from "./defaults";

/**
 * Categories used most recently first (by when the record was entered), then
 * the never-used ones in their own order.
 */
export const recentFirst = <C extends { id: string }>(
    categories: C[],
    records: { categoryId: string; createdAt: string }[],
): C[] => {
    const lastUsed = new Map<string, string>();
    records.forEach((record) => {
        const seen = lastUsed.get(record.categoryId);
        if (!seen || record.createdAt > seen) {
            lastUsed.set(record.categoryId, record.createdAt);
        }
    });
    const used = categories
        .filter((c) => lastUsed.has(c.id))
        .sort((a, b) =>
            (lastUsed.get(b.id) ?? "").localeCompare(lastUsed.get(a.id) ?? ""),
        );
    return [...used, ...categories.filter((c) => !lastUsed.has(c.id))];
};

/** Last account and fund used for a new entry of one kind, kept per device */
export interface QuickAddMemory {
    accountId?: string;
    fundId?: string;
}

// Remembered per kind so a Charity-fund expense never preselects Charity for
// the next income
export type QuickAddKind = "expense" | "income" | "transfer";

const MEMORY_KEY = "lifeos-finance-quick-add";

const readAll = (): Partial<Record<QuickAddKind, QuickAddMemory>> => {
    try {
        const parsed: unknown = JSON.parse(
            localStorage.getItem(MEMORY_KEY) ?? "{}",
        );
        return parsed && typeof parsed === "object"
            ? (parsed as Partial<Record<QuickAddKind, QuickAddMemory>>)
            : {};
    } catch {
        return {};
    }
};

export const readQuickAddMemory = (kind: QuickAddKind): QuickAddMemory => {
    const entry: unknown = readAll()[kind];
    if (!entry || typeof entry !== "object") return {};
    const { accountId, fundId } = entry as Record<string, unknown>;
    return {
        accountId: typeof accountId === "string" ? accountId : undefined,
        fundId: typeof fundId === "string" ? fundId : undefined,
    };
};

export const rememberQuickAdd = (
    kind: QuickAddKind,
    memory: QuickAddMemory,
): void => {
    try {
        localStorage.setItem(
            MEMORY_KEY,
            JSON.stringify({ ...readAll(), [kind]: memory }),
        );
    } catch {
        // Private mode or full storage: the next entry just uses the defaults
    }
};

/** The remembered account while it's still active, else the default one */
export const pickAccountId = (
    accounts: Account[],
    rememberedId?: string,
): string => {
    const active = accounts.filter((a) => a.isActive);
    return (
        active.find((a) => a.id === rememberedId)?.id ??
        active.find((a) => a.isDefault)?.id ??
        active[0]?.id ??
        ""
    );
};

/** The remembered fund while it still exists (and isn't `exclude`), else Me */
export const pickFundId = (
    funds: Fund[],
    rememberedId?: string,
    exclude?: string,
): string =>
    funds.find((f) => f.id === rememberedId && f.id !== exclude)?.id ??
    FUND_ME_ID;
