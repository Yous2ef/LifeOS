import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    useCallback,
    type ReactNode,
} from "react";
import type { AppData, Toast, DismissedNotification } from "../types";
import { loadData as loadStorageData } from "../utils/storage";
import { generateId } from "../utils/helpers";
import { useStorageContext, STORAGE_KEYS } from "./StorageContext";

interface AppContextType {
    data: AppData;
    updateData: (newData: Partial<AppData>) => void;
    /** Replaces one module with `updater(latest module)` — safe for several writes in one tick. */
    updateModule: <K extends keyof AppData>(
        key: K,
        updater: (prev: AppData[K]) => AppData[K],
    ) => void;
    refreshData: () => void;
    showToast: (message: string, type?: Toast["type"]) => void;
    toasts: Toast[];
    removeToast: (id: string) => void;
    dismissedNotifications: DismissedNotification[];
    dismissNotification: (
        id: string,
        period?: "session" | "day" | "week" | "never"
    ) => void;
    resetDismissedNotifications: () => void;
    neverShowAgain: string[];
    addNeverShowAgain: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Long enough for a modal's close animation to finish before the store is serialised
const SAVE_DELAY_MS = 400;

export const useApp = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useApp must be used within AppProvider");
    }
    return context;
};

interface AppProviderProps {
    children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const { subscribeToKey } = useStorageContext();

    // Track if update came from external sync to prevent save loop
    const isExternalUpdate = useRef(false);
    // Track if this is the initial mount to skip saving on first render
    const isInitialMount = useRef(true);
    // The data this provider last saved. Storage notifies subscribers of every
    // save, including our own; re-reading and re-applying that echo parsed the
    // whole store and re-rendered the app a second time on every write.
    const lastSaved = useRef<AppData | null>(null);
    // Data waiting to be written. Writes are delayed a moment so serialising the
    // whole store doesn't block the frame that starts a modal's close animation,
    // and quick edits (e.g. reordering) collapse into one write.
    const pendingSave = useRef<{ data: AppData; timer: number } | null>(null);

    const [data, setData] = useState<AppData>(() => {
        // Load data from unified V2 storage (handles V1→V2 migration automatically)
        return loadStorageData();
    });
    const [toasts, setToasts] = useState<Toast[]>([]);

    // Derived state from unified data - for backward compatibility with existing UI
    const dismissedNotifications =
        data.notificationSettings?.dismissedNotifications ?? [];
    const neverShowAgain = data.notificationSettings?.neverShowAgain ?? [];

    // Subscribe to external storage updates (from cloud sync)
    useEffect(() => {
        const unsubscribe = subscribeToKey(
            STORAGE_KEYS.MAIN_DATA,
            (newData) => {
                if (newData && newData !== lastSaved.current) {
                    // External data wins over a local write still waiting
                    if (pendingSave.current) {
                        clearTimeout(pendingSave.current.timer);
                        pendingSave.current = null;
                    }
                    const stored = newData as AppData;
                    const defaultData = loadStorageData();
                    isExternalUpdate.current = true;
                    setData({
                        ...defaultData,
                        ...stored,
                        university: {
                            ...defaultData.university,
                            ...stored.university,
                        },
                        freelancing: {
                            ...defaultData.freelancing,
                            ...stored.freelancing,
                        },
                        programming: {
                            ...defaultData.programming,
                            ...stored.programming,
                        },
                        home: { ...defaultData.home, ...stored.home },
                        misc: { ...defaultData.misc, ...stored.misc },
                        settings: {
                            ...defaultData.settings,
                            ...stored.settings,
                        },
                    });
                }
            }
        );
        return unsubscribe;
    }, [subscribeToKey]);

    // Get saveData from StorageContext for cloud sync support
    const { saveData: saveToStorage } = useStorageContext();

    // Read through a ref so the flush stays stable (its cleanup flushes)
    const saveToStorageRef = useRef(saveToStorage);
    saveToStorageRef.current = saveToStorage;

    const flushPendingSave = useCallback(() => {
        const pending = pendingSave.current;
        if (!pending) return;
        clearTimeout(pending.timer);
        pendingSave.current = null;
        try {
            // Save to storage (local + cloud via StorageService)
            lastSaved.current = pending.data;
            saveToStorageRef.current(pending.data);
        } catch (error) {
            console.error("Failed to save app data:", error);
        }
    }, []);

