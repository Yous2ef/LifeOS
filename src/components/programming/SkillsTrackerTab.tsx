import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/Badge";
import { Plus, TrendingUp, Edit, Trash2, Target } from "lucide-react";
import type { Skill } from "@/types/programming";
import { SkillModal } from "./SkillModal";
import { getPriorityColor } from "@/utils/helpers";

interface SkillsTrackerTabProps {
    skills: Skill[];
    onAdd: (skill: Omit<Skill, "id" | "createdAt" | "updatedAt">) => void;
    onUpdate: (id: string, updates: Partial<Skill>) => void;
    onDelete: (id: string) => void;
}

export const SkillsTrackerTab = ({
    skills,
    onAdd,
    onUpdate,
    onDelete,
}: SkillsTrackerTabProps) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [editingSkill, setEditingSkill] = useState<Skill | undefined>();
    const [filter, setFilter] = useState<Skill["category"] | "all">("all");

    const handleEdit = (skill: Skill) => {
        setEditingSkill(skill);
        setModalOpen(true);
    };

    const handleModalClose = () => {
        setModalOpen(false);
        setEditingSkill(undefined);
    };

    const filteredSkills =
        filter === "all" ? skills : skills.filter((s) => s.category === filter);

    const getCategoryColor = (category: Skill["category"]) => {
        const colors: Record<Skill["category"], string> = {
            frontend: "from-blue-500 to-cyan-500",
            backend: "from-green-500 to-emerald-500",
            database: "from-purple-500 to-pink-500",
            devops: "from-orange-500 to-red-500",
            design: "from-pink-500 to-rose-500",
            "soft-skills": "from-yellow-500 to-amber-500",
            other: "from-gray-500 to-slate-500",
        };
        return colors[category];
    };

    const getProgressStatus = (current: number, target: number) => {
        const percentage = (current / target) * 100;
        if (percentage >= 100)
            return { text: "Target Reached!", color: "text-green-500" };
        if (percentage >= 75)
            return { text: "Almost There", color: "text-blue-500" };
        if (percentage >= 50)
            return { text: "Making Progress", color: "text-yellow-500" };
        return { text: "Getting Started", color: "text-gray-500" };
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Skills Tracker</h3>
                    <p className="text-sm text-muted-foreground">
                        {skills.length} skills • Average level:{" "}
                        {skills.length > 0
                            ? Math.round(
                                  skills.reduce(
                                      (sum, s) => sum + s.currentLevel,
                                      0
                                  ) / skills.length
                              )
                            : 0}
                        %
                    </p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={filter}
                        onChange={(e) =>
                            setFilter(
                                e.target.value as Skill["category"] | "all"
                            )
                        }
                        className="px-3 py-2 rounded-md border border-input bg-background text-sm">
                        <option value="all">All Categories</option>
                        <option value="frontend">Frontend</option>
                        <option value="backend">Backend</option>
                        <option value="database">Database</option>
                        <option value="devops">DevOps</option>
                        <option value="design">Design</option>
                        <option value="soft-skills">Soft Skills</option>
                        <option value="other">Other</option>
                    </select>
                    <Button
                        onClick={() => setModalOpen(true)}
                        className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Skill
                    </Button>
                </div>
            </div>

            {/* Skills Grid */}
            {filteredSkills.length === 0 ? (
                <div className="text-center py-12">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground mb-4">
                        {filter === "all"
                            ? "No skills tracked yet"
                            : `No ${filter} skills found`}
                    </p>
                    <Button onClick={() => setModalOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Skill
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSkills.map((skill) => {
                        const status = getProgressStatus(
                            skill.currentLevel,
                            skill.targetLevel
                        );
                        return (
                            <Card
                                key={skill.id}
                                className="overflow-hidden hover:shadow-lg transition-all">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-base mb-1">
                                                {skill.name}
                                            </CardTitle>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs">
                                                    {skill.category.replace(
                                                        "-",
                                                        " "
                                                    )}
                                                </Badge>
                                                <Badge
                                                    variant={getPriorityColor(
                                                        skill.priority
                                                    )}
                                                    className="text-xs">
                                                    Priority {skill.priority}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    handleEdit(skill)
                                                }
                                                className="h-8 w-8 p-0">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    onDelete(skill.id)
                                                }
                                                className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-muted-foreground">
                                                Current Level
                                            </span>
                                            <span className="font-semibold">
                                                {skill.currentLevel}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={skill.currentLevel}
                                            className="h-2"
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-muted-foreground flex items-center gap-1">
                                                <Target className="h-3 w-3" />
                                                Target Level
                                            </span>
                                            <span className="font-semibold">
                                                {skill.targetLevel}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={skill.targetLevel}
                                            className="h-2 opacity-50"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between pt-2 border-t border-border">
                                        <span
                                            className={`text-xs font-medium ${status.color}`}>
                                            {status.text}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {Math.round(
                                                (skill.currentLevel /
                                                    skill.targetLevel) *
                                                    100
                                            )}
                                            % to goal
                                        </span>
                                    </div>

                                    {skill.notes && (
                                        <p className="text-xs text-muted-foreground line-clamp-2 pt-2">
                                            {skill.notes}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            <SkillModal
                isOpen={modalOpen}
                onClose={handleModalClose}
                onSave={onAdd}
                onUpdate={onUpdate}
                skill={editingSkill}
            />
        </div>
    );
};
