import type { DeletedRecord, FinanceData } from "@/types/modules/finance";

type Row = { id: string; updatedAt?: string; createdAt?: string };

const isRowArray = (value: unknown): value is Row[] =>
    Array.isArray(value) &&
    value.every(
        (item) =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as Row).id === "string",
    );

const stamp = (row: Row): string => row.updatedAt ?? row.createdAt ?? "";

/** Union by id; when both sides have a row, the newer `updatedAt` wins (local on ties). */
const mergeRows = (local: Row[], cloud: Row[]): Row[] => {
    const merged = new Map<string, Row>();
    local.forEach((row) => merged.set(row.id, row));
    cloud.forEach((row) => {
        const existing = merged.get(row.id);
        if (!existing || stamp(row) > stamp(existing)) merged.set(row.id, row);
    });
    return Array.from(merged.values());
};

const mergeTombstones = (
    local: DeletedRecord[] = [],
    cloud: DeletedRecord[] = [],
): DeletedRecord[] => {
    const merged = new Map<string, DeletedRecord>();
    [...local, ...cloud].forEach((record) => {
        const existing = merged.get(record.id);
        if (!existing || record.deletedAt > existing.deletedAt) {
            merged.set(record.id, record);
        }
    });
    return Array.from(merged.values());
};

/**
 * Merges two copies of the finance module (local device and cloud).
 *
 * - Import/reset stamp `replacedAt`; the side replaced most recently wins whole,
 *   so a union can't pull back records the replace removed.
 * - Otherwise every top-level array is merged by id, then rows whose tombstone
 *   is at least as new as the row are dropped (a restored row is re-saved with a
 *   fresh `updatedAt`, so undo survives a sync).
 */
export const mergeFinanceData = (
    local: Partial<FinanceData>,
    cloud: Partial<FinanceData>,
): Partial<FinanceData> => {
    const localReplaced = local.replacedAt ?? "";
    const cloudReplaced = cloud.replacedAt ?? "";
    if (localReplaced !== cloudReplaced) {
        return localReplaced > cloudReplaced ? local : cloud;
    }

    const deleted = mergeTombstones(local.deleted, cloud.deleted);
    const deletedAt = new Map(deleted.map((d) => [d.id, d.deletedAt]));
    const isDeleted = (row: Row) => {
        const at = deletedAt.get(row.id);
        return at !== undefined && at >= stamp(row);
    };

    const merged: Record<string, unknown> = { ...cloud, ...local };
    const keys = new Set([...Object.keys(local), ...Object.keys(cloud)]);
    keys.delete("deleted");

    keys.forEach((key) => {
        const localValue = (local as Record<string, unknown>)[key];
        const cloudValue = (cloud as Record<string, unknown>)[key];
        const localRows = localValue ?? [];
        const cloudRows = cloudValue ?? [];
        if (!isRowArray(localRows) || !isRowArray(cloudRows)) return;
        merged[key] = mergeRows(localRows, cloudRows).filter(
            (row) => !isDeleted(row),
        );
    });

    merged.settings = {
        ...(cloud.settings ?? {}),
        ...(local.settings ?? {}),
    };
    merged.deleted = deleted;

    return merged as Partial<FinanceData>;
};
