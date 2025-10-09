import React, { useMemo } from "react";
import { Clock, MapPin, Edit } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { Subject, ScheduleEntry } from "../../types";

interface TimetableProps {
    subjects: Subject[];
    onAddSchedule?: (subjectId: string) => void;
    onEditSchedule: (subjectId: string) => void;
}

interface TimeSlot {
    hour: number;
    display: string;
}

interface TimetableCell {
    subject: Subject;
    entry: ScheduleEntry;
    type: "lecture" | "section";
    startHour: number;
    endHour: number;
    duration: number; // in hours
}

const DAYS = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
] as const;

// Time slots from 8 AM to 6 PM with ranges
const TIME_SLOTS: TimeSlot[] = [
    { hour: 8, display: "08:00 - 10:00" },
    { hour: 10, display: "10:00 - 12:00" },
    { hour: 12, display: "12:00 - 2:00" },
    { hour: 14, display: "2:00 - 4:00" },
    { hour: 16, display: "4:00 - 6:00" },
];

const parseTime = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours + minutes / 60;
};

export const Timetable: React.FC<TimetableProps> = ({
    subjects,
    onEditSchedule,
}) => {
    // Build a map of day -> array of cells with position info
    const timetableData = useMemo(() => {
        const data: Record<string, TimetableCell[]> = {};

        subjects.forEach((subject) => {
            // Process lectures
            subject.lectures?.forEach((entry) => {
                if (!data[entry.day]) data[entry.day] = [];

                const startHour = parseTime(entry.startTime);
                const endHour = parseTime(entry.endTime);
                const duration = endHour - startHour;

                data[entry.day].push({
                    subject,
                    entry,
                    type: "lecture",
                    startHour,
                    endHour,
                    duration,
                });
            });

            // Process sections
            subject.sections?.forEach((entry) => {
                if (!data[entry.day]) data[entry.day] = [];

                const startHour = parseTime(entry.startTime);
                const endHour = parseTime(entry.endTime);
                const duration = endHour - startHour;

                data[entry.day].push({
                    subject,
                    entry,
                    type: "section",
                    startHour,
                    endHour,
                    duration,
                });
            });
        });

        return data;
    }, [subjects]);

    // Helper to calculate grid column span
    const getColumnSpan = (
        startHour: number,
        endHour: number
    ): { start: number; span: number } => {
        // Find which column the start hour belongs to
        const startSlotIndex = TIME_SLOTS.findIndex(
            (slot) => slot.hour === Math.floor(startHour)
        );

        // Find the end slot - need to handle times that end on the half hour
        let endSlotIndex = TIME_SLOTS.findIndex(
            (slot) => slot.hour >= Math.ceil(endHour)
        );
        if (endSlotIndex === -1) {
            endSlotIndex = TIME_SLOTS.length; // Extends to the last column
        }

        const start = startSlotIndex + 2; // +2 because grid starts at 1 and first column is day label
        const span = Math.max(1, endSlotIndex - startSlotIndex);

        return { start, span };
    };

    const hasSchedule = subjects.some(
        (s) =>
            (s.lectures && s.lectures.length > 0) ||
            (s.sections && s.sections.length > 0)
    );

    return (
        <div className="space-y-6">
            {/* Timetable Grid */}
            <Card className="p-0" dir="ltr">
                {/* <CardHeader>
                    <CardTitle>Weekly Timetable</CardTitle>
                </CardHeader> */}
                {!hasSchedule ? (
                    <CardContent className="py-12">
                        <div className="text-center space-y-4">
                            <Clock className="w-12 h-12 mx-auto text-muted-foreground" />
                            <div>
                                <h3 className="text-lg font-semibold mb-2">
                                    No Schedule Yet
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    Add lecture and section times to your
                                    subjects to see your timetable
                                </p>
                                <p className="text-sm text-primary">
                                    Scroll down to "Manage Schedules" section
                                    and click "Add Schedule" on any subject
                                </p>
                            </div>
                        </div>
                    </CardContent>
                ) : (
                    <Card className="h-ful p-0">
                        <CardContent className="p-0 m-0">
                            <div className="overflow-x-auto overflow-y-hidden h-full">
                                <div className="min-w-[1000px]">
                                    {/* Header Row - Time Slots */}
                                    <div className="grid grid-cols-[120px_repeat(5,1fr)] border-b">
                                        <div className="p-3 font-semibold border-r bg-muted/50">
                                            Day / Time
                                        </div>
                                        {TIME_SLOTS.map((slot) => (
                                            <div
                                                key={slot.hour}
                                                className="p-2 text-center items-center justify-center pt-3 text-base font-medium border-r last:border-r-0 bg-muted/50">
                                                {slot.display}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Day Rows */}
                                    {DAYS.map((day) => {
                                        const dayCells =
                                            timetableData[day] || [];
                                        const hasClasses = dayCells.length > 0;

                                        return (
                                            <div
                                                key={day}
                                                className={cn(
                                                    "grid grid-cols-[120px_repeat(5,1fr)] border-b last:border-b-0 relative",
                                                    hasClasses
                                                        ? "min-h-[120px]"
                                                        : "min-h-[20px]"
                                                )}>
                                                {/* Day Label */}
                                                <div
                                                    className={cn(
                                                        "p-3 font-medium border-r bg-muted/30 flex items-center",
                                                        hasClasses
                                                            ? "text-primary"
                                                            : "text-muted-foreground"
                                                    )}>
                                                    {day}
                                                </div>

                                                {/* Empty Time Slot Cells for borders */}
                                                {TIME_SLOTS.map((slot) => (
                                                    <div
                                                        key={`${day}-${slot.hour}-bg`}
                                                        className="border-r last:border-r-0"
                                                    />
                                                ))}

                                                {/* Overlay cells that span multiple columns */}
                                                {dayCells.map((cell, index) => {
                                                    const { start, span } =
                                                        getColumnSpan(
                                                            cell.startHour,
                                                            cell.endHour
                                                        );
                                                    const isLecture =
                                                        cell.type === "lecture";
                                                    const subjectColor =
                                                        cell.subject.color;

                                                    return (
                                                        <div
                                                            key={`${cell.subject.id}-${cell.type}-${index}`}
                                                            className={cn(
                                                                "absolute rounded-lg p-3 text-base cursor-pointer transition-all hover:shadow-lg hover:z-10",
                                                                "border-2 flex flex-col justify-center"
                                                            )}
                                                            style={{
                                                                gridColumn: `${start} / span ${span}`,
                                                                backgroundColor:
                                                                    isLecture
                                                                        ? `${subjectColor}80`
                                                                        : `${subjectColor}20`,
                                                                borderColor:
                                                                    subjectColor,
                                                                top: "8px",
                                                                bottom: "8px",
                                                                left: "4px",
                                                                right: "4px",
                                                            }}
                                                            onClick={() =>
                                                                onEditSchedule(
                                                                    cell.subject
                                                                        .id
                                                                )
                                                            }>
                                                            <div className="font-semibold truncate text-[14px]">
                                                                {
                                                                    cell.subject
                                                                        .name
                                                                }
                                                            </div>

                                                            <div className="text-[12px] font-[700] opacity-100 truncate mt-0.5">
                                                                {isLecture
                                                                    ? "Lecture"
                                                                    : "Section"}
                                                            </div>

                                                            {isLecture &&
                                                                cell.subject
                                                                    .professor && (
                                                                    <div className="text-[10px] opacity-100 truncate my-0.5">
                                                                        {
                                                                            cell
                                                                                .subject
                                                                                .professor
                                                                        }
                                                                    </div>
                                                                )}
                                                            {cell.entry
                                                                .location && (
                                                                <div className="flex items-center gap-1 mt-0.5 text-[12px] font-medium opacity-70">
                                                                    <MapPin className="w-3 h-3 flex-shrink-0" />
                                                                    <span className="truncate">
                                                                        {
                                                                            cell
                                                                                .entry
                                                                                .location
                                                                        }
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </Card>

            {/* Subject List with Schedule Management */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Manage Schedules</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {subjects.map((subject) => {
                            const hasLectures =
                                subject.lectures && subject.lectures.length > 0;
                            const hasSections =
                                subject.sections && subject.sections.length > 0;

                            return (
                                <div
                                    key={subject.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className="w-3 h-3 rounded"
                                                style={{
                                                    backgroundColor:
                                                        subject.color,
                                                }}
                                            />
                                            <span className="font-medium">
                                                {subject.name}
                                            </span>
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                                            {hasLectures && (
                                                <span className="flex items-center gap-1">
                                                    <Badge
                                                        variant="outline"
                                                        style={{
                                                            borderColor:
                                                                subject.color,
                                                            color: subject.color,
                                                        }}>
                                                        {
                                                            subject.lectures!
                                                                .length
                                                        }{" "}
                                                        Lecture
                                                        {subject.lectures!
                                                            .length !== 1
                                                            ? "s"
                                                            : ""}
                                                    </Badge>
                                                </span>
                                            )}
                                            {hasSections && (
                                                <span className="flex items-center gap-1">
                                                    <Badge
                                                        variant="outline"
                                                        style={{
                                                            borderColor:
                                                                subject.color,
                                                            color: subject.color,
                                                            opacity: 0.8,
                                                        }}>
                                                        {
                                                            subject.sections!
                                                                .length
                                                        }{" "}
                                                        Section
                                                        {subject.sections!
                                                            .length !== 1
                                                            ? "s"
                                                            : ""}
                                                    </Badge>
                                                </span>
                                            )}
                                            {!hasLectures && !hasSections && (
                                                <span className="text-muted-foreground">
                                                    No schedule set
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            onEditSchedule(subject.id)
                                        }>
                                        <Edit className="w-4 h-4 mr-2" />
                                        {hasLectures || hasSections
                                            ? "Edit"
                                            : "Add"}{" "}
                                        Schedule
                                    </Button>
                                </div>
                            );
                        })}
                        {subjects.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No subjects yet. Add a subject first to create a
                                schedule.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
