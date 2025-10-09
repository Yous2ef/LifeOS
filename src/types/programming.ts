// Programming & Learning Module Types

export interface LearningItem {
    id: string;
    title: string;
    type:
        | "course"
        | "video"
        | "book"
        | "tutorial"
        | "article"
        | "documentation";
    platform?: string; // Udemy, YouTube, etc.
    url?: string;
    author?: string;
    description?: string;
    status: "to-start" | "in-progress" | "completed" | "on-hold";
    priority: number; // 1-10
    progress: number; // 0-100
    totalDuration?: number; // in minutes
    timeSpent: number; // in minutes
    startDate?: string;
    completedDate?: string;
    dueDate?: string;
    tags: string[];
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Skill {
    id: string;
    name: string;
    category:
        | "frontend"
        | "backend"
        | "database"
        | "devops"
        | "design"
        | "soft-skills"
        | "other";
    currentLevel: number; // 0-100
    targetLevel: number; // 0-100
    priority: number; // 1-10
    relatedItems: string[]; // LearningItem IDs
    notes?: string;
    lastPracticed?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Tool {
    id: string;
    name: string;
    category:
        | "frontend"
        | "backend"
        | "database"
        | "devops"
        | "design"
        | "testing"
        | "other";
    status: "to-learn" | "learning" | "comfortable" | "proficient" | "mastered";
    priority: number; // 1-10
    version?: string;
    documentation?: string;
    notes?: string;
    learningResources: string[]; // URLs
    projects: string[]; // CodingProject IDs where this tool was used
    startDate?: string;
    masteredDate?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CodingProject {
    id: string;
    title: string;
    description?: string;
    type: "personal" | "practice" | "portfolio" | "client" | "open-source";
    status: "to-do" | "in-progress" | "completed";
    priority: number; // 1-10
    repositoryUrl?: string;
    liveUrl?: string;
    technologies: string[]; // Tool names
    features: string[];
    tasks: ProjectTask[];
    startDate?: string;
    completedDate?: string;
    dueDate?: string;
    estimatedHours?: number;
    actualHours: number;
    learnings?: string;
    challenges?: string;
    screenshots: string[]; // URLs
    createdAt: string;
    updatedAt: string;
}

export interface ProjectTask {
    id: string;
    title: string;
    description?: string;
    status: "todo" | "in-progress" | "done";
    completed: boolean;
    priority: number; // 1-10
    estimatedMinutes?: number; // Changed from hours to minutes
    actualMinutes: number; // Changed from hours to minutes, default 0
    timeEntries: TimeEntry[]; // Track work sessions
    createdAt: string;
    completedAt?: string;
}

export interface TimeEntry {
    id: string;
    minutes: number;
    note?: string;
    date: string;
}

export interface ProgrammingStats {
    totalLearningItems: number;
    completedLearningItems: number;
    inProgressLearningItems: number;
    totalSkills: number;
    averageSkillLevel: number;
    totalTools: number;
    masteredTools: number;
    totalProjects: number;
    completedProjects: number;
    totalTimeSpent: number; // in minutes
    completionRate: number; // percentage
}

// Storage structure for localStorage
export interface ProgrammingData {
    learningItems: LearningItem[];
    skills: Skill[];
    tools: Tool[];
    projects: CodingProject[];
}
