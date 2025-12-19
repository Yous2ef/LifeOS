import {
    X,
    AlertTriangle,
    Info,
    CheckCircle,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FinancialAlert } from "@/types/finance";

interface SmartAlertsProps {
    alerts: FinancialAlert[];
    onDismiss: (id: string) => void;
    maxVisible?: number;
}

export const SmartAlerts = ({
    alerts,
    onDismiss,
    maxVisible = 3,
}: SmartAlertsProps) => {
    // Sort by severity (critical first)
    const sortedAlerts = [...alerts].sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, success: 2, info: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
    });

    const visibleAlerts = sortedAlerts.slice(0, maxVisible);
    const hiddenCount = alerts.length - maxVisible;

    const getSeverityStyles = (severity: string) => {
        switch (severity) {
            case "critical":
                return {
                    bg: "bg-red-500/10 border-red-500/30",
                    icon: AlertTriangle,
                    iconColor: "text-red-500",
                };
            case "warning":
                return {
                    bg: "bg-yellow-500/10 border-yellow-500/30",
                    icon: AlertTriangle,
                    iconColor: "text-yellow-500",
                };
            case "success":
                return {
                    bg: "bg-green-500/10 border-green-500/30",
                    icon: CheckCircle,
                    iconColor: "text-green-500",
                };
            default:
                return {
                    bg: "bg-blue-500/10 border-blue-500/30",
                    icon: Info,
                    iconColor: "text-blue-500",
                };
        }
    };

    if (alerts.length === 0) return null;

    return (
        <div className="space-y-2">
            {visibleAlerts.map((alert) => {
                const styles = getSeverityStyles(alert.severity);
                const Icon = styles.icon;

                return (
                    <div
                        key={alert.id}
                        className={cn(
                            "flex items-start gap-3 p-3 rounded-lg border transition-all animate-in fade-in-0 slide-in-from-top-2",
                            styles.bg
                        )}>
                        <Icon
                            className={cn(
                                "h-5 w-5 mt-0.5 shrink-0",
                                styles.iconColor
                            )}
                        />

                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{alert.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {alert.message}
                            </p>

                            {alert.actionable && alert.actionLabel && (
                                <button className="text-xs text-primary font-medium mt-2 flex items-center gap-1 hover:underline">
                                    {alert.actionLabel}
                                    <ChevronRight className="h-3 w-3" />
                                </button>
                            )}
                        </div>

                        {!alert.dismissed && (
                            <button
                                onClick={() => onDismiss(alert.id)}
                                className="p-1 rounded-full hover:bg-background/50 transition-colors shrink-0">
                                <X className="h-4 w-4 text-muted-foreground" />
                            </button>
                        )}
                    </div>
                );
            })}

            {hiddenCount > 0 && (
                <button className="w-full text-center py-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    +{hiddenCount} more notification{hiddenCount > 1 ? "s" : ""}
                </button>
            )}
        </div>
    );
};
