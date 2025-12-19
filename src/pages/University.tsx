import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    BookOpen,
    GraduationCap,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    Edit,
    Trash2,
    MoreVertical,
    Target,
    TrendingUp,
    Grid3x3,
    List,
    ListTodo,
    Award,
} from "lucide-react";
import {
    KanbanBoard,
    KanbanCard,
    ListView,
    ListCard,
    type KanbanCardBadge,
    type KanbanCardAction,
    type ListCardBadge,
} from "@/components/common";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { SubjectModal } from "../components/university/SubjectModal";
import { TaskModal } from "../components/university/TaskModal";
import { ExamModal } from "../components/university/ExamModal";
import { Timetable } from "../components/university/Timetable";
import { TimetableModal } from "../components/university/TimetableModal";
import { YearTermSelector } from "../components/university/YearTermSelector";
import { ManageYearsModal } from "../components/university/ManageYearsModal";
import {
    calculateGrades,
    getGradeColor,
} from "../components/university/GradeSummaryCard";
import { ExamCard } from "../components/university/ExamCard";
import { MarkExamModal } from "../components/university/MarkExamModal";
import { useApp } from "../context/AppContext";
import {
    formatDate,
    getDaysUntil,
    isDateToday,
    getPriorityColor,
} from "../utils/helpers";
import { cn } from "@/lib/utils";
import type {
    Subject,
    UniversityTask,
    Exam as ExamType,
    AcademicYear,
    Term,
} from "../types";

