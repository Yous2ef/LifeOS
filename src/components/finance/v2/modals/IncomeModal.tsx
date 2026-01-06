/**
 * IncomeModal V2 - Glassmorphic income entry
 *
 * Features:
 * - Neon mint/green theme for income
 * - Account selection with visual cards
 * - Income type and frequency selection
 */

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    Plus,
    Calendar,
    Tag,
    FileText,
    Repeat,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { TextArea } from "@/components/ui/TextArea";
import type {
    Account,
    IncomeCategory,
    TransactionNature,
    IncomeStatus,
    IncomeFrequency,
    Currency,
} from "@/types/modules/finance";

interface IncomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (income: IncomeFormData) => void;
    accounts: Account[];
    incomeCategories: IncomeCategory[];
    defaultCurrency: Currency;
}

export interface IncomeFormData {
    title: string;
    amount: number;
    currency: Currency;
    accountId: string;
    categoryId: string;
    type: TransactionNature;
    status: IncomeStatus;
    frequency: IncomeFrequency;
    actualDate?: string;
    expectedDate?: string;
    isRecurring: boolean;
    tags: string[];
    notes?: string;
}

const TRANSACTION_NATURES: {
    value: TransactionNature;
    label: string;
    icon: string;
}[] = [
    { value: "fixed", label: "Fixed", icon: "📌" },
    { value: "variable", label: "Variable", icon: "📊" },
    { value: "emergency", label: "Emergency", icon: "🚨" },
];

const INCOME_STATUS: { value: IncomeStatus; label: string }[] = [
    { value: "received", label: "Received" },
    { value: "pending", label: "Pending" },
    { value: "expected", label: "Expected" },
];

