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
}

// Export singleton instance
export const StorageService = new StorageServiceClass();
