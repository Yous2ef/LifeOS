import React from "react";
import { cn } from "../../utils/helpers";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    action,
    className,
}) => {
    return (
        <div
            className={cn(
                "flex flex-col items-center justify-center py-12 px-4 text-center",
                className
            )}>
            {icon && (
                <div className="mb-4 text-gray-600 opacity-50">{icon}</div>
            )}
            <h3 className="text-lg font-semibold text-gray-300 mb-2">
                {title}
            </h3>
            {description && (
                <p className="text-gray-500 mb-6 max-w-sm">{description}</p>
            )}
            {action}
        </div>
    );
};
