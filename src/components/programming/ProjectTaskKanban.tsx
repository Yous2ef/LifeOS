import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Edit, Trash2, Clock, Play } from "lucide-react";
import type { ProjectTask } from "@/types/programming";
import { getPriorityColor } from "@/utils/helpers";
import { cn } from "@/lib/utils";
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    type DragStartEvent,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

interface ProjectTaskKanbanProps {
    tasks: ProjectTask[];
    onEditTask: (task: ProjectTask) => void;
    onDeleteTask: (taskId: string) => void;
    onUpdateTask: (taskId: string, updates: Partial<ProjectTask>) => void;
    onTrackTime: (task: ProjectTask) => void;
}

interface TaskCardProps {
    task: ProjectTask;
    onEdit: () => void;
    onDelete: () => void;
    onTrackTime: () => void;
}

interface DroppableColumnProps {
    id: string;
    title: string;
    color: string;
    tasks: ProjectTask[];
    children: React.ReactNode;
}

const DroppableColumn = ({
    id,
    title,
    color,
    tasks,
    children,
}: DroppableColumnProps) => {
    const { setNodeRef, isOver } = useDroppable({
        id: id,
    });

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <div
                        className={`h-2 w-2 rounded-full bg-gradient-to-r ${color}`}
                    />
                    {title}
                </h3>
                <span className="text-sm text-muted-foreground">
                    {tasks.length}
                </span>
            </div>

            <div
                ref={setNodeRef}
                className={cn(
                    "space-y-3 min-h-[200px] p-3 rounded-lg border-2 border-dashed transition-colors",
                    isOver
                        ? "bg-primary/10 border-primary"
                        : "bg-muted/30 border-border"
                )}>
                {children}
            </div>
        </div>
    );
};

const TaskCard = ({ task, onEdit, onDelete, onTrackTime }: TaskCardProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    const hours = Math.floor(task.actualMinutes / 60);
    const minutes = task.actualMinutes % 60;

    return (
        <Card
            ref={setNodeRef}
            style={style}
            {...attributes}
            className={cn(
                "p-4 hover:shadow-md transition-shadow",
                isDragging && "opacity-50"
            )}>
            <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                    <h4
                        {...listeners}
                        className="font-medium text-foreground flex-1 cursor-move">
                        {task.title}
                    </h4>
                    <Badge
                        variant={getPriorityColor(task.priority)}
                        className="text-xs">
                        P{task.priority}
                    </Badge>
                </div>

                {task.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {task.description}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {task.estimatedMinutes && (
                        <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Est: {Math.floor(task.estimatedMinutes / 60)}h{" "}
                            {task.estimatedMinutes % 60}m
                        </span>
                    )}
                    {task.actualMinutes > 0 && (
                        <span className="flex items-center gap-1 text-primary font-medium">
                            <Play className="h-3 w-3" />
                            {hours > 0 && `${hours}h `}
                            {minutes}m
                        </span>
                    )}
                    {task.timeEntries.length > 0 && (
                        <span>• {task.timeEntries.length} sessions</span>
                    )}
                </div>

                <div className="flex items-center gap-1 pt-2 border-t">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onTrackTime();
                        }}
                        className="h-7 px-2 text-xs flex-1">
                        <Clock className="h-3 w-3 mr-1" />
                        Track Time
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit();
                        }}
                        className="h-7 px-2">
                        <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                        }}
                        className="h-7 px-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </Card>
    );
};

export const ProjectTaskKanban = ({
    tasks,
    onEditTask,
    onDeleteTask,
    onUpdateTask,
    onTrackTime,
}: ProjectTaskKanbanProps) => {
    const [activeTask, setActiveTask] = useState<ProjectTask | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const columns = [
        { id: "todo", title: "To Do", color: "from-blue-500 to-cyan-500" },
        {
            id: "in-progress",
            title: "In Progress",
            color: "from-yellow-500 to-orange-500",
        },
        { id: "done", title: "Done", color: "from-green-500 to-emerald-500" },
    ];

    const getTasksByStatus = (status: string) => {
        return tasks.filter((task) => task.status === status);
    };

    const handleDragStart = (event: DragStartEvent) => {
        const task = tasks.find((t) => t.id === event.active.id);
        setActiveTask(task || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeTask = tasks.find((t) => t.id === active.id);
        if (!activeTask) return;

        // Check if dropped on a column container
        const overId = over.id.toString();
        const newStatus = columns.find((col) => col.id === overId)?.id;

        if (newStatus && newStatus !== activeTask.status) {
            onUpdateTask(activeTask.id, {
                status: newStatus as ProjectTask["status"],
                completed: newStatus === "done",
                completedAt:
                    newStatus === "done" ? new Date().toISOString() : undefined,
            });
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {columns.map((column) => {
                    const columnTasks = getTasksByStatus(column.id);
                    return (
                        <DroppableColumn
                            key={column.id}
                            id={column.id}
                            title={column.title}
                            color={column.color}
                            tasks={columnTasks}>
                            <SortableContext
                                items={columnTasks.map((t) => t.id)}
                                strategy={verticalListSortingStrategy}>
                                {columnTasks.length === 0 ? (
                                    <div className="text-center py-8 text-sm text-muted-foreground">
                                        No tasks
                                    </div>
                                ) : (
                                    columnTasks.map((task) => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            onEdit={() => onEditTask(task)}
                                            onDelete={() =>
                                                onDeleteTask(task.id)
                                            }
                                            onTrackTime={() =>
                                                onTrackTime(task)
                                            }
                                        />
                                    ))
                                )}
                            </SortableContext>
                        </DroppableColumn>
                    );
                })}
            </div>

            <DragOverlay>
                {activeTask ? (
                    <Card className="p-4 shadow-lg opacity-90">
                        <div className="font-medium text-foreground">
                            {activeTask.title}
                        </div>
                    </Card>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};
