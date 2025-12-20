/**
 * Default Data Factories Tests
 *
 * Tests for the default data factory functions.
 */

import { describe, it, expect } from "vitest";
import {
    createDefaultSettings,
    createDefaultUniversityData,
    createDefaultFreelancerProfile,
    createDefaultFreelancingData,
    createDefaultProgrammingData,
    createDefaultFinanceSettings,
    createDefaultFinanceData,
    createDefaultHomeData,
    createDefaultMiscData,
    createDefaultAppData,
    mergeWithDefaults,
} from "../types/defaults";

describe("Default Data Factories", () => {
    describe("createDefaultSettings", () => {
        it("creates settings with default theme", () => {
            const settings = createDefaultSettings();
            expect(settings.theme).toBe("dark");
            expect(settings.userName).toBe("User");
            expect(settings.email).toBe("");
        });
    });

    describe("createDefaultUniversityData", () => {
        it("creates empty university data", () => {
            const data = createDefaultUniversityData();
            expect(data.subjects).toEqual([]);
            expect(data.tasks).toEqual([]);
            expect(data.exams).toEqual([]);
            expect(data.gradeEntries).toEqual([]);
            expect(data.academicYears).toEqual([]);
            expect(data.terms).toEqual([]);
        });
    });

    describe("createDefaultFreelancerProfile", () => {
        it("creates empty profile", () => {
            const profile = createDefaultFreelancerProfile();
            expect(profile.name).toBe("");
            expect(profile.title).toBe("");
            expect(profile.email).toBe("");
            expect(profile.cvVersions).toEqual([]);
            expect(profile.platforms).toEqual([]);
        });
    });

    describe("createDefaultFreelancingData", () => {
        it("creates empty freelancing data with profile", () => {
            const data = createDefaultFreelancingData();
            expect(data.profile).toBeDefined();
            expect(data.applications).toEqual([]);
            expect(data.projects).toEqual([]);
            expect(data.projectTasks).toEqual([]);
            expect(data.standaloneTasks).toEqual([]);
        });
    });

    describe("createDefaultProgrammingData", () => {
        it("creates empty programming data", () => {
            const data = createDefaultProgrammingData();
            expect(data.learningItems).toEqual([]);
            expect(data.skills).toEqual([]);
            expect(data.tools).toEqual([]);
            expect(data.projects).toEqual([]);
        });
    });

    describe("createDefaultFinanceSettings", () => {
        it("creates finance settings with USD", () => {
            const settings = createDefaultFinanceSettings();
            expect(settings.defaultCurrency).toBe("USD");
            expect(settings.monthStartDay).toBe(1);
            expect(settings.showCents).toBe(true);
            expect(settings.enableBudgetAlerts).toBe(true);
        });
    });

    describe("createDefaultFinanceData", () => {
        it("creates empty finance data with settings", () => {
            const data = createDefaultFinanceData();
            expect(data.incomes).toEqual([]);
            expect(data.expenses).toEqual([]);
            expect(data.categories).toEqual([]);
            expect(data.installments).toEqual([]);
            expect(data.settings).toBeDefined();
            expect(data.settings.defaultCurrency).toBe("USD");
        });
    });

    describe("createDefaultHomeData", () => {
        it("creates empty home data", () => {
            const data = createDefaultHomeData();
            expect(data.tasks).toEqual([]);
            expect(data.goals).toEqual([]);
            expect(data.habits).toEqual([]);
        });
    });

    describe("createDefaultMiscData", () => {
        it("creates empty misc data", () => {
            const data = createDefaultMiscData();
            expect(data.notes).toEqual([]);
            expect(data.bookmarks).toEqual([]);
            expect(data.quickCaptures).toEqual([]);
        });
    });

    describe("createDefaultAppData", () => {
        it("creates complete app data with all modules", () => {
            const data = createDefaultAppData();

            expect(data.settings).toBeDefined();
            expect(data.university).toBeDefined();
            expect(data.freelancing).toBeDefined();
            expect(data.programming).toBeDefined();
            expect(data.finance).toBeDefined();
            expect(data.home).toBeDefined();
            expect(data.misc).toBeDefined();
        });

        it("all modules have correct default values", () => {
            const data = createDefaultAppData();

            expect(data.settings.theme).toBe("dark");
            expect(data.university.subjects).toEqual([]);
            expect(data.freelancing.projects).toEqual([]);
            expect(data.programming.skills).toEqual([]);
            expect(data.finance.settings.defaultCurrency).toBe("USD");
            expect(data.home.tasks).toEqual([]);
            expect(data.misc.notes).toEqual([]);
        });
    });

    describe("mergeWithDefaults", () => {
        it("fills missing fields with defaults", () => {
            const partial = {
                settings: { userName: "Custom User" },
            };

            const merged = mergeWithDefaults(partial as any);

            expect(merged.settings.userName).toBe("Custom User");
            expect(merged.settings.theme).toBe("dark"); // Default
            expect(merged.university).toBeDefined();
            expect(merged.freelancing).toBeDefined();
        });

        it("preserves existing arrays", () => {
            const partial = {
                university: {
                    subjects: [{ id: "1", name: "Math" }],
                },
            };

            const merged = mergeWithDefaults(partial as any);

            expect(merged.university.subjects).toHaveLength(1);
            expect(merged.university.tasks).toEqual([]); // Default
        });

        it("merges nested objects", () => {
            const partial = {
                freelancing: {
                    profile: { name: "John Doe" },
                },
            };

            const merged = mergeWithDefaults(partial as any);

            expect(merged.freelancing.profile.name).toBe("John Doe");
            expect(merged.freelancing.profile.email).toBe(""); // Default
        });

        it("handles empty partial", () => {
            const merged = mergeWithDefaults({});

            expect(merged).toEqual(createDefaultAppData());
        });

        it("handles undefined values in partial", () => {
            const partial = {
                settings: undefined,
                university: { subjects: [] },
            };

            const merged = mergeWithDefaults(partial as any);

            expect(merged.settings).toBeDefined();
            expect(merged.settings.theme).toBe("dark");
        });
    });
});
