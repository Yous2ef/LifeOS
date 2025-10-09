// Freelancing Module Types

export type ProjectStatus = "todo" | "inProgress" | "done";
export type TaskStatus = "todo" | "inProgress" | "completed";
export type Currency = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "CNY";

export interface Project {
    id: string;
    name: string;
    clientName: string;
    description?: string;
    startDate?: string;
    deadline: string;
    status: ProjectStatus;
    expectedProfit: number;
    actualProfit?: number;
    currency: Currency;
    priority?: number; // 1-10 scale
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

export interface ProjectTask {
    id: string;
    projectId: string;
    title: string;
    description?: string;
    dueDate?: string;
    priority: number; // 1-10 scale
    status: TaskStatus; // Added for Kanban view support
    completed: boolean;
    timeEstimate?: number; // in hours
    createdAt: string;
    completedAt?: string;
}

export interface StandaloneTask {
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    priority: number; // 1-10 scale
    status: TaskStatus;
    tags: string[];
    timeEstimate?: number; // in hours
    createdAt: string;
    completedAt?: string;
}

export interface FinancialStats {
    totalExpected: number;
    totalEarned: number;
    projectsToDoCount: number;
    projectsInProgressCount: number;
    completedProjectsCount: number;
    averageProjectValue: number;
}
