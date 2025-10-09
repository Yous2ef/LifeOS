import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/Button";
import { Plus, BookOpen, TrendingUp, Wrench, Code2 } from "lucide-react";
import { useProgramming } from "@/hooks/useProgramming";
import { ProgrammingStatsCards } from "@/components/programming/ProgrammingStatsCards";
import { LearningItemsTab } from "@/components/programming/LearningItemsTab";
import { SkillsTrackerTab } from "@/components/programming/SkillsTrackerTab";
import { ToolsTrackerTab } from "@/components/programming/ToolsTrackerTab";
import { ProjectsKanbanTab } from "@/components/programming/ProjectsKanbanTab";

export const Programming: React.FC = () => {
    const [activeTab, setActiveTab] = useState("learning");
    const {
        learningItems,
        skills,
        tools,
        projects,
        addLearningItem,
        updateLearningItem,
        deleteLearningItem,
        addSkill,
        updateSkill,
        deleteSkill,
        addTool,
        updateTool,
        deleteTool,
        addProject,
        updateProject,
        deleteProject,
        getStats,
    } = useProgramming();

    const stats = getStats();

    return (
        <div className="space-y-6 animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-bold mb-2 gradient-text">
                        Programming & Learning
                    </h1>
                    <p className="text-muted-foreground">
                        Track your professional development and coding journey
                    </p>
                </div>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Quick Add
                </Button>
            </div>

            {/* Stats Cards */}
            <ProgrammingStatsCards stats={stats} />

            {/* Main Content Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="learning" className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        <span className="hidden sm:inline">Learning</span>
                        <span className="sm:hidden">Learn</span>
                        <span>({learningItems.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="skills" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <span className="hidden sm:inline">Skills</span>
                        <span className="sm:hidden">Skill</span>
                        <span>({skills.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="tools" className="gap-2">
                        <Wrench className="h-4 w-4" />
                        <span className="hidden sm:inline">Tools</span>
                        <span className="sm:hidden">Tool</span>
                        <span>({tools.length})</span>
                    </TabsTrigger>
                    <TabsTrigger value="projects" className="gap-2">
                        <Code2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Projects</span>
                        <span className="sm:hidden">Proj</span>
                        <span>({projects.length})</span>
                    </TabsTrigger>
                </TabsList>

                {/* Learning Items Tab */}
                <TabsContent value="learning" className="space-y-4">
                    <LearningItemsTab
                        items={learningItems}
                        onAdd={addLearningItem}
                        onUpdate={updateLearningItem}
                        onDelete={deleteLearningItem}
                    />
                </TabsContent>

                {/* Skills Tab */}
                <TabsContent value="skills" className="space-y-4">
                    <SkillsTrackerTab
                        skills={skills}
                        onAdd={addSkill}
                        onUpdate={updateSkill}
                        onDelete={deleteSkill}
                    />
                </TabsContent>

                {/* Tools Tab */}
                <TabsContent value="tools" className="space-y-4">
                    <ToolsTrackerTab
                        tools={tools}
                        onAdd={addTool}
                        onUpdate={updateTool}
                        onDelete={deleteTool}
                    />
                </TabsContent>

                {/* Projects Tab */}
                <TabsContent value="projects" className="space-y-4">
                    <ProjectsKanbanTab
                        projects={projects}
                        onAdd={addProject}
                        onUpdate={updateProject}
                        onDelete={deleteProject}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
};
