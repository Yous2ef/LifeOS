import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { TextArea } from "@/components/ui/TextArea";
import toast from "react-hot-toast";
import { Clock, Trash2 } from "lucide-react";
import type { TimeEntry } from "@/types/modules/programming";

interface TimeTrackingModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskTitle: string;
    timeEntries: TimeEntry[];
    onAddTimeEntry: (minutes: number, note?: string) => void;
    onDeleteTimeEntry: (entryId: string) => void;
}

export const TimeTrackingModal = ({
    isOpen,
    onClose,
    taskTitle,
    timeEntries,
    onAddTimeEntry,
    onDeleteTimeEntry,
}: TimeTrackingModalProps) => {
    const [minutes, setMinutes] = useState("");
    const [note, setNote] = useState("");

    const totalMinutes = timeEntries.reduce(
        (sum, entry) => sum + entry.minutes,
        0
    );
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    const handleAddTime = () => {
        const minutesNum = parseInt(minutes);
        if (!minutesNum || minutesNum <= 0) {
            toast.error("Please enter a valid number of minutes");
            return;
        }

        onAddTimeEntry(minutesNum, note.trim() || undefined);
        setMinutes("");
        setNote("");
        toast.success(`Added ${minutesNum} minutes`);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return (
            date.toLocaleDateString() +
            " " +
            date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        );
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Time Tracking: ${taskTitle}`}>
            <div className="space-y-6">
                {/* Total Time Display */}
                <div className="bg-primary/10 rounded-lg p-4 text-center">
                    <div className="text-sm text-muted-foreground mb-1">
                        Total Time Spent
                    </div>
                    <div className="text-3xl font-bold text-primary">
                        {hours}h {mins}m
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {totalMinutes} minutes total
                    </div>
                </div>

                {/* Add Time Entry */}
                <div className="space-y-3 border-t pt-4">
                    <h3 className="font-semibold text-foreground">
                        Add Work Session
                    </h3>

                    <div className="grid grid-cols-3 gap-2">
                        <FormInput
                            label="Minutes Worked"
                            type="number"
                            min="1"
                            value={minutes}
                            onChange={(e) => setMinutes(e.target.value)}
                            placeholder="e.g., 30"
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setMinutes("15")}
                            className="mt-6">
                            15m
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setMinutes("30")}
                            className="mt-6">
                            30m
                        </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setMinutes("60")}
                            className="col-span-1">
                            1h
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setMinutes("90")}
                            className="col-span-1">
                            1.5h
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setMinutes("120")}
                            className="col-span-1">
                            2h
                        </Button>
                    </div>

                    <TextArea
                        label="Note (Optional)"
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="What did you work on?"
                        rows={2}
                    />

                    <Button onClick={handleAddTime} className="w-full gap-2">
                        <Clock className="h-4 w-4" />
                        Add Time Entry
                    </Button>
                </div>

                {/* Time Entries List */}
                {timeEntries.length > 0 && (
                    <div className="space-y-2 border-t pt-4">
                        <h3 className="font-semibold text-foreground">
                            Work Sessions
                        </h3>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {[...timeEntries].reverse().map((entry) => (
                                <div
                                    key={entry.id}
                                    className="flex items-start justify-between p-3 bg-muted/50 rounded-lg">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-primary" />
                                            <span className="font-medium text-foreground">
                                                {Math.floor(
                                                    entry.minutes / 60
                                                ) > 0 &&
                                                    `${Math.floor(
                                                        entry.minutes / 60
                                                    )}h `}
                                                {entry.minutes % 60}m
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(entry.date)}
                                            </span>
                                        </div>
                                        {entry.note && (
                                            <p className="text-sm text-muted-foreground mt-1 ml-6">
                                                {entry.note}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            onDeleteTimeEntry(entry.id)
                                        }
                                        className="ml-2 h-8 px-2 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Close Button */}
                <div className="flex justify-end pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
