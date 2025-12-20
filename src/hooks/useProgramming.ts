import { useCallback, useMemo } from "react";
import { useApp } from "../context/AppContext";
import { generateId } from "@/utils/helpers";
import type {
    ProgrammingData,
    LearningItem,
    Skill,
    Tool,
    CodingProject,
    ProjectTask,
    ProgrammingStats,
} from "@/types/modules/programming";

const getDefaultData = (): ProgrammingData => ({
    learningItems: [],
    skills: [],
    tools: [],
    projects: [],
});

export const useProgramming = () => {
    const { data: appData, updateData } = useApp();

    // Get programming data from unified AppData, with defaults
    const data: ProgrammingData = useMemo(() => ({
        ...getDefaultData(),
        ...appData.programming,
    }), [appData.programming]);

    // Helper to update programming data in AppContext
    const setProgrammingData = useCallback(
        (updater: (prev: ProgrammingData) => ProgrammingData) => {
            updateData({
                programming: updater(data),
            });
        },
        [data, updateData]
    );

    // Learning Items CRUD
    const addLearningItem = useCallback(
        (item: Omit<LearningItem, "id" | "createdAt" | "updatedAt">) => {
            const newItem: LearningItem = {
                ...item,
                id: generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setProgrammingData((prev) => ({
                ...prev,
                learningItems: [...prev.learningItems, newItem],
            }));
            return newItem;
        },
        [setProgrammingData]
    );

    const updateLearningItem = useCallback(
        (id: string, updates: Partial<LearningItem>) => {
            setProgrammingData((prev) => ({
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
        [setProgrammingData]
    );

    const deleteLearningItem = useCallback(
        (id: string) => {
            setProgrammingData((prev) => ({
                ...prev,
                learningItems: prev.learningItems.filter(
                    (item) => item.id !== id
                ),
            }));
        },
        [setProgrammingData]
    );

    // Skills CRUD
    const addSkill = useCallback(
        (skill: Omit<Skill, "id" | "createdAt" | "updatedAt">) => {
            const newSkill: Skill = {
                ...skill,
                id: generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setProgrammingData((prev) => ({
                ...prev,
                skills: [...prev.skills, newSkill],
            }));
            return newSkill;
        },
        [setProgrammingData]
    );

    const updateSkill = useCallback(
        (id: string, updates: Partial<Skill>) => {
            setProgrammingData((prev) => ({
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
        },
        [setProgrammingData]
    );

    const deleteSkill = useCallback(
        (id: string) => {
            setProgrammingData((prev) => ({
                ...prev,
                skills: prev.skills.filter((skill) => skill.id !== id),
            }));
        },
        [setProgrammingData]
    );

    // Tools CRUD
    const addTool = useCallback(
        (tool: Omit<Tool, "id" | "createdAt" | "updatedAt">) => {
            const newTool: Tool = {
                ...tool,
                id: generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setProgrammingData((prev) => ({
                ...prev,
                tools: [...prev.tools, newTool],
            }));
            return newTool;
        },
        [setProgrammingData]
    );

    const updateTool = useCallback(
        (id: string, updates: Partial<Tool>) => {
            setProgrammingData((prev) => ({
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
        },
        [setProgrammingData]
    );

    const deleteTool = useCallback(
        (id: string) => {
            setProgrammingData((prev) => ({
                ...prev,
                tools: prev.tools.filter((tool) => tool.id !== id),
            }));
        },
        [setProgrammingData]
    );

    // Projects CRUD
    const addProject = useCallback(
        (project: Omit<CodingProject, "id" | "createdAt" | "updatedAt">) => {
            const newProject: CodingProject = {
                ...project,
                id: generateId(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            setProgrammingData((prev) => ({
                ...prev,
                projects: [...prev.projects, newProject],
            }));
            return newProject;
        },
        [setProgrammingData]
    );

    const updateProject = useCallback(
        (id: string, updates: Partial<CodingProject>) => {
            setProgrammingData((prev) => ({
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
        [setProgrammingData]
    );

    const deleteProject = useCallback(
        (id: string) => {
            setProgrammingData((prev) => ({
                ...prev,
                projects: prev.projects.filter((project) => project.id !== id),
            }));
        },
        [setProgrammingData]
    );

    // Project Tasks CRUD
    const addProjectTask = useCallback(
        (projectId: string, task: Omit<ProjectTask, "id" | "createdAt">) => {
            const newTask: ProjectTask = {
                ...task,
                id: generateId(),
                createdAt: new Date().toISOString(),
            };
            setProgrammingData((prev) => ({
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
        [setProgrammingData]
    );

    const updateProjectTask = useCallback(
        (projectId: string, taskId: string, updates: Partial<ProjectTask>) => {
            setProgrammingData((prev) => ({
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
        [setProgrammingData]
    );

    const deleteProjectTask = useCallback(
        (projectId: string, taskId: string) => {
            setProgrammingData((prev) => ({
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
        [setProgrammingData]
    );

    // Stats calculation
    const getStats = useCallback((): ProgrammingStats => {
        const completedLearning = data.learningItems.filter(
            (item) => item.status === "completed"
        );
        const inProgressLearning = data.learningItems.filter(
            (item) => item.status === "in-progress"
        );
        const masteredTools = data.tools.filter(
            (tool) => tool.status === "mastered"
        );
        const completedProjects = data.projects.filter(
            (p) => p.status === "completed"
        );

        const totalTimeSpent =
            data.learningItems.reduce((sum, item) => sum + item.timeSpent, 0) +
            data.projects.reduce((sum, p) => sum + p.actualHours * 60, 0);

        const avgSkillLevel =
            data.skills.length > 0
                ? data.skills.reduce((sum, s) => sum + s.currentLevel, 0) /
                  data.skills.length
                : 0;

        const completionRate =
            data.projects.length > 0
                ? (completedProjects.length / data.projects.length) * 100
                : 0;

        return {
            totalLearningItems: data.learningItems.length,
            completedLearningItems: completedLearning.length,
            inProgressLearningItems: inProgressLearning.length,
            totalSkills: data.skills.length,
            averageSkillLevel: Math.round(avgSkillLevel),
            totalTools: data.tools.length,
            masteredTools: masteredTools.length,
            totalProjects: data.projects.length,
            completedProjects: completedProjects.length,
            totalTimeSpent,
            completionRate: Math.round(completionRate),
        };
    }, [data]);

    return {
        // Data
        data,
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
