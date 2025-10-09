import type { AppData } from "../types";

const STORAGE_KEY = "lifeos_data";
const STORAGE_VERSION = "1.0.0";
const FIRST_TIME_KEY = "lifeos_first_time";

// Freelancing separate storage keys
const FREELANCING_PROJECTS_KEY = "lifeos-freelancing-projects";
const FREELANCING_PROJECT_TASKS_KEY = "lifeos-freelancing-project-tasks";
const FREELANCING_STANDALONE_TASKS_KEY = "lifeos-freelancing-standalone-tasks";

// Programming separate storage key
const PROGRAMMING_DATA_KEY = "lifeos-programming-data";

// Default initial data
const getDefaultData = (): AppData => ({
    university: {
        subjects: [],
        tasks: [],
        exams: [],
    },
    freelancing: {
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
    },
    programming: {
        learningResources: [],
        technologies: [],
        projects: [],
        skills: [],
    },
    home: {
        tasks: [],
        goals: [],
        habits: [],
    },
    misc: {
        notes: [],
        bookmarks: [],
        quickCaptures: [],
    },
    settings: {
        theme: "light",
        userName: "User",
        email: "",
    },
});

// Load data from localStorage
export const loadData = (): AppData => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            const defaultData = getDefaultData();
            saveData(defaultData);
            return defaultData;
        }

        const parsed = JSON.parse(stored);

        // Merge with default structure to handle missing fields
        return {
            ...getDefaultData(),
            ...parsed,
            university: {
                ...getDefaultData().university,
                ...parsed.university,
            },
            freelancing: {
                ...getDefaultData().freelancing,
                ...parsed.freelancing,
            },
            programming: {
                ...getDefaultData().programming,
                ...parsed.programming,
            },
            home: { ...getDefaultData().home, ...parsed.home },
            misc: { ...getDefaultData().misc, ...parsed.misc },
            settings: { ...getDefaultData().settings, ...parsed.settings },
        };
    } catch (error) {
        console.error("Error loading data from localStorage:", error);
        return getDefaultData();
    }
};

// Save data to localStorage
export const saveData = (data: AppData): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Error saving data to localStorage:", error);
    }
};

