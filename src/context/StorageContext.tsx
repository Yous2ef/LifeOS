/**
 * StorageContext (V2 - Unified Storage)
 *
 * Provides storage functionality app-wide with automatic
 * mode switching based on authentication state.
 *
 * V2 Architecture:
 * - Single storage key: "lifeos"
 * - Single Drive file: "lifeos.json"
 * - Contains all AppData in one unified structure
 *
 * This context wraps the StorageService and provides React-friendly
 * hooks for data persistence.
 */

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
    type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
    StorageService,
    STORAGE_KEYS,
    type StorageKey,
    type StorageMode,
} from "../services/StorageService";
import { DriveService } from "../services/DriveService";
import { DRIVE_FILE } from "../config/google";
import type { AppData } from "../types";
import type { StorageV2 } from "../utils/storageV2";
import type { ConflictData, ConflictResolution } from "../components/common";

interface StorageContextType {
    // Mode
    mode: StorageMode;
    isCloudMode: boolean;
    isReady: boolean;

    // Status
    isSyncing: boolean;
    lastSyncTime: Date | null;

    // Conflict handling
    hasConflict: boolean;
    conflictData: ConflictData | null;
    resolveConflict: (resolution: ConflictResolution) => Promise<void>;
    isResolvingConflict: boolean;

    // Operations (V2 - unified AppData)
    saveData: (data: AppData) => void;
    loadData: () => AppData | null;

    // Sync operations
    syncNow: () => Promise<void>;

