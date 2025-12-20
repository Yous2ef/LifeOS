import { useState } from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExpenseCategory } from "@/types/modules/finance";

interface QuickAddExpenseProps {
    isOpen: boolean;
    onClose: () => void;
    categories: ExpenseCategory[];
    onAdd: (amount: number, categoryId: string, title?: string) => void;
}

export const QuickAddExpense = ({
    isOpen,
    onClose,
    categories,
    onAdd,
}: QuickAddExpenseProps) => {
    const [amount, setAmount] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        null
    );

    const handleSubmit = () => {
        if (!amount || !selectedCategory) return;

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return;

        onAdd(numAmount, selectedCategory);

        // Reset and close
        setAmount("");
        setSelectedCategory(null);
        onClose();
    };

    const handleNumberClick = (num: string) => {
        if (num === "." && amount.includes(".")) return;
        if (num === "." && amount === "") {
            setAmount("0.");
            return;
        }
        setAmount((prev) => prev + num);
    };

    const handleBackspace = () => {
        setAmount((prev) => prev.slice(0, -1));
    };

    const handleClear = () => {
        setAmount("");
    };

    if (!isOpen) return null;

    // Sort categories by usage (most used first) - simplified to order
    const sortedCategories = [...categories]
        .sort((a, b) => a.order - b.order)
        .slice(0, 12);

    return (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in-0">
            <div className="flex flex-col h-full max-w-lg mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-muted transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                    <h2 className="text-lg font-semibold">Quick Add Expense</h2>
                    <button
                        onClick={handleSubmit}
                        disabled={!amount || !selectedCategory}
                        className={cn(
                            "p-2 rounded-full transition-colors",
                            amount && selectedCategory
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                        )}>
                        <Check className="h-5 w-5" />
                    </button>
                </div>

                {/* Amount Display */}
                <div className="flex-1 flex flex-col items-center justify-center p-6">
                    <p className="text-muted-foreground text-sm mb-2">Amount</p>
                    <div className="text-5xl sm:text-6xl font-bold text-center min-h-[72px]">
                        {amount || "0"}
                        <span className="text-2xl text-muted-foreground ml-2">
                            EGP
                        </span>
                    </div>
                </div>

                {/* Category Selection */}
                <div className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground mb-3">
                        Category
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                        {sortedCategories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategory(category.id)}
                                className={cn(
                                    "flex flex-col items-center gap-1 p-3 rounded-xl transition-all",
                                    selectedCategory === category.id
                                        ? "bg-primary text-primary-foreground scale-105"
                                        : "bg-muted hover:bg-muted/80"
                                )}>
                                <span className="text-2xl">
                                    {category.icon}
                                </span>
                                <span className="text-xs truncate max-w-full">
                                    {category.nameAr || category.name}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Number Pad */}
                <div className="p-4 bg-muted/30 border-t">
                    <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                        {[
                            "1",
                            "2",
                            "3",
                            "4",
                            "5",
                            "6",
                            "7",
                            "8",
                            "9",
                            ".",
                            "0",
                            "⌫",
                        ].map((key) => (
                            <button
                                key={key}
                                onClick={() => {
                                    if (key === "⌫") {
                                        handleBackspace();
                                    } else {
                                        handleNumberClick(key);
                                    }
                                }}
                                className={cn(
                                    "h-14 rounded-xl text-xl font-medium transition-all active:scale-95",
                                    key === "⌫"
                                        ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                        : "bg-background hover:bg-muted"
                                )}>
                                {key}
                            </button>
                        ))}
                    </div>

                    {/* Clear button */}
                    {amount && (
                        <button
                            onClick={handleClear}
                            className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                            Clear
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
