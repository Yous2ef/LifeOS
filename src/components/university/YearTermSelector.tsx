import React from "react";
import { Calendar, ChevronDown, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import type { AcademicYear, Term } from "@/types";

interface YearTermSelectorProps {
    years: AcademicYear[];
    terms: Term[];
    currentYearId?: string;
    currentTermId?: string;
    onYearChange: (yearId: string | undefined) => void;
    onTermChange: (termId: string | undefined) => void;
    onManageClick: () => void;
}

export const YearTermSelector: React.FC<YearTermSelectorProps> = ({
    years,
    terms,
    currentYearId,
    currentTermId,
    onYearChange,
    onTermChange,
    onManageClick,
}) => {
    const sortedYears = [...years].sort((a, b) => a.order - b.order);
    const currentYear = years.find((y) => y.id === currentYearId);
    const currentTerm = terms.find((t) => t.id === currentTermId);

    // Get terms for the selected year
    const termsForYear = currentYearId
        ? terms
              .filter((t) => t.yearId === currentYearId)
              .sort((a, b) => a.order - b.order)
        : [];

    // When year changes, reset term if it doesn't belong to the new year
    const handleYearChange = (yearId: string | undefined) => {
        onYearChange(yearId);
        if (yearId && currentTermId) {
            const termBelongsToYear = terms.some(
                (t) => t.id === currentTermId && t.yearId === yearId
            );
            if (!termBelongsToYear) {
                onTermChange(undefined);
            }
        }
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            {/* Year Selector */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <Calendar className="h-4 w-4" />
                        {currentYearId === "unassigned"
                            ? "Unassigned"
                            : currentYear
                            ? currentYear.name
                            : "All Years"}
                        <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>Academic Year</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => handleYearChange(undefined)}
                        className={cn(!currentYearId && "bg-accent")}>
                        <span className="flex-1">All Years</span>
                        {!currentYearId && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                                Selected
                            </Badge>
                        )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => handleYearChange("unassigned")}
                        className={cn(
                            currentYearId === "unassigned" && "bg-accent"
                        )}>
                        <span className="flex-1">Unassigned</span>
                        {currentYearId === "unassigned" && (
                            <Badge variant="secondary" className="ml-2 text-xs">
                                Selected
                            </Badge>
                        )}
                    </DropdownMenuItem>
                    {sortedYears.length > 0 && <DropdownMenuSeparator />}
                    {sortedYears.map((year) => (
                        <DropdownMenuItem
                            key={year.id}
                            onClick={() => handleYearChange(year.id)}
                            className={cn(
                                currentYearId === year.id && "bg-accent"
                            )}>
                            <span className="flex-1">{year.name}</span>
                            {year.isActive && (
                                <Badge
                                    variant="default"
                                    className="ml-2 text-xs">
                                    Active
                                </Badge>
                            )}
                            {currentYearId === year.id && !year.isActive && (
                                <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs">
                                    Selected
                                </Badge>
                            )}
                        </DropdownMenuItem>
                    ))}
                    {sortedYears.length === 0 && (
                        <DropdownMenuItem
                            disabled
                            className="text-muted-foreground">
                            No years added yet
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Term Selector - Only show when a year is selected (not unassigned) */}
            {currentYearId && currentYearId !== "unassigned" && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            {currentTerm ? currentTerm.name : "All Terms"}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48">
                        <DropdownMenuLabel>Term / Semester</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => onTermChange(undefined)}
                            className={cn(!currentTermId && "bg-accent")}>
                            <span className="flex-1">All Terms</span>
                            {!currentTermId && (
                                <Badge
                                    variant="secondary"
                                    className="ml-2 text-xs">
                                    Selected
                                </Badge>
                            )}
                        </DropdownMenuItem>
                        {termsForYear.length > 0 && <DropdownMenuSeparator />}
                        {termsForYear.map((term) => (
                            <DropdownMenuItem
                                key={term.id}
                                onClick={() => onTermChange(term.id)}
                                className={cn(
                                    currentTermId === term.id && "bg-accent"
                                )}>
                                <span className="flex-1">{term.name}</span>
                                {currentTermId === term.id && (
                                    <Badge
                                        variant="secondary"
                                        className="ml-2 text-xs">
                                        Selected
                                    </Badge>
                                )}
                            </DropdownMenuItem>
                        ))}
                        {termsForYear.length === 0 && (
                            <DropdownMenuItem
                                disabled
                                className="text-muted-foreground">
                                No terms for this year
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            )}

            {/* Manage Button */}
            <Button
                variant="ghost"
                size="icon"
                onClick={onManageClick}
                title="Manage Years & Terms">
                <Settings2 className="h-4 w-4" />
            </Button>

            {/* Show "Unassigned" indicator when filtering */}
            {(currentYearId || currentTermId) && (
                <Badge variant="outline" className="text-xs">
                    Filtered
                </Badge>
            )}
        </div>
    );
};