    // Persist to V2 unified storage with cloud sync
    useEffect(() => {
        // Skip save on initial mount - we just loaded the data, no need to save it back
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        // Skip save if update came from external sync
        if (isExternalUpdate.current) {
            isExternalUpdate.current = false;
            return;
        }

        if (pendingSave.current) clearTimeout(pendingSave.current.timer);
        pendingSave.current = {
            data,
            timer: window.setTimeout(flushPendingSave, SAVE_DELAY_MS),
        };
    }, [data, flushPendingSave]);

    // Never lose a waiting write when the tab is hidden or closed
    useEffect(() => {
        const flushIfHidden = () => {
            if (document.visibilityState === "hidden") flushPendingSave();
        };
        window.addEventListener("pagehide", flushPendingSave);
        document.addEventListener("visibilitychange", flushIfHidden);
        return () => {
            flushPendingSave();
            window.removeEventListener("pagehide", flushPendingSave);
            document.removeEventListener("visibilitychange", flushIfHidden);
        };
    }, [flushPendingSave]);

    const updateData = (newData: Partial<AppData>) => {
        setData((prev) => {
            const updated = { ...prev };

            // Deep merge the data
            Object.keys(newData).forEach((key) => {
                const typedKey = key as keyof AppData;
                if (
                    typeof newData[typedKey] === "object" &&
                    !Array.isArray(newData[typedKey])
                ) {
                    updated[typedKey] = {
                        ...prev[typedKey],
                        ...newData[typedKey],
                    } as any;
                } else {
                    updated[typedKey] = newData[typedKey] as any;
                }
            });

            return updated;
        });
    };

    const updateModule = useCallback(
        <K extends keyof AppData>(
            key: K,
            updater: (prev: AppData[K]) => AppData[K],
        ) => {
            setData((prev) => {
                const next = updater(prev[key]);
                return next === prev[key] ? prev : { ...prev, [key]: next };
            });
        },
        [],
    );

    const refreshData = () => {
        // Reload from V2 unified storage
        setData(loadStorageData());
    };

    const showToast = (message: string, type: Toast["type"] = "info") => {
        const toast: Toast = {
            id: generateId(),
            message,
            type,
            duration: 3000,
        };

        setToasts((prev) => [...prev, toast]);

        // Auto remove after duration
        setTimeout(() => {
            removeToast(toast.id);
        }, toast.duration);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const dismissNotification = useCallback(
        (
            id: string,
            period: "session" | "day" | "week" | "never" = "session"
        ) => {
            const now = new Date();
            let dismissUntil: string | undefined;

            switch (period) {
                case "day":
                    dismissUntil = new Date(
                        now.getTime() + 24 * 60 * 60 * 1000
                    ).toISOString();
                    break;
                case "week":
                    dismissUntil = new Date(
                        now.getTime() + 7 * 24 * 60 * 60 * 1000
                    ).toISOString();
                    break;
                case "never":
                    // Add to neverShowAgain via unified storage
                    setData((prev) => ({
                        ...prev,
                        notificationSettings: {
                            ...prev.notificationSettings,
                            neverShowAgain: [
                                ...(prev.notificationSettings?.neverShowAgain ??
                                    []),
                                id,
                            ],
                        },
                    }));
                    return;
                case "session":
                default:
                    dismissUntil = undefined; // Will show again on next session
                    break;
            }

            // Update dismissedNotifications via unified storage
            setData((prev) => ({
                ...prev,
                notificationSettings: {
                    ...prev.notificationSettings,
                    dismissedNotifications: [
                        ...(
                            prev.notificationSettings?.dismissedNotifications ??
                            []
                        ).filter((n) => n.id !== id),
                        {
                            id,
                            dismissedAt: now.toISOString(),
                            dismissUntil,
                        },
                    ],
                },
            }));
        },
        []
    );

    const resetDismissedNotifications = useCallback(() => {
        setData((prev) => ({
            ...prev,
            notificationSettings: {
                dismissedNotifications: [],
                neverShowAgain: [],
            },
        }));
    }, []);

    const addNeverShowAgain = useCallback((id: string) => {
        setData((prev) => ({
            ...prev,
            notificationSettings: {
                ...prev.notificationSettings,
                neverShowAgain: [
                    ...(prev.notificationSettings?.neverShowAgain ?? []),
                    id,
                ],
            },
        }));
    }, []);

    return (
        <AppContext.Provider
            value={{
                data,
                updateData,
                updateModule,
                refreshData,
                showToast,
                toasts,
                removeToast,
                dismissedNotifications,
                dismissNotification,
                resetDismissedNotifications,
                neverShowAgain,
                addNeverShowAgain,
            }}>
            {children}
        </AppContext.Provider>
    );
};
