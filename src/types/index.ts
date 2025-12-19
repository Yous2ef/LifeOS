// Core Types for LifeOS

// University Module Types
export interface ScheduleEntry {
    day:
        | "Monday"
        | "Tuesday"
        | "Wednesday"
        | "Thursday"
        | "Friday"
        | "Saturday"
        | "Sunday";
    startTime: string; // Format: "HH:MM" (24-hour)
    endTime: string; // Format: "HH:MM" (24-hour)
    location: string;
}

export interface Resource {
    id: string;
    title: string;
    url: string;
    description?: string;
}

export interface Subject {
    id: string;
    name: string;
    professor: string;
    schedule: string; // Deprecated, kept for backward compatibility
    color: string;
    lectures?: ScheduleEntry[]; // Optional: Can have multiple lecture times
    sections?: ScheduleEntry[]; // Optional: Can have multiple section times
    description?: string; // Optional: Notes and description for the subject
    resources?: Resource[]; // Optional: Links and resources for the subject
    gradingScale?: number; // Total grade scale for this subject (default: 100)
    targetGrade?: number; // Target grade percentage to achieve
}

export interface UniversityTask {
    id: string;
    subjectId: string;
    title: string;
    description: string;
    type: "study" | "assignment" | "exam" | "notes";
    dueDate?: string; // Optional - not all tasks need a due date
    priority: number; // 1-10 scale
    status: "todo" | "in-progress" | "done";
    timeSpent: number; // in minutes
    createdAt: string;
}

export interface Exam {
    id: string;
    subjectId: string;
    title: string;
    date: string;
    duration: number;
    location: string;
    maxGrade: number; // Maximum grade for this exam
    grade?: number; // Grade obtained (optional until entered)
    taken?: boolean; // Whether the exam has been taken
    takenAt?: string; // When the exam was marked as taken
    gradeEnteredAt?: string; // When the grade was entered
}

// Grade Entry Types for additional grades (assignments, quizzes, etc.)
export type GradeEntryType =
    | "exam"
    | "assignment"
    | "quiz"
    | "sheet"
    | "attendance"
    | "participation"
    | "bonus"
    | "deduction"
    | "other";

export interface GradeEntry {
    id: string;
    subjectId: string;
    type: GradeEntryType;
    title: string;
    description?: string;
    pointsEarned: number; // Can be negative for deductions
    maxPoints?: number; // Optional for bonuses/deductions
    date: string;
    createdAt: string;
}

// Notification Settings Types
export interface NotificationSettings {
    dismissedNotifications: DismissedNotification[];
    neverShowAgain: string[]; // notification IDs to never show again
}

export interface DismissedNotification {
    id: string;
    dismissedAt: string;
    dismissUntil?: string; // When to show again (undefined = show on next session, null = never)
}

// Freelancing Module Types
export interface FreelanceProfile {
    name: string;
    title: string;
    email: string;
    phone: string;
    portfolioUrl: string;
    cvVersions: CVVersion[];
    platforms: PlatformAccount[];
}

export interface CVVersion {
    id: string;
    name: string;
    url: string;
    uploadDate: string;
}

export interface PlatformAccount {
    id: string;
    platform: string;
    username: string;
    profileUrl: string;
}

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

export interface FreelanceProject {
    id: string;
    name: string;
    client: string;
    description: string;
    deadline: string;
    payment: number;
    status: "planning" | "in-progress" | "review" | "completed" | "paid";
    progress: number;
    milestones: Milestone[];
    timeTracked: number; // in hours
    createdAt: string;
}

export interface Milestone {
    id: string;
    title: string;
    completed: boolean;
    dueDate: string;
}

// Programming Module Types
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

export interface Technology {
    id: string;
    name: string;
    category: string;
    proficiency: number; // 0-100
    learningGoal: string;
    resources: string[];
    lastPracticed: string;
    createdAt: string;
}

export interface ProgrammingProject {
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

export interface Skill {
    id: string;
    name: string;
    category: string;
    level: number; // 0-100
    targetLevel: number;
    practiceGoal: string;
}

// Home & Personal Life Module Types
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

// Miscellaneous Module Types
export interface Note {
    id: string;
    title: string;
    content: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

export interface Bookmark {
    id: string;
    title: string;
    url: string;
    category: string;
    tags: string[];
    createdAt: string;
}

export interface QuickCapture {
    id: string;
    content: string;
    module?: "university" | "freelancing" | "programming" | "home" | "misc";
    processed: boolean;
    createdAt: string;
}

// App Data Structure
export interface AppData {
    university: {
        subjects: Subject[];
        tasks: UniversityTask[];
        exams: Exam[];
        gradeEntries: GradeEntry[];
    };
    freelancing: {
        profile: FreelanceProfile;
        applications: JobApplication[];
        projects: FreelanceProject[];
    };
    programming: {
        learningResources: LearningResource[];
        technologies: Technology[];
        projects: ProgrammingProject[];
        skills: Skill[];
    };
    home: {
        tasks: HouseTask[];
        goals: PersonalGoal[];
        habits: Habit[];
    };
    misc: {
        notes: Note[];
        bookmarks: Bookmark[];
        quickCaptures: QuickCapture[];
    };
    settings: {
        theme: "light" | "dark";
        userName: string;
        email: string;
    };
}

// Toast notification type
export interface Toast {
    id: string;
    type: "success" | "error" | "info" | "warning";
    message: string;
    duration?: number;
}
