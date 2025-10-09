// Migration utility to fix projects with invalid status values

import type { Project } from "@/types/freelancing";

const PROJECTS_KEY = "lifeos-freelancing-projects";

export const migrateProjectStatuses = () => {
    const stored = localStorage.getItem(PROJECTS_KEY);

    if (!stored) {
        console.log("No projects to migrate");
        return;
    }

    try {
        const projects: Project[] = JSON.parse(stored);
        let migrated = false;

        const fixedProjects = projects.map((project) => {
            // Check if status is not one of the valid values
            if (!["todo", "inProgress", "done"].includes(project.status)) {
                console.log(
                    `Fixing project "${project.name}" - invalid status: ${project.status}`
                );
                migrated = true;
                return {
                    ...project,
                    status: "todo" as const, // Default to "todo"
                };
            }
            return project;
        });

        if (migrated) {
            localStorage.setItem(PROJECTS_KEY, JSON.stringify(fixedProjects));
            console.log("✅ Projects migrated successfully!");
            console.log("Fixed projects:", fixedProjects);
        } else {
            console.log("All projects have valid status values");
        }
    } catch (error) {
        console.error("Failed to migrate projects:", error);
    }
};
