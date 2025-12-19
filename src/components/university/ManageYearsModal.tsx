import React, { useState, useEffect } from "react";
import {
    Plus,
    Trash2,
    Edit,
    GripVertical,
    ChevronDown,
    ChevronRight,
    Check,
    X,
    Calendar,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { generateId } from "@/utils/helpers";
import type { AcademicYear, Term } from "@/types";

interface ManageYearsModalProps {
    isOpen: boolean;
    onClose: () => void;
    years: AcademicYear[];
    terms: Term[];
    onSave: (years: AcademicYear[], terms: Term[]) => void;
}

export const ManageYearsModal: React.FC<ManageYearsModalProps> = ({
    isOpen,
    onClose,
    years,
    terms,
    onSave,
}) => {
    const [localYears, setLocalYears] = useState<AcademicYear[]>([]);
    const [localTerms, setLocalTerms] = useState<Term[]>([]);
    const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
    const [editingYearId, setEditingYearId] = useState<string | null>(null);
    const [editingTermId, setEditingTermId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState("");

    useEffect(() => {
        if (isOpen) {
            setLocalYears([...years].sort((a, b) => a.order - b.order));
            setLocalTerms([...terms]);
            // Expand all years by default
            setExpandedYears(new Set(years.map((y) => y.id)));
            setEditingYearId(null);
            setEditingTermId(null);
        }
    }, [isOpen, years, terms]);

    const toggleYearExpanded = (yearId: string) => {
        const newExpanded = new Set(expandedYears);
        if (newExpanded.has(yearId)) {
            newExpanded.delete(yearId);
        } else {
            newExpanded.add(yearId);
        }
        setExpandedYears(newExpanded);
    };

    const addYear = () => {
        const newOrder =
            localYears.length > 0
                ? Math.max(...localYears.map((y) => y.order)) + 1
                : 1;
        const newYear: AcademicYear = {
            id: generateId(),
            name: `Year ${newOrder}`,
            order: newOrder,
            isActive: localYears.length === 0, // First year is active by default
            createdAt: new Date().toISOString(),
        };
        setLocalYears([...localYears, newYear]);
        setExpandedYears(new Set([...expandedYears, newYear.id]));
        // Start editing the new year name
        setEditingYearId(newYear.id);
        setEditValue(newYear.name);
    };

    const deleteYear = (yearId: string) => {
        if (
            !confirm(
                "Delete this year and all its terms? Subjects will become unassigned."
            )
        ) {
            return;
        }
        setLocalYears(localYears.filter((y) => y.id !== yearId));
        setLocalTerms(localTerms.filter((t) => t.yearId !== yearId));
    };

    const updateYear = (yearId: string, updates: Partial<AcademicYear>) => {
        setLocalYears(
            localYears.map((y) => (y.id === yearId ? { ...y, ...updates } : y))
        );
    };

    const setActiveYear = (yearId: string) => {
        setLocalYears(
            localYears.map((y) => ({
                ...y,
                isActive: y.id === yearId,
            }))
        );
    };

    const addTerm = (yearId: string) => {
        const yearTerms = localTerms.filter((t) => t.yearId === yearId);
        const newOrder =
            yearTerms.length > 0
                ? Math.max(...yearTerms.map((t) => t.order)) + 1
                : 1;
        const newTerm: Term = {
            id: generateId(),
            yearId,
            name: `Term ${newOrder}`,
            order: newOrder,
            createdAt: new Date().toISOString(),
        };
        setLocalTerms([...localTerms, newTerm]);
        // Start editing the new term name
        setEditingTermId(newTerm.id);
        setEditValue(newTerm.name);
    };

    const deleteTerm = (termId: string) => {
        if (!confirm("Delete this term? Subjects will become unassigned.")) {
            return;
        }
        setLocalTerms(localTerms.filter((t) => t.id !== termId));
    };

    const updateTerm = (termId: string, updates: Partial<Term>) => {
        setLocalTerms(
            localTerms.map((t) => (t.id === termId ? { ...t, ...updates } : t))
        );
    };

    const startEditingYear = (year: AcademicYear) => {
        setEditingYearId(year.id);
        setEditValue(year.name);
        setEditingTermId(null);
    };

    const startEditingTerm = (term: Term) => {
        setEditingTermId(term.id);
        setEditValue(term.name);
        setEditingYearId(null);
    };

    const saveEdit = () => {
        if (editingYearId && editValue.trim()) {
            updateYear(editingYearId, { name: editValue.trim() });
        }
        if (editingTermId && editValue.trim()) {
            updateTerm(editingTermId, { name: editValue.trim() });
        }
        setEditingYearId(null);
        setEditingTermId(null);
        setEditValue("");
    };

    const cancelEdit = () => {
        setEditingYearId(null);
        setEditingTermId(null);
        setEditValue("");
    };

    const handleSave = () => {
        onSave(localYears, localTerms);
        onClose();
    };

    const getTermsForYear = (yearId: string) => {
        return localTerms
            .filter((t) => t.yearId === yearId)
            .sort((a, b) => a.order - b.order);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Manage Academic Years & Terms"
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </>
            }>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Organize your subjects by academic year and
                        term/semester.
                    </p>
                    <Button onClick={addYear} size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Year
                    </Button>
                </div>

                {localYears.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-8">
                            <Calendar className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                            <h3 className="font-semibold mb-1">
                                No Academic Years
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">
                                Add your first academic year to get started
                            </p>
                            <Button onClick={addYear}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Year
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {localYears.map((year) => (
                            <Card key={year.id} className="overflow-hidden">
                                <div
                                    className={cn(
                                        "flex items-center gap-2 p-3 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors",
                                        year.isActive &&
                                            "border-l-4 border-l-primary"
                                    )}
                                    onClick={() => toggleYearExpanded(year.id)}>
                                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                    {expandedYears.has(year.id) ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}

                                    {editingYearId === year.id ? (
                                        <div
                                            className="flex items-center gap-2 flex-1"
                                            onClick={(e) =>
                                                e.stopPropagation()
                                            }>
                                            <input
                                                type="text"
                                                value={editValue}
                                                onChange={(e) =>
                                                    setEditValue(e.target.value)
                                                }
                                                className="flex-1 px-2 py-1 text-sm border rounded bg-background"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter")
                                                        saveEdit();
                                                    if (e.key === "Escape")
                                                        cancelEdit();
                                                }}
                                            />
                                            <Button
                                                size="icon-sm"
                                                variant="ghost"
                                                onClick={saveEdit}>
                                                <Check className="h-4 w-4 text-green-500" />
                                            </Button>
                                            <Button
                                                size="icon-sm"
                                                variant="ghost"
                                                onClick={cancelEdit}>
                                                <X className="h-4 w-4 text-red-500" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <span className="font-medium flex-1">
                                                {year.name}
                                            </span>
                                            {year.isActive && (
                                                <Badge
                                                    variant="default"
                                                    className="text-xs">
                                                    Active
                                                </Badge>
                                            )}
                                            <Badge
                                                variant="outline"
                                                className="text-xs">
                                                {
                                                    getTermsForYear(year.id)
                                                        .length
                                                }{" "}
                                                terms
                                            </Badge>
                                        </>
                                    )}

                                    <div
                                        className="flex items-center gap-1"
                                        onClick={(e) => e.stopPropagation()}>
                                        {!year.isActive && (
                                            <Button
                                                size="icon-sm"
                                                variant="ghost"
                                                onClick={() =>
                                                    setActiveYear(year.id)
                                                }
                                                title="Set as active year">
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button
                                            size="icon-sm"
                                            variant="ghost"
                                            onClick={() =>
                                                startEditingYear(year)
                                            }
                                            title="Edit year name">
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon-sm"
                                            variant="ghost"
                                            onClick={() => deleteYear(year.id)}
                                            className="text-destructive hover:text-destructive"
                                            title="Delete year">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {expandedYears.has(year.id) && (
                                    <CardContent className="pt-3 pb-3 space-y-2">
                                        {getTermsForYear(year.id).map(
                                            (term) => (
                                                <div
                                                    key={term.id}
                                                    className="flex items-center gap-2 p-2 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors">
                                                    <GripVertical className="h-3 w-3 text-muted-foreground cursor-grab" />

                                                    {editingTermId ===
                                                    term.id ? (
                                                        <div className="flex items-center gap-2 flex-1">
                                                            <input
                                                                type="text"
                                                                value={
                                                                    editValue
                                                                }
                                                                onChange={(e) =>
                                                                    setEditValue(
                                                                        e.target
                                                                            .value
                                                                    )
                                                                }
                                                                className="flex-1 px-2 py-1 text-sm border rounded bg-background"
                                                                autoFocus
                                                                onKeyDown={(
                                                                    e
                                                                ) => {
                                                                    if (
                                                                        e.key ===
                                                                        "Enter"
                                                                    )
                                                                        saveEdit();
                                                                    if (
                                                                        e.key ===
                                                                        "Escape"
                                                                    )
                                                                        cancelEdit();
                                                                }}
                                                            />
                                                            <Button
                                                                size="icon-sm"
                                                                variant="ghost"
                                                                onClick={
                                                                    saveEdit
                                                                }>
                                                                <Check className="h-3 w-3 text-green-500" />
                                                            </Button>
                                                            <Button
                                                                size="icon-sm"
                                                                variant="ghost"
                                                                onClick={
                                                                    cancelEdit
                                                                }>
                                                                <X className="h-3 w-3 text-red-500" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="text-sm flex-1">
                                                                {term.name}
                                                            </span>
                                                            <Button
                                                                size="icon-sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    startEditingTerm(
                                                                        term
                                                                    )
                                                                }
                                                                title="Edit term name">
                                                                <Edit className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                                size="icon-sm"
                                                                variant="ghost"
                                                                onClick={() =>
                                                                    deleteTerm(
                                                                        term.id
                                                                    )
                                                                }
                                                                className="text-destructive hover:text-destructive"
                                                                title="Delete term">
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            )
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full mt-2 border border-dashed"
                                            onClick={() => addTerm(year.id)}>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Term
                                        </Button>
                                    </CardContent>
                                )}
                            </Card>
                        ))}
                    </div>
                )}

                <div className="text-xs text-muted-foreground border-t pt-3 mt-3">
                    <p>💡 Tips:</p>
                    <ul className="list-disc list-inside space-y-1 mt-1">
                        <li>Click a year to expand/collapse its terms</li>
                        <li>Set one year as "Active" for quick filtering</li>
                        <li>
                            Subjects without year/term will appear in
                            "Unassigned"
                        </li>
                    </ul>
                </div>
            </div>
        </Modal>
    );
};
