import { useState, useEffect } from "react";
import type {
    Project,
    ProjectTask,
    StandaloneTask,
    TaskStatus,
    ProjectStatus,
    Currency,
    FinancialStats,
} from "@/types/freelancing";

const PROJECTS_KEY = "lifeos-freelancing-projects";
const PROJECT_TASKS_KEY = "lifeos-freelancing-project-tasks";
const STANDALONE_TASKS_KEY = "lifeos-freelancing-standalone-tasks";

// ==================== Projects Hook ====================
export const useFreelancingProjects = () => {
    const [projects, setProjects] = useState<Project[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(PROJECTS_KEY);
        if (stored) {
            try {
                const parsedProjects: Project[] = JSON.parse(stored);

                // Migration: Fix any projects with invalid status values
                const fixedProjects = parsedProjects.map((project) => {
                    if (
                        !["todo", "inProgress", "done"].includes(project.status)
                    ) {
                        console.warn(
                            `Fixing project "${project.name}" - invalid status: ${project.status}`
                        );
                        return {
                            ...project,
                            status: "todo" as ProjectStatus,
                        };
                    }
                    return project;
                });

                // Save back to localStorage if any fixes were made
                const needsMigration = fixedProjects.some(
                    (p, i) => p.status !== parsedProjects[i].status
                );
                if (needsMigration) {
                    localStorage.setItem(
                        PROJECTS_KEY,
                        JSON.stringify(fixedProjects)
                    );
                    console.log(
                        "✅ Projects status values migrated successfully!"
                    );
                }

                setProjects(fixedProjects);
            } catch {
                console.error("Failed to load projects");
            }
        }
    }, []);

    const saveProjects = (newProjects: Project[]) => {
        setProjects(newProjects);
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(newProjects));
    };

    const addProject = (
        projectData: Omit<Project, "id" | "createdAt" | "updatedAt">
    ) => {
        const newProject: Project = {
            ...projectData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        saveProjects([...projects, newProject]);
        return newProject;
    };

    const updateProject = (id: string, updates: Partial<Project>) => {
        const updated = projects.map((p) =>
            p.id === id
                ? { ...p, ...updates, updatedAt: new Date().toISOString() }
                : p
        );
        saveProjects(updated);
    };

    const deleteProject = (id: string) => {
        saveProjects(projects.filter((p) => p.id !== id));
        // Also delete all tasks for this project
        const tasks = getProjectTasks();
        const filteredTasks = tasks.filter((t) => t.projectId !== id);
        localStorage.setItem(PROJECT_TASKS_KEY, JSON.stringify(filteredTasks));
    };

    const getProjectById = (id: string) => {
        return projects.find((p) => p.id === id);
    };

    return {
        projects,
        addProject,
        updateProject,
        deleteProject,
        getProjectById,
    };
};

// ==================== Project Tasks Hook ====================
export const useProjectTasks = (projectId?: string) => {
    const [tasks, setTasks] = useState<ProjectTask[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(PROJECT_TASKS_KEY);
        if (stored) {
            try {
                const allTasks: ProjectTask[] = JSON.parse(stored);
                if (projectId) {
                    setTasks(allTasks.filter((t) => t.projectId === projectId));
                } else {
                    setTasks(allTasks);
                }
            } catch {
                console.error("Failed to load tasks");
            }
        }
    }, [projectId]);

    const loadTasks = () => {
        const stored = localStorage.getItem(PROJECT_TASKS_KEY);
        if (stored) {
            try {
                const allTasks: ProjectTask[] = JSON.parse(stored);
                if (projectId) {
                    setTasks(allTasks.filter((t) => t.projectId === projectId));
                } else {
                    setTasks(allTasks);
                }
            } catch {
                console.error("Failed to load tasks");
            }
        }
    };

    const addTask = (
        taskData: Omit<ProjectTask, "id" | "createdAt" | "completed">
    ) => {
        const newTask: ProjectTask = {
            ...taskData,
            id: crypto.randomUUID(),
            completed: false,
            createdAt: new Date().toISOString(),
        };

        const stored = localStorage.getItem(PROJECT_TASKS_KEY);
        const allTasks: ProjectTask[] = stored ? JSON.parse(stored) : [];
        const updatedTasks = [...allTasks, newTask];
        localStorage.setItem(PROJECT_TASKS_KEY, JSON.stringify(updatedTasks));

        if (!projectId || taskData.projectId === projectId) {
            setTasks([...tasks, newTask]);
        }
        return newTask;
    };

    const updateTask = (id: string, updates: Partial<ProjectTask>) => {
        const stored = localStorage.getItem(PROJECT_TASKS_KEY);
        const allTasks: ProjectTask[] = stored ? JSON.parse(stored) : [];

        const updatedTasks = allTasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
        );

        localStorage.setItem(PROJECT_TASKS_KEY, JSON.stringify(updatedTasks));

        if (projectId) {
            setTasks(updatedTasks.filter((t) => t.projectId === projectId));
        } else {
            setTasks(updatedTasks);
        }
    };

    const deleteTask = (id: string) => {
        const stored = localStorage.getItem(PROJECT_TASKS_KEY);
        const allTasks: ProjectTask[] = stored ? JSON.parse(stored) : [];
        const filteredTasks = allTasks.filter((t) => t.id !== id);

        localStorage.setItem(PROJECT_TASKS_KEY, JSON.stringify(filteredTasks));
        setTasks(
            filteredTasks.filter((t) => !projectId || t.projectId === projectId)
        );
    };

    const toggleTaskComplete = (id: string) => {
        const task = tasks.find((t) => t.id === id);
        if (task) {
            updateTask(id, {
                completed: !task.completed,
                completedAt: !task.completed
                    ? new Date().toISOString()
                    : undefined,
            });
        }
    };

    return {
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskComplete,
        reloadTasks: loadTasks,
    };
};

