export interface DashboardStats {
    // University
    universityTasksCompleted: number;
    universityTasksTotal: number;
    universityTasksActive: number;
    todayTasks: number;
    upcomingExams: number;

    // Freelancing
    activeProjects: number;
    completedProjects: number;
    totalFreelancingProjects: number;
    totalRevenue: number;
    pendingApplications: number;

    // Programming
    learningInProgress: number;
    learningCompleted: number;
    programmingProjects: number;
    totalSkills: number;

    // Home
    homeTasksActive: number;
    activeGoals: number;
    activeHabits: number;

    // Misc
    totalNotes: number;
    totalBookmarks: number;
    quickCaptures: number;

    // Overall
    completionRate: number;
}
