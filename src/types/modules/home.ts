/**
 * Home Module Types for LifeOS
 *
 * Contains types for personal life management including:
 * - House tasks and chores
 * - Personal goals
 * - Habits tracking
 */

// House Task Type
export interface HouseTask {
    id: string;
    title: string;
    category: "chore" | "maintenance" | "shopping" | "bills";
    priority: "low" | "medium" | "high";
    dueDate?: string;
    status: "todo" | "done";
    recurring?: boolean;
    recurringPeriod?: "daily" | "weekly" | "monthly";
    createdAt: string;
}

// Personal Goal Type
export interface PersonalGoal {
    id: string;
    title: string;
    category: "health" | "fitness" | "hobby" | "personal";
    description: string;
    targetDate?: string;
    progress: number;
    milestones: string[];
    createdAt: string;
}

// Habit Tracking Type
export interface Habit {
    id: string;
    name: string;
    icon: string;
    frequency: "daily" | "weekly";
    streak: number;
    bestStreak: number;
    completedDates: string[];
    createdAt: string;
}

// Home Module Data Structure
export interface HomeData {
    tasks: HouseTask[];
    goals: PersonalGoal[];
    habits: Habit[];
}
