import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    GraduationCap,
    Briefcase,
    Code2,
    Home as HomeIcon,
    Clock,
    TrendingUp,
    Bell,
    Zap,
    ArrowRight,
    Calendar,
    AlertTriangle,
    BookOpen,
    Target,
} from "lucide-react";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { DismissMenu } from "../components/ui/DismissMenu";
import { useApp } from "../context/AppContext";
import {
    getGreeting,
    getRandomQuote,
    formatDate,
    getDaysUntil,
    isDateToday,
    isDateTomorrow,
} from "../utils/helpers";
import { cn } from "@/lib/utils";

export const Dashboard = () => {
    const {
        data,
        dismissedNotifications,
        dismissNotification,
        neverShowAgain,
    } = useApp();
    const navigate = useNavigate();
    const greeting = getGreeting();
    const quote = useMemo(() => getRandomQuote(), []);
    const currentTime = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });

    // Load data from separate storage keys
    const programmingData = useMemo(() => {
        try {
            const stored = localStorage.getItem("lifeos-programming-data");
            return stored
                ? JSON.parse(stored)
                : { learningItems: [], skills: [], tools: [], projects: [] };
        } catch {
            return { learningItems: [], skills: [], tools: [], projects: [] };
        }
    }, []);

    const freelancingProjects = useMemo(() => {
        try {
            const stored = localStorage.getItem("lifeos-freelancing-projects");
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }, []);

    const freelancingTasks = useMemo(() => {
        try {
            const stored = localStorage.getItem(
                "lifeos-freelancing-standalone-tasks"
            );
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }, []);

    // Calculate comprehensive stats
    const stats = useMemo(() => {
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

        // Freelancing stats (from separate storage)
        const activeProjects = freelancingProjects.filter(
            (p: any) => p.status === "in-progress" || p.status === "todo"
        ).length;
        const completedProjects = freelancingProjects.filter(
            (p: any) => p.status === "completed" || p.status === "done"
        ).length;
        const totalRevenue = freelancingProjects
            .filter((p: any) => p.status === "completed" || p.status === "done")
            .reduce((sum: number, p: any) => sum + (p.expectedProfit || 0), 0);

        const pendingApplications = data.freelancing.applications.filter(
            (a) => a.status === "applied" || a.status === "interested"
        ).length;

        // Programming stats (from separate storage)
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

    const modules = [
        {
            id: "university",
            name: "University",
            icon: GraduationCap,
            description: "Manage courses, tasks & exams",
            color: "from-purple-500 to-violet-600",
            stats: {
                label: "Active Tasks",
                value: data.university.tasks.filter((t) => t.status !== "done")
                    .length,
            },
            path: "/university",
        },
        {
            id: "freelancing",
            name: "Freelancing",
            icon: Briefcase,
            description: "Track projects & clients",
            color: "from-blue-500 to-cyan-600",
            stats: {
                label: "Active Projects",
                value: stats.activeProjects,
            },
            path: "/freelancing",
        },
        {
            id: "programming",
            name: "Programming",
            icon: Code2,
            description: "Learn & build projects",
            color: "from-green-500 to-emerald-600",
            stats: {
                label: "In Progress",
                value: stats.learningInProgress,
            },
            path: "/programming",
        },
        {
            id: "home",
            name: "Home & Life",
            icon: HomeIcon,
            description: "Personal goals & tasks",
            color: "from-orange-500 to-red-600",
            stats: {
                label: "Tasks",
                value: data.home.tasks.filter((t) => t.status !== "done")
                    .length,
            },
            path: "/home",
        },
    ];

    // Calculate urgent notifications
    const urgentNotifications = useMemo(() => {
        const notifications: Array<{
            id: string;
            type: string;
            title: string;
            message: string;
            icon: typeof Zap;
            action: () => void;
        }> = [];

        // Priority 10 tasks
        const priority10Tasks = data.university.tasks.filter(
            (task) => task.priority === 10 && task.status !== "done"
        );

        priority10Tasks.forEach((task) => {
            const subject = data.university.subjects.find(
                (s) => s.id === task.subjectId
            );
            if (task.dueDate) {
                const daysUntil = getDaysUntil(task.dueDate);
                if (daysUntil <= 3) {
                    notifications.push({
                        id: `p10-date-${task.id}`,
                        type: "priority10-approaching",
                        title:
                            daysUntil < 0
                                ? "⚠️ OVERDUE Priority 10!"
                                : `🔥 Priority 10 Due ${
                                      daysUntil === 0
                                          ? "TODAY"
                                          : `in ${daysUntil} day(s)`
                                  }`,
                        message: `${task.title} (${
                            subject?.name || "Unknown"
                        })`,
                        icon: Zap,
                        action: () => navigate("/university"),
                    });
                }
            } else {
                notifications.push({
                    id: `p10-${task.id}`,
                    type: "priority10",
                    title: "🚨 Priority 10 Task!",
                    message: `${task.title} (${subject?.name || "Unknown"})`,
                    icon: Zap,
                    action: () => navigate("/university"),
                });
            }
        });

        // Exams
        data.university.exams.forEach((exam) => {
            const daysUntil = getDaysUntil(exam.date);
            const subject = data.university.subjects.find(
                (s) => s.id === exam.subjectId
            );

            if (isDateToday(exam.date)) {
                notifications.push({
                    id: `exam-today-${exam.id}`,
                    type: "exam-today",
                    title: "📚 EXAM TODAY!",
                    message: `${exam.title} (${subject?.name || "Unknown"})`,
                    icon: AlertTriangle,
                    action: () => navigate("/university"),
                });
            } else if (isDateTomorrow(exam.date)) {
                notifications.push({
                    id: `exam-tomorrow-${exam.id}`,
                    type: "exam-tomorrow",
                    title: "⚠️ Exam Tomorrow!",
                    message: `${exam.title} (${subject?.name || "Unknown"})`,
                    icon: Calendar,
                    action: () => navigate("/university"),
                });
            } else if (daysUntil === 2) {
                notifications.push({
                    id: `exam-day-after-${exam.id}`,
                    type: "exam-day-after",
                    title: "📅 Exam in 2 Days",
                    message: `${exam.title} (${subject?.name || "Unknown"})`,
                    icon: Calendar,
                    action: () => navigate("/university"),
                });
            }
        });

        // Filter based on dismissal settings
        const now = new Date();
        return notifications.filter((notification) => {
            if (neverShowAgain.includes(notification.id)) return false;
            const dismissedItem = dismissedNotifications.find(
                (d) => d.id === notification.id
            );
            if (dismissedItem) {
                if (!dismissedItem.dismissUntil) return false;
                if (new Date(dismissedItem.dismissUntil) > now) return false;
            }
            return true;
        });
    }, [data, dismissedNotifications, neverShowAgain, navigate]);

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
                    {urgentNotifications.length > 0 && (
                        <Badge
                            variant="destructive"
                            className="text-base px-4 py-2 animate-pulse">
                            <Bell className="mr-2 h-4 w-4" />
                            {urgentNotifications.length} Urgent
                        </Badge>
                    )}
                </div>
                <p className="text-lg text-muted-foreground italic">
                    "{quote}"
                </p>
            </div>

            <Separator />

            {/* Urgent Notifications */}
            {urgentNotifications.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                        Urgent Notifications
                    </h2>
                    <div className="grid gap-4">
                        {urgentNotifications.map((notification) => (
                            <Card
                                key={notification.id}
                                className="border-l-4 border-l-destructive cursor-pointer hover:shadow-md transition-all"
                                onClick={notification.action}>
                                <CardContent className="pt-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            <div className="p-3 rounded-lg bg-destructive/10">
                                                <notification.icon className="h-6 w-6 text-destructive" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg mb-1">
                                                    {notification.title}
                                                </h3>
                                                <p className="text-muted-foreground">
                                                    {notification.message}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    notification.action();
                                                }}>
                                                View
                                            </Button>
                                            <DismissMenu
                                                onDismiss={(period) => {
                                                    dismissNotification(
                                                        notification.id,
                                                        period
                                                    );
                                                }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate("/university")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            University Tasks
                        </CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.universityTasksCompleted}/
                            {stats.universityTasksTotal}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.completionRate}% completion rate
                        </p>
                        <Progress
                            value={stats.completionRate}
                            className="mt-2"
                        />
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate("/university")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Due Today
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.todayTasks}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.todayTasks === 0
                                ? "All clear! 🎉"
                                : "Focus on these first"}
                        </p>
                        {stats.upcomingExams > 0 && (
                            <p className="text-xs text-destructive mt-1">
                                {stats.upcomingExams} exam(s) this week
                            </p>
                        )}
                        <Progress
                            value={stats.todayTasks > 0 ? 100 : 0}
                            className="mt-2"
                        />
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate("/freelancing")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Freelancing Tasks
                        </CardTitle>
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.activeProjects}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active projects
                        </p>
                        {stats.totalRevenue > 0 && (
                            <p className="text-xs text-green-600 mt-1">
                                ${stats.totalRevenue.toLocaleString()} earned
                            </p>
                        )}
                        <Progress
                            value={
                                stats.completedProjects > 0
                                    ? Math.round(
                                          (stats.completedProjects /
                                              (stats.activeProjects +
                                                  stats.completedProjects)) *
                                              100
                                      )
                                    : 0
                            }
                            className="mt-2"
                        />
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate("/programming")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Learning
                        </CardTitle>
                        <Code2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.learningInProgress}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Resources in progress
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.programmingProjects} active projects
                        </p>
                        <Progress
                            value={
                                stats.learningCompleted > 0
                                    ? Math.round(
                                          (stats.learningCompleted /
                                              (stats.learningInProgress +
                                                  stats.learningCompleted)) *
                                              100
                                      )
                                    : 0
                            }
                            className="mt-2"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Additional Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate("/home")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Home & Life
                        </CardTitle>
                        <HomeIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.homeTasksActive}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Active tasks
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{stats.activeGoals} goals</span>
                            <span>•</span>
                            <span>{stats.activeHabits} habits</span>
                        </div>
                        <Progress
                            value={stats.activeGoals > 0 ? 50 : 0}
                            className="mt-2"
                        />
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate("/programming")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Skills & Tech
                        </CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalSkills}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Skills tracked
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.learningCompleted} resources completed
                        </p>
                        <Progress
                            value={
                                stats.totalSkills > 0
                                    ? Math.min(
                                          (stats.totalSkills / 10) * 100,
                                          100
                                      )
                                    : 0
                            }
                            className="mt-2"
                        />
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate("/freelancing")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Freelancing Projects
                        </CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {freelancingProjects.length}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total projects
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.completedProjects} completed •{" "}
                            {stats.activeProjects} active
                        </p>
                        <Progress
                            value={
                                freelancingProjects.length > 0
                                    ? Math.round(
                                          (stats.completedProjects /
                                              freelancingProjects.length) *
                                              100
                                      )
                                    : 0
                            }
                            className="mt-2"
                        />
                    </CardContent>
                </Card>

                <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate("/misc")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Quick Notes
                        </CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalNotes}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Notes saved
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{stats.totalBookmarks} bookmarks</span>
                            <span>•</span>
                            <span>{stats.quickCaptures} captures</span>
                        </div>
                        <Progress
                            value={
                                stats.totalNotes > 0
                                    ? Math.min(
                                          (stats.totalNotes / 20) * 100,
                                          100
                                      )
                                    : 0
                            }
                            className="mt-2"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Upcoming Deadlines */}
            {(() => {
                const upcomingDeadlines = [
                    ...data.university.tasks
                        .filter((t) => t.status !== "done" && t.dueDate)
                        .map((t) => ({
                            id: t.id,
                            title: t.title,
                            type: "Task",
                            module: "University",
                            date: t.dueDate!,
                            priority: t.priority,
                            color: "from-purple-500 to-violet-600",
                        })),
                    ...data.university.exams.map((e) => ({
                        id: e.id,
                        title: e.title,
                        type: "Exam",
                        module: "University",
                        date: e.date,
                        priority: 10,
                        color: "from-purple-500 to-violet-600",
                    })),
                    ...freelancingProjects
                        .filter(
                            (p: any) =>
                                p.status !== "completed" &&
                                p.status !== "done" &&
                                p.deadline
                        )
                        .map((p: any) => ({
                            id: p.id,
                            title: p.name,
                            type: "Project",
                            module: "Freelancing",
                            date: p.deadline,
                            priority: p.priority || 8,
                            color: "from-blue-500 to-cyan-600",
                        })),
                    ...data.home.goals
                        .filter((g) => g.targetDate && g.progress < 100)
                        .map((g) => ({
                            id: g.id,
                            title: g.title,
                            type: "Goal",
                            module: "Home",
                            date: g.targetDate!,
                            priority: 5,
                            color: "from-orange-500 to-red-600",
                        })),
                ]
                    .sort(
                        (a, b) =>
                            new Date(a.date).getTime() -
                            new Date(b.date).getTime()
                    )
                    .slice(0, 6);

                return upcomingDeadlines.length > 0 ? (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                            <Calendar className="h-6 w-6" />
                            Upcoming Deadlines
                        </h2>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {upcomingDeadlines.map((item) => {
                                const daysUntil = getDaysUntil(item.date);
                                const isUrgent = daysUntil <= 2;
                                const isOverdue = daysUntil < 0;

                                return (
                                    <Card
                                        key={item.id}
                                        className={cn(
                                            "hover:shadow-md transition-shadow",
                                            isOverdue &&
                                                "border-l-4 border-l-destructive",
                                            isUrgent &&
                                                !isOverdue &&
                                                "border-l-4 border-l-warning"
                                        )}>
                                        <CardContent className="pt-4">
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <p className="font-medium line-clamp-1">
                                                            {item.title}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {item.type} •{" "}
                                                            {item.module}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant={
                                                            item.priority >= 8
                                                                ? "destructive"
                                                                : item.priority >=
                                                                  5
                                                                ? "default"
                                                                : "secondary"
                                                        }
                                                        className="text-xs">
                                                        P{item.priority}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        {formatDate(
                                                            new Date(item.date)
                                                        )}
                                                    </span>
                                                    <Badge
                                                        variant={
                                                            isOverdue
                                                                ? "destructive"
                                                                : isUrgent
                                                                ? "default"
                                                                : "outline"
                                                        }>
                                                        {isOverdue
                                                            ? `${Math.abs(
                                                                  daysUntil
                                                              )} day(s) overdue`
                                                            : daysUntil === 0
                                                            ? "Today"
                                                            : daysUntil === 1
                                                            ? "Tomorrow"
                                                            : `${daysUntil} days`}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                ) : null;
            })()}

            {/* Modules Grid */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
                        <Target className="h-6 w-6" />
                        Your Modules
                    </h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {modules.map((module) => (
                        <Card
                            key={module.id}
                            className="group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden"
                            onClick={() => navigate(module.path)}>
                            <div
                                className={cn(
                                    "h-2 bg-gradient-to-r",
                                    module.color
                                )}
                            />
                            <CardHeader>
                                <div className="flex items-center justify-between mb-2">
                                    <div
                                        className={cn(
                                            "p-3 rounded-lg bg-gradient-to-br",
                                            module.color,
                                            "shadow-lg"
                                        )}>
                                        <module.icon className="h-6 w-6 text-white" />
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                                </div>
                                <CardTitle>{module.name}</CardTitle>
                                <CardDescription>
                                    {module.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {module.stats.label}
                                    </span>
                                    <Badge variant="secondary">
                                        {module.stats.value}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Recent Activity
                    </CardTitle>
                    <CardDescription>
                        Quick overview of your latest tasks and projects
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="university" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                            <TabsTrigger value="university">
                                <span className="hidden sm:inline">
                                    University
                                </span>
                                <span className="sm:hidden">Uni</span>
                            </TabsTrigger>
                            <TabsTrigger value="freelancing">
                                <span className="hidden sm:inline">
                                    Freelancing
                                </span>
                                <span className="sm:hidden">Free</span>
                            </TabsTrigger>
                            <TabsTrigger value="programming">
                                <span className="hidden sm:inline">
                                    Programming
                                </span>
                                <span className="sm:hidden">Code</span>
                            </TabsTrigger>
                            <TabsTrigger value="home">
                                <span className="hidden sm:inline">
                                    Home & Life
                                </span>
                                <span className="sm:hidden">Home</span>
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent
                            value="university"
                            className="space-y-4 mt-4">
                            {data.university.tasks.slice(0, 5).length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No tasks yet</p>
                                </div>
                            ) : (
                                data.university.tasks
                                    .slice(0, 5)
                                    .map((task) => {
                                        const subject =
                                            data.university.subjects.find(
                                                (s) => s.id === task.subjectId
                                            );
                                        return (
                                            <div
                                                key={task.id}
                                                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                                <div className="flex-1">
                                                    <p className="font-medium">
                                                        {task.title}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {subject?.name}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        variant={
                                                            task.priority >= 8
                                                                ? "destructive"
                                                                : task.priority >=
                                                                  5
                                                                ? "default"
                                                                : "secondary"
                                                        }>
                                                        P{task.priority}
                                                    </Badge>
                                                    <Badge
                                                        variant={
                                                            task.status ===
                                                            "done"
                                                                ? "secondary"
                                                                : "outline"
                                                        }>
                                                        {task.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        );
                                    })
                            )}
                            {data.university.tasks.length > 5 && (
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => navigate("/university")}>
                                    View All Tasks
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </TabsContent>

                        <TabsContent
                            value="freelancing"
                            className="space-y-4 mt-4">
                            {freelancingProjects.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Briefcase className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No projects yet</p>
                                </div>
                            ) : (
                                freelancingProjects
                                    .slice(0, 5)
                                    .map((project: any) => (
                                        <div
                                            key={project.id}
                                            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {project.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {project.clientName ||
                                                        project.client ||
                                                        "No client"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline">
                                                    {project.status}
                                                </Badge>
                                                {project.expectedProfit && (
                                                    <div className="text-sm text-muted-foreground">
                                                        $
                                                        {project.expectedProfit}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                            )}
                        </TabsContent>

                        <TabsContent
                            value="programming"
                            className="space-y-4 mt-4">
                            {(programmingData.learningItems?.length || 0) ===
                                0 &&
                            (programmingData.projects?.length || 0) === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Code2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No learning resources yet</p>
                                </div>
                            ) : (
                                <>
                                    {programmingData.learningItems?.length >
                                        0 && (
                                        <>
                                            {programmingData.learningItems
                                                .slice(0, 5)
                                                .map((resource: any) => (
                                                    <div
                                                        key={resource.id}
                                                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                                        <div className="flex-1">
                                                            <p className="font-medium">
                                                                {resource.title}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {resource.type}
                                                            </p>
                                                        </div>
                                                        <Badge
                                                            variant={
                                                                resource.status ===
                                                                "completed"
                                                                    ? "secondary"
                                                                    : "outline"
                                                            }>
                                                            {resource.status}
                                                        </Badge>
                                                    </div>
                                                ))}
                                        </>
                                    )}
                                    {programmingData.projects?.length > 0 && (
                                        <>
                                            <div className="text-sm font-medium text-muted-foreground mt-4">
                                                Active Projects
                                            </div>
                                            {programmingData.projects
                                                .filter(
                                                    (p: any) =>
                                                        p.status ===
                                                        "in-progress"
                                                )
                                                .slice(0, 3)
                                                .map((project: any) => (
                                                    <div
                                                        key={project.id}
                                                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                                        <div className="flex-1">
                                                            <p className="font-medium">
                                                                {project.title}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground line-clamp-1">
                                                                {project.description ||
                                                                    "No description"}
                                                            </p>
                                                        </div>
                                                        <Badge variant="default">
                                                            {project.status}
                                                        </Badge>
                                                    </div>
                                                ))}
                                        </>
                                    )}
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="home" className="space-y-4 mt-4">
                            {data.home.tasks.length === 0 &&
                            data.home.goals.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <HomeIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p>No tasks or goals yet</p>
                                </div>
                            ) : (
                                <>
                                    {data.home.tasks.slice(0, 5).length > 0 && (
                                        <>
                                            <div className="text-sm font-medium text-muted-foreground">
                                                Home Tasks
                                            </div>
                                            {data.home.tasks
                                                .slice(0, 5)
                                                .map((task) => (
                                                    <div
                                                        key={task.id}
                                                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                                        <div className="flex-1">
                                                            <p className="font-medium">
                                                                {task.title}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {task.category}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge
                                                                variant={
                                                                    task.priority ===
                                                                    "high"
                                                                        ? "destructive"
                                                                        : task.priority ===
                                                                          "medium"
                                                                        ? "default"
                                                                        : "secondary"
                                                                }>
                                                                {task.priority}
                                                            </Badge>
                                                            <Badge
                                                                variant={
                                                                    task.status ===
                                                                    "done"
                                                                        ? "secondary"
                                                                        : "outline"
                                                                }>
                                                                {task.status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                        </>
                                    )}
                                    {data.home.goals.slice(0, 3).length > 0 && (
                                        <>
                                            <div className="text-sm font-medium text-muted-foreground mt-4">
                                                Personal Goals
                                            </div>
                                            {data.home.goals
                                                .slice(0, 3)
                                                .map((goal) => (
                                                    <div
                                                        key={goal.id}
                                                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                                                        <div className="flex-1">
                                                            <p className="font-medium">
                                                                {goal.title}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {goal.category}
                                                            </p>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline">
                                                                {goal.progress}%
                                                            </Badge>
                                                            <Progress
                                                                value={
                                                                    goal.progress
                                                                }
                                                                className="w-16 h-2"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                        </>
                                    )}
                                </>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};
