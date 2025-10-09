import React from "react";
import { cn } from "../../utils/helpers";

interface ProgressBarProps {
    value: number;
    max?: number;
    size?: "sm" | "md" | "lg";
    color?: "primary" | "success" | "warning" | "danger";
    showLabel?: boolean;
    className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    value,
    max = 100,
    size = "md",
    color = "primary",
    showLabel = false,
    className,
}) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizes = {
        sm: "h-1",
        md: "h-2",
        lg: "h-3",
    };

    const colors = {
        primary: "bg-gradient-to-r from-cyan-500 to-teal-500",
        success: "bg-gradient-to-r from-green-500 to-emerald-500",
        warning: "bg-gradient-to-r from-yellow-500 to-orange-500",
        danger: "bg-gradient-to-r from-red-500 to-rose-500",
    };

    return (
        <div className={cn("w-full", className)}>
            {showLabel && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-400">Progress</span>
                    <span className="text-sm font-medium text-gray-300">
                        {Math.round(percentage)}%
                    </span>
                </div>
            )}
            <div
                className={cn(
                    "w-full bg-gray-700 rounded-full overflow-hidden",
                    sizes[size]
                )}>
                <div
                    className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out",
                        colors[color]
                    )}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
};
