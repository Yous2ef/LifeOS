import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { TextArea } from "@/components/ui/TextArea";
import type {
    Income,
    Currency,
    IncomeType,
    IncomeStatus,
    IncomeFrequency,
} from "@/types/modules/finance";

interface IncomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (income: Omit<Income, "id" | "createdAt" | "updatedAt">) => void;
    defaultCurrency: Currency;
    editingIncome?: Income;
}

export const IncomeModal = ({
    isOpen,
    onClose,
    onSave,
    defaultCurrency,
    editingIncome,
}: IncomeModalProps) => {
    const [title, setTitle] = useState(editingIncome?.title || "");
    const [amount, setAmount] = useState(
        editingIncome?.amount?.toString() || ""
    );
    const [type, setType] = useState<IncomeType>(
        editingIncome?.type || "salary"
    );
    const [status, setStatus] = useState<IncomeStatus>(
        editingIncome?.status || "received"
    );
    const [frequency, setFrequency] = useState<IncomeFrequency>(
        editingIncome?.frequency || "monthly"
    );
    const [actualDate, setActualDate] = useState(
        editingIncome?.actualDate || new Date().toISOString().split("T")[0]
    );
    const [expectedDate, setExpectedDate] = useState(
        editingIncome?.expectedDate || ""
    );
    const [notes, setNotes] = useState(editingIncome?.notes || "");
    const [isRecurring, setIsRecurring] = useState(
        editingIncome?.isRecurring || false
    );

    const handleSubmit = () => {
        if (!title || !amount) return;

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        onSave({
            title,
            amount: numAmount,
            currency: defaultCurrency,
            type,
            status,
            frequency,
            actualDate: status === "received" ? actualDate : undefined,
            expectedDate: status !== "received" ? expectedDate : undefined,
            isRecurring,
            tags: [],
            notes: notes || undefined,
        });

        // Reset form
        setTitle("");
        setAmount("");
        setType("salary");
        setStatus("received");
        setFrequency("monthly");
        setActualDate(new Date().toISOString().split("T")[0]);
        setExpectedDate("");
        setNotes("");
        setIsRecurring(false);
        onClose();
    };

    const incomeTypes: { value: IncomeType; label: string; icon: string }[] = [
        { value: "salary", label: "Salary", icon: "💼" },
        { value: "freelance", label: "Freelance", icon: "💻" },
        { value: "commission", label: "Commission", icon: "📊" },
        { value: "bonus", label: "Bonus", icon: "🎁" },
        { value: "investment", label: "Investment", icon: "📈" },
        { value: "gift", label: "Gift", icon: "🎀" },
        { value: "refund", label: "Refund", icon: "↩️" },
        { value: "other", label: "Other", icon: "📦" },
    ];

    const statusOptions: {
        value: IncomeStatus;
        label: string;
        color: string;
    }[] = [
        { value: "received", label: "Received", color: "text-green-500" },
        { value: "pending", label: "Pending", color: "text-yellow-500" },
        { value: "expected", label: "Expected", color: "text-blue-500" },
    ];

    const frequencyOptions: { value: IncomeFrequency; label: string }[] = [
        { value: "one-time", label: "One Time" },
        { value: "weekly", label: "Weekly" },
        { value: "bi-weekly", label: "Bi-Weekly" },
        { value: "monthly", label: "Monthly" },
        { value: "quarterly", label: "Quarterly" },
        { value: "yearly", label: "Yearly" },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingIncome ? "Edit Income" : "Add Income"}
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!title || !amount}>
                        {editingIncome ? "Save Changes" : "Add Income"}
                    </Button>
                </>
            }>
            <div className="space-y-4">
                {/* Title */}
                <FormInput
                    label="Title *"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Monthly Salary, Freelance Project"
                />

                {/* Amount */}
                <FormInput
                    label="Amount *"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.01"
                />

                {/* Income Type */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Type
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {incomeTypes.map((t) => (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => setType(t.value)}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                                    type === t.value
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/50"
                                }`}>
                                <span className="text-xl">{t.icon}</span>
                                <span className="text-xs">{t.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Status */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Status
                    </label>
                    <div className="flex gap-2">
                        {statusOptions.map((s) => (
                            <button
                                key={s.value}
                                type="button"
                                onClick={() => setStatus(s.value)}
                                className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
                                    status === s.value
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/50"
                                }`}>
                                <span
                                    className={
                                        status === s.value ? s.color : ""
                                    }>
                                    {s.label}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date based on status */}
                {status === "received" ? (
                    <FormInput
                        label="Date Received"
                        type="date"
                        value={actualDate}
                        onChange={(e) => setActualDate(e.target.value)}
                    />
                ) : (
                    <FormInput
                        label="Expected Date"
                        type="date"
                        value={expectedDate}
                        onChange={(e) => setExpectedDate(e.target.value)}
                    />
                )}

                {/* Frequency */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Frequency
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {frequencyOptions.map((f) => (
                            <button
                                key={f.value}
                                type="button"
                                onClick={() => setFrequency(f.value)}
                                className={`py-1.5 px-3 rounded-lg border text-sm transition-all ${
                                    frequency === f.value
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:border-primary/50"
                                }`}>
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notes */}
                <TextArea
                    label="Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={2}
                />

                {/* Recurring Toggle */}
                {frequency !== "one-time" && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    Recurring Income
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Automatically add this income on schedule
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsRecurring(!isRecurring)}
                                className={`relative w-11 h-6 rounded-full transition-colors ${
                                    isRecurring ? "bg-primary" : "bg-muted"
                                }`}>
                                <span
                                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                                        isRecurring ? "translate-x-5" : ""
                                    }`}
                                />
                            </button>
                        </div>
                        {isRecurring && (
                            <p className="text-xs text-primary bg-primary/10 p-2 rounded-lg">
                                ✨ A new income entry will be created
                                automatically every{" "}
                                {frequency === "weekly"
                                    ? "week"
                                    : frequency === "bi-weekly"
                                    ? "2 weeks"
                                    : frequency === "monthly"
                                    ? "month"
                                    : frequency === "quarterly"
                                    ? "3 months"
                                    : "year"}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};
