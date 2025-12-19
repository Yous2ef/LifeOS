import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Plus,
    Edit,
    Trash2,
    Clock,
    MapPin,
    Calendar,
    FileText,
    Link as LinkIcon,
    CheckCircle2,
    Circle,
    BookOpen,
    ListTodo,
    ExternalLink,
    User,
    Grid3x3,
    List,
    Award,
    GraduationCap,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "../context/AppContext";
import { TaskModal } from "../components/university/TaskModal";
import { SubjectModal } from "../components/university/SubjectModal";
import { ResourceModal } from "../components/university/ResourceModal";
import { ExamModal } from "../components/university/ExamModal";
import { ExamCard } from "../components/university/ExamCard";
import { MarkExamModal } from "../components/university/MarkExamModal";
import { GradeEntryModal } from "../components/university/GradeEntryModal";
import { GradeSummaryCard } from "../components/university/GradeSummaryCard";
import { SubjectGradesChart } from "../components/university/SubjectGradesChart";
import { KanbanBoard } from "../components/common/KanbanBoard";
import { KanbanCard } from "../components/common/KanbanCard";
import type {
    KanbanCardAction,
    KanbanCardBadge,
} from "../components/common/KanbanCard";
import { cn } from "@/lib/utils";
import { formatDate, getDaysUntil, getPriorityColor } from "../utils/helpers";
import type { UniversityTask, Resource, Exam, GradeEntry } from "../types";

