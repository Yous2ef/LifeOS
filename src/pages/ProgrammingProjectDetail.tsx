import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProjectDetailView } from "@/components/programming/ProjectDetailView";
import { useProgramming } from "@/hooks/useProgramming";
import type { CodingProject, ProjectTask } from "@/types/modules/programming";
import toast from "react-hot-toast";

export const ProgrammingProjectDetail = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const {
        projects,
        updateProject: updateProjectInStore,
        deleteProject: deleteProjectFromStore,
    } = useProgramming();

    // Find the project from the unified data store
    const project = useMemo(() => {
        if (!projectId) return null;
        return projects.find((p) => p.id === projectId) || null;
    }, [projects, projectId]);

    // Get tasks from the project
    const tasks = useMemo(() => project?.tasks || [], [project]);

    const handleUpdateProject = (updates: Partial<CodingProject>) => {
        if (!project) return;
        updateProjectInStore(project.id, updates);
    };

    const handleDeleteProject = () => {
        if (!project) return;
        deleteProjectFromStore(project.id);
    };

    const addTask = (task: Omit<ProjectTask, "id" | "createdAt">) => {
        if (!project) return;

        const newTask: ProjectTask = {
            ...task,
            id: `task-${Date.now()}`,
            createdAt: new Date().toISOString(),
        };

        const updatedTasks = [...tasks, newTask];
        handleUpdateProject({ tasks: updatedTasks });
        toast.success("Task added successfully");
    };

    const updateTask = (taskId: string, updates: Partial<ProjectTask>) => {
        const updatedTasks = tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates } : t
        );
        handleUpdateProject({ tasks: updatedTasks });
        toast.success("Task updated successfully");
    };

    const deleteTask = (taskId: string) => {
        const updatedTasks = tasks.filter((t) => t.id !== taskId);
        handleUpdateProject({ tasks: updatedTasks });
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
        handleUpdateProject({ tasks: updatedTasks });
    };

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
                handleUpdateProject(updates);
                toast.success("Project updated successfully");
            }}
            onDelete={() => {
                handleDeleteProject();
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
