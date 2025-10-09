import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";
import type { AppData, Toast, DismissedNotification } from "../types";
import { loadData, saveData } from "../utils/storage";
import { generateId } from "../utils/helpers";

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
    const [data, setData] = useState<AppData>(loadData());
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [dismissedNotifications, setDismissedNotifications] = useState<
        DismissedNotification[]
    >(() => {
        // Load dismissed notifications from localStorage
        const saved = localStorage.getItem("lifeos_dismissed_notifications");
        return saved ? JSON.parse(saved) : [];
    });
    const [neverShowAgain, setNeverShowAgain] = useState<string[]>(() => {
        const saved = localStorage.getItem("lifeos_never_show_notifications");
        return saved ? JSON.parse(saved) : [];
    });

    // Save to localStorage whenever data changes
    useEffect(() => {
        saveData(data);
    }, [data]);

    // Save dismissed notifications to localStorage
    useEffect(() => {
        localStorage.setItem(
            "lifeos_dismissed_notifications",
            JSON.stringify(dismissedNotifications)
        );
    }, [dismissedNotifications]);

    // Save never show again list to localStorage
    useEffect(() => {
        localStorage.setItem(
            "lifeos_never_show_notifications",
            JSON.stringify(neverShowAgain)
        );
    }, [neverShowAgain]);

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
        setData(loadData());
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

    const dismissNotification = (
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
                setNeverShowAgain((prev) => [...prev, id]);
                return;
            case "session":
            default:
                dismissUntil = undefined; // Will show again on next session
                break;
        }

        setDismissedNotifications((prev) => [
            ...prev.filter((n) => n.id !== id), // Remove if already exists
            {
                id,
                dismissedAt: now.toISOString(),
                dismissUntil,
            },
        ]);
    };

    const resetDismissedNotifications = () => {
        setDismissedNotifications([]);
        setNeverShowAgain([]);
    };

    const addNeverShowAgain = (id: string) => {
        setNeverShowAgain((prev) => [...prev, id]);
    };

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