export const SubjectDetails = () => {
    const { subjectId } = useParams<{ subjectId: string }>();
    const navigate = useNavigate();
    const { data, updateData, showToast } = useApp();
    const [activeTab, setActiveTab] = useState("overview");
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [subjectModalOpen, setSubjectModalOpen] = useState(false);
    const [resourceModalOpen, setResourceModalOpen] = useState(false);
    const [examModalOpen, setExamModalOpen] = useState(false);
    const [markExamModalOpen, setMarkExamModalOpen] = useState(false);
    const [gradeEntryModalOpen, setGradeEntryModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<UniversityTask | undefined>(
        undefined
    );
    const [editingResource, setEditingResource] = useState<
        Resource | undefined
    >(undefined);
    const [editingExam, setEditingExam] = useState<Exam | undefined>(undefined);
    const [selectedExamForGrade, setSelectedExamForGrade] =
        useState<Exam | null>(null);
    const [markExamMode, setMarkExamMode] = useState<"mark" | "grade">("mark");
    const [editingGradeEntry, setEditingGradeEntry] = useState<
        GradeEntry | undefined
    >(undefined);
    const [description, setDescription] = useState("");
    const [isEditingDescription, setIsEditingDescription] = useState(false);

    // Find the subject
    const subject = useMemo(() => {
        return data.university.subjects.find((s) => s.id === subjectId);
    }, [data.university.subjects, subjectId]);

    // Load description from subject
    useEffect(() => {
        if (subject?.description) {
            setDescription(subject.description);
        }
    }, [subject]);

    // Get tasks for this subject
    const subjectTasks = useMemo(() => {
        return data.university.tasks.filter((t) => t.subjectId === subjectId);
    }, [data.university.tasks, subjectId]);

    // Get exams for this subject
    const subjectExams = useMemo(() => {
        return data.university.exams.filter((e) => e.subjectId === subjectId);
    }, [data.university.exams, subjectId]);

    // Get grade entries for this subject
    const subjectGradeEntries = useMemo(() => {
        return (data.university.gradeEntries || []).filter(
            (e) => e.subjectId === subjectId
        );
    }, [data.university.gradeEntries, subjectId]);

    // Task statistics
    const taskStats = useMemo(() => {
        const completed = subjectTasks.filter(
            (t) => t.status === "done"
        ).length;
        const total = subjectTasks.length;
        const pending = total - completed;
        const completionRate = total > 0 ? (completed / total) * 100 : 0;

        return { completed, total, pending, completionRate };
    }, [subjectTasks]);

    // Group tasks by status for Kanban view
    const tasksByStatus = useMemo(() => {
        return {
            todo: subjectTasks.filter((t) => t.status === "todo"),
            "in-progress": subjectTasks.filter(
                (t) => t.status === "in-progress"
            ),
            done: subjectTasks.filter((t) => t.status === "done"),
        };
    }, [subjectTasks]);

    if (!subject) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-12">
                    <h2 className="text-2xl font-bold mb-4">
                        Subject Not Found
                    </h2>
                    <p className="text-muted-foreground mb-6">
                        The subject you're looking for doesn't exist.
                    </p>
                    <Button onClick={() => navigate("/university")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to University
                    </Button>
                </div>
            </div>
        );
    }

    const handleTaskComplete = (taskId: string) => {
        const updatedTasks = data.university.tasks.map((task) =>
            task.id === taskId
                ? {
                      ...task,
                      status: (task.status === "done" ? "todo" : "done") as
                          | "todo"
                          | "in-progress"
                          | "done",
                  }
                : task
        );
        updateData({
            university: {
                ...data.university,
                tasks: updatedTasks,
            },
        });
    };

    const handleTaskDelete = (taskId: string) => {
        const updatedTasks = data.university.tasks.filter(
            (t) => t.id !== taskId
        );
        updateData({
            university: {
                ...data.university,
                tasks: updatedTasks,
            },
        });
        showToast("Task deleted successfully!", "success");
    };

    const handleTaskStatusChange = (
        taskId: string,
        newStatus: "todo" | "in-progress" | "done"
    ) => {
        const updatedTasks = data.university.tasks.map((task) =>
            task.id === taskId ? { ...task, status: newStatus } : task
        );
        updateData({
            university: {
                ...data.university,
                tasks: updatedTasks,
            },
        });
    };

    const handleSaveDescription = () => {
        const updatedSubjects = data.university.subjects.map((s) =>
            s.id === subjectId
                ? { ...s, description: description.trim() || undefined }
                : s
        );
        updateData({
            university: {
                ...data.university,
                subjects: updatedSubjects,
            },
        });
        setIsEditingDescription(false);
        showToast("Description saved!", "success");
    };

    const handleAddResource = (resourceData: Omit<Resource, "id">) => {
        const newResource: Resource = {
            id: Date.now().toString(),
            ...resourceData,
        };

        const updatedSubjects = data.university.subjects.map((s) =>
            s.id === subjectId
                ? {
                      ...s,
                      resources: [...(s.resources || []), newResource],
                  }
                : s
        );

        updateData({
            university: {
                ...data.university,
                subjects: updatedSubjects,
            },
        });

        setResourceModalOpen(false);
        showToast("Resource added successfully!", "success");
    };

    const handleEditResource = (resourceData: Omit<Resource, "id">) => {
        if (!editingResource) return;

        const updatedSubjects = data.university.subjects.map((s) =>
            s.id === subjectId
                ? {
                      ...s,
                      resources: (s.resources || []).map((r) =>
                          r.id === editingResource.id
                              ? { ...r, ...resourceData }
                              : r
                      ),
                  }
                : s
        );

        updateData({
            university: {
                ...data.university,
                subjects: updatedSubjects,
            },
        });

        setResourceModalOpen(false);
        setEditingResource(undefined);
        showToast("Resource updated successfully!", "success");
    };

    const handleDeleteResource = (resourceId: string) => {
        const updatedSubjects = data.university.subjects.map((s) =>
            s.id === subjectId
                ? {
                      ...s,
                      resources: (s.resources || []).filter(
                          (r) => r.id !== resourceId
                      ),
                  }
                : s
        );

        updateData({
            university: {
                ...data.university,
                subjects: updatedSubjects,
            },
        });

        showToast("Resource deleted successfully!", "success");
    };

    // Exam handlers
    const handleMarkExamAsTaken = (exam: Exam) => {
        setSelectedExamForGrade(exam);
        setMarkExamMode("mark");
        setMarkExamModalOpen(true);
    };

    const handleAddExamGrade = (exam: Exam) => {
        setSelectedExamForGrade(exam);
        setMarkExamMode("grade");
        setMarkExamModalOpen(true);
    };

    const handleEditExam = (exam: Exam) => {
        setEditingExam(exam);
        setExamModalOpen(true);
    };

    const handleDeleteExam = (exam: Exam) => {
        if (confirm("Are you sure you want to delete this exam?")) {
            updateData({
                university: {
                    ...data.university,
                    exams: data.university.exams.filter(
                        (e) => e.id !== exam.id
                    ),
                },
            });
            showToast("Exam deleted successfully!", "success");
        }
    };

    const handleSaveExamGrade = (examId: string, updates: Partial<Exam>) => {
        updateData({
            university: {
                ...data.university,
                exams: data.university.exams.map((e) =>
                    e.id === examId ? { ...e, ...updates } : e
                ),
            },
        });
        showToast(
            updates.grade !== undefined
                ? "Grade saved successfully!"
                : "Exam marked as taken!",
            "success"
        );
    };

    // Grade entry handlers
    const handleSaveGradeEntry = (entry: GradeEntry) => {
        const existingEntries = data.university.gradeEntries || [];
        const existingIndex = existingEntries.findIndex(
            (e) => e.id === entry.id
        );

        if (existingIndex >= 0) {
            // Update existing entry
            updateData({
                university: {
                    ...data.university,
                    gradeEntries: existingEntries.map((e) =>
                        e.id === entry.id ? entry : e
                    ),
                },
            });
            showToast("Grade entry updated!", "success");
        } else {
            // Add new entry
            updateData({
                university: {
                    ...data.university,
                    gradeEntries: [...existingEntries, entry],
                },
            });
            showToast("Grade entry added!", "success");
        }
    };

    const handleDeleteGradeEntry = (entryId: string) => {
        if (confirm("Are you sure you want to delete this grade entry?")) {
            updateData({
                university: {
                    ...data.university,
                    gradeEntries: (data.university.gradeEntries || []).filter(
                        (e) => e.id !== entryId
                    ),
                },
            });
            showToast("Grade entry deleted!", "success");
        }
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/university")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to University
                    </Button>
                    <Button
                        onClick={() => setSubjectModalOpen(true)}
                        variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Subject
                    </Button>
                </div>

                {/* Subject Info Card */}
                <Card
                    className="border-l-4"
                    style={{ borderLeftColor: subject.color }}>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-4">
                            <div
                                className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold shadow-md"
                                style={{ backgroundColor: subject.color }}>
                                {subject.name
                                    .split(" ")
                                    .slice(0, 2)
                                    .map((word) => word.charAt(0).toUpperCase())
                                    .join("")}
                            </div>
                            <div className="flex-1">
                                <h1 className="text-3xl font-bold mb-2">
                                    {subject.name}
                                </h1>
                                {subject.professor && (
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="w-4 h-4" />
                                        <span className="text-lg">
                                            {subject.professor}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <ListTodo className="w-8 h-8 mx-auto mb-2 text-primary" />
                            <div className="text-2xl font-bold">
                                {taskStats.total}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Total Tasks
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                            <div className="text-2xl font-bold">
                                {taskStats.completed}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Completed
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Circle className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                            <div className="text-2xl font-bold">
                                {taskStats.pending}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Pending
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <Calendar className="w-8 h-8 mx-auto mb-2 text-blue-500" />
                            <div className="text-2xl font-bold">
                                {subjectExams.length}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Exams
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex-wrap h-auto gap-1">
                    <TabsTrigger value="overview">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="exams">
                        <GraduationCap className="w-4 h-4 mr-2" />
                        Exams & Grades
                    </TabsTrigger>
                    <TabsTrigger value="tasks">
                        <ListTodo className="w-4 h-4 mr-2" />
                        Tasks ({subjectTasks.length})
                    </TabsTrigger>
                    <TabsTrigger value="schedule">
                        <Clock className="w-4 h-4 mr-2" />
                        Schedule
                    </TabsTrigger>
                    <TabsTrigger value="notes">
                        <FileText className="w-4 h-4 mr-2" />
                        Notes
                    </TabsTrigger>
                    <TabsTrigger value="resources">
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Resources
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Schedule Overview */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    Schedule
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {subject.lectures &&
                                    subject.lectures.length > 0 && (
                                        <div>
                                            <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    style={{
                                                        borderColor:
                                                            subject.color,
                                                        color: subject.color,
                                                    }}>
                                                    Lectures
                                                </Badge>
                                            </div>
                                            {subject.lectures.map(
                                                (lecture, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="pl-4 py-2 border-l-2"
                                                        style={{
                                                            borderColor:
                                                                subject.color,
                                                        }}>
                                                        <div className="font-medium">
                                                            {lecture.day}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                            <Clock className="w-3 h-3" />
                                                            {lecture.startTime}{" "}
                                                            - {lecture.endTime}
                                                        </div>
                                                        {lecture.location && (
                                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                                <MapPin className="w-3 h-3" />
                                                                {
                                                                    lecture.location
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                {subject.sections &&
                                    subject.sections.length > 0 && (
                                        <div>
                                            <div className="text-sm font-semibold mb-2 flex items-center gap-2">
                                                <Badge
                                                    variant="outline"
                                                    style={{
                                                        borderColor:
                                                            subject.color,
                                                        color: subject.color,
                                                        opacity: 0.8,
                                                    }}>
                                                    Sections
                                                </Badge>
                                            </div>
                                            {subject.sections.map(
                                                (section, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="pl-4 py-2 border-l-2"
                                                        style={{
                                                            borderColor:
                                                                subject.color,
                                                            opacity: 0.8,
                                                        }}>
                                                        <div className="font-medium">
                                                            {section.day}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                            <Clock className="w-3 h-3" />
                                                            {section.startTime}{" "}
                                                            - {section.endTime}
                                                        </div>
                                                        {section.location && (
                                                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                                <MapPin className="w-3 h-3" />
                                                                {
                                                                    section.location
                                                                }
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    )}

                                {(!subject.lectures ||
                                    subject.lectures.length === 0) &&
                                    (!subject.sections ||
                                        subject.sections.length === 0) && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No schedule set
                                        </div>
                                    )}
                            </CardContent>
                        </Card>

                        {/* Recent Tasks */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <ListTodo className="w-5 h-5" />
                                        Recent Tasks
                                    </CardTitle>
                                    <Button
                                        size="sm"
                                        onClick={() => setTaskModalOpen(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Task
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {subjectTasks.slice(0, 5).map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center justify-between p-2 border rounded hover:bg-accent/50 transition-colors">
                                            <div className="flex items-center gap-3 flex-1">
                                                <button
                                                    onClick={() =>
                                                        handleTaskComplete(
                                                            task.id
                                                        )
                                                    }
                                                    className={cn(
                                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                                        task.status === "done"
                                                            ? "bg-primary border-primary"
                                                            : "border-muted-foreground"
                                                    )}>
                                                    {task.status === "done" && (
                                                        <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                                                    )}
                                                </button>
                                                <div className="flex-1">
                                                    <div
                                                        className={cn(
                                                            "font-medium",
                                                            task.status ===
                                                                "done" &&
                                                                "line-through text-muted-foreground"
                                                        )}>
                                                        {task.title}
                                                    </div>
                                                    {task.dueDate && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Due:{" "}
                                                            {formatDate(
                                                                task.dueDate
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <Badge
                                                variant="outline"
                                                style={{
                                                    borderColor:
                                                        getPriorityColor(
                                                            task.priority
                                                        ),
                                                    color: getPriorityColor(
                                                        task.priority
                                                    ),
                                                }}>
                                                {task.priority}
                                            </Badge>
                                        </div>
                                    ))}
                                    {subjectTasks.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            No tasks yet
                                        </div>
                                    )}
                                    {subjectTasks.length > 5 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full"
                                            onClick={() =>
                                                setActiveTab("tasks")
                                            }>
                                            View all {subjectTasks.length} tasks
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Exams & Grades Tab */}
                <TabsContent value="exams" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Exams List */}
                        <div className="lg:col-span-2 space-y-4">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5" />
                                            Exams ({subjectExams.length})
                                        </CardTitle>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setEditingExam(undefined);
                                                setExamModalOpen(true);
                                            }}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Exam
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {subjectExams.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p className="text-lg font-medium">
                                                No exams yet
                                            </p>
                                            <p className="text-sm mt-2">
                                                Add exams to track your grades
                                            </p>
                                        </div>
                                    ) : (
                                        subjectExams
                                            .sort((a, b) => {
                                                const now = new Date();
                                                const today = new Date(
                                                    now.getFullYear(),
                                                    now.getMonth(),
                                                    now.getDate()
                                                );
                                                const dateA = new Date(a.date);
                                                const dateB = new Date(b.date);

                                                // Priority: 1=Overdue, 2=Upcoming, 3=Missing grade, 4=Graded
                                                const getPriority = (
                                                    exam: typeof a
                                                ) => {
                                                    const examDate = new Date(
                                                        exam.date
                                                    );
                                                    const isPast =
                                                        examDate < today;

                                                    if (!exam.taken && isPast)
                                                        return 1;
                                                    if (!exam.taken && !isPast)
                                                        return 2;
                                                    if (
                                                        exam.taken &&
                                                        exam.grade === undefined
                                                    )
                                                        return 3;
                                                    return 4;
                                                };

                                                const priorityA =
                                                    getPriority(a);
                                                const priorityB =
                                                    getPriority(b);

                                                if (priorityA !== priorityB) {
                                                    return (
                                                        priorityA - priorityB
                                                    );
                                                }

                                                // Upcoming: soonest first, others: most recent first
                                                if (priorityA === 2) {
                                                    return (
                                                        dateA.getTime() -
                                                        dateB.getTime()
                                                    );
                                                } else {
                                                    return (
                                                        dateB.getTime() -
                                                        dateA.getTime()
                                                    );
                                                }
                                            })
                                            .map((exam) => (
                                                <ExamCard
                                                    key={exam.id}
                                                    exam={exam}
                                                    subjectColor={subject.color}
                                                    onMarkAsTaken={
                                                        handleMarkExamAsTaken
                                                    }
                                                    onAddGrade={
                                                        handleAddExamGrade
                                                    }
                                                    onEdit={handleEditExam}
                                                    onDelete={handleDeleteExam}
                                                />
                                            ))
                                    )}
                                </CardContent>
                            </Card>

                            {/* Other Grade Entries */}
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="flex items-center gap-2">
                                            <Award className="w-5 h-5" />
                                            Other Grades (
                                            {subjectGradeEntries.length})
                                        </CardTitle>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                setEditingGradeEntry(undefined);
                                                setGradeEntryModalOpen(true);
                                            }}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Grade
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {subjectGradeEntries.length === 0 ? (
                                        <div className="text-center py-6 text-muted-foreground">
                                            <p className="text-sm">
                                                Add assignments, quizzes,
                                                attendance, and other grades
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {subjectGradeEntries
                                                .sort(
                                                    (a, b) =>
                                                        new Date(
                                                            b.date
                                                        ).getTime() -
                                                        new Date(
                                                            a.date
                                                        ).getTime()
                                                )
                                                .map((entry) => (
                                                    <div
                                                        key={entry.id}
                                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-medium">
                                                                    {
                                                                        entry.title
                                                                    }
                                                                </span>
                                                                <Badge
                                                                    variant="outline"
                                                                    className="text-xs capitalize">
                                                                    {entry.type}
                                                                </Badge>
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {formatDate(
                                                                    entry.date
                                                                )}
                                                                {entry.description &&
                                                                    ` • ${entry.description}`}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={cn(
                                                                    "font-bold text-lg",
                                                                    entry.type ===
                                                                        "bonus" &&
                                                                        "text-green-600 dark:text-green-400",
                                                                    entry.type ===
                                                                        "deduction" &&
                                                                        "text-red-600 dark:text-red-400"
                                                                )}>
                                                                {entry.type ===
                                                                    "bonus" &&
                                                                    "+"}
                                                                {entry.type ===
                                                                    "deduction" &&
                                                                    "-"}
                                                                {
                                                                    entry.pointsEarned
                                                                }
                                                                {entry.maxPoints &&
                                                                    `/${entry.maxPoints}`}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setEditingGradeEntry(
                                                                            entry
                                                                        );
                                                                        setGradeEntryModalOpen(
                                                                            true
                                                                        );
                                                                    }}>
                                                                    <Edit className="w-4 h-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() =>
                                                                        handleDeleteGradeEntry(
                                                                            entry.id
                                                                        )
                                                                    }>
                                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Performance Chart */}
                            <SubjectGradesChart
                                exams={subjectExams}
                                gradeEntries={subjectGradeEntries}
                                subjectColor={subject.color}
                            />
                        </div>

                        {/* Right Column - Grade Summary */}
                        <div className="space-y-4">
                            <GradeSummaryCard
                                subject={subject}
                                exams={subjectExams}
                                gradeEntries={subjectGradeEntries}
                            />
                        </div>
                    </div>
                </TabsContent>

                {/* Tasks Tab */}
                <TabsContent value="tasks">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>All Tasks</CardTitle>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center border rounded-md">
                                        <Button
                                            variant={
                                                viewMode === "kanban"
                                                    ? "default"
                                                    : "ghost"
                                            }
                                            size="sm"
                                            onClick={() =>
                                                setViewMode("kanban")
                                            }
                                            className="rounded-r-none">
                                            <Grid3x3 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant={
                                                viewMode === "list"
                                                    ? "default"
                                                    : "ghost"
                                            }
                                            size="sm"
                                            onClick={() => setViewMode("list")}
                                            className="rounded-l-none">
                                            <List className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={() => setTaskModalOpen(true)}>
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Task
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {viewMode === "kanban" ? (
                                // Kanban View
                                subjectTasks.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <ListTodo className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium">
                                            No tasks yet
                                        </p>
                                        <p className="text-sm mt-2">
                                            Click "Add Task" to create your
                                            first task
                                        </p>
                                    </div>
                                ) : (
                                    <KanbanBoard
                                        columns={[
                                            {
                                                id: "todo",
                                                title: "To Do",
                                                items: tasksByStatus.todo,
                                                color: "from-blue-500 to-blue-600",
                                            },
                                            {
                                                id: "in-progress",
                                                title: "In Progress",
                                                items: tasksByStatus[
                                                    "in-progress"
                                                ],
                                                color: "from-yellow-500 to-yellow-600",
                                            },
                                            {
                                                id: "done",
                                                title: "Done",
                                                items: tasksByStatus.done,
                                                color: "from-green-500 to-green-600",
                                            },
                                        ]}
                                        onDragEnd={(taskId, newColumnId) => {
                                            handleTaskStatusChange(
                                                taskId,
                                                newColumnId as
                                                    | "todo"
                                                    | "in-progress"
                                                    | "done"
                                            );
                                        }}
                                        getItemId={(task) => task.id}
                                        renderItem={(task) => {
                                            const badges: KanbanCardBadge[] =
                                                [];

                                            // Priority badge
                                            badges.push({
                                                label: task.priority.toString(),
                                                variant: "outline",
                                                icon: undefined,
                                            });

                                            // Due date badge
                                            if (task.dueDate) {
                                                const daysLeft = getDaysUntil(
                                                    task.dueDate
                                                );
                                                badges.push({
                                                    label: formatDate(
                                                        task.dueDate
                                                    ),
                                                    variant:
                                                        task.status !==
                                                            "done" &&
                                                        daysLeft <= 3
                                                            ? "destructive"
                                                            : "secondary",
                                                    icon: (
                                                        <Calendar className="w-3 h-3" />
                                                    ),
                                                });
                                            }

                                            const actions: KanbanCardAction[] =
                                                [
                                                    {
                                                        label: "Edit",
                                                        icon: (
                                                            <Edit className="w-4 h-4" />
                                                        ),
                                                        onClick: () => {
                                                            setEditingTask(
                                                                task
                                                            );
                                                            setTaskModalOpen(
                                                                true
                                                            );
                                                        },
                                                    },
                                                    {
                                                        label:
                                                            task.status ===
                                                            "done"
                                                                ? "Mark as Todo"
                                                                : "Mark as Done",
                                                        icon: (
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        ),
                                                        onClick: () =>
                                                            handleTaskComplete(
                                                                task.id
                                                            ),
                                                        separator: true,
                                                    },
                                                    {
                                                        label: "Delete",
                                                        icon: (
                                                            <Trash2 className="w-4 h-4" />
                                                        ),
                                                        onClick: () =>
                                                            handleTaskDelete(
                                                                task.id
                                                            ),
                                                        variant: "destructive",
                                                    },
                                                ];

                                            return (
                                                <KanbanCard
                                                    id={task.id}
                                                    title={task.title}
                                                    description={
                                                        task.description
                                                    }
                                                    badges={badges}
                                                    actions={actions}
                                                />
                                            );
                                        }}
                                        dragOverlay={(task) => (
                                            <KanbanCard
                                                id={task.id}
                                                title={task.title}
                                                description={task.description}
                                                badges={[
                                                    {
                                                        label: task.priority.toString(),
                                                        variant: "outline",
                                                    },
                                                    ...(task.dueDate
                                                        ? [
                                                              {
                                                                  label: formatDate(
                                                                      task.dueDate
                                                                  ),
                                                                  variant:
                                                                      "secondary" as const,
                                                                  icon: (
                                                                      <Calendar className="w-3 h-3" />
                                                                  ),
                                                              },
                                                          ]
                                                        : []),
                                                ]}
                                                actions={[]}
                                            />
                                        )}
                                    />
                                )
                            ) : (
                                // List View
                                <div className="space-y-2">
                                    {subjectTasks.map((task) => (
                                        <div
                                            key={task.id}
                                            className="flex items-center justify-between p-3 border rounded hover:bg-accent/50 transition-colors">
                                            <div className="flex items-center gap-3 flex-1">
                                                <button
                                                    onClick={() =>
                                                        handleTaskComplete(
                                                            task.id
                                                        )
                                                    }
                                                    className={cn(
                                                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                                        task.status === "done"
                                                            ? "bg-primary border-primary"
                                                            : "border-muted-foreground"
                                                    )}>
                                                    {task.status === "done" && (
                                                        <CheckCircle2 className="w-3 h-3 text-primary-foreground" />
                                                    )}
                                                </button>
                                                <div className="flex-1">
                                                    <div
                                                        className={cn(
                                                            "font-medium",
                                                            task.status ===
                                                                "done" &&
                                                                "line-through text-muted-foreground"
                                                        )}>
                                                        {task.title}
                                                    </div>
                                                    {task.description && (
                                                        <div className="text-sm text-muted-foreground">
                                                            {task.description}
                                                        </div>
                                                    )}
                                                    <div className="flex items-center gap-4 mt-1">
                                                        {task.dueDate && (
                                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Calendar className="w-3 h-3" />
                                                                {formatDate(
                                                                    task.dueDate
                                                                )}
                                                                {task.status !==
                                                                    "done" &&
                                                                    getDaysUntil(
                                                                        task.dueDate
                                                                    ) <= 3 && (
                                                                        <span className="text-red-500 font-medium">
                                                                            (
                                                                            {getDaysUntil(
                                                                                task.dueDate
                                                                            )}{" "}
                                                                            days
                                                                            left)
                                                                        </span>
                                                                    )}
                                                            </div>
                                                        )}
                                                        <Badge
                                                            variant="outline"
                                                            style={{
                                                                borderColor:
                                                                    getPriorityColor(
                                                                        task.priority
                                                                    ),
                                                                color: getPriorityColor(
                                                                    task.priority
                                                                ),
                                                            }}>
                                                            {task.priority}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingTask(task);
                                                        setTaskModalOpen(true);
                                                    }}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        handleTaskDelete(
                                                            task.id
                                                        )
                                                    }>
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {subjectTasks.length === 0 && (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <ListTodo className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p className="text-lg font-medium">
                                                No tasks yet
                                            </p>
                                            <p className="text-sm mt-2">
                                                Click "Add Task" to create your
                                                first task
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Schedule Tab */}
                <TabsContent value="schedule">
                    <Card>
                        <CardHeader>
                            <CardTitle>Class Schedule</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6 w-full ">
                            {/* Lectures */}
                            {subject.lectures &&
                                subject.lectures.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                style={{
                                                    borderColor: subject.color,
                                                    color: subject.color,
                                                }}>
                                                Lectures
                                            </Badge>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {subject.lectures.map(
                                                (lecture, idx) => (
                                                    <Card key={idx}>
                                                        <CardContent className="pt-6">
                                                            <div className="space-y-2">
                                                                <div className="font-semibold text-lg">
                                                                    {
                                                                        lecture.day
                                                                    }
                                                                </div>
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <Clock className="w-4 h-4" />
                                                                    {
                                                                        lecture.startTime
                                                                    }{" "}
                                                                    -{" "}
                                                                    {
                                                                        lecture.endTime
                                                                    }
                                                                </div>
                                                                {lecture.location && (
                                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                                        <MapPin className="w-4 h-4" />
                                                                        {
                                                                            lecture.location
                                                                        }
                                                                    </div>
                                                                )}
                                                                {subject.professor && (
                                                                    <div className="text-sm text-muted-foreground mt-2">
                                                                        Professor:{" "}
                                                                        {
                                                                            subject.professor
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                            {/* Sections */}
                            {subject.sections &&
                                subject.sections.length > 0 && (
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                                            <Badge
                                                variant="outline"
                                                style={{
                                                    borderColor: subject.color,
                                                    color: subject.color,
                                                    opacity: 0.8,
                                                }}>
                                                Sections
                                            </Badge>
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {subject.sections.map(
                                                (section, idx) => (
                                                    <Card key={idx}>
                                                        <CardContent className="pt-6">
                                                            <div className="space-y-2">
                                                                <div className="font-semibold text-lg">
                                                                    {
                                                                        section.day
                                                                    }
                                                                </div>
                                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                                    <Clock className="w-4 h-4" />
                                                                    {
                                                                        section.startTime
                                                                    }{" "}
                                                                    -{" "}
                                                                    {
                                                                        section.endTime
                                                                    }
                                                                </div>
                                                                {section.location && (
                                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                                        <MapPin className="w-4 h-4" />
                                                                        {
                                                                            section.location
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )}

                            {(!subject.lectures ||
                                subject.lectures.length === 0) &&
                                (!subject.sections ||
                                    subject.sections.length === 0) && (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="text-lg font-medium">
                                            No schedule set
                                        </p>
                                        <p className="text-sm mt-2">
                                            Edit the subject to add lectures and
                                            sections
                                        </p>
                                    </div>
                                )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notes Tab */}
                <TabsContent value="notes">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Notes & Description</CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        setIsEditingDescription(
                                            !isEditingDescription
                                        )
                                    }>
                                    {isEditingDescription ? "Cancel" : "Edit"}
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isEditingDescription ? (
                                <div className="space-y-4">
                                    <textarea
                                        className="w-full min-h-[300px] p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                        placeholder="Add notes, important information, or description for this subject..."
                                        value={description}
                                        onChange={(e) =>
                                            setDescription(e.target.value)
                                        }
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            variant="secondary"
                                            onClick={() =>
                                                setIsEditingDescription(false)
                                            }>
                                            Cancel
                                        </Button>
                                        <Button onClick={handleSaveDescription}>
                                            Save Notes
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    {description ? (
                                        <div className="prose prose-sm max-w-none">
                                            <p className="whitespace-pre-wrap">
                                                {description}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                            <p className="text-lg font-medium">
                                                No notes yet
                                            </p>
                                            <p className="text-sm mt-2">
                                                Click "Edit" to add notes and
                                                description
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Resources Tab */}
                <TabsContent value="resources">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Links & Resources</CardTitle>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setEditingResource(undefined);
                                        setResourceModalOpen(true);
                                    }}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Resource
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {subject.resources &&
                            subject.resources.length > 0 ? (
                                <div className="space-y-3">
                                    {subject.resources.map((resource) => (
                                        <Card
                                            key={resource.id}
                                            className="hover:shadow-md transition-shadow">
                                            <CardContent className="pt-6">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-start gap-3 flex-1">
                                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                            <LinkIcon className="w-5 h-5 text-primary" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-semibold mb-1 flex items-center gap-2">
                                                                {resource.title}
                                                            </h3>
                                                            <a
                                                                href={
                                                                    resource.url
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-primary hover:underline flex items-center gap-1 mb-2 break-all">
                                                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                                                {resource.url}
                                                            </a>
                                                            {resource.description && (
                                                                <p className="text-sm text-muted-foreground">
                                                                    {
                                                                        resource.description
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => {
                                                                setEditingResource(
                                                                    resource
                                                                );
                                                                setResourceModalOpen(
                                                                    true
                                                                );
                                                            }}>
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleDeleteResource(
                                                                    resource.id
                                                                )
                                                            }>
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <LinkIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium">
                                        No resources yet
                                    </p>
                                    <p className="text-sm mt-2">
                                        Add useful links, documents, and
                                        resources for this subject
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Task Modal */}
            <TaskModal
                isOpen={taskModalOpen}
                onClose={() => {
                    setTaskModalOpen(false);
                    setEditingTask(undefined);
                }}
                task={editingTask}
            />

            {/* Subject Modal */}
            <SubjectModal
                isOpen={subjectModalOpen}
                onClose={() => setSubjectModalOpen(false)}
                subject={subject}
            />

            {/* Resource Modal */}
            <ResourceModal
                isOpen={resourceModalOpen}
                onClose={() => {
                    setResourceModalOpen(false);
                    setEditingResource(undefined);
                }}
                onSave={
                    editingResource ? handleEditResource : handleAddResource
                }
                resource={editingResource}
            />

            {/* Exam Modal */}
            <ExamModal
                isOpen={examModalOpen}
                onClose={() => {
                    setExamModalOpen(false);
                    setEditingExam(undefined);
                }}
                exam={editingExam}
            />

            {/* Mark Exam Modal */}
            <MarkExamModal
                isOpen={markExamModalOpen}
                onClose={() => {
                    setMarkExamModalOpen(false);
                    setSelectedExamForGrade(null);
                }}
                onSave={handleSaveExamGrade}
                exam={selectedExamForGrade}
                mode={markExamMode}
            />

            {/* Grade Entry Modal */}
            <GradeEntryModal
                isOpen={gradeEntryModalOpen}
                onClose={() => {
                    setGradeEntryModalOpen(false);
                    setEditingGradeEntry(undefined);
                }}
                onSave={handleSaveGradeEntry}
                subjectId={subjectId || ""}
                entry={editingGradeEntry}
            />
        </div>
    );
};
