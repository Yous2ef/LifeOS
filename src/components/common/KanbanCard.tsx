import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";

export interface KanbanCardAction {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: "default" | "destructive";
    separator?: boolean;
}

export interface KanbanCardBadge {
    label: string;
    variant?:
        | "default"
        | "secondary"
        | "destructive"
        | "outline"
        | "success"
        | "warning"
        | "danger";
    icon?: ReactNode;
}

interface KanbanCardProps {
    id: string;
    title: string;
    description?: string;
    badges?: KanbanCardBadge[];
    actions: KanbanCardAction[];
    children?: ReactNode;
    className?: string;
}

export const KanbanCard = ({
    id,
    title,
    description,
    badges,
    actions,
    children,
    className,
}: KanbanCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const transformStyle = CSS.Transform.toString(transform);

    return (
        <div
            ref={setNodeRef}
            style={{ transform: transformStyle, transition }}
            className={isDragging ? "opacity-50 scale-95" : ""}>
            <Card
                className={cn(
                    "p-3 sm:p-4 hover:shadow-md transition-all",
                    className
                )}>
                <div className="space-y-2 sm:space-y-3">
                    <div className="flex items-start justify-between gap-2">
                        <div
                            className={cn(
                                "flex-1 cursor-grab active:cursor-grabbing min-w-0",
                                isDragging && "cursor-grabbing"
                            )}
                            {...attributes}
                            {...listeners}>
                            <h4 className="font-medium text-foreground text-sm sm:text-base break-words">
                                {title}
                            </h4>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="shrink-0">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {actions.map((action, index) => (
                                    <div key={index}>
                                        {action.separator && index > 0 && (
                                            <DropdownMenuSeparator />
                                        )}
                                        <DropdownMenuItem
                                            onClick={action.onClick}
                                            className={
                                                action.variant === "destructive"
                                                    ? "text-destructive"
                                                    : ""
                                            }>
                                            {action.icon && (
                                                <span className="mr-2">
                                                    {action.icon}
                                                </span>
                                            )}
                                            {action.label}
                                        </DropdownMenuItem>
                                    </div>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div
                        className={cn(
                            "cursor-grab active:cursor-grabbing",
                            isDragging && "cursor-grabbing"
                        )}
                        {...attributes}
                        {...listeners}>
                        {description && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-3 break-words">
                                {description}
                            </p>
                        )}

                        {badges && badges.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {badges.map((badge, index) => (
                                    <Badge
                                        key={index}
                                        variant={badge.variant || "outline"}
                                        className="text-xs">
                                        {badge.icon && (
                                            <span className="mr-1">
                                                {badge.icon}
                                            </span>
                                        )}
                                        <span className="truncate max-w-[150px]">
                                            {badge.label}
                                        </span>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {children}
                    </div>
                </div>
            </Card>
        </div>
    );
};