// ==================== Standalone Tasks Hook ====================
export const useStandaloneTasks = () => {
    const [tasks, setTasks] = useState<StandaloneTask[]>([]);

    useEffect(() => {
        const stored = localStorage.getItem(STANDALONE_TASKS_KEY);
        if (stored) {
            try {
                setTasks(JSON.parse(stored));
            } catch {
                console.error("Failed to load standalone tasks");
            }
        }
    }, []);

    const saveTasks = (newTasks: StandaloneTask[]) => {
        setTasks(newTasks);
        localStorage.setItem(STANDALONE_TASKS_KEY, JSON.stringify(newTasks));
    };

    const addTask = (taskData: Omit<StandaloneTask, "id" | "createdAt">) => {
        const newTask: StandaloneTask = {
            ...taskData,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };
        saveTasks([...tasks, newTask]);
        return newTask;
    };

    const updateTask = (id: string, updates: Partial<StandaloneTask>) => {
        const updated = tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
        );
        saveTasks(updated);
    };

    const deleteTask = (id: string) => {
        saveTasks(tasks.filter((t) => t.id !== id));
    };

    const toggleTaskStatus = (id: string, newStatus: TaskStatus) => {
        updateTask(id, {
            status: newStatus,
            completedAt:
                newStatus === "completed"
                    ? new Date().toISOString()
                    : undefined,
        });
    };

    return {
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
    };
};

// ==================== Helper Functions ====================

export const getProjectTasks = (): ProjectTask[] => {
    const stored = localStorage.getItem(PROJECT_TASKS_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const calculateFinancialStats = (
    projects: Project[]
): FinancialStats => {
    const todoProjects = projects.filter((p) => p.status === "todo");
    const inProgressProjects = projects.filter(
        (p) => p.status === "inProgress"
    );
    const doneProjects = projects.filter((p) => p.status === "done");

    const totalExpected = [...todoProjects, ...inProgressProjects].reduce(
        (sum, p) => sum + p.expectedProfit,
        0
    );

    const totalEarned = doneProjects.reduce(
        (sum, p) => sum + (p.actualProfit || p.expectedProfit),
        0
    );

    const averageProjectValue =
        projects.length > 0
            ? projects.reduce((sum, p) => sum + p.expectedProfit, 0) /
              projects.length
            : 0;

    return {
        totalExpected,
        totalEarned,
        projectsToDoCount: todoProjects.length,
        projectsInProgressCount: inProgressProjects.length,
        completedProjectsCount: doneProjects.length,
        averageProjectValue,
    };
};

export const getTasksForProject = (projectId: string): ProjectTask[] => {
    const allTasks = getProjectTasks();
    return allTasks.filter((t) => t.projectId === projectId);
};

export const calculateProjectProgress = (projectId: string): number => {
    const tasks = getTasksForProject(projectId);
    if (tasks.length === 0) return 0;
    const completedTasks = tasks.filter((t) => t.completed).length;
    return Math.round((completedTasks / tasks.length) * 100);
};

export const getPriorityColor = (priority: number): string => {
    if (priority >= 9) return "destructive"; // Red - Urgent
    if (priority >= 7) return "orange"; // Orange - High
    if (priority >= 4) return "default"; // Blue - Medium
    return "secondary"; // Gray/Green - Low
};

export const getPriorityLabel = (priority: number): string => {
    if (priority >= 9) return "Urgent";
    if (priority >= 7) return "High";
    if (priority >= 4) return "Medium";
    return "Low";
};

export const isOverdue = (deadline: string): boolean => {
    return new Date(deadline) < new Date();
};

export const getDaysRemaining = (deadline: string): number => {
    const now = new Date();
    const due = new Date(deadline);
    const diff = due.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export const formatCurrency = (amount: number, currency: Currency): string => {
    const symbols: Record<Currency, string> = {
        USD: "$",
        EUR: "€",
        GBP: "£",
        CAD: "C$",
        AUD: "A$",
        JPY: "¥",
        CNY: "¥",
    };
    return `${symbols[currency]}${amount.toLocaleString()}`;
};
