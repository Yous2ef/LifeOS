import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
    Plus,
    List,
    LayoutGrid,
    BookOpen,
    Clock,
    Calendar,
} from "lucide-react";
import {
    KanbanBoard,
    KanbanCard,
    ListView,
    ListCard,
} from "@/components/common";
import type {
    KanbanCardBadge,
    KanbanCardAction,
    ListCardBadge,
    ListCardAction,
} from "@/components/common";
import type { LearningItem } from "@/types/programming";
import { LearningItemModal } from "./LearningItemModal";
import { getPriorityColor, formatDate } from "@/utils/helpers";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/progress";

interface LearningItemsTabProps {
    items: LearningItem[];
    onAdd: (item: Omit<LearningItem, "id" | "createdAt" | "updatedAt">) => void;
    onUpdate: (id: string, updates: Partial<LearningItem>) => void;
    onDelete: (id: string) => void;
}

export const LearningItemsTab = ({
    items,
    onAdd,
    onUpdate,
    onDelete,
}: LearningItemsTabProps) => {
    const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<LearningItem | undefined>();

    const handleEdit = (item: LearningItem) => {
        setEditingItem(item);
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setEditingItem(undefined);
    };

    const handleUpdateStatus = (
        itemId: string,
        newStatus: LearningItem["status"]
    ) => {
        onUpdate(itemId, { status: newStatus });
    };

    const getItemBadges = (item: LearningItem): KanbanCardBadge[] => {
        const badges: KanbanCardBadge[] = [];

        badges.push({
            label: `Priority ${item.priority}`,
            variant: getPriorityColor(item.priority),
        });

        badges.push({
            label: item.type.charAt(0).toUpperCase() + item.type.slice(1),
            variant: "outline",
        });

        if (item.platform) {
            badges.push({
                label: item.platform,
                variant: "secondary",
            });
        }

        return badges;
    };

    const getItemActions = (item: LearningItem): KanbanCardAction[] => [
        {
            label: "Edit",
            onClick: () => handleEdit(item),
        },
        {
            label: "Delete",
            onClick: () => onDelete(item.id),
            variant: "destructive",
            separator: true,
        },
    ];

    const getListBadges = (item: LearningItem): ListCardBadge[] => {
        const badges: ListCardBadge[] = [];

        badges.push({
            label: item.status.replace("-", " ").toUpperCase(),
            variant: "outline",
        });

        badges.push({
            label: `Priority ${item.priority}`,
            variant: getPriorityColor(item.priority),
        });

        badges.push({
            label: item.type.charAt(0).toUpperCase() + item.type.slice(1),
            variant: "secondary",
        });

        if (item.dueDate) {
            badges.push({
                label: formatDate(item.dueDate),
                variant: "outline",
                icon: <Calendar className="h-3 w-3" />,
            });
        }

        return badges;
    };

    const kanbanColumns = [
        {
            id: "to-start",
            title: "To Start",
            items: items.filter((i) => i.status === "to-start"),
            color: "from-blue-500 to-cyan-500",
        },
        {
            id: "in-progress",
            title: "In Progress",
            items: items.filter((i) => i.status === "in-progress"),
            color: "from-yellow-500 to-orange-500",
        },
        {
            id: "completed",
            title: "Completed",
            items: items.filter((i) => i.status === "completed"),
            color: "from-green-500 to-emerald-500",
        },
        {
            id: "on-hold",
            title: "On Hold",
            items: items.filter((i) => i.status === "on-hold"),
            color: "from-gray-500 to-slate-500",
        },
    ];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Learning Items</h3>
                    <p className="text-sm text-muted-foreground">
                        {items.length} items •{" "}
                        {items.filter((i) => i.status === "completed").length}{" "}
                        completed
                    </p>
                </div>
                <div className="flex gap-2">
                    <div className="flex border border-input rounded-md">
                        <Button
                            variant={viewMode === "list" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("list")}
                            className="gap-2 rounded-r-none">
                            <List className="h-4 w-4" />
                            List
                        </Button>
                        <Button
                            variant={
                                viewMode === "kanban" ? "default" : "ghost"
                            }
                            size="sm"
                            onClick={() => setViewMode("kanban")}
                            className="gap-2 rounded-l-none">
                            <LayoutGrid className="h-4 w-4" />
                            Kanban
                        </Button>
                    </div>
                    <Button
                        onClick={() => setModalOpen(true)}
                        className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Item
                    </Button>
                </div>
            </div>

            {/* Content */}
            {items.length === 0 ? (
                <div className="text-center py-12">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">
                        No learning items yet
                    </p>
                    <Button onClick={() => setModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Item
                    </Button>
                </div>
            ) : viewMode === "kanban" ? (
                <KanbanBoard
                    columns={kanbanColumns}
                    getItemId={(item) => item.id}
                    onDragEnd={(itemId, newColumnId) => {
                        handleUpdateStatus(
                            itemId,
                            newColumnId as LearningItem["status"]
                        );
                    }}
                    renderItem={(item) => (
                        <KanbanCard
                            id={item.id}
                            title={item.title}
                            description={item.description}
                            badges={getItemBadges(item)}
                            actions={getItemActions(item)}>
                            <div className="space-y-2">
                                <Progress
                                    value={item.progress}
                                    className="h-2"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{item.progress}% complete</span>
                                    {item.timeSpent > 0 && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {Math.floor(
                                                item.timeSpent / 60
                                            )}h {item.timeSpent % 60}m
                                        </span>
                                    )}
                                </div>
                            </div>
                        </KanbanCard>
                    )}
                    dragOverlay={(item) => (
                        <KanbanCard
                            id={item.id}
                            title={item.title}
                            description={item.description}
                            badges={getItemBadges(item)}
                            actions={[]}
                        />
                    )}
                />
            ) : (
                <ListView
                    items={items}
                    getItemId={(item) => item.id}
                    renderItem={(item) => (
                        <ListCard
                            title={item.title}
                            description={item.description}
                            badges={getListBadges(item)}
                            actions={[
                                {
                                    label: "Edit",
                                    icon: <Plus className="h-4 w-4" />,
                                    onClick: () => handleEdit(item),
                                },
                                {
                                    label: "Delete",
                                    icon: <Plus className="h-4 w-4" />,
                                    onClick: () => onDelete(item.id),
                                    variant: "destructive",
                                },
                            ]}
                            onClick={() => handleEdit(item)}>
                            <div className="space-y-2">
                                <Progress
                                    value={item.progress}
                                    className="h-2"
                                />
                                <div className="flex gap-2 flex-wrap">
                                    {item.tags.map((tag) => (
                                        <Badge
                                            key={tag}
                                            variant="outline"
                                            className="text-xs">
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </ListCard>
                    )}
                />
            )}

            {/* Modal */}
            <LearningItemModal
                isOpen={modalOpen}
                onClose={handleModalClose}
                onSave={onAdd}
                onUpdate={onUpdate}
                item={editingItem}
            />
        </div>
    );
};
