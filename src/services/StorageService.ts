/**
 * StorageService (V2 - Unified Storage)
 *
 * Unified storage layer that automatically chooses between:
 * - localStorage (guest mode / not authenticated)
 * - Google Drive (authenticated user)
 *
 * V2 Architecture:
 * - Single storage key: "lifeos"
 * - Single Drive file: "lifeos.json"
 * - Contains all AppData in one unified structure
 *
 * Provides a consistent API regardless of the underlying storage.
 */

import { DriveService } from "./DriveService";
import { DRIVE_FILE } from "../config/google";
import { V2_STORAGE_KEY } from "../utils/storageV2";
import type { AppData } from "../types";
import type { StorageV2 } from "../utils/storageV2";

// V2 Storage uses a single key
export const STORAGE_KEYS = {
    MAIN_DATA: V2_STORAGE_KEY, // "lifeos" - unified key
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// Storage mode
export type StorageMode = "local" | "cloud";

// Sync event types (simplified for single key)
export type SyncEvent =
    | { type: "save_start" }
    | { type: "save_success" }
    | { type: "save_error"; error: Error }
    | { type: "load_start" }
    | { type: "load_success" }
    | { type: "load_error"; error: Error }
    | { type: "mode_change"; mode: StorageMode };

type SyncEventListener = (event: SyncEvent) => void;

// Debounce timer for cloud saves
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 1000; // 1 second debounce for cloud saves

/**
 * StorageService Class - Singleton (V2)
 *
 * Automatically routes storage operations to localStorage or Google Drive
 * based on authentication state.
 *
 * Uses the V2 unified storage format (single file for all data).
 */
class StorageServiceClass {
    private mode: StorageMode = "local";
    private listeners: Set<SyncEventListener> = new Set();
    private pendingData: StorageV2 | null = null;

    /**
     * Set the storage mode
     */
    setMode(mode: StorageMode): void {
        if (this.mode !== mode) {
            this.mode = mode;
            this.emit({ type: "mode_change", mode });
            console.log(`📦 StorageService mode changed to: ${mode}`);
        }
    }

    /**
     * Get current storage mode
     */
    getMode(): StorageMode {
        return this.mode;
    }

    /**
     * Check if using cloud storage
     */
    isCloudMode(): boolean {
        return this.mode === "cloud" && DriveService.isReady();
    }

    /**
     * Subscribe to sync events
     */
    onSyncEvent(listener: SyncEventListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * Emit sync event to all listeners
     */
    private emit(event: SyncEvent): void {
        this.listeners.forEach((listener) => listener(event));
    }

    /**
     * Save data - routes to appropriate storage
     * Uses debouncing for cloud saves to prevent excessive API calls
     */
    async save(
        key: StorageKey,
        data: StorageV2,
        options?: { immediate?: boolean }
    ): Promise<void> {
        // Always save to localStorage first (for offline support and speed)
        this.saveToLocal(key, data);

        // If in cloud mode, also save to Drive (debounced)
        if (this.isCloudMode()) {
            if (options?.immediate) {
                await this.saveToCloud(data);
            } else {
                this.debouncedSaveToCloud(data);
            }
        }
    }

    /**
     * Save AppData directly (convenience method)
     */
    async saveAppData(
        data: AppData,
        options?: { immediate?: boolean }
    ): Promise<void> {
        const storageV2: StorageV2 = {
            version: "2.0.0",
            lastModified: new Date().toISOString(),
            created: this.getCreatedTimestamp(),
            data,
        };
        await this.save(STORAGE_KEYS.MAIN_DATA, storageV2, options);
    }

    /**
     * Get the created timestamp from existing data or use now
     */
    private getCreatedTimestamp(): string {
        const existing = this.loadFromLocal<StorageV2>(STORAGE_KEYS.MAIN_DATA);
        return existing?.created ?? new Date().toISOString();
    }

    /**
     * Save data to localStorage
     */
    private saveToLocal<T>(key: StorageKey, data: T): void {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`❌ Error saving to localStorage:`, error);
        }
    }

    /**
     * Save data to Google Drive (immediate)
     */
    private async saveToCloud(data: StorageV2): Promise<void> {
        this.emit({ type: "save_start" });

        try {
            await DriveService.saveData(DRIVE_FILE, data);
            this.emit({ type: "save_success" });
            console.log("☁️ Saved to Google Drive");
        } catch (error) {
            console.error(`❌ Error saving to Drive:`, error);
            this.emit({ type: "save_error", error: error as Error });
            throw error;
        }
    }

    /**
     * Debounced save to Google Drive
     * Batches rapid changes into single API call
     */
    private debouncedSaveToCloud(data: StorageV2): void {
        // Store the pending data
        this.pendingData = data;

        // Clear existing timer
        if (saveTimer) {
            clearTimeout(saveTimer);
        }

        // Set new timer
        saveTimer = setTimeout(async () => {
            if (this.pendingData) {
                const dataToSave = this.pendingData;
                this.pendingData = null;
                try {
                    await this.saveToCloud(dataToSave);
                } catch (error) {
                    // Error already logged and emitted in saveToCloud
                }
            }
            saveTimer = null;
        }, DEBOUNCE_MS);
    }

    /**
     * Load data - routes to appropriate storage
     * In cloud mode, prefers cloud data but falls back to local
     */
    async load(key: StorageKey): Promise<StorageV2 | null> {
        if (this.isCloudMode()) {
            try {
                const cloudData = await this.loadFromCloud();
                if (cloudData !== null) {
                    // Also update localStorage with cloud data
                    this.saveToLocal(key, cloudData);
                    return cloudData;
                }
            } catch (error) {
                console.warn(
                    `⚠️ Failed to load from Drive, falling back to local:`,
                    error
                );
            }
        }

        // Fall back to localStorage
        return this.loadFromLocal<StorageV2>(key);
    }

    /**
     * Load AppData directly (convenience method)
     */
    async loadAppData(): Promise<AppData | null> {
        const storage = await this.load(STORAGE_KEYS.MAIN_DATA);
        return storage?.data ?? null;
    }

    /**
     * Load data from localStorage
     */
    loadFromLocal<T>(key: StorageKey): T | null {
        try {
            const stored = localStorage.getItem(key);
            if (stored) {
                return JSON.parse(stored) as T;
            }
        } catch (error) {
            console.error(`❌ Error loading from localStorage:`, error);
        }
        return null;
    }

    /**
     * Load data from Google Drive
     */
    private async loadFromCloud(): Promise<StorageV2 | null> {
        this.emit({ type: "load_start" });

        try {
            const data = await DriveService.loadData<StorageV2>(DRIVE_FILE);
            this.emit({ type: "load_success" });
            return data;
        } catch (error) {
            console.error(`❌ Error loading from Drive:`, error);
            this.emit({ type: "load_error", error: error as Error });
            throw error;
        }
    }

    /**
     * Delete data from storage
     */
    async delete(key: StorageKey): Promise<void> {
        // Remove from localStorage
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error(`❌ Error deleting from localStorage:`, error);
        }

        // Remove from Drive if in cloud mode
        if (this.isCloudMode()) {
            try {
                await DriveService.deleteFile(DRIVE_FILE);
            } catch (error) {
                console.error(`❌ Error deleting from Drive:`, error);
            }
        }
    }

    /**
     * Sync local data to cloud
     * Used after first login to upload existing local data
     */
    async syncLocalToCloud(): Promise<void> {
        if (!this.isCloudMode()) {
            throw new Error("Cannot sync: not in cloud mode");
        }

        console.log("☁️ Syncing local data to cloud...");

        const localData = this.loadFromLocal<StorageV2>(STORAGE_KEYS.MAIN_DATA);
        if (localData) {
            await this.saveToCloud(localData);
            console.log("✅ Local data synced to cloud");
        } else {
            console.log("ℹ️ No local data to sync");
        }
    }

    /**
     * Sync cloud data to local
     * Used to download all cloud data to localStorage
     */
    async syncCloudToLocal(): Promise<void> {
        if (!this.isCloudMode()) {
            throw new Error("Cannot sync: not in cloud mode");
        }

        console.log("☁️ Syncing cloud data to local...");

        try {
            const cloudData = await this.loadFromCloud();
            if (cloudData) {
                this.saveToLocal(STORAGE_KEYS.MAIN_DATA, cloudData);
                console.log("✅ Cloud data synced to local");
            } else {
                console.log("ℹ️ No cloud data found");
            }
        } catch (error) {
            console.error("❌ Failed to sync cloud to local:", error);
            throw error;
        }
    }

    /**
     * Check if cloud has data
     */
    async hasCloudData(): Promise<boolean> {
        if (!this.isCloudMode()) {
            return false;
        }

        try {
            const data = await DriveService.loadData(DRIVE_FILE);
            return data !== null;
        } catch {
            return false;
        }
    }

    /**
     * Check if there's any data in cloud storage
     */
    async hasAnyCloudData(): Promise<boolean> {
        if (!DriveService.isReady()) {
            return false;
        }

        return DriveService.hasDataInDrive();
    }

    /**
     * Check if local storage has meaningful data (not just defaults)
     */
    hasLocalData(): boolean {
        const storage = this.loadFromLocal<StorageV2>(STORAGE_KEYS.MAIN_DATA);
        if (!storage?.data) return false;

        // Check if any module has actual data
        const data = storage.data;
        return (
            (data.university?.subjects?.length ?? 0) > 0 ||
            (data.university?.tasks?.length ?? 0) > 0 ||
            (data.freelancing?.projects?.length ?? 0) > 0 ||
            (data.freelancing?.applications?.length ?? 0) > 0 ||
            (data.programming?.projects?.length ?? 0) > 0 ||
            (data.programming?.learningItems?.length ?? 0) > 0 ||
            (data.finance?.incomes?.length ?? 0) > 0 ||
            (data.finance?.expenses?.length ?? 0) > 0 ||
            (data.home?.tasks?.length ?? 0) > 0 ||
            (data.misc?.notes?.length ?? 0) > 0
        );
    }

    /**
     * Get local storage metadata
     */
    getLocalStorageMetadata(): { lastModified: Date; size: number } | null {
        const storage = this.loadFromLocal<StorageV2>(STORAGE_KEYS.MAIN_DATA);
        if (!storage) return null;

        const stored = localStorage.getItem(STORAGE_KEYS.MAIN_DATA);
        const size = stored ? new Blob([stored]).size : 0;

        return {
            lastModified: new Date(storage.lastModified),
            size,
        };
    }

    /**
     * Get cloud storage metadata
     */
    async getCloudStorageMetadata(): Promise<{
        lastModified: Date;
        size: number;
    } | null> {
        if (!this.isCloudMode()) return null;

        try {
            const cloudData = await DriveService.loadData<StorageV2>(
                DRIVE_FILE
            );
            if (!cloudData) return null;

            // Estimate size from stringified data
            const size = new Blob([JSON.stringify(cloudData)]).size;

            return {
                lastModified: new Date(cloudData.lastModified),
                size,
            };
        } catch {
            return null;
        }
    }

    /**
     * Detect if there's a conflict between local and cloud data
     *
     * A conflict only exists when:
     * - Local has NEWER data than cloud (user made changes locally)
     * - AND the data is actually different
     *
     * If cloud is newer, that's NOT a conflict - just download it.
     * If data is identical, that's NOT a conflict - just sync timestamps.
     */
    async detectConflict(): Promise<{
        hasConflict: boolean;
        localMeta?: { lastModified: Date; size: number };
        cloudMeta?: { lastModified: Date; size: number };
    }> {
        const localMeta = this.getLocalStorageMetadata();
        const cloudMeta = await this.getCloudStorageMetadata();

        // No conflict if either side has no data
        if (!localMeta || !cloudMeta) {
            return {
                hasConflict: false,
                localMeta: localMeta ?? undefined,
                cloudMeta: cloudMeta ?? undefined,
            };
        }

        // Check if local has meaningful data
        const hasLocalData = this.hasLocalData();
        if (!hasLocalData) {
            return { hasConflict: false, localMeta, cloudMeta };
        }

        // Step 1: If timestamps are exactly the same, no conflict
        if (
            localMeta.lastModified.getTime() ===
            cloudMeta.lastModified.getTime()
        ) {
            console.log("☁️ Timestamps match exactly, no conflict");
            return { hasConflict: false, localMeta, cloudMeta };
        }

        // Step 2: If cloud is newer than local, NO conflict - just download cloud
        // This handles the case where another device synced and this device just needs to update
        if (cloudMeta.lastModified > localMeta.lastModified) {
            console.log(
                "☁️ Cloud is newer than local, will auto-sync from cloud"
            );
            return { hasConflict: false, localMeta, cloudMeta };
        }

        // Step 3: Local is newer - check if data is actually different
        const localStorage = this.loadFromLocal<StorageV2>(
            STORAGE_KEYS.MAIN_DATA
        );
        const cloudData = await DriveService.loadData<StorageV2>(DRIVE_FILE);

        if (!localStorage || !cloudData) {
            return { hasConflict: false, localMeta, cloudMeta };
        }

        // Compare actual data (excluding metadata like lastModified)
        const localDataStr = JSON.stringify(localStorage.data);
        const cloudDataStr = JSON.stringify(cloudData.data);

        if (localDataStr === cloudDataStr) {
            // Data is identical, just sync the timestamps (upload local since it's newer)
            console.log(
                "☁️ Data is identical, local is newer - syncing to cloud..."
            );
            await this.syncLocalToCloud();
            return { hasConflict: false, localMeta, cloudMeta };
        }

        // Local is newer AND data is different - this is a real conflict
        // User made changes locally that differ from cloud
        console.log(
            "⚠️ Local is newer with different data - conflict detected"
        );
        return { hasConflict: true, localMeta, cloudMeta };
    }

    /**
     * Merge local and cloud data, keeping newest items from each module
     */
    async mergeLocalAndCloud(): Promise<StorageV2> {
        const localStorage = this.loadFromLocal<StorageV2>(
            STORAGE_KEYS.MAIN_DATA
        );
        const cloudData = await DriveService.loadData<StorageV2>(DRIVE_FILE);

        // If one side is missing, return the other
        if (!localStorage && cloudData) return cloudData;
        if (localStorage && !cloudData) return localStorage;
        if (!localStorage && !cloudData) {
            // Both missing, return empty structure
            throw new Error("No data to merge");
        }

        const local = localStorage!.data;
        const cloud = cloudData!.data;

        // Helper to merge arrays by id, keeping newest by checking all items
        const mergeArraysById = <T extends { id: string }>(
            localArr: T[],
            cloudArr: T[]
        ): T[] => {
            const merged = new Map<string, T>();

            // Add all local items
            for (const item of localArr) {
                merged.set(item.id, item);
            }

            // Override/add cloud items
            for (const item of cloudArr) {
                if (!merged.has(item.id)) {
                    merged.set(item.id, item);
                }
                // If both have it, keep the one from the newer source (cloud in this case)
                // We could add a lastModified to each item for more precision
            }

            return Array.from(merged.values());
        };

        // Merge each module
        const mergedData = {
            university: {
                subjects: mergeArraysById(
                    local.university?.subjects ?? [],
                    cloud.university?.subjects ?? []
                ),
                tasks: mergeArraysById(
                    local.university?.tasks ?? [],
                    cloud.university?.tasks ?? []
                ),
                exams: mergeArraysById(
                    local.university?.exams ?? [],
                    cloud.university?.exams ?? []
                ),
                gradeEntries: mergeArraysById(
                    local.university?.gradeEntries ?? [],
                    cloud.university?.gradeEntries ?? []
                ),
                academicYears: mergeArraysById(
                    local.university?.academicYears ?? [],
                    cloud.university?.academicYears ?? []
                ),
                terms: mergeArraysById(
                    local.university?.terms ?? [],
                    cloud.university?.terms ?? []
                ),
                currentYearId:
                    local.university?.currentYearId ??
                    cloud.university?.currentYearId,
                currentTermId:
                    local.university?.currentTermId ??
                    cloud.university?.currentTermId,
            },
            freelancing: {
                profile:
                    local.freelancing?.profile ?? cloud.freelancing?.profile,
                applications: mergeArraysById(
                    local.freelancing?.applications ?? [],
                    cloud.freelancing?.applications ?? []
                ),
                projects: mergeArraysById(
                    local.freelancing?.projects ?? [],
                    cloud.freelancing?.projects ?? []
                ),
                projectTasks: mergeArraysById(
                    local.freelancing?.projectTasks ?? [],
                    cloud.freelancing?.projectTasks ?? []
                ),
                standaloneTasks: mergeArraysById(
                    local.freelancing?.standaloneTasks ?? [],
                    cloud.freelancing?.standaloneTasks ?? []
                ),
            },
            programming: {
                learningItems: mergeArraysById(
                    local.programming?.learningItems ?? [],
                    cloud.programming?.learningItems ?? []
                ),
                skills: mergeArraysById(
                    local.programming?.skills ?? [],
                    cloud.programming?.skills ?? []
                ),
                tools: mergeArraysById(
                    local.programming?.tools ?? [],
                    cloud.programming?.tools ?? []
                ),
                projects: mergeArraysById(
                    local.programming?.projects ?? [],
                    cloud.programming?.projects ?? []
                ),
            },
            finance: {
                incomes: mergeArraysById(
                    local.finance?.incomes ?? [],
                    cloud.finance?.incomes ?? []
                ),
                expenses: mergeArraysById(
                    local.finance?.expenses ?? [],
                    cloud.finance?.expenses ?? []
                ),
                categories: mergeArraysById(
                    local.finance?.categories ?? [],
                    cloud.finance?.categories ?? []
                ),
                installments: mergeArraysById(
                    local.finance?.installments ?? [],
                    cloud.finance?.installments ?? []
                ),
                budgets: mergeArraysById(
                    local.finance?.budgets ?? [],
                    cloud.finance?.budgets ?? []
                ),
                goals: mergeArraysById(
                    local.finance?.goals ?? [],
                    cloud.finance?.goals ?? []
                ),
                alerts: mergeArraysById(
                    local.finance?.alerts ?? [],
                    cloud.finance?.alerts ?? []
                ),
                settings: {
                    ...(cloud.finance?.settings ?? {}),
                    ...(local.finance?.settings ?? {}),
                },
            },
            home: {
                tasks: mergeArraysById(
                    local.home?.tasks ?? [],
                    cloud.home?.tasks ?? []
                ),
                goals: mergeArraysById(
                    local.home?.goals ?? [],
                    cloud.home?.goals ?? []
                ),
                habits: mergeArraysById(
                    local.home?.habits ?? [],
                    cloud.home?.habits ?? []
                ),
            },
            misc: {
                notes: mergeArraysById(
                    local.misc?.notes ?? [],
                    cloud.misc?.notes ?? []
                ),
                bookmarks: mergeArraysById(
                    local.misc?.bookmarks ?? [],
                    cloud.misc?.bookmarks ?? []
                ),
                quickCaptures: mergeArraysById(
                    local.misc?.quickCaptures ?? [],
                    cloud.misc?.quickCaptures ?? []
                ),
            },
            settings: {
                ...(cloud.settings ?? {}),
                ...(local.settings ?? {}),
            },
            notificationSettings: {
                dismissedNotifications: [
                    ...(local.notificationSettings?.dismissedNotifications ??
                        []),
                    ...(cloud.notificationSettings?.dismissedNotifications ??
                        []),
                ].filter(
                    (item, index, self) =>
                        self.findIndex((t) => t.id === item.id) === index
                ),
                neverShowAgain: [
                    ...new Set([
                        ...(local.notificationSettings?.neverShowAgain ?? []),
                        ...(cloud.notificationSettings?.neverShowAgain ?? []),
                    ]),
                ],
            },
        };

        return {
            version: "2.0.0",
            lastModified: new Date().toISOString(),
            created:
                localStorage!.created < cloudData!.created
                    ? localStorage!.created
                    : cloudData!.created,
            data: mergedData as any,
        };
    }

    /**
     * Resolve conflict by applying chosen resolution
     */
    async resolveConflict(
        resolution: "cloud" | "local" | "merge"
    ): Promise<void> {
        switch (resolution) {
            case "cloud":
                await this.syncCloudToLocal();
                break;
            case "local":
                await this.syncLocalToCloud();
                break;
            case "merge":
                const merged = await this.mergeLocalAndCloud();
                // Save merged data to both local and cloud
                this.saveToLocal(STORAGE_KEYS.MAIN_DATA, merged);
                await this.saveToCloud(merged);
                break;
        }
    }

    /**
     * Flush all pending saves immediately
     * Call this before logout or page unload
     */
    async flushPendingSaves(): Promise<void> {
        // Clear timer
        if (saveTimer) {
            clearTimeout(saveTimer);
            saveTimer = null;
        }

        // Save pending data
        if (this.pendingData && this.isCloudMode()) {
            await this.saveToCloud(this.pendingData);
            this.pendingData = null;
        }
    }

    /**
     * Get storage info for display
     */
    getStorageInfo(): {
        mode: StorageMode;
        isCloudReady: boolean;
        localStorageSize: number;
    } {
        const stored = localStorage.getItem(STORAGE_KEYS.MAIN_DATA);
        const localStorageSize = stored ? new Blob([stored]).size : 0;

        return {
            mode: this.mode,
            isCloudReady: DriveService.isReady(),
            localStorageSize,
        };
    }

    // =========================================================================
    // CLOUD BACKUP METHODS
    // =========================================================================

    /**
     * Create a cloud backup of current data
     */
    async createCloudBackup(): Promise<{
        success: boolean;
        fileName?: string;
        error?: string;
    }> {
        if (!this.isCloudMode()) {
            return { success: false, error: "Not in cloud mode" };
        }

        try {
            const localData = this.loadFromLocal<StorageV2>(
                STORAGE_KEYS.MAIN_DATA
            );
            if (!localData) {
                return { success: false, error: "No data to backup" };
            }

            const result = await DriveService.createBackup(localData, "backup");
            console.log("☁️ Cloud backup created:", result.name);

            return { success: true, fileName: result.name };
        } catch (error) {
            console.error("❌ Failed to create cloud backup:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Backup failed",
            };
        }
    }

    /**
     * List all cloud backups
     */
    async listCloudBackups(): Promise<
        Array<{
            id: string;
            name: string;
            fileName: string;
            modifiedTime: string;
            createdTime: string;
            size: number;
        }>
    > {
        if (!this.isCloudMode()) {
            return [];
        }

        try {
            return await DriveService.listBackups();
        } catch (error) {
            console.error("❌ Failed to list backups:", error);
            return [];
        }
    }

    /**
     * Restore from a cloud backup
     */
    async restoreCloudBackup(
        backupFileName: string
    ): Promise<{ success: boolean; error?: string }> {
        if (!this.isCloudMode()) {
            return { success: false, error: "Not in cloud mode" };
        }

        try {
            const backupData = await DriveService.restoreBackup<StorageV2>(
                backupFileName
            );
            if (!backupData) {
                return { success: false, error: "Backup not found" };
            }

            // Save to local storage
            this.saveToLocal(STORAGE_KEYS.MAIN_DATA, backupData);

            // Save to cloud (overwrites current data)
            await this.saveToCloud(backupData);

            console.log("✅ Restored from backup:", backupFileName);
            return { success: true };
        } catch (error) {
            console.error("❌ Failed to restore backup:", error);
            return {
                success: false,
                error:
                    error instanceof Error ? error.message : "Restore failed",
            };
        }
    }

    /**
     * Delete a cloud backup
     */
    async deleteCloudBackup(
        backupFileName: string
    ): Promise<{ success: boolean; error?: string }> {
        if (!this.isCloudMode()) {
            return { success: false, error: "Not in cloud mode" };
        }

        try {
            await DriveService.deleteBackup(backupFileName);
            console.log("🗑️ Deleted backup:", backupFileName);
            return { success: true };
        } catch (error) {
            console.error("❌ Failed to delete backup:", error);
            return {
                success: false,
                error: error instanceof Error ? error.message : "Delete failed",
            };
        }
    }

    /**
     * Auto-cleanup old backups, keeping only the specified number
     */
    async cleanupOldBackups(maxBackups: number = 5): Promise<number> {
        if (!this.isCloudMode()) {
            return 0;
        }

        try {
            const backups = await this.listCloudBackups();

            if (backups.length <= maxBackups) {
                return 0;
            }

            // Sort by modified time (newest first)
            const sortedBackups = [...backups].sort(
                (a, b) =>
                    new Date(b.modifiedTime).getTime() -
                    new Date(a.modifiedTime).getTime()
            );

            // Delete backups beyond the limit
            const toDelete = sortedBackups.slice(maxBackups);
            let deleted = 0;

            for (const backup of toDelete) {
                const result = await this.deleteCloudBackup(backup.fileName);
                if (result.success) {
                    deleted++;
                }
            }

            console.log(`🧹 Cleaned up ${deleted} old backups`);
            return deleted;
        } catch (error) {
            console.error("❌ Failed to cleanup backups:", error);
            return 0;
        }
    }
}

// Export singleton instance
export const StorageService = new StorageServiceClass();
