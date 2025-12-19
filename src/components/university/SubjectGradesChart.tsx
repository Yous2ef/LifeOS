import React, { useMemo } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { BarChart2 } from "lucide-react";
import type { Exam, GradeEntry } from "@/types";

interface SubjectGradesChartProps {
    exams: Exam[];
    gradeEntries: GradeEntry[];
    subjectColor: string;
}

interface ChartDataItem {
    name: string;
    earned: number;
    max: number;
    percentage: number;
    type: "exam" | "entry";
}

export const SubjectGradesChart: React.FC<SubjectGradesChartProps> = ({
    exams,
    gradeEntries,
}) => {
    const chartData = useMemo(() => {
        const data: ChartDataItem[] = [];

        // Add graded exams
        exams
            .filter((e) => e.taken && e.grade !== undefined && e.grade !== null)
            .forEach((exam) => {
                data.push({
                    name:
                        exam.title.length > 15
                            ? exam.title.substring(0, 15) + "..."
                            : exam.title,
                    earned: exam.grade || 0,
                    max: exam.maxGrade || 100,
                    percentage:
                        ((exam.grade || 0) / (exam.maxGrade || 100)) * 100,
                    type: "exam",
                });
            });

        // Add grade entries (excluding bonus/deduction)
        gradeEntries
            .filter(
                (e) =>
                    e.type !== "bonus" && e.type !== "deduction" && e.maxPoints
            )
            .forEach((entry) => {
                data.push({
                    name:
                        entry.title.length > 15
                            ? entry.title.substring(0, 15) + "..."
                            : entry.title,
                    earned: entry.pointsEarned,
                    max: entry.maxPoints || 10,
                    percentage:
                        (entry.pointsEarned / (entry.maxPoints || 10)) * 100,
                    type: "entry",
                });
            });

        return data;
    }, [exams, gradeEntries]);

    const getBarColor = (percentage: number) => {
        if (percentage >= 90) return "#22c55e"; // green
        if (percentage >= 80) return "#10b981"; // emerald
        if (percentage >= 70) return "#3b82f6"; // blue
        if (percentage >= 60) return "#eab308"; // yellow
        if (percentage >= 50) return "#f97316"; // orange
        return "#ef4444"; // red
    };

    if (chartData.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart2 className="w-5 h-5" />
                        Performance Chart
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                        No graded items yet. Add grades to see your performance
                        chart.
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart2 className="w-5 h-5" />
                    Performance Chart
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 60,
                            }}>
                            <CartesianGrid
                                strokeDasharray="3 3"
                                opacity={0.3}
                            />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 12 }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                            />
                            <YAxis
                                domain={[0, 100]}
                                tickFormatter={(value) => `${value}%`}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0]
                                            .payload as ChartDataItem;
                                        return (
                                            <div className="bg-background border rounded-lg p-3 shadow-lg">
                                                <p className="font-medium">
                                                    {data.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Score: {data.earned} /{" "}
                                                    {data.max}
                                                </p>
                                                <p className="text-sm font-medium">
                                                    Percentage:{" "}
                                                    {data.percentage.toFixed(1)}
                                                    %
                                                </p>
                                                <p className="text-xs text-muted-foreground capitalize">
                                                    Type: {data.type}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={getBarColor(entry.percentage)}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                        <span>90%+ Excellent</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>70-89% Good</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <span>60-69% Pass</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <span>&lt;60% Needs Work</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
