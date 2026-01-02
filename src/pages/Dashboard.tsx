import { useMemo } from "react";
import { Separator } from "@/components/ui/separator";
import { FinanceWidget } from "@/components/finance/FinanceWidget";
import { LoginPromptBanner } from "@/components/auth";
import { useApp } from "../context/AppContext";
import {
    getGreeting,
    getRandomQuote,
    formatDate,
    getDaysUntil,
    isDateToday,
} from "../utils/helpers";
import { UrgentNotifications } from "@/components/dashboard/UrgentNotifications";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { AdditionalStats } from "@/components/dashboard/AdditionalStats";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import type { DashboardStats } from "@/types/dashboard";

export const Dashboard = () => {
    const { data } = useApp();
    const greeting = getGreeting();
    const quote = useMemo(() => getRandomQuote(), []);
    const currentTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });

    // Get data from unified AppContext
    const programmingData = useMemo(() => {
        return (
            data.programming || {
                learningItems: [],
                skills: [],
                tools: [],
                projects: [],
            }
        );
    }, [data.programming]);

    const freelancingProjects = useMemo(() => {
        return data.freelancing?.projects || [];
    }, [data.freelancing]);

    // Get finance data from unified AppContext


    // Calculate comprehensive stats
    const stats: DashboardStats = useMemo(() => {
        // University stats
        const universityTasksCompleted = data.university.tasks.filter(
            (t) => t.status === "done"
        ).length;
        const universityTasksTotal = data.university.tasks.length;
        const universityTasksActive =
            universityTasksTotal - universityTasksCompleted;

        const todayTasks = data.university.tasks.filter(
            (task) =>
                task.status !== "done" &&
                task.dueDate &&
                isDateToday(task.dueDate)
        ).length;

        const upcomingExams = data.university.exams.filter((exam) => {
            const daysUntil = getDaysUntil(exam.date);
            return daysUntil >= 0 && daysUntil <= 7;
        }).length;

        // Freelancing stats
        const activeProjects = freelancingProjects.filter(
            (p: any) => p.status === "in-progress" || p.status === "todo"
        ).length;
        const completedProjects = freelancingProjects.filter(
            (p: any) => p.status === "completed" || p.status === "done"
        ).length;
        const totalRevenue = freelancingProjects
            .filter((p: any) => p.status === "completed" || p.status === "done")
            .reduce((sum: number, p: any) => sum + (p.expectedProfit || 0), 0);
        
        const totalFreelancingProjects = freelancingProjects.length;

        const pendingApplications = data.freelancing.applications.filter(
            (a) => a.status === "applied" || a.status === "interested"
        ).length;

        // Programming stats
        const learningInProgress =
            (programmingData.learningItems?.filter(
                (r: any) =>
                    r.status === "in-progress" || r.status === "to-start"
            ).length || 0) +
            (programmingData.projects?.filter(
                (p: any) => p.status === "in-progress" || p.status === "to-do"
            ).length || 0);
        const learningCompleted =
            programmingData.learningItems?.filter(
                (r: any) => r.status === "completed"
            ).length || 0;
        const programmingProjects =
            programmingData.projects?.filter(
                (p: any) => p.status === "in-progress" || p.status === "to-do"
            ).length || 0;
        const totalSkills = programmingData.skills?.length || 0;

        // Home stats
        const homeTasksActive = data.home.tasks.filter(
            (t) => t.status !== "done"
        ).length;
        const activeGoals = data.home.goals.filter(
            (g) => g.progress < 100
        ).length;
        const activeHabits = data.home.habits.filter(
            (h) => h.streak > 0
        ).length;

        // Misc stats
        const totalNotes = data.misc.notes.length;
        const totalBookmarks = data.misc.bookmarks.length;
        const quickCaptures = data.misc.quickCaptures.length;

        // Overall completion rate
        const totalTasks = universityTasksTotal + homeTasksActive;
        const completedTasks = universityTasksCompleted;
        const completionRate =
            totalTasks > 0
                ? Math.round((completedTasks / totalTasks) * 100)
                : 0;

        return {
            // University
            universityTasksCompleted,
            universityTasksTotal,
            universityTasksActive,
            todayTasks,
            upcomingExams,

            // Freelancing
            activeProjects,
            completedProjects,
            totalFreelancingProjects,
            totalRevenue,
            pendingApplications,

            // Programming
            learningInProgress,
            learningCompleted,
            programmingProjects,
            totalSkills,

            // Home
            homeTasksActive,
            activeGoals,
            activeHabits,

            // Misc
            totalNotes,
            totalBookmarks,
            quickCaptures,

            // Overall
            completionRate,
        };
    }, [data, programmingData, freelancingProjects]);


    
    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground">
                            {greeting}, {data.settings.userName || "there"}! 👋
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            {formatDate(new Date())} • {currentTime}
                        </p>
                    </div>
                </div>
                <p className="text-lg text-muted-foreground italic">
                    "{quote}"
                </p>
            </div>

            <Separator />

            {/* Login Prompt for Guest Users */}
            <LoginPromptBanner />

            {/* Urgent Notifications */}
            <UrgentNotifications />

            {/* Stats Cards */}
            <StatsCards stats={stats} />

            {/* Additional Stats Grid */}
            <AdditionalStats stats={stats} />

            {/* Upcoming Deadlines & Finance Grid */}
            <div className="grid gap-4 md:grid-cols-7">
                <UpcomingDeadlines 
                    universityData={data.university} 
                    className="col-span-full lg:col-span-4" 
                />

                <div className="col-span-full lg:col-span-3">
                    <FinanceWidget />
                </div>
            </div>
        </div>
    );
};
