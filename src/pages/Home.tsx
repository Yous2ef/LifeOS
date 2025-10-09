import { useState, useMemo } from "react";
import {
    Plus,
    Home as HomeIcon,
    Target,
    Zap,
    Calendar,
    CheckCircle2,
    Circle,
    Edit,
    Trash2,
    Grid3x3,
    List,
    Flame,
    Trophy,
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
import { useApp } from "../context/AppContext";
import { formatDate, getHousePriorityColor } from "../utils/helpers";
import { cn } from "@/lib/utils";
import type { HouseTask, PersonalGoal, Habit } from "../types";
import { HouseTaskModal } from "../components/home/HouseTaskModal";
import { PersonalGoalModal } from "../components/home/PersonalGoalModal";
import { HabitModal } from "../components/home/HabitModal";

export const Home = () => {
    const { data, updateData, showToast } = useApp();
    const [activeTab, setActiveTab] = useState("tasks");
    const [viewMode, setViewMode] = useState("kanban");
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [goalModalOpen, setGoalModalOpen] = useState(false);
    const [habitModalOpen, setHabitModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<HouseTask | undefined>(
        undefined
    );
    const [editingGoal, setEditingGoal] = useState<PersonalGoal | undefined>(
        undefined
    );
    const [editingHabit, setEditingHabit] = useState<Habit | undefined>(
        undefined
    );

    // Calculate stats
    const stats = useMemo(() => {
        const totalTasks = data.home.tasks.length;
        const completedTasks = data.home.tasks.filter(
            (t) => t.status === "done"
        ).length;
        const todoTasks = totalTasks - completedTasks;
        const totalGoals = data.home.goals.length;
        const avgGoalProgress =
            totalGoals > 0
                ? data.home.goals.reduce((sum, g) => sum + g.progress, 0) /
                  totalGoals
                : 0;
        const activeHabits = data.home.habits.length;
        const totalStreak = data.home.habits.reduce(
            (sum, h) => sum + h.streak,
            0
        );

        return {
            totalTasks,
            completedTasks,
            todoTasks,
            totalGoals,
            avgGoalProgress,
            activeHabits,
            totalStreak,
        };
    }, [data.home]);

    // Task handlers
    const handleAddTask = () => {
        setEditingTask(undefined);
        setTaskModalOpen(true);
    };

    const handleEditTask = (task: HouseTask) => {
        setEditingTask(task);
        setTaskModalOpen(true);
    };

    const handleDeleteTask = (taskId: string) => {
        if (confirm("Are you sure you want to delete this task?")) {
            updateData({
                home: {
                    ...data.home,
                    tasks: data.home.tasks.filter((t) => t.id !== taskId),
                },
            });
            showToast("Task deleted successfully", "success");
        }
    };

    const handleTaskStatusChange = (
        taskId: string,
        status: "todo" | "done"
    ) => {
        updateData({
            home: {
                ...data.home,
                tasks: data.home.tasks.map((t) =>
                    t.id === taskId ? { ...t, status } : t
                ),
            },
        });
        showToast(
            status === "done" ? "Task completed! 🎉" : "Task marked as todo",
            "success"
        );
    };

    // Goal handlers
    const handleAddGoal = () => {
        setEditingGoal(undefined);
        setGoalModalOpen(true);
    };

    const handleEditGoal = (goal: PersonalGoal) => {
        setEditingGoal(goal);
        setGoalModalOpen(true);
    };

    const handleDeleteGoal = (goalId: string) => {
        if (confirm("Are you sure you want to delete this goal?")) {
            updateData({
                home: {
                    ...data.home,
                    goals: data.home.goals.filter((g) => g.id !== goalId),
                },
            });
            showToast("Goal deleted successfully", "success");
        }
    };

    // Habit handlers
    const handleAddHabit = () => {
        setEditingHabit(undefined);
        setHabitModalOpen(true);
    };

    const handleEditHabit = (habit: Habit) => {
        setEditingHabit(habit);
        setHabitModalOpen(true);
    };

    const handleDeleteHabit = (habitId: string) => {
        if (confirm("Are you sure you want to delete this habit?")) {
            updateData({
                home: {
                    ...data.home,
                    habits: data.home.habits.filter((h) => h.id !== habitId),
                },
            });
            showToast("Habit deleted successfully", "success");
        }
    };

    const handleToggleHabit = (habitId: string) => {
        const today = new Date().toISOString().split("T")[0];
        const habit = data.home.habits.find((h) => h.id === habitId);
        if (!habit) return;

        const isCompleted = habit.completedDates.includes(today);
        let newCompletedDates: string[];
        let newStreak = habit.streak;

        if (isCompleted) {
            // Uncomplete
            newCompletedDates = habit.completedDates.filter((d) => d !== today);
            newStreak = Math.max(0, habit.streak - 1);
        } else {
            // Complete
            newCompletedDates = [...habit.completedDates, today];
            newStreak = habit.streak + 1;
        }

        updateData({
            home: {
                ...data.home,
                habits: data.home.habits.map((h) =>
                    h.id === habitId
                        ? {
                              ...h,
                              completedDates: newCompletedDates,
                              streak: newStreak,
                              bestStreak: Math.max(newStreak, h.bestStreak),
                          }
                        : h
                ),
            },
        });
        showToast(
            isCompleted ? "Habit unchecked" : "Habit completed! 🔥",
            "success"
        );
    };

    // Prepare tasks for Kanban/List view
    const taskColumns = useMemo(() => {
        return {
            todo: data.home.tasks.filter((t) => t.status === "todo"),
            done: data.home.tasks.filter((t) => t.status === "done"),
        };
    }, [data.home.tasks]);

    const getCategoryIcon = (category: HouseTask["category"]) => {
        switch (category) {
            case "chore":
                return "🧹";
            case "maintenance":
                return "🔧";
            case "shopping":
                return "🛒";
            case "bills":
                return "💰";
            default:
                return "📋";
        }
    };

    const getCategoryColor = (category: HouseTask["category"]) => {
        switch (category) {
            case "chore":
                return "bg-blue-500/10 text-blue-500";
            case "maintenance":
                return "bg-orange-500/10 text-orange-500";
            case "shopping":
                return "bg-green-500/10 text-green-500";
            case "bills":
                return "bg-red-500/10 text-red-500";
            default:
                return "bg-gray-500/10 text-gray-500";
        }
    };

    const getGoalCategoryColor = (category: PersonalGoal["category"]) => {
        switch (category) {
            case "health":
                return "bg-green-500/10 text-green-500";
            case "fitness":
                return "bg-blue-500/10 text-blue-500";
            case "hobby":
                return "bg-purple-500/10 text-purple-500";
            case "personal":
                return "bg-cyan-500/10 text-cyan-500";
            default:
                return "bg-gray-500/10 text-gray-500";
        }
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-bold mb-2 gradient-text">
                    Home & Personal Life
                </h1>
                <p className="text-muted-foreground">
                    Manage household tasks, personal goals, and daily habits
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            House Tasks
                        </CardTitle>
                        <HomeIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.completedTasks}/{stats.totalTasks}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.todoTasks} tasks remaining
                        </p>
                        <Progress
                            value={
                                stats.totalTasks > 0
                                    ? (stats.completedTasks /
                                          stats.totalTasks) *
                                      100
                                    : 0
                            }
                            className="mt-2"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Personal Goals
                        </CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalGoals}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.avgGoalProgress.toFixed(0)}% avg progress
                        </p>
                        <Progress
                            value={stats.avgGoalProgress}
                            className="mt-2"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Habits
                        </CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.activeHabits}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            habits tracking
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Streak
                        </CardTitle>
                        <Flame className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalStreak} 🔥
                        </div>
                        <p className="text-xs text-muted-foreground">
                            days combined
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="tasks">House Tasks</TabsTrigger>
                    <TabsTrigger value="goals">Personal Goals</TabsTrigger>
                    <TabsTrigger value="habits">Habits</TabsTrigger>
                </TabsList>

                {/* House Tasks Tab */}
                <TabsContent value="tasks" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            <Button
                                variant={
                                    viewMode === "kanban"
                                        ? "default"
                                        : "outline"
                                }
                                size="sm"
                                onClick={() => setViewMode("kanban")}>
                                <Grid3x3 className="w-4 h-4 mr-2" />
                                Kanban
                            </Button>
                            <Button
                                variant={
                                    viewMode === "list" ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => setViewMode("list")}>
                                <List className="w-4 h-4 mr-2" />
                                List
                            </Button>
                        </div>
                        <Button onClick={handleAddTask}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Task
                        </Button>
                    </div>

                    {viewMode === "kanban" ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* To Do Column */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Circle className="w-5 h-5 text-blue-500" />
                                        To Do ({taskColumns.todo.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {taskColumns.todo.map((task) => (
                                        <Card key={task.id} className="p-4">
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between">
                                                    <h4 className="font-medium flex-1">
                                                        {task.title}
                                                    </h4>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                handleEditTask(
                                                                    task
                                                                )
                                                            }>
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                handleDeleteTask(
                                                                    task.id
                                                                )
                                                            }>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge
                                                        className={getCategoryColor(
                                                            task.category
                                                        )}>
                                                        {getCategoryIcon(
                                                            task.category
                                                        )}{" "}
                                                        {task.category}
                                                    </Badge>
                                                    <Badge
                                                        className={cn(
                                                            getHousePriorityColor(
                                                                task.priority
                                                            )
                                                        )}>
                                                        {task.priority}
                                                    </Badge>
                                                    {task.dueDate && (
                                                        <Badge variant="outline">
                                                            <Calendar className="w-3 h-3 mr-1" />
                                                            {formatDate(
                                                                task.dueDate
                                                            )}
                                                        </Badge>
                                                    )}
                                                    {task.recurring && (
                                                        <Badge variant="secondary">
                                                            🔁{" "}
                                                            {
                                                                task.recurringPeriod
                                                            }
                                                        </Badge>
                                                    )}
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() =>
                                                        handleTaskStatusChange(
                                                            task.id,
                                                            "done"
                                                        )
                                                    }>
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Mark as Done
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                    {taskColumns.todo.length === 0 && (
                                        <p className="text-center text-muted-foreground py-8">
                                            No tasks to do
                                        </p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Done Column */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                                        Done ({taskColumns.done.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {taskColumns.done.map((task) => (
                                        <Card
                                            key={task.id}
                                            className="p-4 opacity-60">
                                            <div className="space-y-2">
                                                <div className="flex items-start justify-between">
                                                    <h4 className="font-medium flex-1 line-through">
                                                        {task.title}
                                                    </h4>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                handleEditTask(
                                                                    task
                                                                )
                                                            }>
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() =>
                                                                handleDeleteTask(
                                                                    task.id
                                                                )
                                                            }>
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge
                                                        className={getCategoryColor(
                                                            task.category
                                                        )}>
                                                        {getCategoryIcon(
                                                            task.category
                                                        )}{" "}
                                                        {task.category}
                                                    </Badge>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={() =>
                                                        handleTaskStatusChange(
                                                            task.id,
                                                            "todo"
                                                        )
                                                    }>
                                                    Move to To Do
                                                </Button>
                                            </div>
                                        </Card>
                                    ))}
                                    {taskColumns.done.length === 0 && (
                                        <p className="text-center text-muted-foreground py-8">
                                            No completed tasks
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="p-6">
                                <div className="space-y-3">
                                    {data.home.tasks.map((task) => (
                                        <Card key={task.id} className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={cn(
                                                                "w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer",
                                                                task.status ===
                                                                    "done"
                                                                    ? "bg-green-500 border-green-500"
                                                                    : "border-gray-400"
                                                            )}
                                                            onClick={() =>
                                                                handleTaskStatusChange(
                                                                    task.id,
                                                                    task.status ===
                                                                        "done"
                                                                        ? "todo"
                                                                        : "done"
                                                                )
                                                            }>
                                                            {task.status ===
                                                                "done" && (
                                                                <CheckCircle2 className="w-3 h-3 text-white" />
                                                            )}
                                                        </div>
                                                        <h4
                                                            className={cn(
                                                                "font-medium",
                                                                task.status ===
                                                                    "done" &&
                                                                    "line-through opacity-60"
                                                            )}>
                                                            {task.title}
                                                        </h4>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap ml-8">
                                                        <Badge
                                                            className={getCategoryColor(
                                                                task.category
                                                            )}>
                                                            {getCategoryIcon(
                                                                task.category
                                                            )}{" "}
                                                            {task.category}
                                                        </Badge>
                                                        <Badge
                                                            className={cn(
                                                                getHousePriorityColor(
                                                                    task.priority
                                                                )
                                                            )}>
                                                            {task.priority}
                                                        </Badge>
                                                        {task.dueDate && (
                                                            <Badge variant="outline">
                                                                <Calendar className="w-3 h-3 mr-1" />
                                                                {formatDate(
                                                                    task.dueDate
                                                                )}
                                                            </Badge>
                                                        )}
                                                        {task.recurring && (
                                                            <Badge variant="secondary">
                                                                🔁{" "}
                                                                {
                                                                    task.recurringPeriod
                                                                }
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            handleEditTask(task)
                                                        }>
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            handleDeleteTask(
                                                                task.id
                                                            )
                                                        }>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                    {data.home.tasks.length === 0 && (
                                        <p className="text-center text-muted-foreground py-8">
                                            No tasks yet. Add your first task!
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Personal Goals Tab */}
                <TabsContent value="goals" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={handleAddGoal}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Goal
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.home.goals.map((goal) => (
                            <Card key={goal.id}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle>{goal.title}</CardTitle>
                                            <CardDescription>
                                                {goal.description}
                                            </CardDescription>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleEditGoal(goal)
                                                }>
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    handleDeleteGoal(goal.id)
                                                }>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <Badge
                                            className={getGoalCategoryColor(
                                                goal.category
                                            )}>
                                            {goal.category}
                                        </Badge>
                                        {goal.targetDate && (
                                            <Badge variant="outline">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {formatDate(goal.targetDate)}
                                            </Badge>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>Progress</span>
                                            <span className="font-medium">
                                                {goal.progress}%
                                            </span>
                                        </div>
                                        <Progress value={goal.progress} />
                                    </div>
                                    {goal.milestones.length > 0 && (
                                        <div>
                                            <p className="text-sm font-medium mb-2">
                                                Milestones:
                                            </p>
                                            <ul className="space-y-1">
                                                {goal.milestones.map(
                                                    (milestone, idx) => (
                                                        <li
                                                            key={idx}
                                                            className="text-sm text-muted-foreground flex items-center gap-2">
                                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                                            {milestone}
                                                        </li>
                                                    )
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                        {data.home.goals.length === 0 && (
                            <Card className="col-span-full">
                                <CardContent className="py-12">
                                    <p className="text-center text-muted-foreground">
                                        No goals yet. Set your first personal
                                        goal!
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Habits Tab */}
                <TabsContent value="habits" className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={handleAddHabit}>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Habit
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.home.habits.map((habit) => {
                            const today = new Date()
                                .toISOString()
                                .split("T")[0];
                            const isCompletedToday =
                                habit.completedDates.includes(today);

                            return (
                                <Card key={habit.id}>
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">
                                                    {habit.icon}
                                                </span>
                                                <CardTitle className="text-lg">
                                                    {habit.name}
                                                </CardTitle>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        handleEditHabit(habit)
                                                    }>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        handleDeleteHabit(
                                                            habit.id
                                                        )
                                                    }>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <Badge variant="secondary">
                                            {habit.frequency}
                                        </Badge>
                                        <div className="flex items-center justify-around">
                                            <div className="text-center">
                                                <div className="flex items-center gap-1 text-2xl font-bold text-orange-500">
                                                    <Flame className="w-6 h-6" />
                                                    {habit.streak}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Current Streak
                                                </p>
                                            </div>
                                            <div className="text-center">
                                                <div className="flex items-center gap-1 text-2xl font-bold text-yellow-500">
                                                    <Trophy className="w-6 h-6" />
                                                    {habit.bestStreak}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Best Streak
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            className="w-full"
                                            variant={
                                                isCompletedToday
                                                    ? "secondary"
                                                    : "default"
                                            }
                                            onClick={() =>
                                                handleToggleHabit(habit.id)
                                            }>
                                            {isCompletedToday ? (
                                                <>
                                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                                    Completed Today
                                                </>
                                            ) : (
                                                <>
                                                    <Circle className="w-4 h-4 mr-2" />
                                                    Mark as Done
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                        {data.home.habits.length === 0 && (
                            <Card className="col-span-full">
                                <CardContent className="py-12">
                                    <p className="text-center text-muted-foreground">
                                        No habits yet. Start tracking your first
                                        habit!
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Modals */}
            <HouseTaskModal
                isOpen={taskModalOpen}
                onClose={() => setTaskModalOpen(false)}
                task={editingTask}
            />
            <PersonalGoalModal
                isOpen={goalModalOpen}
                onClose={() => setGoalModalOpen(false)}
                goal={editingGoal}
            />
            <HabitModal
                isOpen={habitModalOpen}
                onClose={() => setHabitModalOpen(false)}
                habit={editingHabit}
            />
        </div>
    );
};
