import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/progress";
import {
    BookOpen,
    TrendingUp,
    Code2,
    Wrench,
    Clock,
    Target,
    CheckCircle2,
    Zap,
} from "lucide-react";
import type { ProgrammingStats } from "@/types/programming";
import { formatMinutesToTime } from "@/utils/helpers";

interface ProgrammingStatsProps {
    stats: ProgrammingStats;
}

export const ProgrammingStatsCards = ({ stats }: ProgrammingStatsProps) => {
    const statCards = [
        {
            title: "Learning Items",
            value: stats.totalLearningItems,
            subtitle: `${stats.completedLearningItems} completed`,
            icon: <BookOpen className="h-5 w-5" />,
            color: "from-blue-500 to-cyan-500",
            progress: stats.completionRate,
        },
        {
            title: "Skills",
            value: stats.totalSkills,
            subtitle: `${Math.round(stats.averageSkillLevel)}% avg level`,
            icon: <TrendingUp className="h-5 w-5" />,
            color: "from-green-500 to-emerald-500",
            progress: stats.averageSkillLevel,
        },
        {
            title: "Tools",
            value: stats.totalTools,
            subtitle: `${stats.masteredTools} mastered`,
            icon: <Wrench className="h-5 w-5" />,
            color: "from-purple-500 to-pink-500",
            progress:
                stats.totalTools > 0
                    ? (stats.masteredTools / stats.totalTools) * 100
                    : 0,
        },
        {
            title: "Projects",
            value: stats.totalProjects,
            subtitle: `${stats.completedProjects} completed`,
            icon: <Code2 className="h-5 w-5" />,
            color: "from-orange-500 to-red-500",
            progress:
                stats.totalProjects > 0
                    ? (stats.completedProjects / stats.totalProjects) * 100
                    : 0,
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, index) => (
                <Card
                    key={card.title}
                    className="overflow-hidden hover:shadow-lg transition-shadow duration-300 animate-fadeIn"
                    style={{ animationDelay: `${index * 100}ms` }}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {card.title}
                            </CardTitle>
                            <div
                                className={`p-2 rounded-lg bg-gradient-to-r ${card.color} bg-opacity-10`}>
                                {card.icon}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold">
                                    {card.value}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    {card.subtitle}
                                </span>
                            </div>
                            <Progress value={card.progress} className="h-2" />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};
