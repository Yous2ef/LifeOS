/**
 * University Module Types for LifeOS
 *
 * Contains all types related to academic/university management including:
 * - Academic years and terms
 * - Subjects and schedules
 * - Tasks and assignments
 * - Exams and grades
 */

// Academic Year and Term Types
export interface AcademicYear {
    id: string;
    name: string; // User customizable: "Year 1", "2024-2025", etc.
    order: number; // For sorting
    isActive?: boolean; // Currently enrolled year
    createdAt: string;
}

export interface Term {
    id: string;
    yearId: string; // Links to AcademicYear
    name: string; // User customizable: "Term 1", "Fall", "Semester 1", etc.
    order: number; // For sorting within year
    startDate?: string; // Optional date range
    endDate?: string;
    createdAt: string;
}

// Schedule Entry Type (for lectures and sections)
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

// Resource Type (for subject materials)
export interface Resource {
    id: string;
    title: string;
    url: string;
    description?: string;
}

// Subject Type
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
    yearId?: string; // Academic year this subject belongs to (undefined = Unassigned)
    termId?: string; // Term this subject belongs to (undefined = Unassigned)
}

// University Task Type
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

// Exam Type
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

// University Module Data Structure
export interface UniversityData {
    subjects: Subject[];
    tasks: UniversityTask[];
    exams: Exam[];
    gradeEntries: GradeEntry[];
    academicYears: AcademicYear[];
    terms: Term[];
    currentYearId?: string; // Selected year filter (undefined = All)
    currentTermId?: string; // Selected term filter (undefined = All)
}