// Export data as JSON file
export const exportData = (): void => {
    try {
        const data = loadData();

        // Load freelancing data from separate localStorage keys
        const freelancingProjects = localStorage.getItem(
            FREELANCING_PROJECTS_KEY
        );
        const freelancingProjectTasks = localStorage.getItem(
            FREELANCING_PROJECT_TASKS_KEY
        );
        const freelancingStandaloneTasks = localStorage.getItem(
            FREELANCING_STANDALONE_TASKS_KEY
        );

        // Load programming data from separate localStorage key
        const programmingData = localStorage.getItem(PROGRAMMING_DATA_KEY);

        // Add metadata for better import validation
        const exportData = {
            version: STORAGE_VERSION,
            exportDate: new Date().toISOString(),
            data: data,
            // Include freelancing separate storage
            freelancingExtended: {
                projects: freelancingProjects
                    ? JSON.parse(freelancingProjects)
                    : [],
                projectTasks: freelancingProjectTasks
                    ? JSON.parse(freelancingProjectTasks)
                    : [],
                standaloneTasks: freelancingStandaloneTasks
                    ? JSON.parse(freelancingStandaloneTasks)
                    : [],
            },
            // Include programming separate storage
            programmingExtended: programmingData
                ? JSON.parse(programmingData)
                : {
                      learningItems: [],
                      skills: [],
                      tools: [],
                      projects: [],
                  },
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `lifeos_backup_${
            new Date().toISOString().split("T")[0]
        }.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error exporting data:", error);
        throw new Error("Failed to export data. Please try again.");
    }
};

// Import data from JSON file
export const importData = (file: File): Promise<AppData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const parsed = JSON.parse(content);

                // Check if it's the new format with metadata or legacy format
                let importedData: Partial<AppData>;
                if (parsed.version && parsed.data) {
                    // New format with metadata
                    importedData = parsed.data as Partial<AppData>;
                } else {
                    // Legacy format - direct data object
                    importedData = parsed as Partial<AppData>;
                }

                // Merge imported data with default structure to ensure all required fields exist
                // This also preserves new optional fields like Subject.description, Subject.resources, etc.
                const mergedData: AppData = {
                    university: {
                        subjects: importedData.university?.subjects || [],
                        tasks: importedData.university?.tasks || [],
                        exams: importedData.university?.exams || [],
                    },
                    freelancing: {
                        profile: {
                            name: importedData.freelancing?.profile?.name || "",
                            title:
                                importedData.freelancing?.profile?.title || "",
                            email:
                                importedData.freelancing?.profile?.email || "",
                            phone:
                                importedData.freelancing?.profile?.phone || "",
                            portfolioUrl:
                                importedData.freelancing?.profile
                                    ?.portfolioUrl || "",
                            cvVersions:
                                importedData.freelancing?.profile?.cvVersions ||
                                [],
                            platforms:
                                importedData.freelancing?.profile?.platforms ||
                                [],
                        },
                        applications:
                            importedData.freelancing?.applications || [],
                        projects: importedData.freelancing?.projects || [],
                    },
                    programming: {
                        learningResources:
                            importedData.programming?.learningResources || [],
                        technologies:
                            importedData.programming?.technologies || [],
                        projects: importedData.programming?.projects || [],
                        skills: importedData.programming?.skills || [],
                    },
                    home: {
                        tasks: importedData.home?.tasks || [],
                        goals: importedData.home?.goals || [],
                        habits: importedData.home?.habits || [],
                    },
                    misc: {
                        notes: importedData.misc?.notes || [],
                        bookmarks: importedData.misc?.bookmarks || [],
                        quickCaptures: importedData.misc?.quickCaptures || [],
                    },
                    settings: {
                        theme: importedData.settings?.theme || "dark",
                        userName: importedData.settings?.userName || "User",
                        email: importedData.settings?.email || "",
                    },
                };

                saveData(mergedData);

                // Restore freelancing extended data if present (new format)
                if (parsed.freelancingExtended) {
                    const { projects, projectTasks, standaloneTasks } =
                        parsed.freelancingExtended;

                    if (projects && Array.isArray(projects)) {
                        localStorage.setItem(
                            FREELANCING_PROJECTS_KEY,
                            JSON.stringify(projects)
                        );
                    }

                    if (projectTasks && Array.isArray(projectTasks)) {
                        localStorage.setItem(
                            FREELANCING_PROJECT_TASKS_KEY,
                            JSON.stringify(projectTasks)
                        );
                    }

                    if (standaloneTasks && Array.isArray(standaloneTasks)) {
                        localStorage.setItem(
                            FREELANCING_STANDALONE_TASKS_KEY,
                            JSON.stringify(standaloneTasks)
                        );
                    }
                }

                // Restore programming extended data if present (new format)
                if (parsed.programmingExtended) {
                    localStorage.setItem(
                        PROGRAMMING_DATA_KEY,
                        JSON.stringify(parsed.programmingExtended)
                    );
                }

                resolve(mergedData);
            } catch {
                reject(
                    new Error(
                        "Invalid data format. Please check the file and try again."
                    )
                );
            }
        };

        reader.onerror = () =>
            reject(new Error("Failed to read file. Please try again."));
        reader.readAsText(file);
    });
};

// Clear all data
export const clearAllData = (): void => {
    localStorage.removeItem(STORAGE_KEY);
    // Also clear freelancing extended data
    localStorage.removeItem(FREELANCING_PROJECTS_KEY);
    localStorage.removeItem(FREELANCING_PROJECT_TASKS_KEY);
    localStorage.removeItem(FREELANCING_STANDALONE_TASKS_KEY);
    // Also clear programming extended data
    localStorage.removeItem(PROGRAMMING_DATA_KEY);
};

// Check if this is the first time the user opens the app
export const isFirstTime = (): boolean => {
    return localStorage.getItem(FIRST_TIME_KEY) === null;
};

// Mark that the user has completed the first-time setup
export const markFirstTimeComplete = (): void => {
    localStorage.setItem(FIRST_TIME_KEY, "completed");
};
