import { useState, useEffect, useCallback } from "react";
import { generateId } from "@/utils/helpers";
import type {
    ProgrammingData,
    LearningItem,
    Skill,
    Tool,
    CodingProject,
    ProjectTask,
    ProgrammingStats,
} from "@/types/programming";

const STORAGE_KEY = "lifeos-programming-data";

const getInitialData = (): ProgrammingData => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            console.error("Failed to parse programming data:", e);
        }
    }
    return {
        learningItems: [],
        skills: [],
        tools: [],
        projects: [],
    };
};

const saveData = (data: ProgrammingData) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const useProgramming = () => {
    const [data, setData] = useState<ProgrammingData>(getInitialData);

    // Save to localStorage whenever data changes
    useEffect(() => {
        saveData(data);
    }, [data]);

    // Learning Items CRUD
    const addLearningItem = useCallback(
        (item: Omit<LearningItem, "id" | "createdAt" | "updatedAt">) => {
            const newItem: LearningItem = {
                ...item,
                id: generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setData((prev) => ({
                ...prev,
                learningItems: [...prev.learningItems, newItem],
            }));
            return newItem;
        },
        []
    );

    const updateLearningItem = useCallback(
        (id: string, updates: Partial<LearningItem>) => {
            setData((prev) => ({
                ...prev,
                learningItems: prev.learningItems.map((item) =>
                    item.id === id
                        ? {
                              ...item,
                              ...updates,
                              updatedAt: new Date().toISOString(),
                          }
                        : item
                ),
            }));
        },
        []
    );

    const deleteLearningItem = useCallback((id: string) => {
        setData((prev) => ({
            ...prev,
            learningItems: prev.learningItems.filter((item) => item.id !== id),
        }));
    }, []);

    // Skills CRUD
    const addSkill = useCallback(
        (skill: Omit<Skill, "id" | "createdAt" | "updatedAt">) => {
            const newSkill: Skill = {
                ...skill,
                id: generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setData((prev) => ({
                ...prev,
                skills: [...prev.skills, newSkill],
            }));
            return newSkill;
        },
        []
    );

    const updateSkill = useCallback((id: string, updates: Partial<Skill>) => {
        setData((prev) => ({
            ...prev,
            skills: prev.skills.map((skill) =>
                skill.id === id
                    ? {
                          ...skill,
                          ...updates,
                          updatedAt: new Date().toISOString(),
                      }
                    : skill
            ),
        }));
    }, []);

    const deleteSkill = useCallback((id: string) => {
        setData((prev) => ({
            ...prev,
            skills: prev.skills.filter((skill) => skill.id !== id),
        }));
    }, []);

    // Tools CRUD
    const addTool = useCallback(
        (tool: Omit<Tool, "id" | "createdAt" | "updatedAt">) => {
            const newTool: Tool = {
                ...tool,
                id: generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setData((prev) => ({
                ...prev,
                tools: [...prev.tools, newTool],
            }));
            return newTool;
        },
        []
    );

    const updateTool = useCallback((id: string, updates: Partial<Tool>) => {
        setData((prev) => ({
            ...prev,
            tools: prev.tools.map((tool) =>
                tool.id === id
                    ? {
                          ...tool,
                          ...updates,
                          updatedAt: new Date().toISOString(),
                      }
                    : tool
            ),
        }));
    }, []);

    const deleteTool = useCallback((id: string) => {
        setData((prev) => ({
            ...prev,
            tools: prev.tools.filter((tool) => tool.id !== id),
        }));
    }, []);

    // Projects CRUD
    const addProject = useCallback(
        (project: Omit<CodingProject, "id" | "createdAt" | "updatedAt">) => {
            const newProject: CodingProject = {
                ...project,
                id: generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setData((prev) => ({
                ...prev,
                projects: [...prev.projects, newProject],
            }));
            return newProject;
        },
        []
    );

    const updateProject = useCallback(
        (id: string, updates: Partial<CodingProject>) => {
            setData((prev) => ({
                ...prev,
                projects: prev.projects.map((project) =>
                    project.id === id
                        ? {
                              ...project,
                              ...updates,
                              updatedAt: new Date().toISOString(),
                          }
                        : project
                ),
            }));
        },
        []
    );

    const deleteProject = useCallback((id: string) => {
        setData((prev) => ({
            ...prev,
            projects: prev.projects.filter((project) => project.id !== id),
        }));
    }, []);

    // Project Tasks CRUD
    const addProjectTask = useCallback(
        (projectId: string, task: Omit<ProjectTask, "id" | "createdAt">) => {
            const newTask: ProjectTask = {
                ...task,
                id: generateId(),
                createdAt: new Date().toISOString(),
            };
            setData((prev) => ({
                ...prev,
                projects: prev.projects.map((project) =>
                    project.id === projectId
                        ? {
                              ...project,
                              tasks: [...project.tasks, newTask],
                              updatedAt: new Date().toISOString(),
                          }
                        : project
                ),
            }));
            return newTask;
        },
        []
    );

    const updateProjectTask = useCallback(
        (projectId: string, taskId: string, updates: Partial<ProjectTask>) => {
            setData((prev) => ({
                ...prev,
                projects: prev.projects.map((project) =>
                    project.id === projectId
                        ? {
                              ...project,
                              tasks: project.tasks.map((task) =>
                                  task.id === taskId
                                      ? {
                                            ...task,
                                            ...updates,
                                            completedAt:
                                                updates.completed &&
                                                !task.completed
                                                    ? new Date().toISOString()
                                                    : task.completedAt,
                                        }
                                      : task
                              ),
                              updatedAt: new Date().toISOString(),
                          }
                        : project
                ),
            }));
        },
        []
    );

    const deleteProjectTask = useCallback(
        (projectId: string, taskId: string) => {
            setData((prev) => ({
                ...prev,
                projects: prev.projects.map((project) =>
                    project.id === projectId
                        ? {
                              ...project,
                              tasks: project.tasks.filter(
                                  (task) => task.id !== taskId
                              ),
                              updatedAt: new Date().toISOString(),
                          }
                        : project
                ),
            }));
        },
        []
    );

    // Calculate stats
    const getStats = useCallback((): ProgrammingStats => {
        const totalLearningItems = data.learningItems.length;
        const completedLearningItems = data.learningItems.filter(
            (item) => item.status === "completed"
        ).length;
        const inProgressLearningItems = data.learningItems.filter(
            (item) => item.status === "in-progress"
        ).length;

        const totalSkills = data.skills.length;
        const averageSkillLevel =
            totalSkills > 0
                ? data.skills.reduce(
                      (sum, skill) => sum + skill.currentLevel,
                      0
                  ) / totalSkills
                : 0;

        const totalTools = data.tools.length;
        const masteredTools = data.tools.filter(
            (tool) => tool.status === "mastered"
        ).length;

        const totalProjects = data.projects.length;
        const completedProjects = data.projects.filter(
            (project) => project.status === "completed"
        ).length;

        const totalTimeSpent = data.learningItems.reduce(
            (sum, item) => sum + item.timeSpent,
            0
        );

        const completionRate =
            totalLearningItems > 0
                ? (completedLearningItems / totalLearningItems) * 100
                : 0;

        return {
            totalLearningItems,
            completedLearningItems,
            inProgressLearningItems,
            totalSkills,
            averageSkillLevel,
            totalTools,
            masteredTools,
            totalProjects,
            completedProjects,
            totalTimeSpent,
            completionRate,
        };
    }, [data]);

    return {
        // Data
        learningItems: data.learningItems,
        skills: data.skills,
        tools: data.tools,
        projects: data.projects,

        // Learning Items
        addLearningItem,
        updateLearningItem,
        deleteLearningItem,

        // Skills
        addSkill,
        updateSkill,
        deleteSkill,

        // Tools
        addTool,
        updateTool,
        deleteTool,

        // Projects
        addProject,
        updateProject,
        deleteProject,

        // Project Tasks
        addProjectTask,
        updateProjectTask,
        deleteProjectTask,

        // Stats
        getStats,
    };
};
