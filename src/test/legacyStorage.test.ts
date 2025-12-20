/**
 * Legacy Storage (V1) Tests
 *
 * Tests for V1 storage utilities including:
 * - V1 detection
 * - Data consolidation
 * - Backup and restore
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
    V1_STORAGE_KEYS,
    hasV1Storage,
    loadV1RawData,
    consolidateV1Data,
    backupV1Storage,
    restoreV1FromBackup,
    hasV1Backup,
    clearV1Storage,
} from "../utils/legacyStorage";

describe("Legacy Storage (V1)", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe("V1_STORAGE_KEYS", () => {
        it("has all required keys", () => {
            expect(V1_STORAGE_KEYS.MAIN).toBe("lifeos_data");
            expect(V1_STORAGE_KEYS.FREELANCING_PROJECTS).toBe(
                "lifeos-freelancing-projects"
            );
            expect(V1_STORAGE_KEYS.FREELANCING_PROJECT_TASKS).toBe(
                "lifeos-freelancing-project-tasks"
            );
            expect(V1_STORAGE_KEYS.FREELANCING_STANDALONE_TASKS).toBe(
                "lifeos-freelancing-standalone-tasks"
            );
            expect(V1_STORAGE_KEYS.PROGRAMMING).toBe("lifeos-programming-data");
            expect(V1_STORAGE_KEYS.FINANCE).toBe("lifeos-finance-data");
        });
    });

    describe("hasV1Storage", () => {
        it("returns false when no V1 data exists", () => {
            expect(hasV1Storage()).toBe(false);
        });

        it("returns true when V1 main data exists", () => {
            localStorage.setItem(
                V1_STORAGE_KEYS.MAIN,
                JSON.stringify({ test: true })
            );
            expect(hasV1Storage()).toBe(true);
        });
    });

    describe("loadV1RawData", () => {
        it("returns empty data when nothing exists", () => {
            const data = loadV1RawData();

            expect(data.mainData).toBeNull();
            expect(data.freelancingProjects).toEqual([]);
            expect(data.freelancingProjectTasks).toEqual([]);
            expect(data.freelancingStandaloneTasks).toEqual([]);
            expect(data.programmingData).toBeDefined();
            expect(data.financeData).toBeNull();
        });

        it("loads main data correctly", () => {
            const mainData = {
                university: { subjects: [] },
                settings: { userName: "Test" },
            };
            localStorage.setItem(
                V1_STORAGE_KEYS.MAIN,
                JSON.stringify(mainData)
            );

            const data = loadV1RawData();
            expect(data.mainData?.settings?.userName).toBe("Test");
        });

        it("loads freelancing projects", () => {
            const projects = [{ id: "1", name: "Project 1" }];
            localStorage.setItem(
                V1_STORAGE_KEYS.FREELANCING_PROJECTS,
                JSON.stringify(projects)
            );

            const data = loadV1RawData();
            expect(data.freelancingProjects).toHaveLength(1);
            expect(data.freelancingProjects[0].name).toBe("Project 1");
        });

        it("loads programming data", () => {
            const progData = {
                learningItems: [{ id: "1", title: "Learn React" }],
                skills: [],
                tools: [],
                projects: [],
            };
            localStorage.setItem(
                V1_STORAGE_KEYS.PROGRAMMING,
                JSON.stringify(progData)
            );

            const data = loadV1RawData();
            expect(data.programmingData.learningItems).toHaveLength(1);
        });
    });

    describe("consolidateV1Data", () => {
        it("consolidates scattered V1 data into unified structure", () => {
            // Setup V1 scattered data
            const mainData = {
                university: {
                    subjects: [{ id: "1", name: "Math" }],
                    tasks: [],
                    exams: [],
                    gradeEntries: [],
                    academicYears: [],
                    terms: [],
                },
                settings: {
                    theme: "dark",
                    userName: "Test User",
                    email: "test@test.com",
                },
            };
            localStorage.setItem(
                V1_STORAGE_KEYS.MAIN,
                JSON.stringify(mainData)
            );

            const projects = [{ id: "p1", name: "Client Project" }];
            localStorage.setItem(
                V1_STORAGE_KEYS.FREELANCING_PROJECTS,
                JSON.stringify(projects)
            );

            // Consolidate
            const consolidated = consolidateV1Data();

            // Verify
            expect(consolidated.settings.userName).toBe("Test User");
            expect(consolidated.university.subjects).toHaveLength(1);
            expect(consolidated.freelancing.projects).toHaveLength(1);
        });

        it("uses defaults for missing data", () => {
            // Only set minimal data
            localStorage.setItem(V1_STORAGE_KEYS.MAIN, JSON.stringify({}));

            const consolidated = consolidateV1Data();

            // Should have default structures
            expect(consolidated.settings).toBeDefined();
            expect(consolidated.university).toBeDefined();
            expect(consolidated.freelancing.projects).toEqual([]);
        });
    });

    describe("Backup and Restore", () => {
        it("creates backup of V1 data", () => {
            localStorage.setItem(
                V1_STORAGE_KEYS.MAIN,
                JSON.stringify({ test: true })
            );

            const backupJson = backupV1Storage();

            expect(backupJson).toBeDefined();
            expect(localStorage.getItem("lifeos_v1_backup")).not.toBeNull();
        });

        it("hasV1Backup returns true after backup", () => {
            localStorage.setItem(
                V1_STORAGE_KEYS.MAIN,
                JSON.stringify({ test: true })
            );
            backupV1Storage();

            expect(hasV1Backup()).toBe(true);
        });

        it("hasV1Backup returns false without backup", () => {
            expect(hasV1Backup()).toBe(false);
        });

        it("restores V1 data from backup", () => {
            // Create and backup V1 data
            const mainData = { settings: { userName: "Backup Test" } };
            localStorage.setItem(
                V1_STORAGE_KEYS.MAIN,
                JSON.stringify(mainData)
            );
            backupV1Storage();

            // Clear V1 data
            clearV1Storage();
            expect(hasV1Storage()).toBe(false);

            // Restore
            const success = restoreV1FromBackup();

            expect(success).toBe(true);
            expect(hasV1Storage()).toBe(true);

            const restored = JSON.parse(
                localStorage.getItem(V1_STORAGE_KEYS.MAIN)!
            );
            expect(restored.settings.userName).toBe("Backup Test");
        });

        it("returns false when no backup exists", () => {
            const success = restoreV1FromBackup();
            expect(success).toBe(false);
        });
    });

    describe("clearV1Storage", () => {
        it("removes all V1 storage keys", () => {
            // Set all V1 keys
            localStorage.setItem(V1_STORAGE_KEYS.MAIN, "data");
            localStorage.setItem(V1_STORAGE_KEYS.FREELANCING_PROJECTS, "data");
            localStorage.setItem(V1_STORAGE_KEYS.PROGRAMMING, "data");

            clearV1Storage();

            expect(localStorage.getItem(V1_STORAGE_KEYS.MAIN)).toBeNull();
            expect(
                localStorage.getItem(V1_STORAGE_KEYS.FREELANCING_PROJECTS)
            ).toBeNull();
            expect(
                localStorage.getItem(V1_STORAGE_KEYS.PROGRAMMING)
            ).toBeNull();
        });
    });
});
