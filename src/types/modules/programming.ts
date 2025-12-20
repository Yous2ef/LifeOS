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

// Learning resource tracking
export interface LearningResource {
    id: string;
    title: string;
    type: "video" | "article" | "documentation" | "challenge";
    url: string;
    platform: string;
    status: "not-started" | "in-progress" | "completed";
    progress: number;
    priority: "low" | "medium" | "high";
    notes: string;
    createdAt: string;
}

// Technology/framework tracking
export interface Technology {
    id: string;
    name: string;
    category: string;
    proficiency: number;
    learningGoal: string;
    resources: string[];
    lastPracticed: string;
    createdAt: string;
}

// Simple project for AppData (detailed version is CodingProject)
export interface SimpleProject {
    id: string;
    name: string;
    description: string;
    status: "planning" | "in-progress" | "completed" | "on-hold";
    technologies: string[];
    githubUrl?: string;
    deployUrl?: string;
    nextSteps: string[];
    progress: number;
    createdAt: string;
    updatedAt: string;
}

// Simple skill for AppData (detailed version is Skill)
export interface SimpleSkill {
    id: string;
    name: string;
    category: string;
    level: number;
    targetLevel: number;
    practiceGoal: string;
}

// Storage structure for localStorage (legacy format)
export interface ProgrammingData {
    learningItems: LearningItem[];
    skills: Skill[];
    tools: Tool[];
    projects: CodingProject[];
}

// Main programming data structure for AppData
export interface ProgrammingModuleData {
    learningResources: LearningResource[];
    technologies: Technology[];
    projects: SimpleProject[];
    skills: SimpleSkill[];
}
