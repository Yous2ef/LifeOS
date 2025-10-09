import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface ListCardBadge {
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
    className?: string;
}

export interface ListCardAction {
    label?: string;
    icon: ReactNode;
    onClick: () => void;
    variant?: "default" | "destructive" | "ghost" | "outline";
    separator?: boolean;
}

interface ListCardProps {
    title: string;
    description?: string;
    badges?: ListCardBadge[];
    actions?: ListCardAction[];
    children?: ReactNode;
    onClick?: () => void;
    className?: string;
}

export const ListCard = ({
    title,
    description,
    badges,
    actions,
    children,
    onClick,
    className,
}: ListCardProps) => {
    return (
        <Card
            className={cn(
                "hover:shadow-md transition-shadow",
                onClick && "cursor-pointer",
                className
            )}
            onClick={onClick}>
            <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                        <h4 className="font-semibold text-lg text-foreground">
                            {title}
                        </h4>
                        {description && (
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                        {badges && badges.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {badges.map((badge, index) => (
                                    <Badge
                                        key={index}
                                        variant={badge.variant || "outline"}
                                        className={badge.className}>
                                        {badge.icon && (
                                            <span className="mr-1">
                                                {badge.icon}
                                            </span>
                                        )}
                                        {badge.label}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        {children}
                    </div>

                    {actions && actions.length > 0 && (
                        <div className="flex items-center gap-1 shrink-0">
                            {actions.map((action, index) => (
                                <Button
                                    key={index}
                                    variant={action.variant || "ghost"}
                                    size="icon"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        action.onClick();
                                    }}
                                    title={action.label}>
                                    {action.icon}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
