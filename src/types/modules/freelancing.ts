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

// Freelancer profile information
export interface FreelancerProfile {
    name: string;
    title: string;
    email: string;
    phone: string;
    portfolioUrl: string;
    cvVersions: Array<{
        id: string;
        name: string;
        url: string;
        uploadDate: string;
    }>;
    platforms: Array<{
        id: string;
        platform: string;
        username: string;
        profileUrl: string;
    }>;
}

// Job application tracking
export interface JobApplication {
    id: string;
    title: string;
    company: string;
    platform: string;
    url: string;
    status: "interested" | "applied" | "interview" | "rejected" | "accepted";
    appliedDate?: string;
    salary?: string;
    notes: string;
    followUpDate?: string;
    createdAt: string;
}

// Simplified project for AppData (detailed version is Project interface)
export interface SimpleProject {
    id: string;
    name: string;
    client: string;
    description: string;
    deadline: string;
    payment: number;
    status: "planning" | "in-progress" | "review" | "completed" | "paid";
    progress: number;
    milestones: Array<{
        id: string;
        title: string;
        completed: boolean;
        dueDate: string;
    }>;
    timeTracked: number;
    createdAt: string;
}

// Main freelancing data structure
export interface FreelancingData {
    profile: FreelancerProfile;
    applications: JobApplication[];
    projects: Project[]; // Use full Project type (not SimpleProject)
    projectTasks: ProjectTask[]; // Tasks belonging to projects
    standaloneTasks: StandaloneTask[]; // Standalone tasks
}
