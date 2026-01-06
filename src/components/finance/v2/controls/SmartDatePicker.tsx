import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Calendar,
    ChevronDown,
    CalendarDays,
    CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export type DatePreset =
    | "today"
    | "yesterday"
    | "this-week"
    | "last-week"
    | "this-month"
    | "last-month"
    | "this-year"
    | "all-time"
    | "custom";

export interface DateRange {
    preset: DatePreset;
    start: Date;
    end: Date;
    label: string;
}

interface SmartDatePickerProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
    className?: string;
}

const PRESETS: { id: DatePreset; label: string; icon: React.ReactNode }[] = [
    { id: "today", label: "Today", icon: <CalendarDays className="w-4 h-4" /> },
    {
        id: "yesterday",
        label: "Yesterday",
        icon: <CalendarDays className="w-4 h-4" />,
    },
    {
        id: "this-week",
        label: "This Week",
        icon: <CalendarRange className="w-4 h-4" />,
    },
    {
        id: "last-week",
        label: "Last Week",
        icon: <CalendarRange className="w-4 h-4" />,
    },
    {
        id: "this-month",
        label: "This Month",
        icon: <Calendar className="w-4 h-4" />,
    },
    {
        id: "last-month",
        label: "Last Month",
        icon: <Calendar className="w-4 h-4" />,
    },
    {
        id: "this-year",
        label: "This Year",
        icon: <Calendar className="w-4 h-4" />,
    },
    {
        id: "all-time",
        label: "All Time",
        icon: <Calendar className="w-4 h-4" />,
    },
];

export const getDateRangeFromPreset = (preset: DatePreset): DateRange => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    // Get start of week (Monday)
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    // Get start of month
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Get start of year
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // End of day helper
    const endOfDay = (date: Date) => {
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        return end;
    };

    switch (preset) {
        case "today":
            return {
                preset,
                start: today,
                end: endOfDay(today),
                label: "Today",
            };
        case "yesterday":
            return {
                preset,
                start: yesterday,
                end: endOfDay(yesterday),
                label: "Yesterday",
            };
        case "this-week": {
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 6);
            return {
                preset,
                start: startOfWeek,
                end: endOfDay(endOfWeek),
                label: "This Week",
            };
        }
        case "last-week": {
            const lastWeekStart = new Date(startOfWeek);
            lastWeekStart.setDate(lastWeekStart.getDate() - 7);
            const lastWeekEnd = new Date(lastWeekStart);
            lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
            return {
                preset,
                start: lastWeekStart,
                end: endOfDay(lastWeekEnd),
                label: "Last Week",
            };
        }
        case "this-month":
            return {
                preset,
                start: startOfMonth,
                end: endOfDay(today),
                label: new Date().toLocaleDateString("en-US", {
                    month: "long",
                }),
            };
        case "last-month": {
            const lastMonthStart = new Date(
                today.getFullYear(),
                today.getMonth() - 1,
                1
            );
            const lastMonthEnd = new Date(
                today.getFullYear(),
                today.getMonth(),
                0
            );
            return {
                preset,
                start: lastMonthStart,
                end: endOfDay(lastMonthEnd),
                label: lastMonthStart.toLocaleDateString("en-US", {
                    month: "long",
                }),
            };
        }
        case "this-year":
            return {
                preset,
                start: startOfYear,
                end: endOfDay(today),
                label: String(today.getFullYear()),
            };
        case "all-time":
            return {
                preset,
                start: new Date(2020, 0, 1), // Far back enough
                end: endOfDay(today),
                label: "All Time",
            };
        default:
            return {
                preset: "this-month",
                start: startOfMonth,
                end: endOfDay(today),
                label: new Date().toLocaleDateString("en-US", {
                    month: "long",
                }),
            };
    }
};

export const SmartDatePicker = ({
    value,
    onChange,
    className,
}: SmartDatePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);

    const handlePresetClick = (preset: DatePreset) => {
        onChange(getDateRangeFromPreset(preset));
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    className={cn(
                        "h-10 px-4 gap-2",
                        "bg-muted/50 hover:bg-muted",
                        "rounded-full",
                        "font-medium",
                        "border border-border/50",
                        "transition-all duration-200",
                        isOpen && "bg-muted ring-2 ring-primary/20",
                        className
                    )}>
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span>{value.label}</span>
                    <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                </Button>
            </PopoverTrigger>

            <PopoverContent
                className="w-56 p-2 rounded-2xl border-border/50 bg-card/95 backdrop-blur-xl shadow-2xl"
                align="center"
                sideOffset={8}>
                <AnimatePresence>
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-1">
                        {PRESETS.map((preset, index) => (
                            <motion.button
                                key={preset.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                                onClick={() => handlePresetClick(preset.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl",
                                    "text-sm font-medium",
                                    "transition-all duration-150",
                                    "hover:bg-primary/10",
                                    "active:scale-[0.98]",
                                    value.preset === preset.id
                                        ? "bg-primary/15 text-primary"
                                        : "text-foreground hover:text-primary"
                                )}>
                                <span
                                    className={cn(
                                        "p-1.5 rounded-lg",
                                        value.preset === preset.id
                                            ? "bg-primary/20 text-primary"
                                            : "bg-muted text-muted-foreground"
                                    )}>
                                    {preset.icon}
                                </span>
                                <span>{preset.label}</span>
                                {value.preset === preset.id && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className="ml-auto w-2 h-2 rounded-full bg-primary"
                                    />
                                )}
                            </motion.button>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </PopoverContent>
        </Popover>
    );
};
