import { useState } from "react";
import type { ReactNode } from "react";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    useDroppable,
} from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

interface KanbanColumn<T> {
    id: string;
    title: string;
    items: T[];
    color: string;
}

interface KanbanBoardProps<T> {
    columns: KanbanColumn<T>[];
    onDragEnd: (itemId: string, newColumnId: string) => void;
    renderItem: (item: T) => ReactNode;
    getItemId: (item: T) => string;
    dragOverlay?: (item: T) => ReactNode;
}

interface DroppableColumnProps {
    id: string;
    children: ReactNode;
}

const DroppableColumn = ({ id, children }: DroppableColumnProps) => {
    const { setNodeRef } = useDroppable({ id });
    return (
        <div ref={setNodeRef} className="space-y-3">
            {children}
        </div>
    );
};

export function KanbanBoard<T>({
    columns,
    onDragEnd,
    renderItem,
    getItemId,
    dragOverlay,
}: KanbanBoardProps<T>) {
    const [activeItem, setActiveItem] = useState<T | null>(null);

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const allItems = columns.flatMap((col) => col.items);
        const item = allItems.find((i) => getItemId(i) === active.id);
        if (item) {
            setActiveItem(item);
        }
    };

    const handleDragEndInternal = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveItem(null);

        if (!over) return;

        const itemId = active.id as string;
        let newColumnId: string;

        // Check if dropped on a column or on another item
        const isColumnId = columns.some((col) => col.id === over.id);
        if (isColumnId) {
            newColumnId = over.id as string;
        } else {
            // Dropped on another item, find which column it belongs to
            const allItems = columns.flatMap((col) => col.items);
            const targetItem = allItems.find((i) => getItemId(i) === over.id);
            if (!targetItem) return;

            const targetColumn = columns.find((col) =>
                col.items.some((i) => getItemId(i) === getItemId(targetItem))
            );
            if (!targetColumn) return;
            newColumnId = targetColumn.id;
        }

        onDragEnd(itemId, newColumnId);
    };

    return (
        <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEndInternal}>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
                {columns.map((column) => (
                    <Card
                        key={column.id}
                        className="flex flex-col transition-all w-full">
                        <CardHeader className="pb-3">
                            <div
                                className={cn(
                                    "h-1 -mx-6 -mt-6 mb-4 rounded-t-lg bg-gradient-to-r",
                                    column.color
                                )}
                            />
                            <CardTitle className="flex items-center justify-between text-base sm:text-lg">
                                <span className="truncate">{column.title}</span>
                                <Badge
                                    variant="secondary"
                                    className="ml-2 shrink-0">
                                    {column.items.length}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1 min-h-[150px] sm:min-h-[200px]">
                            <DroppableColumn id={column.id}>
                                {column.items.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        No items
                                    </div>
                                ) : (
                                    <SortableContext
                                        items={column.items.map(getItemId)}
                                        strategy={verticalListSortingStrategy}>
                                        {column.items.map((item) => (
                                            <div key={getItemId(item)}>
                                                {renderItem(item)}
                                            </div>
                                        ))}
                                    </SortableContext>
                                )}
                            </DroppableColumn>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <DragOverlay>
                {activeItem && dragOverlay ? dragOverlay(activeItem) : null}
            </DragOverlay>
        </DndContext>
    );
}
