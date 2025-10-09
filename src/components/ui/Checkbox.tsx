import * as React from "react";

export interface CheckboxProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
    ({ className = "", onCheckedChange, checked, ...props }, ref) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            if (onCheckedChange) {
                onCheckedChange(e.target.checked);
            }
        };

        return (
            <input
                type="checkbox"
                ref={ref}
                checked={checked as boolean}
                onChange={handleChange}
                className={`h-5 w-5 rounded border-2 border-input bg-background text-primary cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors ${className}`}
                {...props}
            />
        );
    }
);

Checkbox.displayName = "Checkbox";
