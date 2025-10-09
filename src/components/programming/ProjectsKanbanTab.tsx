import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Plus, Code2, ExternalLink, Github, Eye } from "lucide-react";
import { KanbanBoard, KanbanCard } from "@/components/common";
import type { KanbanCardBadge, KanbanCardAction } from "@/components/common";
import type { CodingProject } from "@/types/programming";
import { ProjectModal } from "./ProjectModal";
import { getPriorityColor, formatDate } from "@/utils/helpers";
import Confetti from "react-confetti";
import { useWindowSize } from "@/hooks/useWindowSize";

interface ProjectsKanbanTabProps {
    projects: CodingProject[];
    onAdd: (
        project: Omit<CodingProject, "id" | "createdAt" | "updatedAt">
    ) => void;
    onUpdate: (id: string, updates: Partial<CodingProject>) => void;
    onDelete: (id: string) => void;
}

export const ProjectsKanbanTab = ({
    projects,
    onAdd,
    onUpdate,
    onDelete,
}: ProjectsKanbanTabProps) => {
    const navigate = useNavigate();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState<
        CodingProject | undefined
    >();
    const [showConfetti, setShowConfetti] = useState(false);
    const { width, height } = useWindowSize();

    const handleEdit = (project: CodingProject) => {
        setEditingProject(project);
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setEditingProject(undefined);
    };

    const handleUpdateStatus = (
        projectId: string,
        newStatus: CodingProject["status"]
    ) => {
        const project = projects.find((p) => p.id === projectId);

        // Show confetti when marking as completed
        if (newStatus === "completed" && project?.status !== "completed") {
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);
        }

        onUpdate(projectId, { status: newStatus });
    };

    const getProjectBadges = (project: CodingProject): KanbanCardBadge[] => {
        const badges: KanbanCardBadge[] = [];

        badges.push({
            label: `Priority ${project.priority}`,
            variant: getPriorityColor(project.priority),
        });

        badges.push({
            label: project.type.charAt(0).toUpperCase() + project.type.slice(1),
            variant: "outline",
        });

        if (project.dueDate) {
            badges.push({
                label: formatDate(project.dueDate),
                variant: "outline",
            });
        }

        return badges;
    };

    const getProjectActions = (project: CodingProject): KanbanCardAction[] => {
        const actions: KanbanCardAction[] = [];

        actions.push({
            label: "View Details",
            icon: <Eye className="h-4 w-4" />,
            onClick: () => navigate(`/programming/project/${project.id}`),
        });

        if (project.repositoryUrl) {
            actions.push({
                label: "View Repository",
                icon: <Github className="h-4 w-4" />,
                onClick: () => window.open(project.repositoryUrl, "_blank"),
            });
        }

        if (project.liveUrl) {
            actions.push({
                label: "View Live",
                icon: <ExternalLink className="h-4 w-4" />,
                onClick: () => window.open(project.liveUrl, "_blank"),
            });
        }

        actions.push({
            label: "Edit",
            onClick: () => handleEdit(project),
        });

        actions.push({
            label: "Delete",
            onClick: () => onDelete(project.id),
            variant: "destructive",
            separator: true,
        });

        return actions;
    };

    const kanbanColumns = [
        {
            id: "to-do",
            title: "To Do",
            items: projects.filter((p) => p.status === "to-do"),
            color: "from-blue-500 to-cyan-500",
        },
        {
            id: "in-progress",
            title: "In Progress",
            items: projects.filter((p) => p.status === "in-progress"),
            color: "from-yellow-500 to-orange-500",
        },
        {
            id: "completed",
            title: "Completed",
            items: projects.filter((p) => p.status === "completed"),
            color: "from-green-500 to-emerald-500",
        },
    ];

    return (
        <div className="space-y-4">
            {/* Confetti */}
            {showConfetti && (
                <Confetti
                    width={width}
                    height={height}
                    recycle={false}
                    numberOfPieces={500}
                    gravity={0.3}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Coding Projects</h3>
                    <p className="text-sm text-muted-foreground">
                        {projects.length} projects •{" "}
                        {
                            projects.filter((p) => p.status === "completed")
                                .length
                        }{" "}
                        completed
                    </p>
                </div>
                <Button onClick={() => setModalOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    New Project
                </Button>
            </div>

            {/* Kanban Board */}
            {projects.length === 0 ? (
                <div className="text-center py-12">
                    <Code2 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">
                        No coding projects yet
                    </p>
                    <Button onClick={() => setModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Project
                    </Button>
                </div>
            ) : (
                <KanbanBoard
                    columns={kanbanColumns}
                    getItemId={(project) => project.id}
                    onDragEnd={(projectId, newColumnId) => {
                        handleUpdateStatus(
                            projectId,
                            newColumnId as CodingProject["status"]
                        );
                    }}
                    renderItem={(project) => (
                        <KanbanCard
                            id={project.id}
                            title={project.title}
                            description={project.description}
                            badges={getProjectBadges(project)}
                            actions={getProjectActions(project)}>
                            <div className="space-y-2">
                                {project.technologies.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {project.technologies
                                            .slice(0, 5)
                                            .map((tech) => (
                                                <span
                                                    key={tech}
                                                    className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                                    {tech}
                                                </span>
                                            ))}
                                        {project.technologies.length > 5 && (
                                            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                                                +
                                                {project.technologies.length -
                                                    5}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {project.tasks && project.tasks.length > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                        {
                                            project.tasks.filter(
                                                (t) => t.completed
                                            ).length
                                        }
                                        /{project.tasks.length} tasks completed
                                    </div>
                                )}

                                {project.actualHours > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                        {project.actualHours}h spent
                                        {project.estimatedHours &&
                                            ` / ${project.estimatedHours}h estimated`}
                                    </div>
                                )}
                            </div>
                        </KanbanCard>
                    )}
                    dragOverlay={(project) => (
                        <KanbanCard
                            id={project.id}
                            title={project.title}
                            description={project.description}
                            badges={getProjectBadges(project)}
                            actions={[]}
                        />
                    )}
                />
            )}

            {/* Modal */}
            <ProjectModal
                isOpen={modalOpen}
                onClose={handleModalClose}
                onSave={onAdd}
                onUpdate={onUpdate}
                project={editingProject}
            />
        </div>
    );
};
