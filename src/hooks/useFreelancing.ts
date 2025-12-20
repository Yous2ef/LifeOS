import { useCallback, useMemo } from "react";
import { useApp } from "../context/AppContext";
import type {
    Project,
    ProjectTask,
    StandaloneTask,
    TaskStatus,
    Currency,
    FinancialStats,
    FreelancingData,
} from "@/types/modules/freelancing";

const getDefaultData = (): FreelancingData => ({
    profile: {
        name: "",
        title: "",
        email: "",
        phone: "",
        portfolioUrl: "",
        cvVersions: [],
        platforms: [],
    },
    applications: [],
    projects: [],
    projectTasks: [],
    standaloneTasks: [],
});

// ==================== Projects Hook ====================
export const useFreelancingProjects = () => {
    const { data: appData, updateData } = useApp();

    // Get freelancing data from unified AppData, with defaults
    const freelancingData: FreelancingData = useMemo(
        () => ({
            ...getDefaultData(),
            ...appData.freelancing,
        }),
        [appData.freelancing]
    );

    const projects = freelancingData.projects;

    // Helper to update freelancing data in AppContext
    const setFreelancingData = useCallback(
        (updater: (prev: FreelancingData) => FreelancingData) => {
            updateData({
                freelancing: updater(freelancingData),
            });
        },
        [freelancingData, updateData]
    );

    const addProject = useCallback(
        (projectData: Omit<Project, "id" | "createdAt" | "updatedAt">) => {
            const newProject: Project = {
                ...projectData,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setFreelancingData((prev) => ({
                ...prev,
                projects: [...prev.projects, newProject],
            }));
            return newProject;
        },
        [setFreelancingData]
    );

    const updateProject = useCallback(
        (id: string, updates: Partial<Project>) => {
            setFreelancingData((prev) => ({
                ...prev,
                projects: prev.projects.map((p) =>
                    p.id === id
                        ? {
                              ...p,
                              ...updates,
                              updatedAt: new Date().toISOString(),
                          }
                        : p
                ),
            }));
        },
        [setFreelancingData]
    );

    const deleteProject = useCallback(
        (id: string) => {
            setFreelancingData((prev) => ({
                ...prev,
                projects: prev.projects.filter((p) => p.id !== id),
                // Also clean up project tasks
                projectTasks: prev.projectTasks.filter(
                    (t) => t.projectId !== id
                ),
            }));
        },
        [setFreelancingData]
    );

    const getProjectById = useCallback(
        (id: string) => {
            return projects.find((p) => p.id === id);
        },
        [projects]
    );

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
    const { data: appData, updateData } = useApp();

    // Get freelancing data from unified AppData, with defaults
    const freelancingData: FreelancingData = useMemo(
        () => ({
            ...getDefaultData(),
            ...appData.freelancing,
        }),
        [appData.freelancing]
    );

    const allTasks = freelancingData.projectTasks;

    const tasks = projectId
        ? allTasks.filter((t) => t.projectId === projectId)
        : allTasks;

    // Helper to update freelancing data in AppContext
    const setFreelancingData = useCallback(
        (updater: (prev: FreelancingData) => FreelancingData) => {
            updateData({
                freelancing: updater(freelancingData),
            });
        },
        [freelancingData, updateData]
    );

    const loadTasks = useCallback(() => {
        // No-op now since data comes from AppContext
    }, []);

    const addTask = useCallback(
        (taskData: Omit<ProjectTask, "id" | "createdAt" | "completed">) => {
            const newTask: ProjectTask = {
                ...taskData,
                id: crypto.randomUUID(),
                completed: false,
                createdAt: new Date().toISOString(),
            };
            setFreelancingData((prev) => ({
                ...prev,
                projectTasks: [...prev.projectTasks, newTask],
            }));
            return newTask;
        },
        [setFreelancingData]
    );

    const updateTask = useCallback(
        (id: string, updates: Partial<ProjectTask>) => {
            setFreelancingData((prev) => ({
                ...prev,
                projectTasks: prev.projectTasks.map((t) =>
                    t.id === id ? { ...t, ...updates } : t
                ),
            }));
        },
        [setFreelancingData]
    );

    const deleteTask = useCallback(
        (id: string) => {
            setFreelancingData((prev) => ({
                ...prev,
                projectTasks: prev.projectTasks.filter((t) => t.id !== id),
            }));
        },
        [setFreelancingData]
    );

    const deleteTasksForProject = useCallback(
        (projectIdToDelete: string) => {
            setFreelancingData((prev) => ({
                ...prev,
                projectTasks: prev.projectTasks.filter(
                    (t) => t.projectId !== projectIdToDelete
                ),
            }));
        },
        [setFreelancingData]
    );

    const toggleTaskComplete = useCallback(
        (id: string) => {
            setFreelancingData((prev) => ({
                ...prev,
                projectTasks: prev.projectTasks.map((t) =>
                    t.id === id
                        ? {
                              ...t,
                              completed: !t.completed,
                              completedAt: !t.completed
                                  ? new Date().toISOString()
                                  : undefined,
                          }
                        : t
                ),
            }));
        },
        [setFreelancingData]
    );

    return {
        tasks,
        allTasks,
        addTask,
        updateTask,
        deleteTask,
        deleteTasksForProject,
        toggleTaskComplete,
        reloadTasks: loadTasks,
    };
};

// ==================== Standalone Tasks Hook ====================
export const useStandaloneTasks = () => {
    const { data: appData, updateData } = useApp();

    // Get freelancing data from unified AppData, with defaults
    const freelancingData: FreelancingData = useMemo(
        () => ({
            ...getDefaultData(),
            ...appData.freelancing,
        }),
        [appData.freelancing]
    );

    const tasks = freelancingData.standaloneTasks;

    // Helper to update freelancing data in AppContext
    const setFreelancingData = useCallback(
        (updater: (prev: FreelancingData) => FreelancingData) => {
            updateData({
                freelancing: updater(freelancingData),
            });
        },
        [freelancingData, updateData]
    );

    const addTask = useCallback(
        (taskData: Omit<StandaloneTask, "id" | "createdAt">) => {
            const newTask: StandaloneTask = {
                ...taskData,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
            };
            setFreelancingData((prev) => ({
                ...prev,
                standaloneTasks: [...prev.standaloneTasks, newTask],
            }));
            return newTask;
        },
        [setFreelancingData]
    );

    const updateTask = useCallback(
        (id: string, updates: Partial<StandaloneTask>) => {
            setFreelancingData((prev) => ({
                ...prev,
                standaloneTasks: prev.standaloneTasks.map((t) =>
                    t.id === id ? { ...t, ...updates } : t
                ),
            }));
        },
        [setFreelancingData]
    );

    const deleteTask = useCallback(
        (id: string) => {
            setFreelancingData((prev) => ({
                ...prev,
                standaloneTasks: prev.standaloneTasks.filter(
                    (t) => t.id !== id
                ),
            }));
        },
        [setFreelancingData]
    );

    const toggleTaskStatus = useCallback(
        (id: string, newStatus: TaskStatus) => {
            setFreelancingData((prev) => ({
                ...prev,
                standaloneTasks: prev.standaloneTasks.map((t) =>
                    t.id === id
                        ? {
                              ...t,
                              status: newStatus,
                              completedAt:
                                  newStatus === "completed"
                                      ? new Date().toISOString()
                                      : undefined,
                          }
                        : t
                ),
            }));
        },
        [setFreelancingData]
    );

    return {
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleTaskStatus,
    };
};

// ==================== Helper Functions ====================

// Legacy function for backward compatibility - uses unified storage now
export const getProjectTasksFromStorage = (
    _loadData: <T>(key: string) => T | null
): ProjectTask[] => {
    // Deprecated - data should come from AppContext
    console.warn(
        "getProjectTasksFromStorage is deprecated. Use useProjectTasks hook."
    );
    return [];
};

// Legacy function for backward compatibility - returns empty since data is in AppContext
export const getProjectTasks = (): ProjectTask[] => {
    console.warn("getProjectTasks is deprecated. Use useProjectTasks hook.");
    return [];
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

export const getTasksForProject = (_projectId: string): ProjectTask[] => {
    console.warn("getTasksForProject is deprecated. Use useProjectTasks hook.");
    return [];
};

export const calculateProjectProgress = (_projectId: string): number => {
    console.warn(
        "calculateProjectProgress is deprecated. Use calculateProjectProgressFromTasks."
    );
    return 0;
};

// Calculate progress from provided tasks array (preferred method)
export const calculateProjectProgressFromTasks = (
    tasks: ProjectTask[]
): number => {
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
        EUR: "",
        GBP: "",
        CAD: "C$",
        AUD: "A$",
        JPY: "",
        CNY: "",
    };
    return `${symbols[currency]}${amount.toLocaleString()}`;
};
