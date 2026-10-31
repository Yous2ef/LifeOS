import type { Expense, Income } from "@/types/modules/finance";

const toDay = (date: Date): string => date.toISOString().split("T")[0];

export const calculateNextOccurrence = (
    currentDate: string,
    frequency: string,
): string => {
    const date = new Date(currentDate);
    switch (frequency) {
        case "daily":
            date.setDate(date.getDate() + 1);
            break;
        case "weekly":
            date.setDate(date.getDate() + 7);
            break;
        case "bi-weekly":
            date.setDate(date.getDate() + 14);
            break;
        case "quarterly":
            date.setMonth(date.getMonth() + 3);
            break;
        case "yearly":
            date.setFullYear(date.getFullYear() + 1);
            break;
        case "monthly":
        default:
            date.setMonth(date.getMonth() + 1);
    }
    return toDay(date);
};

/**
 * Generated occurrences get a deterministic id (template id + date) so two
 * devices — or two mounted hooks — generating the same occurrence produce the
 * same record, which cloud merge then keeps once.
 */
export const occurrenceId = (templateId: string, date: string): string =>
    `${templateId}_${date}`;

interface Template {
    id: string;
    nextOccurrence?: string;
}

/**
 * Walks every due occurrence of each template up to `today`, creating the
 * missing ones and advancing `nextOccurrence`. Returns null when nothing changes.
 */
const applyRecurring = <T extends Template>(
    items: T[],
    today: Date,
    options: {
        isActiveTemplate: (item: T) => boolean;
        frequencyOf: (item: T) => string;
        baseDateOf: (item: T) => string;
        alreadyExists: (template: T, date: string, items: T[]) => boolean;
        createOccurrence: (template: T, date: string, now: string) => T;
    },
): T[] | null => {
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const now = new Date().toISOString();

    const created: T[] = [];
    const nextById = new Map<string, string>();

    items.filter(options.isActiveTemplate).forEach((template) => {
        const frequency = options.frequencyOf(template);
        let nextDate = new Date(
            template.nextOccurrence ??
                calculateNextOccurrence(options.baseDateOf(template), frequency),
        );

        while (nextDate <= startOfToday) {
            const dateStr = toDay(nextDate);
            const exists =
                items.some((i) => i.id === occurrenceId(template.id, dateStr)) ||
                options.alreadyExists(template, dateStr, items);
            if (!exists) {
                created.push(options.createOccurrence(template, dateStr, now));
            }
            nextDate = new Date(calculateNextOccurrence(dateStr, frequency));
        }

        const nextStr = toDay(nextDate);
        if (template.nextOccurrence !== nextStr) {
            nextById.set(template.id, nextStr);
        }
    });

    if (created.length === 0 && nextById.size === 0) return null;

    return [
        ...items.map((item) =>
            nextById.has(item.id)
                ? { ...item, nextOccurrence: nextById.get(item.id), updatedAt: now }
                : item,
        ),
        ...created,
    ];
};

const withAutoNote = (notes: string | undefined, kind: string) =>
    `${notes ? notes + " | " : ""}Auto-generated from recurring ${kind}`;

export const applyRecurringIncomes = (
    incomes: Income[],
    today: Date = new Date(),
): Income[] | null =>
    applyRecurring(incomes, today, {
        isActiveTemplate: (inc) =>
            inc.isRecurring &&
            inc.frequency !== "one-time" &&
            (!inc.recurringEndDate || new Date(inc.recurringEndDate) >= today),
        frequencyOf: (inc) => inc.frequency,
        baseDateOf: (inc) => inc.actualDate || inc.createdAt,
        // Occurrences generated before ids were deterministic
        alreadyExists: (template, date, all) =>
            all.some(
                (inc) =>
                    inc.title === template.title &&
                    inc.amount === template.amount &&
                    inc.actualDate === date,
            ),
        createOccurrence: (template, date, now) => ({
            ...template,
            id: occurrenceId(template.id, date),
            status: "received",
            actualDate: date,
            expectedDate: undefined,
            isRecurring: false,
            nextOccurrence: undefined,
            createdAt: now,
            updatedAt: now,
            notes: withAutoNote(template.notes, "income"),
        }),
    });

export const applyRecurringExpenses = (
    expenses: Expense[],
    today: Date = new Date(),
): Expense[] | null =>
    applyRecurring(expenses, today, {
        isActiveTemplate: (exp) =>
            exp.isRecurring &&
            !!exp.recurringFrequency &&
            (!exp.recurringEndDate || new Date(exp.recurringEndDate) >= today),
        frequencyOf: (exp) => exp.recurringFrequency || "monthly",
        baseDateOf: (exp) => exp.date,
        alreadyExists: (template, date, all) =>
            all.some(
                (exp) =>
                    exp.title === template.title &&
                    exp.amount === template.amount &&
                    exp.categoryId === template.categoryId &&
                    exp.date === date,
            ),
        createOccurrence: (template, date, now) => ({
            ...template,
            id: occurrenceId(template.id, date),
            date,
            isRecurring: false,
            recurringFrequency: undefined,
            nextOccurrence: undefined,
            createdAt: now,
            updatedAt: now,
            notes: withAutoNote(template.notes, "expense"),
        }),
    });
