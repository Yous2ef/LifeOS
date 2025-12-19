import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormInput } from "@/components/ui/FormInput";
import { TextArea } from "@/components/ui/TextArea";
import type {
    Expense,
    ExpenseCategory,
    Currency,
    ExpenseType,
    PaymentMethod,
    RecurringFrequency,
} from "@/types/finance";

interface ExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    categories: ExpenseCategory[];
    onSave: (expense: Omit<Expense, "id" | "createdAt" | "updatedAt">) => void;
    defaultCurrency: Currency;
    editingExpense?: Expense;
}

export const ExpenseModal = ({
    isOpen,
    onClose,
    categories,
    onSave,
    defaultCurrency,
    editingExpense,
}: ExpenseModalProps) => {
    const [title, setTitle] = useState(editingExpense?.title || "");
    const [amount, setAmount] = useState(
        editingExpense?.amount?.toString() || ""
    );
    const [categoryId, setCategoryId] = useState(
        editingExpense?.categoryId || categories[0]?.id || ""
    );
    const [type, setType] = useState<ExpenseType>(
        editingExpense?.type || "variable"
    );
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
        editingExpense?.paymentMethod || "cash"
    );
    const [date, setDate] = useState(
        editingExpense?.date || new Date().toISOString().split("T")[0]
    );
    const [notes, setNotes] = useState(editingExpense?.notes || "");
    const [isRecurring, setIsRecurring] = useState(
        editingExpense?.isRecurring || false
    );
    const [recurringFrequency, setRecurringFrequency] =
        useState<RecurringFrequency>(
            editingExpense?.recurringFrequency || "monthly"
        );

    const handleSubmit = () => {
        if (!amount || !categoryId) return;

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        const category = categories.find((c) => c.id === categoryId);

        onSave({
            title: title || category?.name || "Expense",
            amount: numAmount,
            currency: defaultCurrency,
            categoryId,
            type,
            paymentMethod,
            date,
            isRecurring,
            recurringFrequency: isRecurring ? recurringFrequency : undefined,
            tags: [],
            notes: notes || undefined,
        });

        // Reset form
        setTitle("");
        setAmount("");
        setCategoryId(categories[0]?.id || "");
        setType("variable");
        setPaymentMethod("cash");
        setDate(new Date().toISOString().split("T")[0]);
        setNotes("");
        setIsRecurring(false);
        setRecurringFrequency("monthly");
        onClose();
    };

    const expenseTypes: { value: ExpenseType; label: string }[] = [
        { value: "fixed", label: "Fixed" },
        { value: "variable", label: "Variable" },
        { value: "emergency", label: "Emergency" },
    ];

    const paymentMethods: {
        value: PaymentMethod;
        label: string;
        icon: string;
    }[] = [
        { value: "cash", label: "Cash", icon: "💵" },
        { value: "card", label: "Card", icon: "💳" },
        { value: "bank-transfer", label: "Bank", icon: "🏦" },
        { value: "mobile-wallet", label: "Mobile", icon: "📱" },
        { value: "other", label: "Other", icon: "📦" },
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editingExpense ? "Edit Expense" : "Add Expense"}
            footer={
                <>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!amount || !categoryId}>
                        {editingExpense ? "Save Changes" : "Add Expense"}
                    </Button>
                </>
            }>
            <div className="space-y-4">
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

                {/* Title */}
                <FormInput
                    label="Description"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What was this expense for?"
                />

                {/* Category */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Category *
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() => setCategoryId(category.id)}
                                className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                                    categoryId === category.id
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/50"
                                }`}>
                                <span className="text-xl">{category.icon}</span>
                                <span className="text-xs truncate max-w-full text-center">
                                    {category.nameAr || category.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date */}
                <FormInput
                    label="Date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />

                {/* Expense Type */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Type
                    </label>
                    <div className="flex gap-2">
                        {expenseTypes.map((t) => (
                            <button
                                key={t.value}
                                type="button"
                                onClick={() => setType(t.value)}
                                className={`flex-1 py-2 px-3 rounded-lg border text-sm transition-all ${
                                    type === t.value
                                        ? "border-primary bg-primary/10 text-primary"
                                        : "border-border hover:border-primary/50"
                                }`}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Payment Method */}
                <div>
                    <label className="block text-sm font-medium mb-2">
                        Payment Method
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {paymentMethods.map((pm) => (
                            <button
                                key={pm.value}
                                type="button"
                                onClick={() => setPaymentMethod(pm.value)}
                                className={`flex items-center gap-1.5 py-2 px-3 rounded-lg border text-sm whitespace-nowrap transition-all ${
                                    paymentMethod === pm.value
                                        ? "border-primary bg-primary/10"
                                        : "border-border hover:border-primary/50"
                                }`}>
                                <span>{pm.icon}</span>
                                <span>{pm.label}</span>
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
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium">Recurring Expense</p>
                        <p className="text-xs text-muted-foreground">
                            Repeat this expense automatically
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

                {/* Recurring Frequency - shown when recurring is enabled */}
                {isRecurring && (
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Repeat Every
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { value: "daily", label: "Daily" },
                                { value: "weekly", label: "Weekly" },
                                { value: "bi-weekly", label: "Bi-Weekly" },
                                { value: "monthly", label: "Monthly" },
                                { value: "quarterly", label: "Quarterly" },
                                { value: "yearly", label: "Yearly" },
                            ].map((freq) => (
                                <button
                                    key={freq.value}
                                    type="button"
                                    onClick={() =>
                                        setRecurringFrequency(
                                            freq.value as RecurringFrequency
                                        )
                                    }
                                    className={`py-1.5 px-3 rounded-lg border text-sm transition-all ${
                                        recurringFrequency === freq.value
                                            ? "border-primary bg-primary/10 text-primary"
                                            : "border-border hover:border-primary/50"
                                    }`}>
                                    {freq.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                            A new expense will be created automatically on
                            schedule
                        </p>
                    </div>
                )}
            </div>
        </Modal>
    );
};