    // For hooks that need to subscribe to storage changes
    subscribeToKey: (
        key: StorageKey,
        callback: (data: unknown) => void
    ) => () => void;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

export const useStorageContext = () => {
    const context = useContext(StorageContext);
    if (!context) {
        throw new Error(
            "useStorageContext must be used within StorageProvider"
        );
    }
    return context;
};

interface StorageProviderProps {
    children: ReactNode;
}

export const StorageProvider: React.FC<StorageProviderProps> = ({
    children,
}) => {
    const { isAuthenticated, accessToken } = useAuth();
    const [mode, setMode] = useState<StorageMode>("local");
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
    const [isReady, setIsReady] = useState(false);

    // Conflict state
    const [hasConflict, setHasConflict] = useState(false);
    const [conflictData, setConflictData] = useState<ConflictData | null>(null);
    const [isResolvingConflict, setIsResolvingConflict] = useState(false);

    // Subscribers for storage changes
    const subscribers = useRef<Map<StorageKey, Set<(data: unknown) => void>>>(
        new Map()
    );

    // Track if initial cloud sync has been done
    const initialSyncDone = useRef(false);

    // Update storage mode based on auth state
    useEffect(() => {
        const newMode: StorageMode =
            isAuthenticated && accessToken ? "cloud" : "local";
        StorageService.setMode(newMode);
        setMode(newMode);

        // Reset sync state when switching to local
        if (newMode === "local") {
            initialSyncDone.current = false;
            setHasConflict(false);
            setConflictData(null);
        }
    }, [isAuthenticated, accessToken]);

    // Handle initial sync when switching to cloud mode
    useEffect(() => {
        const performInitialSync = async () => {
            if (mode === "cloud" && !initialSyncDone.current && accessToken) {
                initialSyncDone.current = true;
                setIsSyncing(true);

                try {
                    // Check if cloud has data
                    const hasCloud = await StorageService.hasAnyCloudData();
                    const hasLocal = StorageService.hasLocalData();

                    if (!hasCloud) {
                        // No cloud data - upload local data
                        console.log(
                            "☁️ First login: uploading local data to cloud..."
                        );
                        await StorageService.syncLocalToCloud();
                        setLastSyncTime(new Date());
                    } else if (!hasLocal) {
                        // No local data - download cloud data
                        console.log(
                            "☁️ No local data: downloading from cloud..."
                        );
                        await StorageService.syncCloudToLocal();
                        notifySubscribers();
                        setLastSyncTime(new Date());
                    } else {
                        // Both have data - check for conflict
                        console.log(
                            "☁️ Both local and cloud have data, checking for conflicts..."
                        );
                        const conflict = await StorageService.detectConflict();

                        if (
                            conflict.hasConflict &&
                            conflict.localMeta &&
                            conflict.cloudMeta
                        ) {
                            console.log("⚠️ Sync conflict detected!");
                            setConflictData({
                                localLastModified:
                                    conflict.localMeta.lastModified,
                                cloudLastModified:
                                    conflict.cloudMeta.lastModified,
                                localDataSize: conflict.localMeta.size,
                                cloudDataSize: conflict.cloudMeta.size,
                            });
                            setHasConflict(true);
                        } else {
                            // No conflict - sync newer to older
                            if (conflict.localMeta && conflict.cloudMeta) {
                                if (
                                    conflict.localMeta.lastModified >
                                    conflict.cloudMeta.lastModified
                                ) {
                                    console.log(
                                        "☁️ Local is newer, syncing to cloud..."
                                    );
                                    await StorageService.syncLocalToCloud();
                                } else {
                                    console.log(
                                        "☁️ Cloud is newer, syncing to local..."
                                    );
                                    await StorageService.syncCloudToLocal();
                                    notifySubscribers();
                                }
                            }
                            setLastSyncTime(new Date());
                        }
                    }
                } catch (error) {
                    console.error("❌ Initial sync failed:", error);
                } finally {
                    setIsSyncing(false);
                }
            }
        };

        performInitialSync();
    }, [mode, accessToken]);

    // Helper to notify all subscribers of data changes
    const notifySubscribers = useCallback(() => {
        const localData = StorageService.loadFromLocal<StorageV2>(
            STORAGE_KEYS.MAIN_DATA
        );
        if (localData) {
            subscribers.current.forEach((callbacks) => {
                callbacks.forEach((cb) => cb(localData.data));
            });
        }
    }, []);

    // Background sync check - polls for cloud changes when user is already signed in
    // This handles the case where user has multiple devices/tabs and cloud is updated elsewhere
    useEffect(() => {
        // Only run after initial sync is complete and user is authenticated
        if (mode !== "cloud" || !initialSyncDone.current || !accessToken) {
            return;
        }

        const SYNC_CHECK_INTERVAL = 30000; // Check every 30 seconds

        const checkForCloudUpdates = async () => {
            // Skip if already syncing or resolving conflict
            if (isSyncing || isResolvingConflict || hasConflict) {
                return;
            }

            try {
                const localMeta = StorageService.getLocalStorageMetadata();
                const cloudMeta =
                    await StorageService.getCloudStorageMetadata();

                if (!localMeta || !cloudMeta) {
                    return;
                }

                // If cloud is newer than local, auto-download
                if (cloudMeta.lastModified > localMeta.lastModified) {
                    console.log("☁️ Cloud has newer data, auto-syncing...");

                    // Compare actual data to confirm there's a real change
                    const localStorage =
                        StorageService.loadFromLocal<StorageV2>(
                            STORAGE_KEYS.MAIN_DATA
                        );
                    const cloudData = await DriveService.loadData<StorageV2>(
                        DRIVE_FILE
                    );

                    if (localStorage && cloudData) {
                        const localDataStr = JSON.stringify(localStorage.data);
                        const cloudDataStr = JSON.stringify(cloudData.data);

                        if (localDataStr !== cloudDataStr) {
                            // Cloud has different/newer data, pull it
                            setIsSyncing(true);
                            await StorageService.syncCloudToLocal();
                            notifySubscribers();
                            setLastSyncTime(new Date());
                            setIsSyncing(false);
                            console.log(
                                "✅ Auto-synced from cloud (background check)"
                            );
                        }
                    }
                }
            } catch (error) {
                console.error("❌ Background sync check failed:", error);
            }
        };

        // Run immediately once, then set up interval
        const timeoutId = setTimeout(checkForCloudUpdates, 5000); // First check after 5 seconds
        const intervalId = setInterval(
            checkForCloudUpdates,
            SYNC_CHECK_INTERVAL
        );

        return () => {
            clearTimeout(timeoutId);
            clearInterval(intervalId);
        };
    }, [
        mode,
        accessToken,
        isSyncing,
        isResolvingConflict,
        hasConflict,
        notifySubscribers,
    ]);

    // Resolve conflict with user choice
    const resolveConflict = useCallback(
        async (resolution: ConflictResolution): Promise<void> => {
            setIsResolvingConflict(true);
            try {
                await StorageService.resolveConflict(resolution);
                setHasConflict(false);
                setConflictData(null);
                setLastSyncTime(new Date());

                // Notify subscribers of the resolved data
                notifySubscribers();

                console.log(`✅ Conflict resolved using: ${resolution}`);
            } catch (error) {
                console.error("❌ Failed to resolve conflict:", error);
                throw error;
            } finally {
                setIsResolvingConflict(false);
            }
        },
        [notifySubscribers]
    );

    // Mark as ready once mode is determined
    useEffect(() => {
        setIsReady(true);
    }, []);

    // Flush pending saves before page unload
    useEffect(() => {
        const handleBeforeUnload = () => {
            StorageService.flushPendingSaves();
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () =>
            window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    // Save AppData with cloud sync
    const saveData = useCallback(function saveDataFn(data: AppData): void {
        // Save to storage (will handle local and cloud automatically)
        StorageService.saveAppData(data);

        // Notify subscribers
        subscribers.current.forEach((callbacks) => {
            callbacks.forEach((cb) => cb(data));
        });
    }, []);

    // Load AppData (synchronous from local, async from cloud happens in background)
    const loadData = useCallback(function loadDataFn(): AppData | null {
        const storage = StorageService.loadFromLocal<StorageV2>(
            STORAGE_KEYS.MAIN_DATA
        );
        return storage?.data ?? null;
    }, []);

    // Auto-backup scheduler - checks if a backup is due based on user settings
    useEffect(() => {
        // Only run in cloud mode after initial sync
        if (mode !== "cloud" || !initialSyncDone.current || !accessToken) {
            return;
        }

        const checkAndRunAutoBackup = async () => {
            try {
                const currentData = loadData();
                if (!currentData?.settings?.backup?.autoBackupEnabled) {
                    return; // Auto-backup is disabled
                }

                const backupSettings = currentData.settings.backup;
                const lastBackupTime = backupSettings.lastBackupTime;
                const frequency = backupSettings.frequency;
                const now = Date.now();

                // Calculate interval in milliseconds
                const frequencyMs: Record<string, number> = {
                    daily: 24 * 60 * 60 * 1000,
                    every2days: 2 * 24 * 60 * 60 * 1000,
                    weekly: 7 * 24 * 60 * 60 * 1000,
                    monthly: 30 * 24 * 60 * 60 * 1000,
                };

                const interval = frequencyMs[frequency];
                if (!interval) return;

                // Check if backup is due
                const isBackupDue =
                    !lastBackupTime || now - lastBackupTime > interval;

                if (isBackupDue) {
                    console.log("⏰ Auto-backup is due, creating backup...");

                    // Create backup
                    const result = await StorageService.createCloudBackup();

                    if (result.success) {
                        // Cleanup old backups
                        await StorageService.cleanupOldBackups(
                            backupSettings.maxBackups || 5
                        );

                        // Update lastBackupTime in the data
                        const updatedData = {
                            ...currentData,
                            settings: {
                                ...currentData.settings,
                                backup: {
                                    ...backupSettings,
                                    lastBackupTime: now,
                                },
                            },
                        };

                        // Save the updated settings (this will sync to cloud)
                        StorageService.saveAppData(updatedData);
                        notifySubscribers();

                        console.log("✅ Auto-backup completed");
                    }
                }
            } catch (error) {
                console.error("❌ Auto-backup failed:", error);
            }
        };

        // Check once on mount (after 10 second delay to let everything stabilize)
        const timeoutId = setTimeout(checkAndRunAutoBackup, 10000);

        return () => clearTimeout(timeoutId);
    }, [mode, accessToken, loadData, notifySubscribers]);

    // Manual sync trigger
    const syncNow = useCallback(
        async function syncNowFn(): Promise<void> {
            if (mode !== "cloud") {
                console.log("ℹ️ Not in cloud mode, nothing to sync");
                return;
            }

            setIsSyncing(true);
            try {
                // First flush any pending debounced saves
                await StorageService.flushPendingSaves();

                // Then force an immediate sync with updated timestamp
                const currentData = loadData();
                if (currentData) {
                    console.log(
                        "☁️ Manual sync: forcing immediate cloud save..."
                    );
                    await StorageService.saveAppData(currentData, {
                        immediate: true,
                    });
                }

                setLastSyncTime(new Date());
                console.log("✅ Manual sync completed");
            } finally {
                setIsSyncing(false);
            }
        },
        [mode, loadData]
    );

    // Subscribe to storage changes
    const subscribeToKey = useCallback(function subscribeFn(
        key: StorageKey,
        callback: (data: unknown) => void
    ): () => void {
        if (!subscribers.current.has(key)) {
            subscribers.current.set(key, new Set());
        }
        subscribers.current.get(key)!.add(callback);

        // Return unsubscribe function
        return () => {
            subscribers.current.get(key)?.delete(callback);
        };
    },
    []);

    return (
        <StorageContext.Provider
            value={{
                mode,
                isCloudMode: mode === "cloud",
                isReady,
                isSyncing,
                lastSyncTime,
                hasConflict,
                conflictData,
                resolveConflict,
                isResolvingConflict,
                saveData,
                loadData,
                syncNow,
                subscribeToKey,
            }}>
            {children}
        </StorageContext.Provider>
    );
};

// Re-export for convenience
export { STORAGE_KEYS };
export type { StorageKey, StorageMode };
