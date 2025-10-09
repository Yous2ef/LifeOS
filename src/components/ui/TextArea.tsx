import React, { type TextareaHTMLAttributes } from "react";
import { cn } from "../../utils/helpers";

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
    error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
    label,
    error,
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
            <textarea
                className={cn(
                    "w-full px-4 py-2.5 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all duration-200 resize-none",
                    error && "border-destructive focus:ring-destructive",
                    className
                )}
                {...props}
            />
            {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
        </div>
    );
};
