/**
 * ProjectManager - create, rename, mark done and (guarded) delete the optional
 * project/client labels used on income and expenses.
 */

import { useState } from "react";
import toast from "react-hot-toast";
import { Check, Edit2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { FinanceProject } from "@/types/modules/finance";

type ProjectDraft = { name: string; client: string };

interface ProjectManagerProps {
    projects: FinanceProject[];
    onAddProject: (name: string, client?: string) => void;
    onUpdateProject: (
        id: string,
        updates: Partial<Pick<FinanceProject, "name" | "client" | "status">>,
    ) => void;
    onDeleteProject: (id: string) => { success: boolean; error?: string };
    /** Why a project can't be deleted (checked before asking to confirm) */
    getDeleteError: (id: string) => string | null;
}

const ProjectForm = ({
    initial,
    submitLabel,
    onSubmit,
    onCancel,
}: {
    initial: ProjectDraft;
    submitLabel: string;
    onSubmit: (draft: ProjectDraft) => void;
    onCancel: () => void;
}) => {
    const [draft, setDraft] = useState(initial);
    return (
        <div className="p-3 rounded-2xl bg-muted/30 space-y-2">
            <Input
                value={draft.name}
                onChange={(e) =>
                    setDraft((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Project name"
                aria-label="Project name"
                className="rounded-xl"
                autoFocus
            />
            <Input
                value={draft.client}
                onChange={(e) =>
                    setDraft((prev) => ({ ...prev, client: e.target.value }))
                }
                placeholder="Client (optional)"
                aria-label="Client"
                className="rounded-xl"
            />
            <div className="flex gap-2">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    className="flex-1 rounded-xl">
                    Cancel
                </Button>
                <Button
                    onClick={() => onSubmit(draft)}
                    disabled={!draft.name.trim()}
                    className="flex-1 rounded-xl">
                    {submitLabel}
                </Button>
            </div>
        </div>
    );
};

export const ProjectManager = ({
    projects,
    onAddProject,
    onUpdateProject,
    onDeleteProject,
    getDeleteError,
}: ProjectManagerProps) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleDelete = (project: FinanceProject) => {
        const blocker = getDeleteError(project.id);
        if (blocker) {
            toast.error(blocker);
            return;
        }
        if (!window.confirm(`Delete "${project.name}"?`)) return;
        const result = onDeleteProject(project.id);
        if (!result.success && result.error) toast.error(result.error);
    };

    const iconButton =
        "w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors";

    return (
        <div className="space-y-2">
            {projects.map((project) =>
                editingId === project.id ? (
                    <ProjectForm
                        key={project.id}
                        initial={{
                            name: project.name,
                            client: project.client ?? "",
                        }}
                        submitLabel="Save"
                        onSubmit={(draft) => {
                            onUpdateProject(project.id, {
                                name: draft.name.trim(),
                                client: draft.client.trim() || undefined,
                            });
                            setEditingId(null);
                        }}
                        onCancel={() => setEditingId(null)}
                    />
                ) : (
                    <div
                        key={project.id}
                        className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl bg-muted/30",
                            project.status === "done" && "opacity-60",
                        )}>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate" dir="auto">
                                {project.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {[
                                    project.client,
                                    project.status === "done" ? "Done" : null,
                                ]
                                    .filter(Boolean)
                                    .join(" · ")}
                            </p>
                        </div>
                        <button
                            onClick={() =>
                                onUpdateProject(project.id, {
                                    status:
                                        project.status === "done"
                                            ? "active"
                                            : "done",
                                })
                            }
                            title={
                                project.status === "done"
                                    ? "Mark active"
                                    : "Mark done"
                            }
                            aria-label={
                                project.status === "done"
                                    ? "Mark active"
                                    : "Mark done"
                            }
                            className={iconButton}>
                            {project.status === "done" ? (
                                <RotateCcw className="w-4 h-4" />
                            ) : (
                                <Check className="w-4 h-4" />
                            )}
                        </button>
                        <button
                            onClick={() => {
                                setIsCreating(false);
                                setEditingId(project.id);
                            }}
                            title="Edit"
                            aria-label="Edit"
                            className={iconButton}>
                            <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleDelete(project)}
                            title="Delete"
                            aria-label="Delete"
                            className={cn(iconButton, "hover:text-rose-500")}>
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ),
            )}

            {isCreating ? (
                <ProjectForm
                    initial={{ name: "", client: "" }}
                    submitLabel="Add project"
                    onSubmit={(draft) => {
                        onAddProject(draft.name, draft.client);
                        setIsCreating(false);
                    }}
                    onCancel={() => setIsCreating(false)}
                />
            ) : (
                <Button
                    variant="ghost"
                    onClick={() => {
                        setEditingId(null);
                        setIsCreating(true);
                    }}
                    className="w-full justify-start gap-3 h-auto py-3 px-3 rounded-2xl border-2 border-dashed border-muted-foreground/20 text-muted-foreground hover:border-primary/30 hover:text-primary hover:bg-primary/5">
                    <Plus className="w-5 h-5" />
                    <span className="font-medium text-sm">New project</span>
                </Button>
            )}
        </div>
    );
};
