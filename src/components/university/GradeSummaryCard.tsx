import React from "react";
import { Award, TrendingUp, Target, Calculator } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Exam, GradeEntry, Subject } from "@/types";

interface GradeSummaryCardProps {
    subject: Subject;
    exams: Exam[];
    gradeEntries: GradeEntry[];
}

export interface GradeCalculation {
    totalEarned: number;
    totalPossible: number;
    percentage: number;
    examGrades: { earned: number; possible: number };
    entryGrades: { earned: number; possible: number };
    bonusPoints: number;
    deductions: number;
}

export const calculateGrades = (
    exams: Exam[],
    gradeEntries: GradeEntry[]
): GradeCalculation => {
    // Calculate exam grades (only graded exams)
    const gradedExams = exams.filter(
        (e) => e.taken && e.grade !== undefined && e.grade !== null
    );
    const examEarned = gradedExams.reduce((sum, e) => sum + (e.grade || 0), 0);
    const examPossible = gradedExams.reduce(
        (sum, e) => sum + (e.maxGrade || 0),
        0
    );

    // Calculate grade entries (excluding bonus/deduction)
    const regularEntries = gradeEntries.filter(
        (e) => e.type !== "bonus" && e.type !== "deduction"
    );
    const entryEarned = regularEntries.reduce(
        (sum, e) => sum + e.pointsEarned,
        0
    );
    const entryPossible = regularEntries.reduce(
        (sum, e) => sum + (e.maxPoints || 0),
        0
    );

    // Calculate bonus points
    const bonusPoints = gradeEntries
        .filter((e) => e.type === "bonus")
        .reduce((sum, e) => sum + e.pointsEarned, 0);

    // Calculate deductions (stored as positive but should subtract)
    const deductions = gradeEntries
        .filter((e) => e.type === "deduction")
        .reduce((sum, e) => sum + Math.abs(e.pointsEarned), 0);

    const totalEarned = examEarned + entryEarned + bonusPoints - deductions;
    const totalPossible = examPossible + entryPossible;
    const percentage =
        totalPossible > 0 ? (totalEarned / totalPossible) * 100 : 0;

    return {
        totalEarned,
        totalPossible,
        percentage,
        examGrades: { earned: examEarned, possible: examPossible },
        entryGrades: { earned: entryEarned, possible: entryPossible },
        bonusPoints,
        deductions,
    };
};

export const getGradeColor = (percentage: number): string => {
    if (percentage >= 90) return "text-green-500";
    if (percentage >= 80) return "text-emerald-500";
    if (percentage >= 70) return "text-blue-500";
    if (percentage >= 60) return "text-yellow-500";
    if (percentage >= 50) return "text-orange-500";
    return "text-red-500";
};

export const getGradeProgressColor = (percentage: number): string => {
    if (percentage >= 90) return "bg-green-500";
    if (percentage >= 80) return "bg-emerald-500";
    if (percentage >= 70) return "bg-blue-500";
    if (percentage >= 60) return "bg-yellow-500";
    if (percentage >= 50) return "bg-orange-500";
    return "bg-red-500";
};

export const GradeSummaryCard: React.FC<GradeSummaryCardProps> = ({
    subject,
    exams,
    gradeEntries,
}) => {
    const grades = calculateGrades(exams, gradeEntries);
    const targetGrade = subject.targetGrade || 60;
    const isOnTrack = grades.percentage >= targetGrade;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Grade Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Main Grade Display */}
                <div className="text-center p-6 bg-muted/30 rounded-xl">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Award
                            className={cn(
                                "w-8 h-8",
                                getGradeColor(grades.percentage)
                            )}
                        />
                    </div>
                    <div
                        className={cn(
                            "text-5xl font-bold mb-1",
                            getGradeColor(grades.percentage)
                        )}>
                        {grades.percentage.toFixed(1)}%
                    </div>
                    <div className="text-muted-foreground">
                        {grades.totalEarned.toFixed(1)} /{" "}
                        {grades.totalPossible.toFixed(1)} points
                    </div>
                    {grades.totalPossible === 0 && (
                        <div className="text-sm text-muted-foreground mt-2">
                            No grades recorded yet
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                {grades.totalPossible > 0 && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{grades.percentage.toFixed(1)}%</span>
                        </div>
                        <Progress
                            value={Math.min(grades.percentage, 100)}
                            className="h-3"
                        />
                    </div>
                )}

                {/* Target Grade */}
                <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">Target Grade</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{targetGrade}%</span>
                        {grades.totalPossible > 0 && (
                            <span
                                className={cn(
                                    "text-xs px-2 py-0.5 rounded-full",
                                    isOnTrack
                                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                )}>
                                {isOnTrack ? "On Track" : "Below Target"}
                            </span>
                        )}
                    </div>
                </div>

                {/* Grade Breakdown */}
                {grades.totalPossible > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Breakdown
                        </h4>

                        {/* Exams */}
                        {grades.examGrades.possible > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                    Exams
                                </span>
                                <span>
                                    {grades.examGrades.earned.toFixed(1)} /{" "}
                                    {grades.examGrades.possible.toFixed(1)}
                                </span>
                            </div>
                        )}

                        {/* Other Entries */}
                        {grades.entryGrades.possible > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">
                                    Assignments & Others
                                </span>
                                <span>
                                    {grades.entryGrades.earned.toFixed(1)} /{" "}
                                    {grades.entryGrades.possible.toFixed(1)}
                                </span>
                            </div>
                        )}

                        {/* Bonus */}
                        {grades.bonusPoints > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-green-600 dark:text-green-400">
                                    Bonus Points
                                </span>
                                <span className="text-green-600 dark:text-green-400">
                                    +{grades.bonusPoints.toFixed(1)}
                                </span>
                            </div>
                        )}

                        {/* Deductions */}
                        {grades.deductions > 0 && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-red-600 dark:text-red-400">
                                    Deductions
                                </span>
                                <span className="text-red-600 dark:text-red-400">
                                    -{grades.deductions.toFixed(1)}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
