import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
    Plus,
    Wrench,
    Edit,
    Trash2,
    ExternalLink,
    BookOpen,
} from "lucide-react";
import type { Tool } from "@/types/modules/programming";
import { ToolModal } from "./ToolModal";
import { getPriorityColor } from "@/utils/helpers";

interface ToolsTrackerTabProps {
    tools: Tool[];
    onAdd: (tool: Omit<Tool, "id" | "createdAt" | "updatedAt">) => void;
    onUpdate: (id: string, updates: Partial<Tool>) => void;
    onDelete: (id: string) => void;
}

export const ToolsTrackerTab = ({
    tools,
    onAdd,
    onUpdate,
    onDelete,
}: ToolsTrackerTabProps) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingTool, setEditingTool] = useState<Tool | undefined>();
    const [filter, setFilter] = useState<Tool["category"] | "all">("all");
    const [statusFilter, setStatusFilter] = useState<Tool["status"] | "all">(
        "all"
    );

    const handleEdit = (tool: Tool) => {
        setEditingTool(tool);
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setEditingTool(undefined);
    };

    const filteredTools = tools.filter((tool) => {
        if (filter !== "all" && tool.category !== filter) return false;
        if (statusFilter !== "all" && tool.status !== statusFilter)
            return false;
        return true;
    });

    const getStatusColor = (status: Tool["status"]) => {
        const colors: Record<
            Tool["status"],
            "secondary" | "outline" | "warning" | "success" | "default"
        > = {
            "to-learn": "secondary",
            learning: "warning",
            comfortable: "default",
            proficient: "success",
            mastered: "success",
        };
        return colors[status];
    };

    const getStatusLabel = (status: Tool["status"]) => {
        return status
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ");
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">
                        Tools & Technologies
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        {tools.length} tools •{" "}
                        {tools.filter((t) => t.status === "mastered").length}{" "}
                        mastered
                    </p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={filter}
                        onChange={(e) =>
                            setFilter(
                                e.target.value as Tool["category"] | "all"
                            )
                        }
                        className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                        title="Filter by category">
                        <option value="all">All Categories</option>
                        <option value="frontend">Frontend</option>
                        <option value="backend">Backend</option>
                        <option value="database">Database</option>
                        <option value="devops">DevOps</option>
                        <option value="design">Design</option>
                        <option value="testing">Testing</option>
                        <option value="other">Other</option>
                    </select>
                    <select
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(
                                e.target.value as Tool["status"] | "all"
                            )
                        }
                        className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                        title="Filter by status">
                        <option value="all">All Status</option>
                        <option value="to-learn">To Learn</option>
                        <option value="learning">Learning</option>
                        <option value="comfortable">Comfortable</option>
                        <option value="proficient">Proficient</option>
                        <option value="mastered">Mastered</option>
                    </select>
                    <Button
                        onClick={() => setModalOpen(true)}
                        className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Tool
                    </Button>
                </div>
            </div>

            {/* Tools Grid */}
            {filteredTools.length === 0 ? (
                <div className="text-center py-12">
                    <Wrench className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">
                        {filter === "all" && statusFilter === "all"
                            ? "No tools tracked yet"
                            : "No tools match your filters"}
                    </p>
                    <Button onClick={() => setModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Tool
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTools.map((tool) => (
                        <Card
                            key={tool.id}
                            className="overflow-hidden hover:shadow-lg transition-all">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Wrench className="h-4 w-4" />
                                            <CardTitle className="text-base">
                                                {tool.name}
                                            </CardTitle>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge
                                                variant="outline"
                                                className="text-xs">
                                                {tool.category}
                                            </Badge>
                                            <Badge
                                                variant={getStatusColor(
                                                    tool.status
                                                )}
                                                className="text-xs">
                                                {getStatusLabel(tool.status)}
                                            </Badge>
                                            <Badge
                                                variant={getPriorityColor(
                                                    tool.priority
                                                )}
                                                className="text-xs">
                                                P{tool.priority}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(tool)}
                                            className="h-8 w-8 p-0">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onDelete(tool.id)}
                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {tool.version && (
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">
                                            Version:
                                        </span>
                                        <span className="font-medium">
                                            {tool.version}
                                        </span>
                                    </div>
                                )}

                                {tool.documentation && (
                                    <a
                                        href={tool.documentation}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-primary hover:underline">
                                        <BookOpen className="h-3 w-3" />
                                        Documentation
                                        <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}

                                {tool.learningResources.length > 0 && (
                                    <div>
                                        <div className="text-xs text-muted-foreground mb-1">
                                            Learning Resources (
                                            {tool.learningResources.length})
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {tool.learningResources
                                                .slice(0, 3)
                                                .map((resource, index) => (
                                                    <a
                                                        key={index}
                                                        href={resource}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary hover:underline flex items-center gap-1">
                                                        <ExternalLink className="h-2 w-2" />
                                                        Link {index + 1}
                                                    </a>
                                                ))}
                                            {tool.learningResources.length >
                                                3 && (
                                                <span className="text-xs text-muted-foreground">
                                                    +
                                                    {tool.learningResources
                                                        .length - 3}{" "}
                                                    more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {tool.notes && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 pt-2 border-t border-border">
                                        {tool.notes}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Modal */}
            <ToolModal
                isOpen={modalOpen}
                onClose={handleModalClose}
                onSave={onAdd}
                onUpdate={onUpdate}
                tool={editingTool}
            />
        </div>
    );
};