const FREQUENCIES: { value: IncomeFrequency; label: string }[] = [
    { value: "weekly", label: "Weekly" },
    { value: "bi-weekly", label: "Bi-Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
    { value: "one-time", label: "One-Time" },
];

export const IncomeModal = ({
    isOpen,
    onClose,
    onSubmit,
    accounts,
    incomeCategories,
    defaultCurrency,
}: IncomeModalProps) => {
    const [formData, setFormData] = useState<IncomeFormData>({
        title: "",
        amount: 0,
        currency: defaultCurrency,
        accountId:
            accounts.find((a) => a.isDefault)?.id || accounts[0]?.id || "",
        categoryId: incomeCategories[0]?.id || "",
        type: "variable",
        status: "received",
        frequency: "one-time",
        actualDate: new Date().toISOString().split("T")[0],
        expectedDate: new Date().toISOString().split("T")[0],
        isRecurring: false,
        tags: [],
        notes: "",
    });

    const [step, setStep] = useState<"amount" | "details">("amount");
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true); // Default to true, will be corrected on mount
    const categoryScrollRef = useRef<HTMLDivElement>(null);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: "",
                amount: 0,
                currency: defaultCurrency,
                accountId:
                    accounts.find((a) => a.isDefault)?.id ||
                    accounts[0]?.id ||
                    "",
                categoryId: incomeCategories[0]?.id || "",
                type: "variable",
                status: "received",
                frequency: "one-time",
                actualDate: new Date().toISOString().split("T")[0],
                expectedDate: new Date().toISOString().split("T")[0],
                isRecurring: false,
                tags: [],
                notes: "",
            });
            setStep("amount");
        }
    }, [isOpen, defaultCurrency, accounts, incomeCategories]);

    const handleCategoryScroll = () => {
        const element = categoryScrollRef.current;
        if (!element) return;

        const { scrollLeft, scrollWidth, clientWidth } = element;
        setCanScrollLeft(scrollLeft > 0);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    };

    const scrollCategories = (direction: "left" | "right") => {
        const element = categoryScrollRef.current;
        if (!element) return;

        const scrollAmount = 200;
        element.scrollBy({
            left: direction === "left" ? -scrollAmount : scrollAmount,
            behavior: "smooth",
        });
    };

    useEffect(() => {
        const element = categoryScrollRef.current;
        if (element) {
            // Initial check with delay to ensure DOM is ready
            const timer = setTimeout(() => {
                handleCategoryScroll();
            }, 100);
            element.addEventListener("scroll", handleCategoryScroll);
            window.addEventListener("resize", handleCategoryScroll);
            return () => {
                clearTimeout(timer);
                element.removeEventListener("scroll", handleCategoryScroll);
                window.removeEventListener("resize", handleCategoryScroll);
            };
        }
    }, [incomeCategories, isOpen]);

    const handleSubmit = () => {
        if (!formData.title || formData.amount <= 0 || !formData.accountId) {
            return;
        }
        onSubmit(formData);
        onClose();
    };

    const selectedAccount = accounts.find((a) => a.id === formData.accountId);
    const selectedType = TRANSACTION_NATURES.find(
        (t) => t.value === formData.type
    );
    const selectedCategory = incomeCategories.find(
        (c) => c.id === formData.categoryId
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            type: "spring",
                            damping: 25,
                            stiffness: 300,
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="fixed inset-x-4 top-[10%] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-[51]">
                        <div className="bg-card/95 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                                        <Plus className="w-5 h-5 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold">
                                            Add Income
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            {step === "amount"
                                                ? "Enter amount"
                                                : "Add details"}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    title="Close"
                                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                                {step === "amount" ? (
                                    <>
                                        {/* Amount Input - Big & Bold */}
                                        <div className="text-center py-6">
                                            <div className="text-4xl font-bold text-emerald-500 mb-2 flex justify-center items-center">
                                                <span className="text-2xl text-muted-foreground">
                                                    {formData.currency}
                                                </span>
                                                <input
                                                    type="number"
                                                    value={
                                                        formData.amount || ""
                                                    }
                                                    onChange={(e) =>
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            amount:
                                                                parseFloat(
                                                                    e.target
                                                                        .value
                                                                ) || 0,
                                                        }))
                                                    }
                                                    placeholder="0.00"
                                                    className="bg-transparent text-center outline-none text-4xl font-bold min-w-[3ch] max-w-full"
                                                    style={{
                                                        width: `${Math.max(
                                                            3,
                                                            String(
                                                                formData.amount ||
                                                                    "0.00"
                                                            ).length + 1
                                                        )}ch`,
                                                    }}
                                                    autoFocus
                                                />
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                How much did you earn?
                                            </p>
                                        </div>

                                        {/* Income Category Selection */}
                                        {incomeCategories.length > 0 && (
                                            <div>
                                                <Label className="text-xs text-muted-foreground mb-2 block">
                                                    Category
                                                </Label>
                                                <div className="relative ">
                                                    {/* Left scroll button */}
                                                    {canScrollLeft && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                scrollCategories(
                                                                    "left"
                                                                )
                                                            }
                                                            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-lg">
                                                            <ChevronLeft className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {/* Right scroll button */}
                                                    {canScrollRight && (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                scrollCategories(
                                                                    "right"
                                                                )
                                                            }
                                                            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 transition-colors shadow-lg">
                                                            <ChevronRight className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {/* Left gradient indicator */}
                                                    {canScrollLeft && (
                                                        <div className="absolute left-10 top-0 bottom-0 w-6 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
                                                    )}
                                                    {/* Right gradient indicator */}
                                                    {canScrollRight && (
                                                        <div className="absolute right-10 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
                                                    )}
                                                    <div
                                                        ref={categoryScrollRef}
                                                        className="grid gap-2 overflow-x-auto pb-2 pt-3 px-1 max-h-[190px]"
                                                        style={{
                                                            gridAutoFlow:
                                                                "column",
                                                            gridTemplateRows:
                                                                "repeat(2, minmax(0, 1fr))",
                                                            gridAutoColumns:
                                                                "90px",
                                                        }}>
                                                        {incomeCategories.map(
                                                            (cat) => (
                                                                <button
                                                                    key={cat.id}
                                                                    onClick={() =>
                                                                        setFormData(
                                                                            (
                                                                                prev
                                                                            ) => ({
                                                                                ...prev,
                                                                                categoryId:
                                                                                    cat.id,
                                                                            })
                                                                        )
                                                                    }
                                                                    className={cn(
                                                                        "flex flex-col items-center gap-1 p-3 rounded-2xl transition-all",
                                                                        formData.categoryId ===
                                                                            cat.id
                                                                            ? "bg-emerald-500/20 ring-2 ring-emerald-500"
                                                                            : "bg-muted/50 hover:bg-muted"
                                                                    )}>
                                                                    <span className="text-xl">
                                                                        {
                                                                            cat.icon
                                                                        }
                                                                    </span>
                                                                    <span className="text-xs truncate w-full text-center">
                                                                        {
                                                                            cat.name
                                                                        }
                                                                    </span>
                                                                </button>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Account Selection */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 block">
                                                To Account
                                            </Label>
                                            <div className="py-5 px-1 flex gap-2 overflow-x-auto">
                                                {accounts
                                                    .filter((a) => a.isActive)
                                                    .map((acc) => (
                                                        <button
                                                            key={acc.id}
                                                            onClick={() =>
                                                                setFormData(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        accountId:
                                                                            acc.id,
                                                                    })
                                                                )
                                                            }
                                                            className={cn(
                                                                "flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all",
                                                                formData.accountId ===
                                                                    acc.id
                                                                    ? "bg-emerald-500/20 ring-2 ring-emerald-500"
                                                                    : "bg-muted/50 hover:bg-muted"
                                                            )}>
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{
                                                                    backgroundColor:
                                                                        acc.color,
                                                                }}
                                                            />
                                                            <span className="text-sm font-medium">
                                                                {acc.name}
                                                            </span>
                                                        </button>
                                                    ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Title */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                                <Tag className="w-3 h-3" />
                                                Title
                                            </Label>
                                            <Input
                                                value={formData.title}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        title: e.target.value,
                                                    }))
                                                }
                                                placeholder="What is this income from?"
                                                className="rounded-xl"
                                            />
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 block">
                                                Status
                                            </Label>
                                            <div className="flex gap-2">
                                                {INCOME_STATUS.map((status) => (
                                                    <button
                                                        key={status.value}
                                                        onClick={() =>
                                                            setFormData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    status: status.value,
                                                                })
                                                            )
                                                        }
                                                        className={cn(
                                                            "flex-1 px-3 py-2 rounded-xl text-sm transition-all",
                                                            formData.status ===
                                                                status.value
                                                                ? "bg-emerald-500 text-white"
                                                                : "bg-muted/50 hover:bg-muted"
                                                        )}>
                                                        {status.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Transaction Type (Fixed/Variable/Emergency) */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 block">
                                                Transaction Type
                                            </Label>
                                            <div className="flex gap-2">
                                                {TRANSACTION_NATURES.map(
                                                    (nature) => (
                                                        <button
                                                            key={nature.value}
                                                            onClick={() =>
                                                                setFormData(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        type: nature.value,
                                                                    })
                                                                )
                                                            }
                                                            className={cn(
                                                                "flex-1 px-3 py-2 rounded-xl text-sm transition-all flex items-center justify-center gap-1",
                                                                formData.type ===
                                                                    nature.value
                                                                    ? "bg-emerald-500 text-white"
                                                                    : "bg-muted/50 hover:bg-muted"
                                                            )}>
                                                            <span>
                                                                {nature.icon}
                                                            </span>
                                                            {nature.label}
                                                        </button>
                                                    )
                                                )}
                                            </div>
                                        </div>

                                        {/* Date */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                                <Calendar className="w-3 h-3" />
                                                {formData.status === "received"
                                                    ? "Date Received"
                                                    : "Expected Date"}
                                            </Label>
                                            <Input
                                                type="date"
                                                value={
                                                    formData.status ===
                                                    "received"
                                                        ? formData.actualDate ||
                                                          ""
                                                        : formData.expectedDate ||
                                                          ""
                                                }
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        [formData.status ===
                                                        "received"
                                                            ? "actualDate"
                                                            : "expectedDate"]:
                                                            e.target.value,
                                                    }))
                                                }
                                                className="rounded-xl"
                                            />
                                        </div>

                                        {/* Recurring Toggle */}
                                        <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <Repeat className="w-4 h-4 text-muted-foreground" />
                                                <span className="text-sm">
                                                    Recurring income
                                                </span>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        isRecurring:
                                                            !prev.isRecurring,
                                                        frequency:
                                                            !prev.isRecurring
                                                                ? "monthly"
                                                                : "one-time",
                                                    }))
                                                }
                                                className={cn(
                                                    "w-12 h-6 rounded-full transition-all",
                                                    formData.isRecurring
                                                        ? "bg-emerald-500"
                                                        : "bg-muted"
                                                )}>
                                                <div
                                                    className={cn(
                                                        "w-5 h-5 rounded-full bg-white shadow-md transition-transform",
                                                        formData.isRecurring
                                                            ? "translate-x-6"
                                                            : "translate-x-0.5"
                                                    )}
                                                />
                                            </button>
                                        </div>

                                        {/* Frequency (if recurring) */}
                                        {formData.isRecurring && (
                                            <div>
                                                <Label className="text-xs text-muted-foreground mb-2 block">
                                                    Repeat Every
                                                </Label>
                                                <div className="flex flex-wrap gap-2">
                                                    {FREQUENCIES.map((freq) => (
                                                        <button
                                                            key={freq.value}
                                                            onClick={() =>
                                                                setFormData(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        frequency:
                                                                            freq.value,
                                                                    })
                                                                )
                                                            }
                                                            className={cn(
                                                                "px-3 py-1.5 rounded-lg text-sm transition-all",
                                                                formData.frequency ===
                                                                    freq.value
                                                                    ? "bg-emerald-500 text-white"
                                                                    : "bg-muted/50 hover:bg-muted"
                                                            )}>
                                                            {freq.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    A new income will be created
                                                    automatically on schedule
                                                </p>
                                            </div>
                                        )}

                                        {/* Notes */}
                                        <div>
                                            <Label className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                                <FileText className="w-3 h-3" />
                                                Notes (optional)
                                            </Label>
                                            <TextArea
                                                value={formData.notes || ""}
                                                onChange={(e) =>
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        notes: e.target.value,
                                                    }))
                                                }
                                                placeholder="Add any notes..."
                                                className="rounded-xl min-h-[80px]"
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-border/50 flex gap-3">
                                {step === "amount" ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={onClose}
                                            className="flex-1 rounded-xl">
                                            Cancel
                                        </Button>
                                        <Button
                                            onClick={() => setStep("details")}
                                            disabled={
                                                formData.amount <= 0 ||
                                                !formData.accountId
                                            }
                                            className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600">
                                            Continue
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Button
                                            variant="outline"
                                            onClick={() => setStep("amount")}
                                            className="flex-1 rounded-xl">
                                            Back
                                        </Button>
                                        <Button
                                            onClick={handleSubmit}
                                            disabled={!formData.title}
                                            className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600">
                                            Add Income
                                        </Button>
                                    </>
                                )}
                            </div>

                            {/* Summary Bar */}
                            {formData.amount > 0 && (
                                <div className="px-4 pb-4">
                                    <div className="flex items-center justify-between p-3 bg-emerald-500/10 rounded-xl text-sm">
                                        <div className="flex items-center gap-2">
                                            {selectedCategory && (
                                                <span>
                                                    {selectedCategory.icon}
                                                </span>
                                            )}
                                            <span className="text-muted-foreground">
                                                {selectedCategory?.name ||
                                                    "Income"}
                                            </span>
                                            {selectedType && (
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20">
                                                    {selectedType.label}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {selectedAccount && (
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            selectedAccount.color,
                                                    }}
                                                />
                                            )}
                                            <span className="font-semibold text-emerald-500">
                                                +{formData.currency}{" "}
                                                {formData.amount.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
