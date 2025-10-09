import type { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface ListViewProps<T> {
    items: T[];
    renderItem: (item: T) => ReactNode;
    getItemId: (item: T) => string;
    emptyMessage?: string;
    className?: string;
}

export function ListView<T>({
    items,
    renderItem,
    getItemId,
    emptyMessage = "No items to display",
    className = "",
}: ListViewProps<T>) {
    if (items.length === 0) {
        return (
            <Card className="p-12 text-center border-border">
                <p className="text-muted-foreground">{emptyMessage}</p>
            </Card>
        );
    }

    return (
        <div className={`space-y-3 ${className}`}>
            {items.map((item) => (
                <div key={getItemId(item)}>{renderItem(item)}</div>
            ))}
        </div>
    );
}
