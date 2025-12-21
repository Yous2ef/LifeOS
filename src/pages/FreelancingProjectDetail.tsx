import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProjectDetail } from "@/components/freelancing/ProjectDetail";
import { useFreelancingProjects } from "@/hooks/useFreelancing";
import type { Project } from "@/types/modules/freelancing";
import toast from "react-hot-toast";

export const FreelancingProjectDetail = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const {
        projects,
        updateProject: updateProjectInStore,
        deleteProject: deleteProjectFromStore,
    } = useFreelancingProjects();

    // Find the project from the unified data store
    const project = useMemo(() => {
        if (!projectId) return null;
        return projects.find((p) => p.id === projectId) || null;
    }, [projects, projectId]);

    const handleUpdateProject = (updates: Partial<Project>) => {
        if (!project) return;
        updateProjectInStore(project.id, updates);
    };

    const handleDeleteProject = () => {
        if (!project) return;
        deleteProjectFromStore(project.id);
    };

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                    Project Not Found
                </h2>
                <p className="text-muted-foreground mb-6">
                    The project you're looking for doesn't exist.
                </p>
                <button
                    onClick={() => navigate("/freelancing")}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                    Back to Freelancing
                </button>
            </div>
        );
    }

    return (
        <ProjectDetail
            project={project}
            onBack={() => navigate("/freelancing")}
            onUpdate={(updates) => {
                handleUpdateProject(updates);
                toast.success("Project updated successfully");
            }}
            onDelete={() => {
                handleDeleteProject();
                toast.success("Project deleted");
                navigate("/freelancing");
            }}
        />
    );
};
