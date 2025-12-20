/**
 * Storage V2 Tests
 *
 * Tests for the unified V2 storage system including:
 * - Load/Save operations
 * - Version detection
 * - Migration from V1
 * - Export/Import
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
    V2_STORAGE_KEY,
    V2_VERSION,
    detectStorageVersion,
    loadV2Storage,
    saveV2Storage,
    loadData,
    saveData,
    isFirstTime,
    markFirstTimeComplete,
} from "../utils/storageV2";
import { V1_STORAGE_KEYS } from "../utils/legacyStorage";
import { createDefaultAppData } from "../types";

describe("Storage V2", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    describe("detectStorageVersion", () => {
        it("returns null for fresh install", () => {
            const version = detectStorageVersion();
            expect(version).toBeNull();
        });

        it("returns '2.0.0' when V2 storage exists", () => {
            const mockV2 = {
                version: "2.0.0",
                lastModified: new Date().toISOString(),
                created: new Date().toISOString(),
                data: createDefaultAppData(),
            };
            localStorage.setItem(V2_STORAGE_KEY, JSON.stringify(mockV2));

            const version = detectStorageVersion();
            expect(version).toBe("2.0.0");
        });

        it("returns '1.0.0' when only V1 storage exists", () => {
            localStorage.setItem(
                V1_STORAGE_KEYS.MAIN,
                JSON.stringify({ test: true })
            );

            const version = detectStorageVersion();
            expect(version).toBe("1.0.0");
        });

        it("prefers V2 over V1 when both exist", () => {
            // V1 data
            localStorage.setItem(
                V1_STORAGE_KEYS.MAIN,
                JSON.stringify({ test: true })
            );

            // V2 data
            const mockV2 = {
                version: "2.0.0",
                lastModified: new Date().toISOString(),
                created: new Date().toISOString(),
                data: createDefaultAppData(),
            };
            localStorage.setItem(V2_STORAGE_KEY, JSON.stringify(mockV2));

            const version = detectStorageVersion();
            expect(version).toBe("2.0.0");
        });
    });

    describe("saveV2Storage / loadV2Storage", () => {
        it("saves and loads data correctly", () => {
            const testData = createDefaultAppData();
            testData.settings.userName = "Test User";

            saveV2Storage(testData);
            const loaded = loadV2Storage();

            expect(loaded).not.toBeNull();
            expect(loaded?.version).toBe(V2_VERSION);
            expect(loaded?.data.settings.userName).toBe("Test User");
        });

        it("returns null when no data exists", () => {
            const loaded = loadV2Storage();
            expect(loaded).toBeNull();
        });

        it("returns null for invalid JSON", () => {
            localStorage.setItem(V2_STORAGE_KEY, "invalid json{");
            const loaded = loadV2Storage();
            expect(loaded).toBeNull();
        });

        it("includes timestamps in saved data", () => {
            const testData = createDefaultAppData();
            saveV2Storage(testData);

            const loaded = loadV2Storage();
            expect(loaded?.lastModified).toBeDefined();
            expect(loaded?.created).toBeDefined();
        });
    });

    describe("loadData", () => {
        it("returns default data for fresh install", () => {
            const data = loadData();

            expect(data).toBeDefined();
            expect(data.settings).toBeDefined();
            expect(data.university).toBeDefined();
            expect(data.freelancing).toBeDefined();
            expect(data.programming).toBeDefined();
            expect(data.finance).toBeDefined();
            expect(data.home).toBeDefined();
            expect(data.misc).toBeDefined();
        });

        it("saves V2 storage on fresh install", () => {
            loadData();

            const stored = localStorage.getItem(V2_STORAGE_KEY);
            expect(stored).not.toBeNull();

            const parsed = JSON.parse(stored!);
            expect(parsed.version).toBe("2.0.0");
        });

        it("returns existing V2 data", () => {
            const testData = createDefaultAppData();
            testData.settings.userName = "Existing User";
            saveV2Storage(testData);

            const loaded = loadData();
            expect(loaded.settings.userName).toBe("Existing User");
        });

        it("migrates V1 data to V2", () => {
            // Setup V1 data
            const v1Main = {
                university: {
                    subjects: [],
                    tasks: [],
                    exams: [],
                    gradeEntries: [],
                    academicYears: [],
                    terms: [],
                },
                settings: {
                    theme: "dark",
                    userName: "V1 User",
                    email: "v1@test.com",
                },
            };
            localStorage.setItem(V1_STORAGE_KEYS.MAIN, JSON.stringify(v1Main));

            // Load should migrate
            const data = loadData();

            // Check data was migrated
            expect(data.settings.userName).toBe("V1 User");
            expect(data.settings.email).toBe("v1@test.com");

            // Check V2 storage was created
            const v2Stored = localStorage.getItem(V2_STORAGE_KEY);
            expect(v2Stored).not.toBeNull();
        });
    });

    describe("saveData", () => {
        it("saves data to V2 format", () => {
            const testData = createDefaultAppData();
            testData.settings.userName = "Saved User";

            saveData(testData);

            const stored = localStorage.getItem(V2_STORAGE_KEY);
            expect(stored).not.toBeNull();

            const parsed = JSON.parse(stored!);
            expect(parsed.data.settings.userName).toBe("Saved User");
        });
    });

    describe("First time setup", () => {
        it("isFirstTime returns true on fresh install", () => {
            expect(isFirstTime()).toBe(true);
        });

        it("isFirstTime returns false after marking complete", () => {
            markFirstTimeComplete();
            expect(isFirstTime()).toBe(false);
        });
    });
});
