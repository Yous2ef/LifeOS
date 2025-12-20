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
import {
    loadData as loadStorageData,
    saveData as saveStorageData,
} from "../utils/storage";
import { generateId } from "../utils/helpers";
import { useStorageContext, STORAGE_KEYS } from "./StorageContext";

interface AppContextType {
    data: AppData;
    updateData: (newData: Partial<AppData>) => void;
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
                if (newData) {
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

    // Persist to V2 unified storage only
    useEffect(() => {
        // Skip save if update came from external sync
        if (isExternalUpdate.current) {
            isExternalUpdate.current = false;
            return;
        }

        try {
            // Save to V2 unified storage (single key: "lifeos")
            saveStorageData(data);
        } catch (error) {
            console.error("Failed to save app data:", error);
        }
    }, [data]);

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
