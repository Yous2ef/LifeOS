import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ChipProps {
    active: boolean;
    onClick: () => void;
    children: ReactNode;
    /** Classes for the selected state (each form has its own accent) */
    activeClassName?: string;
    className?: string;
}

/** Toggle chip (filters, category picks) */
export const Chip = ({
    active,
    onClick,
    children,
    activeClassName = "bg-primary text-primary-foreground",
    className,
}: ChipProps) => (
    <button
        type="button"
        aria-pressed={active}
        onClick={onClick}
        className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full whitespace-nowrap text-sm font-medium transition-colors",
            active ? activeClassName : "bg-muted/50 hover:bg-muted",
            className,
        )}>
        {children}
    </button>
);
