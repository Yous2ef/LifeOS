import { useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { notificationService } from "@/services/NotificationService";
import type { SmartNotification } from "@/types/notifications";

/**
 * Hook to use the notification service
 * Automatically subscribes to notifications and displays them as toasts
 */
export const useNotifications = () => {
    const { data, showToast } = useApp();

    useEffect(() => {
        // Subscribe to notification service
        const unsubscribe = notificationService.subscribe(
            (notification: SmartNotification) => {
                // Determine toast type based on notification priority
                let toastType: "success" | "error" | "info" | "warning" =
                    "info";

                switch (notification.priority) {
                    case "urgent":
                        toastType = "error";
                        break;
                    case "high":
                        toastType = "warning";
                        break;
                    case "medium":
                        toastType = "info";
                        break;
                    case "low":
                        toastType = "success";
                        break;
                }

                // Show toast with title and message
                showToast(
                    `${notification.title}: ${notification.message}`,
                    toastType
                );
            }
        );

        // Cleanup subscription on unmount
        return () => unsubscribe();
    }, [showToast]); // Only re-subscribe if showToast changes (which should be stable)

    return {
        checkNotifications: () => notificationService.checkAll(data),
        clearNotifications: () => notificationService.clearNotifications(),
        updateConfig:
            notificationService.updateConfig.bind(notificationService),
        getConfig: notificationService.getConfig.bind(notificationService),
    };
};
