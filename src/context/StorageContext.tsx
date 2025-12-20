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
import type { AppData } from "../types";
import type { StorageV2 } from "../utils/storageV2";

interface StorageContextType {
    // Mode
    mode: StorageMode;
    isCloudMode: boolean;
    isReady: boolean;

    // Status
    isSyncing: boolean;
    lastSyncTime: Date | null;

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

                    if (!hasCloud) {
                        // No cloud data - upload local data
                        console.log(
                            "☁️ First login: uploading local data to cloud..."
                        );
                        await StorageService.syncLocalToCloud();
                    } else {
                        // Cloud has data - download to local
                        console.log("☁️ Cloud data found: syncing to local...");
                        await StorageService.syncCloudToLocal();

                        // Notify all subscribers to refresh their data
                        const localData =
                            StorageService.loadFromLocal<StorageV2>(
                                STORAGE_KEYS.MAIN_DATA
                            );
                        if (localData) {
                            subscribers.current.forEach((callbacks) => {
                                callbacks.forEach((cb) => cb(localData.data));
                            });
                        }
                    }

                    setLastSyncTime(new Date());
                } catch (error) {
                    console.error("❌ Initial sync failed:", error);
                } finally {
                    setIsSyncing(false);
                }
            }
        };

        performInitialSync();
    }, [mode, accessToken]);

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

    // Manual sync trigger
    const syncNow = useCallback(
        async function syncNowFn(): Promise<void> {
            if (mode !== "cloud") {
                console.log("ℹ️ Not in cloud mode, nothing to sync");
                return;
            }

            setIsSyncing(true);
            try {
                await StorageService.flushPendingSaves();
                setLastSyncTime(new Date());
            } finally {
                setIsSyncing(false);
            }
        },
        [mode]
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
