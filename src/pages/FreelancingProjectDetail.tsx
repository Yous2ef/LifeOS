import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ProjectDetail } from "@/components/freelancing/ProjectDetail";
import type { Project } from "@/types/freelancing";
import toast from "react-hot-toast";

const PROJECTS_KEY = "lifeos-freelancing-projects";

export const FreelancingProjectDetail = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    // Load project directly from localStorage
    useEffect(() => {
        if (!projectId) {
            setLoading(false);
            return;
        }

        const stored = localStorage.getItem(PROJECTS_KEY);
        if (stored) {
            try {
                const projects: Project[] = JSON.parse(stored);
                const foundProject = projects.find((p) => p.id === projectId);
                setProject(foundProject || null);
            } catch (error) {
                console.error("Failed to load project:", error);
                setProject(null);
            }
        }
        setLoading(false);
    }, [projectId]);

    const updateProject = (updates: Partial<Project>) => {
        if (!project) return;

        const stored = localStorage.getItem(PROJECTS_KEY);
        if (stored) {
            try {
                const projects: Project[] = JSON.parse(stored);
                const updatedProjects = projects.map((p) =>
                    p.id === project.id
                        ? {
                              ...p,
                              ...updates,
                              updatedAt: new Date().toISOString(),
                          }
                        : p
                );
                localStorage.setItem(
                    PROJECTS_KEY,
                    JSON.stringify(updatedProjects)
                );
                setProject({
                    ...project,
                    ...updates,
                    updatedAt: new Date().toISOString(),
                });
            } catch (error) {
                console.error("Failed to update project:", error);
            }
        }
    };

    const deleteProject = () => {
        if (!project) return;

        const stored = localStorage.getItem(PROJECTS_KEY);
        if (stored) {
            try {
                const projects: Project[] = JSON.parse(stored);
                const filteredProjects = projects.filter(
                    (p) => p.id !== project.id
                );
                localStorage.setItem(
                    PROJECTS_KEY,
                    JSON.stringify(filteredProjects)
                );
            } catch (error) {
                console.error("Failed to delete project:", error);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <p className="text-muted-foreground">Loading project...</p>
            </div>
        );
    }

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
                updateProject(updates);
                toast.success("Project updated successfully");
            }}
            onDelete={() => {
                deleteProject();
                toast.success("Project deleted");
                navigate("/freelancing");
            }}
        />
    );
};
