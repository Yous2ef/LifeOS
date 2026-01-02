import React from "react";
import { useNavigate } from "react-router-dom";
import { Home as HomeIcon, Zap, Target, BookOpen } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/progress";
import type { DashboardStats } from "@/types/dashboard";

interface AdditionalStatsProps {
    stats: DashboardStats;
}

export const AdditionalStats = React.memo(({ stats }: AdditionalStatsProps) => {
    const navigate = useNavigate();

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/home")}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Home & Life
                    </CardTitle>
                    <HomeIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.homeTasksActive}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Active tasks
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{stats.activeGoals} goals</span>
                        <span>•</span>
                        <span>{stats.activeHabits} habits</span>
                    </div>
                    <Progress
                        value={stats.activeGoals > 0 ? 50 : 0}
                        className="mt-2"
                    />
                </CardContent>
            </Card>

            <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/programming")}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Skills & Tech
                    </CardTitle>
                    <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.totalSkills}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Skills tracked
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {stats.learningCompleted} resources completed
                    </p>
                    <Progress
                        value={
                            stats.totalSkills > 0
                                ? Math.min(
                                      (stats.totalSkills / 10) * 100,
                                      100
                                  )
                                : 0
                        }
                        className="mt-2"
                    />
                </CardContent>
            </Card>

            <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/freelancing")}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Freelancing Projects
                    </CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.totalFreelancingProjects}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Total projects
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {stats.completedProjects} completed •{" "}
                        {stats.activeProjects} active
                    </p>
                    <Progress
                        value={
                            stats.totalFreelancingProjects > 0
                                ? Math.round(
                                      (stats.completedProjects /
                                          stats.totalFreelancingProjects) *
                                          100
                                  )
                                : 0
                        }
                        className="mt-2"
                    />
                </CardContent>
            </Card>

            <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/misc")}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Quick Notes
                    </CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.totalNotes}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Notes saved
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{stats.totalBookmarks} bookmarks</span>
                        <span>•</span>
                        <span>{stats.quickCaptures} captures</span>
                    </div>
                    <Progress
                        value={
                            stats.totalNotes > 0
                                ? Math.min(
                                      (stats.totalNotes / 20) * 100,
                                      100
                                  )
                                : 0
                        }
                        className="mt-2"
                    />
                </CardContent>
            </Card>
        </div>
    );
});
