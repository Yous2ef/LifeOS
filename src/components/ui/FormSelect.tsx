import React, { type SelectHTMLAttributes } from "react";
import { cn } from "../../utils/helpers";

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options: { value: string; label: string }[];
}

export const FormSelect: React.FC<FormSelectProps> = ({
    label,
    error,
    options,
    className,
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-foreground mb-2">
                    {label}
                </label>
            )}
            <select
                className={cn(
                    "w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200",
                    error && "border-destructive focus:ring-destructive",
                    className
                )}
                {...props}>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
        </div>
    );
};
