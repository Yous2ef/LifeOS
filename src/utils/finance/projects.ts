import type { FinanceData, FinanceProject } from "@/types/modules/finance";

/** Active projects first (newest first), then done ones */
export const sortProjects = (projects: FinanceProject[]): FinanceProject[] =>
    [...projects].sort(
        (a, b) =>
            Number(a.status === "done") - Number(b.status === "done") ||
            b.createdAt.localeCompare(a.createdAt),
    );

/** Why a project can't be deleted, or null when nothing references it */
export const getProjectDeleteBlocker = (
    data: Pick<FinanceData, "incomes" | "expenses">,
    projectId: string,
): string | null =>
    data.incomes.some((income) => income.projectId === projectId) ||
    data.expenses.some((expense) => expense.projectId === projectId)
        ? "This project has transactions. Mark it done instead."
        : null;
