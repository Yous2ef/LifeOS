import React from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Clock, Briefcase, Code2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/progress";
import type { DashboardStats } from "@/types/dashboard";

interface StatsCardsProps {
    stats: DashboardStats;
}

export const StatsCards = React.memo(({ stats }: StatsCardsProps) => {
    const navigate = useNavigate();

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/university")}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        University Tasks
                    </CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.universityTasksCompleted}/
                        {stats.universityTasksTotal}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        {stats.completionRate}% completion rate
                    </p>
                    <Progress value={stats.completionRate} className="mt-2" />
                </CardContent>
            </Card>

            <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate("/university")}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Due Today
                    </CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{stats.todayTasks}</div>
                    <p className="text-xs text-muted-foreground">
                        {stats.todayTasks === 0
                            ? "All clear! 🎉"
                            : "Focus on these first"}
                    </p>
                    {stats.upcomingExams > 0 && (
                        <p className="text-xs text-destructive mt-1">
                            {stats.upcomingExams} exam(s) this week
                        </p>
                    )}
                    <Progress
                        value={stats.todayTasks > 0 ? 100 : 0}
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
                        Freelancing Tasks
                    </CardTitle>
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.activeProjects}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Active projects
                    </p>
                    {stats.totalRevenue > 0 && (
                        <p className="text-xs text-green-600 mt-1">
                            ${stats.totalRevenue.toLocaleString()} earned
                        </p>
                    )}
                    <Progress
                        value={
                            stats.completedProjects > 0
                                ? Math.round(
                                      (stats.completedProjects /
                                          (stats.activeProjects +
                                              stats.completedProjects)) *
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
                onClick={() => navigate("/programming")}
            >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Learning
                    </CardTitle>
                    <Code2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {stats.learningInProgress}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Resources in progress
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {stats.programmingProjects} active projects
                    </p>
                    <Progress
                        value={
                            stats.learningCompleted > 0
                                ? Math.round(
                                      (stats.learningCompleted /
                                          (stats.learningInProgress +
                                              stats.learningCompleted)) *
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
