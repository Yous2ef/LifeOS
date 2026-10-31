import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { FinanceProject } from "@/types/modules/finance";

interface ProjectPickerProps {
    projects: FinanceProject[];
    value?: string;
    onChange: (projectId: string | undefined) => void;
    onCreate: (name: string) => FinanceProject;
    /** Classes for the selected chip (each form has its own accent) */
    activeClassName?: string;
}

/** Optional project/client label: None, active projects, or a new one inline */
export const ProjectPicker = ({
    projects,
    value,
    onChange,
    onCreate,
    activeClassName = "bg-primary/20 ring-2 ring-primary",
}: ProjectPickerProps) => {
    const [isCreating, setIsCreating] = useState(false);
    const [name, setName] = useState("");
    // Done projects stay pickable only when already chosen (editing old rows)
    const shown = projects.filter(
        (project) => project.status === "active" || project.id === value,
    );

    const chip = (label: string, active: boolean, onClick: () => void) => (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "px-3 py-1.5 rounded-xl whitespace-nowrap text-sm font-medium transition-all",
                active ? activeClassName : "bg-muted/50 hover:bg-muted",
            )}>
            {label}
        </button>
    );

    const create = () => {
        if (name.trim()) onChange(onCreate(name).id);
        setName("");
        setIsCreating(false);
    };

    return (
        <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
                Project (optional)
            </Label>
            <div className="flex flex-wrap items-center gap-2 px-1">
                {chip("None", !value, () => onChange(undefined))}
                {shown.map((project) => (
                    <span key={project.id}>
                        {chip(
                            project.client
                                ? `${project.name} · ${project.client}`
                                : project.name,
                            value === project.id,
                            () => onChange(project.id),
                        )}
                    </span>
                ))}
                {isCreating ? (
                    <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") create();
                            if (e.key === "Escape") setIsCreating(false);
                        }}
                        onBlur={create}
                        placeholder="Project name"
                        aria-label="Project name"
                        className="h-8 w-40 rounded-xl text-sm"
                        autoFocus
                    />
                ) : (
                    <button
                        type="button"
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-sm text-muted-foreground border border-dashed border-muted-foreground/30 hover:text-foreground">
                        <Plus className="w-3.5 h-3.5" />
                        New project
                    </button>
                )}
            </div>
        </div>
    );
};
