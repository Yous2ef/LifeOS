import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProjectDetailView } from "@/components/programming/ProjectDetailView";
import type { CodingProject, ProjectTask } from "@/types/programming";
import toast from "react-hot-toast";

const PROGRAMMING_DATA_KEY = "lifeos-programming-data";

export const ProgrammingProjectDetail = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<CodingProject | null>(null);
    const [tasks, setTasks] = useState<ProjectTask[]>([]);
    const [loading, setLoading] = useState(true);

    // Load project and tasks from localStorage
    useEffect(() => {
        if (!projectId) {
            setLoading(false);
            return;
        }

        const stored = localStorage.getItem(PROGRAMMING_DATA_KEY);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                const foundProject = data.projects?.find(
                    (p: CodingProject) => p.id === projectId
                );

                if (foundProject) {
                    setProject(foundProject);
                    setTasks(foundProject.tasks || []);
                } else {
                    setProject(null);
                    setTasks([]);
                }
            } catch (error) {
                console.error("Failed to load project:", error);
                setProject(null);
                setTasks([]);
            }
        }
        setLoading(false);
    }, [projectId]);

    const updateProject = (updates: Partial<CodingProject>) => {
        if (!project) return;

        const stored = localStorage.getItem(PROGRAMMING_DATA_KEY);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                const updatedProjects = data.projects.map((p: CodingProject) =>
                    p.id === project.id
                        ? {
                              ...p,
                              ...updates,
                              updatedAt: new Date().toISOString(),
                          }
                        : p
                );

                const updatedData = { ...data, projects: updatedProjects };
                localStorage.setItem(
                    PROGRAMMING_DATA_KEY,
                    JSON.stringify(updatedData)
                );

                const updatedProject = {
                    ...project,
                    ...updates,
                    updatedAt: new Date().toISOString(),
                };
                setProject(updatedProject);

                // Update tasks if they're part of the update
                if (updates.tasks) {
                    setTasks(updates.tasks);
                }
            } catch (error) {
                console.error("Failed to update project:", error);
                toast.error("Failed to update project");
            }
        }
    };

    const deleteProject = () => {
        if (!project) return;

        const stored = localStorage.getItem(PROGRAMMING_DATA_KEY);
        if (stored) {
            try {
                const data = JSON.parse(stored);
                const filteredProjects = data.projects.filter(
                    (p: CodingProject) => p.id !== project.id
                );
                const updatedData = { ...data, projects: filteredProjects };
                localStorage.setItem(
                    PROGRAMMING_DATA_KEY,
                    JSON.stringify(updatedData)
                );
            } catch (error) {
                console.error("Failed to delete project:", error);
                toast.error("Failed to delete project");
            }
        }
    };

    const addTask = (task: Omit<ProjectTask, "id" | "createdAt">) => {
        if (!project) return;

        const newTask: ProjectTask = {
            ...task,
            id: `task-${Date.now()}`,
            createdAt: new Date().toISOString(),
        };

        const updatedTasks = [...tasks, newTask];
        setTasks(updatedTasks);
        updateProject({ tasks: updatedTasks });
        toast.success("Task added successfully");
    };

    const updateTask = (taskId: string, updates: Partial<ProjectTask>) => {
        const updatedTasks = tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates } : t
        );
        setTasks(updatedTasks);
        updateProject({ tasks: updatedTasks });
        toast.success("Task updated successfully");
    };

    const deleteTask = (taskId: string) => {
        const updatedTasks = tasks.filter((t) => t.id !== taskId);
        setTasks(updatedTasks);
        updateProject({ tasks: updatedTasks });
        toast.success("Task deleted successfully");
    };

    const toggleTask = (taskId: string) => {
        const updatedTasks = tasks.map((t) =>
            t.id === taskId
                ? {
                      ...t,
                      completed: !t.completed,
                      completedAt: !t.completed
                          ? new Date().toISOString()
                          : undefined,
                  }
                : t
        );
        setTasks(updatedTasks);
        updateProject({ tasks: updatedTasks });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground">Loading project...</p>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                    Project Not Found
                </h2>
                <p className="text-muted-foreground mb-6">
                    The project you're looking for doesn't exist.
                </p>
                <button
                    onClick={() => navigate("/programming")}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    Back to Programming
                </button>
            </div>
        );
    }

    return (
        <ProjectDetailView
            project={project}
            tasks={tasks}
            onBack={() => navigate("/programming")}
            onUpdate={(updates) => {
                updateProject(updates);
                toast.success("Project updated successfully");
            }}
            onDelete={() => {
                deleteProject();
                toast.success("Project deleted");
                navigate("/programming");
            }}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onToggleTask={toggleTask}
        />
    );
};