export const University = () => {
    const navigate = useNavigate();
    const { data, updateData, showToast } = useApp();
    const [activeTab, setActiveTab] = useState("tasks");
    const [viewMode, setViewMode] = useState("kanban");
    const [subjectModalOpen, setSubjectModalOpen] = useState(false);
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [examModalOpen, setExamModalOpen] = useState(false);
    const [timetableModalOpen, setTimetableModalOpen] = useState(false);
    const [editingSubject, setEditingSubject] = useState<Subject | undefined>(
        undefined
    );
    const [editingTask, setEditingTask] = useState<UniversityTask | undefined>(
        undefined
    );
    const [editingExam, setEditingExam] = useState<ExamType | undefined>(
        undefined
    );
    const [editingTimetableSubject, setEditingTimetableSubject] = useState<
        Subject | undefined
    >(undefined);
    const [markExamModalOpen, setMarkExamModalOpen] = useState(false);
    const [selectedExamForGrade, setSelectedExamForGrade] = useState<
        ExamType | undefined
    >(undefined);
    const [markExamMode, setMarkExamMode] = useState<"mark" | "grade">("mark");
    const [manageYearsModalOpen, setManageYearsModalOpen] = useState(false);

    // Year/Term filtering
    const academicYears = data.university.academicYears || [];
    const terms = data.university.terms || [];
    const currentYearId = data.university.currentYearId;
    const currentTermId = data.university.currentTermId;

    // Filter subjects based on selected year/term
    const filteredSubjects = useMemo(() => {
        if (!currentYearId && !currentTermId) {
            return data.university.subjects;
        }

        // Handle "unassigned" filter
        if (currentYearId === "unassigned") {
            return data.university.subjects.filter(
                (subject) => !subject.yearId && !subject.termId
            );
        }

        return data.university.subjects.filter((subject) => {
            // If no year/term assigned to subject, don't show when filtering by year/term
            if (!subject.yearId && !subject.termId) {
                return false;
            }
            if (currentYearId && subject.yearId !== currentYearId) {
                return false;
            }
            if (currentTermId && subject.termId !== currentTermId) {
                return false;
            }
            return true;
        });
    }, [data.university.subjects, currentYearId, currentTermId]);

    // Get filtered subject IDs for task/exam filtering
    const filteredSubjectIds = useMemo(() => {
        return new Set(filteredSubjects.map((s) => s.id));
    }, [filteredSubjects]);

    // Filter tasks based on filtered subjects
    const filteredTasks = useMemo(() => {
        if (!currentYearId && !currentTermId) {
            return data.university.tasks;
        }
        return data.university.tasks.filter((task) =>
            filteredSubjectIds.has(task.subjectId)
        );
    }, [
        data.university.tasks,
        filteredSubjectIds,
        currentYearId,
        currentTermId,
    ]);

    // Filter exams based on filtered subjects
    const filteredExams = useMemo(() => {
        if (!currentYearId && !currentTermId) {
            return data.university.exams;
        }
        return data.university.exams.filter((exam) =>
            filteredSubjectIds.has(exam.subjectId)
        );
    }, [
        data.university.exams,
        filteredSubjectIds,
        currentYearId,
        currentTermId,
    ]);

    // Year/Term change handlers
    const handleYearChange = useCallback(
        (yearId: string | undefined) => {
            updateData({
                university: {
                    ...data.university,
                    currentYearId: yearId,
                    // Reset term if it doesn't belong to the new year
                    currentTermId:
                        yearId && currentTermId
                            ? terms.find(
                                  (t) =>
                                      t.id === currentTermId &&
                                      t.yearId === yearId
                              )
                                ? currentTermId
                                : undefined
                            : undefined,
                },
            });
        },
        [data.university, currentTermId, terms, updateData]
    );

    const handleTermChange = useCallback(
        (termId: string | undefined) => {
            updateData({
                university: {
                    ...data.university,
                    currentTermId: termId,
                },
            });
        },
        [data.university, updateData]
    );

    const handleSaveYearsAndTerms = useCallback(
        (years: AcademicYear[], newTerms: Term[]) => {
            updateData({
                university: {
                    ...data.university,
                    academicYears: years,
                    terms: newTerms,
                },
            });
            showToast("Academic years and terms updated", "success");
        },
        [data.university, updateData, showToast]
    );

    // Calculate stats (using filtered data when filtering is active)
    const stats = useMemo(() => {
        const tasksToCount = filteredTasks;
        const examsToCount = filteredExams;
        const subjectsToCount = filteredSubjects;

        const totalTasks = tasksToCount.length;
        const completedTasks = tasksToCount.filter(
            (t) => t.status === "done"
        ).length;
        const inProgressTasks = tasksToCount.filter(
            (t) => t.status === "in-progress"
        ).length;
        const todoTasks = tasksToCount.filter(
            (t) => t.status === "todo"
        ).length;
        const upcomingExams = examsToCount.filter(
            (e) =>
                !e.taken &&
                getDaysUntil(e.date) >= 0 &&
                getDaysUntil(e.date) <= 7
        ).length;

        // Calculate overall grade
        const gradeEntries = data.university.gradeEntries || [];
        let totalEarned = 0;
        let totalPossible = 0;
        let subjectsWithGrades = 0;

        subjectsToCount.forEach((subject) => {
            const subjectExams = examsToCount.filter(
                (e) => e.subjectId === subject.id
            );
            const subjectEntries = gradeEntries.filter(
                (e) => e.subjectId === subject.id
            );
            const grades = calculateGrades(subjectExams, subjectEntries);

            if (grades.totalPossible > 0) {
                totalEarned += grades.totalEarned;
                totalPossible += grades.totalPossible;
                subjectsWithGrades++;
            }
        });

        const overallGrade =
            totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;

        return {
            totalTasks,
            completedTasks,
            inProgressTasks,
            todoTasks,
            upcomingExams,
            completionRate:
                totalTasks > 0
                    ? Math.round((completedTasks / totalTasks) * 100)
                    : 0,
            overallGrade: Math.round(overallGrade * 10) / 10,
            subjectsWithGrades,
        };
    }, [
        filteredTasks,
        filteredExams,
        filteredSubjects,
        data.university.gradeEntries,
    ]);

    // Handlers
    const handleDeleteSubject = (subjectId: string) => {
        if (confirm("Delete this subject and all related tasks?")) {
            updateData({
                university: {
                    ...data.university,
                    subjects: data.university.subjects.filter(
                        (s) => s.id !== subjectId
                    ),
                    tasks: data.university.tasks.filter(
                        (t) => t.subjectId !== subjectId
                    ),
                    exams: data.university.exams.filter(
                        (e) => e.subjectId !== subjectId
                    ),
                },
            });
            showToast("Subject deleted successfully", "success");
        }
    };

    const handleDeleteTask = (taskId: string) => {
        if (confirm("Delete this task?")) {
            updateData({
                university: {
                    ...data.university,
                    tasks: data.university.tasks.filter((t) => t.id !== taskId),
                },
            });
            showToast("Task deleted successfully", "success");
        }
    };

    const handleDeleteExam = (examId: string) => {
        if (confirm("Delete this exam?")) {
            updateData({
                university: {
                    ...data.university,
                    exams: data.university.exams.filter((e) => e.id !== examId),
                },
            });
            showToast("Exam deleted successfully", "success");
        }
    };

    const handleMarkExamAsTaken = (exam: ExamType) => {
        setSelectedExamForGrade(exam);
        setMarkExamMode("mark");
        setMarkExamModalOpen(true);
    };

    const handleAddExamGrade = (exam: ExamType) => {
        setSelectedExamForGrade(exam);
        setMarkExamMode("grade");
        setMarkExamModalOpen(true);
    };

    const handleSaveExamGrade = (
        examId: string,
        updates: Partial<ExamType>
    ) => {
        updateData({
            university: {
                ...data.university,
                exams: data.university.exams.map((e) =>
                    e.id === examId
                        ? {
                              ...e,
                              ...updates,
                          }
                        : e
                ),
            },
        });
        showToast(
            updates.grade !== undefined
                ? "Grade saved successfully"
                : "Exam marked as taken",
            "success"
        );
        setMarkExamModalOpen(false);
        setSelectedExamForGrade(undefined);
    };

    const handleTaskStatusChange = (
        task: UniversityTask,
        newStatus: UniversityTask["status"]
    ) => {
        updateData({
            university: {
                ...data.university,
                tasks: data.university.tasks.map((t) =>
                    t.id === task.id ? { ...t, status: newStatus } : t
                ),
            },
        });
        showToast("Task status updated", "success");
    };

    const getStatusColor = (status: UniversityTask["status"]) => {
        switch (status) {
            case "done":
                return "secondary";
            case "in-progress":
                return "default";
            default:
                return "outline";
        }
    };

    // Helper functions for task badges and actions
    const getTaskBadges = (task: UniversityTask): KanbanCardBadge[] => {
        const subject = data.university.subjects.find(
            (s) => s.id === task.subjectId
        );
        const badges: KanbanCardBadge[] = [];

        badges.push({
            label: `Priority ${task.priority}`,
            variant: getPriorityColor(task.priority),
        });

        if (subject) {
            badges.push({
                label: subject.name,
                variant: "outline",
            });
        }

        if (task.dueDate) {
            badges.push({
                label: formatDate(new Date(task.dueDate)),
                variant: isDateToday(task.dueDate) ? "destructive" : "outline",
                icon: <Clock className="h-3 w-3" />,
            });
        }

        return badges;
    };

    const getTaskActions = (task: UniversityTask): KanbanCardAction[] => {
        const actions: KanbanCardAction[] = [
            {
                label: "Edit",
                icon: <Edit className="h-4 w-4" />,
                onClick: () => {
                    setEditingTask(task);
                    setTaskModalOpen(true);
                },
            },
        ];

        // Add status change actions
        if (task.status !== "todo") {
            actions.push({
                label: "Move to To Do",
                onClick: () => handleTaskStatusChange(task, "todo"),
            });
        }
        if (task.status !== "in-progress") {
            actions.push({
                label: "Move to In Progress",
                onClick: () => handleTaskStatusChange(task, "in-progress"),
            });
        }
        if (task.status !== "done") {
            actions.push({
                label: "Move to Done",
                onClick: () => handleTaskStatusChange(task, "done"),
            });
        }

        actions.push({
            label: "Delete",
            icon: <Trash2 className="h-4 w-4" />,
            onClick: () => handleDeleteTask(task.id),
            variant: "destructive",
            separator: true,
        });

        return actions;
    };

    const getListTaskBadges = (task: UniversityTask): ListCardBadge[] => {
        const subject = data.university.subjects.find(
            (s) => s.id === task.subjectId
        );
        const badges: ListCardBadge[] = [];

        badges.push({
            label: task.status,
            variant: getStatusColor(task.status),
        });

        badges.push({
            label: `Priority ${task.priority}`,
            variant: getPriorityColor(task.priority),
        });

        if (subject) {
            badges.push({
                label: subject.name,
                variant: "outline",
            });
        }

        if (task.dueDate) {
            badges.push({
                label: `Due: ${formatDate(new Date(task.dueDate))}`,
                variant: isDateToday(task.dueDate) ? "destructive" : "outline",
                icon: <Clock className="h-3 w-3" />,
            });
        }

        return badges;
    };

    // Kanban columns (using filtered tasks)
    const kanbanColumns = [
        {
            id: "todo",
            title: "To Do",
            tasks: filteredTasks.filter((t) => t.status === "todo"),
            color: "from-blue-500 to-cyan-500",
        },
        {
            id: "in-progress",
            title: "In Progress",
            tasks: filteredTasks.filter((t) => t.status === "in-progress"),
            color: "from-yellow-500 to-orange-500",
        },
        {
            id: "done",
            title: "Done",
            tasks: filteredTasks.filter((t) => t.status === "done"),
            color: "from-green-500 to-emerald-500",
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3 text-foreground">
                        <GraduationCap className="h-10 w-10" />
                        University
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your courses, tasks, and exams
                    </p>
                </div>
                <YearTermSelector
                    years={academicYears}
                    terms={terms}
                    currentYearId={currentYearId}
                    currentTermId={currentTermId}
                    onYearChange={handleYearChange}
                    onTermChange={handleTermChange}
                    onManageClick={() => setManageYearsModalOpen(true)}
                />
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Tasks
                        </CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.totalTasks}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Across all subjects
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Completed
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.completedTasks}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.completionRate}% completion
                        </p>
                        <Progress
                            value={stats.completionRate}
                            className="mt-2"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            In Progress
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.inProgressTasks}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Currently working on
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            To Do
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.todoTasks}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Pending tasks
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Upcoming Exams
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.upcomingExams}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Next 7 days
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Overall Grade
                        </CardTitle>
                        <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div
                            className={cn(
                                "text-2xl font-bold",
                                getGradeColor(stats.overallGrade)
                            )}>
                            {stats.subjectsWithGrades > 0
                                ? `${stats.overallGrade}%`
                                : "—"}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.subjectsWithGrades > 0
                                ? `${stats.subjectsWithGrades} subject${
                                      stats.subjectsWithGrades !== 1 ? "s" : ""
                                  }`
                                : "No grades yet"}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v)}>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <TabsList className="flex-wrap h-auto">
                        <TabsTrigger value="tasks">
                            <ListTodo className="h-4 w-4 mr-2" />
                            Tasks
                        </TabsTrigger>
                        <TabsTrigger value="grades">
                            <Award className="h-4 w-4 mr-2" />
                            Grades
                        </TabsTrigger>
                        <TabsTrigger value="subjects">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Subjects
                        </TabsTrigger>
                        <TabsTrigger value="exams">
                            <Calendar className="h-4 w-4 mr-2" />
                            Exams
                        </TabsTrigger>
                        <TabsTrigger value="timetable">
                            <Clock className="h-4 w-4 mr-2" />
                            Timetable
                        </TabsTrigger>
                    </TabsList>

                    {activeTab === "tasks" && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant={
                                    viewMode === "kanban"
                                        ? "secondary"
                                        : "ghost"
                                }
                                size="sm"
                                onClick={() => setViewMode("kanban")}
                                aria-label="Kanban view"
                                className={cn(
                                    "text-primary",
                                    viewMode === "kanban" &&
                                        "bg-primary/10 text-primary hover:bg-primary/20"
                                )}>
                                <Grid3x3 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={
                                    viewMode === "list" ? "secondary" : "ghost"
                                }
                                size="sm"
                                onClick={() => setViewMode("list")}
                                aria-label="List view"
                                className={cn(
                                    "text-primary",
                                    viewMode === "list" &&
                                        "bg-primary/10 hover:bg-primary/20"
                                )}>
                                <List className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => setTaskModalOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Task
                            </Button>
                        </div>
                    )}
                    {activeTab === "subjects" && (
                        <Button onClick={() => setSubjectModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Subject
                        </Button>
                    )}
                    {activeTab === "exams" && (
                        <Button onClick={() => setExamModalOpen(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Exam
                        </Button>
                    )}
                </div>

                <TabsContent value="tasks" className="space-y-4">
                    {filteredTasks.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <Target className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                                <h3 className="text-xl font-semibold mb-2 text-foreground">
                                    {currentYearId || currentTermId
                                        ? "No tasks in this term"
                                        : "No tasks yet"}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {currentYearId || currentTermId
                                        ? "Add subjects to this term or change your filter"
                                        : "Create your first task to get started"}
                                </p>
                                <Button onClick={() => setTaskModalOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Task
                                </Button>
                            </CardContent>
                        </Card>
                    ) : viewMode === "kanban" ? (
                        <KanbanBoard
                            columns={kanbanColumns.map((col) => ({
                                id: col.id,
                                title: col.title,
                                items: col.tasks,
                                color: col.color,
                            }))}
                            getItemId={(task) => task.id}
                            onDragEnd={(taskId, newStatus) => {
                                const task = data.university.tasks.find(
                                    (t) => t.id === taskId
                                );
                                if (task) {
                                    handleTaskStatusChange(
                                        task,
                                        newStatus as UniversityTask["status"]
                                    );
                                }
                            }}
                            renderItem={(task) => (
                                <KanbanCard
                                    id={task.id}
                                    title={task.title}
                                    description={task.description}
                                    badges={getTaskBadges(task)}
                                    actions={getTaskActions(task)}
                                />
                            )}
                            dragOverlay={(task) => (
                                <KanbanCard
                                    id={task.id}
                                    title={task.title}
                                    description={task.description}
                                    badges={getTaskBadges(task)}
                                    actions={[]}
                                />
                            )}
                        />
                    ) : (
                        <ListView
                            items={filteredTasks}
                            getItemId={(task) => task.id}
                            emptyMessage="No tasks yet. Create your first task to get started."
                            renderItem={(task) => (
                                <ListCard
                                    title={task.title}
                                    description={task.description}
                                    badges={getListTaskBadges(task)}
                                    actions={[
                                        {
                                            icon: <Edit className="h-4 w-4" />,
                                            onClick: () => {
                                                setEditingTask(task);
                                                setTaskModalOpen(true);
                                            },
                                            label: "Edit",
                                        },
                                        {
                                            icon: (
                                                <Trash2 className="h-4 w-4" />
                                            ),
                                            onClick: () =>
                                                handleDeleteTask(task.id),
                                            variant: "destructive",
                                            label: "Delete",
                                        },
                                    ]}
                                />
                            )}
                        />
                    )}
                </TabsContent>

                {/* Grades Tab */}
                <TabsContent value="grades" className="space-y-6">
                    {filteredSubjects.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <Award className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                                <h3 className="text-xl font-semibold mb-2 text-foreground">
                                    {currentYearId || currentTermId
                                        ? "No subjects in this term"
                                        : "No subjects yet"}
                                </h3>
                                <p className="text-muted-foreground mb-4 text-center">
                                    {currentYearId || currentTermId
                                        ? "Add subjects to this term or change your filter"
                                        : "Add subjects to start tracking your grades"}
                                </p>
                                <Button
                                    onClick={() => setSubjectModalOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Subject
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            {/* Overall Summary Card */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5" />
                                        Overall Performance
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {(() => {
                                        const gradeEntries =
                                            data.university.gradeEntries || [];
                                        let totalEarned = 0;
                                        let totalPossible = 0;

                                        filteredSubjects.forEach((subject) => {
                                            const subjectExams =
                                                filteredExams.filter(
                                                    (e) =>
                                                        e.subjectId ===
                                                        subject.id
                                                );
                                            const subjectEntries =
                                                gradeEntries.filter(
                                                    (e) =>
                                                        e.subjectId ===
                                                        subject.id
                                                );
                                            const grades = calculateGrades(
                                                subjectExams,
                                                subjectEntries
                                            );
                                            totalEarned += grades.totalEarned;
                                            totalPossible +=
                                                grades.totalPossible;
                                        });

                                        const overallPercentage =
                                            totalPossible > 0
                                                ? (totalEarned /
                                                      totalPossible) *
                                                  100
                                                : 0;

                                        return (
                                            <div className="flex flex-col md:flex-row items-center gap-6">
                                                <div className="text-center p-6 bg-muted/30 rounded-xl flex-1">
                                                    <Award
                                                        className={cn(
                                                            "w-12 h-12 mx-auto mb-2",
                                                            getGradeColor(
                                                                overallPercentage
                                                            )
                                                        )}
                                                    />
                                                    <div
                                                        className={cn(
                                                            "text-4xl font-bold",
                                                            getGradeColor(
                                                                overallPercentage
                                                            )
                                                        )}>
                                                        {overallPercentage.toFixed(
                                                            1
                                                        )}
                                                        %
                                                    </div>
                                                    <div className="text-sm text-muted-foreground mt-1">
                                                        Overall Grade
                                                    </div>
                                                </div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span>
                                                            Total Points Earned
                                                        </span>
                                                        <span className="font-medium">
                                                            {totalEarned.toFixed(
                                                                1
                                                            )}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span>
                                                            Total Possible
                                                            Points
                                                        </span>
                                                        <span className="font-medium">
                                                            {totalPossible.toFixed(
                                                                1
                                                            )}
                                                        </span>
                                                    </div>
                                                    <Separator className="my-2" />
                                                    <div className="flex justify-between text-sm">
                                                        <span>
                                                            Subjects with Grades
                                                        </span>
                                                        <span className="font-medium">
                                                            {
                                                                filteredSubjects.filter(
                                                                    (
                                                                        subject
                                                                    ) => {
                                                                        const subjectExams =
                                                                            filteredExams.filter(
                                                                                (
                                                                                    e
                                                                                ) =>
                                                                                    e.subjectId ===
                                                                                        subject.id &&
                                                                                    e.taken &&
                                                                                    e.grade !==
                                                                                        undefined
                                                                            );
                                                                        const subjectEntries =
                                                                            (
                                                                                data
                                                                                    .university
                                                                                    .gradeEntries ||
                                                                                []
                                                                            ).filter(
                                                                                (
                                                                                    e
                                                                                ) =>
                                                                                    e.subjectId ===
                                                                                    subject.id
                                                                            );
                                                                        return (
                                                                            subjectExams.length >
                                                                                0 ||
                                                                            subjectEntries.length >
                                                                                0
                                                                        );
                                                                    }
                                                                ).length
                                                            }{" "}
                                                            /{" "}
                                                            {
                                                                filteredSubjects.length
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </CardContent>
                            </Card>

                            {/* Subject Grades List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {filteredSubjects.map((subject) => {
                                    const subjectExams = filteredExams.filter(
                                        (e) => e.subjectId === subject.id
                                    );
                                    const subjectEntries = (
                                        data.university.gradeEntries || []
                                    ).filter((e) => e.subjectId === subject.id);
                                    const grades = calculateGrades(
                                        subjectExams,
                                        subjectEntries
                                    );
                                    const gradedExamsCount =
                                        subjectExams.filter(
                                            (e) =>
                                                e.taken && e.grade !== undefined
                                        ).length;

                                    return (
                                        <Card
                                            key={subject.id}
                                            className="cursor-pointer hover:shadow-md transition-all"
                                            style={{
                                                borderLeftWidth: "4px",
                                                borderLeftColor: subject.color,
                                            }}
                                            onClick={() =>
                                                navigate(
                                                    `/university/subject/${subject.id}`
                                                )
                                            }>
                                            <CardContent className="pt-6">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div>
                                                        <h3 className="font-semibold text-lg">
                                                            {subject.name}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {gradedExamsCount}{" "}
                                                            exam
                                                            {gradedExamsCount !==
                                                                1 && "s"}{" "}
                                                            graded
                                                            {subjectEntries.length >
                                                                0 &&
                                                                ` • ${
                                                                    subjectEntries.length
                                                                } other grade${
                                                                    subjectEntries.length !==
                                                                    1
                                                                        ? "s"
                                                                        : ""
                                                                }`}
                                                        </p>
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            "text-2xl font-bold",
                                                            getGradeColor(
                                                                grades.percentage
                                                            )
                                                        )}>
                                                        {grades.totalPossible >
                                                        0
                                                            ? `${grades.percentage.toFixed(
                                                                  1
                                                              )}%`
                                                            : "—"}
                                                    </div>
                                                </div>

                                                {grades.totalPossible > 0 ? (
                                                    <>
                                                        <Progress
                                                            value={Math.min(
                                                                grades.percentage,
                                                                100
                                                            )}
                                                            className="h-2 mb-2"
                                                        />
                                                        <div className="text-xs text-muted-foreground">
                                                            {grades.totalEarned.toFixed(
                                                                1
                                                            )}{" "}
                                                            /{" "}
                                                            {grades.totalPossible.toFixed(
                                                                1
                                                            )}{" "}
                                                            points
                                                        </div>
                                                    </>
                                                ) : (
                                                    <div className="text-sm text-muted-foreground italic">
                                                        No grades recorded yet
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </TabsContent>

                <TabsContent value="subjects" className="space-y-4">
                    {filteredSubjects.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <BookOpen className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                                <h3 className="text-xl font-semibold mb-2 text-foreground">
                                    {currentYearId || currentTermId
                                        ? "No subjects in this term"
                                        : "No subjects yet"}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {currentYearId || currentTermId
                                        ? "Add subjects to this term or change your filter"
                                        : "Add your first subject to organize your courses"}
                                </p>
                                <Button
                                    onClick={() => setSubjectModalOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Subject
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredSubjects.map((subject) => {
                                const subjectTasks = filteredTasks.filter(
                                    (t) => t.subjectId === subject.id
                                );
                                const completedTasks = subjectTasks.filter(
                                    (t) => t.status === "done"
                                ).length;
                                const progress =
                                    subjectTasks.length > 0
                                        ? Math.round(
                                              (completedTasks /
                                                  subjectTasks.length) *
                                                  100
                                          )
                                        : 0;

                                return (
                                    <Card
                                        key={subject.id}
                                        className="hover:shadow-lg transition-shadow cursor-pointer"
                                        onClick={() =>
                                            navigate(
                                                `/university/subject/${subject.id}`
                                            )
                                        }>
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{
                                                            backgroundColor:
                                                                subject.color,
                                                        }}
                                                    />
                                                    <div>
                                                        <CardTitle>
                                                            {subject.name}
                                                        </CardTitle>
                                                    </div>
                                                </div>
                                                <div
                                                    onClick={(e) =>
                                                        e.stopPropagation()
                                                    }>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-sm">
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setEditingSubject(
                                                                        subject
                                                                    );
                                                                    setSubjectModalOpen(
                                                                        true
                                                                    );
                                                                }}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    handleDeleteSubject(
                                                                        subject.id
                                                                    )
                                                                }
                                                                className="text-destructive">
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            {subject.professor && (
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    Prof. {subject.professor}
                                                </p>
                                            )}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        Progress
                                                    </span>
                                                    <span className="font-medium">
                                                        {progress}%
                                                    </span>
                                                </div>
                                                <Progress value={progress} />
                                                <div className="flex items-center justify-between text-sm pt-2">
                                                    <span className="text-muted-foreground">
                                                        Tasks
                                                    </span>
                                                    <span className="font-medium">
                                                        {completedTasks} /{" "}
                                                        {subjectTasks.length}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="exams" className="space-y-4">
                    {filteredExams.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-16">
                                <Calendar className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                                <h3 className="text-xl font-semibold mb-2 text-foreground">
                                    {currentYearId || currentTermId
                                        ? "No exams in this term"
                                        : "No exams scheduled"}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {currentYearId || currentTermId
                                        ? "Add exams to subjects in this term or change your filter"
                                        : "Add your exam dates to stay prepared"}
                                </p>
                                <Button onClick={() => setExamModalOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Exam
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {filteredExams
                                .sort(
                                    (a, b) =>
                                        new Date(a.date).getTime() -
                                        new Date(b.date).getTime()
                                )
                                .map((exam) => {
                                    const subject =
                                        data.university.subjects.find(
                                            (s) => s.id === exam.subjectId
                                        );
                                    return (
                                        <ExamCard
                                            key={exam.id}
                                            exam={exam}
                                            subjectName={subject?.name}
                                            subjectColor={subject?.color}
                                            onMarkAsTaken={
                                                handleMarkExamAsTaken
                                            }
                                            onAddGrade={handleAddExamGrade}
                                            onEdit={(e) => {
                                                setEditingExam(e);
                                                setExamModalOpen(true);
                                            }}
                                            onDelete={(e) =>
                                                handleDeleteExam(e.id)
                                            }
                                        />
                                    );
                                })}
                        </div>
                    )}
                </TabsContent>

                {/* Timetable Tab */}
                <TabsContent value="timetable">
                    <Timetable
                        subjects={filteredSubjects}
                        onAddSchedule={(subjectId) => {
                            const subject = filteredSubjects.find(
                                (s) => s.id === subjectId
                            );
                            if (subject) {
                                setEditingTimetableSubject(subject);
                                setTimetableModalOpen(true);
                            }
                        }}
                        onEditSchedule={(subjectId) => {
                            const subject = filteredSubjects.find(
                                (s) => s.id === subjectId
                            );
                            if (subject) {
                                setEditingTimetableSubject(subject);
                                setTimetableModalOpen(true);
                            }
                        }}
                    />
                </TabsContent>
            </Tabs>

            <SubjectModal
                isOpen={subjectModalOpen}
                onClose={() => {
                    setSubjectModalOpen(false);
                    setEditingSubject(undefined);
                }}
                subject={editingSubject}
            />
            <TaskModal
                isOpen={taskModalOpen}
                onClose={() => {
                    setTaskModalOpen(false);
                    setEditingTask(undefined);
                }}
                task={editingTask}
            />
            <ExamModal
                isOpen={examModalOpen}
                onClose={() => {
                    setExamModalOpen(false);
                    setEditingExam(undefined);
                }}
                exam={editingExam}
            />
            <MarkExamModal
                isOpen={markExamModalOpen}
                onClose={() => {
                    setMarkExamModalOpen(false);
                    setSelectedExamForGrade(undefined);
                }}
                exam={selectedExamForGrade || null}
                mode={markExamMode}
                onSave={handleSaveExamGrade}
            />
            <TimetableModal
                isOpen={timetableModalOpen}
                onClose={() => {
                    setTimetableModalOpen(false);
                    setEditingTimetableSubject(undefined);
                }}
                subject={editingTimetableSubject}
            />
            <ManageYearsModal
                isOpen={manageYearsModalOpen}
                onClose={() => setManageYearsModalOpen(false)}
                years={academicYears}
                terms={terms}
                onSave={handleSaveYearsAndTerms}
            />
        </div>
    );
};
