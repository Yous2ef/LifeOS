import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus,
    Briefcase,
    DollarSign,
    Target,
    TrendingUp,
    AlertCircle,
    Grid3x3,
    List as ListIcon,
    ListTodo,
    FolderKanban,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Modal } from "@/components/ui/Modal";
import { FormInput } from "@/components/ui/FormInput";
import { ProjectsKanban } from "@/components/freelancing/ProjectsKanban";
import { ProjectsList } from "@/components/freelancing/ProjectsList";
import { ProjectModal } from "@/components/freelancing/ProjectModal";
import { StandaloneTasks } from "@/components/freelancing/StandaloneTasks";
import { StandaloneTaskModal } from "@/components/freelancing/TaskModals";
import {
    useFreelancingProjects,
    useStandaloneTasks,
    calculateFinancialStats,
} from "@/hooks/useFreelancing";
import type { TaskStatus } from "@/types/modules/freelancing";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export const Freelancing = () => {
    const navigate = useNavigate();
    const { projects, addProject, updateProject, getProjectById } =
        useFreelancingProjects();
    const {
        tasks: standaloneTasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
    } = useStandaloneTasks();

    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [showActualProfitModal, setShowActualProfitModal] = useState(false);
    const [projectToDone, setProjectToDone] = useState<string | null>(null);
    const [actualProfitInput, setActualProfitInput] = useState("");
    const [editingTask, setEditingTask] = useState<
        (typeof standaloneTasks)[0] | null
    >(null);
    const [projectView, setProjectView] = useState<"kanban" | "list">("kanban");

    const financialStats = calculateFinancialStats(projects);

    const handleProjectDone = (projectId: string) => {
        const project = getProjectById(projectId);
        if (!project) return;

        // If actual profit already set, just move to done
        if (project.actualProfit) {
            updateProject(projectId, { status: "done" });
            toast.success(`${project.name} marked as done! 🎉`);
        } else {
            // Show modal to input actual profit
            setProjectToDone(projectId);
            setActualProfitInput(project.expectedProfit.toString());
            setShowActualProfitModal(true);
        }
    };

    const handleActualProfitSubmit = () => {
        if (!projectToDone) return;

        const actualProfit = parseFloat(actualProfitInput) || 0;
        updateProject(projectToDone, {
            status: "done",
            actualProfit,
        });

        const project = getProjectById(projectToDone);
        toast.success(`${project?.name} completed! 🎉`);

        setShowActualProfitModal(false);
        setProjectToDone(null);
        setActualProfitInput("");
    };

    const handleStandaloneTaskToggle = (taskId: string, completed: boolean) => {
        // Find the current task to preserve its status when uncompleting
        const task = standaloneTasks.find((t) => t.id === taskId);

        if (completed) {
            // When marking as completed, always set to "completed"
            toggleTaskStatus(taskId, "completed");
            toast.success("Task completed! ✓");
        } else {
            // When uncompleting, restore to previous status or default to "todo"
            // If task was "completed", move back to "todo"
            const newStatus: TaskStatus =
                task?.status === "completed" ? "todo" : task?.status || "todo";
            toggleTaskStatus(taskId, newStatus);
        }
    };

    // Calculate stats using useMemo
    const stats = useMemo(() => {
        const totalProjects = projects.length;
        const todoProjects = projects.filter((p) => p.status === "todo").length;
        const inProgressProjects = projects.filter(
            (p) => p.status === "inProgress"
        ).length;
        const doneProjects = projects.filter((p) => p.status === "done").length;

        const totalTasks = standaloneTasks.length;
        const completedTasks = standaloneTasks.filter(
            (t) => t.status === "completed"
        ).length;

        return {
            totalProjects,
            todoProjects,
            inProgressProjects,
            doneProjects,
            totalEarned: financialStats.totalEarned,
            totalExpected: financialStats.totalExpected,
            totalTasks,
            completedTasks,
        };
    }, [projects, standaloneTasks, financialStats]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight flex items-center gap-3 text-foreground">
                        <Briefcase className="h-10 w-10" />
                        Freelancing
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your projects, clients, and tasks
                    </p>
                </div>
            </div>

            <Separator />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${stats.totalEarned.toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            From completed projects
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Active Projects
                        </CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.inProgressProjects}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Currently in progress
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending Projects
                        </CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.todoProjects}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Waiting to start
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Tasks Progress
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.completedTasks}/{stats.totalTasks}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {stats.totalTasks > 0
                                ? Math.round(
                                      (stats.completedTasks /
                                          stats.totalTasks) *
                                          100
                                  )
                                : 0}
                            % completion
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
            </div>

            {/* Tabs Section */}
            <Tabs defaultValue="projects" className="space-y-4">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="projects">
                            <FolderKanban className="h-4 w-4 mr-2" />
                            Projects
                        </TabsTrigger>
                        <TabsTrigger value="tasks">
                            <ListTodo className="h-4 w-4 mr-2" />
                            Standalone Tasks
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Projects Tab */}
                <TabsContent value="projects" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-foreground">
                            Projects
                        </h2>
                        <div className="flex items-center gap-2">
                            <Button
                                variant={
                                    projectView === "kanban"
                                        ? "secondary"
                                        : "ghost"
                                }
                                size="sm"
                                onClick={() => setProjectView("kanban")}
                                aria-label="Kanban view"
                                className={cn(
                                    "text-primary",
                                    projectView === "kanban" &&
                                        "bg-primary/10 text-primary hover:bg-primary/20"
                                )}>
                                <Grid3x3 className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={
                                    projectView === "list"
                                        ? "secondary"
                                        : "ghost"
                                }
                                size="sm"
                                onClick={() => setProjectView("list")}
                                aria-label="List view"
                                className={cn(
                                    "text-primary",
                                    projectView === "list" &&
                                        "bg-primary/10 hover:bg-primary/20"
                                )}>
                                <ListIcon className="h-4 w-4" />
                            </Button>
                            <Button onClick={() => setShowProjectModal(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Project
                            </Button>
                        </div>
                    </div>

                    {projectView === "kanban" ? (
                        <ProjectsKanban
                            projects={projects}
                            onProjectClick={(projectId) =>
                                navigate(`/freelancing/project/${projectId}`)
                            }
                            onProjectUpdate={(projectId, updates) => {
                                updateProject(projectId, updates);
                                toast.success("Project updated");
                            }}
                            onProjectDone={handleProjectDone}
                        />
                    ) : (
                        <ProjectsList
                            projects={projects}
                            onProjectClick={(projectId) =>
                                navigate(`/freelancing/project/${projectId}`)
                            }
                        />
                    )}
                </TabsContent>

                {/* Tasks Tab */}
                <TabsContent value="tasks" className="space-y-4">
                    <StandaloneTasks
                        tasks={standaloneTasks}
                        onAddTask={() => {
                            setEditingTask(null);
                            setShowTaskModal(true);
                        }}
                        onEditTask={(task) => {
                            setEditingTask(task);
                            setShowTaskModal(true);
                        }}
                        onDeleteTask={(taskId) => {
                            deleteTask(taskId);
                            toast.success("Task deleted");
                        }}
                        onToggleStatus={handleStandaloneTaskToggle}
                        onUpdateTaskStatus={(taskId, newStatus) => {
                            toggleTaskStatus(taskId, newStatus);
                            toast.success("Task moved!");
                        }}
                    />
                </TabsContent>
            </Tabs>

            {/* Project Modal */}
            {showProjectModal && (
                <ProjectModal
                    isOpen={showProjectModal}
                    onClose={() => setShowProjectModal(false)}
                    onSave={(projectData) => {
                        addProject(projectData);
                        setShowProjectModal(false);
                        toast.success("Project created successfully!");
                    }}
                    mode="create"
                />
            )}

            {/* Standalone Task Modal */}
            {showTaskModal && (
                <StandaloneTaskModal
                    isOpen={showTaskModal}
                    onClose={() => {
                        setShowTaskModal(false);
                        setEditingTask(null);
                    }}
                    onSave={(taskData) => {
                        if (editingTask) {
                            updateTask(editingTask.id, taskData);
                            toast.success("Task updated");
                        } else {
                            addTask(taskData);
                            toast.success("Task added!");
                        }
                        setShowTaskModal(false);
                        setEditingTask(null);
                    }}
                    task={editingTask || undefined}
                    mode={editingTask ? "edit" : "create"}
                />
            )}

            {/* Actual Profit Modal */}
            {showActualProfitModal && (
                <Modal
                    isOpen={showActualProfitModal}
                    onClose={() => {
                        setShowActualProfitModal(false);
                        setProjectToDone(null);
                    }}
                    title="🎉 Project Completed!"
                    footer={
                        <>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowActualProfitModal(false);
                                    setProjectToDone(null);
                                }}>
                                Cancel
                            </Button>
                            <Button
                                variant="default"
                                onClick={handleActualProfitSubmit}>
                                Mark as Done
                            </Button>
                        </>
                    }>
                    <div className="space-y-4">
                        <p className="text-muted-foreground">
                            Congratulations! Please enter the actual profit you
                            earned from this project.
                        </p>
                        <FormInput
                            label="Actual Profit *"
                            type="number"
                            value={actualProfitInput}
                            onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                            ) => setActualProfitInput(e.target.value)}
                            placeholder="5000"
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
};
